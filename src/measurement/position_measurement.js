import { moveVisually } from "../input/movement"
import { buildLineContent, LineView } from "../line/line_data"
import { clipPos, Pos } from "../line/pos"
import { collapsedSpanAtEnd, heightAtLine, lineIsHidden, visualLine } from "../line/spans"
import { getLine, lineAtHeight, lineNo, updateLineHeight } from "../line/utils_line"
import { bidiOther, getBidiPartAt, getOrder } from "../util/bidi"
import { chrome, android, ie, ie_version } from "../util/browser"
import { elt, removeChildren, range, removeChildrenAndAdd } from "../util/dom"
import { e_target } from "../util/event"
import { hasBadZoomedRects } from "../util/feature_detection"
import { countColumn, findFirst, isExtendingChar, scrollerGap, skipExtendingChars } from "../util/misc"
import { updateLineForChanges } from "../display/update_line"

import { widgetHeight } from "./widgets"

// POSITION MEASUREMENT

export function paddingTop(display) {return display.lineSpace.offsetTop}
export function paddingVert(display) {return display.mover.offsetHeight - display.lineSpace.offsetHeight}
export function paddingH(display) {
  if (display.cachedPaddingH) return display.cachedPaddingH
  let e = removeChildrenAndAdd(display.measure, elt("pre", "x"))
  let style = window.getComputedStyle ? window.getComputedStyle(e) : e.currentStyle
  let data = {left: parseInt(style.paddingLeft), right: parseInt(style.paddingRight)}
  if (!isNaN(data.left) && !isNaN(data.right)) display.cachedPaddingH = data
  return data
}

export function scrollGap(cm) { return scrollerGap - cm.display.nativeBarWidth }
export function displayWidth(cm) {
  return cm.display.scroller.clientWidth - scrollGap(cm) - cm.display.barWidth
}
export function displayHeight(cm) {
  return cm.display.scroller.clientHeight - scrollGap(cm) - cm.display.barHeight
}

// Ensure the lineView.wrapping.heights array is populated. This is
// an array of bottom offsets for the lines that make up a drawn
// line. When lineWrapping is on, there might be more than one
// height.
function ensureLineHeights(cm, lineView, rect) {
  let wrapping = cm.options.lineWrapping
  let curWidth = wrapping && displayWidth(cm)
  if (!lineView.measure.heights || wrapping && lineView.measure.width != curWidth) {
    let heights = lineView.measure.heights = []
    if (wrapping) {
      lineView.measure.width = curWidth
      let rects = lineView.text.firstChild.getClientRects()
      for (let i = 0; i < rects.length - 1; i++) {
        let cur = rects[i], next = rects[i + 1]
        if (Math.abs(cur.bottom - next.bottom) > 2)
          heights.push((cur.bottom + next.top) / 2 - rect.top)
      }
    }
    heights.push(rect.bottom - rect.top)
  }
}

// Find a line map (mapping character offsets to text nodes) and a
// measurement cache for the given line number. (A line view might
// contain multiple lines when collapsed ranges are present.)
export function mapFromLineView(lineView, line, lineN) {
  if (lineView.line == line)
    return {map: lineView.measure.map, cache: lineView.measure.cache}
  for (let i = 0; i < lineView.rest.length; i++)
    if (lineView.rest[i] == line)
      return {map: lineView.measure.maps[i], cache: lineView.measure.caches[i]}
  for (let i = 0; i < lineView.rest.length; i++)
    if (lineNo(lineView.rest[i]) > lineN)
      return {map: lineView.measure.maps[i], cache: lineView.measure.caches[i], before: true}
}

// Render a line into the hidden node display.externalMeasured. Used
// when measurement is needed for a line that's not in the viewport.
function updateExternalMeasurement(cm, line) {
  line = visualLine(line)
  let lineN = lineNo(line)
  let view = cm.display.externalMeasured = new LineView(cm.doc, line, lineN)
  view.lineN = lineN
  let built = view.built = buildLineContent(cm, view)
  view.text = built.pre
  removeChildrenAndAdd(cm.display.lineMeasure, built.pre)
  return view
}

