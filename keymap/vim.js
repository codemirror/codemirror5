(function() {
  var count = "";
  function pushCountDigit(digit) { return function(cm) {count += digit;} }
  function popCount() { var i = parseInt(count); count = ""; return i || 1; }
  function countTimes(func) {
    if (typeof func == "string") func = CodeMirror.commands[func];
    return function(cm) { for (var i = 0, c = popCount(); i < c; ++i) func(cm); }
  }

  function iterObj(o, f) {
    for (var prop in o) if (o.hasOwnProperty(prop)) f(prop, o[prop]);
  }

  var word = [/\w/, /[^\w\s]/], bigWord = [/\S/];
  function findWord(line, pos, dir, regexps) {
    var stop = 0, next = -1;
    if (dir > 0) { stop = line.length; next = 0; }
    var start = stop, end = stop;
    // Find bounds of next one.
    outer: for (; pos != stop; pos += dir) {
      for (var i = 0; i < regexps.length; ++i) {
        if (regexps[i].test(line.charAt(pos + next))) {
          start = pos;
          for (; pos != stop; pos += dir) {
            if (!regexps[i].test(line.charAt(pos + next))) break;
          }
          end = pos;
          break outer;
        }
      }
    }
    return {from: Math.min(start, end), to: Math.max(start, end)};
  }
  function moveToWord(cm, regexps, dir, where) {
    var cur = cm.getCursor(), ch = cur.ch, line = cm.getLine(cur.line), word;
    while (true) {
      word = findWord(line, ch, dir, regexps);
      ch = word[where == "end" ? "to" : "from"];
      if (ch == cur.ch && word.from != word.to) ch = word[dir < 0 ? "from" : "to"];
      else break;
    }
    cm.setCursor(cur.line, word[where == "end" ? "to" : "from"], true);
  }

  var map = CodeMirror.keyMap.vim = {
    "0": function(cm) {count.length > 0 ? pushCountDigit("0")(cm) : CodeMirror.commands.goLineStart(cm);},
    "I": function(cm) {popCount(); cm.setOption("keyMap", "vim-insert");},
    "G": function(cm) {cm.setOption("keyMap", "vim-prefix-g");},
    catchall: function(cm) {/*ignore*/}
  };
  // Add bindings for number keys
  for (var i = 1; i < 10; ++i) map[i] = pushCountDigit(i);
  // Add bindings that are influenced by number keys
  iterObj({"H": "goColumnLeft", "L": "goColumnRight", "J": "goLineDown", "K": "goLineUp",
		       "Left": "goColumnLeft", "Right": "goColumnRight", "Down": "goLineDown", "Up": "goLineUp",
           "Backspace": "goCharLeft", "Space": "goCharRight",
           "B": function(cm) {moveToWord(cm, word, -1, "end");},
           "E": function(cm) {moveToWord(cm, word, 1, "end");},
           "W": function(cm) {moveToWord(cm, word, 1, "start");},
           "Shift-B": function(cm) {moveToWord(cm, bigWord, -1, "end");},
           "Shift-E": function(cm) {moveToWord(cm, bigWord, 1, "end");},
           "Shift-W": function(cm) {moveToWord(cm, bigWord, 1, "start");},
           "U": "undo", "Ctrl-R": "redo", "Shift-4": "goLineEnd"},
          function(key, cmd) { map[key] = countTimes(cmd); });

  CodeMirror.keyMap["vim-prefix-g"] = {
    "E": countTimes(function(cm) { moveToWord(cm, word, -1, "start");}),
    "Shift-E": countTimes(function(cm) { moveToWord(cm, bigWord, -1, "start");}),
    auto: "vim", catchall: function(cm) {/*ignore*/}
  };

  CodeMirror.keyMap["vim-insert"] = {
    "Esc": function(cm) {cm.setOption("keyMap", "vim");},
    fallthrough: ["default"]
  };
})();
