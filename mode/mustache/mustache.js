// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function (mod) {
  "use strict";
  if (typeof exports === "object" && typeof module === "object") { // CommonJS
    mod(require("../../lib/codemirror"),
        require("../../addon/mode/overlay"));
  } else if (typeof define === "function" && define.amd) { // AMD
    define(["../../lib/codemirror",
            "../../addon/mode/overlay"], mod);
  } else { // Plain browser env
    mod(CodeMirror);
  }
})(function (CodeMirror) {
  CodeMirror.defineMode("mustache", function(config, parserConfig) {
    var mustacheOverlay = {
      token: function(stream, _state) {
        var ch;
        if (stream.match("{{")) {
          while ((ch = stream.next()) != null)
            if (ch == "}" && stream.next() == "}") {
              stream.eat("}");
              return "strong";
            }
        }
        while (stream.next() != null && !stream.match("{{", false)) {}
        return null;
      }
    };
    return CodeMirror.overlayMode(CodeMirror.getMode(config, parserConfig.backdrop || "text/html"), mustacheOverlay);
  });

  CodeMirror.defineMIME("script/x-mustache", "mustache");
});