// Get a {top, bottom, left, right} box (in line-local coordinates)
// for a given character.
export function measureChar(cm, line, ch, bias) {
  return measureCharPrepared(cm, prepareMeasureForLine(cm, line), ch, bias)
}

// Find a line view that corresponds to the given line number.
export function findViewForLine(cm, lineN) {
  if (lineN >= cm.display.viewFrom && lineN < cm.display.viewTo)
    return cm.display.view[findViewIndex(cm, lineN)]
  let ext = cm.display.externalMeasured
  if (ext && lineN >= ext.lineN && lineN < ext.lineN + ext.size)
    return ext
}

// Measurement can be split in two steps, the set-up work that
// applies to the whole line, and the measurement of the actual
// character. Functions like coordsChar, that need to do a lot of
// measurements in a row, can thus ensure that the set-up work is
// only done once.
export function prepareMeasureForLine(cm, line) {
  let lineN = lineNo(line)
  let view = findViewForLine(cm, lineN)
  if (view && !view.text) {
    view = null
  } else if (view && view.changes) {
    updateLineForChanges(cm, view, lineN, getDimensions(cm))
    cm.curOp.forceUpdate = true
  }
  if (!view)
    view = updateExternalMeasurement(cm, line)

  let info = mapFromLineView(view, line, lineN)
  return {
    line: line, view: view, rect: null,
    map: info.map, cache: info.cache, before: info.before,
    hasHeights: false
  }
}

// Given a prepared measurement object, measures the position of an
// actual character (or fetches it from the cache).
export function measureCharPrepared(cm, prepared, ch, bias, varHeight) {
  if (prepared.before) ch = -1
  let key = ch + (bias || ""), found
  if (prepared.cache.hasOwnProperty(key)) {
    found = prepared.cache[key]
  } else {
    if (!prepared.rect)
      prepared.rect = prepared.view.text.getBoundingClientRect()
    if (!prepared.hasHeights) {
      ensureLineHeights(cm, prepared.view, prepared.rect)
      prepared.hasHeights = true
    }
    found = measureCharInner(cm, prepared, ch, bias)
    if (!found.bogus) prepared.cache[key] = found
  }
  return {left: found.left, right: found.right,
          top: varHeight ? found.rtop : found.top,
          bottom: varHeight ? found.rbottom : found.bottom}
}

let nullRect = {left: 0, right: 0, top: 0, bottom: 0}

export function nodeAndOffsetInLineMap(map, ch, bias) {
  let node, start, end, collapse, mStart, mEnd
  // First, search the line map for the text node corresponding to,
  // or closest to, the target character.
  for (let i = 0; i < map.length; i += 3) {
    mStart = map[i]
    mEnd = map[i + 1]
    if (ch < mStart) {
      start = 0; end = 1
      collapse = "left"
    } else if (ch < mEnd) {
      start = ch - mStart
      end = start + 1
    } else if (i == map.length - 3 || ch == mEnd && map[i + 3] > ch) {
      end = mEnd - mStart
      start = end - 1
      if (ch >= mEnd) collapse = "right"
    }
    if (start != null) {
      node = map[i + 2]
      if (mStart == mEnd && bias == (node.insertLeft ? "left" : "right"))
        collapse = bias
      if (bias == "left" && start == 0)
        while (i && map[i - 2] == map[i - 3] && map[i - 1].insertLeft) {
          node = map[(i -= 3) + 2]
          collapse = "left"
        }
      if (bias == "right" && start == mEnd - mStart)
        while (i < map.length - 3 && map[i + 3] == map[i + 4] && !map[i + 5].insertLeft) {
          node = map[(i += 3) + 2]
          collapse = "right"
        }
      break
    }
  }
  return {node: node, start: start, end: end, collapse: collapse, coverStart: mStart, coverEnd: mEnd}
}

