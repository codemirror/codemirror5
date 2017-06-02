// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// By Alexandre Terrasa.

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../../addon/mode/simple"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../../addon/mode/simple"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineSimpleMode("ocl", {
    start: [
      // OCL keywords
      {regex: /(?:context|package|endpackage|if|then|else|endif|let|in|true|false|invalid|null|not|and|or|xor|implies)\b/, token: "keyword"},

      // USE-OCL keywords
      {regex: /(?:class|enum|end|association|between|role|model|constraints|attributes|operations)\b/, token: "keyword"},

      // OCL constraints
      {regex: /(?:inv|pre|post|body|init|derive|def)\b/, token: "tag"},

      // Special keywords
      {regex: /(?:self|result|@pre|Set|OrderedSet|Sequence|Bag)\b/, token: "def"},

      // Comments
      {regex: /--.*/, token: "comment"},

      // String
      { regex: /'(?:[^\\']|\\.)*'?/, token: "string" },

      // Numerical
      { regex: /\d+/, token: "number" }
    ]
  });
});
