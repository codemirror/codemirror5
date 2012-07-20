function forEach(arr, f) {
  for (var i = 0, e = arr.length; i < e; ++i) f(arr[i]);
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

test("fromTextArea", function() {
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
  eq(cm.getRange({line: 0, ch: 0}, {line: 0, ch: 3}), "123");
  eq(cm.getRange({line: 0, ch: -1}, {line: 0, ch: 200}), "1234");
  eq(cm.getRange({line: 0, ch: 2}, {line: 1, ch: 2}), "34\n56");
  eq(cm.getRange({line: 1, ch: 2}, {line: 100, ch: 0}), "78");
}, {value: "1234\n5678"});

testCM("replaceRange", function(cm) {
  eq(cm.getValue(), "");
  cm.replaceRange("foo\n", {line: 0, ch: 0});
  eq(cm.getValue(), "foo\n");
  cm.replaceRange("a\nb", {line: 0, ch: 1});
  eq(cm.getValue(), "fa\nboo\n");
  eq(cm.lineCount(), 3);
  cm.replaceRange("xyzzy", {line: 0, ch: 0}, {line: 1, ch: 1});
  eq(cm.getValue(), "xyzzyoo\n");
  cm.replaceRange("abc", {line: 0, ch: 0}, {line: 10, ch: 0});
  eq(cm.getValue(), "abc");
  eq(cm.lineCount(), 1);
});

testCM("selection", function(cm) {
  cm.setSelection({line: 0, ch: 4}, {line: 2, ch: 2});
  is(cm.somethingSelected());
  eq(cm.getSelection(), "11\n222222\n33");
  eqPos(cm.getCursor(false), {line: 2, ch: 2});
  eqPos(cm.getCursor(true), {line: 0, ch: 4});
  cm.setSelection({line: 1, ch: 0});
  is(!cm.somethingSelected());
  eq(cm.getSelection(), "");
  eqPos(cm.getCursor(true), {line: 1, ch: 0});
  cm.replaceSelection("abc");
  eq(cm.getSelection(), "abc");
  eq(cm.getValue(), "111111\nabc222222\n333333");
  cm.replaceSelection("def", "end");
  eq(cm.getSelection(), "");
  eqPos(cm.getCursor(true), {line: 1, ch: 3});
  cm.setCursor({line: 2, ch: 1});
  eqPos(cm.getCursor(true), {line: 2, ch: 1});
  cm.setCursor(1, 2);
  eqPos(cm.getCursor(true), {line: 1, ch: 2});
}, {value: "111111\n222222\n333333"});

testCM("lines", function(cm) {
  eq(cm.getLine(0), "111111");
  eq(cm.getLine(1), "222222");
  eq(cm.getLine(-1), null);
  cm.removeLine(1);
  cm.setLine(1, "abc");
  eq(cm.getValue(), "111111\nabc");
}, {value: "111111\n222222\n333333"});

testCM("indent", function(cm) {
  cm.indentLine(1);
  eq(cm.getLine(1), "   blah();");
  cm.setOption("indentUnit", 8);
  cm.indentLine(1);
  eq(cm.getLine(1), "\tblah();");
}, {value: "if (x) {\nblah();\n}", indentUnit: 3, indentWithTabs: true, tabSize: 8});

test("defaults", function() {
  var olddefaults = CodeMirror.defaults, defs = CodeMirror.defaults = {};
  for (var opt in olddefaults) defs[opt] = olddefaults[opt];
  defs.indentUnit = 5;
  defs.value = "uu";
  defs.enterMode = "keep";
  defs.tabindex = 55;
  var place = document.getElementById("testground"), cm = CodeMirror(place);
  try {
    eq(cm.getOption("indentUnit"), 5);
    cm.setOption("indentUnit", 10);
    eq(defs.indentUnit, 5);
    eq(cm.getValue(), "uu");
    eq(cm.getOption("enterMode"), "keep");
    eq(cm.getInputField().tabIndex, 55);
  }
  finally {
    CodeMirror.defaults = olddefaults;
    place.removeChild(cm.getWrapperElement());
  }
});

testCM("lineInfo", function(cm) {
  eq(cm.lineInfo(-1), null);
  var lh = cm.setMarker(1, "FOO", "bar");
  var info = cm.lineInfo(1);
  eq(info.text, "222222");
  eq(info.markerText, "FOO");
  eq(info.markerClass, "bar");
  eq(info.line, 1);
  eq(cm.lineInfo(2).markerText, null);
  cm.clearMarker(lh);
  eq(cm.lineInfo(1).markerText, null);
}, {value: "111111\n222222\n333333"});

testCM("coords", function(cm) {
  cm.setSize(null, 100);
  addDoc(cm, 32, 200);
  var top = cm.charCoords({line: 0, ch: 0});
  var bot = cm.charCoords({line: 200, ch: 30});
  is(top.x < bot.x);
  is(top.y < bot.y);
  is(top.y < top.yBot);
  cm.scrollTo(null, 100);
  var top2 = cm.charCoords({line: 0, ch: 0});
  is(top.y > top2.y);
  eq(top.x, top2.x);
});

testCM("coordsChar", function(cm) {
  addDoc(cm, 35, 70);
  for (var ch = 0; ch <= 35; ch += 5) {
    for (var line = 0; line < 70; line += 5) {
      cm.setCursor(line, ch);
      var coords = cm.charCoords({line: line, ch: ch});
      var pos = cm.coordsChar({x: coords.x, y: coords.y + 1});
      eq(pos.line, line);
      eq(pos.ch, ch);
    }
  }
});

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
  cm.setLine(0, "def");
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
    cm.replaceRange("a", {line: 0, ch: 0});
    cm.replaceRange("b", {line: 3, ch: 0});
  }
  eq(cm.historySize().undo, 40);
  for (var i = 0; i < 40; ++i)
    cm.undo();
  eq(cm.historySize().redo, 40);
  eq(cm.getValue(), "1\n\n\n2");
}, {value: "abc"});

