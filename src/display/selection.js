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

function cmpCoords(a, b) { return a.top - b.top || a.left - b.left }

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

    iterateBidiSections(getOrder(lineObj, doc.direction), fromArg || 0, toArg == null ? lineLen : toArg, (from, to, dir) => {
      let fromPos, toPos
      if (dir == "ltr") {
        fromPos = coords(from, "left")
        toPos = coords(to - 1, "right")
        let fromLeft = fromArg == null && from == 0 ? leftSide : fromPos.left
        let toRight = toArg == null && to == lineLen ? rightSide : toPos.right
        if (toPos.top - fromPos.top <= 3) { // Single line
          add(fromLeft, toPos.top, toRight - fromLeft, toPos.bottom)
        } else { // Multiple lines
          add(fromLeft, fromPos.top, null, fromPos.bottom)
          if (fromPos.bottom < toPos.top) add(leftSide, fromPos.bottom, null, toPos.top)
          add(leftSide, toPos.top, toPos.right, toPos.bottom)
        }
      } else { // RTL
        fromPos = coords(from, "right")
        toPos = coords(to - 1, "left")
        let fromRight = fromArg == null && from == 0 ? rightSide : fromPos.right
        let toLeft = toArg == null && to == lineLen ? leftSide : toPos.left
        if (toPos.top - fromPos.top <= 3) { // Single line
          add(toLeft, toPos.top, fromRight - toLeft, toPos.bottom)
        } else { // Multiple lines
          add(leftSide, fromPos.top, fromRight - leftSide, fromPos.bottom)
          if (fromPos.bottom < toPos.top) add(leftSide, fromPos.bottom, null, toPos.top)
          add(toLeft, toPos.top, null, toPos.bottom)
        }
      }

      if (!start || cmpCoords(fromPos, start) < 0) start = fromPos
      if (cmpCoords(toPos, start) < 0) start = toPos
      if (!end || cmpCoords(fromPos, end) < 0) end = fromPos
      if (cmpCoords(toPos, end) < 0) end = toPos
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
