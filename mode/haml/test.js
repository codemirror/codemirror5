(function() {
  var mode = CodeMirror.getMode({tabSize: 4, indentUnit: 2}, "haml");
  function MT(name) { test.mode(name, mode, Array.prototype.slice.call(arguments, 1)); }

  // Requires at least one media query
  MT("elementName",
     "[tag %h1] [html Hey There]");

  MT("oneElementPerLine",
     "[tag %h1] [html Hey There %h2]");

  MT("idSelector",
     "[tag %h1][attribute #test] [html Hey There]");

  MT("classSelector",
     "[tag %h1][attribute .hello] [html Hey There]");

  MT("docType",
     "[tag !!! XML]");

  MT("comment",
     "[comment / Hello WORLD]");

  MT("notComment",
     "[tag %h1] [html This is not a / comment ]");

  MT("attributes",
     "[tag %a]([variable title][operator =][string \"test\"]){[atom :title] [operator =>] [string \"test\"]}");

  MT("htmlCode",
     "[html&tag <h1>][html Title][html&tag </h1>]");

  MT("rubyBlock",
     "[operator =][variable-2 @item]");

  MT("selectorRubyBlock",
     "[tag %a.selector=] [variable-2 @item]");

  MT("nestedRubyBlock",
      "[tag %a]",
      "   [operator =][variable puts] [string \"test\"]");

  MT("multilinePlaintext",
      "[tag %p]",
      "  [html Hello,]",
      "  [html World]");

  MT("multilineRuby",
      "[tag %p]",
      "  [comment -# this is a comment]",
      "     [comment and this is a comment too]",
      "  [html Date/Time]",
      "  [operator -] [variable now] [operator =] [tag DateTime][operator .][variable now]",
      "  [tag %strong=] [variable now]",
      "  [operator -] [keyword if] [variable now] [operator >] [tag DateTime][operator .][variable parse]([string \"December 31, 2006\"])",
      "     [operator =][string \"Happy\"]",
      "     [operator =][string \"Belated\"]",
      "     [operator =][string \"Birthday\"]");

  MT("multilineComment",
      "[comment /]",
      "  [comment Multiline]",
      "  [comment Comment]");

  MT("hamlComment",
     "[comment -# this is a comment]");

  MT("multilineHamlComment",
     "[comment -# this is a comment]",
     "   [comment and this is a comment too]");

  MT("multilineHTMLComment",
    "[html&comment <!--]",
    "  [html&comment what a comment]",
    "  [html&comment -->]");

  MT("hamlAfterRubyTag",
    "[attribute .block]",
    "  [tag %strong=] [variable now]",
    "  [attribute .test]",
    "     [operator =][variable now]",
    "  [attribute .right]");

  MT("stretchedRuby",
     "[operator =] [variable puts] [string \"Hello\"],",
     "   [string \"World\"]");

  MT("interpolationInHashAttribute",
     //"[tag %div]{[atom :id] [operator =>] [string \"#{][variable test][string }_#{][variable ting][string }\"]} test");
     "[tag %div]{[atom :id] [operator =>] [string \"#{][variable test][string }_#{][variable ting][string }\"]} [html test]");

  MT("interpolationInHTMLAttribute",
     "[tag %div]([variable title][operator =][string \"#{][variable test][string }_#{][variable ting]()[string }\"]) [html Test]");
})();
