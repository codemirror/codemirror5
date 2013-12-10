(function() {
  var mode = CodeMirror.getMode({indentUnit: 1}, "css");
  function MT(name) { test.mode(name, mode, Array.prototype.slice.call(arguments, 1)); }
  function IT(name) { test.indentation(name, mode, Array.prototype.slice.call(arguments, 1)); }

  // Error, because "foobarhello" is neither a known type or property, but
  // property was expected (after "and"), and it should be in parenthese.
  MT("atMediaUnknownType",
     "[def @media] [attribute screen] [keyword and] [error foobarhello] { }");

  // Soft error, because "foobarhello" is not a known property or type.
  MT("atMediaUnknownProperty",
     "[def @media] [attribute screen] [keyword and] ([error foobarhello]) { }");

  // Make sure nesting works with media queries
  MT("atMediaMaxWidthNested",
     "[def @media] [attribute screen] [keyword and] ([property max-width]: [number 25px]) { [tag foo] { } }");

  MT("tagSelector",
     "[tag foo] { }");

  MT("classSelector",
     "[qualifier .foo-bar_hello] { }");

  MT("idSelector",
     "[builtin #foo] { [error #foo] }");

  MT("tagSelectorUnclosed",
     "[tag foo] { [property margin]: [number 0] } [tag bar] { }");

  MT("tagStringNoQuotes",
     "[tag foo] { [property font-family]: [variable hello] [variable world]; }");

  MT("tagStringDouble",
     "[tag foo] { [property font-family]: [string \"hello world\"]; }");

  MT("tagStringSingle",
     "[tag foo] { [property font-family]: [string 'hello world']; }");

  MT("tagColorKeyword",
     "[tag foo] {" +
       "[property color]: [keyword black];" +
       "[property color]: [keyword navy];" +
       "[property color]: [keyword yellow];" +
       "}");

  MT("tagColorHex3",
     "[tag foo] { [property background]: [atom #fff]; }");

  MT("tagColorHex6",
     "[tag foo] { [property background]: [atom #ffffff]; }");

  MT("tagColorHex4",
     "[tag foo] { [property background]: [atom&error #ffff]; }");

  MT("tagColorHexInvalid",
     "[tag foo] { [property background]: [atom&error #ffg]; }");

  MT("tagNegativeNumber",
     "[tag foo] { [property margin]: [number -5px]; }");

  MT("tagPositiveNumber",
     "[tag foo] { [property padding]: [number 5px]; }");

  MT("tagVendor",
     "[tag foo] { [meta -foo-][property box-sizing]: [meta -foo-][atom border-box]; }");

  MT("tagBogusProperty",
     "[tag foo] { [property&error barhelloworld]: [number 0]; }");

  MT("tagTwoProperties",
     "[tag foo] { [property margin]: [number 0]; [property padding]: [number 0]; }");

  MT("tagTwoPropertiesURL",
     "[tag foo] { [property background]: [atom url]([string //example.com/foo.png]); [property padding]: [number 0]; }");

  MT("commentSGML",
     "[comment <!--comment-->]");

  MT("commentSGML2",
     "[comment <!--comment]",
     "[comment -->] [tag div] {}");

  IT("tagSelector",
    "strong, em [1 { background][2 : rgba][3 (255, 255, 0, .2][2 )][1 ;]}");

  IT("atMedia",
    "[1 @media { foo ][2 { ][1 } ]}");

  IT("comma",
    "foo [1 { font-family][2 : verdana, sans-serif][1 ; ]}");

  IT("parentheses",
    "foo [1 { background][2 : url][3 (\"bar\"][2 )][1 ; ]}");

  IT("pseudo",
    "foo:before [1 { ]}");
})();
