// EDITOR CONSTRUCTOR

import { CodeMirror } from "./CodeMirror"
export { CodeMirror } from "./CodeMirror"

import { eventMixin } from "../util/event"
import { indexOf } from "../util/misc"

import { defineOptions } from "./options"

defineOptions(CodeMirror)

import addEditorMethods from "./methods"

addEditorMethods(CodeMirror)

import Doc from "../model/Doc"

// Set up methods on CodeMirror's prototype to redirect to the editor's document.
let dontDelegate = "iter insert remove copy getEditor constructor".split(" ")
for (let prop in Doc.prototype) if (Doc.prototype.hasOwnProperty(prop) && indexOf(dontDelegate, prop) < 0)
  CodeMirror.prototype[prop] = (function(method) {
    return function() {return method.apply(this.doc, arguments)}
  })(Doc.prototype[prop])

eventMixin(Doc)

// INPUT HANDLING

import ContentEditableInput from "../input/ContentEditableInput"
import TextareaInput from "../input/TextareaInput"
CodeMirror.inputStyles = {"textarea": TextareaInput, "contenteditable": ContentEditableInput}

// MODE DEFINITION AND QUERYING

import { defineMIME, defineMode } from "../modes"

// Extra arguments are stored as the mode's dependencies, which is
// used by (legacy) mechanisms like loadmode.js to automatically
// load a mode. (Preferred mechanism is the require/define calls.)
CodeMirror.defineMode = function(name/*, mode, …*/) {
  if (!CodeMirror.defaults.mode && name != "null") CodeMirror.defaults.mode = name
  defineMode.apply(this, arguments)
}

CodeMirror.defineMIME = defineMIME

// Minimal default mode.
CodeMirror.defineMode("null", () => ({token: stream => stream.skipToEnd()}))
CodeMirror.defineMIME("text/plain", "null")

// EXTENSIONS

CodeMirror.defineExtension = (name, func) => {
  CodeMirror.prototype[name] = func
}
CodeMirror.defineDocExtension = (name, func) => {
  Doc.prototype[name] = func
}

import { fromTextArea } from "./fromTextArea"

CodeMirror.fromTextArea = fromTextArea

import { addLegacyProps } from "./legacy"

addLegacyProps(CodeMirror)

CodeMirror.version = "5.31.0"
