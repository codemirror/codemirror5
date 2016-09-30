import { countColumn } from "../util/misc"
import { copyState, innerMode, startState } from "../modes"
import StringStream from "../util/StringStream"

import { getLine, lineNo } from "./utils_line"
import { clipPos } from "./pos"

// Compute a style array (an array starting with a mode generation
// -- for invalidation -- followed by pairs of end positions and
// style strings), which is used to highlight the tokens on the
// line.
export function highlightLine(cm, line, state, forceToEnd) {
  // A styles array always starts with a number identifying the
  // mode/overlays that it is based on (for easy invalidation).
  let st = [cm.state.modeGen], lineClasses = {}
  // Compute the base array of styles
  runMode(cm, line.text, cm.doc.mode, state, (end, style) => st.push(end, style),
    lineClasses, forceToEnd)

  // Run overlays, adjust style array.
  for (let o = 0; o < cm.state.overlays.length; ++o) {
    let overlay = cm.state.overlays[o], i = 1, at = 0
    runMode(cm, line.text, overlay.mode, true, (end, style) => {
      let start = i
      // Ensure there's a token end at the current position, and that i points at it
      while (at < end) {
        let i_end = st[i]
        if (i_end > end)
          st.splice(i, 1, end, st[i+1], i_end)
        i += 2
        at = Math.min(end, i_end)
      }
      if (!style) return
      if (overlay.opaque) {
        st.splice(start, i - start, end, "overlay " + style)
        i = start + 2
      } else {
        for (; start < i; start += 2) {
          let cur = st[start+1]
          st[start+1] = (cur ? cur + " " : "") + "overlay " + style
        }
      }
    }, lineClasses)
  }

  return {styles: st, classes: lineClasses.bgClass || lineClasses.textClass ? lineClasses : null}
}

export function getLineStyles(cm, line, updateFrontier) {
  if (!line.styles || line.styles[0] != cm.state.modeGen) {
    let state = getStateBefore(cm, lineNo(line))
    let result = highlightLine(cm, line, line.text.length > cm.options.maxHighlightLength ? copyState(cm.doc.mode, state) : state)
    line.stateAfter = state
    line.styles = result.styles
    if (result.classes) line.styleClasses = result.classes
    else if (line.styleClasses) line.styleClasses = null
    if (updateFrontier === cm.doc.frontier) cm.doc.frontier++
  }
  return line.styles
}

export function getStateBefore(cm, n, precise) {
  let doc = cm.doc, display = cm.display
  if (!doc.mode.startState) return true
  let pos = findStartLine(cm, n, precise), state = pos > doc.first && getLine(doc, pos-1).stateAfter
  if (!state) state = startState(doc.mode)
  else state = copyState(doc.mode, state)
  doc.iter(pos, n, line => {
    processLine(cm, line.text, state)
    let save = pos == n - 1 || pos % 5 == 0 || pos >= display.viewFrom && pos < display.viewTo
    line.stateAfter = save ? copyState(doc.mode, state) : null
    ++pos
  })
  if (precise) doc.frontier = pos
  return state
}

// Lightweight form of highlight -- proceed over this line and
// update state, but don't save a style array. Used for lines that
// aren't currently visible.
export function processLine(cm, text, state, startAt) {
  let mode = cm.doc.mode
  let stream = new StringStream(text, cm.options.tabSize)
  stream.start = stream.pos = startAt || 0
  if (text == "") callBlankLine(mode, state)
  while (!stream.eol()) {
    readToken(mode, stream, state)
    stream.start = stream.pos
  }
}

function callBlankLine(mode, state) {
  if (mode.blankLine) return mode.blankLine(state)
  if (!mode.innerMode) return
  let inner = innerMode(mode, state)
  if (inner.mode.blankLine) return inner.mode.blankLine(inner.state)
}

