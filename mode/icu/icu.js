// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// language mode for the ICU messageformat syntax
// http://userguide.icu-project.org/formatparse/messages

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("icu", function(config) {
  return {
    startState: function () {
      return {
        stack: [{
          type: "text"
        }]
      };
    },
    copyState: function (state) {
      return {
        stack: state.stack.map(function (frame) {
          return {
            type: frame.type,
            indentation: frame.indentation,
            formatType: frame.formatType,
            inId: frame.inId,
            inFn: frame.inFn,
            inFormat: frame.inFormat
          };
        })
      };
    },
    token: function (stream, state) {
      var current = state.stack[state.stack.length - 1];

      if (current.type === "text") {
        if (stream.eat("#")) {
          var isInsidePlural = state.stack.find(function (frame) {
            return ["selectordinal", "plural"].indexOf(frame.formatType) >= 0;
          });
          if (isInsidePlural) {
            return "builtin";
          }
        }
        if (stream.eat("{")) {
          state.stack.push({
            type: "argument",
            indentation: stream.indentation() + config.indentUnit,
            formatType: null,
            inId: true,
            inFn: false,
            inFormat: false
          });
          return "bracket";
        }
        if (stream.eat("}")) {
          if (state.stack.length > 1) {
            state.stack.pop();
            return "bracket";
          }
        }
        if (stream.eatWhile(/[^{}#]/)) {
          return "string";
        }
      }

      if (current.type === "argument") {
        if (stream.eatSpace()) {
          return null;
        }
        if (current.inId && stream.eatWhile(/[a-zA-Z0-9_]/)) {
          return "variable";
        }
        if (current.inFn && stream.match(/(selectordinal|plural|select|number|date|time)\b/)) {
          current.formatType = stream.current();
          return "keyword";
        }
        if (current.inFormat && stream.match(/offset\b/)) {
          return "keyword";
        }
        if (current.inFormat && stream.eat("=")) {
          return "operator";
        }
        if (current.inFormat && ["selectordinal", "plural"].indexOf(current.formatType) >= 0 && stream.match(/zero|one|two|few|many/)) {
          return "keyword";
        }
        if (current.inFormat && stream.match("other")) {
          return "keyword";
        }
        if (current.inFormat && stream.match(/[0-9]+\b/)) {
          return "number";
        }
        if (current.inFormat && stream.eatWhile(/[a-zA-Z0-9_]/)) {
          return "variable";
        }
        if (current.inFormat && stream.eat("{")) {
          state.stack.push({ type: "text" });
          return "bracket";
        }
        if (stream.eat(",")) {
          if (current.inId) {
            current.inId = false;
            current.inFn = true;
          } else if (current.inFn) {
            current.inFn = false;
            current.inFormat = true;
          }
          return null;
        }
        if (stream.eat("}")) {
          if (state.stack.length > 1) {
            state.stack.pop();
            return "bracket";
          }
        }
      }

      stream.next();
      return null;
    },
    indent: function (state, textAfter) {
      var current = state.stack[state.stack.length - 1];
      if (!current || current.type === "text") {
        return 0;
      }
      if (textAfter[0] === '}') {
        return current.indentation - config.indentUnit;
      }
      return current.indentation;
    }
  };
});

});
