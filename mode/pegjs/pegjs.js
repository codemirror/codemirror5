// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/5/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../javascript/javascript"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../javascript/javascript"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("pegjs", function (config) {
  var jsMode = CodeMirror.getMode(config, "javascript");

  function identifier(stream) {
    return stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
  }

  function peg(stream, state) {
    if (stream)
    //check for state changes
    if (!state.inString && !state.inComment && (["'", '"'].includes(stream.peek()))) {
      state.stringType = stream.peek();
      stream.next(); // Skip quote
      state.inString = true; // Update state
    }
    if (!state.inString && !state.inComment && stream.match('/*')) {
      state.inComment = true;
    }

    //return state
    if (state.inString) {
      while (state.inString && !stream.eol()) {
        if (stream.peek() === state.stringType) {
          stream.next(); // Skip quote
          state.inString = false; // Clear flag
        } else if (stream.peek() === '\\') {
          stream.next();
          stream.next();
        } else {
          stream.match(/^.[^\\\"\']*/);
        }
      }
      return state.lhs ? "property string" : "string"; // Token style
    } else if (state.inComment) {
      while (state.inComment && !stream.eol()) {
        if (stream.match('*/')) {
          state.inComment = false; // Clear flag
        } else {
          stream.match(/^.[^\*]*/);
        }
      }
      return "comment";
    } else if (state.inCharacterClass) {
      while (state.inCharacterClass && !stream.eol()) {
        if (!(stream.match(/^[^\]\\]+/) || stream.match(/^\\./))) {
          state.inCharacterClass = false;
        }
      }
    } else if (stream.peek() === '[') {
      stream.next();
      state.inCharacterClass = true;
      return 'bracket';
    } else if (stream.match('//')) {
      stream.skipToEnd();
      return "comment";
    } else if (stream.peek() === '{') {
      state.token = function(stream, state) {
        var char = stream.peek();
        if (char === '{') {
          state.braced++;
        } else if (char == '}') {
          if (state.braced > 0) {
            state.braced--;
          } else {
            stream.eat("}");
            state.token = peg;
            state.localState = state.localMode = null;
            return null;
          }
        }
        return state.localMode.token(stream, state.localState);
      };
      state.braced = 0;
      state.localMode = jsMode;
      state.localState = CodeMirror.startState(jsMode);
    } else if (identifier(stream)) {
      if (stream.peek() === ':') {
        return 'variable';
      }
      return 'variable-2';
    } else if (['[', '\x5d', '(', ')'].indexOf(stream.peek()) != -1) {
      stream.next();
      return 'bracket';
    } else if (!stream.eatSpace()) {
      stream.next();
    }
    return null;
  }

  return {
    startState: function () {
      return {
        token: peg,
        inString: false,
        stringType: null,
        inComment: false,
        inCharacterClass: false,
        braced: 0,
        lhs: true,
        localMode: null,
        localState: null
      };
    },
    token: function (stream, state) {
      return state.token(stream, state);
    }
  };
}, "javascript");

});
