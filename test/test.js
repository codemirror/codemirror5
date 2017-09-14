var Pos = CodeMirror.Pos;

CodeMirror.defaults.rtlMoveVisually = true;

function forEach(arr, f) {
  for (var i = 0, e = arr.length; i < e; ++i) f(arr[i], i);
}

function addDoc(cm, width, height) {
  var content = [], line = "";
  for (var i = 0; i < width; ++i) line += "x";
  for (var i = 0; i < height; ++i) content.push(line);
  cm.setValue(content.join("\n"));
}

function byClassName(elt, cls) {
  if (elt.getElementsByClassName) return elt.getElementsByClassName(cls);
  var found = [], re = new RegExp("\\b" + cls + "\\b");
  function search(elt) {
    if (elt.nodeType == 3) return;
    if (re.test(elt.className)) found.push(elt);
    for (var i = 0, e = elt.childNodes.length; i < e; ++i)
      search(elt.childNodes[i]);
  }
  search(elt);
  return found;
}

var ie_lt8 = /MSIE [1-7]\b/.test(navigator.userAgent);
var ie_lt9 = /MSIE [1-8]\b/.test(navigator.userAgent);
var mac = /Mac/.test(navigator.platform);
var phantom = /PhantomJS/.test(navigator.userAgent);
var opera = /Opera\/\./.test(navigator.userAgent);
var opera_version = opera && navigator.userAgent.match(/Version\/(\d+\.\d+)/);
if (opera_version) opera_version = Number(opera_version);
var opera_lt10 = opera && (!opera_version || opera_version < 10);

namespace = "core_";

test("core_fromTextArea", function() {
  var te = document.getElementById("code");
  te.value = "CONTENT";
  var cm = CodeMirror.fromTextArea(te);
  is(!te.offsetHeight);
  eq(cm.getValue(), "CONTENT");
  cm.setValue("foo\nbar");
  eq(cm.getValue(), "foo\nbar");
  cm.save();
  is(/^foo\r?\nbar$/.test(te.value));
  cm.setValue("xxx");
  cm.toTextArea();
  is(te.offsetHeight);
  eq(te.value, "xxx");
});

testCM("getRange", function(cm) {
  eq(cm.getLine(0), "1234");
  eq(cm.getLine(1), "5678");
  eq(cm.getLine(2), null);
  eq(cm.getLine(-1), null);
  eq(cm.getRange(Pos(0, 0), Pos(0, 3)), "123");
  eq(cm.getRange(Pos(0, -1), Pos(0, 200)), "1234");
  eq(cm.getRange(Pos(0, 2), Pos(1, 2)), "34\n56");
  eq(cm.getRange(Pos(1, 2), Pos(100, 0)), "78");
}, {value: "1234\n5678"});

testCM("replaceRange", function(cm) {
  eq(cm.getValue(), "");
  cm.replaceRange("foo\n", Pos(0, 0));
  eq(cm.getValue(), "foo\n");
  cm.replaceRange("a\nb", Pos(0, 1));
  eq(cm.getValue(), "fa\nboo\n");
  eq(cm.lineCount(), 3);
  cm.replaceRange("xyzzy", Pos(0, 0), Pos(1, 1));
  eq(cm.getValue(), "xyzzyoo\n");
  cm.replaceRange("abc", Pos(0, 0), Pos(10, 0));
  eq(cm.getValue(), "abc");
  eq(cm.lineCount(), 1);
});

testCM("selection", function(cm) {
  cm.setSelection(Pos(0, 4), Pos(2, 2));
  is(cm.somethingSelected());
  eq(cm.getSelection(), "11\n222222\n33");
  eqCursorPos(cm.getCursor(false), Pos(2, 2));
  eqCursorPos(cm.getCursor(true), Pos(0, 4));
  cm.setSelection(Pos(1, 0));
  is(!cm.somethingSelected());
  eq(cm.getSelection(), "");
  eqCursorPos(cm.getCursor(true), Pos(1, 0));
  cm.replaceSelection("abc", "around");
  eq(cm.getSelection(), "abc");
  eq(cm.getValue(), "111111\nabc222222\n333333");
  cm.replaceSelection("def", "end");
  eq(cm.getSelection(), "");
  eqCursorPos(cm.getCursor(true), Pos(1, 3));
  cm.setCursor(Pos(2, 1));
  eqCursorPos(cm.getCursor(true), Pos(2, 1));
  cm.setCursor(1, 2);
  eqCursorPos(cm.getCursor(true), Pos(1, 2));
}, {value: "111111\n222222\n333333"});

testCM("extendSelection", function(cm) {
  cm.setExtending(true);
  addDoc(cm, 10, 10);
  cm.setSelection(Pos(3, 5));
  eqCursorPos(cm.getCursor("head"), Pos(3, 5));
  eqCursorPos(cm.getCursor("anchor"), Pos(3, 5));
  cm.setSelection(Pos(2, 5), Pos(5, 5));
  eqCursorPos(cm.getCursor("head"), Pos(5, 5));
  eqCursorPos(cm.getCursor("anchor"), Pos(2, 5));
  eqCursorPos(cm.getCursor("start"), Pos(2, 5));
  eqCursorPos(cm.getCursor("end"), Pos(5, 5));
  cm.setSelection(Pos(5, 5), Pos(2, 5));
  eqCursorPos(cm.getCursor("head"), Pos(2, 5));
  eqCursorPos(cm.getCursor("anchor"), Pos(5, 5));
  eqCursorPos(cm.getCursor("start"), Pos(2, 5));
  eqCursorPos(cm.getCursor("end"), Pos(5, 5));
  cm.extendSelection(Pos(3, 2));
  eqCursorPos(cm.getCursor("head"), Pos(3, 2));
  eqCursorPos(cm.getCursor("anchor"), Pos(5, 5));
  cm.extendSelection(Pos(6, 2));
  eqCursorPos(cm.getCursor("head"), Pos(6, 2));
  eqCursorPos(cm.getCursor("anchor"), Pos(5, 5));
  cm.extendSelection(Pos(6, 3), Pos(6, 4));
  eqCursorPos(cm.getCursor("head"), Pos(6, 4));
  eqCursorPos(cm.getCursor("anchor"), Pos(5, 5));
  cm.extendSelection(Pos(0, 3), Pos(0, 4));
  eqCursorPos(cm.getCursor("head"), Pos(0, 3));
  eqCursorPos(cm.getCursor("anchor"), Pos(5, 5));
  cm.extendSelection(Pos(4, 5), Pos(6, 5));
  eqCursorPos(cm.getCursor("head"), Pos(6, 5));
  eqCursorPos(cm.getCursor("anchor"), Pos(4, 5));
  cm.setExtending(false);
  cm.extendSelection(Pos(0, 3), Pos(0, 4));
  eqCursorPos(cm.getCursor("head"), Pos(0, 3));
  eqCursorPos(cm.getCursor("anchor"), Pos(0, 4));
});

testCM("lines", function(cm) {
  eq(cm.getLine(0), "111111");
  eq(cm.getLine(1), "222222");
  eq(cm.getLine(-1), null);
  cm.replaceRange("", Pos(1, 0), Pos(2, 0))
  cm.replaceRange("abc", Pos(1, 0), Pos(1));
  eq(cm.getValue(), "111111\nabc");
}, {value: "111111\n222222\n333333"});

testCM("indent", function(cm) {
  cm.indentLine(1);
  eq(cm.getLine(1), "   blah();");
  cm.setOption("indentUnit", 8);
  cm.indentLine(1);
  eq(cm.getLine(1), "\tblah();");
  cm.setOption("indentUnit", 10);
  cm.setOption("tabSize", 4);
  cm.indentLine(1);
  eq(cm.getLine(1), "\t\t  blah();");
}, {value: "if (x) {\nblah();\n}", indentUnit: 3, indentWithTabs: true, tabSize: 8});

testCM("indentByNumber", function(cm) {
  cm.indentLine(0, 2);
  eq(cm.getLine(0), "  foo");
  cm.indentLine(0, -200);
  eq(cm.getLine(0), "foo");
  cm.setSelection(Pos(0, 0), Pos(1, 2));
  cm.indentSelection(3);
  eq(cm.getValue(), "   foo\n   bar\nbaz");
}, {value: "foo\nbar\nbaz"});

test("core_defaults", function() {
  var defsCopy = {}, defs = CodeMirror.defaults;
  for (var opt in defs) defsCopy[opt] = defs[opt];
  defs.indentUnit = 5;
  defs.value = "uu";
  defs.indentWithTabs = true;
  defs.tabindex = 55;
  var place = document.getElementById("testground"), cm = CodeMirror(place);
  try {
    eq(cm.getOption("indentUnit"), 5);
    cm.setOption("indentUnit", 10);
    eq(defs.indentUnit, 5);
    eq(cm.getValue(), "uu");
    eq(cm.getOption("indentWithTabs"), true);
    eq(cm.getInputField().tabIndex, 55);
  }
  finally {
    for (var opt in defsCopy) defs[opt] = defsCopy[opt];
    place.removeChild(cm.getWrapperElement());
  }
});

testCM("lineInfo", function(cm) {
  eq(cm.lineInfo(-1), null);
  var mark = document.createElement("span");
  var lh = cm.setGutterMarker(1, "FOO", mark);
  var info = cm.lineInfo(1);
  eq(info.text, "222222");
  eq(info.gutterMarkers.FOO, mark);
  eq(info.line, 1);
  eq(cm.lineInfo(2).gutterMarkers, null);
  cm.setGutterMarker(lh, "FOO", null);
  eq(cm.lineInfo(1).gutterMarkers, null);
  cm.setGutterMarker(1, "FOO", mark);
  cm.setGutterMarker(0, "FOO", mark);
  cm.clearGutter("FOO");
  eq(cm.lineInfo(0).gutterMarkers, null);
  eq(cm.lineInfo(1).gutterMarkers, null);
}, {value: "111111\n222222\n333333"});

testCM("coords", function(cm) {
  cm.setSize(null, 100);
  addDoc(cm, 32, 200);
  var top = cm.charCoords(Pos(0, 0));
  var bot = cm.charCoords(Pos(200, 30));
  is(top.left < bot.left);
  is(top.top < bot.top);
  is(top.top < top.bottom);
  cm.scrollTo(null, 100);
  var top2 = cm.charCoords(Pos(0, 0));
  is(top.top > top2.top);
  eq(top.left, top2.left);
});

testCM("coordsChar", function(cm) {
  addDoc(cm, 35, 70);
  for (var i = 0; i < 2; ++i) {
    var sys = i ? "local" : "page";
    for (var ch = 0; ch <= 35; ch += 5) {
      for (var line = 0; line < 70; line += 5) {
        cm.setCursor(line, ch);
        var coords = cm.charCoords(Pos(line, ch), sys);
        var pos = cm.coordsChar({left: coords.left + 1, top: coords.top + 1}, sys);
        eqCharPos(pos, Pos(line, ch));
      }
    }
  }
}, {lineNumbers: true});

testCM("coordsCharBidi", function(cm) {
  addDoc(cm, 35, 70);
  // Put an rtl character into each line to trigger the bidi code path in coordsChar
  cm.setValue(cm.getValue().replace(/\bx/g, 'و'))
  for (var i = 0; i < 2; ++i) {
    var sys = i ? "local" : "page";
    for (var ch = 2; ch <= 35; ch += 5) {
      for (var line = 0; line < 70; line += 5) {
        cm.setCursor(line, ch);
        var coords = cm.charCoords(Pos(line, ch), sys);
        var pos = cm.coordsChar({left: coords.left + 1, top: coords.top + 1}, sys);
        eqCharPos(pos, Pos(line, ch));
      }
    }
  }
}, {lineNumbers: true});

testCM("badBidiOptimization", function(cm) {
  var coords = cm.charCoords(Pos(0, 34))
  eqCharPos(cm.coordsChar({left: coords.right, top: coords.top + 2}), Pos(0, 34))
}, {value: "----------<p class=\"title\">هل يمكنك اختيار مستوى قسط التأمين الذي ترغب بدفعه؟</p>"})

testCM("posFromIndex", function(cm) {
  cm.setValue(
    "This function should\n" +
    "convert a zero based index\n" +
    "to line and ch."
  );

  var examples = [
    { index: -1, line: 0, ch: 0  }, // <- Tests clipping
    { index: 0,  line: 0, ch: 0  },
    { index: 10, line: 0, ch: 10 },
    { index: 39, line: 1, ch: 18 },
    { index: 55, line: 2, ch: 7  },
    { index: 63, line: 2, ch: 15 },
    { index: 64, line: 2, ch: 15 }  // <- Tests clipping
  ];

  for (var i = 0; i < examples.length; i++) {
    var example = examples[i];
    var pos = cm.posFromIndex(example.index);
    eq(pos.line, example.line);
    eq(pos.ch, example.ch);
    if (example.index >= 0 && example.index < 64)
      eq(cm.indexFromPos(pos), example.index);
  }
});

testCM("undo", function(cm) {
  cm.replaceRange("def", Pos(0, 0), Pos(0));
  eq(cm.historySize().undo, 1);
  cm.undo();
  eq(cm.getValue(), "abc");
  eq(cm.historySize().undo, 0);
  eq(cm.historySize().redo, 1);
  cm.redo();
  eq(cm.getValue(), "def");
  eq(cm.historySize().undo, 1);
  eq(cm.historySize().redo, 0);
  cm.setValue("1\n\n\n2");
  cm.clearHistory();
  eq(cm.historySize().undo, 0);
  for (var i = 0; i < 20; ++i) {
    cm.replaceRange("a", Pos(0, 0));
    cm.replaceRange("b", Pos(3, 0));
  }
  eq(cm.historySize().undo, 40);
  for (var i = 0; i < 40; ++i)
    cm.undo();
  eq(cm.historySize().redo, 40);
  eq(cm.getValue(), "1\n\n\n2");
}, {value: "abc"});

testCM("undoDepth", function(cm) {
  cm.replaceRange("d", Pos(0));
  cm.replaceRange("e", Pos(0));
  cm.replaceRange("f", Pos(0));
  cm.undo(); cm.undo(); cm.undo();
  eq(cm.getValue(), "abcd");
}, {value: "abc", undoDepth: 4});

testCM("undoDoesntClearValue", function(cm) {
  cm.undo();
  eq(cm.getValue(), "x");
}, {value: "x"});

testCM("undoMultiLine", function(cm) {
  cm.operation(function() {
    cm.replaceRange("x", Pos(0, 0));
    cm.replaceRange("y", Pos(1, 0));
  });
  cm.undo();
  eq(cm.getValue(), "abc\ndef\nghi");
  cm.operation(function() {
    cm.replaceRange("y", Pos(1, 0));
    cm.replaceRange("x", Pos(0, 0));
  });
  cm.undo();
  eq(cm.getValue(), "abc\ndef\nghi");
  cm.operation(function() {
    cm.replaceRange("y", Pos(2, 0));
    cm.replaceRange("x", Pos(1, 0));
    cm.replaceRange("z", Pos(2, 0));
  });
  cm.undo();
  eq(cm.getValue(), "abc\ndef\nghi", 3);
}, {value: "abc\ndef\nghi"});

