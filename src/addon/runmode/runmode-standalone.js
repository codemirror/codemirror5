import * as modesMethods from "../../../src/modes.js"
import StringStream from "../../../src/util/StringStream.js"

// Create a minimal CodeMirror needed to use runMode, and assign to root.
var root = typeof globalThis !== 'undefined' ? globalThis : window;
root.CodeMirror = Object.assign({}, modesMethods, {StringStream: StringStream});

// Minimal default mode.
CodeMirror.defineMode("null", () => ({token: stream => stream.skipToEnd()}))
CodeMirror.defineMIME("text/plain", "null")

CodeMirror.registerHelper = CodeMirror.registerGlobalHelper = Math.min;
CodeMirror.splitLines = function(string) { return string.split(/\r?\n|\r/); };  

CodeMirror.defaults = { indentUnit: 2 };