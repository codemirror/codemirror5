(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

  CodeMirror.defineMode("appcache", function() {

  return {
    token: function(stream) {
      var style;

      // @see https://developer.mozilla.org/en-US/docs/Web/HTML/Using_the_application_cache
      // 
      // Primarily line oriented parsing: 
      // non start-of-line cases represent extraneous / illgeal characters
      // after section headers or file header 
      if (!stream.sol()) { 
        style = "error";
        stream.skipToEnd();
      } else if (stream.match(/^[\s\t]*#.*$/)) {
        style = "comment";
      } else if (stream.match(/^CACHE MANIFEST[\s\t]*/)) { // file header 
        style = "meta";
      } else if (stream.match(/^(CACHE|NETWORK|FALLBACK):[\s\t]*/)) { // section header
        style = "header";
      } else { // normal lines
        style = null;
        stream.skipToEnd();
      }

      return style;
    }
  };
  });

  CodeMirror.defineMIME("text/cache-manifest", "appcache");

});
