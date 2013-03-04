(function() {
  var mode = CodeMirror.getMode({tabSize: 4}, "scss");
  function MT(name) { test.mode(name, mode, Array.prototype.slice.call(arguments, 1)); }

  MT('url_with_quotation',
    "[property background]:[property url]([string test.jpg])");

  MT('url_with_double_quotes',
    "[property background]:[property url]([string \"test.jpg\"])");

  MT('url_with_single_quotes',
    "[property background]:[property url]([string \'test.jpg\'])");

  MT('string',
    "[meta @import] [string \"compass/css3\"]");

  MT('important_keyword',
    "[property text-decoration]:[atom none] [keyword !important]");

  MT('variable',
    "[variable-2 $blue]:[atom #333]");

  MT('variable_as_attribute',
    "[property color]:[variable-2 $blue]");

  MT('number_px',
    "[property color]:[number 10px]");

  MT('number_em',
    "[property color]:[number 10em]");

  MT('number_percentage',
    "[property width]:[number 80%]");

  MT('number_mixed',
    "[property padding]: [number 0] [number 10px] [number 0] [number 2em]");

  MT('selector',
    "[builtin #hello.world]{}");

  MT('singleline_comment',
    "[comment // this is a comment]");

  MT('multiline_comment',
    "[comment /*foobar*/]");

  MT('attribute_with_hyphen',
    "[property font-size]:[number 10px]");

  MT('string_after_attribute',
    "[property content]:[string \"::\"]");

  MT('directives',
    "[meta @include] [builtin .mixin]");

  MT('basic_structure',
    "[tag p] { [property background]: [atom red]; }");

  MT('nested_structure',
    "[tag p] { [tag a] { [property color]: [atom white]; } }");

  MT('mixin',
    "[meta @mixin] [atom table-base] {}");

  MT('number_without_semicolon',
    "[tag p] {[property width]: [number 12]}",
    "[tag a] {[property color]: [atom white];}");
})();
