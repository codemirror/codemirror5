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

  // Collect all Dockerfile directives
  var directives = ["from", "maintainer", "run", "cmd", "expose", "env",
                    "add", "copy", "entrypoint", "volume", "user", "workdir",
                    "onbuild"],
      directivesRegex = directives.join('|');
  
  // Match all Dockerfile directives in a case-insensitive manner
  directivesRegex = new RegExp(directivesRegex, "i");

  CodeMirror.defineSimpleMode("dockerfile", {
    start: [
      // Block comment
      {
        regex: /#.*/,
        token: "comment"
      },
      // Directive highlighting
      {
        regex: directivesRegex,
        token: "variable-2",
        next: "remainder"
      }
    ],
    remainder: [
      {
        // Match everything except for the inline comment
        regex: /[^#]+/,
        token: null,
        next: "start"
    	}
    ]
  });

  CodeMirror.defineMIME("text/x-dockerfile", "dockerfile");
});
