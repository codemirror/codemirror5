(function() {
  var mode = CodeMirror.getMode({tabSize: 4}, "markdown");
  function MT(name) { test.mode(name, mode, Array.prototype.slice.call(arguments, 1)); }

  MT("plainText",
     "foo");

  // Code blocks using 4 spaces (regardless of CodeMirror.tabSize value)
  MT("codeBlocksUsing4Spaces",
     "    [comment foo]");

  // Code blocks using 4 spaces with internal indentation
  MT("codeBlocksUsing4SpacesIndentation",
     "    [comment bar]",
     "        [comment hello]",
     "            [comment world]",
     "    [comment foo]",
     "bar");

  // Code blocks using 4 spaces with internal indentation
  MT("codeBlocksUsing4SpacesIndentation",
     " foo",
     "    [comment bar]",
     "        [comment hello]",
     "    [comment world]");

  // Code blocks using 1 tab (regardless of CodeMirror.indentWithTabs value)
  MT("codeBlocksUsing1Tab",
     "\t[comment foo]");

  // Inline code using backticks
  MT("inlineCodeUsingBackticks",
     "foo [comment `bar`]");

  // Block code using single backtick (shouldn't work)
  MT("blockCodeSingleBacktick",
     "[comment `]",
     "foo",
     "[comment `]");

  // Unclosed backticks
  // Instead of simply marking as CODE, it would be nice to have an 
  // incomplete flag for CODE, that is styled slightly different.
  MT("unclosedBackticks",
     "foo [comment `bar]");

  // Per documentation: "To include a literal backtick character within a 
  // code span, you can use multiple backticks as the opening and closing 
  // delimiters"
  MT("doubleBackticks",
     "[comment ``foo ` bar``]");

  // Tests based on Dingus
  // http://daringfireball.net/projects/markdown/dingus
  // 
  // Multiple backticks within an inline code block
  MT("consecutiveBackticks",
     "[comment `foo```bar`]");

  // Multiple backticks within an inline code block with a second code block
  MT("consecutiveBackticks",
     "[comment `foo```bar`] hello [comment `world`]");

  // Unclosed with several different groups of backticks
  MT("unclosedBackticks",
     "[comment ``foo ``` bar` hello]");

  // Closed with several different groups of backticks
  MT("closedBackticks",
     "[comment ``foo ``` bar` hello``] world");

  // atx headers
  // http://daringfireball.net/projects/markdown/syntax#header

  MT("atxH1",
     "[header # foo]");

  MT("atxH2",
     "[header ## foo]");

  MT("atxH3",
     "[header ### foo]");

  MT("atxH4",
     "[header #### foo]");

  MT("atxH5",
     "[header ##### foo]");

  MT("atxH6",
     "[header ###### foo]");

  // H6 - 7x '#' should still be H6, per Dingus
  // http://daringfireball.net/projects/markdown/dingus
  MT("atxH6NotH7",
     "[header ####### foo]");

  // Setext headers - H1, H2
  // Per documentation, "Any number of underlining =’s or -’s will work."
  // http://daringfireball.net/projects/markdown/syntax#header
  // Ideally, the text would be marked as `header` as well, but this is 
  // not really feasible at the moment. So, instead, we're testing against 
  // what works today, to avoid any regressions.
  // 
  // Check if single underlining = works
  MT("setextH1",
     "foo",
     "[header =]");

  // Check if 3+ ='s work
  MT("setextH1",
     "foo",
     "[header ===]");

  // Check if single underlining - works
  MT("setextH2",
     "foo",
     "[header -]");

  // Check if 3+ -'s work
  MT("setextH2",
     "foo",
     "[header ---]");

  // Single-line blockquote with trailing space
  MT("blockquoteSpace",
     "[quote > foo]");

  // Single-line blockquote
  MT("blockquoteNoSpace",
     "[quote >foo]");

  // Single-line blockquote followed by normal paragraph
  MT("blockquoteThenParagraph",
     "[quote >foo]",
     "",
     "bar");

  // Multi-line blockquote (lazy mode)
  MT("multiBlockquoteLazy",
     "[quote >foo]",
     "[quote bar]");

  // Multi-line blockquote followed by normal paragraph (lazy mode)
  MT("multiBlockquoteLazyThenParagraph",
     "[quote >foo]",
     "[quote bar]",
     "",
     "hello");

  // Multi-line blockquote (non-lazy mode)
  MT("multiBlockquote",
     "[quote >foo]",
     "[quote >bar]");

  // Multi-line blockquote followed by normal paragraph (non-lazy mode)
  MT("multiBlockquoteThenParagraph",
     "[quote >foo]",
     "[quote >bar]",
     "",
     "hello");

  // Check list types

  MT("listAsterisk",
     "[string * foo]",
     "[string * bar]");

  MT("listPlus",
     "[string + foo]",
     "[string + bar]");

  MT("listDash",
     "[string - foo]",
     "[string - bar]");

  MT("listNumber",
     "[string 1. foo]",
     "[string 2. bar]");

  // Formatting in lists (*)
  MT("listAsteriskFormatting",
     "[string * ][string&em *foo*][string  bar]",
     "[string * ][string&strong **foo**][string  bar]",
     "[string * ][string&strong **][string&emstrong *foo**][string&em *][string  bar]",
     "[string * ][string&comment `foo`][string  bar]");

  // Formatting in lists (+)
  MT("listPlusFormatting",
     "[string + ][string&em *foo*][string  bar]",
     "[string + ][string&strong **foo**][string  bar]",
     "[string + ][string&strong **][string&emstrong *foo**][string&em *][string  bar]",
     "[string + ][string&comment `foo`][string  bar]");

  // Formatting in lists (-)
  MT("listDashFormatting",
     "[string - ][string&em *foo*][string  bar]",
     "[string - ][string&strong **foo**][string  bar]",
     "[string - ][string&strong **][string&emstrong *foo**][string&em *][string  bar]",
     "[string - ][string&comment `foo`][string  bar]");

  // Formatting in lists (1.)
  MT("listNumberFormatting",
     "[string 1. ][string&em *foo*][string  bar]",
     "[string 2. ][string&strong **foo**][string  bar]",
     "[string 3. ][string&strong **][string&emstrong *foo**][string&em *][string  bar]",
     "[string 4. ][string&comment `foo`][string  bar]");

  // Paragraph lists
  MT("listParagraph",
     "[string * foo]",
     "",
     "[string * bar]");

  // Multi-paragraph lists
  //
  // 4 spaces
  MT("listMultiParagraph",
     "[string * foo]",
     "",
     "[string * bar]",
     "",
     "    [string hello]");

  // 4 spaces, extra blank lines (should still be list, per Dingus)
  MT("listMultiParagraphExtra",
     "[string * foo]",
     "",
     "[string * bar]",
     "",
     "    [string hello]");

  // 4 spaces, plus 1 space (should still be list, per Dingus)
  MT("listMultiParagraphExtraSpace",
     "[string * foo]",
     "",
     "[string * bar]",
     "",
     "     [string hello]",
     "",
     "    [string world]");

  // 1 tab
  MT("listTab",
     "[string * foo]",
     "",
     "[string * bar]",
     "",
     "\t[string hello]");

  // No indent
  MT("listNoIndent",
     "[string * foo]",
     "",
     "[string * bar]",
     "",
     "hello");

  // Blockquote
  MT("blockquote",
     "[string * foo]",
     "",
     "[string * bar]",
     "",
     "    [string&quote > hello]");

  // Code block
  MT("blockquoteCode",
     "[string * foo]",
     "",
     "[string * bar]",
     "",
     "        [comment > hello]",
     "",
     "    [string world]");

  // Code block followed by text
  MT("blockquoteCodeText",
     "[string * foo]",
     "",
     "    [string bar]",
     "",
     "        [comment hello]",
     "",
     "    [string world]");

  // Nested list

  MT("listAsteriskNested",
     "[string * foo]",
     "",
     "    [string * bar]");

  MT("listPlusNested",
     "[string + foo]",
     "",
     "    [string + bar]");

  MT("listDashNested",
     "[string - foo]",
     "",
     "    [string - bar]");

  MT("listNumberNested",
     "[string 1. foo]",
     "",
     "    [string 2. bar]");

  MT("listMixed",
     "[string * foo]",
     "",
     "    [string + bar]",
     "",
     "        [string - hello]",
     "",
     "            [string 1. world]");

  MT("listBlockquote",
     "[string * foo]",
     "",
     "    [string + bar]",
     "",
     "        [quote&string > hello]");

  MT("listCode",
     "[string * foo]",
     "",
     "    [string + bar]",
     "",
     "            [comment hello]");

  // Code with internal indentation
  MT("listCodeIndentation",
     "[string * foo]",
     "",
     "        [comment bar]",
     "            [comment hello]",
     "                [comment world]",
     "        [comment foo]",
     "    [string bar]");

  // Code followed by text
  MT("listCodeText",
     "[string * foo]",
     "",
     "        [comment bar]",
     "",
     "hello");

  // Following tests directly from official Markdown documentation
  // http://daringfireball.net/projects/markdown/syntax#hr

  MT("hrSpace",
     "[hr * * *]");

  MT("hr",
     "[hr ***]");

  MT("hrLong",
     "[hr *****]");

  MT("hrSpaceDash",
     "[hr - - -]");

  MT("hrDashLong",
     "[hr ---------------------------------------]");

  // Inline link with title
  MT("linkTitle",
     "[link [[foo]]][string (http://example.com/ \"bar\")] hello");

  // Inline link without title
  MT("linkNoTitle",
     "[link [[foo]]][string (http://example.com/)] bar");

  // Inline link with image
  MT("linkImage",
     "[link [[][tag ![[foo]]][string (http://example.com/)][link ]]][string (http://example.com/)] bar");

  // Inline link with Em
  MT("linkEm",
     "[link [[][link&em *foo*][link ]]][string (http://example.com/)] bar");

  // Inline link with Strong
  MT("linkStrong",
     "[link [[][link&strong **foo**][link ]]][string (http://example.com/)] bar");

  // Inline link with EmStrong
  MT("linkEmStrong",
     "[link [[][link&strong **][link&emstrong *foo**][link&em *][link ]]][string (http://example.com/)] bar");

  // Image with title
  MT("imageTitle",
     "[tag ![[foo]]][string (http://example.com/ \"bar\")] hello");

  // Image without title
  MT("imageNoTitle",
     "[tag ![[foo]]][string (http://example.com/)] bar");

  // Image with asterisks
  MT("imageAsterisks",
     "[tag ![[*foo*]]][string (http://example.com/)] bar");

  // Not a link. Should be normal text due to square brackets being used
  // regularly in text, especially in quoted material, and no space is allowed
  // between square brackets and parentheses (per Dingus).
  MT("notALink",
     "[[foo]] (bar)");

  // Reference-style links
  MT("linkReference",
     "[link [[foo]]][string [[bar]]] hello");

  // Reference-style links with Em
  MT("linkReferenceEm",
     "[link [[][link&em *foo*][link ]]][string [[bar]]] hello");

  // Reference-style links with Strong
  MT("linkReferenceStrong",
     "[link [[][link&strong **foo**][link ]]][string [[bar]]] hello");

  // Reference-style links with EmStrong
  MT("linkReferenceEmStrong",
     "[link [[][link&strong **][link&emstrong *foo**][link&em *][link ]]][string [[bar]]] hello");

  // Reference-style links with optional space separator (per docuentation)
  // "You can optionally use a space to separate the sets of brackets"
  MT("linkReferenceSpace",
     "[link [[foo]]] [string [[bar]]] hello");

  // Should only allow a single space ("...use *a* space...")
  MT("linkReferenceDoubleSpace",
     "[[foo]]  [[bar]] hello");

  // Reference-style links with implicit link name
  MT("linkImplicit",
     "[link [[foo]]][string [[]]] hello");

  // @todo It would be nice if, at some point, the document was actually
  // checked to see if the referenced link exists

  // Link label, for reference-style links (taken from documentation)

  MT("labelNoTitle",
     "[link [[foo]]:] [string http://example.com/]");

  MT("labelIndented",
     "   [link [[foo]]:] [string http://example.com/]");

  MT("labelSpaceTitle",
     "[link [[foo bar]]:] [string http://example.com/ \"hello\"]");

  MT("labelDoubleTitle",
     "[link [[foo bar]]:] [string http://example.com/ \"hello\"] \"world\"");

  MT("labelTitleDoubleQuotes",
     "[link [[foo]]:] [string http://example.com/  \"bar\"]");

  MT("labelTitleSingleQuotes",
     "[link [[foo]]:] [string http://example.com/  'bar']");

  MT("labelTitleParenthese",
     "[link [[foo]]:] [string http://example.com/  (bar)]");

  MT("labelTitleInvalid",
     "[link [[foo]]:] [string http://example.com/] bar");

  MT("labelLinkAngleBrackets",
     "[link [[foo]]:] [string <http://example.com/>  \"bar\"]");

  MT("labelTitleNextDoubleQuotes",
     "[link [[foo]]:] [string http://example.com/]",
     "[string \"bar\"] hello");

  MT("labelTitleNextSingleQuotes",
     "[link [[foo]]:] [string http://example.com/]",
     "[string 'bar'] hello");

  MT("labelTitleNextParenthese",
     "[link [[foo]]:] [string http://example.com/]",
     "[string (bar)] hello");

  MT("labelTitleNextMixed",
     "[link [[foo]]:] [string http://example.com/]",
     "(bar\" hello");

  MT("linkWeb",
     "[link <http://example.com/>] foo");

  MT("linkEmail",
     "[link <user@example.com>] foo");

  MT("emAsterisk",
     "[em *foo*] bar");

  MT("emUnderscore",
     "[em _foo_] bar");

  MT("emInWordAsterisk",
     "foo[em *bar*]hello");

  MT("emInWordUnderscore",
     "foo[em _bar_]hello");

  // Per documentation: "...surround an * or _ with spaces, it’ll be 
  // treated as a literal asterisk or underscore."

  MT("emEscapedBySpaceIn",
     "foo [em _bar _ hello_] world");

  MT("emEscapedBySpaceOut",
     "foo _ bar[em _hello_]world");

  // Unclosed emphasis characters
  // Instead of simply marking as EM / STRONG, it would be nice to have an 
  // incomplete flag for EM and STRONG, that is styled slightly different.
  MT("emIncompleteAsterisk",
     "foo [em *bar]");

  MT("emIncompleteUnderscore",
     "foo [em _bar]");

  MT("strongAsterisk",
     "[strong **foo**] bar");

  MT("strongUnderscore",
     "[strong __foo__] bar");

  MT("emStrongAsterisk",
     "[em *foo][emstrong **bar*][strong hello**] world");

  MT("emStrongUnderscore",
     "[em _foo][emstrong __bar_][strong hello__] world");

  // "...same character must be used to open and close an emphasis span.""
  MT("emStrongMixed",
     "[em _foo][emstrong **bar*hello__ world]");

  MT("emStrongMixed",
     "[em *foo][emstrong __bar_hello** world]");

  // These characters should be escaped:
  // \   backslash
  // `   backtick
  // *   asterisk
  // _   underscore
  // {}  curly braces
  // []  square brackets
  // ()  parentheses
  // #   hash mark
  // +   plus sign
  // -   minus sign (hyphen)
  // .   dot
  // !   exclamation mark

  MT("escapeBacktick",
     "foo \\`bar\\`");

  MT("doubleEscapeBacktick",
     "foo \\\\[comment `bar\\\\`]");

  MT("escapeAsterisk",
     "foo \\*bar\\*");

  MT("doubleEscapeAsterisk",
     "foo \\\\[em *bar\\\\*]");

  MT("escapeUnderscore",
     "foo \\_bar\\_");

  MT("doubleEscapeUnderscore",
     "foo \\\\[em _bar\\\\_]");

  MT("escapeHash",
     "\\# foo");

  MT("doubleEscapeHash",
     "\\\\# foo");
})();
