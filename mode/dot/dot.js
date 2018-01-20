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

    CodeMirror.defineMode("dot", function (config) {
	return {
	    startState: function () {
		return {indent_level: 0};
	    },

	    token: function (stream, state) {
		stream.eatSpace();
		console.log(state);
		if (state.looking_for == "graphname" && stream.match(/[^\W]+/, false)) {
		    state.looking_for = null;
		    stream.match(/[^\W]+/);
		    return "variable-2";
		} else if (stream.match(/{\W*$/)) {
		    state.indent_level += 1;
		    return "bracket";
		} else if (stream.match(/}\W*$/)) {
		    state.indent_level -= 1;
		    return "bracket"
		} else if (stream.match(/--/) || stream.match(/->/)) {
		    return "variable-3"
		} else if (stream.match(/(di)?graph\W+/)) {
		    state.looking_for = "graphname";
		    return "keyword"
		} else if (stream.match("//") || stream.match("#")) {
		    stream.skipToEnd();
		    return "comment"
		} else if (stream.match(/\w+/)) {
		    return "variable";
		} else {
		    stream.skipToEnd();
		    return "string";
		}
	    },

	    indent: function (state, _textAfter) {
	    	var i = state.ctx.indent_level;
		return typeof i == "number" ? i : 1;
	    },

	    closeBrackets: {pairs: "[]{}\"\""},
	    lineComment: /(\/\/|#)/,
	    blockCommentStart: "/*",
	    blockCommentEnd: "*/"
	};
    });

    CodeMirror.defineMIME("text/x-dot", "dot");

});