testCM("undoComposite", function(cm) {
  cm.replaceRange("y", Pos(1));
  cm.operation(function() {
    cm.replaceRange("x", Pos(0));
    cm.replaceRange("z", Pos(2));
  });
  eq(cm.getValue(), "ax\nby\ncz\n");
  cm.undo();
  eq(cm.getValue(), "a\nby\nc\n");
  cm.undo();
  eq(cm.getValue(), "a\nb\nc\n");
  cm.redo(); cm.redo();
  eq(cm.getValue(), "ax\nby\ncz\n");
}, {value: "a\nb\nc\n"});

testCM("undoSelection", function(cm) {
  cm.setSelection(Pos(0, 2), Pos(0, 4));
  cm.replaceSelection("");
  cm.setCursor(Pos(1, 0));
  cm.undo();
  eqCursorPos(cm.getCursor(true), Pos(0, 2));
  eqCursorPos(cm.getCursor(false), Pos(0, 4));
  cm.setCursor(Pos(1, 0));
  cm.redo();
  eqCursorPos(cm.getCursor(true), Pos(0, 2));
  eqCursorPos(cm.getCursor(false), Pos(0, 2));
}, {value: "abcdefgh\n"});

testCM("undoSelectionAsBefore", function(cm) {
  cm.replaceSelection("abc", "around");
  cm.undo();
  cm.redo();
  eq(cm.getSelection(), "abc");
});

testCM("selectionChangeConfusesHistory", function(cm) {
  cm.replaceSelection("abc", null, "dontmerge");
  cm.operation(function() {
    cm.setCursor(Pos(0, 0));
    cm.replaceSelection("abc", null, "dontmerge");
  });
  eq(cm.historySize().undo, 2);
});

testCM("markTextSingleLine", function(cm) {
  forEach([{a: 0, b: 1, c: "", f: 2, t: 5},
           {a: 0, b: 4, c: "", f: 0, t: 2},
           {a: 1, b: 2, c: "x", f: 3, t: 6},
           {a: 4, b: 5, c: "", f: 3, t: 5},
           {a: 4, b: 5, c: "xx", f: 3, t: 7},
           {a: 2, b: 5, c: "", f: 2, t: 3},
           {a: 2, b: 5, c: "abcd", f: 6, t: 7},
           {a: 2, b: 6, c: "x", f: null, t: null},
           {a: 3, b: 6, c: "", f: null, t: null},
           {a: 0, b: 9, c: "hallo", f: null, t: null},
           {a: 4, b: 6, c: "x", f: 3, t: 4},
           {a: 4, b: 8, c: "", f: 3, t: 4},
           {a: 6, b: 6, c: "a", f: 3, t: 6},
           {a: 8, b: 9, c: "", f: 3, t: 6}], function(test) {
    cm.setValue("1234567890");
    var r = cm.markText(Pos(0, 3), Pos(0, 6), {className: "foo"});
    cm.replaceRange(test.c, Pos(0, test.a), Pos(0, test.b));
    var f = r.find();
    eq(f && f.from.ch, test.f); eq(f && f.to.ch, test.t);
  });
});

testCM("markTextMultiLine", function(cm) {
  function p(v) { return v && Pos(v[0], v[1]); }
  forEach([{a: [0, 0], b: [0, 5], c: "", f: [0, 0], t: [2, 5]},
           {a: [0, 0], b: [0, 5], c: "foo\n", f: [1, 0], t: [3, 5]},
           {a: [0, 1], b: [0, 10], c: "", f: [0, 1], t: [2, 5]},
           {a: [0, 5], b: [0, 6], c: "x", f: [0, 6], t: [2, 5]},
           {a: [0, 0], b: [1, 0], c: "", f: [0, 0], t: [1, 5]},
           {a: [0, 6], b: [2, 4], c: "", f: [0, 5], t: [0, 7]},
           {a: [0, 6], b: [2, 4], c: "aa", f: [0, 5], t: [0, 9]},
           {a: [1, 2], b: [1, 8], c: "", f: [0, 5], t: [2, 5]},
           {a: [0, 5], b: [2, 5], c: "xx", f: null, t: null},
           {a: [0, 0], b: [2, 10], c: "x", f: null, t: null},
           {a: [1, 5], b: [2, 5], c: "", f: [0, 5], t: [1, 5]},
           {a: [2, 0], b: [2, 3], c: "", f: [0, 5], t: [2, 2]},
           {a: [2, 5], b: [3, 0], c: "a\nb", f: [0, 5], t: [2, 5]},
           {a: [2, 3], b: [3, 0], c: "x", f: [0, 5], t: [2, 3]},
           {a: [1, 1], b: [1, 9], c: "1\n2\n3", f: [0, 5], t: [4, 5]}], function(test) {
    cm.setValue("aaaaaaaaaa\nbbbbbbbbbb\ncccccccccc\ndddddddd\n");
    var r = cm.markText(Pos(0, 5), Pos(2, 5),
                        {className: "CodeMirror-matchingbracket"});
    cm.replaceRange(test.c, p(test.a), p(test.b));
    var f = r.find();
    eqCursorPos(f && f.from, p(test.f)); eqCursorPos(f && f.to, p(test.t));
  });
});

testCM("markTextUndo", function(cm) {
  var marker1, marker2, bookmark;
  marker1 = cm.markText(Pos(0, 1), Pos(0, 3),
                        {className: "CodeMirror-matchingbracket"});
  marker2 = cm.markText(Pos(0, 0), Pos(2, 1),
                        {className: "CodeMirror-matchingbracket"});
  bookmark = cm.setBookmark(Pos(1, 5));
  cm.operation(function(){
    cm.replaceRange("foo", Pos(0, 2));
    cm.replaceRange("bar\nbaz\nbug\n", Pos(2, 0), Pos(3, 0));
  });
  var v1 = cm.getValue();
  cm.setValue("");
  eq(marker1.find(), null); eq(marker2.find(), null); eq(bookmark.find(), null);
  cm.undo();
  eqCursorPos(bookmark.find(), Pos(1, 5), "still there");
  cm.undo();
  var m1Pos = marker1.find(), m2Pos = marker2.find();
  eqCursorPos(m1Pos.from, Pos(0, 1)); eqCursorPos(m1Pos.to, Pos(0, 3));
  eqCursorPos(m2Pos.from, Pos(0, 0)); eqCursorPos(m2Pos.to, Pos(2, 1));
  eqCursorPos(bookmark.find(), Pos(1, 5));
  cm.redo(); cm.redo();
  eq(bookmark.find(), null);
  cm.undo();
  eqCursorPos(bookmark.find(), Pos(1, 5));
  eq(cm.getValue(), v1);
}, {value: "1234\n56789\n00\n"});

testCM("markTextStayGone", function(cm) {
  var m1 = cm.markText(Pos(0, 0), Pos(0, 1));
  cm.replaceRange("hi", Pos(0, 2));
  m1.clear();
  cm.undo();
  eq(m1.find(), null);
}, {value: "hello"});

testCM("markTextAllowEmpty", function(cm) {
  var m1 = cm.markText(Pos(0, 1), Pos(0, 2), {clearWhenEmpty: false});
  is(m1.find());
  cm.replaceRange("x", Pos(0, 0));
  is(m1.find());
  cm.replaceRange("y", Pos(0, 2));
  is(m1.find());
  cm.replaceRange("z", Pos(0, 3), Pos(0, 4));
  is(!m1.find());
  var m2 = cm.markText(Pos(0, 1), Pos(0, 2), {clearWhenEmpty: false,
                                              inclusiveLeft: true,
                                              inclusiveRight: true});
  cm.replaceRange("q", Pos(0, 1), Pos(0, 2));
  is(m2.find());
  cm.replaceRange("", Pos(0, 0), Pos(0, 3));
  is(!m2.find());
  var m3 = cm.markText(Pos(0, 1), Pos(0, 1), {clearWhenEmpty: false});
  cm.replaceRange("a", Pos(0, 3));
  is(m3.find());
  cm.replaceRange("b", Pos(0, 1));
  is(!m3.find());
}, {value: "abcde"});

testCM("markTextStacked", function(cm) {
  var m1 = cm.markText(Pos(0, 0), Pos(0, 0), {clearWhenEmpty: false});
  var m2 = cm.markText(Pos(0, 0), Pos(0, 0), {clearWhenEmpty: false});
  cm.replaceRange("B", Pos(0, 1));
  is(m1.find() && m2.find());
}, {value: "A"});

testCM("undoPreservesNewMarks", function(cm) {
  cm.markText(Pos(0, 3), Pos(0, 4));
  cm.markText(Pos(1, 1), Pos(1, 3));
  cm.replaceRange("", Pos(0, 3), Pos(3, 1));
  var mBefore = cm.markText(Pos(0, 0), Pos(0, 1));
  var mAfter = cm.markText(Pos(0, 5), Pos(0, 6));
  var mAround = cm.markText(Pos(0, 2), Pos(0, 4));
  cm.undo();
  eqCursorPos(mBefore.find().from, Pos(0, 0));
  eqCursorPos(mBefore.find().to, Pos(0, 1));
  eqCursorPos(mAfter.find().from, Pos(3, 3));
  eqCursorPos(mAfter.find().to, Pos(3, 4));
  eqCursorPos(mAround.find().from, Pos(0, 2));
  eqCursorPos(mAround.find().to, Pos(3, 2));
  var found = cm.findMarksAt(Pos(2, 2));
  eq(found.length, 1);
  eq(found[0], mAround);
}, {value: "aaaa\nbbbb\ncccc\ndddd"});

testCM("markClearBetween", function(cm) {
  cm.setValue("aaa\nbbb\nccc\nddd\n");
  cm.markText(Pos(0, 0), Pos(2));
  cm.replaceRange("aaa\nbbb\nccc", Pos(0, 0), Pos(2));
  eq(cm.findMarksAt(Pos(1, 1)).length, 0);
});

testCM("findMarksMiddle", function(cm) {
  var mark = cm.markText(Pos(1, 1), Pos(3, 1));
  var found = cm.findMarks(Pos(2, 1), Pos(2, 2));
  eq(found.length, 1);
  eq(found[0], mark);
}, {value: "line 0\nline 1\nline 2\nline 3"});

testCM("deleteSpanCollapsedInclusiveLeft", function(cm) {
  var from = Pos(1, 0), to = Pos(1, 1);
  var m = cm.markText(from, to, {collapsed: true, inclusiveLeft: true});
  // Delete collapsed span.
  cm.replaceRange("", from, to);
}, {value: "abc\nX\ndef"});

testCM("markTextCSS", function(cm) {
  function present() {
    var spans = cm.display.lineDiv.getElementsByTagName("span");
    for (var i = 0; i < spans.length; i++)
      if (spans[i].style.color == "cyan" && span[i].textContent == "cdefg") return true;
  }
  var m = cm.markText(Pos(0, 2), Pos(0, 6), {css: "color: cyan"});
  m.clear();
  is(!present());
}, {value: "abcdefgh"});

testCM("bookmark", function(cm) {
  function p(v) { return v && Pos(v[0], v[1]); }
  forEach([{a: [1, 0], b: [1, 1], c: "", d: [1, 4]},
           {a: [1, 1], b: [1, 1], c: "xx", d: [1, 7]},
           {a: [1, 4], b: [1, 5], c: "ab", d: [1, 6]},
           {a: [1, 4], b: [1, 6], c: "", d: null},
           {a: [1, 5], b: [1, 6], c: "abc", d: [1, 5]},
           {a: [1, 6], b: [1, 8], c: "", d: [1, 5]},
           {a: [1, 4], b: [1, 4], c: "\n\n", d: [3, 1]},
           {bm: [1, 9], a: [1, 1], b: [1, 1], c: "\n", d: [2, 8]}], function(test) {
    cm.setValue("1234567890\n1234567890\n1234567890");
    var b = cm.setBookmark(p(test.bm) || Pos(1, 5));
    cm.replaceRange(test.c, p(test.a), p(test.b));
    eqCursorPos(b.find(), p(test.d));
  });
});

testCM("bookmarkInsertLeft", function(cm) {
  var br = cm.setBookmark(Pos(0, 2), {insertLeft: false});
  var bl = cm.setBookmark(Pos(0, 2), {insertLeft: true});
  cm.setCursor(Pos(0, 2));
  cm.replaceSelection("hi");
  eqCursorPos(br.find(), Pos(0, 2));
  eqCursorPos(bl.find(), Pos(0, 4));
  cm.replaceRange("", Pos(0, 4), Pos(0, 5));
  cm.replaceRange("", Pos(0, 2), Pos(0, 4));
  cm.replaceRange("", Pos(0, 1), Pos(0, 2));
  // Verify that deleting next to bookmarks doesn't kill them
  eqCursorPos(br.find(), Pos(0, 1));
  eqCursorPos(bl.find(), Pos(0, 1));
}, {value: "abcdef"});

testCM("bookmarkCursor", function(cm) {
  var pos01 = cm.cursorCoords(Pos(0, 1)), pos11 = cm.cursorCoords(Pos(1, 1)),
      pos20 = cm.cursorCoords(Pos(2, 0)), pos30 = cm.cursorCoords(Pos(3, 0)),
      pos41 = cm.cursorCoords(Pos(4, 1));
  cm.setBookmark(Pos(0, 1), {widget: document.createTextNode("←"), insertLeft: true});
  cm.setBookmark(Pos(2, 0), {widget: document.createTextNode("←"), insertLeft: true});
  cm.setBookmark(Pos(1, 1), {widget: document.createTextNode("→")});
  cm.setBookmark(Pos(3, 0), {widget: document.createTextNode("→")});
  var new01 = cm.cursorCoords(Pos(0, 1)), new11 = cm.cursorCoords(Pos(1, 1)),
      new20 = cm.cursorCoords(Pos(2, 0)), new30 = cm.cursorCoords(Pos(3, 0));
  near(new01.left, pos01.left, 1);
  near(new01.top, pos01.top, 1);
  is(new11.left > pos11.left, "at right, middle of line");
  near(new11.top == pos11.top, 1);
  near(new20.left, pos20.left, 1);
  near(new20.top, pos20.top, 1);
  is(new30.left > pos30.left, "at right, empty line");
  near(new30.top, pos30, 1);
  cm.setBookmark(Pos(4, 0), {widget: document.createTextNode("→")});
  is(cm.cursorCoords(Pos(4, 1)).left > pos41.left, "single-char bug");
}, {value: "foo\nbar\n\n\nx\ny"});

testCM("multiBookmarkCursor", function(cm) {
  if (phantom) return;
  var ms = [], m;
  function add(insertLeft) {
    for (var i = 0; i < 3; ++i) {
      var node = document.createElement("span");
      node.innerHTML = "X";
      ms.push(cm.setBookmark(Pos(0, 1), {widget: node, insertLeft: insertLeft}));
    }
  }
  var base1 = cm.cursorCoords(Pos(0, 1)).left, base4 = cm.cursorCoords(Pos(0, 4)).left;
  add(true);
  near(base1, cm.cursorCoords(Pos(0, 1)).left, 1);
  while (m = ms.pop()) m.clear();
  add(false);
  near(base4, cm.cursorCoords(Pos(0, 1)).left, 1);
}, {value: "abcdefg"});

testCM("getAllMarks", function(cm) {
  addDoc(cm, 10, 10);
  var m1 = cm.setBookmark(Pos(0, 2));
  var m2 = cm.markText(Pos(0, 2), Pos(3, 2));
  var m3 = cm.markText(Pos(1, 2), Pos(1, 8));
  var m4 = cm.markText(Pos(8, 0), Pos(9, 0));
  eq(cm.getAllMarks().length, 4);
  m1.clear();
  m3.clear();
  eq(cm.getAllMarks().length, 2);
});

