import { signalLater } from "../util/operation_group"
import { ensureCursorVisible } from "../display/scrolling"
import { clipPos, cmp, Pos } from "../line/pos"
import { getLine } from "../line/utils_line"
import { hasHandler, signal, signalCursorActivity } from "../util/event"
import { lst, sel_dontScroll } from "../util/misc"

import { addSelectionToHistory } from "./history"
import { normalizeSelection, Range, Selection, simpleSelection } from "./selection"

// The 'scroll' parameter given to many of these indicated whether
// the new cursor position should be scrolled into view after
// modifying the selection.

// If shift is held or the extend flag is set, extends a range to
// include a given position (and optionally a second position).
// Otherwise, simply returns the range between the given positions.
// Used for cursor motion and such.
export function extendRange(doc, range, head, other) {
  if (doc.cm && doc.cm.display.shift || doc.extend) {
    let anchor = range.anchor
    if (other) {
      let posBefore = cmp(head, anchor) < 0
      if (posBefore != (cmp(other, anchor) < 0)) {
        anchor = head
        head = other
      } else if (posBefore != (cmp(head, other) < 0)) {
        head = other
      }
    }
    return new Range(anchor, head)
  } else {
    return new Range(other || head, head)
  }
}

// Extend the primary selection range, discard the rest.
export function extendSelection(doc, head, other, options) {
  setSelection(doc, new Selection([extendRange(doc, doc.sel.primary(), head, other)], 0), options)
}

// Extend all selections (pos is an array of selections with length
// equal the number of selections)
export function extendSelections(doc, heads, options) {
  let out = []
  for (let i = 0; i < doc.sel.ranges.length; i++)
    out[i] = extendRange(doc, doc.sel.ranges[i], heads[i], null)
  let newSel = normalizeSelection(out, doc.sel.primIndex)
  setSelection(doc, newSel, options)
}

// Updates a single range in the selection.
export function replaceOneSelection(doc, i, range, options) {
  let ranges = doc.sel.ranges.slice(0)
  ranges[i] = range
  setSelection(doc, normalizeSelection(ranges, doc.sel.primIndex), options)
}

// Reset the selection to a single range.
export function setSimpleSelection(doc, anchor, head, options) {
  setSelection(doc, simpleSelection(anchor, head), options)
}

// Give beforeSelectionChange handlers a change to influence a
// selection update.
function filterSelectionChange(doc, sel, options) {
  let obj = {
    ranges: sel.ranges,
    update: function(ranges) {
      this.ranges = []
      for (let i = 0; i < ranges.length; i++)
        this.ranges[i] = new Range(clipPos(doc, ranges[i].anchor),
                                   clipPos(doc, ranges[i].head))
    },
    origin: options && options.origin
  }
  signal(doc, "beforeSelectionChange", doc, obj)
  if (doc.cm) signal(doc.cm, "beforeSelectionChange", doc.cm, obj)
  if (obj.ranges != sel.ranges) return normalizeSelection(obj.ranges, obj.ranges.length - 1)
  else return sel
}

export function setSelectionReplaceHistory(doc, sel, options) {
  let done = doc.history.done, last = lst(done)
  if (last && last.ranges) {
    done[done.length - 1] = sel
    setSelectionNoUndo(doc, sel, options)
  } else {
    setSelection(doc, sel, options)
  }
}

// Set a new selection.
export function setSelection(doc, sel, options) {
  setSelectionNoUndo(doc, sel, options)
  addSelectionToHistory(doc, doc.sel, doc.cm ? doc.cm.curOp.id : NaN, options)
}

export function setSelectionNoUndo(doc, sel, options) {
  if (hasHandler(doc, "beforeSelectionChange") || doc.cm && hasHandler(doc.cm, "beforeSelectionChange"))
    sel = filterSelectionChange(doc, sel, options)

  let bias = options && options.bias ||
    (cmp(sel.primary().head, doc.sel.primary().head) < 0 ? -1 : 1)
  setSelectionInner(doc, skipAtomicInSelection(doc, sel, bias, true))

  if (!(options && options.scroll === false) && doc.cm)
    ensureCursorVisible(doc.cm)
}

