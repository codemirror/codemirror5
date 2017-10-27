// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function() {
  var config = {tabSize: 4, indentUnit: 2}
  var mode = CodeMirror.getMode(config, "gfm");
  function MT(name) { test.mode(name, mode, Array.prototype.slice.call(arguments, 1)); }
  var modeHighlightFormatting = CodeMirror.getMode(config, {name: "gfm", highlightFormatting: true});
  function FT(name) { test.mode(name, modeHighlightFormatting, Array.prototype.slice.call(arguments, 1)); }

  FT("codeBackticks",
     "[comment&formatting&formatting-code `][comment foo][comment&formatting&formatting-code `]");

  FT("doubleBackticks",
     "[comment&formatting&formatting-code ``][comment foo ` bar][comment&formatting&formatting-code ``]");

  FT("taskList",
     "[variable-2&formatting&formatting-list&formatting-list-ul - ][meta&formatting&formatting-task [ ]]][variable-2  foo]",
     "[variable-2&formatting&formatting-list&formatting-list-ul - ][property&formatting&formatting-task [x]]][variable-2  foo]");

  FT("formatting_strikethrough",
     "[strikethrough&formatting&formatting-strikethrough ~~][strikethrough foo][strikethrough&formatting&formatting-strikethrough ~~]");

  FT("formatting_strikethrough",
     "foo [strikethrough&formatting&formatting-strikethrough ~~][strikethrough bar][strikethrough&formatting&formatting-strikethrough ~~]");

  FT("formatting_emoji",
     "foo [builtin&formatting&formatting-emoji :smile:] foo");

  MT("emInWordAsterisk",
     "foo[em *bar*]hello");

  MT("emInWordUnderscore",
     "foo_bar_hello");

  MT("emStrongUnderscore",
     "[em&strong ___foo___] bar");

  MT("taskListAsterisk",
     "[variable-2 * ][link&variable-2 [[]]][variable-2 foo]", // Invalid; must have space or x between []
     "[variable-2 * ][link&variable-2 [[ ]]][variable-2 bar]", // Invalid; must have space after ]
     "[variable-2 * ][link&variable-2 [[x]]][variable-2 hello]", // Invalid; must have space after ]
     "[variable-2 * ][meta [ ]]][variable-2  ][link&variable-2 [[world]]]", // Valid; tests reference style links
     "    [variable-3 * ][property [x]]][variable-3  foo]"); // Valid; can be nested

  MT("taskListPlus",
     "[variable-2 + ][link&variable-2 [[]]][variable-2 foo]", // Invalid; must have space or x between []
     "[variable-2 + ][link&variable-2 [[x]]][variable-2 hello]", // Invalid; must have space after ]
     "[variable-2 + ][meta [ ]]][variable-2  ][link&variable-2 [[world]]]", // Valid; tests reference style links
     "    [variable-3 + ][property [x]]][variable-3  foo]"); // Valid; can be nested

  MT("taskListDash",
     "[variable-2 - ][link&variable-2 [[]]][variable-2 foo]", // Invalid; must have space or x between []
     "[variable-2 - ][link&variable-2 [[x]]][variable-2 hello]", // Invalid; must have space after ]
     "[variable-2 - ][meta [ ]]][variable-2  world]", // Valid; tests reference style links
     "    [variable-3 - ][property [x]]][variable-3  foo]"); // Valid; can be nested

  MT("taskListNumber",
     "[variable-2 1. ][link&variable-2 [[]]][variable-2 foo]", // Invalid; must have space or x between []
     "[variable-2 2. ][link&variable-2 [[ ]]][variable-2 bar]", // Invalid; must have space after ]
     "[variable-2 3. ][meta [ ]]][variable-2  world]", // Valid; tests reference style links
     "    [variable-3 1. ][property [x]]][variable-3  foo]"); // Valid; can be nested

  MT("SHA",
     "foo [link be6a8cc1c1ecfe9489fb51e4869af15a13fc2cd2] bar");

  MT("SHAEmphasis",
     "[em *foo ][em&link be6a8cc1c1ecfe9489fb51e4869af15a13fc2cd2][em *]");

  MT("shortSHA",
     "foo [link be6a8cc] bar");

  MT("tooShortSHA",
     "foo be6a8c bar");

  MT("longSHA",
     "foo be6a8cc1c1ecfe9489fb51e4869af15a13fc2cd22 bar");

  MT("badSHA",
     "foo be6a8cc1c1ecfe9489fb51e4869af15a13fc2cg2 bar");

  MT("userSHA",
     "foo [link bar@be6a8cc1c1ecfe9489fb51e4869af15a13fc2cd2] hello");

  MT("userSHAEmphasis",
     "[em *foo ][em&link bar@be6a8cc1c1ecfe9489fb51e4869af15a13fc2cd2][em *]");

  MT("userProjectSHA",
     "foo [link bar/hello@be6a8cc1c1ecfe9489fb51e4869af15a13fc2cd2] world");

  MT("userProjectSHAEmphasis",
     "[em *foo ][em&link bar/hello@be6a8cc1c1ecfe9489fb51e4869af15a13fc2cd2][em *]");

  MT("wordSHA",
     "ask for feedbac")

  MT("num",
     "foo [link #1] bar");

  MT("numEmphasis",
     "[em *foo ][em&link #1][em *]");

  MT("badNum",
     "foo #1bar hello");

  MT("userNum",
     "foo [link bar#1] hello");

  MT("userNumEmphasis",
     "[em *foo ][em&link bar#1][em *]");

  MT("userProjectNum",
     "foo [link bar/hello#1] world");

  MT("userProjectNumEmphasis",
     "[em *foo ][em&link bar/hello#1][em *]");

  MT("vanillaLink",
     "foo [link http://www.example.com/] bar");

  MT("vanillaLinkNoScheme",
     "foo [link www.example.com] bar");

  MT("vanillaLinkHttps",
     "foo [link https://www.example.com/] bar");

  MT("vanillaLinkDataSchema",
     "foo [link data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==] bar");

  MT("vanillaLinkPunctuation",
     "foo [link http://www.example.com/]. bar");

  MT("vanillaLinkExtension",
     "foo [link http://www.example.com/index.html] bar");

  MT("vanillaLinkEmphasis",
     "foo [em *][em&link http://www.example.com/index.html][em *] bar");

  MT("notALink",
     "foo asfd:asdf bar");

  MT("notALink",
     "[comment ``foo `bar` http://www.example.com/``] hello");

  MT("notALink",
     "[comment `foo]",
     "[comment&link http://www.example.com/]",
     "[comment `] foo",
     "",
     "[link http://www.example.com/]");

  MT("strikethrough",
     "[strikethrough ~~foo~~]");

  MT("strikethroughWithStartingSpace",
     "~~ foo~~");

  MT("strikethroughUnclosedStrayTildes",
    "[strikethrough ~~foo~~~]");

  MT("strikethroughUnclosedStrayTildes",
     "[strikethrough ~~foo ~~]");

  MT("strikethroughUnclosedStrayTildes",
    "[strikethrough ~~foo ~~ bar]");

  MT("strikethroughUnclosedStrayTildes",
    "[strikethrough ~~foo ~~ bar~~]hello");

  MT("strikethroughOneLetter",
     "[strikethrough ~~a~~]");

  MT("strikethroughWrapped",
     "[strikethrough ~~foo]",
     "[strikethrough foo~~]");

  MT("strikethroughParagraph",
     "[strikethrough ~~foo]",
     "",
     "foo[strikethrough ~~bar]");

  MT("strikethroughEm",
     "[strikethrough ~~foo][em&strikethrough *bar*][strikethrough ~~]");

  MT("strikethroughEm",
     "[em *][em&strikethrough ~~foo~~][em *]");

  MT("strikethroughStrong",
     "[strikethrough ~~][strong&strikethrough **foo**][strikethrough ~~]");

  MT("strikethroughStrong",
     "[strong **][strong&strikethrough ~~foo~~][strong **]");

  MT("emoji",
     "text [builtin :blush:] text [builtin :v:] text [builtin :+1:] text",
     ":text text: [builtin :smiley_cat:]");

})();
