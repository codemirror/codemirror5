// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("bqn", function() {
  var builtInMonadicOperators = {
    "`": "scan",
    "˜": "selfSwap",
    "˘": "cells",
    "¨": "each",
    "⁼": "undo",
    "⌜": "table",
    "´": "fold",
    "˝": "insert",
    "˙": "constant"
  }

  var builtInDiadicOperators = {
    "∘": "atop",
    "⊸": "beforeBind",
    "⟜": "afterBind",
    "○": "over",
    "⌾": "under",
    "⎉": "rank",
    "⚇": "depth",
    "⍟": "repeat",
    "⊘": "valences",
    "◶": "choose",
    // "⎊": "",
  }
  var builtInFuncs = {
    "+": ["conjugate", "add"],
    "−": ["negate", "subtract"],
    "×": ["sign", "multiply"],
    "÷": ["reciprocal", "divide"],
    "⋆": ["exponential", "power"],
    "√": ["squareRoot", "root"],
    "⌊": ["floor", "minimum"],
    "⌈": ["ceiling", "maximum"],
    "∧": ["sortUp", "and"],
    "∨": ["sortDown", "or"],
    "¬": ["not", "span"],
    "∣": ["absoluteValue", "modulus"],
    "≤": [null, "lessThanOrEqualTo"],
    "<": ["enclose", "lessThan"],
    ">": ["merge", "greaterThan"],
    "≥": [null, "greaterThanOrEqualTo"],
    "=": ["rank", "equals"],
    "≠": ["length", "notEquals"],
    "≡": ["depth", "match"],
    "≢": ["shape", "notMatch"],
    "⊣": ["identity", "left"],
    "⊢": ["identity", "right"],
    "⥊": ["deshape", "reshape"],
    "∾": ["join", "joinTo"],
    "≍": ["solo", "couple"],
    "⋈": ["enlist", "pair"],
    "↑": ["prefixes", "take"],
    "↓": ["suffixes", "drop"],
    "↕": ["range", "windows"],
    "»": ["nudge", "shiftBefore"],
    "«": ["nudgeBack", "shiftAfter"],
    "⌽": ["reverse", "rotate"],
    "⍉": ["transpose", "reorderAxes"],
    "/": ["indices", "replicate"],
    "⍋": ["gradeUp", "binsUp"],
    "⍒": ["gradeDown", "binsDown"],
    "⊏": ["firstCell", "select"],
    "⊑": ["first", "pick"],
    "⊐": ["classify", "indexOf"],
    "⊒": ["occurrenceCount", "progressiveIndexOf"],
    "∊": ["markFirsts", "memberOf"],
    "⍷": ["deduplicate", "find"],
    "⊔": ["groupIndices", "group"],
    "!": ["assert", "assertWithMessage"],
  };

  var isFunction = /[+−×÷⋆√⌊⌈∧∨¬∣≤<>≥=≠≡≢⊣⊢⥊∾≍⋈↑↓↕»«⌽⍉/⍋⍒⊏⊑⊐⊒∊⍷⊔!]/;
  var isMonadicOperator = /[`˜˘¨⁼⌜´˝˙]/;
  var isDiadicOperator = /[∘⊸⟜○⌾⎉⚇⍟⊘◶⎊]/;
  var isComment = /[#].*$/;
  var isNumber = /[0123456789π∞]/;

  var stringEater = function(type) {
    var prev;
    prev = false;
    return function(c) {
      prev = c;
      if (c === type) {
        return prev === "\\";
      }
      return true;
    };
  };
  return {
    startState: function() {
      return {
        prev: false,
        func: false,
        op: false,
        string: false,
        escape: false
      };
    },
    token: function(stream, state) {
      var ch, funcName, operatorName;
      if (stream.eatSpace()) {
        return null;
      }
      ch = stream.next();
      if (ch === '"' || ch === "'") {
        stream.eatWhile(stringEater(ch));
        stream.next();
        state.prev = true;
        return "string";
      }
      if (/[\[{\(]/.test(ch)) {
        state.prev = false;
        return null;
      }
      if (/[\]}\)]/.test(ch)) {
        state.prev = true;
        return null;
      }
      if (isMonadicOperator.test(ch)) {
        state.prev = false;
        operatorName = "bqn-monadic-operator" + builtInMonadicOperators[ch];
        return "operator " + operatorName;
      }
      if (isDiadicOperator.test(ch)) {
        state.prev = false;
        operatorName = "bqn-diadic-operator-" + builtInDiadicOperators[ch];
        return "operator " + operatorName;
      }
      if (isNumber.test(ch)) {
        stream.eatWhile(/[\w\.]/);
        return "number";
      }
      if (isFunction.test(ch)) {
        funcName = "bqn-";
        if (builtInFuncs[ch] != null) {
          if (state.prev) {
            funcName += builtInFuncs[ch][1];
          } else {
            funcName += builtInFuncs[ch][0];
          }
        }
        state.func = true;
        state.prev = false;
        return "function " + funcName;
      }
      if (isComment.test(ch)) {
        stream.skipToEnd();
        return "comment";
      }
      stream.eatWhile(/[\w\$_]/);
      state.prev = true;
      return "keyword";
    }
  };
});

CodeMirror.defineMIME("text/bqn", "bqn");

});
