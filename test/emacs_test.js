(function() {
  "use strict";

  var Pos = CodeMirror.Pos;
  namespace = "emacs_";

  var eventCache = {};
  function fakeEvent(keyName) {
    var event = eventCache[key];
    if (event) return event;

    var ctrl, shift, alt;
    var key = keyName.replace(/\w+-/g, function(type) {
      if (type == "Ctrl-") ctrl = true;
      else if (type == "Alt-") alt = true;
      else if (type == "Shift-") shift = true;
      return "";
    });
    var code;
    for (var c in CodeMirror.keyNames)
      if (CodeMirror.keyNames[c] == key) { code = c; break; }
    if (c == null) throw new Error("Unknown key: " + key);

    return eventCache[keyName] = {
      type: "keydown", keyCode: code, ctrlKey: ctrl, shiftKey: shift, altKey: alt,
      preventDefault: function(){}, stopPropagation: function(){}
    };
  }

  function sim(name, start /*, actions... */) {
    var keys = Array.prototype.slice.call(arguments, 2);
    testCM(name, function(cm) {
      for (var i = 0; i < keys.length; ++i) {
        var cur = keys[i];
        if (cur instanceof Pos) cm.setCursor(cur);
        else if (cur.call) cur(cm);
        else cm.triggerOnKeyDown(fakeEvent(cur));
      }
    }, {keyMap: "emacs", value: start, mode: "javascript"});
  }

  function at(line, ch) { return function(cm) { eqPos(cm.getCursor(), Pos(line, ch)); }; }
  function txt(str) { return function(cm) { eq(cm.getValue(), str); }; }

  sim("motionHSimple", "abc", "Ctrl-F", "Ctrl-F", "Ctrl-B", at(0, 1));
  sim("motionVSimple", "a\nb\nc\n", "Ctrl-N", "Ctrl-N", "Ctrl-P", at(1, 0));

  sim("killYank", "abc\ndef\nghi",
      "Ctrl-F", "Ctrl-Space", "Ctrl-N", "Ctrl-N", "Ctrl-W", "Ctrl-E", "Ctrl-Y",
      txt("ahibc\ndef\ng"));
  sim("killRing", "abcdef",
      "Ctrl-Space", "Ctrl-F", "Ctrl-W", "Ctrl-Space", "Ctrl-F", "Ctrl-W",
      "Ctrl-Y", "Alt-Y",
      txt("acdef"));
  sim("copyYank", "abcd",
      "Ctrl-Space", "Ctrl-E", "Alt-W", "Ctrl-Y",
      txt("abcdabcd"));

  sim("killLineSimple", "foo\nbar", "Ctrl-F", "Ctrl-K", txt("f\nbar"));
  sim("killLineEmptyLine", "foo\n  \nbar", "Ctrl-N", "Ctrl-K", txt("foo\nbar"));
  sim("killLineMulti", "foo\nbar\nbaz",
      "Ctrl-F", "Ctrl-F", "Ctrl-K", "Ctrl-K", "Ctrl-K", "Ctrl-A", "Ctrl-Y",
      txt("o\nbarfo\nbaz"));

  sim("moveByParagraph", "abc\ndef\n\n\nhij\nklm\n\n",
      "Ctrl-F", "Ctrl-Down", at(2, 0), "Ctrl-Down", at(6, 0),
      "Ctrl-N", "Ctrl-Up", at(3, 0), "Ctrl-Up", at(0, 0),
      Pos(1, 2), "Ctrl-Down", at(2, 0), Pos(4, 2), "Ctrl-Up", at(3, 0));

  sim("moveBySentence", "sentence one! sentence\ntwo\n\nparagraph two",
      "Alt-E", at(0, 13), "Alt-E", at(1, 3), "Ctrl-F", "Alt-A", at(0, 13));

  sim("moveByExpr", "function foo(a, b) {}",
      "Ctrl-Alt-F", at(0, 8), "Ctrl-Alt-F", at(0, 12), "Ctrl-Alt-F", at(0, 18),
      "Ctrl-Alt-B", at(0, 12), "Ctrl-Alt-B", at(0, 9));
  sim("delExpr", "var x = [\n  a,\n  b\n  c\n];",
      Pos(0, 8), "Ctrl-Alt-K", txt("var x = ;"), "Ctrl-/",
      Pos(4, 1), "Ctrl-Alt-Backspace", txt("var x = ;"));

  sim("justOneSpace", "hi      bye  ",
      Pos(0, 4), "Alt-Space", txt("hi bye  "),
      Pos(0, 4), "Alt-Space", txt("hi b ye  "),
      "Ctrl-A", "Alt-Space", "Ctrl-E", "Alt-Space", txt(" hi b ye "));

  testCM("save", function(cm) {
    var saved = false;
    CodeMirror.commands.save = function(cm) { saved = cm.getValue(); };
    cm.triggerOnKeyDown(fakeEvent("Ctrl-X"));
    cm.triggerOnKeyDown(fakeEvent("Ctrl-S"));
    is(saved, "hi");
  }, {value: "hi", keyMap: "emacs"});
})();
