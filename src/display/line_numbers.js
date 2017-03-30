import { lineNumberFor } from "../line/utils_line"
import { compensateForHScroll } from "../measurement/position_measurement"
import { elt } from "../util/dom"

import { updateGutterSpace } from "./update_display"

// Re-align line numbers and gutter marks to compensate for
// horizontal scrolling.
export function alignHorizontally(cm) {
  let display = cm.display, view = display.view
  if (!display.alignWidgets && (!display.gutters.firstChild || !cm.options.fixedGutter)) return
  let isLtr = cm.doc.direction == "ltr"
  let scroll = display.scroller.scrollLeft - cm.doc.scrollLeft
  let comp = compensateForHScroll(display, isLtr) + (isLtr ? -scroll : scroll)
  let offset = comp + "px"
  let side = isLtr ? "left" : "right"
  let otherSide = isLtr ? "right" : "left"
  for (let i = 0; i < view.length; i++) if (!view[i].hidden) {
    if (cm.options.fixedGutter) {
      if (view[i].gutter) {
        view[i].gutter.style[side] = offset
        view[i].gutter.style[otherSide] = null
      }
      if (view[i].gutterBackground) {
        view[i].gutterBackground.style[side] = offset
        view[i].gutterBackground.style[otherSide] = null
      }
    }
    let align = view[i].alignable
    if (align) for (let j = 0; j < align.length; j++) {
      align[j].style[side] = offset
      align[j].style[otherSide] = null
    }
  }
  setGutterOffset(cm)
}

function setGutterOffset(cm, fixed = cm.options.fixedGutter, alsoIfNotFixed = false) {
  let isLtr = cm.doc.direction == "ltr"
  let side = isLtr ? "left" : "right"
  let display = cm.display
  if (!fixed) {
    if (alsoIfNotFixed) {
      display.gutters.style[side] = "0"
      display.gutters.style[isLtr ? "right" : "left"] = null
    }
    return
  }
  let scroll = display.scroller.scrollLeft - cm.doc.scrollLeft
  let comp = compensateForHScroll(display, isLtr) + (isLtr ? -scroll : scroll)
  let gutterW = display.gutters.offsetWidth
  display.gutters.style[side] = (comp + gutterW) + "px"
  display.gutters.style[isLtr ? "right" : "left"] = null
}

export function updateFixedGutter(cm, val) {
  setGutterOffset(cm, val, true)
}

// Used to ensure that the line number gutter is still the right
// size for the current document size. Returns true when an update
// is needed.
export function maybeUpdateLineNumberWidth(cm) {
  if (!cm.options.lineNumbers) return false
  let doc = cm.doc, last = lineNumberFor(cm.options, doc.first + doc.size - 1), display = cm.display
  if (last.length != display.lineNumChars) {
    let test = display.measure.appendChild(elt("div", [elt("div", last)],
                                               "CodeMirror-linenumber CodeMirror-gutter-elt"))
    let innerW = test.firstChild.offsetWidth, padding = test.offsetWidth - innerW
    display.lineGutter.style.width = ""
    display.lineNumInnerWidth = Math.max(innerW, display.lineGutter.offsetWidth - padding) + 1
    display.lineNumWidth = display.lineNumInnerWidth + padding
    display.lineNumChars = display.lineNumInnerWidth ? last.length : -1
    display.lineGutter.style.width = display.lineNumWidth + "px"
    updateGutterSpace(cm)
    return true
  }
  return false
}