testCM("setValueClears", function(cm) {
  cm.addLineClass(0, "wrap", "foo");
  var mark = cm.markText(Pos(0, 0), Pos(1, 1), {inclusiveLeft: true, inclusiveRight: true});
  cm.setValue("foo");
  is(!cm.lineInfo(0).wrapClass);
  is(!mark.find());
}, {value: "a\nb"});

testCM("bug577", function(cm) {
  cm.setValue("a\nb");
  cm.clearHistory();
  cm.setValue("fooooo");
  cm.undo();
});

testCM("scrollSnap", function(cm) {
  cm.setSize(100, 100);
  addDoc(cm, 200, 200);
  cm.setCursor(Pos(100, 180));
  var info = cm.getScrollInfo();
  is(info.left > 0 && info.top > 0);
  cm.setCursor(Pos(0, 0));
  info = cm.getScrollInfo();
  is(info.left == 0 && info.top == 0, "scrolled clean to top");
  cm.setCursor(Pos(100, 180));
  cm.setCursor(Pos(199, 0));
  info = cm.getScrollInfo();
  is(info.left == 0 && info.top + 2 > info.height - cm.getScrollerElement().clientHeight, "scrolled clean to bottom");
});

testCM("scrollIntoView", function(cm) {
  if (phantom) return;
  function test(line, ch, msg) {
    var pos = Pos(line, ch);
    cm.scrollIntoView(pos);
    var outer = cm.getWrapperElement().getBoundingClientRect();
    var box = cm.charCoords(pos, "window");
    is(box.left >= outer.left, msg + " (left)");
    is(box.right <= outer.right, msg + " (right)");
    is(box.top >= outer.top, msg + " (top)");
    is(box.bottom <= outer.bottom, msg + " (bottom)");
  }
  addDoc(cm, 200, 200);
  test(199, 199, "bottom right");
  test(0, 0, "top left");
  test(100, 100, "center");
  test(199, 0, "bottom left");
  test(0, 199, "top right");
  test(100, 100, "center again");
});

testCM("scrollBackAndForth", function(cm) {
  addDoc(cm, 1, 200);
  cm.operation(function() {
    cm.scrollIntoView(Pos(199, 0));
    cm.scrollIntoView(Pos(4, 0));
  });
  is(cm.getScrollInfo().top > 0);
});

testCM("selectAllNoScroll", function(cm) {
  addDoc(cm, 1, 200);
  cm.execCommand("selectAll");
  eq(cm.getScrollInfo().top, 0);
  cm.setCursor(199);
  cm.execCommand("selectAll");
  is(cm.getScrollInfo().top > 0);
});

testCM("selectionPos", function(cm) {
  if (phantom || cm.getOption("inputStyle") != "textarea") return;
  cm.setSize(100, 100);
  addDoc(cm, 200, 100);
  cm.setSelection(Pos(1, 100), Pos(98, 100));
  var lineWidth = cm.charCoords(Pos(0, 200), "local").left;
  var lineHeight = (cm.charCoords(Pos(99)).top - cm.charCoords(Pos(0)).top) / 100;
  cm.scrollTo(0, 0);
  var selElt = byClassName(cm.getWrapperElement(), "CodeMirror-selected");
  var outer = cm.getWrapperElement().getBoundingClientRect();
  var sawMiddle, sawTop, sawBottom;
  for (var i = 0, e = selElt.length; i < e; ++i) {
    var box = selElt[i].getBoundingClientRect();
    var atLeft = box.left - outer.left < 30;
    var width = box.right - box.left;
    var atRight = box.right - outer.left > .8 * lineWidth;
    if (atLeft && atRight) {
      sawMiddle = true;
      is(box.bottom - box.top > 90 * lineHeight, "middle high");
      is(width > .9 * lineWidth, "middle wide");
    } else {
      is(width > .4 * lineWidth, "top/bot wide enough");
      is(width < .6 * lineWidth, "top/bot slim enough");
      if (atLeft) {
        sawBottom = true;
        is(box.top - outer.top > 96 * lineHeight, "bot below");
      } else if (atRight) {
        sawTop = true;
        is(box.top - outer.top < 2.1 * lineHeight, "top above");
      }
    }
  }
  is(sawTop && sawBottom && sawMiddle, "all parts");
}, null);

testCM("restoreHistory", function(cm) {
  cm.setValue("abc\ndef");
  cm.replaceRange("hello", Pos(1, 0), Pos(1));
  cm.replaceRange("goop", Pos(0, 0), Pos(0));
  cm.undo();
  var storedVal = cm.getValue(), storedHist = cm.getHistory();
  if (window.JSON) storedHist = JSON.parse(JSON.stringify(storedHist));
  eq(storedVal, "abc\nhello");
  cm.setValue("");
  cm.clearHistory();
  eq(cm.historySize().undo, 0);
  cm.setValue(storedVal);
  cm.setHistory(storedHist);
  cm.redo();
  eq(cm.getValue(), "goop\nhello");
  cm.undo(); cm.undo();
  eq(cm.getValue(), "abc\ndef");
});

testCM("doubleScrollbar", function(cm) {
  var dummy = document.body.appendChild(document.createElement("p"));
  dummy.style.cssText = "height: 50px; overflow: scroll; width: 50px";
  var scrollbarWidth = dummy.offsetWidth + 1 - dummy.clientWidth;
  document.body.removeChild(dummy);
  if (scrollbarWidth < 2) return;
  cm.setSize(null, 100);
  addDoc(cm, 1, 300);
  var wrap = cm.getWrapperElement();
  is(wrap.offsetWidth - byClassName(wrap, "CodeMirror-lines")[0].offsetWidth <= scrollbarWidth * 1.5);
});

testCM("weirdLinebreaks", function(cm) {
  cm.setValue("foo\nbar\rbaz\r\nquux\n\rplop");
  is(cm.getValue(), "foo\nbar\nbaz\nquux\n\nplop");
  is(cm.lineCount(), 6);
  cm.setValue("\n\n");
  is(cm.lineCount(), 3);
});

testCM("setSize", function(cm) {
  cm.setSize(100, 100);
  var wrap = cm.getWrapperElement();
  is(wrap.offsetWidth, 100);
  is(wrap.offsetHeight, 100);
  cm.setSize("100%", "3em");
  is(wrap.style.width, "100%");
  is(wrap.style.height, "3em");
  cm.setSize(null, 40);
  is(wrap.style.width, "100%");
  is(wrap.style.height, "40px");
});

function foldLines(cm, start, end, autoClear) {
  return cm.markText(Pos(start, 0), Pos(end - 1), {
    inclusiveLeft: true,
    inclusiveRight: true,
    collapsed: true,
    clearOnEnter: autoClear
  });
}

testCM("collapsedLines", function(cm) {
  addDoc(cm, 4, 10);
  var range = foldLines(cm, 4, 5), cleared = 0;
  CodeMirror.on(range, "clear", function() {cleared++;});
  cm.setCursor(Pos(3, 0));
  CodeMirror.commands.goLineDown(cm);
  eqCharPos(cm.getCursor(), Pos(5, 0));
  cm.replaceRange("abcdefg", Pos(3, 0), Pos(3));
  cm.setCursor(Pos(3, 6));
  CodeMirror.commands.goLineDown(cm);
  eqCharPos(cm.getCursor(), Pos(5, 4));
  cm.replaceRange("ab", Pos(3, 0), Pos(3));
  cm.setCursor(Pos(3, 2));
  CodeMirror.commands.goLineDown(cm);
  eqCharPos(cm.getCursor(), Pos(5, 2));
  cm.operation(function() {range.clear(); range.clear();});
  eq(cleared, 1);
});

testCM("collapsedRangeCoordsChar", function(cm) {
  var pos_1_3 = cm.charCoords(Pos(1, 3));
  pos_1_3.left += 2; pos_1_3.top += 2;
  var opts = {collapsed: true, inclusiveLeft: true, inclusiveRight: true};
  var m1 = cm.markText(Pos(0, 0), Pos(2, 0), opts);
  eqCharPos(cm.coordsChar(pos_1_3), Pos(3, 3));
  m1.clear();
  var m1 = cm.markText(Pos(0, 0), Pos(1, 1), {collapsed: true, inclusiveLeft: true});
  var m2 = cm.markText(Pos(1, 1), Pos(2, 0), {collapsed: true, inclusiveRight: true});
  eqCharPos(cm.coordsChar(pos_1_3), Pos(3, 3));
  m1.clear(); m2.clear();
  var m1 = cm.markText(Pos(0, 0), Pos(1, 6), opts);
  eqCharPos(cm.coordsChar(pos_1_3), Pos(3, 3));
}, {value: "123456\nabcdef\nghijkl\nmnopqr\n"});

testCM("collapsedRangeBetweenLinesSelected", function(cm) {
  if (cm.getOption("inputStyle") != "textarea") return;
  var widget = document.createElement("span");
  widget.textContent = "\u2194";
  cm.markText(Pos(0, 3), Pos(1, 0), {replacedWith: widget});
  cm.setSelection(Pos(0, 3), Pos(1, 0));
  var selElts = byClassName(cm.getWrapperElement(), "CodeMirror-selected");
  for (var i = 0, w = 0; i < selElts.length; i++)
    w += selElts[i].offsetWidth;
  is(w > 0);
}, {value: "one\ntwo"});

testCM("randomCollapsedRanges", function(cm) {
  addDoc(cm, 20, 500);
  cm.operation(function() {
    for (var i = 0; i < 200; i++) {
      var start = Pos(Math.floor(Math.random() * 500), Math.floor(Math.random() * 20));
      if (i % 4)
        try { cm.markText(start, Pos(start.line + 2, 1), {collapsed: true}); }
        catch(e) { if (!/overlapping/.test(String(e))) throw e; }
      else
        cm.markText(start, Pos(start.line, start.ch + 4), {"className": "foo"});
    }
  });
});

testCM("hiddenLinesAutoUnfold", function(cm) {
  var range = foldLines(cm, 1, 3, true), cleared = 0;
  CodeMirror.on(range, "clear", function() {cleared++;});
  cm.setCursor(Pos(3, 0));
  eq(cleared, 0);
  cm.execCommand("goCharLeft");
  eq(cleared, 1);
  range = foldLines(cm, 1, 3, true);
  CodeMirror.on(range, "clear", function() {cleared++;});
  eqCursorPos(cm.getCursor(), Pos(3, 0));
  cm.setCursor(Pos(0, 3));
  cm.execCommand("goCharRight");
  eq(cleared, 2);
}, {value: "abc\ndef\nghi\njkl"});

testCM("hiddenLinesSelectAll", function(cm) {  // Issue #484
  addDoc(cm, 4, 20);
  foldLines(cm, 0, 10);
  foldLines(cm, 11, 20);
  CodeMirror.commands.selectAll(cm);
  eqCursorPos(cm.getCursor(true), Pos(10, 0));
  eqCursorPos(cm.getCursor(false), Pos(10, 4));
});


testCM("everythingFolded", function(cm) {
  addDoc(cm, 2, 2);
  function enterPress() {
    cm.triggerOnKeyDown({type: "keydown", keyCode: 13, preventDefault: function(){}, stopPropagation: function(){}});
  }
  var fold = foldLines(cm, 0, 2);
  enterPress();
  eq(cm.getValue(), "xx\nxx");
  fold.clear();
  fold = foldLines(cm, 0, 2, true);
  eq(fold.find(), null);
  enterPress();
  eq(cm.getValue(), "\nxx\nxx");
});

testCM("structuredFold", function(cm) {
  if (phantom) return;
  addDoc(cm, 4, 8);
  var range = cm.markText(Pos(1, 2), Pos(6, 2), {
    replacedWith: document.createTextNode("Q")
  });
  cm.setCursor(0, 3);
  CodeMirror.commands.goLineDown(cm);
  eqCharPos(cm.getCursor(), Pos(6, 2));
  CodeMirror.commands.goCharLeft(cm);
  eqCharPos(cm.getCursor(), Pos(1, 2));
  CodeMirror.commands.delCharAfter(cm);
  eq(cm.getValue(), "xxxx\nxxxx\nxxxx");
  addDoc(cm, 4, 8);
  range = cm.markText(Pos(1, 2), Pos(6, 2), {
    replacedWith: document.createTextNode("M"),
    clearOnEnter: true
  });
  var cleared = 0;
  CodeMirror.on(range, "clear", function(){++cleared;});
  cm.setCursor(0, 3);
  CodeMirror.commands.goLineDown(cm);
  eqCharPos(cm.getCursor(), Pos(6, 2));
  CodeMirror.commands.goCharLeft(cm);
  eqCharPos(cm.getCursor(), Pos(6, 1));
  eq(cleared, 1);
  range.clear();
  eq(cleared, 1);
  range = cm.markText(Pos(1, 2), Pos(6, 2), {
    replacedWith: document.createTextNode("Q"),
    clearOnEnter: true
  });
  range.clear();
  cm.setCursor(1, 2);
  CodeMirror.commands.goCharRight(cm);
  eqCharPos(cm.getCursor(), Pos(1, 3));
  range = cm.markText(Pos(2, 0), Pos(4, 4), {
    replacedWith: document.createTextNode("M")
  });
  cm.setCursor(1, 0);
  CodeMirror.commands.goLineDown(cm);
  eqCharPos(cm.getCursor(), Pos(2, 0));
}, null);

testCM("nestedFold", function(cm) {
  addDoc(cm, 10, 3);
  function fold(ll, cl, lr, cr) {
    return cm.markText(Pos(ll, cl), Pos(lr, cr), {collapsed: true});
  }
  var inner1 = fold(0, 6, 1, 3), inner2 = fold(0, 2, 1, 8), outer = fold(0, 1, 2, 3), inner0 = fold(0, 5, 0, 6);
  cm.setCursor(0, 1);
  CodeMirror.commands.goCharRight(cm);
  eqCursorPos(cm.getCursor(), Pos(2, 3));
  inner0.clear();
  CodeMirror.commands.goCharLeft(cm);
  eqCursorPos(cm.getCursor(), Pos(0, 1));
  outer.clear();
  CodeMirror.commands.goCharRight(cm);
  eqCursorPos(cm.getCursor(), Pos(0, 2, "before"));
  CodeMirror.commands.goCharRight(cm);
  eqCursorPos(cm.getCursor(), Pos(1, 8));
  inner2.clear();
  CodeMirror.commands.goCharLeft(cm);
  eqCursorPos(cm.getCursor(), Pos(1, 7, "after"));
  cm.setCursor(0, 5);
  CodeMirror.commands.goCharRight(cm);
  eqCursorPos(cm.getCursor(), Pos(0, 6, "before"));
  CodeMirror.commands.goCharRight(cm);
  eqCursorPos(cm.getCursor(), Pos(1, 3));
});

testCM("badNestedFold", function(cm) {
  addDoc(cm, 4, 4);
  cm.markText(Pos(0, 2), Pos(3, 2), {collapsed: true});
  var caught;
  try {cm.markText(Pos(0, 1), Pos(0, 3), {collapsed: true});}
  catch(e) {caught = e;}
  is(caught instanceof Error, "no error");
  is(/overlap/i.test(caught.message), "wrong error");
});

