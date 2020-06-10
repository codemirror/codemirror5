import * as modesMethods from "../../../src/modes.js"
import StringStream from "../../../src/util/StringStream.js"

export default CodeMirror = Object.assign({}, modesMethods, {StringStream: StringStream});

// Minimal default mode.
CodeMirror.defineMode("null", () => ({token: stream => stream.skipToEnd()}))
CodeMirror.defineMIME("text/plain", "null")

CodeMirror.registerHelper = CodeMirror.registerGlobalHelper = Math.min;
CodeMirror.splitLines = function(string) { return string.split(/\r?\n|\r/); };

CodeMirror.runMode = function(string, modespec, callback, options) {
  var mode = CodeMirror.getMode({ indentUnit: 2 }, modespec);
  var tabSize = (options && options.tabSize) || 4;

  var lines = CodeMirror.splitLines(string), state = (options && options.state) || CodeMirror.startState(mode);
  var oracle = {lookAhead: function(n) { return lines[i + n] }, baseToken: function() {}}
  for (var i = 0, e = lines.length; i < e; ++i) {
    if (i) callback("\n");
    var stream = new CodeMirror.StringStream(lines[i], tabSize, oracle);
    if (!stream.string && mode.blankLine) mode.blankLine(state);
    while (!stream.eol()) {
      var style = mode.token(stream, state);
      callback(stream.current(), style, i, stream.start, state);
      stream.start = stream.pos;
    }
  }
};

require.cache[require.resolve("../../lib/codemirror")] = require.cache[require.resolve("./runmode.node")];
require.cache[require.resolve("../../addon/runmode/runmode")] = require.cache[require.resolve("./runmode.node")];  