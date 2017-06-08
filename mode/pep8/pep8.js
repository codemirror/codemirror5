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

  CodeMirror.defineSimpleMode("pep8", {
    start: [
      // Instructions
      {regex: /(?:stop|rettr|movspa|movflga|br|brle|brlt|breq|brne|brge|brgt|brv|brc|call|nop|deci|deco|stro|chari|charo|addsp|subsp)\b/i, token: "keyword"},

      // Instructions with register
      {regex: /(?:not|neg|asl|asr|rol|ror|nop|add|sub|and|or|cp|ld|ldbyte|st|stbyte)(n|z|v|c|a|x|pp|co)\b/i, token: "keyword"},

      // Instructions with numbers
      {regex: /(?:ret)[0-9]\b/i, token: "keyword"},

      // Directives
      {regex: /(?:\.byte|\.word|\.block|\.ascii|\.addrss|\.equate|\.end|\.burn)\b/i, token: "def"},

      // Comments
      {regex: /;.*/, token: "comment"},

      // Tags
      {regex: /^[a-z][a-z0-9_]{0,9}:/i, token: "tag"}
    ]
  });
});