testCM("nestedFoldOnSide", function(cm) {
  var m1 = cm.markText(Pos(0, 1), Pos(2, 1), {collapsed: true, inclusiveRight: true});
  var m2 = cm.markText(Pos(0, 1), Pos(0, 2), {collapsed: true});
  cm.markText(Pos(0, 1), Pos(0, 2), {collapsed: true}).clear();
  try { cm.markText(Pos(0, 1), Pos(0, 2), {collapsed: true, inclusiveLeft: true}); }
  catch(e) { var caught = e; }
  is(caught && /overlap/i.test(caught.message));
  var m3 = cm.markText(Pos(2, 0), Pos(2, 1), {collapsed: true});
  var m4 = cm.markText(Pos(2, 0), Pos(2, 1), {collapse: true, inclusiveRight: true});
  m1.clear(); m4.clear();
  m1 = cm.markText(Pos(0, 1), Pos(2, 1), {collapsed: true});
  cm.markText(Pos(2, 0), Pos(2, 1), {collapsed: true}).clear();
  try { cm.markText(Pos(2, 0), Pos(2, 1), {collapsed: true, inclusiveRight: true}); }
  catch(e) { var caught = e; }
  is(caught && /overlap/i.test(caught.message));
}, {value: "ab\ncd\ef"});

testCM("editInFold", function(cm) {
  addDoc(cm, 4, 6);
  var m = cm.markText(Pos(1, 2), Pos(3, 2), {collapsed: true});
  cm.replaceRange("", Pos(0, 0), Pos(1, 3));
  cm.replaceRange("", Pos(2, 1), Pos(3, 3));
  cm.replaceRange("a\nb\nc\nd", Pos(0, 1), Pos(1, 0));
  cm.cursorCoords(Pos(0, 0));
});

testCM("wrappingInlineWidget", function(cm) {
  cm.setSize("11em");
  var w = document.createElement("span");
  w.style.color = "red";
  w.innerHTML = "one two three four";
  cm.markText(Pos(0, 6), Pos(0, 9), {replacedWith: w});
  var cur0 = cm.cursorCoords(Pos(0, 0)), cur1 = cm.cursorCoords(Pos(0, 10));
  is(cur0.top < cur1.top);
  is(cur0.bottom < cur1.bottom);
  var curL = cm.cursorCoords(Pos(0, 6)), curR = cm.cursorCoords(Pos(0, 9));
  eq(curL.top, cur0.top);
  eq(curL.bottom, cur0.bottom);
  eq(curR.top, cur1.top);
  eq(curR.bottom, cur1.bottom);
  cm.replaceRange("", Pos(0, 9), Pos(0));
  curR = cm.cursorCoords(Pos(0, 9));
  if (phantom) return;
  eq(curR.top, cur1.top);
  eq(curR.bottom, cur1.bottom);
}, {value: "1 2 3 xxx 4", lineWrapping: true});

testCM("showEmptyWidgetSpan", function(cm) {
  var marker = cm.markText(Pos(0, 2), Pos(0, 2), {
    clearWhenEmpty: false,
    replacedWith: document.createTextNode("X")
  });
  var text = cm.display.view[0].text;
  eq(text.textContent || text.innerText, "abXc");
}, {value: "abc"});

testCM("changedInlineWidget", function(cm) {
  cm.setSize("10em");
  var w = document.createElement("span");
  w.innerHTML = "x";
  var m = cm.markText(Pos(0, 4), Pos(0, 5), {replacedWith: w});
  w.innerHTML = "and now the widget is really really long all of a sudden and a scrollbar is needed";
  m.changed();
  var hScroll = byClassName(cm.getWrapperElement(), "CodeMirror-hscrollbar")[0];
  is(hScroll.scrollWidth > hScroll.clientWidth);
}, {value: "hello there"});

testCM("changedBookmark", function(cm) {
  cm.setSize("10em");
  var w = document.createElement("span");
  w.innerHTML = "x";
  var m = cm.setBookmark(Pos(0, 4), {widget: w});
  w.innerHTML = "and now the widget is really really long all of a sudden and a scrollbar is needed";
  m.changed();
  var hScroll = byClassName(cm.getWrapperElement(), "CodeMirror-hscrollbar")[0];
  is(hScroll.scrollWidth > hScroll.clientWidth);
}, {value: "abcdefg"});

testCM("inlineWidget", function(cm) {
  var w = cm.setBookmark(Pos(0, 2), {widget: document.createTextNode("uu")});
  cm.setCursor(0, 2);
  CodeMirror.commands.goLineDown(cm);
  eqCharPos(cm.getCursor(), Pos(1, 4));
  cm.setCursor(0, 2);
  cm.replaceSelection("hi");
  eqCharPos(w.find(), Pos(0, 2));
  cm.setCursor(0, 1);
  cm.replaceSelection("ay");
  eqCharPos(w.find(), Pos(0, 4));
  eq(cm.getLine(0), "uayuhiuu");
}, {value: "uuuu\nuuuuuu"});

testCM("wrappingAndResizing", function(cm) {
  cm.setSize(null, "auto");
  cm.setOption("lineWrapping", true);
  var wrap = cm.getWrapperElement(), h0 = wrap.offsetHeight;
  var doc = "xxx xxx xxx xxx xxx";
  cm.setValue(doc);
  for (var step = 10, w = cm.charCoords(Pos(0, 18), "div").right;; w += step) {
    cm.setSize(w);
    if (wrap.offsetHeight <= h0 * (opera_lt10 ? 1.2 : 1.5)) {
      if (step == 10) { w -= 10; step = 1; }
      else break;
    }
  }
  // Ensure that putting the cursor at the end of the maximally long
  // line doesn't cause wrapping to happen.
  cm.setCursor(Pos(0, doc.length));
  eq(wrap.offsetHeight, h0);
  cm.replaceSelection("x");
  is(wrap.offsetHeight > h0, "wrapping happens");
  // Now add a max-height and, in a document consisting of
  // almost-wrapped lines, go over it so that a scrollbar appears.
  cm.setValue(doc + "\n" + doc + "\n");
  cm.getScrollerElement().style.maxHeight = "100px";
  cm.replaceRange("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n!\n", Pos(2, 0));
  forEach([Pos(0, doc.length), Pos(0, doc.length - 1),
           Pos(0, 0), Pos(1, doc.length), Pos(1, doc.length - 1)],
          function(pos) {
    var coords = cm.charCoords(pos);
    eqCharPos(pos, cm.coordsChar({left: coords.left + 2, top: coords.top + 5}));
  });
}, null, ie_lt8);

testCM("measureEndOfLine", function(cm) {
  if (phantom) return;
  cm.setSize(null, "auto");
  var inner = byClassName(cm.getWrapperElement(), "CodeMirror-lines")[0].firstChild;
  var lh = inner.offsetHeight;
  for (var step = 10, w = cm.charCoords(Pos(0, 7), "div").right;; w += step) {
    cm.setSize(w);
    if (inner.offsetHeight < 2.5 * lh) {
      if (step == 10) { w -= 10; step = 1; }
      else break;
    }
  }
  cm.setValue(cm.getValue() + "\n\n");
  var endPos = cm.charCoords(Pos(0, 18), "local");
  is(endPos.top > lh * .8, "not at top");
  is(endPos.left > w - 20, "at right");
  endPos = cm.charCoords(Pos(0, 18));
  eqCursorPos(cm.coordsChar({left: endPos.left, top: endPos.top + 5}), Pos(0, 18, "before"));

  var wrapPos = cm.cursorCoords(Pos(0, 9, "before"));
  is(wrapPos.top < endPos.top, "wrapPos is actually in first line");
  eqCursorPos(cm.coordsChar({left: wrapPos.left + 10, top: wrapPos.top}), Pos(0, 9, "before"));
}, {mode: "text/html", value: "<!-- foo barrr -->", lineWrapping: true}, ie_lt8 || opera_lt10);

testCM("measureWrappedEndOfLine", function(cm) {
  if (phantom) return;
  cm.setSize(null, "auto");
  var inner = byClassName(cm.getWrapperElement(), "CodeMirror-lines")[0].firstChild;
  var lh = inner.offsetHeight;
  for (var step = 10, w = cm.charCoords(Pos(0, 7), "div").right;; w += step) {
    cm.setSize(w);
    if (inner.offsetHeight < 2.5 * lh) {
      if (step == 10) { w -= 10; step = 1; }
      else break;
    }
  }
  for (var i = 0; i < 3; ++i) {
    var endPos = cm.charCoords(Pos(0, 12)); // Next-to-last since last would wrap (#1862)
    endPos.left += w; // Add width of editor just to be sure that we are behind last character
    eqCursorPos(cm.coordsChar(endPos), Pos(0, 13, "before"));
    endPos.left += w * 100;
    eqCursorPos(cm.coordsChar(endPos), Pos(0, 13, "before"));
    cm.setValue("0123456789abcابجابجابجابج");
    if (i == 1) {
      var node = document.createElement("div");
      node.innerHTML = "hi"; node.style.height = "30px";
      cm.addLineWidget(0, node, {above: true});
    }
  }
}, {mode: "text/html", value: "0123456789abcde0123456789", lineWrapping: true}, ie_lt8 || opera_lt10);

testCM("measureEndOfLineBidi", function(cm) {
  eqCursorPos(cm.coordsChar({left: 5000, top: cm.charCoords(Pos(0, 0)).top}), Pos(0, 8, "after"))
}, {value: "إإإإuuuuإإإإ"})

testCM("measureWrappedBidiLevel2", function(cm) {
  cm.setSize(cm.charCoords(Pos(0, 6), "editor").right + 60)
  var c9 = cm.charCoords(Pos(0, 9))
  eqCharPos(cm.coordsChar({left: c9.right - 1, top: c9.top + 1}), Pos(0, 9))
}, {value: "foobar إإ إإ إإ إإ 555 بببببب", lineWrapping: true})

testCM("measureWrappedBeginOfLine", function(cm) {
  if (phantom) return;
  cm.setSize(null, "auto");
  var inner = byClassName(cm.getWrapperElement(), "CodeMirror-lines")[0].firstChild;
  var lh = inner.offsetHeight;
  for (var step = 10, w = cm.charCoords(Pos(0, 7), "div").right;; w += step) {
    cm.setSize(w);
    if (inner.offsetHeight < 2.5 * lh) {
      if (step == 10) { w -= 10; step = 1; }
      else break;
    }
  }
  var beginOfSecondLine = Pos(0, 13, "after");
  for (var i = 0; i < 2; ++i) {
    var beginPos = cm.charCoords(Pos(0, 0));
    beginPos.left -= w;
    eqCursorPos(cm.coordsChar(beginPos), Pos(0, 0, "after"));
    beginPos = cm.cursorCoords(beginOfSecondLine);
    beginPos.left = 0;
    eqCursorPos(cm.coordsChar(beginPos), beginOfSecondLine);
    cm.setValue("0123456789abcابجابجابجابج");
    beginOfSecondLine = Pos(0, 25, "before");
  }
}, {mode: "text/html", value: "0123456789abcde0123456789", lineWrapping: true});

testCM("scrollVerticallyAndHorizontally", function(cm) {
  if (cm.getOption("inputStyle") != "textarea") return;
  cm.setSize(100, 100);
  addDoc(cm, 40, 40);
  cm.setCursor(39);
  var wrap = cm.getWrapperElement(), bar = byClassName(wrap, "CodeMirror-vscrollbar")[0];
  is(bar.offsetHeight < wrap.offsetHeight, "vertical scrollbar limited by horizontal one");
  var cursorBox = byClassName(wrap, "CodeMirror-cursor")[0].getBoundingClientRect();
  var editorBox = wrap.getBoundingClientRect();
  is(cursorBox.bottom < editorBox.top + cm.getScrollerElement().clientHeight,
     "bottom line visible");
}, {lineNumbers: true});

testCM("moveVstuck", function(cm) {
  var lines = byClassName(cm.getWrapperElement(), "CodeMirror-lines")[0].firstChild, h0 = lines.offsetHeight;
  var val = "fooooooooooooooooooooooooo baaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaar\n";
  cm.setValue(val);
  for (var w = cm.charCoords(Pos(0, 26), "div").right * 2.8;; w += 5) {
    cm.setSize(w);
    if (lines.offsetHeight <= 3.5 * h0) break;
  }
  cm.setCursor(Pos(0, val.length - 1));
  cm.moveV(-1, "line");
  eqCursorPos(cm.getCursor(), Pos(0, 27, "before"));
  is(cm.cursorCoords(null, "local").top < h0, "cursor is in first visual line");
}, {lineWrapping: true}, ie_lt8 || opera_lt10);

testCM("collapseOnMove", function(cm) {
  cm.setSelection(Pos(0, 1), Pos(2, 4));
  cm.execCommand("goLineUp");
  is(!cm.somethingSelected());
  eqCharPos(cm.getCursor(), Pos(0, 1));
  cm.setSelection(Pos(0, 1), Pos(2, 4));
  cm.execCommand("goPageDown");
  is(!cm.somethingSelected());
  eqCharPos(cm.getCursor(), Pos(2, 4));
  cm.execCommand("goLineUp");
  cm.execCommand("goLineUp");
  eqCharPos(cm.getCursor(), Pos(0, 4));
  cm.setSelection(Pos(0, 1), Pos(2, 4));
  cm.execCommand("goCharLeft");
  is(!cm.somethingSelected());
  eqCharPos(cm.getCursor(), Pos(0, 1));
}, {value: "aaaaa\nb\nccccc"});

testCM("clickTab", function(cm) {
  var p0 = cm.charCoords(Pos(0, 0));
  eqCharPos(cm.coordsChar({left: p0.left + 5, top: p0.top + 5}), Pos(0, 0));
  eqCharPos(cm.coordsChar({left: p0.right - 5, top: p0.top + 5}), Pos(0, 1));
}, {value: "\t\n\n", lineWrapping: true, tabSize: 8});

testCM("verticalScroll", function(cm) {
  cm.setSize(100, 200);
  cm.setValue("foo\nbar\nbaz\n");
  var sc = cm.getScrollerElement(), baseWidth = sc.scrollWidth;
  cm.replaceRange("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaah", Pos(0, 0), Pos(0));
  is(sc.scrollWidth > baseWidth, "scrollbar present");
  cm.replaceRange("foo", Pos(0, 0), Pos(0));
  if (!phantom) eq(sc.scrollWidth, baseWidth, "scrollbar gone");
  cm.replaceRange("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaah", Pos(0, 0), Pos(0));
  cm.replaceRange("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbh", Pos(1, 0), Pos(1));
  is(sc.scrollWidth > baseWidth, "present again");
  var curWidth = sc.scrollWidth;
  cm.replaceRange("foo", Pos(0, 0), Pos(0));
  is(sc.scrollWidth < curWidth, "scrollbar smaller");
  is(sc.scrollWidth > baseWidth, "but still present");
});

