import { scrollbarModel } from "../display/scrollbars.js"
import { wheelEventPixels } from "../display/scroll_events.js"
import { keyMap, keyName, isModifierKey, lookupKey, normalizeKeyMap } from "../input/keymap.js"
import { keyNames } from "../input/keynames.js"
import { Line } from "../line/line_data.js"
import { cmp, Pos } from "../line/pos.js"
import { changeEnd } from "../model/change_measurement.js"
import Doc from "../model/Doc.js"
import { LineWidget } from "../model/line_widget.js"
import { SharedTextMarker, TextMarker } from "../model/mark_text.js"
import { copyState, extendMode, getMode, innerMode, mimeModes, modeExtensions, modes, resolveMode, startState } from "../modes.js"
import { addClass, contains, rmClass } from "../util/dom.js"
import { e_preventDefault, e_stop, e_stopPropagation, off, on, signal } from "../util/event.js"
import { splitLinesAuto } from "../util/feature_detection.js"
import { countColumn, findColumn, isWordCharBasic, Pass } from "../util/misc.js"
import StringStream from "../util/StringStream.js"

import { commands } from "./commands.js"

export function addLegacyProps(CodeMirror) {
  CodeMirror.off = off
  CodeMirror.on = on
  CodeMirror.wheelEventPixels = wheelEventPixels
  CodeMirror.Doc = Doc
  CodeMirror.splitLines = splitLinesAuto
  CodeMirror.countColumn = countColumn
  CodeMirror.findColumn = findColumn
  CodeMirror.isWordChar = isWordCharBasic
  CodeMirror.Pass = Pass
  CodeMirror.signal = signal
  CodeMirror.Line = Line
  CodeMirror.changeEnd = changeEnd
  CodeMirror.scrollbarModel = scrollbarModel
  CodeMirror.Pos = Pos
  CodeMirror.cmpPos = cmp
  CodeMirror.modes = modes
  CodeMirror.mimeModes = mimeModes
  CodeMirror.resolveMode = resolveMode
  CodeMirror.getMode = getMode
  CodeMirror.modeExtensions = modeExtensions
  CodeMirror.extendMode = extendMode
  CodeMirror.copyState = copyState
  CodeMirror.startState = startState
  CodeMirror.innerMode = innerMode
  CodeMirror.commands = commands
  CodeMirror.keyMap = keyMap
  CodeMirror.keyName = keyName
  CodeMirror.isModifierKey = isModifierKey
  CodeMirror.lookupKey = lookupKey
  CodeMirror.normalizeKeyMap = normalizeKeyMap
  CodeMirror.StringStream = StringStream
  CodeMirror.SharedTextMarker = SharedTextMarker
  CodeMirror.TextMarker = TextMarker
  CodeMirror.LineWidget = LineWidget
  CodeMirror.e_preventDefault = e_preventDefault
  CodeMirror.e_stopPropagation = e_stopPropagation
  CodeMirror.e_stop = e_stop
  CodeMirror.addClass = addClass
  CodeMirror.contains = contains
  CodeMirror.rmClass = rmClass
  CodeMirror.keyNames = keyNames
}
