import { Pos } from "../line/pos"
import { cursorCoords, displayHeight, displayWidth, estimateCoords, paddingTop, paddingVert, scrollGap, textHeight } from "../measurement/position_measurement"
import { phantom } from "../util/browser"
import { elt } from "../util/dom"
import { signalDOMEvent } from "../util/event"

import { setScrollLeft, setScrollTop } from "./scroll_events"

// SCROLLING THINGS INTO VIEW

// If an editor sits on the top or bottom of the window, partially
// scrolled out of view, this ensures that the cursor is visible.
export function maybeScrollWindow(cm, coords) {
  if (signalDOMEvent(cm, "scrollCursorIntoView")) return

  let display = cm.display, box = display.sizer.getBoundingClientRect(), doScroll = null
  if (coords.top + box.top < 0) doScroll = true
  else if (coords.bottom + box.top > (window.innerHeight || document.documentElement.clientHeight)) doScroll = false
  if (doScroll != null && !phantom) {
    let scrollNode = elt("div", "\u200b", null, `position: absolute;
                         top: ${coords.top - display.viewOffset - paddingTop(cm.display)}px;
                         height: ${coords.bottom - coords.top + scrollGap(cm) + display.barHeight}px;
                         left: ${coords.left}px; width: 2px;`)
    cm.display.lineSpace.appendChild(scrollNode)
    scrollNode.scrollIntoView(doScroll)
    cm.display.lineSpace.removeChild(scrollNode)
  }
}

// Scroll a given position into view (immediately), verifying that
// it actually became visible (as line heights are accurately
// measured, the position of something may 'drift' during drawing).
export function scrollPosIntoView(cm, pos, end, margin) {
  if (margin == null) margin = 0
  let coords
  for (let limit = 0; limit < 5; limit++) {
    let changed = false
    coords = cursorCoords(cm, pos)
    let endCoords = !end || end == pos ? coords : cursorCoords(cm, end)
    let scrollPos = calculateScrollPos(cm, Math.min(coords.left, endCoords.left),
                                       Math.min(coords.top, endCoords.top) - margin,
                                       Math.max(coords.left, endCoords.left),
                                       Math.max(coords.bottom, endCoords.bottom) + margin)
    let startTop = cm.doc.scrollTop, startLeft = cm.doc.scrollLeft
    if (scrollPos.scrollTop != null) {
      setScrollTop(cm, scrollPos.scrollTop)
      if (Math.abs(cm.doc.scrollTop - startTop) > 1) changed = true
    }
    if (scrollPos.scrollLeft != null) {
      setScrollLeft(cm, scrollPos.scrollLeft)
      if (Math.abs(cm.doc.scrollLeft - startLeft) > 1) changed = true
    }
    if (!changed) break
  }
  return coords
}

// Scroll a given set of coordinates into view (immediately).
export function scrollIntoView(cm, x1, y1, x2, y2) {
  let scrollPos = calculateScrollPos(cm, x1, y1, x2, y2)
  if (scrollPos.scrollTop != null) setScrollTop(cm, scrollPos.scrollTop)
  if (scrollPos.scrollLeft != null) setScrollLeft(cm, scrollPos.scrollLeft)
}

// Calculate a new scroll position needed to scroll the given
// rectangle into view. Returns an object with scrollTop and
// scrollLeft properties. When these are undefined, the
// vertical/horizontal position does not need to be adjusted.
export function calculateScrollPos(cm, x1, y1, x2, y2) {
  let display = cm.display, snapMargin = textHeight(cm.display)
  if (y1 < 0) y1 = 0
  let screentop = cm.curOp && cm.curOp.scrollTop != null ? cm.curOp.scrollTop : display.scroller.scrollTop
  let screen = displayHeight(cm), result = {}
  if (y2 - y1 > screen) y2 = y1 + screen
  let docBottom = cm.doc.height + paddingVert(display)
  let atTop = y1 < snapMargin, atBottom = y2 > docBottom - snapMargin
  if (y1 < screentop) {
    result.scrollTop = atTop ? 0 : y1
  } else if (y2 > screentop + screen) {
    let newTop = Math.min(y1, (atBottom ? docBottom : y2) - screen)
    if (newTop != screentop) result.scrollTop = newTop
  }

  let screenleft = cm.curOp && cm.curOp.scrollLeft != null ? cm.curOp.scrollLeft : display.scroller.scrollLeft
  let screenw = displayWidth(cm) - (cm.options.fixedGutter ? display.gutters.offsetWidth : 0)
  let tooWide = x2 - x1 > screenw
  if (tooWide) x2 = x1 + screenw
  if (x1 < 10)
    result.scrollLeft = 0
  else if (x1 < screenleft)
    result.scrollLeft = Math.max(0, x1 - (tooWide ? 0 : 10))
  else if (x2 > screenw + screenleft - 3)
    result.scrollLeft = x2 + (tooWide ? 0 : 10) - screenw
  return result
}

// Store a relative adjustment to the scroll position in the current
// operation (to be applied when the operation finishes).
export function addToScrollPos(cm, left, top) {
  if (left != null || top != null) resolveScrollToPos(cm)
  if (left != null)
    cm.curOp.scrollLeft = (cm.curOp.scrollLeft == null ? cm.doc.scrollLeft : cm.curOp.scrollLeft) + left
  if (top != null)
    cm.curOp.scrollTop = (cm.curOp.scrollTop == null ? cm.doc.scrollTop : cm.curOp.scrollTop) + top
}

// Make sure that at the end of the operation the current cursor is
// shown.
export function ensureCursorVisible(cm) {
  resolveScrollToPos(cm)
  let cur = cm.getCursor(), from = cur, to = cur
  if (!cm.options.lineWrapping) {
    from = cur.ch ? Pos(cur.line, cur.ch - 1) : cur
    to = Pos(cur.line, cur.ch + 1)
  }
  cm.curOp.scrollToPos = {from: from, to: to, margin: cm.options.cursorScrollMargin, isCursor: true}
}

// When an operation has its scrollToPos property set, and another
// scroll action is applied before the end of the operation, this
// 'simulates' scrolling that position into view in a cheap way, so
// that the effect of intermediate scroll commands is not ignored.
export function resolveScrollToPos(cm) {
  let range = cm.curOp.scrollToPos
  if (range) {
    cm.curOp.scrollToPos = null
    let from = estimateCoords(cm, range.from), to = estimateCoords(cm, range.to)
    let sPos = calculateScrollPos(cm, Math.min(from.left, to.left),
                                  Math.min(from.top, to.top) - range.margin,
                                  Math.max(from.right, to.right),
                                  Math.max(from.bottom, to.bottom) + range.margin)
    cm.scrollTo(sPos.scrollLeft, sPos.scrollTop)
  }
}