function getUsefulRect(rects, bias) {
  let rect = nullRect
  if (bias == "left") for (let i = 0; i < rects.length; i++) {
    if ((rect = rects[i]).left != rect.right) break
  } else for (let i = rects.length - 1; i >= 0; i--) {
    if ((rect = rects[i]).left != rect.right) break
  }
  return rect
}

function measureCharInner(cm, prepared, ch, bias) {
  let place = nodeAndOffsetInLineMap(prepared.map, ch, bias)
  let node = place.node, start = place.start, end = place.end, collapse = place.collapse

  let rect
  if (node.nodeType == 3) { // If it is a text node, use a range to retrieve the coordinates.
    for (let i = 0; i < 4; i++) { // Retry a maximum of 4 times when nonsense rectangles are returned
      while (start && isExtendingChar(prepared.line.text.charAt(place.coverStart + start))) --start
      while (place.coverStart + end < place.coverEnd && isExtendingChar(prepared.line.text.charAt(place.coverStart + end))) ++end
      if (ie && ie_version < 9 && start == 0 && end == place.coverEnd - place.coverStart)
        rect = node.parentNode.getBoundingClientRect()
      else
        rect = getUsefulRect(range(node, start, end).getClientRects(), bias)
      if (rect.left || rect.right || start == 0) break
      end = start
      start = start - 1
      collapse = "right"
    }
    if (ie && ie_version < 11) rect = maybeUpdateRectForZooming(cm.display.measure, rect)
  } else { // If it is a widget, simply get the box for the whole widget.
    if (start > 0) collapse = bias = "right"
    let rects
    if (cm.options.lineWrapping && (rects = node.getClientRects()).length > 1)
      rect = rects[bias == "right" ? rects.length - 1 : 0]
    else
      rect = node.getBoundingClientRect()
  }
  if (ie && ie_version < 9 && !start && (!rect || !rect.left && !rect.right)) {
    let rSpan = node.parentNode.getClientRects()[0]
    if (rSpan)
      rect = {left: rSpan.left, right: rSpan.left + charWidth(cm.display), top: rSpan.top, bottom: rSpan.bottom}
    else
      rect = nullRect
  }

  let rtop = rect.top - prepared.rect.top, rbot = rect.bottom - prepared.rect.top
  let mid = (rtop + rbot) / 2
  let heights = prepared.view.measure.heights
  let i = 0
  for (; i < heights.length - 1; i++)
    if (mid < heights[i]) break
  let top = i ? heights[i - 1] : 0, bot = heights[i]
  let result = {left: (collapse == "right" ? rect.right : rect.left) - prepared.rect.left,
                right: (collapse == "left" ? rect.left : rect.right) - prepared.rect.left,
                top: top, bottom: bot}
  if (!rect.left && !rect.right) result.bogus = true
  if (!cm.options.singleCursorHeightPerLine) { result.rtop = rtop; result.rbottom = rbot }

  return result
}

// Work around problem with bounding client rects on ranges being
// returned incorrectly when zoomed on IE10 and below.
function maybeUpdateRectForZooming(measure, rect) {
  if (!window.screen || screen.logicalXDPI == null ||
      screen.logicalXDPI == screen.deviceXDPI || !hasBadZoomedRects(measure))
    return rect
  let scaleX = screen.logicalXDPI / screen.deviceXDPI
  let scaleY = screen.logicalYDPI / screen.deviceYDPI
  return {left: rect.left * scaleX, right: rect.right * scaleX,
          top: rect.top * scaleY, bottom: rect.bottom * scaleY}
}

export function clearLineMeasurementCacheFor(lineView) {
  if (lineView.measure) {
    lineView.measure.cache = {}
    lineView.measure.heights = null
    if (lineView.rest) for (let i = 0; i < lineView.rest.length; i++)
      lineView.measure.caches[i] = {}
  }
}

