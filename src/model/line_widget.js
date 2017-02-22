import { runInOp } from "../display/operations"
import { addToScrollPos } from "../display/scrolling"
import { regLineChange } from "../display/view_tracking"
import { heightAtLine, lineIsHidden } from "../line/spans"
import { lineNo, updateLineHeight } from "../line/utils_line"
import { widgetHeight } from "../measurement/widgets"
import { changeLine } from "./changes"
import { eventMixin } from "../util/event"
import { signalLater } from "../util/operation_group"

// Line widgets are block elements displayed above or below a line.

export class LineWidget {
  constructor(doc, node, options) {
    if (options) for (let opt in options) if (options.hasOwnProperty(opt))
      this[opt] = options[opt]
    this.doc = doc
    this.node = node
  }

  clear() {
    let cm = this.doc.cm, ws = this.line.widgets, line = this.line, no = lineNo(line)
    if (no == null || !ws) return
    for (let i = 0; i < ws.length; ++i) if (ws[i] == this) ws.splice(i--, 1)
    if (!ws.length) line.widgets = null
    let height = widgetHeight(this)
    updateLineHeight(line, Math.max(0, line.height - height))
    if (cm) {
      runInOp(cm, () => {
        adjustScrollWhenAboveVisible(cm, line, -height)
        regLineChange(cm, no, "widget")
      })
      signalLater(cm, "lineWidgetCleared", cm, this, no)
    }
  }

  changed() {
    let oldH = this.height, cm = this.doc.cm, line = this.line
    this.height = null
    let diff = widgetHeight(this) - oldH
    if (!diff) return
    updateLineHeight(line, line.height + diff)
    if (cm) {
      runInOp(cm, () => {
        cm.curOp.forceUpdate = true
        adjustScrollWhenAboveVisible(cm, line, diff)
        signalLater(cm, "lineWidgetChanged", cm, this, lineNo(line))
      })
    }
  }
}
eventMixin(LineWidget)

function adjustScrollWhenAboveVisible(cm, line, diff) {
  if (heightAtLine(line) < ((cm.curOp && cm.curOp.scrollTop) || cm.doc.scrollTop))
    addToScrollPos(cm, null, diff)
}

export function addLineWidget(doc, handle, node, options) {
  let widget = new LineWidget(doc, node, options)
  let cm = doc.cm
  if (cm && widget.noHScroll) cm.display.alignWidgets = true
  changeLine(doc, handle, "widget", line => {
    let widgets = line.widgets || (line.widgets = [])
    if (widget.insertAt == null) widgets.push(widget)
    else widgets.splice(Math.min(widgets.length - 1, Math.max(0, widget.insertAt)), 0, widget)
    widget.line = line
    if (cm && !lineIsHidden(doc, line)) {
      let aboveVisible = heightAtLine(line) < doc.scrollTop
      updateLineHeight(line, line.height + widgetHeight(widget))
      if (aboveVisible) addToScrollPos(cm, null, widget.height)
      cm.curOp.forceUpdate = true
    }
    return true
  })
  signalLater(cm, "lineWidgetAdded", cm, widget, typeof handle == "number" ? handle : lineNo(handle))
  return widget
}
