import * as modesMethods from "../../../src/modes.js"
import StringStream from "../../../src/util/StringStream.js"

// Create a minimal CodeMirror needed to use runMode.
export default CodeMirror = Object.assign({}, modesMethods, {StringStream: StringStream});

// Shim library CodeMirror with the minimal CodeMirror defined above. 
require.cache[require.resolve("../../lib/codemirror")] = require.cache[require.resolve("./runmode.node")];
require.cache[require.resolve("../../addon/runmode/runmode")] = require.cache[require.resolve("./runmode.node")];  

// Minimal default mode.
CodeMirror.defineMode("null", () => ({token: stream => stream.skipToEnd()}))
CodeMirror.defineMIME("text/plain", "null")

CodeMirror.registerHelper = CodeMirror.registerGlobalHelper = Math.min;
CodeMirror.splitLines = function(string) { return string.split(/\r?\n|\r/); };

CodeMirror.defaults = { indentUnit: 2 };