export function clearLineMeasurementCache(cm) {
  cm.display.externalMeasure = null
  removeChildren(cm.display.lineMeasure)
  for (let i = 0; i < cm.display.view.length; i++)
    clearLineMeasurementCacheFor(cm.display.view[i])
}

export function clearCaches(cm) {
  clearLineMeasurementCache(cm)
  cm.display.cachedCharWidth = cm.display.cachedTextHeight = cm.display.cachedPaddingH = null
  if (!cm.options.lineWrapping) cm.display.maxLineChanged = true
  cm.display.lineNumChars = null
}

function pageScrollX() {
  // Work around https://bugs.chromium.org/p/chromium/issues/detail?id=489206
  // which causes page_Offset and bounding client rects to use
  // different reference viewports and invalidate our calculations.
  if (chrome && android) return -(document.body.getBoundingClientRect().left - parseInt(getComputedStyle(document.body).marginLeft))
  return window.pageXOffset || (document.documentElement || document.body).scrollLeft
}
function pageScrollY() {
  if (chrome && android) return -(document.body.getBoundingClientRect().top - parseInt(getComputedStyle(document.body).marginTop))
  return window.pageYOffset || (document.documentElement || document.body).scrollTop
}

// Converts a {top, bottom, left, right} box from line-local
// coordinates into another coordinate system. Context may be one of
// "line", "div" (display.lineDiv), "local"./null (editor), "window",
// or "page".
export function intoCoordSystem(cm, lineObj, rect, context, includeWidgets) {
  if (!includeWidgets && lineObj.widgets) for (let i = 0; i < lineObj.widgets.length; ++i) if (lineObj.widgets[i].above) {
    let size = widgetHeight(lineObj.widgets[i])
    rect.top += size; rect.bottom += size
  }
  if (context == "line") return rect
  if (!context) context = "local"
  let yOff = heightAtLine(lineObj)
  if (context == "local") yOff += paddingTop(cm.display)
  else yOff -= cm.display.viewOffset
  if (context == "page" || context == "window") {
    let lOff = cm.display.lineSpace.getBoundingClientRect()
    yOff += lOff.top + (context == "window" ? 0 : pageScrollY())
    let xOff = lOff.left + (context == "window" ? 0 : pageScrollX())
    rect.left += xOff; rect.right += xOff
  }
  rect.top += yOff; rect.bottom += yOff
  return rect
}

// Coverts a box from "div" coords to another coordinate system.
// Context may be "window", "page", "div", or "local"./null.
export function fromCoordSystem(cm, coords, context) {
  if (context == "div") return coords
  let left = coords.left, top = coords.top
  // First move into "page" coordinate system
  if (context == "page") {
    left -= pageScrollX()
    top -= pageScrollY()
  } else if (context == "local" || !context) {
    let localBox = cm.display.sizer.getBoundingClientRect()
    left += localBox.left
    top += localBox.top
  }

  let lineSpaceBox = cm.display.lineSpace.getBoundingClientRect()
  return {left: left - lineSpaceBox.left, top: top - lineSpaceBox.top}
}

export function charCoords(cm, pos, context, lineObj, bias) {
  if (!lineObj) lineObj = getLine(cm.doc, pos.line)
  return intoCoordSystem(cm, lineObj, measureChar(cm, lineObj, pos.ch, bias), context)
}

