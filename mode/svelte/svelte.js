// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function (mod) {
  "use strict";
  if (typeof exports === "object" && typeof module === "object") {// CommonJS
    mod(require("../../lib/codemirror"),
        require("../../addon/mode/overlay"),
        require("../xml/xml"),
        require("../javascript/javascript"),
        require("../css/css"));
  } else if (typeof define === "function" && define.amd) { // AMD
    define(["../../lib/codemirror",
            "../../addon/mode/overlay",
            "../xml/xml",
            "../javascript/javascript",
            "../css/css"], mod);
  } else { // Plain browser env
    mod(CodeMirror);
  }
})(function (CodeMirror) {
  CodeMirror.defineMode("svelte-template", function (config, parserConfig) {
    var mustacheOverlay = {
      token: function (stream) {
        if (stream.match(/^\{.*?\}/)) return "meta mustache";
        while (stream.next() && !stream.match("{", false)) {}
        return null;
      }
    };
    return CodeMirror.overlayMode(CodeMirror.getMode(config, parserConfig.backdrop || "text/html"), mustacheOverlay);
  });

  CodeMirror.defineMode("svelte", function (config) {
    return CodeMirror.getMode(config, {name: "htmlmixed"});
  }, "htmlmixed", "xml", "javascript", "css");

  CodeMirror.defineMIME("script/x-svelte", "svelte");
  CodeMirror.defineMIME("text/x-svelte", "svelte");
});
