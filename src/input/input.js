import { runInOp } from "../display/operations"
import { ensureCursorVisible } from "../display/scrolling"
import { Pos } from "../line/pos"
import { getLine } from "../line/utils_line"
import { makeChange } from "../model/changes"
import { ios, webkit } from "../util/browser"
import { elt } from "../util/dom"
import { lst, map } from "../util/misc"
import { signalLater } from "../util/operation_group"
import { splitLinesAuto } from "../util/feature_detection"

import { indentLine } from "./indent"

// This will be set to a {lineWise: bool, text: [string]} object, so
// that, when pasting, we know what kind of selections the copied
// text was made out of.
export let lastCopied = null

export function setLastCopied(newLastCopied) {
  lastCopied = newLastCopied
}

export function applyTextInput(cm, inserted, deleted, sel, origin) {
  let doc = cm.doc
  cm.display.shift = false
  if (!sel) sel = doc.sel

  let paste = cm.state.pasteIncoming || origin == "paste"
  let textLines = splitLinesAuto(inserted), multiPaste = null
  // When pasing N lines into N selections, insert one line per selection
  if (paste && sel.ranges.length > 1) {
    if (lastCopied && lastCopied.text.join("\n") == inserted) {
      if (sel.ranges.length % lastCopied.text.length == 0) {
        multiPaste = []
        for (let i = 0; i < lastCopied.text.length; i++)
          multiPaste.push(doc.splitLines(lastCopied.text[i]))
      }
    } else if (textLines.length == sel.ranges.length) {
      multiPaste = map(textLines, l => [l])
    }
  }

  let updateInput
  // Normal behavior is to insert the new text into every selection
  for (let i = sel.ranges.length - 1; i >= 0; i--) {
    let range = sel.ranges[i]
    let from = range.from(), to = range.to()
    if (range.empty()) {
      if (deleted && deleted > 0) // Handle deletion
        from = Pos(from.line, from.ch - deleted)
      else if (cm.state.overwrite && !paste) // Handle overwrite
        to = Pos(to.line, Math.min(getLine(doc, to.line).text.length, to.ch + lst(textLines).length))
      else if (lastCopied && lastCopied.lineWise && lastCopied.text.join("\n") == inserted)
        from = to = Pos(from.line, 0)
    }
    updateInput = cm.curOp.updateInput
    let changeEvent = {from: from, to: to, text: multiPaste ? multiPaste[i % multiPaste.length] : textLines,
                       origin: origin || (paste ? "paste" : cm.state.cutIncoming ? "cut" : "+input")}
    makeChange(cm.doc, changeEvent)
    signalLater(cm, "inputRead", cm, changeEvent)
  }
  if (inserted && !paste)
    triggerElectric(cm, inserted)

  ensureCursorVisible(cm)
  cm.curOp.updateInput = updateInput
  cm.curOp.typing = true
  cm.state.pasteIncoming = cm.state.cutIncoming = false
}

export function handlePaste(e, cm) {
  let pasted = e.clipboardData && e.clipboardData.getData("Text")
  if (pasted) {
    e.preventDefault()
    if (!cm.isReadOnly() && !cm.options.disableInput)
      runInOp(cm, () => applyTextInput(cm, pasted, 0, null, "paste"))
    return true
  }
}

export function triggerElectric(cm, inserted) {
  // When an 'electric' character is inserted, immediately trigger a reindent
  if (!cm.options.electricChars || !cm.options.smartIndent) return
  let sel = cm.doc.sel

  for (let i = sel.ranges.length - 1; i >= 0; i--) {
    let range = sel.ranges[i]
    if (range.head.ch > 100 || (i && sel.ranges[i - 1].head.line == range.head.line)) continue
    let mode = cm.getModeAt(range.head)
    let indented = false
    if (mode.electricChars) {
      for (let j = 0; j < mode.electricChars.length; j++)
        if (inserted.indexOf(mode.electricChars.charAt(j)) > -1) {
          indented = indentLine(cm, range.head.line, "smart")
          break
        }
    } else if (mode.electricInput) {
      if (mode.electricInput.test(getLine(cm.doc, range.head.line).text.slice(0, range.head.ch)))
        indented = indentLine(cm, range.head.line, "smart")
    }
    if (indented) signalLater(cm, "electricInput", cm, range.head.line)
  }
}

export function copyableRanges(cm) {
  let text = [], ranges = []
  for (let i = 0; i < cm.doc.sel.ranges.length; i++) {
    let line = cm.doc.sel.ranges[i].head.line
    let lineRange = {anchor: Pos(line, 0), head: Pos(line + 1, 0)}
    ranges.push(lineRange)
    text.push(cm.getRange(lineRange.anchor, lineRange.head))
  }
  return {text: text, ranges: ranges}
}

export function disableBrowserMagic(field, spellcheck) {
  field.setAttribute("autocorrect", "off")
  field.setAttribute("autocapitalize", "off")
  field.setAttribute("spellcheck", !!spellcheck)
}

export function hiddenTextarea() {
  let te = elt("textarea", null, null, "position: absolute; bottom: -1em; padding: 0; width: 1px; height: 1em; outline: none")
  let div = elt("div", [te], null, "overflow: hidden; position: relative; width: 3px; height: 0px;")
  // The textarea is kept positioned near the cursor to prevent the
  // fact that it'll be scrolled into view on input from scrolling
  // our fake cursor out of view. On webkit, when wrap=off, paste is
  // very slow. So make the area wide instead.
  if (webkit) te.style.width = "1000px"
  else te.setAttribute("wrap", "off")
  // If border: 0; -- iOS fails to open keyboard (issue #1287)
  if (ios) te.style.border = "1px solid black"
  disableBrowserMagic(te)
  return div
}