// Returns a box for a given cursor position, which may have an
// 'other' property containing the position of the secondary cursor
// on a bidi boundary.
// A cursor Pos(line, char, "before") is on the same visual line as `char - 1`
// and after `char - 1` in writing order of `char - 1`
// A cursor Pos(line, char, "after") is on the same visual line as `char`
// and before `char` in writing order of `char`
// Examples (upper-case letters are RTL, lower-case are LTR):
//     Pos(0, 1, ...)
//     before   after
// ab     a|b     a|b
// aB     a|B     aB|
// Ab     |Ab     A|b
// AB     B|A     B|A
// Every position after the last character on a line is considered to stick
// to the last character on the line.
export function cursorCoords(cm, pos, context, lineObj, preparedMeasure, varHeight) {
  lineObj = lineObj || getLine(cm.doc, pos.line)
  if (!preparedMeasure) preparedMeasure = prepareMeasureForLine(cm, lineObj)
  function get(ch, right) {
    let m = measureCharPrepared(cm, preparedMeasure, ch, right ? "right" : "left", varHeight)
    if (right) m.left = m.right; else m.right = m.left
    return intoCoordSystem(cm, lineObj, m, context)
  }
  let order = getOrder(lineObj, cm.doc.direction), ch = pos.ch, sticky = pos.sticky
  if (ch >= lineObj.text.length) {
    ch = lineObj.text.length
    sticky = "before"
  } else if (ch <= 0) {
    ch = 0
    sticky = "after"
  }
  if (!order) return get(sticky == "before" ? ch - 1 : ch, sticky == "before")

  function getBidi(ch, partPos, invert) {
    let part = order[partPos], right = (part.level % 2) != 0
    return get(invert ? ch - 1 : ch, right != invert)
  }
  let partPos = getBidiPartAt(order, ch, sticky)
  let other = bidiOther
  let val = getBidi(ch, partPos, sticky == "before")
  if (other != null) val.other = getBidi(ch, other, sticky != "before")
  return val
}

// Used to cheaply estimate the coordinates for a position. Used for
// intermediate scroll updates.
export function estimateCoords(cm, pos) {
  let left = 0
  pos = clipPos(cm.doc, pos)
  if (!cm.options.lineWrapping) left = charWidth(cm.display) * pos.ch
  let lineObj = getLine(cm.doc, pos.line)
  let top = heightAtLine(lineObj) + paddingTop(cm.display)
  return {left: left, right: left, top: top, bottom: top + lineObj.height}
}

// Positions returned by coordsChar contain some extra information.
// xRel is the relative x position of the input coordinates compared
// to the found position (so xRel > 0 means the coordinates are to
// the right of the character position, for example). When outside
// is true, that means the coordinates lie outside the line's
// vertical range.
function PosWithInfo(line, ch, sticky, outside, xRel) {
  let pos = Pos(line, ch, sticky)
  pos.xRel = xRel
  if (outside) pos.outside = true
  return pos
}

// Compute the character position closest to the given coordinates.
// Input must be lineSpace-local ("div" coordinate system).
export function coordsChar(cm, x, y) {
  let doc = cm.doc
  y += cm.display.viewOffset
  if (y < 0) return PosWithInfo(doc.first, 0, null, true, -1)
  let lineN = lineAtHeight(doc, y), last = doc.first + doc.size - 1
  if (lineN > last)
    return PosWithInfo(doc.first + doc.size - 1, getLine(doc, last).text.length, null, true, 1)
  if (x < 0) x = 0

  let lineObj = getLine(doc, lineN)
  for (;;) {
    let found = coordsCharInner(cm, lineObj, lineN, x, y)
    let merged = collapsedSpanAtEnd(lineObj)
    let mergedPos = merged && merged.find(0, true)
    if (merged && (found.ch > mergedPos.from.ch || found.ch == mergedPos.from.ch && found.xRel > 0))
      lineN = lineNo(lineObj = mergedPos.to.line)
    else
      return found
  }
}

function wrappedLineExtent(cm, lineObj, preparedMeasure, y) {
  let measure = ch => intoCoordSystem(cm, lineObj, measureCharPrepared(cm, preparedMeasure, ch), "line")
  let end = lineObj.text.length
  let begin = findFirst(ch => measure(ch - 1).bottom <= y, end, 0)
  end = findFirst(ch => measure(ch).top > y, begin, end)
  return {begin, end}
}

