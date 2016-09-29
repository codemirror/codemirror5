import { delayBlurEvent, ensureFocus } from "../display/focus"
import { operation } from "../display/operations"
import { visibleLines } from "../display/update_lines"
import { clipPos, cmp, maxPos, minPos, Pos } from "../line/pos"
import { getLine, lineAtHeight } from "../line/utils_line"
import { posFromMouse } from "../measurement/position_measurement"
import { eventInWidget } from "../measurement/widgets"
import { normalizeSelection, Range, Selection } from "../model/selection"
import { extendRange, extendSelection, replaceOneSelection, setSelection } from "../model/selection_updates"
import { captureRightClick, chromeOS, ie, ie_version, mac, webkit } from "../util/browser"
import { activeElt } from "../util/dom"
import { e_button, e_defaultPrevented, e_preventDefault, e_target, hasHandler, off, on, signal, signalDOMEvent } from "../util/event"
import { dragAndDrop } from "../util/feature_detection"
import { bind, countColumn, findColumn, sel_mouse } from "../util/misc"

// A mouse down can be a single click, double click, triple click,
// start of selection drag, start of text drag, new cursor
// (ctrl-click), rectangle drag (alt-drag), or xwin
// middle-click-paste. Or it might be a click on something we should
// not interfere with, such as a scrollbar or widget.
export function onMouseDown(e) {
  let cm = this, display = cm.display
  if (signalDOMEvent(cm, e) || display.activeTouch && display.input.supportsTouch()) return
  display.shift = e.shiftKey

  if (eventInWidget(display, e)) {
    if (!webkit) {
      // Briefly turn off draggability, to allow widgets to do
      // normal dragging things.
      display.scroller.draggable = false
      setTimeout(() => display.scroller.draggable = true, 100)
    }
    return
  }
  if (clickInGutter(cm, e)) return
  let start = posFromMouse(cm, e)
  window.focus()

  switch (e_button(e)) {
  case 1:
    // #3261: make sure, that we're not starting a second selection
    if (cm.state.selectingText)
      cm.state.selectingText(e)
    else if (start)
      leftButtonDown(cm, e, start)
    else if (e_target(e) == display.scroller)
      e_preventDefault(e)
    break
  case 2:
    if (webkit) cm.state.lastMiddleDown = +new Date
    if (start) extendSelection(cm.doc, start)
    setTimeout(() => display.input.focus(), 20)
    e_preventDefault(e)
    break
  case 3:
    if (captureRightClick) onContextMenu(cm, e)
    else delayBlurEvent(cm)
    break
  }
}

let lastClick, lastDoubleClick
function leftButtonDown(cm, e, start) {
  if (ie) setTimeout(bind(ensureFocus, cm), 0)
  else cm.curOp.focus = activeElt()

  let now = +new Date, type
  if (lastDoubleClick && lastDoubleClick.time > now - 400 && cmp(lastDoubleClick.pos, start) == 0) {
    type = "triple"
  } else if (lastClick && lastClick.time > now - 400 && cmp(lastClick.pos, start) == 0) {
    type = "double"
    lastDoubleClick = {time: now, pos: start}
  } else {
    type = "single"
    lastClick = {time: now, pos: start}
  }

  let sel = cm.doc.sel, modifier = mac ? e.metaKey : e.ctrlKey, contained
  if (cm.options.dragDrop && dragAndDrop && !cm.isReadOnly() &&
      type == "single" && (contained = sel.contains(start)) > -1 &&
      (cmp((contained = sel.ranges[contained]).from(), start) < 0 || start.xRel > 0) &&
      (cmp(contained.to(), start) > 0 || start.xRel < 0))
    leftButtonStartDrag(cm, e, start, modifier)
  else
    leftButtonSelect(cm, e, start, type, modifier)
}

