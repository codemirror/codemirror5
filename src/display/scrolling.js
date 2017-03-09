import { Pos } from "../line/pos"
import { cursorCoords, displayHeight, displayWidth, estimateCoords, paddingTop, paddingVert, scrollGap, textHeight } from "../measurement/position_measurement"
import { phantom } from "../util/browser"
import { elt } from "../util/dom"
import { signalDOMEvent } from "../util/event"

import { setScrollLeft, setScrollTop } from "./scroll_events"

// SCROLLING THINGS INTO VIEW

// If an editor sits on the top or bottom of the window, partially
// scrolled out of view, this ensures that the cursor is visible.
export function maybeScrollWindow(cm, rect) {
  if (signalDOMEvent(cm, "scrollCursorIntoView")) return

  let display = cm.display, box = display.sizer.getBoundingClientRect(), doScroll = null
  if (rect.top + box.top < 0) doScroll = true
  else if (rect.bottom + box.top > (window.innerHeight || document.documentElement.clientHeight)) doScroll = false
  if (doScroll != null && !phantom) {
    let scrollNode = elt("div", "\u200b", null, `position: absolute;
                         top: ${rect.top - display.viewOffset - paddingTop(cm.display)}px;
                         height: ${rect.bottom - rect.top + scrollGap(cm) + display.barHeight}px;
                         left: ${rect.left}px; width: ${Math.max(2, rect.right - rect.left)}px;`)
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
  let rect
  for (let limit = 0; limit < 5; limit++) {
    let changed = false
    let coords = cursorCoords(cm, pos)
    let endCoords = !end || end == pos ? coords : cursorCoords(cm, end)
    rect = {left: Math.min(coords.left, endCoords.left),
            top: Math.min(coords.top, endCoords.top) - margin,
            right: Math.max(coords.left, endCoords.left),
            bottom: Math.max(coords.bottom, endCoords.bottom) + margin}
    let scrollPos = calculateScrollPos(cm, rect)
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
  return rect
}

// Scroll a given set of coordinates into view (immediately).
export function scrollIntoView(cm, rect) {
  let scrollPos = calculateScrollPos(cm, rect)
  if (scrollPos.scrollTop != null) setScrollTop(cm, scrollPos.scrollTop)
  if (scrollPos.scrollLeft != null) setScrollLeft(cm, scrollPos.scrollLeft)
}

// Calculate a new scroll position needed to scroll the given
// rectangle into view. Returns an object with scrollTop and
// scrollLeft properties. When these are undefined, the
// vertical/horizontal position does not need to be adjusted.
export function calculateScrollPos(cm, rect) {
  let display = cm.display, snapMargin = textHeight(cm.display)
  if (rect.top < 0) rect.top = 0
  let screentop = cm.curOp && cm.curOp.scrollTop != null ? cm.curOp.scrollTop : display.scroller.scrollTop
  let screen = displayHeight(cm), result = {}
  if (rect.bottom - rect.top > screen) rect.bottom = rect.top + screen
  let docBottom = cm.doc.height + paddingVert(display)
  let atTop = rect.top < snapMargin, atBottom = rect.bottom > docBottom - snapMargin
  if (rect.top < screentop) {
    result.scrollTop = atTop ? 0 : rect.top
  } else if (rect.bottom > screentop + screen) {
    let newTop = Math.min(rect.top, (atBottom ? docBottom : rect.bottom) - screen)
    if (newTop != screentop) result.scrollTop = newTop
  }

  let screenleft = cm.curOp && cm.curOp.scrollLeft != null ? cm.curOp.scrollLeft : display.scroller.scrollLeft
  let screenw = displayWidth(cm) - (cm.options.fixedGutter ? display.gutters.offsetWidth : 0)
  let tooWide = rect.right - rect.left > screenw
  if (tooWide) rect.right = rect.left + screenw
  if (rect.left < 10)
    result.scrollLeft = 0
  else if (rect.left < screenleft)
    result.scrollLeft = Math.max(0, rect.left - (tooWide ? 0 : 10))
  else if (rect.right > screenw + screenleft - 3)
    result.scrollLeft = rect.right + (tooWide ? 0 : 10) - screenw
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
  cm.curOp.scrollToPos = {from: from, to: to, margin: cm.options.cursorScrollMargin}
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
    let sPos = calculateScrollPos(cm, {
      left: Math.min(from.left, to.left),
      top: Math.min(from.top, to.top) - range.margin,
      right: Math.max(from.right, to.right),
      bottom: Math.max(from.bottom, to.bottom) + range.margin
    })
    cm.scrollTo(sPos.scrollLeft, sPos.scrollTop)
  }
}
