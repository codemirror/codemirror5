// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"),
        require("../../addon/mode/overlay"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror",
            "../../addon/mode/overlay"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode('freemarker', function(config, parserConfig) {
  var freemarkerOverlay = {
    token: function(stream, state) {
      if (state.inComment) {
        if (stream.match(/.*--]/)) {
          // multi-line comment end
          state.inComment = false;
        } else {
          stream.skipToEnd();
        }
        return "comment";
      }

      if (stream.match(/\[#--.*--]/)) {
        return 'comment';
      } else if (stream.match(/\[#--.*/)) {
        // multi-line comment begin
        state.inComment = true;
        return 'comment';
      } else if (stream.match(/\${[^}]*}/)) {
        return 'variable-2';
      } else if (stream.match(/\[\/?[#@][^\]]*]/)) {
        return 'tag';
      }
      while (stream.next() != null && !stream.match('${', false) && !stream.match('[@', false)) {
      }
      return null;
    },
    startState: function() {
      return {
        inComment: false
      }
    },
    copyState: function(state) {
      return {
        inComment: state.inComment
      }
    }
  };

  return CodeMirror.overlayMode(CodeMirror.getMode(config, parserConfig.backdrop || 'text/html'), freemarkerOverlay);
});

CodeMirror.defineMIME("text/freemarker", "freemarker");

});
