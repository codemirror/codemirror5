// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function() {
  var mode = CodeMirror.getMode({indentUnit: 2}, "swift");
  function MT(name) { test.mode(name, mode, Array.prototype.slice.call(arguments, 1)); }

  // Error, because "foobarhello" is neither a known type or property, but
  // property was expected (after "and"), and it should be in parentheses.
  MT("numbers",
     "[keyword var] [def foo1] [operator =] [number 17]",
     "[keyword var] [def foo2] [operator =] [number -0.5]",
     "[keyword var] [def foo3] [operator =] [number .3456e-4]",
     "[keyword var] [def foo4] [operator =] [number 0o7324]",
     "[keyword var] [def foo5] [operator =] [number 0b10010]",
     "[keyword var] [def foo6] [operator =] [number -0x35ade]",
     "[keyword var] [def foo7] [operator =] [number 0xaeaep-13]");
})();