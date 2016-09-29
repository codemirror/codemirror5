import { getStateBefore, highlightLine, processLine } from "../line/highlight"
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
  let state = copyState(doc.mode, getStateBefore(cm, doc.frontier))
  let changedLines = []

  doc.iter(doc.frontier, Math.min(doc.first + doc.size, cm.display.viewTo + 500), line => {
    if (doc.frontier >= cm.display.viewFrom) { // Visible
      let oldStyles = line.styles, tooLong = line.text.length > cm.options.maxHighlightLength
      let highlighted = highlightLine(cm, line, tooLong ? copyState(doc.mode, state) : state, true)
      line.styles = highlighted.styles
      let oldCls = line.styleClasses, newCls = highlighted.classes
      if (newCls) line.styleClasses = newCls
      else if (oldCls) line.styleClasses = null
      let ischange = !oldStyles || oldStyles.length != line.styles.length ||
        oldCls != newCls && (!oldCls || !newCls || oldCls.bgClass != newCls.bgClass || oldCls.textClass != newCls.textClass)
      for (let i = 0; !ischange && i < oldStyles.length; ++i) ischange = oldStyles[i] != line.styles[i]
      if (ischange) changedLines.push(doc.frontier)
      line.stateAfter = tooLong ? state : copyState(doc.mode, state)
    } else {
      if (line.text.length <= cm.options.maxHighlightLength)
        processLine(cm, line.text, state)
      line.stateAfter = doc.frontier % 5 == 0 ? copyState(doc.mode, state) : null
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
