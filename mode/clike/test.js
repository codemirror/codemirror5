// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function() {
  var mode = CodeMirror.getMode({indentUnit: 2}, "text/x-c");
  function MT(name) { test.mode(name, mode, Array.prototype.slice.call(arguments, 1)); }

  MT("indent",
     "[variable-3 void] [def foo]([variable-3 void*] [variable a], [variable-3 int] [variable b]) {",
     "  [variable-3 int] [variable c] [operator =] [variable b] [operator +]",
     "    [number 1];",
     "  [keyword return] [operator *][variable a];",
     "}");

  MT("indent_switch",
     "[keyword switch] ([variable x]) {",
     "  [keyword case] [number 10]:",
     "    [keyword return] [number 20];",
     "  [keyword default]:",
     "    [variable printf]([string \"foo %c\"], [variable x]);",
     "}");

  MT("def",
     "[variable-3 void] [def foo]() {}",
     "[keyword struct] [def bar]{}",
     "[variable-3 int] [variable-3 *][def baz]() {}");

  MT("double_block",
     "[keyword for] (;;)",
     "  [keyword for] (;;)",
     "    [variable x][operator ++];",
     "[keyword return];");
})();
