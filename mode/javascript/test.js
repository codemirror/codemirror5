(function() {
  var mode = CodeMirror.getMode({indentUnit: 2}, "javascript");
  function MT(name) { test.mode(name, mode, Array.prototype.slice.call(arguments, 1)); }

  MT("locals",
     "[keyword function] [variable foo]([def a], [def b]) { [keyword var] [def c] = [number 10]; [keyword return] [variable-2 a] + [variable-2 c] + [variable d]; }");

  MT("comma-and-binop",
     "[keyword function](){ [keyword var] [def x] = [number 1] + [number 2], [def y]; }");
})();
