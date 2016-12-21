import { Pos } from "../line/pos"
import { prepareMeasureCharTop } from "../measurement/position_measurement"
import { bidiLeft, bidiRight, getBidiPartAt, getOrder, lineLeft, lineRight, moveLogically } from "../util/bidi"
import { findFirst } from "../util/misc"

export function endOfLine(visually, cm, lineObj, lineNo, dir) {
  let ch
  if (visually) {
    let order = getOrder(lineObj)
    if (order) {
      let i = dir < 0 ? order.length - 1 : 0
      let part = order[i]
      let sticky = (dir < 0) != (part.level == 1) ? "before" : "after"
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
        if (part.level != 1) ch = moveLogically(lineObj, new Pos(lineNo, ch, sticky), 1, true)
        return new Pos(lineNo, ch, sticky)
      }
      ch = (dir < 0 ? bidiRight : bidiLeft)(part)
      return new Pos(lineNo, ch, sticky)
    }
  }
  let sticky = dir < 0 ? "before" : "after"
  if (visually) ch = (dir < 0 ? lineRight : lineLeft)(lineObj)
  else ch = dir < 0 ? lineObj.text.length : 0
  return new Pos(lineNo, ch, sticky)
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

export function moveVisually(cm, line, start, dir) {
  let mkPos = (ch, sticky) => ch == null ? null : new Pos(start.line, ch, sticky)
  let mv = (pos, dir) => moveLogically(line, pos instanceof Pos ? pos : new Pos(start.line, pos), dir)
  let bidi = getOrder(line)
  if (!bidi) return mkPos(mv(start, dir), dir < 0 ? "after" : "before")
  if (start.ch >= line.text.length) {
    start.ch = line.text.length
    start.sticky = "before"
  } else if (start.ch <= 0) {
    start.ch = 0
    start.sticky = "after"
  }
  let partPos = getBidiPartAt(bidi, start.ch, start.sticky), part = bidi[partPos]
  if (part.level % 2 == 0 && (dir > 0 ? part.to > start.ch : part.from < start.ch)) {
    // Case 1: We move within an ltr part. Even with wrapped lines,
    // nothing interesting happens.
    return mkPos(mv(start, dir), dir < 0 ? "after" : "before")
  }

  let getVisualLine = ch => getVisualLineAround(cm, line, ch)
  let visualLine = getVisualLine(start.sticky == "before" ? mv(start, -1) : start.ch)

  if (part.level % 2 == 1) {
    let ch = mv(start, -dir)
    if (ch != null && (dir > 0 ? ch >= part.from && ch >= visualLine[0] : ch <= part.to && ch <= mv(visualLine[1], 1))) {
      // Case 2: We move within an rtl part on the same visual line
      let sticky = dir < 0 ? "before" : "after"
      return new Pos(start.line, ch, sticky)
    }
  }

  // Case 3: Could not move within this bidi part in this visual line, so leave
  // the current bidi part

  let searchInVisualLine = (partPos, dir, visualLine) => {
    let getRes = (ch, moveInStorageOrder) => moveInStorageOrder
      ? new Pos(start.line, mv(ch, 1), "before")
      : new Pos(start.line, ch, "after")

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
  return null
}
