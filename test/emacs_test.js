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

  function sim(name, start /*, keys..., result */) {
    var keys = Array.prototype.slice.call(arguments, 2, arguments.length - 1);
    var result = arguments[arguments.length - 1];
    testCM(name, function(cm) {
      for (var i = 0; i < keys.length; ++i) {
        var cur = keys[i];
        if (cur instanceof Pos) cm.setCursor(cur);
        else if (cur.call) cur(cm);
        else cm.triggerOnKeyDown(fakeEvent(cur));
      }
      if (result instanceof Pos) eqPos(cm.getCursor(), result);
      else eq(cm.getValue(), result);
    }, {keyMap: "emacs", value: start});
  }

  sim("motionHSimple", "abc", "Ctrl-F", "Ctrl-F", "Ctrl-B", Pos(0, 1));
  sim("motionVSimple", "a\nb\nc\n", "Ctrl-N", "Ctrl-N", "Ctrl-P", Pos(1, 0));

  sim("killYank", "abc\ndef\nghi",
      "Ctrl-F", "Ctrl-Space", "Ctrl-N", "Ctrl-N", "Ctrl-W", "Ctrl-E", "Ctrl-Y",
      "ahibc\ndef\ng");
  sim("killRing", "abcdef",
      "Ctrl-Space", "Ctrl-F", "Ctrl-W", "Ctrl-Space", "Ctrl-F", "Ctrl-W",
      "Ctrl-Y", "Alt-Y",
      "acdef");
  sim("copyYank", "abcd",
      "Ctrl-Space", "Ctrl-E", "Alt-W", "Ctrl-Y",
      "abcdabcd");

  sim("killLineSimple", "foo\nbar", "Ctrl-F", "Ctrl-K", "f\nbar");
  sim("killLineEmptyLine", "foo\n  \nbar", "Ctrl-N", "Ctrl-K", "foo\nbar");
  sim("killLineMulti", "foo\nbar\nbaz",
      "Ctrl-F", "Ctrl-F", "Ctrl-K", "Ctrl-K", "Ctrl-K", "Ctrl-A", "Ctrl-Y",
      "o\nbarfo\nbaz");

  testCM("save", function(cm) {
    var saved = false;
    CodeMirror.commands.save = function(cm) { saved = cm.getValue(); };
    cm.triggerOnKeyDown(fakeEvent("Ctrl-X"));
    cm.triggerOnKeyDown(fakeEvent("Ctrl-S"));
    is(saved, "hi");
  }, {value: "hi", keyMap: "emacs"});
})();
