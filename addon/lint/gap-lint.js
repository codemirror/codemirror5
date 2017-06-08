// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// Depends on gap-lint.js from https://github.com/mcmartins/gap-lint

// declare global: GAPLint

(function (mod) {
  if (typeof exports == 'object' && typeof module == 'object') // CommonJS
    mod(require('../../lib/codemirror'));
  else if (typeof define == 'function' && define.amd) // AMD
    define(['../../lib/codemirror'], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function (CodeMirror) {
  'use strict';

  CodeMirror.registerHelper('lint', 'gap', function (text) {
    if (!window.GapLint) return [];
    var result = GapLint.validate(text);
    var found = [];
    for (var res in result) {
      if (result.hasOwnProperty(res)) {
        found.push({
          message: result[res].getMessage(),
          severity: result[res].rule.severity,
          from: CodeMirror.Pos(result[res].line, result[res].column),
          to: CodeMirror.Pos(result[res].line, result[res].column+100)
        });
      }
    }
    return found;
  });

});
