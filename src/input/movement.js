import { prepareMeasureCharTop } from "../measurement/position_measurement"
import { bidiLeft, bidiRight, getBidiPartAt, getOrder, lineLeft, lineRight, moveLogically } from "../util/bidi"
import { findFirst } from "../util/misc"

export function endOfLine(visually, cm, lineObj, dir) {
  let ch, sticky = "before"
  if (visually) {
    let order = getOrder(lineObj)
    if (order) {
      let i = dir < 0 ? order.length - 1 : 0
      while (order[i].to == order[i].from) i += dir
      let part = order[i]
      // With a wrapped rtl chunk (possibly spanning multiple bidi parts),
      // it could be that the last bidi part is not on the last visual line,
      // since visual lines contain content order-consecutive chunks.
      // Thus, in rtl, we are looking for the first (content-order) character
      // in the rtl chunk that is on the last line (that is, the same line
      // as the last (content-order) character).
      if (dir < 0 && part.level > 0) {
        let getTop = prepareMeasureCharTop(cm, lineObj)
        ch = lineObj.text.length - 1
        let targetTop = getTop(ch)
        ch = findFirst(ch => getTop(ch) == targetTop, part.from, ch)
        if (part.level == 1) sticky = "after"
        else ch = moveLogically(lineObj, ch, 1, true)
        return {ch, sticky}
      }
      ch = (dir < 0 ? bidiRight : bidiLeft)(part)
      return {ch, sticky}
    }
  }
  if (visually) ch = (dir < 0 ? lineRight : lineLeft)(lineObj)
  else ch = dir < 0 ? lineObj.text.length : 0
  return {ch, sticky}
}

function getVisualLineAround(cm, line, target) {
  if (!cm.options.lineWrapping) return [0, line.text.length - 1]
  let measureTop = prepareMeasureCharTop(cm, line)
  let targetTop = measureTop(target)
  return [
    findFirst(ch => targetTop == measureTop(ch), 0, target),
    findFirst(ch => targetTop == measureTop(ch), line.text.length - 1, target)
  ]
}

export function moveVisually(cm, line, start, dir, byUnit, startSticky) {
  let mv = (ch, dir) => moveLogically(line, ch, dir, byUnit)
  let bidi = getOrder(line)
  if (!bidi) return {ch: mv(start, dir), sticky: dir < 0 ? "after" : "before"}
  if (start >= line.text.length) {
    start = line.text.length
    startSticky = "before"
  } else if (start <= 0) {
    start = 0
    startSticky = "after"
  }
  let partPos = getBidiPartAt(bidi, start, startSticky), part = bidi[partPos]
  if (part.level % 2 == 0 && (dir > 0 ? part.to > start : part.from < start)) {
    // Case 1: We move within an ltr part. Even with wrapped lines,
    // nothing interesting happens.
    return {ch: mv(start, dir), sticky: dir < 0 ? "after" : "before"}
  }

  let getVisualLine = ch => getVisualLineAround(cm, line, ch)
  let visualLine = getVisualLine(startSticky == "before" ? mv(start, -1) : start)

  if (part.level % 2 == 1) {
    let ch = mv(start, -dir)
    if (ch != null && (dir > 0 ? ch >= part.from && ch >= visualLine[0] : ch <= part.to && ch <= mv(visualLine[1], 1))) {
      // Case 2: We move within an rtl part on the same visual line
      let sticky = dir < 0 ? "before" : "after"
      return {ch, sticky}
    }
  }

  // Case 3: Could not move within this bidi part in this visual line, so leave
  // the current bidi part

  let searchInVisualLine = (partPos, dir, visualLine) => {
    let getRes = (ch, moveInStorageOrder) => moveInStorageOrder
      ? {ch: mv(ch, 1), sticky: "before"}
      : {ch, sticky: "after"}

    for (partPos += dir; partPos >= 0 && partPos < bidi.length; partPos += dir) {
      let part = bidi[partPos]
      let moveInStorageOrder = (dir > 0) == (part.level != 1)
      let ch = moveInStorageOrder ? visualLine[0] : visualLine[1]
      if (part.from <= ch && ch < part.to) return getRes(ch, moveInStorageOrder)
      ch = moveInStorageOrder ? part.from : mv(part.to, -1)
      if (visualLine[0] <= ch && ch <= visualLine[1]) return getRes(ch, moveInStorageOrder)
    }
  }

  // Case 3a: Look for other bidi parts on the same visual line
  let res = searchInVisualLine(partPos, dir, visualLine)
  if (res) return res

  // Case 3b: Look for other bidi parts on the next visual line
  let nextCh = mv(visualLine[dir > 0 ? 1 : 0], dir)
  if (nextCh != null && !(dir > 0 && nextCh == line.text.length)) {
    res = searchInVisualLine(dir > 0 ? 0 : bidi.length, dir, getVisualLine(nextCh))
    if (res) return res
  }

  // Case 4: Nowhere to move
  return {ch: null, sticky: null}
}
