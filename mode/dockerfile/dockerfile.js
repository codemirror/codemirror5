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
  var instructions = ["from", "maintainer", "run", "cmd", "expose", "env",
                      "add", "copy", "entrypoint", "volume", "user",
                      "workdir", "onbuild"],
      instructionsRegex = "(" + instructions.join('|') + ")($|\\s+)";

  // Match all Dockerfile directives in a case-insensitive manner
  instructionsRegex = new RegExp(instructionsRegex, "i");
  window.instructionsRegex = instructionsRegex;

  CodeMirror.defineSimpleMode("dockerfile", {
    start: [
      // Block comment
      {
        regex: /#.*/,
        token: "comment"
      },
      // Instruction highlighting
      {
        regex: instructionsRegex,
        token: ["variable-2", null],
        next: "remainder"
      }
    ],
    remainder: [
      {
        // Match everything except for the inline comment
        regex: /[^#]+$/,
        token: null,
        next: "start"
      },
      {
        // Line comment without instruction arguments is an error
        regex: /#.+$/,
        token: "error",
        next: "start"
      }
    ]
  });

  CodeMirror.defineMIME("text/x-dockerfile", "dockerfile");
});
