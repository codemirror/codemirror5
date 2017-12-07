// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../../addon/mode/simple"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../../addon/mode/simple"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

	CodeMirror.defineMode("jsonnet", function() {
    return {
      token: function(stream, state) {
        // Special states:
        if (state.cComment) {
          if (stream.match(/\*\//)) {
            state.cComment = false;
            return "comment";
          }
          stream.next();
          return "comment";
        }
        if (state.textBlock) {
          if (state.textBlockIndent == null) {
            state.textBlockIndent = stream.indentation();
          }
          if (stream.indentation() >= state.textBlockIndent) {
            stream.skipToEnd();
            return "string";
          }
          if (stream.match(/\s*\|\|\|/)) {
            state.textBlock = false;
            return "string";
          }
          stream.next();
          return "error";
        }

        if (state.string || state.importString) {
          let mode = state.string ? "string" : "meta";
          if (state.stringRaw) {
            if (stream.match(state.stringSingle ? /''/ : /""/)) {
              return "string-2";
            }
          } else {
            if (stream.match(/\\[\\"'bfnrt0]/)) {
              return "string-2";
            }
            if (stream.match(/\\u[0-9a-fA-F]{4}/)) {
              return "string-2";
            }
            if (stream.match(/\\/)) {
              return "error";
            }
          }
          if (stream.match(state.stringSingle ? /'/ : /"/)) {
            state.string = false;
            state.importString = false;
            state.stringRaw = false;
            state.stringDouble = false;
            return mode;
          }
          stream.next();
          return mode;
        }

        // Comments.
        if (stream.match(/\/\//) || stream.match(/#/)) {
          stream.skipToEnd();
          return "comment";
        }
        if (stream.match(/\/\*/)) {
          state.cComment = true;
          return "comment";
        }

        if (stream.match(/import(?:str)?\s*"/)) {
          state.importString = true;
          state.stringSingle = false;
          state.stringRaw = false;
          return "meta";
        }

        if (stream.match(/import(?:str)?\s*'/)) {
          state.importString = true;
          state.stringSingle = true;
          state.stringRaw = false;
          return "meta";
        }

        if (stream.match(/import(?:str)?\s*@"/)) {
          state.importString = true;
          state.stringSingle = false;
          state.stringRaw = true;
          return "meta";
        }

        if (stream.match(/import(?:str)?\s*@'/)) {
          state.importString = true;
          state.stringSingle = true;
          state.stringRaw = true;
          return "meta";
        }

        if (stream.match(/"/)) {
          state.string = true;
          state.stringSingle = false;
          state.stringRaw = false;
          return "string";
        }

        if (stream.match(/'/)) {
          state.string = true;
          state.stringSingle = true;
          state.stringRaw = false;
          return "string";
        }

        if (stream.match(/@"/)) {
          state.string = true;
          state.stringSingle = false;
          state.stringRaw = true;
          return "string";
        }

        if (stream.match(/@'/)) {
          state.string = true;
          state.stringSingle = true;
          state.stringRaw = true;
          return "string";
        }

        if (stream.match(/\|\|\|/)) {
          state.textBlock = true;
          state.textBlockCol = null;
          return "string";
        }

        if (stream.match(/local\b/)) return "keyword";
        if (stream.match(/\$\b/)) return "keyword";
        if (stream.match(/(?:self|super)\b/)) return "keyword";
        if (stream.match(/(?:assert|function|if|then|else|for|in)\b/)) return "keyword";
        if (stream.match(/tailstrict\b/)) return "keyword";
        if (stream.match(/error\b/)) return "keyword";

        if (stream.match(/(?:true|false|null)\b/)) return "atom";
        if (stream.match(/(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i)) return "number";
        if (stream.match(/[-+\/*=<>!&~^|$%]+/)) return "operator";

        stream.next();

        return null;
      },
      startState: function() {
        return {
          cComment: false,
          textBlock: false,
          string: false,
          importString: false,
          string: false,
          stringSingle: false,
          stringRaw: false,
        };
      },
    };
	});
});

CodeMirror.defineMIME("text/jsonnet", "jsonnet");
CodeMirror.defineMIME("text/x-jsonnet", "jsonnet");

