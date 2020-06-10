import * as modesMethods from "../../../src/modes.js"
import StringStream from "../../../src/util/StringStream.js"

var root = typeof globalThis !== 'undefined' ? globalThis : window;
root.CodeMirror = Object.assign({}, modesMethods, {StringStream: StringStream});

(function() {
"use strict";

function splitLines(string){ return string.split(/\r?\n|\r/); };

CodeMirror.registerHelper = CodeMirror.registerGlobalHelper = Math.min;

// Minimal default mode.
CodeMirror.defineMode("null", () => ({token: stream => stream.skipToEnd()}))
CodeMirror.defineMIME("text/plain", "null")

CodeMirror.runMode = function (string, modespec, callback, options) {
  var mode = CodeMirror.getMode({ indentUnit: 2 }, modespec);
  var tabSize = (options && options.tabSize) || 4;

  if (callback.appendChild) {
    var ie = /MSIE \d/.test(navigator.userAgent);
    var ie_lt9 = ie && (document.documentMode == null || document.documentMode < 9);
    var node = callback, col = 0;
    node.innerHTML = "";
    callback = function (text, style) {
      if (text == "\n") {
        // Emitting LF or CRLF on IE8 or earlier results in an incorrect display.
        // Emitting a carriage return makes everything ok.
        node.appendChild(document.createTextNode(ie_lt9 ? '\r' : text));
        col = 0;
        return;
      }
      var content = "";
      // replace tabs
      for (var pos = 0; ;) {
        var idx = text.indexOf("\t", pos);
        if (idx == -1) {
          content += text.slice(pos);
          col += text.length - pos;
          break;
        } else {
          col += idx - pos;
          content += text.slice(pos, idx);
          var size = tabSize - col % tabSize;
          col += size;
          for (var i = 0; i < size; ++i) content += " ";
          pos = idx + 1;
        }
      }
      if (style) {
        var sp = node.appendChild(document.createElement("span"));
        sp.className = "cm-" + style.replace(/ +/g, " cm-");
        sp.appendChild(document.createTextNode(content));
      } else {
        node.appendChild(document.createTextNode(content));
      }
    };
  }

  var lines = splitLines(string), state = (options && options.state) || CodeMirror.startState(mode);
  var oracle = {lookAhead: function(n) { return lines[i + n] }}
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
})();
  