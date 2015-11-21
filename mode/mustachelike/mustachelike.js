// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../../addon/mode/simple"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror",
            "../../addon/mode/overlay",
            "../../addon/mode/simple"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  function defineMustacheLikeMode(name, mimes, states) {
    CodeMirror.defineMode(name, function(config, parserConfig) {
      var simple = CodeMirror.simpleMode(config, states);
      return CodeMirror.overlayMode(CodeMirror.getMode(config, parserConfig.backdrop || "text/html"), simple);
    });

    if (typeof mimes == "string") mimes = [mimes];
    for (var i = 0; i < mimes.length; ++i)
      CodeMirror.defineMIME(mimes[i], name);
  }

  defineMustacheLikeMode("mustache", "text/x-mustache", {
    start: [
      { regex: /\{\{/, push: "mustache", token: "strong" }
    ],
    mustache: [
      { regex: /\}\}/, pop: true, token: "strong" },
      { regex: /./, token: "strong" }
    ]
  });

  defineMustacheLikeMode("handlebars", "text/x-handlebars-template", {
    start: [
      { regex: /\{\{!--/, push: "dash_comment", token: "comment" },
      { regex: /\{\{!/,   push: "comment", token: "comment" },
      { regex: /\{\{/,    push: "handlebars", token: "tag" }
    ],
    handlebars: [
      { regex: /\}\}/, pop: true, token: "tag" },

      // Double and single quotes
      { regex: /"(?:[^\\]|\\.)*?"/, token: "string" },
      { regex: /'(?:[^\\]|\\.)*?'/, token: "string" },

      // Handlebars keywords
      { regex: />|[#\/]([A-Za-z_]\w*)/, token: "keyword" },
      { regex: /(?:else|this)\b/, token: "keyword" },

      // Numeral
      { regex: /\d+/i, token: "number" },

      // Atoms like = and .
      { regex: /=|~|@|true|false/, token: "atom" },

      // Paths
      { regex: /(?:\.\.\/)*(?:[A-Za-z_][\w\.]*)+/, token: "variable-2" }
    ],
    dash_comment: [
      { regex: /--\}\}/, pop: true, token: "comment" },

      // Commented code
      { regex: /./, token: "comment"}
    ],
    comment: [
      { regex: /\}\}/, pop: true, token: "comment" },
      { regex: /./, token: "comment" }
    ]
  });

});