testCM("extraKeys", function(cm) {
  var outcome;
  function fakeKey(expected, code, props) {
    if (typeof code == "string") code = code.charCodeAt(0);
    var e = {type: "keydown", keyCode: code, preventDefault: function(){}, stopPropagation: function(){}};
    if (props) for (var n in props) e[n] = props[n];
    outcome = null;
    cm.triggerOnKeyDown(e);
    eq(outcome, expected);
  }
  CodeMirror.commands.testCommand = function() {outcome = "tc";};
  CodeMirror.commands.goTestCommand = function() {outcome = "gtc";};
  cm.setOption("extraKeys", {"Shift-X": function() {outcome = "sx";},
                             "X": function() {outcome = "x";},
                             "Ctrl-Alt-U": function() {outcome = "cau";},
                             "End": "testCommand",
                             "Home": "goTestCommand",
                             "Tab": false});
  fakeKey(null, "U");
  fakeKey("cau", "U", {ctrlKey: true, altKey: true});
  fakeKey(null, "U", {shiftKey: true, ctrlKey: true, altKey: true});
  fakeKey("x", "X");
  fakeKey("sx", "X", {shiftKey: true});
  fakeKey("tc", 35);
  fakeKey(null, 35, {shiftKey: true});
  fakeKey("gtc", 36);
  fakeKey("gtc", 36, {shiftKey: true});
  fakeKey(null, 9);
}, null, window.opera && mac);

testCM("wordMovementCommands", function(cm) {
  cm.execCommand("goWordLeft");
  eqCursorPos(cm.getCursor(), Pos(0, 0));
  cm.execCommand("goWordRight"); cm.execCommand("goWordRight");
  eqCursorPos(cm.getCursor(), Pos(0, 7, "before"));
  cm.execCommand("goWordLeft");
  eqCursorPos(cm.getCursor(), Pos(0, 5, "after"));
  cm.execCommand("goWordRight"); cm.execCommand("goWordRight");
  eqCursorPos(cm.getCursor(), Pos(0, 12, "before"));
  cm.execCommand("goWordLeft");
  eqCursorPos(cm.getCursor(), Pos(0, 9, "after"));
  cm.execCommand("goWordRight"); cm.execCommand("goWordRight"); cm.execCommand("goWordRight");
  eqCursorPos(cm.getCursor(), Pos(0, 24, "before"));
  cm.execCommand("goWordRight"); cm.execCommand("goWordRight");
  eqCursorPos(cm.getCursor(), Pos(1, 9, "before"));
  cm.execCommand("goWordRight");
  eqCursorPos(cm.getCursor(), Pos(1, 13, "before"));
  cm.execCommand("goWordRight"); cm.execCommand("goWordRight");
  eqCharPos(cm.getCursor(), Pos(2, 0));
}, {value: "this is (the) firstline.\na foo12\u00e9\u00f8\u00d7bar\n"});

testCM("groupMovementCommands", function(cm) {
  cm.execCommand("goGroupLeft");
  eqCursorPos(cm.getCursor(), Pos(0, 0));
  cm.execCommand("goGroupRight");
  eqCursorPos(cm.getCursor(), Pos(0, 4, "before"));
  cm.execCommand("goGroupRight");
  eqCursorPos(cm.getCursor(), Pos(0, 7, "before"));
  cm.execCommand("goGroupRight");
  eqCursorPos(cm.getCursor(), Pos(0, 10, "before"));
  cm.execCommand("goGroupLeft");
  eqCursorPos(cm.getCursor(), Pos(0, 7, "after"));
  cm.execCommand("goGroupRight"); cm.execCommand("goGroupRight"); cm.execCommand("goGroupRight");
  eqCursorPos(cm.getCursor(), Pos(0, 15, "before"));
  cm.setCursor(Pos(0, 17));
  cm.execCommand("goGroupLeft");
  eqCursorPos(cm.getCursor(), Pos(0, 16, "after"));
  cm.execCommand("goGroupLeft");
  eqCursorPos(cm.getCursor(), Pos(0, 14, "after"));
  cm.execCommand("goGroupRight"); cm.execCommand("goGroupRight");
  eqCursorPos(cm.getCursor(), Pos(0, 20, "before"));
  cm.execCommand("goGroupRight");
  eqCursorPos(cm.getCursor(), Pos(1, 0, "after"));
  cm.execCommand("goGroupRight");
  eqCursorPos(cm.getCursor(), Pos(1, 2, "before"));
  cm.execCommand("goGroupRight");
  eqCursorPos(cm.getCursor(), Pos(1, 5, "before"));
  cm.execCommand("goGroupLeft"); cm.execCommand("goGroupLeft");
  eqCursorPos(cm.getCursor(), Pos(1, 0, "after"));
  cm.execCommand("goGroupLeft");
  eqCursorPos(cm.getCursor(), Pos(0, 20, "after"));
  cm.execCommand("goGroupLeft");
  eqCursorPos(cm.getCursor(), Pos(0, 16, "after"));
}, {value: "booo ba---quux. ffff\n  abc d"});

testCM("groupsAndWhitespace", function(cm) {
  var positions = [Pos(0, 0), Pos(0, 2), Pos(0, 5), Pos(0, 9), Pos(0, 11),
                   Pos(1, 0), Pos(1, 2), Pos(1, 5)];
  for (var i = 1; i < positions.length; i++) {
    cm.execCommand("goGroupRight");
    eqCharPos(cm.getCursor(), positions[i]);
  }
  for (var i = positions.length - 2; i >= 0; i--) {
    cm.execCommand("goGroupLeft");
    eqCharPos(cm.getCursor(), i == 2 ? Pos(0, 6, "before") : positions[i]);
  }
}, {value: "  foo +++  \n  bar"});

testCM("charMovementCommands", function(cm) {
  cm.execCommand("goCharLeft"); cm.execCommand("goColumnLeft");
  eqCursorPos(cm.getCursor(), Pos(0, 0));
  cm.execCommand("goCharRight"); cm.execCommand("goCharRight");
  eqCursorPos(cm.getCursor(), Pos(0, 2, "before"));
  cm.setCursor(Pos(1, 0));
  cm.execCommand("goColumnLeft");
  eqCursorPos(cm.getCursor(), Pos(1, 0));
  cm.execCommand("goCharLeft");
  eqCursorPos(cm.getCursor(), Pos(0, 5, "before"));
  cm.execCommand("goColumnRight");
  eqCursorPos(cm.getCursor(), Pos(0, 5, "before"));
  cm.execCommand("goCharRight");
  eqCursorPos(cm.getCursor(), Pos(1, 0, "after"));
  cm.execCommand("goLineEnd");
  eqCursorPos(cm.getCursor(), Pos(1, 5, "before"));
  cm.execCommand("goLineStartSmart");
  eqCursorPos(cm.getCursor(), Pos(1, 1, "after"));
  cm.execCommand("goLineStartSmart");
  eqCursorPos(cm.getCursor(), Pos(1, 0, "after"));
  cm.setCursor(Pos(2, 0));
  cm.execCommand("goCharRight"); cm.execCommand("goColumnRight");
  eqCursorPos(cm.getCursor(), Pos(2, 0));
}, {value: "line1\n ine2\n"});

testCM("verticalMovementCommands", function(cm) {
  cm.execCommand("goLineUp");
  eqCharPos(cm.getCursor(), Pos(0, 0));
  cm.execCommand("goLineDown");
  if (!phantom) // This fails in PhantomJS, though not in a real Webkit
    eqCharPos(cm.getCursor(), Pos(1, 0));
  cm.setCursor(Pos(1, 12));
  cm.execCommand("goLineDown");
  eqCharPos(cm.getCursor(), Pos(2, 5));
  cm.execCommand("goLineDown");
  eqCharPos(cm.getCursor(), Pos(3, 0));
  cm.execCommand("goLineUp");
  eqCharPos(cm.getCursor(), Pos(2, 5));
  cm.execCommand("goLineUp");
  eqCharPos(cm.getCursor(), Pos(1, 12));
  cm.execCommand("goPageDown");
  eqCharPos(cm.getCursor(), Pos(5, 0));
  cm.execCommand("goPageDown"); cm.execCommand("goLineDown");
  eqCharPos(cm.getCursor(), Pos(5, 0));
  cm.execCommand("goPageUp");
  eqCharPos(cm.getCursor(), Pos(0, 0));
}, {value: "line1\nlong long line2\nline3\n\nline5\n"});

testCM("verticalMovementCommandsWrapping", function(cm) {
  cm.setSize(120);
  cm.setCursor(Pos(0, 5));
  cm.execCommand("goLineDown");
  eq(cm.getCursor().line, 0);
  is(cm.getCursor().ch > 5, "moved beyond wrap");
  for (var i = 0; ; ++i) {
    is(i < 20, "no endless loop");
    cm.execCommand("goLineDown");
    var cur = cm.getCursor();
    if (cur.line == 1) eq(cur.ch, 5);
    if (cur.line == 2) { eq(cur.ch, 1); break; }
  }
}, {value: "a very long line that wraps around somehow so that we can test cursor movement\nshortone\nk",
    lineWrapping: true});

testCM("verticalMovementCommandsSingleLine", function(cm) {
  cm.display.wrapper.style.height = "auto";
  cm.refresh();
  cm.execCommand("goLineUp");
  eqCursorPos(cm.getCursor(), Pos(0, 0));
  cm.execCommand("goLineDown");
  eqCursorPos(cm.getCursor(), Pos(0, 11));
  cm.setCursor(Pos(0, 5));
  cm.execCommand("goLineDown");
  eqCursorPos(cm.getCursor(), Pos(0, 11));
  cm.execCommand("goLineDown");
  eqCursorPos(cm.getCursor(), Pos(0, 11));
  cm.execCommand("goLineUp");
  eqCursorPos(cm.getCursor(), Pos(0, 0));
  cm.execCommand("goLineUp");
  eqCursorPos(cm.getCursor(), Pos(0, 0));
  cm.execCommand("goPageDown");
  eqCursorPos(cm.getCursor(), Pos(0, 11));
  cm.execCommand("goPageDown"); cm.execCommand("goLineDown");
  eqCursorPos(cm.getCursor(), Pos(0, 11));
  cm.execCommand("goPageUp");
  eqCursorPos(cm.getCursor(), Pos(0, 0));
  cm.setCursor(Pos(0, 5));
  cm.execCommand("goPageUp");
  eqCursorPos(cm.getCursor(), Pos(0, 0));
  cm.setCursor(Pos(0, 5));
  cm.execCommand("goPageDown");
  eqCursorPos(cm.getCursor(), Pos(0, 11));
}, {value: "single line"});


testCM("rtlMovement", function(cm) {
  if (cm.getOption("inputStyle") != "textarea") return;
  forEach(["خحج", "خحabcخحج", "abخحخحجcd", "abخde", "abخح2342خ1حج", "خ1ح2خح3حxج",
           "خحcd", "1خحcd", "abcdeح1ج", "خمرحبها مها!", "foobarر", "خ ة ق",
           "<img src=\"/בדיקה3.jpg\">", "يتم السحب في 05 فبراير 2014"], function(line) {
    cm.setValue(line + "\n"); cm.execCommand("goLineStart");
    var cursors = byClassName(cm.getWrapperElement(), "CodeMirror-cursors")[0];
    var cursor = cursors.firstChild;
    var prevX = cursor.offsetLeft, prevY = cursor.offsetTop;
    for (var i = 0; i <= line.length; ++i) {
      cm.execCommand("goCharRight");
      cursor = cursors.firstChild;
      if (i == line.length) is(cursor.offsetTop > prevY, "next line");
      else is(cursor.offsetLeft > prevX, "moved right");
      prevX = cursor.offsetLeft; prevY = cursor.offsetTop;
    }
    cm.setCursor(0, 0); cm.execCommand("goLineEnd");
    prevX = cursors.firstChild.offsetLeft;
    for (var i = 0; i < line.length; ++i) {
      cm.execCommand("goCharLeft");
      cursor = cursors.firstChild;
      is(cursor.offsetLeft < prevX, "moved left");
      prevX = cursor.offsetLeft;
    }
  });
}, null, ie_lt9);

// Verify that updating a line clears its bidi ordering
testCM("bidiUpdate", function(cm) {
  cm.setCursor(Pos(0, 2, "before"));
  cm.replaceSelection("خحج", "start");
  cm.execCommand("goCharRight");
  eqCursorPos(cm.getCursor(), Pos(0, 6, "before"));
}, {value: "abcd\n"});

testCM("movebyTextUnit", function(cm) {
  cm.setValue("בְּרֵאשִ\nééé́\n");
  cm.execCommand("goLineStart");
  for (var i = 0; i < 4; ++i) cm.execCommand("goCharRight");
  eqCursorPos(cm.getCursor(), Pos(0, 0, "after"));
  cm.execCommand("goCharRight");
  eqCursorPos(cm.getCursor(), Pos(1, 0, "after"));
  cm.execCommand("goCharRight");
  cm.execCommand("goCharRight");
  eqCursorPos(cm.getCursor(), Pos(1, 4, "before"));
  cm.execCommand("goCharRight");
  eqCursorPos(cm.getCursor(), Pos(1, 7, "before"));
});

testCM("lineChangeEvents", function(cm) {
  addDoc(cm, 3, 5);
  var log = [], want = ["ch 0", "ch 1", "del 2", "ch 0", "ch 0", "del 1", "del 3", "del 4"];
  for (var i = 0; i < 5; ++i) {
    CodeMirror.on(cm.getLineHandle(i), "delete", function(i) {
      return function() {log.push("del " + i);};
    }(i));
    CodeMirror.on(cm.getLineHandle(i), "change", function(i) {
      return function() {log.push("ch " + i);};
    }(i));
  }
  cm.replaceRange("x", Pos(0, 1));
  cm.replaceRange("xy", Pos(1, 1), Pos(2));
  cm.replaceRange("foo\nbar", Pos(0, 1));
  cm.replaceRange("", Pos(0, 0), Pos(cm.lineCount()));
  eq(log.length, want.length, "same length");
  for (var i = 0; i < log.length; ++i)
    eq(log[i], want[i]);
});

testCM("scrollEntirelyToRight", function(cm) {
  if (phantom || cm.getOption("inputStyle") != "textarea") return;
  addDoc(cm, 500, 2);
  cm.setCursor(Pos(0, 500));
  var wrap = cm.getWrapperElement(), cur = byClassName(wrap, "CodeMirror-cursor")[0];
  is(wrap.getBoundingClientRect().right > cur.getBoundingClientRect().left);
});

testCM("lineWidgets", function(cm) {
  addDoc(cm, 500, 3);
  var last = cm.charCoords(Pos(2, 0));
  var node = document.createElement("div");
  node.innerHTML = "hi";
  var widget = cm.addLineWidget(1, node);
  is(last.top < cm.charCoords(Pos(2, 0)).top, "took up space");
  cm.setCursor(Pos(1, 1));
  cm.execCommand("goLineDown");
  eqCharPos(cm.getCursor(), Pos(2, 1));
  cm.execCommand("goLineUp");
  eqCharPos(cm.getCursor(), Pos(1, 1));
});

testCM("lineWidgetFocus", function(cm) {
  var place = document.getElementById("testground");
  place.className = "offscreen";
  try {
    addDoc(cm, 500, 10);
    var node = document.createElement("input");
    var widget = cm.addLineWidget(1, node);
    node.focus();
    eq(document.activeElement, node);
    cm.replaceRange("new stuff", Pos(1, 0));
    eq(document.activeElement, node);
  } finally {
    place.className = "";
  }
});

