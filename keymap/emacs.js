// TODO number prefixes
(function() {
  "use strict";

  var Pos = CodeMirror.Pos;
  function posEq(a, b) { return a.line == b.line && a.ch == b.ch; }

  // Kill 'ring'

  var killRing = [];
  function addToRing(str) {
    killRing.push(str);
    if (killRing.length > 50) killRing.shift();
  }
  function growRingTop(str) {
    if (!killRing.length) return addToRing(str);
    killRing[killRing.length - 1] += str;
  }
  function getFromRing() { return killRing[killRing.length - 1] || ""; }
  function popFromRing() { if (killRing.length > 1) killRing.pop(); return getFromRing(); }

  var lastKill = null;

  function kill(cm, from, to, mayGrow, text) {
    if (text == null) text = cm.getRange(from, to);

    if (mayGrow && lastKill && lastKill.cm == cm && posEq(from, lastKill.pos) && cm.isClean(lastKill.gen))
      growRingTop(text);
    else
      addToRing(text);
    cm.replaceRange("", from, to, "+delete");

    if (mayGrow) lastKill = {cm: cm, pos: from, gen: cm.changeGeneration()};
    else lastKill = null;
  }

  // Boundaries of various units

  function paragraphEnd(cm, dir) {
    var pos = cm.getCursor(), no = pos.line, line = cm.getLine(no);
    var sawText = /\S/.test(dir < 0 ? line.slice(0, pos.ch) : line.slice(pos.ch));
    var fst = cm.firstLine(), lst = cm.lastLine();
    for (;;) {
      no += dir;
      if (no < fst || no > lst)
        return cm.clipPos(Pos(no - dir, dir < 0 ? 0 : null));
      line = cm.getLine(no);
      var hasText = /\S/.test(line);
      if (hasText) sawText = true;
      else if (sawText) return Pos(no, 0);
    }
  }

  // Actual keymap

  CodeMirror.keyMap.emacs = {
    "Ctrl-X": function(cm) {cm.setOption("keyMap", "emacs-Ctrl-X");},
    "Ctrl-W": function(cm) {kill(cm, cm.getCursor("start"), cm.getCursor("end"));},
    "Ctrl-K": function(cm) {
      var start = cm.getCursor(), end = cm.clipPos(Pos(start.line));
      var text = cm.getRange(start, end);
      if (!/\S/.test(text)) {
        text += "\n";
        end = Pos(start.line + 1, 0);
      }
      kill(cm, start, end, true, text);
    },
    "Alt-W": function(cm) {
      addToRing(cm.getSelection());
    },
    "Ctrl-Y": function(cm) {
      var start = cm.getCursor();
      cm.replaceRange(getFromRing(), start, start, "paste");
      cm.setSelection(start, cm.getCursor());
    },
    "Alt-Y": function(cm) {cm.replaceSelection(popFromRing());},

    "Ctrl-Space": function(cm) {
      cm.setCursor(cm.getCursor());
      cm.setExtending(true);
      cm.on("change", function() { cm.setExtending(false); });
    },

    "Ctrl-Up": function(cm) { cm.extendSelection(paragraphEnd(cm, -1)); },
    "Ctrl-Down": function(cm) { cm.extendSelection(paragraphEnd(cm, 1)); },

    "Ctrl-/": "undo", "Shift-Ctrl--": "undo", "Shift-Alt-,": "goDocStart", "Shift-Alt-.": "goDocEnd",
    "Ctrl-S": "findNext", "Ctrl-R": "findPrev", "Ctrl-G": "clearSearch", "Shift-Alt-5": "replace",
    "Ctrl-Z": "undo", "Cmd-Z": "undo", "Alt-/": "autocomplete", "Alt-V": "goPageUp",
    "Ctrl-J": "newlineAndIndent", "Enter": false, "Tab": "indentAuto",
    fallthrough: ["basic", "emacsy"]
  };

  CodeMirror.keyMap["emacs-Ctrl-X"] = {
    "Ctrl-S": "save", "Ctrl-W": "save", "S": "saveAll", "F": "open", "U": "undo", "K": "close",
    auto: "emacs", nofallthrough: true, disableInput: true
  };
})();
