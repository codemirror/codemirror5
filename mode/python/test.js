// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/5/LICENSE

(function() {
  var mode = CodeMirror.getMode({indentUnit: 4},
              {name: "python",
               version: 3,
               singleLineStringErrors: false});
  function MT(name) { test.mode(name, mode, Array.prototype.slice.call(arguments, 1)); }

  // Error, because "foobarhello" is neither a known type or property, but
  // property was expected (after "and"), and it should be in parentheses.
  MT("decoratorStartOfLine",
     "[meta @dec]",
     "[keyword def] [def function]():",
     "    [keyword pass]");

  MT("decoratorIndented",
     "[keyword class] [def Foo]:",
     "    [meta @dec]",
     "    [keyword def] [def function]():",
     "        [keyword pass]");

  MT("matmulWithSpace:", "[variable a] [operator @] [variable b]");
  MT("matmulWithoutSpace:", "[variable a][operator @][variable b]");
  MT("matmulSpaceBefore:", "[variable a] [operator @][variable b]");
  var before_equal_sign = ["+", "-", "*", "/", "=", "!", ">", "<"];
  for (var i = 0; i < before_equal_sign.length; ++i) {
    var c = before_equal_sign[i]
    MT("before_equal_sign_" + c, "[variable a] [operator " + c + "=] [variable b]");
  }

  MT("fValidStringPrefix", "[string f'this is a]{[variable formatted]}[string string']");
  MT("fValidExpressionInFString", "[string f'expression ]{[number 100][operator *][number 5]}[string string']");
  MT("fInvalidFString", "[error f'this is wrong}]");
  MT("fNestedFString", "[string f'expression ]{[number 100] [operator +] [string f'inner]{[number 5]}[string ']}[string string']");
  MT("uValidStringPrefix", "[string u'this is an unicode string']");

  MT("nestedString", "[string f']{[variable b][[ [string \"c\"] ]]}[string f'] [comment # oops]")

  MT("bracesInFString", "[string f']{[variable x] [operator +] {}}[string !']")

  MT("nestedFString", "[string f']{[variable b][[ [string f\"c\"] ]]}[string f'] [comment # oops]")

  MT("dontIndentTypeDecl",
     "[variable i]: [builtin int] [operator =] [number 32]",
     "[builtin print]([variable i])")

  MT("dedentElse",
     "[keyword if] [variable x]:",
     "    [variable foo]()",
     "[keyword elif] [variable y]:",
     "    [variable bar]()",
     "[keyword else]:",
     "    [variable baz]()")

  MT("dedentElsePass",
     "[keyword if] [variable x]:",
     "    [keyword pass]",
     "[keyword elif] [variable y]:",
     "    [keyword pass]",
     "[keyword else]:",
     "    [keyword pass]")

  MT("dedentElseInFunction",
     "[keyword def] [def foo]():",
     "    [keyword if] [variable x]:",
     "        [variable foo]()",
     "    [keyword elif] [variable y]:",
     "        [variable bar]()",
     "        [keyword pass]",
     "    [keyword else]:",
     "        [variable baz]()")

  MT("dedentCase",
     "[keyword match] [variable x]:",
     "    [keyword case] [variable y]:",
     "        [variable foo]()")
  MT("dedentCasePass",
     "[keyword match] [variable x]:",
     "    [keyword case] [variable y]:",
     "        [keyword pass]")

  MT("dedentCaseInFunction",
     "[keyword def] [def foo]():",
     "    [keyword match] [variable x]:",
     "        [keyword case] [variable y]:",
     "            [variable foo]()")
})();
