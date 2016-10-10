import { Pos } from "../line/pos"
import { visualLine } from "../line/spans"
import { getLine } from "../line/utils_line"
import { charCoords, cursorCoords, displayWidth, paddingH } from "../measurement/position_measurement"
import { getOrder, iterateBidiSections } from "../util/bidi"
import { elt } from "../util/dom"

export function updateSelection(cm) {
  cm.display.input.showSelection(cm.display.input.prepareSelection())
}

export function prepareSelection(cm, primary) {
  let doc = cm.doc, result = {}
  let curFragment = result.cursors = document.createDocumentFragment()
  let selFragment = result.selection = document.createDocumentFragment()

  for (let i = 0; i < doc.sel.ranges.length; i++) {
    if (primary === false && i == doc.sel.primIndex) continue
    let range = doc.sel.ranges[i]
    if (range.from().line >= cm.display.viewTo || range.to().line < cm.display.viewFrom) continue
    let collapsed = range.empty()
    if (collapsed || cm.options.showCursorWhenSelecting)
      drawSelectionCursor(cm, range.head, curFragment)
    if (!collapsed)
      drawSelectionRange(cm, range, selFragment)
  }
  return result
}

// Draws a cursor for the given range
export function drawSelectionCursor(cm, head, output) {
  let pos = cursorCoords(cm, head, "div", null, null, !cm.options.singleCursorHeightPerLine)

  let cursor = output.appendChild(elt("div", "\u00a0", "CodeMirror-cursor"))
  cursor.style.left = pos.left + "px"
  cursor.style.top = pos.top + "px"
  cursor.style.height = Math.max(0, pos.bottom - pos.top) * cm.options.cursorHeight + "px"

  if (pos.other) {
    // Secondary cursor, shown when on a 'jump' in bi-directional text
    let otherCursor = output.appendChild(elt("div", "\u00a0", "CodeMirror-cursor CodeMirror-secondarycursor"))
    otherCursor.style.display = ""
    otherCursor.style.left = pos.other.left + "px"
    otherCursor.style.top = pos.other.top + "px"
    otherCursor.style.height = (pos.other.bottom - pos.other.top) * .85 + "px"
  }
}

// Draws the given range as a highlighted selection
function drawSelectionRange(cm, range, output) {
  let display = cm.display, doc = cm.doc
  let fragment = document.createDocumentFragment()
  let padding = paddingH(cm.display), leftSide = padding.left
  let rightSide = Math.max(display.sizerWidth, displayWidth(cm) - display.sizer.offsetLeft) - padding.right

  function add(left, top, width, bottom) {
    if (top < 0) top = 0
    top = Math.round(top)
    bottom = Math.round(bottom)
    fragment.appendChild(elt("div", null, "CodeMirror-selected", `position: absolute; left: ${left}px;
                             top: ${top}px; width: ${width == null ? rightSide - left : width}px;
                             height: ${bottom - top}px`))
  }

  function drawForLine(line, fromArg, toArg) {
    let lineObj = getLine(doc, line)
    let lineLen = lineObj.text.length
    let start, end
    function coords(ch, bias) {
      return charCoords(cm, Pos(line, ch), "div", lineObj, bias)
    }

    iterateBidiSections(getOrder(lineObj), fromArg || 0, toArg == null ? lineLen : toArg, (from, to, dir) => {
      let leftPos = coords(from, "left"), rightPos, left, right
      if (from == to) {
        rightPos = leftPos
        left = right = leftPos.left
      } else {
        rightPos = coords(to - 1, "right")
        if (dir == "rtl") { let tmp = leftPos; leftPos = rightPos; rightPos = tmp }
        left = leftPos.left
        right = rightPos.right
      }
      if (fromArg == null && from == 0) left = leftSide
      if (rightPos.top - leftPos.top > 3) { // Different lines, draw top part
        add(left, leftPos.top, null, leftPos.bottom)
        left = leftSide
        if (leftPos.bottom < rightPos.top) add(left, leftPos.bottom, null, rightPos.top)
      }
      if (toArg == null && to == lineLen) right = rightSide
      if (!start || leftPos.top < start.top || leftPos.top == start.top && leftPos.left < start.left)
        start = leftPos
      if (!end || rightPos.bottom > end.bottom || rightPos.bottom == end.bottom && rightPos.right > end.right)
        end = rightPos
      if (left < leftSide + 1) left = leftSide
      add(left, rightPos.top, right - left, rightPos.bottom)
    })
    return {start: start, end: end}
  }

  let sFrom = range.from(), sTo = range.to()
  if (sFrom.line == sTo.line) {
    drawForLine(sFrom.line, sFrom.ch, sTo.ch)
  } else {
    let fromLine = getLine(doc, sFrom.line), toLine = getLine(doc, sTo.line)
    let singleVLine = visualLine(fromLine) == visualLine(toLine)
    let leftEnd = drawForLine(sFrom.line, sFrom.ch, singleVLine ? fromLine.text.length + 1 : null).end
    let rightStart = drawForLine(sTo.line, singleVLine ? 0 : null, sTo.ch).start
    if (singleVLine) {
      if (leftEnd.top < rightStart.top - 2) {
        add(leftEnd.right, leftEnd.top, null, leftEnd.bottom)
        add(leftSide, rightStart.top, rightStart.left, rightStart.bottom)
      } else {
        add(leftEnd.right, leftEnd.top, rightStart.left - leftEnd.right, leftEnd.bottom)
      }
    }
    if (leftEnd.bottom < rightStart.top)
      add(leftSide, leftEnd.bottom, null, rightStart.top)
  }

  output.appendChild(fragment)
}

// Cursor-blinking
export function restartBlink(cm) {
  if (!cm.state.focused) return
  let display = cm.display
  clearInterval(display.blinker)
  let on = true
  display.cursorDiv.style.visibility = ""
  if (cm.options.cursorBlinkRate > 0)
    display.blinker = setInterval(() => display.cursorDiv.style.visibility = (on = !on) ? "" : "hidden",
      cm.options.cursorBlinkRate)
  else if (cm.options.cursorBlinkRate < 0)
    display.cursorDiv.style.visibility = "hidden"
}
