// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function() {
  var mode = CodeMirror.getMode({indentUnit: 4}, "wast");
  function MT(name) {test.mode(name, mode, Array.prototype.slice.call(arguments, 1));}

  MT('number-test',
     '[number 0]',
     '[number 123]',
     '[number nan]',
     '[number inf]',
     '[number infinity]',
     '[number 0.1]',
     '[number 123.0]',
     '[number 12E+99]');

  MT('string-literals-test',
     '[string "foo"]',
     '[string "\\"foo\\""]',
     '[string "foo #\\"# bar"]');

  MT('atom-test',
     '[atom i32]',
     '[atom i64]',
     '[atom f32]',
     '[atom f64]');

  MT('keyword-test',
     '[keyword br]',
     '[keyword if]',
     '[keyword loop]',
     '[keyword i32.add]',
     '[keyword local.get]')
})();