function setSelectionInner(doc, sel) {
  if (sel.equals(doc.sel)) return

  doc.sel = sel

  if (doc.cm) {
    doc.cm.curOp.updateInput = doc.cm.curOp.selectionChanged = true
    signalCursorActivity(doc.cm)
  }
  signalLater(doc, "cursorActivity", doc)
}

// Verify that the selection does not partially select any atomic
// marked ranges.
export function reCheckSelection(doc) {
  setSelectionInner(doc, skipAtomicInSelection(doc, doc.sel, null, false), sel_dontScroll)
}

// Return a selection that does not partially select any atomic
// ranges.
function skipAtomicInSelection(doc, sel, bias, mayClear) {
  let out
  for (let i = 0; i < sel.ranges.length; i++) {
    let range = sel.ranges[i]
    let old = sel.ranges.length == doc.sel.ranges.length && doc.sel.ranges[i]
    let newAnchor = skipAtomic(doc, range.anchor, old && old.anchor, bias, mayClear)
    let newHead = skipAtomic(doc, range.head, old && old.head, bias, mayClear)
    if (out || newAnchor != range.anchor || newHead != range.head) {
      if (!out) out = sel.ranges.slice(0, i)
      out[i] = new Range(newAnchor, newHead)
    }
  }
  return out ? normalizeSelection(out, sel.primIndex) : sel
}

function skipAtomicInner(doc, pos, oldPos, dir, mayClear) {
  let line = getLine(doc, pos.line)
  if (line.markedSpans) for (let i = 0; i < line.markedSpans.length; ++i) {
    let sp = line.markedSpans[i], m = sp.marker
    if ((sp.from == null || (m.inclusiveLeft ? sp.from <= pos.ch : sp.from < pos.ch)) &&
        (sp.to == null || (m.inclusiveRight ? sp.to >= pos.ch : sp.to > pos.ch))) {
      if (mayClear) {
        signal(m, "beforeCursorEnter")
        if (m.explicitlyCleared) {
          if (!line.markedSpans) break
          else {--i; continue}
        }
      }
      if (!m.atomic) continue

      if (oldPos) {
        let near = m.find(dir < 0 ? 1 : -1), diff
        if (dir < 0 ? m.inclusiveRight : m.inclusiveLeft)
          near = movePos(doc, near, -dir, near && near.line == pos.line ? line : null)
        if (near && near.line == pos.line && (diff = cmp(near, oldPos)) && (dir < 0 ? diff < 0 : diff > 0))
          return skipAtomicInner(doc, near, pos, dir, mayClear)
      }

      let far = m.find(dir < 0 ? -1 : 1)
      if (dir < 0 ? m.inclusiveLeft : m.inclusiveRight)
        far = movePos(doc, far, dir, far.line == pos.line ? line : null)
      return far ? skipAtomicInner(doc, far, pos, dir, mayClear) : null
    }
  }
  return pos
}

// Ensure a given position is not inside an atomic range.
export function skipAtomic(doc, pos, oldPos, bias, mayClear) {
  let dir = bias || 1
  let found = skipAtomicInner(doc, pos, oldPos, dir, mayClear) ||
      (!mayClear && skipAtomicInner(doc, pos, oldPos, dir, true)) ||
      skipAtomicInner(doc, pos, oldPos, -dir, mayClear) ||
      (!mayClear && skipAtomicInner(doc, pos, oldPos, -dir, true))
  if (!found) {
    doc.cantEdit = true
    return Pos(doc.first, 0)
  }
  return found
}

function movePos(doc, pos, dir, line) {
  if (dir < 0 && pos.ch == 0) {
    if (pos.line > doc.first) return clipPos(doc, Pos(pos.line - 1))
    else return null
  } else if (dir > 0 && pos.ch == (line || getLine(doc, pos.line)).text.length) {
    if (pos.line < doc.first + doc.size - 1) return Pos(pos.line + 1, 0)
    else return null
  } else {
    return new Pos(pos.line, pos.ch + dir)
  }
}

export function selectAll(cm) {
  cm.setSelection(Pos(cm.firstLine(), 0), Pos(cm.lastLine()), sel_dontScroll)
}
