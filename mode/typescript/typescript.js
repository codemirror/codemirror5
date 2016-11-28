// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../javascript/javascript"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../javascript/javascript"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("typescript", function(config, modeConfig) {

  var javascriptConfig = {
    isTS: true
  };
  for (var attr in modeConfig) {
    javascriptConfig[attr] = modeConfig[attr];
  }
  javascriptConfig.name = "javascript";
  return CodeMirror.getMode(config, javascriptConfig);

}, "javascript");

  CodeMirror.defineMIME("text/typescript", { name: "typescript", typescript: true });
  CodeMirror.defineMIME("application/typescript", { name: "typescript", typescript: true });
});
