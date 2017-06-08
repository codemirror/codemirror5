// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") { // CommonJS
    mod(require("../../lib/codemirror"),
        require("../../addon/mode/simple"),
        require("../../addon/mode/multiplex"));
  } else if (typeof define == "function" && define.amd) {// AMD
    define(["../../lib/codemirror",
            "../../addon/mode/simple",
            "../../addon/mode/multiplex"], mod);
  } else { // Plain browser env
    mod(CodeMirror);
  }
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineSimpleMode("dust-tags", {
    start: [
      { regex: /\{!/, push: "comment", token: "comment" },
      { regex: /\{/, push: "dust", token: "tag" }
    ],
    dust: [
      { regex: /\}/, pop: true, token: "tag" },

      // Double and single quotes
      { regex: /"(?:[^\\"]|\\.)*"?/, token: "string" },
      { regex: /'(?:[^\\']|\\.)*'?/, token: "string" },

      // Dust keywords
      { regex: /[#\/]([A-Za-z_]\w*)/, token: "keyword" },
      { regex: /[<\/]([A-Za-z_]\w*)/, token: "keyword" },
      { regex: /[>\/]([A-Za-z_]\w*)/, token: "keyword" },
      { regex: /[+\/]([A-Za-z_]\w*)/, token: "keyword" },
      { regex: /[?\/]([A-Za-z_]\w*)/, token: "keyword" },
      { regex: /[@\/]([A-Za-z_]\w*)/, token: "keyword" },
      { regex: /[:\/]([A-Za-z_]\w*)/, token: "keyword" },
      { regex: /[\^\/]([A-Za-z_]\w*)/, token: "keyword" },

      // Numeral
      { regex: /\d+/i, token: "number" },

      // Atoms like = and .
      { regex: /=|~|@|true|false|>|<|:|\||\//, token: "atom" },

      // Paths
      { regex: /(?:\.\.\/)*(?:[A-Za-z_][\w\.]*)+/, token: "variable-2" },
    ],
    comment: [
      { regex: /\}/, pop: true, token: "comment" },
      { regex: /./, token: "comment" }
    ]
  });

  CodeMirror.defineMode("dust", function(config, parserConfig) {
    var dust = CodeMirror.getMode(config, "dust-tags");
    if (!parserConfig || !parserConfig.base) return dust;
    return CodeMirror.multiplexingMode(
      CodeMirror.getMode(config, parserConfig.base),
      {open: "{", close: "}", mode: dust, parseDelimiters: true}
    );
  });

  CodeMirror.defineMIME("text/x-dust-template", "dust");
});
