import { signalLater } from "../util/operation_group"
import { restartBlink } from "../display/selection"
import { isModifierKey, keyName, lookupKey } from "../input/keymap"
import { eventInWidget } from "../measurement/widgets"
import { ie, ie_version, mac, presto } from "../util/browser"
import { activeElt, addClass, rmClass } from "../util/dom"
import { e_preventDefault, off, on, signalDOMEvent } from "../util/event"
import { hasCopyEvent } from "../util/feature_detection"
import { Delayed, Pass } from "../util/misc"

import { commands } from "./commands"

// Run a handler that was bound to a key.
function doHandleBinding(cm, bound, dropShift) {
  if (typeof bound == "string") {
    bound = commands[bound]
    if (!bound) return false
  }
  // Ensure previous input has been read, so that the handler sees a
  // consistent view of the document
  cm.display.input.ensurePolled()
  var prevShift = cm.display.shift, done = false
  try {
    if (cm.isReadOnly()) cm.state.suppressEdits = true
    if (dropShift) cm.display.shift = false
    done = bound(cm) != Pass
  } finally {
    cm.display.shift = prevShift
    cm.state.suppressEdits = false
  }
  return done
}

function lookupKeyForEditor(cm, name, handle) {
  for (var i = 0; i < cm.state.keyMaps.length; i++) {
    var result = lookupKey(name, cm.state.keyMaps[i], handle, cm)
    if (result) return result
  }
  return (cm.options.extraKeys && lookupKey(name, cm.options.extraKeys, handle, cm))
    || lookupKey(name, cm.options.keyMap, handle, cm)
}

var stopSeq = new Delayed
function dispatchKey(cm, name, e, handle) {
  var seq = cm.state.keySeq
  if (seq) {
    if (isModifierKey(name)) return "handled"
    stopSeq.set(50, function() {
      if (cm.state.keySeq == seq) {
        cm.state.keySeq = null
        cm.display.input.reset()
      }
    })
    name = seq + " " + name
  }
  var result = lookupKeyForEditor(cm, name, handle)

  if (result == "multi")
    cm.state.keySeq = name
  if (result == "handled")
    signalLater(cm, "keyHandled", cm, name, e)

  if (result == "handled" || result == "multi") {
    e_preventDefault(e)
    restartBlink(cm)
  }

  if (seq && !result && /\'$/.test(name)) {
    e_preventDefault(e)
    return true
  }
  return !!result
}

// Handle a key from the keydown event.
function handleKeyBinding(cm, e) {
  var name = keyName(e, true)
  if (!name) return false

  if (e.shiftKey && !cm.state.keySeq) {
    // First try to resolve full name (including 'Shift-'). Failing
    // that, see if there is a cursor-motion command (starting with
    // 'go') bound to the keyname without 'Shift-'.
    return dispatchKey(cm, "Shift-" + name, e, function(b) {return doHandleBinding(cm, b, true)})
        || dispatchKey(cm, name, e, function(b) {
             if (typeof b == "string" ? /^go[A-Z]/.test(b) : b.motion)
               return doHandleBinding(cm, b)
           })
  } else {
    return dispatchKey(cm, name, e, function(b) { return doHandleBinding(cm, b) })
  }
}

// Handle a key from the keypress event
function handleCharBinding(cm, e, ch) {
  return dispatchKey(cm, "'" + ch + "'", e,
                     function(b) { return doHandleBinding(cm, b, true) })
}

var lastStoppedKey = null
export function onKeyDown(e) {
  var cm = this
  cm.curOp.focus = activeElt()
  if (signalDOMEvent(cm, e)) return
  // IE does strange things with escape.
  if (ie && ie_version < 11 && e.keyCode == 27) e.returnValue = false
  var code = e.keyCode
  cm.display.shift = code == 16 || e.shiftKey
  var handled = handleKeyBinding(cm, e)
  if (presto) {
    lastStoppedKey = handled ? code : null
    // Opera has no cut event... we try to at least catch the key combo
    if (!handled && code == 88 && !hasCopyEvent && (mac ? e.metaKey : e.ctrlKey))
      cm.replaceSelection("", null, "cut")
  }

  // Turn mouse into crosshair when Alt is held on Mac.
  if (code == 18 && !/\bCodeMirror-crosshair\b/.test(cm.display.lineDiv.className))
    showCrossHair(cm)
}

function showCrossHair(cm) {
  var lineDiv = cm.display.lineDiv
  addClass(lineDiv, "CodeMirror-crosshair")

  function up(e) {
    if (e.keyCode == 18 || !e.altKey) {
      rmClass(lineDiv, "CodeMirror-crosshair")
      off(document, "keyup", up)
      off(document, "mouseover", up)
    }
  }
  on(document, "keyup", up)
  on(document, "mouseover", up)
}

export function onKeyUp(e) {
  if (e.keyCode == 16) this.doc.sel.shift = false
  signalDOMEvent(this, e)
}

export function onKeyPress(e) {
  var cm = this
  if (eventInWidget(cm.display, e) || signalDOMEvent(cm, e) || e.ctrlKey && !e.altKey || mac && e.metaKey) return
  var keyCode = e.keyCode, charCode = e.charCode
  if (presto && keyCode == lastStoppedKey) {lastStoppedKey = null; e_preventDefault(e); return}
  if ((presto && (!e.which || e.which < 10)) && handleKeyBinding(cm, e)) return
  var ch = String.fromCharCode(charCode == null ? keyCode : charCode)
  // Some browsers fire keypress events for backspace
  if (ch == "\x08") return
  if (handleCharBinding(cm, e, ch)) return
  cm.display.input.onKeyPress(e)
}
