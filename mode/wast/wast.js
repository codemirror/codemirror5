// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../../addon/mode/simple"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../../addon/mode/simple"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineSimpleMode('wast', {
  start: [
    {regex: /[+\-]?(?:nan(?::0x[0-9a-fA-F]+)?|infinity|inf|0x[0-9a-fA-F]+\.?[0-9a-fA-F]*p[+\/-]?\d+|\d+(?:\.\d*)?[eE][+\-]?\d*|\d+\.\d*|0x[0-9a-fA-F]+|\d+)/, token: "number"},
    {regex: /mut|nop|block|if|then|else|loop|br_if|br_table|br|call(_indirect)?|drop|end|return(_call(_indirect)?)?|local\.(get|set|tee)|global\.(get|set)|i(32|64)\.(store(8|16)|(load(8|16)_[su]))|i64\.(load32_[su]|store32)|[fi](32|64)\.(const|load|store)|f(32|64)\.(abs|add|ceil|copysign|div|eq|floor|[gl][et]|max|min|mul|nearest|neg?|sqrt|sub|trunc)|i(32|64)\.(a[dn]d|c[lt]z|(div|rem)_[su]|eqz?|[gl][te]_[su]|mul|ne|popcnt|rot[lr]|sh(l|r_[su])|sub|x?or)|i64\.extend_[su]_i32|i32\.wrap_i64|i(32|64)\.trunc_f(32|64)_[su]|f(32|64)\.convert_i(32|64)_[su]|f64\.promote_f32|f32\.demote_f64|f32\.reinterpret_i32|i32\.reinterpret_f32|f64\.reinterpret_i64|i64\.reinterpret_f64|select|unreachable|current_memory|memory\.(size|grow)|type|func|param|result|local|global|module|table|memory|start|elem|data|align|offset|import|export|atomic\.notify|i64\.atomic\.(load32_u|store32|rmw32\.(a[dn]d|sub|x?or|(cmp)?xchg)_u)|i(32|64)\.atomic\.(wait|load((8|16)_u)?|store(8|16)?|rmw(\.(a[dn]d|sub|x?or|(cmp)?xchg)|(8|16)\.(a[dn]d|sub|x?or|(cmp)?xchg)_u))/, token: "keyword"},
    {regex: /\b(anyfunc|[fi](32|64))\b/, token: "atom"},
    {regex: /\$([a-zA-Z0-9_`\+\-\*\/\\\^~=<>!\?@#$%&|:\.]+)/, token: "variable-2"},
    {regex: /"(?:[^"\\\x00-\x1f\x7f]|\\[nt\\'"]|\\[0-9a-fA-F][0-9a-fA-F])*"/, token: "string"},
    {regex: /\(;.*?/, token: "comment", next: "comment"},
    {regex: /;;.*$/, token: "comment"},
    {regex: /\(/, indent: true},
    {regex: /\)/, dedent: true},
  ],

  comment: [
    {regex: /.*?;\)/, token: "comment", next: "start"},
    {regex: /.*/, token: "comment"},
  ],

  meta: {
    dontIndentStates: ['comment'],
  },
});

// https://github.com/WebAssembly/design/issues/981 mentions text/webassembly,
// which seems like a reasonable choice, although it's not standard right now.
CodeMirror.defineMIME("text/webassembly", "wast");

});