export function wrappedLineExtentChar(cm, lineObj, preparedMeasure, target) {
  let targetTop = intoCoordSystem(cm, lineObj, measureCharPrepared(cm, preparedMeasure, target), "line").top
  return wrappedLineExtent(cm, lineObj, preparedMeasure, targetTop)
}

function coordsCharInner(cm, lineObj, lineNo, x, y) {
  y -= heightAtLine(lineObj)
  let begin = 0, end = lineObj.text.length
  let preparedMeasure = prepareMeasureForLine(cm, lineObj)
  let pos
  let order = getOrder(lineObj, cm.doc.direction)
  if (order) {
    if (cm.options.lineWrapping) {
      ;({begin, end} = wrappedLineExtent(cm, lineObj, preparedMeasure, y))
    }
    pos = new Pos(lineNo, Math.floor(begin + (end - begin) / 2))
    let beginLeft = cursorCoords(cm, pos, "line", lineObj, preparedMeasure).left
    let dir = beginLeft < x ? 1 : -1
    let prevDiff, diff = beginLeft - x, prevPos
    let steps = Math.ceil((end - begin) / 4)
    outer: do {
      prevDiff = diff
      prevPos = pos
      let i = 0
      for (; i < steps; ++i) {
        let prevPos = pos
        pos = moveVisually(cm, lineObj, pos, dir)
        if (pos == null || pos.ch < begin || end <= (pos.sticky == "before" ? pos.ch - 1 : pos.ch)) {
          pos = prevPos
          break outer
        }
      }
      diff = cursorCoords(cm, pos, "line", lineObj, preparedMeasure).left - x
      if (steps > 1) {
        let diff_change_per_step = Math.abs(diff - prevDiff) / steps
        steps = Math.min(steps, Math.ceil(Math.abs(diff) / diff_change_per_step))
        dir = diff < 0 ? 1 : -1
      }
    } while (diff != 0 && (steps > 1 || ((dir < 0) != (diff < 0) && (Math.abs(diff) <= Math.abs(prevDiff)))))
    if (Math.abs(diff) > Math.abs(prevDiff)) {
      if ((diff < 0) == (prevDiff < 0)) throw new Error("Broke out of infinite loop in coordsCharInner")
      pos = prevPos
    }
  } else {
    let ch = findFirst(ch => {
      let box = intoCoordSystem(cm, lineObj, measureCharPrepared(cm, preparedMeasure, ch), "line")
      if (box.top > y) {
        // For the cursor stickiness
        end = Math.min(ch, end)
        return true
      }
      else if (box.bottom <= y) return false
      else if (box.left > x) return true
      else if (box.right < x) return false
      else return (x - box.left < box.right - x)
    }, begin, end)
    ch = skipExtendingChars(lineObj.text, ch, 1)
    pos = new Pos(lineNo, ch, ch == end ? "before" : "after")
  }
  let coords = cursorCoords(cm, pos, "line", lineObj, preparedMeasure)
  if (y < coords.top || coords.bottom < y) pos.outside = true
  pos.xRel = x < coords.left ? -1 : (x > coords.right ? 1 : 0)
  return pos
}

let measureText
// Compute the default text height.
export function textHeight(display) {
  if (display.cachedTextHeight != null) return display.cachedTextHeight
  if (measureText == null) {
    measureText = elt("pre")
    // Measure a bunch of lines, for browsers that compute
    // fractional heights.
    for (let i = 0; i < 49; ++i) {
      measureText.appendChild(document.createTextNode("x"))
      measureText.appendChild(elt("br"))
    }
    measureText.appendChild(document.createTextNode("x"))
  }
  removeChildrenAndAdd(display.measure, measureText)
  let height = measureText.offsetHeight / 50
  if (height > 3) display.cachedTextHeight = height
  removeChildren(display.measure)
  return height || 1
}