// Start a text drag. When it ends, see if any dragging actually
// happen, and treat as a click if it didn't.
function leftButtonStartDrag(cm, e, start, modifier) {
  let display = cm.display, startTime = +new Date
  let dragEnd = operation(cm, e2 => {
    if (webkit) display.scroller.draggable = false
    cm.state.draggingText = false
    off(document, "mouseup", dragEnd)
    off(display.scroller, "drop", dragEnd)
    if (Math.abs(e.clientX - e2.clientX) + Math.abs(e.clientY - e2.clientY) < 10) {
      e_preventDefault(e2)
      if (!modifier && +new Date - 200 < startTime)
        extendSelection(cm.doc, start)
      // Work around unexplainable focus problem in IE9 (#2127) and Chrome (#3081)
      if (webkit || ie && ie_version == 9)
        setTimeout(() => {document.body.focus(); display.input.focus()}, 20)
      else
        display.input.focus()
    }
  })
  // Let the drag handler handle this.
  if (webkit) display.scroller.draggable = true
  cm.state.draggingText = dragEnd
  dragEnd.copy = mac ? e.altKey : e.ctrlKey
  // IE's approach to draggable
  if (display.scroller.dragDrop) display.scroller.dragDrop()
  on(document, "mouseup", dragEnd)
  on(display.scroller, "drop", dragEnd)
}

// Normal selection, as opposed to text dragging.
function leftButtonSelect(cm, e, start, type, addNew) {
  let display = cm.display, doc = cm.doc
  e_preventDefault(e)

  let ourRange, ourIndex, startSel = doc.sel, ranges = startSel.ranges
  if (addNew && !e.shiftKey) {
    ourIndex = doc.sel.contains(start)
    if (ourIndex > -1)
      ourRange = ranges[ourIndex]
    else
      ourRange = new Range(start, start)
  } else {
    ourRange = doc.sel.primary()
    ourIndex = doc.sel.primIndex
  }

  if (chromeOS ? e.shiftKey && e.metaKey : e.altKey) {
    type = "rect"
    if (!addNew) ourRange = new Range(start, start)
    start = posFromMouse(cm, e, true, true)
    ourIndex = -1
  } else if (type == "double") {
    let word = cm.findWordAt(start)
    if (cm.display.shift || doc.extend)
      ourRange = extendRange(doc, ourRange, word.anchor, word.head)
    else
      ourRange = word
  } else if (type == "triple") {
    let line = new Range(Pos(start.line, 0), clipPos(doc, Pos(start.line + 1, 0)))
    if (cm.display.shift || doc.extend)
      ourRange = extendRange(doc, ourRange, line.anchor, line.head)
    else
      ourRange = line
  } else {
    ourRange = extendRange(doc, ourRange, start)
  }

  if (!addNew) {
    ourIndex = 0
    setSelection(doc, new Selection([ourRange], 0), sel_mouse)
    startSel = doc.sel
  } else if (ourIndex == -1) {
    ourIndex = ranges.length
    setSelection(doc, normalizeSelection(ranges.concat([ourRange]), ourIndex),
                 {scroll: false, origin: "*mouse"})
  } else if (ranges.length > 1 && ranges[ourIndex].empty() && type == "single" && !e.shiftKey) {
    setSelection(doc, normalizeSelection(ranges.slice(0, ourIndex).concat(ranges.slice(ourIndex + 1)), 0),
                 {scroll: false, origin: "*mouse"})
    startSel = doc.sel
  } else {
    replaceOneSelection(doc, ourIndex, ourRange, sel_mouse)
  }

  let lastPos = start
  function extendTo(pos) {
    if (cmp(lastPos, pos) == 0) return
    lastPos = pos

    if (type == "rect") {
      let ranges = [], tabSize = cm.options.tabSize
      let startCol = countColumn(getLine(doc, start.line).text, start.ch, tabSize)
      let posCol = countColumn(getLine(doc, pos.line).text, pos.ch, tabSize)
      let left = Math.min(startCol, posCol), right = Math.max(startCol, posCol)
      for (let line = Math.min(start.line, pos.line), end = Math.min(cm.lastLine(), Math.max(start.line, pos.line));
           line <= end; line++) {
        let text = getLine(doc, line).text, leftPos = findColumn(text, left, tabSize)
        if (left == right)
          ranges.push(new Range(Pos(line, leftPos), Pos(line, leftPos)))
        else if (text.length > leftPos)
          ranges.push(new Range(Pos(line, leftPos), Pos(line, findColumn(text, right, tabSize))))
      }
      if (!ranges.length) ranges.push(new Range(start, start))
      setSelection(doc, normalizeSelection(startSel.ranges.slice(0, ourIndex).concat(ranges), ourIndex),
                   {origin: "*mouse", scroll: false})
      cm.scrollIntoView(pos)
    } else {
      let oldRange = ourRange
      let anchor = oldRange.anchor, head = pos
      if (type != "single") {
        let range
        if (type == "double")
          range = cm.findWordAt(pos)
        else
          range = new Range(Pos(pos.line, 0), clipPos(doc, Pos(pos.line + 1, 0)))
        if (cmp(range.anchor, anchor) > 0) {
          head = range.head
          anchor = minPos(oldRange.from(), range.anchor)
        } else {
          head = range.anchor
          anchor = maxPos(oldRange.to(), range.head)
        }
      }
      let ranges = startSel.ranges.slice(0)
      ranges[ourIndex] = new Range(clipPos(doc, anchor), head)
      setSelection(doc, normalizeSelection(ranges, ourIndex), sel_mouse)
    }
  }

  let editorSize = display.wrapper.getBoundingClientRect()
  // Used to ensure timeout re-tries don't fire when another extend
  // happened in the meantime (clearTimeout isn't reliable -- at
  // least on Chrome, the timeouts still happen even when cleared,
  // if the clear happens after their scheduled firing time).
  let counter = 0

  function extend(e) {
    let curCount = ++counter
    let cur = posFromMouse(cm, e, true, type == "rect")
    if (!cur) return
    if (cmp(cur, lastPos) != 0) {
      cm.curOp.focus = activeElt()
      extendTo(cur)
      let visible = visibleLines(display, doc)
      if (cur.line >= visible.to || cur.line < visible.from)
        setTimeout(operation(cm, () => {if (counter == curCount) extend(e)}), 150)
    } else {
      let outside = e.clientY < editorSize.top ? -20 : e.clientY > editorSize.bottom ? 20 : 0
      if (outside) setTimeout(operation(cm, () => {
        if (counter != curCount) return
        display.scroller.scrollTop += outside
        extend(e)
      }), 50)
    }
  }

  function done(e) {
    cm.state.selectingText = false
    counter = Infinity
    e_preventDefault(e)
    display.input.focus()
    off(document, "mousemove", move)
    off(document, "mouseup", up)
    doc.history.lastSelOrigin = null
  }

  let move = operation(cm, e => {
    if (!e_button(e)) done(e)
    else extend(e)
  })
  let up = operation(cm, done)
  cm.state.selectingText = up
  on(document, "mousemove", move)
  on(document, "mouseup", up)
}


