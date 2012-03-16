var tests = [];

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
  var scroller = cm.getWrapperElement().getElementsByClassName("CodeMirror-scroll")[0];
  scroller.style.height = "100px";
  var content = [];
  for (var i = 0; i < 200; ++i) content.push("------------------------------" + i);
  cm.setValue(content.join("\n"));
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
  var content = [];
  for (var i = 0; i < 70; ++i) content.push("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
  cm.setValue(content.join("\n"));
  for (var ch = 0; ch < 35; ch += 2) {
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
  eq(cm.historySize().undo, 1);
  cm.undo();
  eq(cm.historySize().redo, 1);
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

// Scaffolding

function htmlEscape(str) {
  return str.replace(/[<&]/g, function(str) {return str == "&" ? "&amp;" : "&lt;";});
}
function forEach(arr, f) {
  for (var i = 0, e = arr.length; i < e; ++i) f(arr[i]);
}

function Failure(why) {this.message = why;}

function test(name, run) {tests.push({name: name, func: run});}
function testCM(name, run, opts) {
  test(name, function() {
    var place = document.getElementById("testground"), cm = CodeMirror(place, opts);
    try {run(cm);}
    finally {place.removeChild(cm.getWrapperElement());}
  });
}

function runTests() {
  var failures = [], run = 0;
  for (var i = 0; i < tests.length; ++i) {
    var test = tests[i];
    try {test.func();}
    catch(e) {
      if (e instanceof Failure)
        failures.push({type: "failure", test: test.name, text: e.message});
      else
        failures.push({type: "error", test: test.name, text: e.toString()});
    }
    run++;
  }
  var html = [run + " tests run."];
  if (failures.length)
    forEach(failures, function(fail) {
      html.push(fail.test + ': <span class="' + fail.type + '">' + htmlEscape(fail.text) + "</span>");
    });
  else html.push('<span class="ok">All passed.</span>');
  document.getElementById("output").innerHTML = html.join("\n");
}

function eq(a, b, msg) {
  if (a != b) throw new Failure(a + " != " + b + (msg ? " (" + msg + ")" : ""));
}
function eqPos(a, b, msg) {
  if (a == b) return;
  if (a == null || b == null) throw new Failure("comparing point to null");
  eq(a.line, b.line, msg);
  eq(a.ch, b.ch, msg);
}
function is(a, msg) {
  if (!a) throw new Failure("assertion failed" + (msg ? " (" + msg + ")" : ""));
}

window.onload = runTests;
