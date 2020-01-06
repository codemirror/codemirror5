// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  let blockProperties = /\b(coinbase|difficulty|gaslimit|number|timestamp)\b/;
  let msgProperties = /\b(data|sender|value)\b/;
  let txProperties = /\b(gasprice|origin)\b/;

  function tokenBase(stream, state) {
    // whitespace
    if (stream.eatSpace()) return null;

    if (stream.match(/\s*(address)\b/)) return "type";

    stream.next();
    return null;
  }

  CodeMirror.defineMode("solidity", function() {

    return {
      startState: function() {
        return {
          tokenize: tokenBase,
          lastToken: null,
        }
      },

      token: function(stream, state) {
        let style = state.tokenize(stream, state);
        let current = stream.current();

        if (current && style) state.lastToken = current;
        console.log(current);

        return style;
      },
    }
  });

  CodeMirror.defineMIME("text/x-solidity", "solidity");
});