testCM("lineWidgetCautiousRedraw", function(cm) {
  var node = document.createElement("div");
  node.innerHTML = "hahah";
  var w = cm.addLineWidget(0, node);
  var redrawn = false;
  w.on("redraw", function() { redrawn = true; });
  cm.replaceSelection("0");
  is(!redrawn);
}, {value: "123\n456"});


var knownScrollbarWidth;
function scrollbarWidth(measure) {
  if (knownScrollbarWidth != null) return knownScrollbarWidth;
  var div = document.createElement('div');
  div.style.cssText = "width: 50px; height: 50px; overflow-x: scroll";
  document.body.appendChild(div);
  knownScrollbarWidth = div.offsetHeight - div.clientHeight;
  document.body.removeChild(div);
  return knownScrollbarWidth || 0;
}

testCM("lineWidgetChanged", function(cm) {
  addDoc(cm, 2, 300);
  var halfScrollbarWidth = scrollbarWidth(cm.display.measure)/2;
  cm.setOption('lineNumbers', true);
  cm.setSize(600, cm.defaultTextHeight() * 50);
  cm.scrollTo(null, cm.heightAtLine(125, "local"));

  var expectedWidgetHeight = 60;
  var expectedLinesInWidget = 3;
  function w() {
    var node = document.createElement("div");
    // we use these children with just under half width of the line to check measurements are made with correct width
    // when placed in the measure div.
    // If the widget is measured at a width much narrower than it is displayed at, the underHalf children will span two lines and break the test.
    // If the widget is measured at a width much wider than it is displayed at, the overHalf children will combine and break the test.
    // Note that this test only checks widgets where coverGutter is true, because these require extra styling to get the width right.
    // It may also be worthwhile to check this for non-coverGutter widgets.
    // Visually:
    // Good:
    // | ------------- display width ------------- |
    // | ------- widget-width when measured ------ |
    // | | -- under-half -- | | -- under-half -- | |
    // | | --- over-half --- |                     |
    // | | --- over-half --- |                     |
    // Height: measured as 3 lines, same as it will be when actually displayed

    // Bad (too narrow):
    // | ------------- display width ------------- |
    // | ------ widget-width when measured ----- |  < -- uh oh
    // | | -- under-half -- |                    |
    // | | -- under-half -- |                    |  < -- when measured, shoved to next line
    // | | --- over-half --- |                   |
    // | | --- over-half --- |                   |
    // Height: measured as 4 lines, more than expected . Will be displayed as 3 lines!

    // Bad (too wide):
    // | ------------- display width ------------- |
    // | -------- widget-width when measured ------- | < -- uh oh
    // | | -- under-half -- | | -- under-half -- |   |
    // | | --- over-half --- | | --- over-half --- | | < -- when measured, combined on one line
    // Height: measured as 2 lines, less than expected. Will be displayed as 3 lines!

    var barelyUnderHalfWidthHtml = '<div style="display: inline-block; height: 1px; width: '+(285 - halfScrollbarWidth)+'px;"></div>';
    var barelyOverHalfWidthHtml = '<div style="display: inline-block; height: 1px; width: '+(305 - halfScrollbarWidth)+'px;"></div>';
    node.innerHTML = new Array(3).join(barelyUnderHalfWidthHtml) + new Array(3).join(barelyOverHalfWidthHtml);
    node.style.cssText = "background: yellow;font-size:0;line-height: " + (expectedWidgetHeight/expectedLinesInWidget) + "px;";
    return node;
  }
  var info0 = cm.getScrollInfo();
  var w0 = cm.addLineWidget(0, w(), { coverGutter: true });
  var w150 = cm.addLineWidget(150, w(), { coverGutter: true });
  var w300 = cm.addLineWidget(300, w(), { coverGutter: true });
  var info1 = cm.getScrollInfo();
  eq(info0.height + (3 * expectedWidgetHeight), info1.height);
  eq(info0.top + expectedWidgetHeight, info1.top);
  expectedWidgetHeight = 12;
  w0.node.style.lineHeight = w150.node.style.lineHeight = w300.node.style.lineHeight = (expectedWidgetHeight/expectedLinesInWidget) + "px";
  w0.changed(); w150.changed(); w300.changed();
  var info2 = cm.getScrollInfo();
  eq(info0.height + (3 * expectedWidgetHeight), info2.height);
  eq(info0.top + expectedWidgetHeight, info2.top);
});

testCM("getLineNumber", function(cm) {
  addDoc(cm, 2, 20);
  var h1 = cm.getLineHandle(1);
  eq(cm.getLineNumber(h1), 1);
  cm.replaceRange("hi\nbye\n", Pos(0, 0));
  eq(cm.getLineNumber(h1), 3);
  cm.setValue("");
  eq(cm.getLineNumber(h1), null);
});

testCM("jumpTheGap", function(cm) {
  if (phantom) return;
  var longLine = "abcdef ghiklmnop qrstuvw xyz ";
  longLine += longLine; longLine += longLine; longLine += longLine;
  cm.replaceRange(longLine, Pos(2, 0), Pos(2));
  cm.setSize("200px", null);
  cm.getWrapperElement().style.lineHeight = 2;
  cm.refresh();
  cm.setCursor(Pos(0, 1));
  cm.execCommand("goLineDown");
  eqCharPos(cm.getCursor(), Pos(1, 1));
  cm.execCommand("goLineDown");
  eqCharPos(cm.getCursor(), Pos(2, 1));
  cm.execCommand("goLineDown");
  eq(cm.getCursor().line, 2);
  is(cm.getCursor().ch > 1);
  cm.execCommand("goLineUp");
  eqCharPos(cm.getCursor(), Pos(2, 1));
  cm.execCommand("goLineUp");
  eqCharPos(cm.getCursor(), Pos(1, 1));
  var node = document.createElement("div");
  node.innerHTML = "hi"; node.style.height = "30px";
  cm.addLineWidget(0, node);
  cm.addLineWidget(1, node.cloneNode(true), {above: true});
  cm.setCursor(Pos(0, 2));
  cm.execCommand("goLineDown");
  eqCharPos(cm.getCursor(), Pos(1, 2));
  cm.execCommand("goLineUp");
  eqCharPos(cm.getCursor(), Pos(0, 2));
}, {lineWrapping: true, value: "abc\ndef\nghi\njkl\n"});

testCM("addLineClass", function(cm) {
  function cls(line, text, bg, wrap, gutter) {
    var i = cm.lineInfo(line);
    eq(i.textClass, text);
    eq(i.bgClass, bg);
    eq(i.wrapClass, wrap);
    if (typeof i.handle.gutterClass !== 'undefined') {
        eq(i.handle.gutterClass, gutter);
    }
  }
  cm.addLineClass(0, "text", "foo");
  cm.addLineClass(0, "text", "bar");
  cm.addLineClass(1, "background", "baz");
  cm.addLineClass(1, "wrap", "foo");
  cm.addLineClass(1, "gutter", "gutter-class");
  cls(0, "foo bar", null, null, null);
  cls(1, null, "baz", "foo", "gutter-class");
  var lines = cm.display.lineDiv;
  eq(byClassName(lines, "foo").length, 2);
  eq(byClassName(lines, "bar").length, 1);
  eq(byClassName(lines, "baz").length, 1);
  eq(byClassName(lines, "gutter-class").length, 2); // Gutter classes are reflected in 2 nodes
  cm.removeLineClass(0, "text", "foo");
  cls(0, "bar", null, null, null);
  cm.removeLineClass(0, "text", "foo");
  cls(0, "bar", null, null, null);
  cm.removeLineClass(0, "text", "bar");
  cls(0, null, null, null);

  cm.addLineClass(1, "wrap", "quux");
  cls(1, null, "baz", "foo quux", "gutter-class");
  cm.removeLineClass(1, "wrap");
  cls(1, null, "baz", null, "gutter-class");
  cm.removeLineClass(1, "gutter", "gutter-class");
  eq(byClassName(lines, "gutter-class").length, 0);
  cls(1, null, "baz", null, null);

  cm.addLineClass(1, "gutter", "gutter-class");
  cls(1, null, "baz", null, "gutter-class");
  cm.removeLineClass(1, "gutter", "gutter-class");
  cls(1, null, "baz", null, null);

}, {value: "hohoho\n", lineNumbers: true});

testCM("atomicMarker", function(cm) {
  addDoc(cm, 10, 10);
  function atom(ll, cl, lr, cr, li, ri) {
    return cm.markText(Pos(ll, cl), Pos(lr, cr),
                       {atomic: true, inclusiveLeft: li, inclusiveRight: ri});
  }
  var m = atom(0, 1, 0, 5);
  cm.setCursor(Pos(0, 1));
  cm.execCommand("goCharRight");
  eqCursorPos(cm.getCursor(), Pos(0, 5));
  cm.execCommand("goCharLeft");
  eqCursorPos(cm.getCursor(), Pos(0, 1));
  m.clear();
  m = atom(0, 0, 0, 5, true);
  eqCursorPos(cm.getCursor(), Pos(0, 5), "pushed out");
  cm.execCommand("goCharLeft");
  eqCursorPos(cm.getCursor(), Pos(0, 5));
  m.clear();
  m = atom(8, 4, 9, 10, false, true);
  cm.setCursor(Pos(9, 8));
  eqCursorPos(cm.getCursor(), Pos(8, 4), "set");
  cm.execCommand("goCharRight");
  eqCursorPos(cm.getCursor(), Pos(8, 4), "char right");
  cm.execCommand("goLineDown");
  eqCursorPos(cm.getCursor(), Pos(8, 4), "line down");
  cm.execCommand("goCharLeft");
  eqCursorPos(cm.getCursor(), Pos(8, 3, "after"));
  m.clear();
  m = atom(1, 1, 3, 8);
  cm.setCursor(Pos(0, 0));
  cm.setCursor(Pos(2, 0));
  eqCursorPos(cm.getCursor(), Pos(3, 8));
  cm.execCommand("goCharLeft");
  eqCursorPos(cm.getCursor(), Pos(1, 1));
  cm.execCommand("goCharRight");
  eqCursorPos(cm.getCursor(), Pos(3, 8));
  cm.execCommand("goLineUp");
  eqCursorPos(cm.getCursor(), Pos(1, 1));
  cm.execCommand("goLineDown");
  eqCursorPos(cm.getCursor(), Pos(3, 8));
  cm.execCommand("delCharBefore");
  eq(cm.getValue().length, 80, "del chunk");
  m = atom(3, 0, 5, 5);
  cm.setCursor(Pos(3, 0));
  cm.execCommand("delWordAfter");
  eq(cm.getValue().length, 53, "del chunk");
});

testCM("selectionBias", function(cm) {
  cm.markText(Pos(0, 1), Pos(0, 3), {atomic: true});
  cm.setCursor(Pos(0, 2));
  eqCursorPos(cm.getCursor(), Pos(0, 1));
  cm.setCursor(Pos(0, 2));
  eqCursorPos(cm.getCursor(), Pos(0, 3));
  cm.setCursor(Pos(0, 2));
  eqCursorPos(cm.getCursor(), Pos(0, 1));
  cm.setCursor(Pos(0, 2), null, {bias: -1});
  eqCursorPos(cm.getCursor(), Pos(0, 1));
  cm.setCursor(Pos(0, 4));
  cm.setCursor(Pos(0, 2), null, {bias: 1});
  eqCursorPos(cm.getCursor(), Pos(0, 3));
}, {value: "12345"});

testCM("selectionHomeEnd", function(cm) {
  cm.markText(Pos(1, 0), Pos(1, 1), {atomic: true, inclusiveLeft: true});
  cm.markText(Pos(1, 3), Pos(1, 4), {atomic: true, inclusiveRight: true});
  cm.setCursor(Pos(1, 2));
  cm.execCommand("goLineStart");
  eqCursorPos(cm.getCursor(), Pos(1, 1));
  cm.execCommand("goLineEnd");
  eqCursorPos(cm.getCursor(), Pos(1, 3));
}, {value: "ab\ncdef\ngh"});

testCM("readOnlyMarker", function(cm) {
  function mark(ll, cl, lr, cr, at) {
    return cm.markText(Pos(ll, cl), Pos(lr, cr),
                       {readOnly: true, atomic: at});
  }
  var m = mark(0, 1, 0, 4);
  cm.setCursor(Pos(0, 2));
  cm.replaceSelection("hi", "end");
  eqCursorPos(cm.getCursor(), Pos(0, 2));
  eq(cm.getLine(0), "abcde");
  cm.execCommand("selectAll");
  cm.replaceSelection("oops", "around");
  eq(cm.getValue(), "oopsbcd");
  cm.undo();
  eqCursorPos(m.find().from, Pos(0, 1));
  eqCursorPos(m.find().to, Pos(0, 4));
  m.clear();
  cm.setCursor(Pos(0, 2));
  cm.replaceSelection("hi", "around");
  eq(cm.getLine(0), "abhicde");
  eqCursorPos(cm.getCursor(), Pos(0, 4));
  m = mark(0, 2, 2, 2, true);
  cm.setSelection(Pos(1, 1), Pos(2, 4));
  cm.replaceSelection("t", "end");
  eqCursorPos(cm.getCursor(), Pos(2, 3));
  eq(cm.getLine(2), "klto");
  cm.execCommand("goCharLeft");
  cm.execCommand("goCharLeft");
  eqCursorPos(cm.getCursor(), Pos(0, 2));
  cm.setSelection(Pos(0, 1), Pos(0, 3));
  cm.replaceSelection("xx", "around");
  eqCursorPos(cm.getCursor(), Pos(0, 3));
  eq(cm.getLine(0), "axxhicde");
}, {value: "abcde\nfghij\nklmno\n"});

testCM("dirtyBit", function(cm) {
  eq(cm.isClean(), true);
  cm.replaceSelection("boo", null, "test");
  eq(cm.isClean(), false);
  cm.undo();
  eq(cm.isClean(), true);
  cm.replaceSelection("boo", null, "test");
  cm.replaceSelection("baz", null, "test");
  cm.undo();
  eq(cm.isClean(), false);
  cm.markClean();
  eq(cm.isClean(), true);
  cm.undo();
  eq(cm.isClean(), false);
  cm.redo();
  eq(cm.isClean(), true);
});

testCM("changeGeneration", function(cm) {
  cm.replaceSelection("x");
  var softGen = cm.changeGeneration();
  cm.replaceSelection("x");
  cm.undo();
  eq(cm.getValue(), "");
  is(!cm.isClean(softGen));
  cm.replaceSelection("x");
  var hardGen = cm.changeGeneration(true);
  cm.replaceSelection("x");
  cm.undo();
  eq(cm.getValue(), "x");
  is(cm.isClean(hardGen));
});

testCM("addKeyMap", function(cm) {
  function sendKey(code) {
    cm.triggerOnKeyDown({type: "keydown", keyCode: code,
                         preventDefault: function(){}, stopPropagation: function(){}});
  }

  sendKey(39);
  eqCursorPos(cm.getCursor(), Pos(0, 1, "before"));
  var test = 0;
  var map1 = {Right: function() { ++test; }}, map2 = {Right: function() { test += 10; }}
  cm.addKeyMap(map1);
  sendKey(39);
  eqCursorPos(cm.getCursor(), Pos(0, 1, "before"));
  eq(test, 1);
  cm.addKeyMap(map2, true);
  sendKey(39);
  eq(test, 2);
  cm.removeKeyMap(map1);
  sendKey(39);
  eq(test, 12);
  cm.removeKeyMap(map2);
  sendKey(39);
  eq(test, 12);
  eqCursorPos(cm.getCursor(), Pos(0, 2, "before"));
  cm.addKeyMap({Right: function() { test = 55; }, name: "mymap"});
  sendKey(39);
  eq(test, 55);
  cm.removeKeyMap("mymap");
  sendKey(39);
  eqCursorPos(cm.getCursor(), Pos(0, 3, "before"));
}, {value: "abc"});