testCM("undoMultiLine", function(cm) {
  cm.replaceRange("x", {line:0, ch: 0});
  cm.replaceRange("y", {line:1, ch: 0});
  cm.undo();
  eq(cm.getValue(), "abc\ndef\nghi");
  cm.replaceRange("y", {line:1, ch: 0});
  cm.replaceRange("x", {line:0, ch: 0});
  cm.undo();
  eq(cm.getValue(), "abc\ndef\nghi");
  cm.replaceRange("y", {line:2, ch: 0});
  cm.replaceRange("x", {line:1, ch: 0});
  cm.replaceRange("z", {line:2, ch: 0});
  cm.undo();
  eq(cm.getValue(), "abc\ndef\nghi");
}, {value: "abc\ndef\nghi"});

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
    var r = cm.markText({line: 0, ch: 3}, {line: 0, ch: 6}, "foo");
    cm.replaceRange(test.c, {line: 0, ch: test.a}, {line: 0, ch: test.b});
    var f = r.find();
    eq(f.from && f.from.ch, test.f); eq(f.to && f.to.ch, test.t);
  });
});

testCM("markTextMultiLine", function(cm) {
  function p(v) { return v && {line: v[0], ch: v[1]}; }
  forEach([{a: [0, 0], b: [0, 5], c: "", f: [0, 0], t: [2, 5]},
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
           {a: [2, 3], b: [3, 0], c: "x", f: [0, 5], t: [2, 4]},
           {a: [1, 1], b: [1, 9], c: "1\n2\n3", f: [0, 5], t: [4, 5]}], function(test) {
    cm.setValue("aaaaaaaaaa\nbbbbbbbbbb\ncccccccccc\ndddddddd\n");
    var r = cm.markText({line: 0, ch: 5}, {line: 2, ch: 5}, "foo");
    cm.replaceRange(test.c, p(test.a), p(test.b));
    var f = r.find();
    eqPos(f.from, p(test.f)); eqPos(f.to, p(test.t));
  });
});

testCM("markClearBetween", function(cm) {
  cm.setValue("aaa\nbbb\nccc\nddd\n");
  cm.markText({line: 0, ch: 0}, {line: 2}, "foo");
  cm.replaceRange("aaa\nbbb\nccc", {line: 0, ch: 0}, {line: 2});
  eq(cm.findMarksAt({line: 1, ch: 1}).length, 0);
});

testCM("bookmark", function(cm) {
  function p(v) { return v && {line: v[0], ch: v[1]}; }
  forEach([{a: [1, 0], b: [1, 1], c: "", d: [1, 4]},
           {a: [1, 1], b: [1, 1], c: "xx", d: [1, 7]},
           {a: [1, 4], b: [1, 5], c: "ab", d: [1, 6]},
           {a: [1, 4], b: [1, 6], c: "", d: null},
           {a: [1, 5], b: [1, 6], c: "abc", d: [1, 5]},
           {a: [1, 6], b: [1, 8], c: "", d: [1, 5]},
           {a: [1, 4], b: [1, 4], c: "\n\n", d: [3, 1]},
           {bm: [1, 9], a: [1, 1], b: [1, 1], c: "\n", d: [2, 8]}], function(test) {
    cm.setValue("1234567890\n1234567890\n1234567890");
    var b = cm.setBookmark(p(test.bm) || {line: 1, ch: 5});
    cm.replaceRange(test.c, p(test.a), p(test.b));
    eqPos(b.find(), p(test.d));
  });
});

testCM("bug577", function(cm) {
  cm.setValue("a\nb");
  cm.clearHistory();
  cm.setValue("fooooo");
  cm.undo();
});

