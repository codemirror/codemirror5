// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function() {
  var mode = CodeMirror.getMode({indentUnit: 2}, "dylan");
  function MT(name) { test.mode(name, mode, Array.prototype.slice.call(arguments, 1)); }

  MT('comments',
     '[comment // This is a line comment]',
     '[comment /* This is a block comment */]',
     '[comment /* This is a multi]',
     '[comment line comment]',
     '[comment */]',
     '[comment /* And this is a /*]',
     '[comment /* nested */ comment */]');
})();
