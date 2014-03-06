(function() {
  var mode = CodeMirror.getMode({indentUnit: 2}, "javascript");
  function MT(name) { test.mode(name, mode, Array.prototype.slice.call(arguments, 1)); }

  MT("locals",
     "[keyword function] [variable foo]([def a], [def b]) { [keyword var] [def c] [operator =] [number 10]; [keyword return] [variable-2 a] [operator +] [variable-2 c] [operator +] [variable d]; }");

  MT("comma-and-binop",
     "[keyword function](){ [keyword var] [def x] [operator =] [number 1] [operator +] [number 2], [def y]; }");

  MT("destructuring",
     "([keyword function]([def a], [[[def b], [def c] ]]) {",
     "  [keyword let] {[def d], [property foo]: [def c][operator =][number 10], [def x]} [operator =] [variable foo]([variable-2 a]);",
     "  [[[variable-2 c], [variable y] ]] [operator =] [variable-2 c];",
     "})();");

  MT("class",
     "[keyword class] [variable Point] [keyword extends] [variable SuperThing] {",
     "  [[ [string-2 /expr/] ]]: [number 24],",
     "  [property constructor]([def x], [def y]) {",
     "    [keyword super]([string 'something']);",
     "    [keyword this].[property x] [operator =] [variable-2 x];",
     "  }",
     "}");

  MT("module",
     "[keyword module] [string 'foo'] {",
     "  [keyword export] [keyword let] [def x] [operator =] [number 42];",
     "  [keyword export] [keyword *] [keyword from] [string 'somewhere'];",
     "}");

  MT("import",
     "[keyword function] [variable foo]() {",
     "  [keyword import] [def $] [keyword from] [string 'jquery'];",
     "  [keyword module] [def crypto] [keyword from] [string 'crypto'];",
     "  [keyword import] { [def encrypt], [def decrypt] } [keyword from] [string 'crypto'];",
     "}");

  MT("const",
     "[keyword function] [variable f]() {",
     "  [keyword const] [[ [def a], [def b] ]] [operator =] [[ [number 1], [number 2] ]];",
     "}");

  MT("for/of",
     "[keyword for]([keyword let] [variable of] [keyword of] [variable something]) {}");

  MT("generator",
     "[keyword function*] [variable repeat]([def n]) {",
     "  [keyword for]([keyword var] [def i] [operator =] [number 0]; [variable-2 i] [operator <] [variable-2 n]; [operator ++][variable-2 i])",
     "    [keyword yield] [variable-2 i];",
     "}");

  MT("fatArrow",
     "[variable array].[property filter]([def a] [operator =>] [variable-2 a] [operator +] [number 1]);",
     "[variable a];", // No longer in scope
     "[keyword let] [variable f] [operator =] ([[ [def a], [def b] ]], [def c]) [operator =>] [variable-2 a] [operator +] [variable-2 c];",
     "[variable c];");

  MT("spread",
     "[keyword function] [variable f]([def a], [meta ...][def b]) {",
     "  [variable something]([variable-2 a], [meta ...][variable-2 b]);",
     "}");

  MT("comprehension",
     "[keyword function] [variable f]() {",
     "  [[([variable x] [operator +] [number 1]) [keyword for] ([keyword var] [def x] [keyword in] [variable y]) [keyword if] [variable pred]([variable-2 x]) ]];",
     "  ([variable u] [keyword for] ([keyword var] [def u] [keyword of] [variable generateValues]()) [keyword if] ([variable-2 u].[property color] [operator ===] [string 'blue']));",
     "}");

  MT("quasi",
     "[variable re][string-2 `fofdlakj${][variable x] [operator +] ([variable re][string-2 `foo`]) [operator +] [number 1][string-2 }fdsa`] [operator +] [number 2]");

  MT("indent_statement",
     "[keyword var] [variable x] [operator =] [number 10]",
     "[variable x] [operator +=] [variable y] [operator +]",
     "  [atom Infinity]",
     "[keyword debugger];");

  MT("indent_if",
     "[keyword if] ([number 1])",
     "  [keyword break];",
     "[keyword else] [keyword if] ([number 2])",
     "  [keyword continue];",
     "[keyword else]",
     "  [number 10];",
     "[keyword if] ([number 1]) {",
     "  [keyword break];",
     "} [keyword else] [keyword if] ([number 2]) {",
     "  [keyword continue];",
     "} [keyword else] {",
     "  [number 10];",
     "}");

  MT("indent_for",
     "[keyword for] ([keyword var] [variable i] [operator =] [number 0];",
     "     [variable i] [operator <] [number 100];",
     "     [variable i][operator ++])",
     "  [variable doSomething]([variable i]);",
     "[keyword debugger];");

  MT("indent_c_style",
     "[keyword function] [variable foo]()",
     "{",
     "  [keyword debugger];",
     "}");

  MT("multilinestring",
     "[keyword var] [variable x] [operator =] [string 'foo\\]",
     "[string bar'];");

  MT("scary_regexp",
     "[string-2 /foo[[/]]bar/];");
})();
