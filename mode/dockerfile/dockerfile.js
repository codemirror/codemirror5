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
  var instructions = ["arg", "from", "maintainer", "run", "cmd", "label", "expose", "env",
                      "add", "copy", "entrypoint", "volume", "user",
                      "workdir", "onbuild", "stopsignal", "healthcheck", "shell"],
      instructionRegex = "(" + instructions.join('|') + ")",
      instructionOnlyLine = new RegExp(instructionRegex + "\\s*$", "i"),
      instructionWithArguments = new RegExp(instructionRegex + "(\\s+)", "i");

  CodeMirror.defineSimpleMode("dockerfile", {
    start: [
      // Block comment: This is a line starting with a comment
      {
        regex: /#.*$/,
        token: "comment"
      },
      {
        regex: /^(\s*)\b(from)\b/i,
        token: [null, "keyword"],
        next: "from"
      },
      // Highlight an instruction without any arguments (for convenience)
      {
        regex: instructionOnlyLine,
        token: "keyword"
      },
      // Highlight an instruction followed by arguments
      {
        regex: instructionWithArguments,
        token: ["keyword", null],
        next: "arguments"
      },
      {
        regex: /./,
        token: null
      }
    ],
    from: [
      {
        regex: /\s*$/,
        token: null,
        next: "start"
      },
      {
        // Line comment without instruction arguments is an error
        regex: /(\s*)(#.*)$/,
        token: [null, "error"],
        next: "start"
      },
      {
        // ex: FROM golang:1.9.2-alpine3.6 AS build
        regex: /(\s*\S+\s+)(as)(\s+)\S+/i,
        token: [null, "keyword", null],
        next: "start"
      },
      {
        // ex: FROM node:carbon
        regex: /\s*[^#]+$/,
        token: null,
        next: "start"
      },
      {
        // ex: FROM node:carbon # comment
        regex: /(\s*[^#]+)\s*(#.*)$/,
        token: [null, "comment"],
        next: "start"
      },
      {
        token: null,
        next: "start"
      }
    ],
    arguments: [
      {
        // Line comment without instruction arguments is an error
        regex: /#.*$/,
        token: "error",
        next: "start"
      },
      {
        regex: /[^#]+\\$/,
        token: null
      },
      {
        // Match everything except for the inline comment
        regex: /[^#]+/,
        token: null,
        next: "start"
      },
      {
        regex: /$/,
        token: null,
        next: "start"
      },
      // Fail safe return to start
      {
        token: null,
        next: "start"
      }
    ],
      meta: {
          lineComment: "#"
      }
  });

  CodeMirror.defineMIME("text/x-dockerfile", "dockerfile");
});