// Determines whether an event happened in the gutter, and fires the
// handlers for the corresponding event.
function gutterEvent(cm, e, type, prevent) {
  let mX, mY
  try { mX = e.clientX; mY = e.clientY }
  catch(e) { return false }
  if (mX >= Math.floor(cm.display.gutters.getBoundingClientRect().right)) return false
  if (prevent) e_preventDefault(e)

  let display = cm.display
  let lineBox = display.lineDiv.getBoundingClientRect()

  if (mY > lineBox.bottom || !hasHandler(cm, type)) return e_defaultPrevented(e)
  mY -= lineBox.top - display.viewOffset

  for (let i = 0; i < cm.options.gutters.length; ++i) {
    let g = display.gutters.childNodes[i]
    if (g && g.getBoundingClientRect().right >= mX) {
      let line = lineAtHeight(cm.doc, mY)
      let gutter = cm.options.gutters[i]
      signal(cm, type, cm, line, gutter, e)
      return e_defaultPrevented(e)
    }
  }
}

export function clickInGutter(cm, e) {
  return gutterEvent(cm, e, "gutterClick", true)
}

// CONTEXT MENU HANDLING

// To make the context menu work, we need to briefly unhide the
// textarea (making it as unobtrusive as possible) to let the
// right-click take effect on it.
export function onContextMenu(cm, e) {
  if (eventInWidget(cm.display, e) || contextMenuInGutter(cm, e)) return
  if (signalDOMEvent(cm, e, "contextmenu")) return
  cm.display.input.onContextMenu(e)
}

function contextMenuInGutter(cm, e) {
  if (!hasHandler(cm, "gutterContextMenu")) return false
  return gutterEvent(cm, e, "gutterContextMenu", false)
}