// Compute the default character width.
export function charWidth(display) {
  if (display.cachedCharWidth != null) return display.cachedCharWidth
  let anchor = elt("span", "xxxxxxxxxx")
  let pre = elt("pre", [anchor])
  removeChildrenAndAdd(display.measure, pre)
  let rect = anchor.getBoundingClientRect(), width = (rect.right - rect.left) / 10
  if (width > 2) display.cachedCharWidth = width
  return width || 10
}

// Do a bulk-read of the DOM positions and sizes needed to draw the
// view, so that we don't interleave reading and writing to the DOM.
export function getDimensions(cm) {
  let d = cm.display, left = {}, width = {}
  let gutterLeft = d.gutters.clientLeft
  for (let n = d.gutters.firstChild, i = 0; n; n = n.nextSibling, ++i) {
    left[cm.options.gutters[i]] = n.offsetLeft + n.clientLeft + gutterLeft
    width[cm.options.gutters[i]] = n.clientWidth
  }
  return {fixedPos: compensateForHScroll(d),
          gutterTotalWidth: d.gutters.offsetWidth,
          gutterLeft: left,
          gutterWidth: width,
          wrapperWidth: d.wrapper.clientWidth}
}

// Computes display.scroller.scrollLeft + display.gutters.offsetWidth,
// but using getBoundingClientRect to get a sub-pixel-accurate
// result.
export function compensateForHScroll(display) {
  return display.scroller.getBoundingClientRect().left - display.sizer.getBoundingClientRect().left
}

// Returns a function that estimates the height of a line, to use as
// first approximation until the line becomes visible (and is thus
// properly measurable).
export function estimateHeight(cm) {
  let th = textHeight(cm.display), wrapping = cm.options.lineWrapping
  let perLine = wrapping && Math.max(5, cm.display.scroller.clientWidth / charWidth(cm.display) - 3)
  return line => {
    if (lineIsHidden(cm.doc, line)) return 0

    let widgetsHeight = 0
    if (line.widgets) for (let i = 0; i < line.widgets.length; i++) {
      if (line.widgets[i].height) widgetsHeight += line.widgets[i].height
    }

    if (wrapping)
      return widgetsHeight + (Math.ceil(line.text.length / perLine) || 1) * th
    else
      return widgetsHeight + th
  }
}

export function estimateLineHeights(cm) {
  let doc = cm.doc, est = estimateHeight(cm)
  doc.iter(line => {
    let estHeight = est(line)
    if (estHeight != line.height) updateLineHeight(line, estHeight)
  })
}

// Given a mouse event, find the corresponding position. If liberal
// is false, it checks whether a gutter or scrollbar was clicked,
// and returns null if it was. forRect is used by rectangular
// selections, and tries to estimate a character position even for
// coordinates beyond the right of the text.
export function posFromMouse(cm, e, liberal, forRect) {
  let display = cm.display
  if (!liberal && e_target(e).getAttribute("cm-not-content") == "true") return null

  let x, y, space = display.lineSpace.getBoundingClientRect()
  // Fails unpredictably on IE[67] when mouse is dragged around quickly.
  try { x = e.clientX - space.left; y = e.clientY - space.top }
  catch (e) { return null }
  let coords = coordsChar(cm, x, y), line
  if (forRect && coords.xRel == 1 && (line = getLine(cm.doc, coords.line).text).length == coords.ch) {
    let colDiff = countColumn(line, line.length, cm.options.tabSize) - line.length
    coords = Pos(coords.line, Math.max(0, Math.round((x - paddingH(cm.display).left) / charWidth(cm.display)) - colDiff))
  }
  return coords
}

// Find the view element corresponding to a given line. Return null
// when the line isn't visible.
export function findViewIndex(cm, n) {
  if (n >= cm.display.viewTo) return null
  n -= cm.display.viewFrom
  if (n < 0) return null
  let view = cm.display.view
  for (let i = 0; i < view.length; i++) {
    n -= view[i].size
    if (n < 0) return i
  }
}
