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

	CodeMirror.defineMode("formula", function () {
		var stateType = {_string: 1, characterClass: 2};

		return {
			startState: function () {
				return {
					stringType: null,
					stack: []
				};
			},
			token: function (stream, state) {
				if (!stream) return;

				//check for state changes
				if (state.stack.length === 0) {
					//strings
					if ((stream.peek() == '"') || (stream.peek() == "'")) {
						state.stringType = stream.peek();
						stream.next(); // Skip quote
						state.stack.unshift(stateType._string);
					}
				}

				//return state
				//stack has
				switch (state.stack[0]) {
					case stateType._string:
						while (state.stack[0] === stateType._string && !stream.eol()) {
							if (stream.peek() === state.stringType) {
								stream.next(); // Skip quote
								state.stack.shift(); // Clear flag
							} else if (stream.peek() === "\\") {
								stream.next();
								stream.next();
							} else {
								stream.match(/^.[^\\\"\']*/);
							}
						}
						return "string";

					case stateType.characterClass:
						while (state.stack[0] === stateType.characterClass && !stream.eol()) {
							if (!(stream.match(/^[^\]\\]+/) || stream.match(/^\\./))) {
								state.stack.shift();
							}
						}
						return "operator";
				}

				var peek = stream.peek();

				//no stack
				switch (peek) {
					case "[":
						stream.next();
						state.stack.unshift(stateType.characterClass);
						return "bracket";
					case ":":
						stream.next();
						return "operator";
					case "\\":
						if (stream.match(/[\][a-z]+/)) {
							return "string-2";
						}
					case ".":
					case ",":
					case ";":
						if (stream.match(".")) {
							return "atom";
						}
					case "*":
					case "-":
					case "+":
					case "^":
					case "<":
					case "/":
					case "=":
						stream.next();
						return "atom";
					case "$":
						stream.next();
						return "builtin";
				}

				if (stream.match(/[0-9]+/)) {
					if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
						return "error";
					}
					return "number";
				} else if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
					if (stream.match(/(?=[\(.])/)) {
						return "keyword";
					}
					return "variable-2";
				} else if (["[", "]", "(", ")", "{", "}"].indexOf(stream.peek()) != -1) {
					stream.next();
					return "bracket";
				} else if (!stream.eatSpace()) {
					stream.next();
				}
				return null;
			}
		};
	});

	CodeMirror.defineMIME("text/x-formula", "formula");
});