function mouseDown(cm, button, pos, mods) {
  var coords = cm.charCoords(pos, "window")
  var event = {type: "mousedown",
               preventDefault: Math.min,
               which: button,
               target: cm.display.lineDiv,
               clientX: coords.left, clientY: coords.top}
  if (mods) for (var prop in mods) event[prop] = mods[prop]
  cm.triggerOnMouseDown(event)
}

testCM("mouseBinding", function(cm) {
  var fired = []
  cm.addKeyMap({
    "Shift-LeftClick": function(_cm, pos) {
      eqCharPos(pos, Pos(1, 2))
      fired.push("a")
    },
    "Shift-LeftDoubleClick": function() { fired.push("b") },
    "Shift-LeftTripleClick": function() { fired.push("c") }
  })

  function send(button, mods) { mouseDown(cm, button, Pos(1, 2), mods) }
  send(1, {shiftKey: true})
  send(1, {shiftKey: true})
  send(1, {shiftKey: true})
  send(1, {})
  send(2, {ctrlKey: true})
  send(2, {ctrlKey: true})
  eq(fired.join(" "), "a b c")
}, {value: "foo\nbar\nbaz"})

testCM("configureMouse", function(cm) {
  cm.setOption("configureMouse", function() { return {unit: "word"} })
  mouseDown(cm, 1, Pos(0, 5))
  eqCharPos(cm.getCursor("from"), Pos(0, 4))
  eqCharPos(cm.getCursor("to"), Pos(0, 7))
  cm.setOption("configureMouse", function() { return {extend: true} })
  mouseDown(cm, 1, Pos(0, 0))
  eqCharPos(cm.getCursor("from"), Pos(0, 0))
  eqCharPos(cm.getCursor("to"), Pos(0, 4))
}, {value: "foo bar baz"})

testCM("findPosH", function(cm) {
  forEach([{from: Pos(0, 0), to: Pos(0, 1, "before"), by: 1},
           {from: Pos(0, 0), to: Pos(0, 0), by: -1, hitSide: true},
           {from: Pos(0, 0), to: Pos(0, 4, "before"), by: 1, unit: "word"},
           {from: Pos(0, 0), to: Pos(0, 8, "before"), by: 2, unit: "word"},
           {from: Pos(0, 0), to: Pos(2, 0, "after"), by: 20, unit: "word", hitSide: true},
           {from: Pos(0, 7), to: Pos(0, 5, "after"), by: -1, unit: "word"},
           {from: Pos(0, 4), to: Pos(0, 8, "before"), by: 1, unit: "word"},
           {from: Pos(1, 0), to: Pos(1, 18, "before"), by: 3, unit: "word"},
           {from: Pos(1, 22), to: Pos(1, 5, "after"), by: -3, unit: "word"},
           {from: Pos(1, 15), to: Pos(1, 10, "after"), by: -5},
           {from: Pos(1, 15), to: Pos(1, 10, "after"), by: -5, unit: "column"},
           {from: Pos(1, 15), to: Pos(1, 0, "after"), by: -50, unit: "column", hitSide: true},
           {from: Pos(1, 15), to: Pos(1, 24, "before"), by: 50, unit: "column", hitSide: true},
           {from: Pos(1, 15), to: Pos(2, 0, "after"), by: 50, hitSide: true}], function(t) {
    var r = cm.findPosH(t.from, t.by, t.unit || "char");
    eqCursorPos(r, t.to);
    eq(!!r.hitSide, !!t.hitSide);
  });
}, {value: "line one\nline two.something.other\n"});

testCM("beforeChange", function(cm) {
  cm.on("beforeChange", function(cm, change) {
    var text = [];
    for (var i = 0; i < change.text.length; ++i)
      text.push(change.text[i].replace(/\s/g, "_"));
    change.update(null, null, text);
  });
  cm.setValue("hello, i am a\nnew document\n");
  eq(cm.getValue(), "hello,_i_am_a\nnew_document\n");
  CodeMirror.on(cm.getDoc(), "beforeChange", function(doc, change) {
    if (change.from.line == 0) change.cancel();
  });
  cm.setValue("oops"); // Canceled
  eq(cm.getValue(), "hello,_i_am_a\nnew_document\n");
  cm.replaceRange("hey hey hey", Pos(1, 0), Pos(2, 0));
  eq(cm.getValue(), "hello,_i_am_a\nhey_hey_hey");
}, {value: "abcdefghijk"});

testCM("beforeChangeUndo", function(cm) {
  cm.replaceRange("hi", Pos(0, 0), Pos(0));
  cm.replaceRange("bye", Pos(0, 0), Pos(0));
  eq(cm.historySize().undo, 2);
  cm.on("beforeChange", function(cm, change) {
    is(!change.update);
    change.cancel();
  });
  cm.undo();
  eq(cm.historySize().undo, 0);
  eq(cm.getValue(), "bye\ntwo");
}, {value: "one\ntwo"});

testCM("beforeSelectionChange", function(cm) {
  function notAtEnd(cm, pos) {
    var len = cm.getLine(pos.line).length;
    if (!len || pos.ch == len) return Pos(pos.line, pos.ch - 1);
    return pos;
  }
  cm.on("beforeSelectionChange", function(cm, obj) {
    obj.update([{anchor: notAtEnd(cm, obj.ranges[0].anchor),
                 head: notAtEnd(cm, obj.ranges[0].head)}]);
  });

  addDoc(cm, 10, 10);
  cm.execCommand("goLineEnd");
  eqCursorPos(cm.getCursor(), Pos(0, 9));
  cm.execCommand("selectAll");
  eqCursorPos(cm.getCursor("start"), Pos(0, 0));
  eqCursorPos(cm.getCursor("end"), Pos(9, 9));
});

testCM("change_removedText", function(cm) {
  cm.setValue("abc\ndef");

  var removedText = [];
  cm.on("change", function(cm, change) {
    removedText.push(change.removed);
  });

  cm.operation(function() {
    cm.replaceRange("xyz", Pos(0, 0), Pos(1,1));
    cm.replaceRange("123", Pos(0,0));
  });

  eq(removedText.length, 2);
  eq(removedText[0].join("\n"), "abc\nd");
  eq(removedText[1].join("\n"), "");

  var removedText = [];
  cm.undo();
  eq(removedText.length, 2);
  eq(removedText[0].join("\n"), "123");
  eq(removedText[1].join("\n"), "xyz");

  var removedText = [];
  cm.redo();
  eq(removedText.length, 2);
  eq(removedText[0].join("\n"), "abc\nd");
  eq(removedText[1].join("\n"), "");
});

testCM("lineStyleFromMode", function(cm) {
  CodeMirror.defineMode("test_mode", function() {
    return {token: function(stream) {
      if (stream.match(/^\[[^\]]*\]/)) return "  line-brackets  ";
      if (stream.match(/^\([^\)]*\)/)) return "  line-background-parens  ";
      if (stream.match(/^<[^>]*>/)) return "  span  line-line  line-background-bg  ";
      stream.match(/^\s+|^\S+/);
    }};
  });
  cm.setOption("mode", "test_mode");
  var bracketElts = byClassName(cm.getWrapperElement(), "brackets");
  eq(bracketElts.length, 1, "brackets count");
  eq(bracketElts[0].nodeName, "PRE");
  is(!/brackets.*brackets/.test(bracketElts[0].className));
  var parenElts = byClassName(cm.getWrapperElement(), "parens");
  eq(parenElts.length, 1, "parens count");
  eq(parenElts[0].nodeName, "DIV");
  is(!/parens.*parens/.test(parenElts[0].className));
  eq(parenElts[0].parentElement.nodeName, "DIV");

  is(byClassName(cm.getWrapperElement(), "bg").length > 0);
  is(byClassName(cm.getWrapperElement(), "line").length > 0);
  var spanElts = byClassName(cm.getWrapperElement(), "cm-span");
  eq(spanElts.length, 2);
  is(/^\s*cm-span\s*$/.test(spanElts[0].className));
}, {value: "line1: [br] [br]\nline2: (par) (par)\nline3: <tag> <tag>"});

testCM("lineStyleFromBlankLine", function(cm) {
  CodeMirror.defineMode("lineStyleFromBlankLine_mode", function() {
    return {token: function(stream) { stream.skipToEnd(); return "comment"; },
            blankLine: function() { return "line-blank"; }};
  });
  cm.setOption("mode", "lineStyleFromBlankLine_mode");
  var blankElts = byClassName(cm.getWrapperElement(), "blank");
  eq(blankElts.length, 1);
  eq(blankElts[0].nodeName, "PRE");
  cm.replaceRange("x", Pos(1, 0));
  blankElts = byClassName(cm.getWrapperElement(), "blank");
  eq(blankElts.length, 0);
}, {value: "foo\n\nbar"});

CodeMirror.registerHelper("xxx", "a", "A");
CodeMirror.registerHelper("xxx", "b", "B");
CodeMirror.defineMode("yyy", function() {
  return {
    token: function(stream) { stream.skipToEnd(); },
    xxx: ["a", "b", "q"]
  };
});
CodeMirror.registerGlobalHelper("xxx", "c", function(m) { return m.enableC; }, "C");

testCM("helpers", function(cm) {
  cm.setOption("mode", "yyy");
  eq(cm.getHelpers(Pos(0, 0), "xxx").join("/"), "A/B");
  cm.setOption("mode", {name: "yyy", modeProps: {xxx: "b", enableC: true}});
  eq(cm.getHelpers(Pos(0, 0), "xxx").join("/"), "B/C");
  cm.setOption("mode", "javascript");
  eq(cm.getHelpers(Pos(0, 0), "xxx").join("/"), "");
});

testCM("selectionHistory", function(cm) {
  for (var i = 0; i < 3; i++) {
    cm.setExtending(true);
    cm.execCommand("goCharRight");
    cm.setExtending(false);
    cm.execCommand("goCharRight");
    cm.execCommand("goCharRight");
  }
  cm.execCommand("undoSelection");
  eq(cm.getSelection(), "c");
  cm.execCommand("undoSelection");
  eq(cm.getSelection(), "");
  eqCursorPos(cm.getCursor(), Pos(0, 4, "before"));
  cm.execCommand("undoSelection");
  eq(cm.getSelection(), "b");
  cm.execCommand("redoSelection");
  eq(cm.getSelection(), "");
  eqCursorPos(cm.getCursor(), Pos(0, 4, "before"));
  cm.execCommand("redoSelection");
  eq(cm.getSelection(), "c");
  cm.execCommand("redoSelection");
  eq(cm.getSelection(), "");
  eqCursorPos(cm.getCursor(), Pos(0, 6, "before"));
}, {value: "a b c d"});

testCM("selectionChangeReducesRedo", function(cm) {
  cm.replaceSelection("X");
  cm.execCommand("goCharRight");
  cm.undoSelection();
  cm.execCommand("selectAll");
  cm.undoSelection();
  eq(cm.getValue(), "Xabc");
  eqCursorPos(cm.getCursor(), Pos(0, 1));
  cm.undoSelection();
  eq(cm.getValue(), "abc");
}, {value: "abc"});

testCM("selectionHistoryNonOverlapping", function(cm) {
  cm.setSelection(Pos(0, 0), Pos(0, 1));
  cm.setSelection(Pos(0, 2), Pos(0, 3));
  cm.execCommand("undoSelection");
  eqCursorPos(cm.getCursor("anchor"), Pos(0, 0));
  eqCursorPos(cm.getCursor("head"), Pos(0, 1));
}, {value: "1234"});

testCM("cursorMotionSplitsHistory", function(cm) {
  cm.replaceSelection("a");
  cm.execCommand("goCharRight");
  cm.replaceSelection("b");
  cm.replaceSelection("c");
  cm.undo();
  eq(cm.getValue(), "a1234");
  eqCursorPos(cm.getCursor(), Pos(0, 2, "before"));
  cm.undo();
  eq(cm.getValue(), "1234");
  eqCursorPos(cm.getCursor(), Pos(0, 0));
}, {value: "1234"});

testCM("selChangeInOperationDoesNotSplit", function(cm) {
  for (var i = 0; i < 4; i++) {
    cm.operation(function() {
      cm.replaceSelection("x");
      cm.setCursor(Pos(0, cm.getCursor().ch - 1));
    });
  }
  eqCursorPos(cm.getCursor(), Pos(0, 0));
  eq(cm.getValue(), "xxxxa");
  cm.undo();
  eq(cm.getValue(), "a");
}, {value: "a"});

testCM("alwaysMergeSelEventWithChangeOrigin", function(cm) {
  cm.replaceSelection("U", null, "foo");
  cm.setSelection(Pos(0, 0), Pos(0, 1), {origin: "foo"});
  cm.undoSelection();
  eq(cm.getValue(), "a");
  cm.replaceSelection("V", null, "foo");
  cm.setSelection(Pos(0, 0), Pos(0, 1), {origin: "bar"});
  cm.undoSelection();
  eq(cm.getValue(), "Va");
}, {value: "a"});

testCM("getTokenAt", function(cm) {
  var tokPlus = cm.getTokenAt(Pos(0, 2));
  eq(tokPlus.type, "operator");
  eq(tokPlus.string, "+");
  var toks = cm.getLineTokens(0);
  eq(toks.length, 3);
  forEach([["number", "1"], ["operator", "+"], ["number", "2"]], function(expect, i) {
    eq(toks[i].type, expect[0]);
    eq(toks[i].string, expect[1]);
  });
}, {value: "1+2", mode: "javascript"});

testCM("getTokenTypeAt", function(cm) {
  eq(cm.getTokenTypeAt(Pos(0, 0)), "number");
  eq(cm.getTokenTypeAt(Pos(0, 6)), "string");
  cm.addOverlay({
    token: function(stream) {
      if (stream.match("foo")) return "foo";
      else stream.next();
    }
  });
  eq(byClassName(cm.getWrapperElement(), "cm-foo").length, 1);
  eq(cm.getTokenTypeAt(Pos(0, 6)), "string");
}, {value: "1 + 'foo'", mode: "javascript"});

testCM("resizeLineWidget", function(cm) {
  addDoc(cm, 200, 3);
  var widget = document.createElement("pre");
  widget.innerHTML = "imwidget";
  widget.style.background = "yellow";
  cm.addLineWidget(1, widget, {noHScroll: true});
  cm.setSize(40);
  is(widget.parentNode.offsetWidth < 42);
});

testCM("combinedOperations", function(cm) {
  var place = document.getElementById("testground");
  var other = CodeMirror(place, {value: "123"});
  try {
    cm.operation(function() {
      cm.addLineClass(0, "wrap", "foo");
      other.addLineClass(0, "wrap", "foo");
    });
    eq(byClassName(cm.getWrapperElement(), "foo").length, 1);
    eq(byClassName(other.getWrapperElement(), "foo").length, 1);
    cm.operation(function() {
      cm.removeLineClass(0, "wrap", "foo");
      other.removeLineClass(0, "wrap", "foo");
    });
    eq(byClassName(cm.getWrapperElement(), "foo").length, 0);
    eq(byClassName(other.getWrapperElement(), "foo").length, 0);
  } finally {
    place.removeChild(other.getWrapperElement());
  }
}, {value: "abc"});