export function readToken(mode, stream, state, inner) {
  for (let i = 0; i < 10; i++) {
    if (inner) inner[0] = innerMode(mode, state).mode
    let style = mode.token(stream, state)
    if (stream.pos > stream.start) return style
  }
  throw new Error("Mode " + mode.name + " failed to advance stream.")
}

// Utility for getTokenAt and getLineTokens
export function takeToken(cm, pos, precise, asArray) {
  let getObj = copy => ({
    start: stream.start, end: stream.pos,
    string: stream.current(),
    type: style || null,
    state: copy ? copyState(doc.mode, state) : state
  })

  let doc = cm.doc, mode = doc.mode, style
  pos = clipPos(doc, pos)
  let line = getLine(doc, pos.line), state = getStateBefore(cm, pos.line, precise)
  let stream = new StringStream(line.text, cm.options.tabSize), tokens
  if (asArray) tokens = []
  while ((asArray || stream.pos < pos.ch) && !stream.eol()) {
    stream.start = stream.pos
    style = readToken(mode, stream, state)
    if (asArray) tokens.push(getObj(true))
  }
  return asArray ? tokens : getObj()
}

function extractLineClasses(type, output) {
  if (type) for (;;) {
    let lineClass = type.match(/(?:^|\s+)line-(background-)?(\S+)/)
    if (!lineClass) break
    type = type.slice(0, lineClass.index) + type.slice(lineClass.index + lineClass[0].length)
    let prop = lineClass[1] ? "bgClass" : "textClass"
    if (output[prop] == null)
      output[prop] = lineClass[2]
    else if (!(new RegExp("(?:^|\s)" + lineClass[2] + "(?:$|\s)")).test(output[prop]))
      output[prop] += " " + lineClass[2]
  }
  return type
}

// Run the given mode's parser over a line, calling f for each token.
function runMode(cm, text, mode, state, f, lineClasses, forceToEnd) {
  let flattenSpans = mode.flattenSpans
  if (flattenSpans == null) flattenSpans = cm.options.flattenSpans
  let curStart = 0, curStyle = null
  let stream = new StringStream(text, cm.options.tabSize), style
  let inner = cm.options.addModeClass && [null]
  if (text == "") extractLineClasses(callBlankLine(mode, state), lineClasses)
  while (!stream.eol()) {
    if (stream.pos > cm.options.maxHighlightLength) {
      flattenSpans = false
      if (forceToEnd) processLine(cm, text, state, stream.pos)
      stream.pos = text.length
      style = null
    } else {
      style = extractLineClasses(readToken(mode, stream, state, inner), lineClasses)
    }
    if (inner) {
      let mName = inner[0].name
      if (mName) style = "m-" + (style ? mName + " " + style : mName)
    }
    if (!flattenSpans || curStyle != style) {
      while (curStart < stream.start) {
        curStart = Math.min(stream.start, curStart + 5000)
        f(curStart, curStyle)
      }
      curStyle = style
    }
    stream.start = stream.pos
  }
  while (curStart < stream.pos) {
    // Webkit seems to refuse to render text nodes longer than 57444
    // characters, and returns inaccurate measurements in nodes
    // starting around 5000 chars.
    let pos = Math.min(stream.pos, curStart + 5000)
    f(pos, curStyle)
    curStart = pos
  }
}

// Finds the line to start with when starting a parse. Tries to
// find a line with a stateAfter, so that it can start with a
// valid state. If that fails, it returns the line with the
// smallest indentation, which tends to need the least context to
// parse correctly.
function findStartLine(cm, n, precise) {
  let minindent, minline, doc = cm.doc
  let lim = precise ? -1 : n - (cm.doc.mode.innerMode ? 1000 : 100)
  for (let search = n; search > lim; --search) {
    if (search <= doc.first) return doc.first
    let line = getLine(doc, search - 1)
    if (line.stateAfter && (!precise || search <= doc.frontier)) return search
    let indented = countColumn(line.text, null, cm.options.tabSize)
    if (minline == null || minindent > indented) {
      minline = search - 1
      minindent = indented
    }
  }
  return minline
}
