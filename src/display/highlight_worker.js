import { getContextBefore, highlightLine, processLine } from "../line/highlight"
import { copyState } from "../modes"
import { bind } from "../util/misc"

import { runInOp } from "./operations"
import { regLineChange } from "./view_tracking"

// HIGHLIGHT WORKER

export function startWorker(cm, time) {
  if (cm.doc.mode.startState && cm.doc.frontier < cm.display.viewTo)
    cm.state.highlight.set(time, bind(highlightWorker, cm))
}

function highlightWorker(cm) {
  let doc = cm.doc
  if (doc.frontier < doc.first) doc.frontier = doc.first
  if (doc.frontier >= cm.display.viewTo) return
  let end = +new Date + cm.options.workTime
  let context = getContextBefore(cm, doc.frontier)
  let changedLines = []

  doc.iter(doc.frontier, Math.min(doc.first + doc.size, cm.display.viewTo + 500), line => {
    if (doc.frontier >= cm.display.viewFrom) { // Visible
      let oldStyles = line.styles
      let resetState = line.text.length > cm.options.maxHighlightLength ? copyState(doc.mode, context.state) : null
      let highlighted = highlightLine(cm, line, context, true)
      if (resetState) context.state = resetState
      line.styles = highlighted.styles
      let oldCls = line.styleClasses, newCls = highlighted.classes
      if (newCls) line.styleClasses = newCls
      else if (oldCls) line.styleClasses = null
      let ischange = !oldStyles || oldStyles.length != line.styles.length ||
        oldCls != newCls && (!oldCls || !newCls || oldCls.bgClass != newCls.bgClass || oldCls.textClass != newCls.textClass)
      for (let i = 0; !ischange && i < oldStyles.length; ++i) ischange = oldStyles[i] != line.styles[i]
      if (ischange) changedLines.push(doc.frontier)
      line.stateAfter = context.save()
    } else {
      if (line.text.length <= cm.options.maxHighlightLength)
        processLine(cm, line.text, context)
      line.stateAfter = doc.frontier % 5 == 0 ? context.save() : null
    }
    ++doc.frontier
    if (+new Date > end) {
      startWorker(cm, cm.options.workDelay)
      return true
    }
  })
  if (changedLines.length) runInOp(cm, () => {
    for (let i = 0; i < changedLines.length; i++)
      regLineChange(cm, changedLines[i], "text")
  })
}
