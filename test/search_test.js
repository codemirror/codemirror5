(function() {
  "use strict";

  function run(doc, query, options) {
    var cursor = doc.getSearchCursor(query, null, options);
    for (var i = 3; i < arguments.length; i += 4) {
      var found = cursor.findNext();
      is(found, "not enough results (forward)");
      eqCharPos(Pos(arguments[i], arguments[i + 1]), cursor.from(), "from, forward, " + (i - 3) / 4);
      eqCharPos(Pos(arguments[i + 2], arguments[i + 3]), cursor.to(), "to, forward, " + (i - 3) / 4);
    }
    is(!cursor.findNext(), "too many matches (forward)");
    for (var i = arguments.length - 4; i >= 3; i -= 4) {
      var found = cursor.findPrevious();
      is(found, "not enough results (backwards)");
      eqCharPos(Pos(arguments[i], arguments[i + 1]), cursor.from(), "from, backwards, " + (i - 3) / 4);
      eqCharPos(Pos(arguments[i + 2], arguments[i + 3]), cursor.to(), "to, backwards, " + (i - 3) / 4);
    }
    is(!cursor.findPrevious(), "too many matches (backwards)");
  }

  function test(name, f) { window.test("search_" + name, f) }

  test("simple", function() {
    var doc = new CodeMirror.Doc("abcdefg\nabcdefg")
    run(doc, "cde", false, 0, 2, 0, 5, 1, 2, 1, 5);
  });

  test("multiline", function() {
    var doc = new CodeMirror.Doc("hallo\na\nb\ngoodbye")
    run(doc, "llo\na\nb\ngoo", false, 0, 2, 3, 3);
    run(doc, "blah\na\nb\nhall", false);
    run(doc, "bye\nx\neye", false);
  });

  test("regexp", function() {
    var doc = new CodeMirror.Doc("abcde\nabcde")
    run(doc, /bcd/, false, 0, 1, 0, 4, 1, 1, 1, 4);
    run(doc, /BCD/, false);
    run(doc, /BCD/i, false, 0, 1, 0, 4, 1, 1, 1, 4);
  });

  test("regexpMultiline", function() {
    var doc = new CodeMirror.Doc("foo foo\nbar\nbaz")
    run(doc, /fo[^]*az/, {multiline: true}, 0, 0, 2, 3)
    run(doc, /[oa][^u]/, {multiline: true}, 0, 1, 0, 3, 0, 5, 0, 7, 1, 1, 1, 3, 2, 1, 2, 3)
    run(doc, /[a][^u]{2}/, {multiline: true}, 1, 1, 2, 0)
  })

  test("insensitive", function() {
    var doc = new CodeMirror.Doc("hallo\nHALLO\noink\nhAllO")
    run(doc, "All", false, 3, 1, 3, 4);
    run(doc, "All", true, 0, 1, 0, 4, 1, 1, 1, 4, 3, 1, 3, 4);
  });

  test("multilineInsensitive", function() {
    var doc = new CodeMirror.Doc("zie ginds komT\nDe Stoomboot\nuit Spanje weer aan")
    run(doc, "komt\nde stoomboot\nuit", false);
    run(doc, "komt\nde stoomboot\nuit", {caseFold: true}, 0, 10, 2, 3);
    run(doc, "kOMt\ndE stOOmboot\nuiT", {caseFold: true}, 0, 10, 2, 3);
  });

  test("multilineInsensitiveSlow", function() {
    var text = ""
    for (var i = 0; i < 1000; i++) text += "foo\nbar\n"
    var doc = new CodeMirror.Doc("find\nme\n" + text + "find\nme\n")
    var t0 = +new Date
    run(doc, /find\nme/, {multiline: true}, 0, 0, 1, 2, 2002, 0, 2003, 2)
    is(+new Date - t0 < 100)
  })

  test("expandingCaseFold", function() {
    var doc = new CodeMirror.Doc("<b>İİ İİ</b>\n<b>uu uu</b>")
    run(doc, "</b>", true, 0, 8, 0, 12, 1, 8, 1, 12);
    run(doc, "İİ", true, 0, 3, 0, 5, 0, 6, 0, 8);
  });
})();