testCM("eventOrder", function(cm) {
  var seen = [];
  cm.on("change", function() {
    if (!seen.length) cm.replaceSelection(".");
    seen.push("change");
  });
  cm.on("cursorActivity", function() {
    cm.replaceSelection("!");
    seen.push("activity");
  });
  cm.replaceSelection("/");
  eq(seen.join(","), "change,change,activity,change");
});

testCM("splitSpaces_nonspecial", function(cm) {
  eq(byClassName(cm.getWrapperElement(), "cm-invalidchar").length, 0);
}, {
  specialChars: /[\u00a0]/,
  value: "spaces ->            <- between"
});

test("core_rmClass", function() {
  var node = document.createElement("div");
  node.className = "foo-bar baz-quux yadda";
  CodeMirror.rmClass(node, "quux");
  eq(node.className, "foo-bar baz-quux yadda");
  CodeMirror.rmClass(node, "baz-quux");
  eq(node.className, "foo-bar yadda");
  CodeMirror.rmClass(node, "yadda");
  eq(node.className, "foo-bar");
  CodeMirror.rmClass(node, "foo-bar");
  eq(node.className, "");
  node.className = " foo ";
  CodeMirror.rmClass(node, "foo");
  eq(node.className, "");
});

test("core_addClass", function() {
  var node = document.createElement("div");
  CodeMirror.addClass(node, "a");
  eq(node.className, "a");
  CodeMirror.addClass(node, "a");
  eq(node.className, "a");
  CodeMirror.addClass(node, "b");
  eq(node.className, "a b");
  CodeMirror.addClass(node, "a");
  CodeMirror.addClass(node, "b");
  eq(node.className, "a b");
});

testCM("lineSeparator", function(cm) {
  eq(cm.lineCount(), 3);
  eq(cm.getLine(1), "bar\r");
  eq(cm.getLine(2), "baz\rquux");
  cm.setOption("lineSeparator", "\r");
  eq(cm.lineCount(), 5);
  eq(cm.getLine(4), "quux");
  eq(cm.getValue(), "foo\rbar\r\rbaz\rquux");
  eq(cm.getValue("\n"), "foo\nbar\n\nbaz\nquux");
  cm.setOption("lineSeparator", null);
  cm.setValue("foo\nbar\r\nbaz\rquux");
  eq(cm.lineCount(), 4);
}, {value: "foo\nbar\r\nbaz\rquux",
    lineSeparator: "\n"});

var extendingChars = /[\u0300-\u036f\u0483-\u0489\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u065e\u0670\u06d6-\u06dc\u06de-\u06e4\u06e7\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0900-\u0902\u093c\u0941-\u0948\u094d\u0951-\u0955\u0962\u0963\u0981\u09bc\u09be\u09c1-\u09c4\u09cd\u09d7\u09e2\u09e3\u0a01\u0a02\u0a3c\u0a41\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a70\u0a71\u0a75\u0a81\u0a82\u0abc\u0ac1-\u0ac5\u0ac7\u0ac8\u0acd\u0ae2\u0ae3\u0b01\u0b3c\u0b3e\u0b3f\u0b41-\u0b44\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b82\u0bbe\u0bc0\u0bcd\u0bd7\u0c3e-\u0c40\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0cbc\u0cbf\u0cc2\u0cc6\u0ccc\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0d3e\u0d41-\u0d44\u0d4d\u0d57\u0d62\u0d63\u0dca\u0dcf\u0dd2-\u0dd4\u0dd6\u0ddf\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0f18\u0f19\u0f35\u0f37\u0f39\u0f71-\u0f7e\u0f80-\u0f84\u0f86\u0f87\u0f90-\u0f97\u0f99-\u0fbc\u0fc6\u102d-\u1030\u1032-\u1037\u1039\u103a\u103d\u103e\u1058\u1059\u105e-\u1060\u1071-\u1074\u1082\u1085\u1086\u108d\u109d\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b7-\u17bd\u17c6\u17c9-\u17d3\u17dd\u180b-\u180d\u18a9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193b\u1a17\u1a18\u1a56\u1a58-\u1a5e\u1a60\u1a62\u1a65-\u1a6c\u1a73-\u1a7c\u1a7f\u1b00-\u1b03\u1b34\u1b36-\u1b3a\u1b3c\u1b42\u1b6b-\u1b73\u1b80\u1b81\u1ba2-\u1ba5\u1ba8\u1ba9\u1c2c-\u1c33\u1c36\u1c37\u1cd0-\u1cd2\u1cd4-\u1ce0\u1ce2-\u1ce8\u1ced\u1dc0-\u1de6\u1dfd-\u1dff\u200c\u200d\u20d0-\u20f0\u2cef-\u2cf1\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua66f-\ua672\ua67c\ua67d\ua6f0\ua6f1\ua802\ua806\ua80b\ua825\ua826\ua8c4\ua8e0-\ua8f1\ua926-\ua92d\ua947-\ua951\ua980-\ua982\ua9b3\ua9b6-\ua9b9\ua9bc\uaa29-\uaa2e\uaa31\uaa32\uaa35\uaa36\uaa43\uaa4c\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uabe5\uabe8\uabed\udc00-\udfff\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\uff9e\uff9f]/
var getChar = function (noExtending) { var res; do {res = String.fromCharCode(Math.floor(Math.random()*0x8ac)); } while ([0x90].indexOf(res.charCodeAt(0)) != -1 || (noExtending && extendingChars.test(res))); return res }
var getString = function (n) { var res = getChar(true); while (--n > 0) res += getChar(); return res }

function makeItWrapAfter(cm, pos) {
  var firstLineTop = cm.cursorCoords(Pos(0, 0)).top;
  for(var w = 0, posTop; posTop != firstLineTop; ++w) {
    cm.setSize(w);
    posTop = cm.charCoords(pos).top;
  }
}

function countIf(arr, f) {
  var result = 0
  for (var i = 0; i < arr.length; i++) if (f[arr[i]]) result++
  return result
}

function testMoveBidi(str) {
  testCM("move_bidi_" + str, function(cm) {
    if (cm.getOption("inputStyle") != "textarea" || !cm.getOption("rtlMoveVisually")) return;
    cm.getScrollerElement().style.fontFamily = "monospace";
    makeItWrapAfter(cm, Pos(0, 5));

    var steps = str.length - countIf(str.split(""), function(ch) { return extendingChars.test(ch) });
    var lineBreaks = {}
    lineBreaks[6 - countIf(str.substr(0, 5).split(""), function(ch) { return extendingChars.test(ch) })] = 'w';
    if (str.indexOf("\n") != -1) {
      lineBreaks[steps - 2] = 'n';
    }

    // Make sure we are at the visual beginning of the first line
    cm.execCommand("goLineStart");

    var prevCoords = cm.cursorCoords(), coords;
    for(var i = 0; i < steps; ++i) {
      cm.execCommand("goCharRight");
      coords = cm.cursorCoords();
      if ((i >= 10 && i <= 12) && !lineBreaks[i] && coords.left < prevCoords.left && coords.top > prevCoords.top) {
        // The first line wraps twice
        lineBreaks[i] = 'w';
      }
      if (!lineBreaks[i]) {
        is(coords.left > prevCoords.left, "In step " + i + ", cursor didn't move right");
        eq(coords.top, prevCoords.top, "In step " + i + ", cursor moved out of line");
      } else {
        is(coords.left < prevCoords.left, i);
        is(coords.top > prevCoords.top, i);
      }
      prevCoords = coords;
    }

    cm.execCommand("goCharRight");
    coords = cm.cursorCoords();
    eq(coords.left, prevCoords.left, "Moving " + steps + " steps right didn't reach the end");
    eq(coords.top, prevCoords.top, "Moving " + steps + " steps right didn't reach the end");

    for(i = steps - 1; i >= 0; --i) {
      cm.execCommand("goCharLeft");
      coords = cm.cursorCoords();
      if (!(lineBreaks[i] == 'n' || lineBreaks[i + 1] == 'w')) {
        is(coords.left < prevCoords.left, "In step " + i + ", cursor didn't move left");
        eq(coords.top, prevCoords.top, "In step " + i + ", cursor is not at the same line anymore");
      } else {
        is(coords.left > prevCoords.left, i);
        is(coords.top < prevCoords.top, i);
      }
      prevCoords = coords;
    }

    cm.execCommand("goCharLeft");
    coords = cm.cursorCoords();
    eq(coords.left, prevCoords.left, "Moving " + steps + " steps left didn't reach the beginning");
    eq(coords.top, prevCoords.top, "Moving " + steps + " steps left didn't reach the beginning");
  }, {value: str, lineWrapping: true})
};

function testMoveEndBidi(str) {
  testCM("move_end_bidi_" + str, function(cm) {
    cm.getScrollerElement().style.fontFamily = "monospace";
    makeItWrapAfter(cm, Pos(0, 5));

    cm.execCommand("goLineStart");
    var pos = cm.doc.getCursor();
    cm.execCommand("goCharLeft");
    eqCursorPos(pos, cm.doc.getCursor());

    cm.execCommand("goLineEnd");
    pos = cm.doc.getCursor();
    cm.execCommand("goColumnRight");
    eqCursorPos(pos, cm.doc.getCursor());
  }, {value: str, lineWrapping: true})
};

var bidiTests = [];

// We don't correctly implement L1 UBA
// See https://bugzilla.mozilla.org/show_bug.cgi?id=1331501
// and https://bugs.chromium.org/p/chromium/issues/detail?id=673405
/*
bidiTests.push("Say ا ب جabj\nS");
bidiTests.push("Sayyy ا ا ب ج");
*/

if (!phantom) {
  bidiTests.push("Όȝǝڪȉۥ״ۺ׆ɀҩۏ\nҳ");
  bidiTests.push("ŌӰтقȤ؁ƥ؅٣ĎȺ١\nϚ");
  bidiTests.push("ٻоҤѕѽΩ־؉ïίքǳ\nٵ");
  bidiTests.push("؅؁ĆՕƿɁǞϮؠȩóć\nď");
  bidiTests.push("RŨďңŪzϢŎƏԖڇڦ\nӈ");
  bidiTests.push("ό׊۷٢ԜһОצЉيčǟ\nѩ");
  bidiTests.push("ۑÚҳҕڬġڹհяųKV\nr");
  bidiTests.push("źڻғúہ4ם1Ƞc1a\nԁ");
  bidiTests.push("ҒȨҟփƞ٦ԓȦڰғâƥ\nڤ");
  bidiTests.push("ϖسՉȏŧΔԛǆĎӟیڡ\nέ");
  bidiTests.push("۹ؼL۵ĺȧКԙػא7״\nم");
  bidiTests.push("ن (ي)\u2009أقواس"); // thin space to throw off Firefox 51's broken white-space compressing behavior
}

bidiTests.push("քմѧǮßپüŢҍҞўڳ\nӧ");

//bidiTests.push("Count ١ ٢ ٣ ٤");
//bidiTests.push("ӣאƦϰ؊ȓېÛوը٬ز\nϪ");
//bidiTests.push("ҾճٳџIՖӻ٥׭֐؜ڏ\nێ");
//bidiTests.push("ҬÓФ؜ڂį٦Ͽɓڐͳٵ\nՈ");
//bidiTests.push("aѴNĳȻهˇ҃ڱӧǻֵ\na");
//bidiTests.push(" a٧ا٢ ب جa\nS");

for (var i = 0; i < bidiTests.length; ++i) {
  testMoveBidi(bidiTests[i]);
  testMoveEndBidi(bidiTests[i]);
}

/*
for (var i = 0; i < 5; ++i) {
  testMoveBidi(getString(12) + "\n" + getString(1));
}
*/

function testCoordsWrappedBidi(str) {
  testCM("coords_wrapped_bidi_" + str, function(cm) {
    cm.getScrollerElement().style.fontFamily = "monospace";
    makeItWrapAfter(cm, Pos(0, 5));

    // Make sure we are at the visual beginning of the first line
    var pos = Pos(0, 0), lastPos;
    cm.doc.setCursor(pos);
    do {
      lastPos = pos;
      cm.execCommand("goCharLeft");
      pos = cm.doc.getCursor();
    } while (pos != lastPos)

    var top = cm.charCoords(Pos(0, 0)).top, lastTop;
    for (var i = 1; i < str.length; ++i) {
      lastTop = top;
      top = cm.charCoords(Pos(0, i)).top;
      is(top >= lastTop);
    }
  }, {value: str, lineWrapping: true})
};

testCoordsWrappedBidi("Count ١ ٢ ٣ ٤");
/*
for (var i = 0; i < 5; ++i) {
  testCoordsWrappedBidi(getString(50));
}
*/

testCM("rtl_wrapped_selection", function(cm) {
  cm.setSelection(Pos(0, 10), Pos(0, 190))
  is(byClassName(cm.getWrapperElement(), "CodeMirror-selected").length >= 3)
}, {value: new Array(10).join(" فتي تم تضمينها فتي تم"), lineWrapping: true})

testCM("bidi_wrapped_selection", function(cm) {
  if (phantom) return
  cm.setSize(cm.charCoords(Pos(0, 10), "editor").left)
  cm.setSelection(Pos(0, 37), Pos(0, 80))
  var blocks = byClassName(cm.getWrapperElement(), "CodeMirror-selected")
  is(blocks.length >= 2)
  is(blocks.length <= 3)
  var boxTop = blocks[0].getBoundingClientRect(), boxBot = blocks[blocks.length - 1].getBoundingClientRect()
  is(boxTop.left > cm.charCoords(Pos(0, 1)).right)
  is(boxBot.right < cm.charCoords(Pos(0, cm.getLine(0).length - 2)).left)
}, {value: "<p>مفتي11 تم تضمينهفتي تم تضمينها فتي تفتي تم تضمينها فتي تفتي تم تضمينها فتي تفتي تم تضمينها فتي تا فت10ي ت</p>", lineWrapping: true})

testCM("delete_wrapped", function(cm) {
  makeItWrapAfter(cm, Pos(0, 2));
  cm.doc.setCursor(Pos(0, 3, "after"));
  cm.deleteH(-1, "char");
  eq(cm.getLine(0), "1245");
}, {value: "12345", lineWrapping: true})

CodeMirror.defineMode("lookahead_mode", function() {
  // Colors text as atom if the line two lines down has an x in it
  return {
    token: function(stream) {
      stream.skipToEnd()
      return /x/.test(stream.lookAhead(2)) ? "atom" : null
    }
  }
})

testCM("mode_lookahead", function(cm) {
  eq(cm.getTokenAt(Pos(0, 1)).type, "atom")
  eq(cm.getTokenAt(Pos(1, 1)).type, "atom")
  eq(cm.getTokenAt(Pos(2, 1)).type, null)
  cm.replaceRange("\n", Pos(2, 0))
  eq(cm.getTokenAt(Pos(0, 1)).type, null)
  eq(cm.getTokenAt(Pos(1, 1)).type, "atom")
}, {value: "foo\na\nx\nx\n", mode: "lookahead_mode"})
