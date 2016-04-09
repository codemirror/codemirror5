// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// Originally written by Shawn Pearce <sop@google.com>,
// tweaked by Michael Zhou <zhoumotongxue008@gmail.com>
(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("git-commit-message", function() {
  var header = /^(Parent|Author|AuthorDate|Commit|CommitDate):/;
  var id = /^Change-Id: I[0-9a-f]{40}/; // Gerrit specific
  var footer = /^[A-Z][A-Za-z0-9-]+:/;
  var sha1 = /\b[0-9a-f]{6,40}/;

  return {
    token: function(stream) {
      stream.eatSpace();
      if (stream.column() == 0) {
        if (stream.match(header))
          return "keyword";
        if (stream.match(id) || stream.match(footer))
          return "builtin";
      }

      if (stream.match(sha1))
        return "variable-2";
      if (stream.match(/".*"/))
        return "string";
      stream.next();
      return null;
    }
  };
});

CodeMirror.defineMIME("text/x-git-commit-message", "git-commit-message");

});