testCM("scrollSnap", function(cm) {
  cm.setSize(100, 100);
  addDoc(cm, 200, 200);
  cm.setCursor({line: 100, ch: 180});
  var info = cm.getScrollInfo();
  is(info.x > 0 && info.y > 0);
  cm.setCursor({line: 0, ch: 0});
  info = cm.getScrollInfo();
  is(info.x == 0 && info.y == 0, "scrolled clean to top");
  cm.setCursor({line: 100, ch: 180});
  cm.setCursor({line: 199, ch: 0});
  info = cm.getScrollInfo();
  is(info.x == 0 && info.y == info.height - 100, "scrolled clean to bottom");
});

testCM("selectionPos", function(cm) {
  cm.setSize(100, 100);
  addDoc(cm, 200, 100);
  cm.setSelection({line: 1, ch: 100}, {line: 98, ch: 100});
  var lineWidth = cm.charCoords({line: 0, ch: 200}, "local").x;
  var lineHeight = cm.charCoords({line: 1}).y - cm.charCoords({line: 0}).y;
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
      is(box.bottom - box.top > 95 * lineHeight, "middle high");
      is(width > .9 * lineWidth, "middle wide");
    } else {
      is(width > .4 * lineWidth, "top/bot wide enough");
      is(width < .6 * lineWidth, "top/bot slim enough");
      if (atLeft) {
        sawBottom = true;
        is(box.top - outer.top > 96 * lineHeight, "bot below");
      } else if (atRight) {
        sawTop = true;
        is(box.top - outer.top < 2 * lineHeight, "top above");
      }
    }
  }
  is(sawTop && sawBottom && sawMiddle, "all parts");
});

testCM("restoreHistory", function(cm) {
  cm.setValue("abc\ndef");
  cm.compoundChange(function() {cm.setLine(1, "hello");});
  cm.compoundChange(function() {cm.setLine(0, "goop");});
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
  cm.setSize(null, 100);
  addDoc(cm, 1, 300);
  var wrap = cm.getWrapperElement();
  is(wrap.offsetWidth - byClassName(wrap, "CodeMirror-lines")[0].offsetWidth <= scrollbarWidth);
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
  is(cm.getWrapperElement().offsetWidth, 100);
  is(cm.getWrapperElement().offsetHeight, 100);
  cm.setSize("100%", "3em");
  is(cm.getWrapperElement().style.width, "100%");
  is(cm.getScrollerElement().style.height, "3em");
  cm.setSize(null, 40);
  is(cm.getWrapperElement().style.width, "100%");
  is(cm.getScrollerElement().style.height, "40px");
});

testCM("hiddenLines", function(cm) {
  addDoc(cm, 4, 10);
  cm.hideLine(4);
  cm.setCursor({line: 3, ch: 0});
  CodeMirror.commands.goLineDown(cm);
  eqPos(cm.getCursor(), {line: 5, ch: 0});
  cm.setLine(3, "abcdefg");
  cm.setCursor({line: 3, ch: 6});
  CodeMirror.commands.goLineDown(cm);
  eqPos(cm.getCursor(), {line: 5, ch: 4});
  cm.setLine(3, "ab");
  cm.setCursor({line: 3, ch: 2});
  CodeMirror.commands.goLineDown(cm);
  eqPos(cm.getCursor(), {line: 5, ch: 2});
});

testCM("hiddenLinesSelectAll", function(cm) {  // Issue #484
  addDoc(cm, 4, 20);
  for (var i = 0; i < 20; ++i)
    if (i != 10) cm.hideLine(i);
  CodeMirror.commands.selectAll(cm);
  eqPos(cm.getCursor(true), {line: 10, ch: 0});
  eqPos(cm.getCursor(false), {line: 10, ch: 4});
});

testCM("wrappingAndResizing", function(cm) {
  cm.setSize(null, "auto");
  cm.setOption("lineWrapping", true);
  var wrap = cm.getWrapperElement(), h0 = wrap.offsetHeight, w = 50;
  var doc = "xxx xxx xxx xxx xxx";
  cm.setValue(doc);
  for (var step = 10;; w += step) {
    cm.setSize(w);
    if (wrap.offsetHeight == h0) {
      if (step == 10) { w -= 10; step = 1; }
      else { w--; break; }
    }
  }
  // Ensure that putting the cursor at the end of the maximally long
  // line doesn't cause wrapping to happen.
  cm.setCursor({line: 0, ch: doc.length});
  eq(wrap.offsetHeight, h0);
  cm.replaceSelection("x");
  is(wrap.offsetHeight > h0);
  // Now add a max-height and, in a document consisting of
  // almost-wrapped lines, go over it so that a scrollbar appears.
  cm.setValue(doc + "\n" + doc + "\n");
  cm.getScrollerElement().style.maxHeight = "100px";
  cm.replaceRange("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n!\n", {line: 2, ch: 0});
  forEach([{line: 0, ch: doc.length}, {line: 0, ch: doc.length - 1},
           {line: 0, ch: 0}, {line: 1, ch: doc.length}, {line: 1, ch: doc.length - 1}],
          function(pos) {
    var coords = cm.charCoords(pos);
    eqPos(pos, cm.coordsChar({x: coords.x + 2, y: coords.y + 2}));
  });
});
