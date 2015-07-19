// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

	CodeMirror.defineSimpleMode("rust",{
		start:[
			{regex: /"(?:[^\\]|\\.)*?"/, token: "string"},
			{regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i,
			 token: "number"},
			{regex: /\b(?:abstract|alignof|as|box|break|continue|const|crate|do|else|enum|extern|for|final|if|impl|in|let|loop|macro|match|mod|move|mut|offsetof|override|priv|proc|pub|pure|ref|return|self|sizeof|static|struct|super|trait|type|typeof|unsafe|unsized|use|virtual|where|while|yield)\b/,
			 token: "kw"},
			{regex:			/\b(?:Self|isize|usize|char|bool|u8|u16|u32|u64|f16|f32|f64|i8|i16|i32|i64|str)/,
			 token: "atom"
			},
			{regex:/\b(fn)(\s+)([a-zA-Z_][a-zA-Z0-9_]*)/,
			 token: ["kw", null ,"ident"]
			},
			{regex: /[a-z$][\w$]*!/,token: "macro"},
			{regex: /[a-z$][\w$]*/, token: "variable"},
			{regex: /[\{\[\(]/, indent: true},
			{regex: /[\}\]\)]/, dedent: true},
		],

		comment: [
			{regex: /.*?\*\//, token: "comment", next: "start"},
			{regex: /.*/, token: "comment"}
		],

		meta: {
			lineComment: "//"
		}
	});


CodeMirror.defineMIME("text/x-rustsrc", "rust");

});
