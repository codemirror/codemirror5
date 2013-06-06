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

  function sentenceEnd(cm, dir) {
    var pos = cm.getCursor(), line = pos.line, ch = pos.ch;
    var text = cm.getLine(pos.line), sawWord = false;
    for (;;) {
      var next = text.charAt(ch + (dir < 0 ? -1 : 0));
      if (!next) { // End/beginning of line reached
        if (line == (dir < 0 ? cm.firstLine() : cm.lastLine())) return Pos(line, ch);
        text = cm.getLine(line + dir);
        if (!/\S/.test(text)) return Pos(line, ch);
        line += dir;
        ch = dir < 0 ? text.length : 0;
        continue;
      }
      if (sawWord && /[!?.]/.test(next)) return Pos(line, ch + (dir > 0 ? 1 : 0));
      if (!sawWord) sawWord = /\w/.test(next);
      ch += dir;
    }
  }

  function exprEnd(cm, dir) {
    var pos = cm.getCursor(), wrap;
    if (cm.findMatchingBracket && (wrap = cm.findMatchingBracket(pos, true))
        && wrap.match && (wrap.forward ? 1 : -1) == dir)
      return dir > 0 ? Pos(wrap.to.line, wrap.to.ch + 1) : wrap.to;

    for (var first = true;; first = false) {
      var token = cm.getTokenAt(pos);
      var after = Pos(pos.line, dir < 0 ? token.start : token.end);
      if (first && dir > 0 && token.end == pos.ch || !/\w/.test(token.string)) {
        var newPos = cm.findPosH(after, dir, "char");
        if (posEq(after, newPos)) return pos;
        else pos = newPos;
      } else {
        return after;
      }
    }
  }

  // Utilities

  function setMark(cm) {
    cm.setCursor(cm.getCursor());
    cm.setExtending(true);
    cm.on("change", function() { cm.setExtending(false); });
  }

  function getInput(cm, msg, f) {
    if (cm.openDialog)
      cm.openDialog(msg + ": <input type=\"text\" style=\"width: 10em\"/>", f, {bottom: true});
    else
      f(prompt(msg, ""));
  }

  function operateOnWord(cm, op) {
    var start = cm.getCursor(), end = cm.findPosH(start, 1, "word");
    cm.replaceRange(op(cm.getRange(start, end)), start, end);
    cm.setCursor(end);
  }

  // Actual keymap

  CodeMirror.keyMap.emacs = {
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

    "Ctrl-Space": setMark, "Ctrl-Shift-2": setMark,

    "Ctrl-Up": function(cm) { cm.extendSelection(paragraphEnd(cm, -1)); },
    "Ctrl-Down": function(cm) { cm.extendSelection(paragraphEnd(cm, 1)); },

    "Alt-A": function(cm) { cm.extendSelection(sentenceEnd(cm, -1)); },
    "Alt-E": function(cm) { cm.extendSelection(sentenceEnd(cm, 1)); },
    "Alt-K": function(cm) { kill(cm, cm.getCursor(), sentenceEnd(cm, 1), true); },

    "Ctrl-Alt-K": function(cm) { kill(cm, cm.getCursor(), exprEnd(cm, 1), true); },
    "Ctrl-Alt-Backspace": function(cm) { kill(cm, cm.getCursor(), exprEnd(cm, -1), true); },
    "Ctrl-Alt-F": function(cm) { cm.extendSelection(exprEnd(cm, 1)); },
    "Ctrl-Alt-B": function(cm) { cm.extendSelection(exprEnd(cm, -1)); },

    "Alt-G": function(cm) {cm.setOption("keyMap", "emacs-Alt-G");},
    "Ctrl-X": function(cm) {cm.setOption("keyMap", "emacs-Ctrl-X");},

    "Alt-Space": function(cm) {
      var pos = cm.getCursor(), from = pos.ch, to = pos.ch, text = cm.getLine(pos.line);
      while (from && /\s/.test(text.charAt(from - 1))) --from;
      while (to < text.length && /\s/.test(text.charAt(to))) ++to;
      cm.replaceRange(" ", Pos(pos.line, from), Pos(pos.line, to));
    },
    "Ctrl-O": function(cm) { cm.replaceSelection("\n", "start"); },
    "Ctrl-T": function(cm) {
      var pos = cm.getCursor();
      if (pos.ch < cm.getLine(pos.line).length) pos = Pos(pos.line, pos.ch + 1);
      var from = cm.findPosH(pos, -2, "char");
      var range = cm.getRange(from, pos);
      if (range.length != 2) return;
      cm.setSelection(from, pos);
      cm.replaceSelection(range.charAt(1) + range.charAt(0), "end");
    },

    "Alt-C": function(cm) {
      operateOnWord(cm, function(w) {
        var letter = w.search(/\w/);
        if (letter == -1) return w;
        return w.slice(0, letter) + w.charAt(letter).toUpperCase() + w.slice(letter + 1).toLowerCase();
      });
    },
    "Alt-U": function(cm) { operateOnWord(cm, function(w) { return w.toUpperCase(); }); },
    "Alt-L": function(cm) { operateOnWord(cm, function(w) { return w.toLowerCase(); }); },

    "Alt-;": "toggleComment",

    "Ctrl-/": "undo", "Shift-Ctrl--": "undo", "Shift-Alt-,": "goDocStart", "Shift-Alt-.": "goDocEnd",
    "Ctrl-S": "findNext", "Ctrl-R": "findPrev", "Ctrl-G": "clearSearch", "Shift-Alt-5": "replace",
    "Ctrl-Z": "undo", "Cmd-Z": "undo", "Alt-/": "autocomplete", "Alt-V": "goPageUp",
    "Ctrl-J": "newlineAndIndent", "Enter": false, "Tab": "indentAuto",
    fallthrough: ["basic", "emacsy"]
  };

  CodeMirror.keyMap["emacs-Ctrl-X"] = {
    "Ctrl-S": "save", "Ctrl-W": "save", "S": "saveAll", "F": "open", "U": "undo", "K": "close",
    "Delete": function(cm) { kill(cm, cm.getCursor(), sentenceEnd(cm, 1), true); },
    auto: "emacs", nofallthrough: true, disableInput: true
  };

  CodeMirror.keyMap["emacs-Alt-G"] = {
    "G": function(cm) {
      getInput(cm, "Goto line", function(str) {
        var num;
        if (str && !isNaN(num = Number(str)) && num == num|0 && num > 0)
          cm.setCursor(num - 1);
      });
    },
    auto: "emacs", nofallthrough: true, disableInput: true
  };
})();
