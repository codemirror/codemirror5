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
}, {value: "if (x) {\nblah();\n}", indentUnit: 3, indentWithTabs: true});

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
    eq(cm.getInputField().tabindex, 55);
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
  scroller.scrollTop = 100;
  cm.refresh();
  var top2 = cm.charCoords({line: 0, ch: 0});
  is(top.y > top2.y);
  eq(top.x, top2.x);
});

testCM("coordsChar", function(cm) {
  var content = [];
  for (var i = 0; i < 70; ++i) content.push("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
  cm.setValue(content.join("\n"));
  for (var x = 0; x < 35; x += 2) {
    for (var y = 0; y < 70; y += 5) {
      cm.setCursor(y, x);
      var pos = cm.coordsChar(cm.charCoords({line: y, ch: x}));
      eq(pos.line, y);
      eq(pos.ch, x);
    }
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
  eq(cm.historySize().undo, 0);
  for (var i = 0; i < 20; ++i) {
    cm.replaceRange("a", {line: 0, ch: 0});
    cm.replaceRange("b", {line: 3, ch: 0});
  }
  eq(cm.historySize().undo, 40);
  for (var i = 0; i < 38; ++i) cm.undo();
  eq(cm.historySize().undo, 2);
  eq(cm.historySize().redo, 38);
  eq(cm.getValue(), "a1\n\n\nb2");
  cm.setOption("undoDepth", 10);
  for (var i = 0; i < 20; ++i) {
    cm.replaceRange("a", {line: 0, ch: 0});
    cm.replaceRange("b", {line: 3, ch: 0});
  }
  eq(cm.historySize().undo, 10);
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
  eq(a.line, b.line, msg);
  eq(a.ch, b.ch, msg);
}
function is(a, msg) {
  if (!a) throw new Failure("assertion failed" + (msg ? " (" + msg + ")" : ""));
}

window.onload = runTests;
