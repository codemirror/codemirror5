// Supported keybindings:
// 
// Cursor movement:
// h, j, k, l
// e, E, w, W, b, B
// Ctrl-f, Ctrl-b
// Ctrl-n, Ctrl-p
// $, ^, 0
// G
// ge, gE
// gg
// f<char>, F<char>, t<char>, T<char> 
// Ctrl-o, Ctrl-i TODO (FIXME - Ctrl-O wont work in Chrome)
// /, ?, n, N TODO (does not work)
// #, * TODO
//
// Entering insert mode:
// i, I, a, A, o, O
// s
// ce, cb (without support for number of actions like c3e - TODO)
// cc
// S, C TODO
// cf<char>, cF<char>, ct<char>, cT<char>
//
// Deleting text:
// x, X 
// J
// dd, D
// de, db (without support for number of actions like d3e - TODO)
// df<char>, dF<char>, dt<char>, dT<char> 
//
// Yanking and pasting:
// yy, Y
// p, P
// p'<char> TODO - test
// y'<char> TODO - test
// m<char> TODO - test
//
// Changing text in place:
// ~
// r<char>
//
// Visual mode:
// v, V TODO
//
// Misc:
// . TODO
//


(function() {
  var count = "";
  var sdir = "f";
  var buf = "";
  var yank = 0;
  var mark = [];
  function emptyBuffer() { buf = ""; }
  function pushInBuffer(str) { buf += str; };
  function pushCountDigit(digit) { return function(cm) {count += digit;} }
  function popCount() { var i = parseInt(count); count = ""; return i || 1; }
  function iterTimes(func) {
    for (var i = 0, c = popCount(); i < c; ++i) func(i, i == c - 1);
  }
  function countTimes(func) {
    if (typeof func == "string") func = CodeMirror.commands[func];
    return function(cm) { iterTimes(function () { func(cm); }) };
  }

  function iterObj(o, f) {
    for (var prop in o) if (o.hasOwnProperty(prop)) f(prop, o[prop]);
  }
  function iterList(l, f) {
    for (var i in l) f(l[i]);
  }
  function toLetter(ch) {
    // T -> t, Shift-T -> T, '*' -> *, "Space" -> " "
    if (ch.slice(0, 6) == "Shift-") {
      return ch.slice(0, 1);
    } else {
      if (ch == "Space") return " ";
      if (ch.length == 3 && ch[0] == "'" && ch[2] == "'") return ch[1];
      return ch.toLowerCase();
    }
  }
  var SPECIAL_SYMBOLS = "~`!@#$%^&*()_-+=[{}]\\|/?.,<>:;\"\'1234567890"; 
  function toCombo(ch) { 
    // t -> T, T -> Shift-T, * -> '*', " " -> "Space"
    if (ch == " ") return "Space";
    var specialIdx = SPECIAL_SYMBOLS.indexOf(ch);
    if (specialIdx != -1) return "'" + ch + "'";
    if (ch.toLowerCase() == ch) return ch.toUpperCase();
    return "Shift-" + ch.toUpperCase();
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
  function joinLineNext(cm) {
    var cur = cm.getCursor(), ch = cur.ch, line = cm.getLine(cur.line);
    CodeMirror.commands.goLineEnd(cm); 
    if (cur.line != cm.lineCount()) {
      CodeMirror.commands.goLineEnd(cm);
      cm.replaceSelection(" ", "end");
      CodeMirror.commands.delCharRight(cm);
    } 
  }
  function delTillMark(cm, cHar) { 
    var i = mark[cHar];
    if (i === undefined) {
      // console.log("Mark not set"); // TODO - show in status bar
      return;
    }
    var l = cm.getCursor().line, start = i > l ? l : i, end = i > l ? i : l;
    cm.setCursor(start);
    for (var c = start; c <= end; c++) {
      pushInBuffer("\n"+cm.getLine(start)); 
      cm.removeLine(start);
    }
  }
  function yankTillMark(cm, cHar) { 
    var i = mark[cHar];
    if (i === undefined) {
      // console.log("Mark not set"); // TODO - show in status bar
      return;
    }
    var l = cm.getCursor().line, start = i > l ? l : i, end = i > l ? i : l;
    for (var c = start; c <= end; c++) {
      pushInBuffer("\n"+cm.getLine(c));
    }
    cm.setCursor(start);
  }
  function goLineStartText(cm) {
    // Go to the start of the line where the text begins, or the end for whitespace-only lines
    var cur = cm.getCursor(), firstNonWS = cm.getLine(cur.line).search(/\S/);
    cm.setCursor(cur.line, firstNonWS == -1 ? line.length : firstNonWS, true);
  }

  function charIdxInLine(cm, cHar, motion_options) {
    // Search for cHar in line. 
    // motion_options: {forward, inclusive}
    // If inclusive = true, include it too.
    // If forward = true, search forward, else search backwards.
    // If char is not found on this line, do nothing
    var cur = cm.getCursor(), line = cm.getLine(cur.line), idx;
    var ch = toLetter(cHar), mo = motion_options;
    if (mo.forward) {
      idx = line.indexOf(ch, cur.ch + 1); 
      if (idx != -1 && mo.inclusive) idx += 1;
    } else {
      idx = line.lastIndexOf(ch, cur.ch);
      if (idx != -1 && !mo.inclusive) idx += 1;
    }
    return idx;
  }

  function moveTillChar(cm, cHar, motion_options) {
    // Move to cHar in line, as found by charIdxInLine. 
    var idx = charIdxInLine(cm, cHar, motion_options), cur = cm.getCursor();
    if (idx != -1) cm.setCursor({line: cur.line, ch: idx}); 
  }

  function delTillChar(cm, cHar, motion_options) {
    // delete text in this line, untill cHar is met,
    // as found by charIdxInLine.
    // If char is not found on this line, do nothing
    var idx = charIdxInLine(cm, cHar, motion_options);
    var cur = cm.getCursor();
    if (idx !== -1) {
      if (motion_options.forward) {
        cm.replaceRange("", {line: cur.line, ch: cur.ch}, {line: cur.line, ch: idx});
      } else {
        cm.replaceRange("", {line: cur.line, ch: idx}, {line: cur.line, ch: cur.ch});
      }
    }
  }

  function enterInsertMode(cm) {
    // enter insert mode: switch mode and cursor
    if (!cm) console.log("call enterInsertMode with 'cm' as an argument");
    popCount();
    cm.setOption("keyMap", "vim-insert");
  }

  // main keymap
  var map = CodeMirror.keyMap.vim = {
    // Pipe (|); TODO: should be *screen* chars, so need a util function to turn tabs into spaces?
    "'|'": function(cm) {
      cm.setCursor(cm.getCursor().line, popCount() - 1, true);
    },
    "'^'": function(cm) { popCount(); goLineStartText(cm);},
    "A": function(cm) {
      cm.setCursor(cm.getCursor().line, cm.getCursor().ch+1, true);
      enterInsertMode(cm);
    },
    "Shift-A": function(cm) { CodeMirror.commands.goLineEnd(cm); enterInsertMode(cm);},
    "I": function(cm) { enterInsertMode(cm);},
    "Shift-I": function(cm) { goLineStartText(cm); enterInsertMode(cm);},
    "O": function(cm) {
      CodeMirror.commands.goLineEnd(cm);
      CodeMirror.commands.newlineAndIndent(cm);
      enterInsertMode(cm);
    },
    "Shift-O": function(cm) {
      CodeMirror.commands.goLineStart(cm);
      cm.replaceSelection("\n", "start");
      cm.indentLine(cm.getCursor().line);
      enterInsertMode(cm);
    },
    "G": function(cm) { cm.setOption("keyMap", "vim-prefix-g");},
    "Shift-D": function(cm) {
      // commented out verions works, but I left original, cause maybe 
      // I don't know vim enouth to see what it does
      /* var cur = cm.getCursor();
      var f = {line: cur.line, ch: cur.ch}, t = {line: cur.line};
      pushInBuffer(cm.getRange(f, t));
      cm.replaceRange("", f, t);
      */
      emptyBuffer();
      mark["Shift-D"] = cm.getCursor(false).line;
      cm.setCursor(cm.getCursor(true).line);
      delTillMark(cm,"Shift-D"); mark = [];
    },

    "S": function (cm) {
      countTimes(function (_cm) {
        CodeMirror.commands.delCharRight(_cm);
      })(cm);
      enterInsertMode(cm);
    },
    "M": function(cm) {cm.setOption("keyMap", "vim-prefix-m"); mark = [];},
    "Y": function(cm) {cm.setOption("keyMap", "vim-prefix-y"); emptyBuffer(); yank = 0;},
    "Shift-Y": function(cm) {
      emptyBuffer();
      mark["Shift-D"] = cm.getCursor(false).line;
      cm.setCursor(cm.getCursor(true).line);
      yankTillMark(cm,"Shift-D"); mark = [];
    },
    "/": function(cm) {var f = CodeMirror.commands.find; f && f(cm); sdir = "f";},
    "'?'": function(cm) {
      var f = CodeMirror.commands.find;
      if (f) { f(cm); CodeMirror.commands.findPrev(cm); sdir = "r"; }
    },
    "N": function(cm) {
      var fn = CodeMirror.commands.findNext;
      if (fn) sdir != "r" ? fn(cm) : CodeMirror.commands.findPrev(cm);
    },
    "Shift-N": function(cm) {
      var fn = CodeMirror.commands.findNext;
      if (fn) sdir != "r" ? CodeMirror.commands.findPrev(cm) : fn.findNext(cm);
    },
    "Shift-G": function(cm) {
      count == "" ? cm.setCursor(cm.lineCount()) : cm.setCursor(parseInt(count)-1);
      popCount();
      CodeMirror.commands.goLineStart(cm);
    },
    "'$'": function (cm) {
      countTimes("goLineEnd")(cm);
      if (cm.getCursor().ch) CodeMirror.commands.goColumnLeft(cm);
    },
    nofallthrough: true, style: "fat-cursor"
  };

  // standard mode switching
  iterList(["d", "t", "T", "f", "F", "c", "r"],
      function (ch) {
        CodeMirror.keyMap.vim[toCombo(ch)] = function (cm) {
          cm.setOption("keyMap", "vim-prefix-" + ch);
          emptyBuffer();
        };
      });

  function addCountBindings(keyMap) {
    // Add bindings for number keys
    keyMap["0"] = function(cm) {
      count.length > 0 ? pushCountDigit("0")(cm) : CodeMirror.commands.goLineStart(cm);
    };
    for (var i = 1; i < 10; ++i) keyMap[i] = pushCountDigit(i);
  }
  addCountBindings(CodeMirror.keyMap.vim);

  // main num keymap
  // Add bindings that are influenced by number keys
  iterObj({
    "H": "goColumnLeft", "L": "goColumnRight", "J": "goLineDown",
    "K": "goLineUp", "Left": "goColumnLeft", "Right": "goColumnRight",
    "Down": "goLineDown", "Up": "goLineUp", "Backspace": "goCharLeft",
    "Space": "goCharRight",
    "B": function(cm) {moveToWord(cm, word, -1, "end");},
    "E": function(cm) {moveToWord(cm, word, 1, "end");},
    "W": function(cm) {moveToWord(cm, word, 1, "start");},
    "Shift-B": function(cm) {moveToWord(cm, bigWord, -1, "end");},
    "Shift-E": function(cm) {moveToWord(cm, bigWord, 1, "end");},
    "Shift-W": function(cm) {moveToWord(cm, bigWord, 1, "start");},
    "X": function(cm) {CodeMirror.commands.delCharRight(cm);},
    "P": function(cm) {
      var cur = cm.getCursor().line;
      if (buf!= "") {
        CodeMirror.commands.goLineEnd(cm); 
        cm.replaceSelection(buf, "end");
      }
      cm.setCursor(cur+1);
    },
    "Shift-X": function(cm) {CodeMirror.commands.delCharLeft(cm);},
    "Shift-J": function(cm) {joinLineNext(cm);},
    "Shift-P": function(cm) {
      var cur = cm.getCursor().line;
      if (buf!= "") {
        CodeMirror.commands.goLineUp(cm); 
        CodeMirror.commands.goLineEnd(cm); 
        cm.replaceSelection(buf, "end");
      }
      cm.setCursor(cur+1);
    },
    "'~'": function(cm) {
      var cur = cm.getCursor(), cHar = cm.getRange({line: cur.line, ch: cur.ch}, {line: cur.line, ch: cur.ch+1});
      cHar = cHar != cHar.toLowerCase() ? cHar.toLowerCase() : cHar.toUpperCase();
      cm.replaceRange(cHar, {line: cur.line, ch: cur.ch}, {line: cur.line, ch: cur.ch+1});
      cm.setCursor(cur.line, cur.ch+1);
    },
    "Ctrl-B": function(cm) {CodeMirror.commands.goPageUp(cm);},
    "Ctrl-F": function(cm) {CodeMirror.commands.goPageDown(cm);},
    "Ctrl-P": "goLineUp", "Ctrl-N": "goLineDown", 
    "U": "undo", "Ctrl-R": "redo"
  }, function(key, cmd) { map[key] = countTimes(cmd); });

  // empty key maps
  iterList([
      "vim-prefix-d'", 
      "vim-prefix-y'", 
      "vim-prefix-df",
      "vim-prefix-dF",
      "vim-prefix-dt",
      "vim-prefix-dT",
      "vim-prefix-c",
      "vim-prefix-cf",
      "vim-prefix-cF",
      "vim-prefix-ct",
      "vim-prefix-cT",
      "vim-prefix-",
      "vim-prefix-f",
      "vim-prefix-F",
      "vim-prefix-t",
      "vim-prefix-T",
      "vim-prefix-r",
      "vim-prefix-m"
      ], 
      function (prefix) {
        CodeMirror.keyMap[prefix] = {
          auto: "vim", 
          nofallthrough: true
        };
      });

  CodeMirror.keyMap["vim-prefix-g"] = {
    "E": countTimes(function(cm) { moveToWord(cm, word, -1, "start");}),
    "Shift-E": countTimes(function(cm) { moveToWord(cm, bigWord, -1, "start");}),
    "G": function (cm) { cm.setCursor({line: 0, ch: cm.getCursor().ch});},
    auto: "vim", nofallthrough: true, style: "fat-cursor"
  };

  CodeMirror.keyMap["vim-prefix-d"] = {
    "D": countTimes(function(cm) {
      pushInBuffer("\n"+cm.getLine(cm.getCursor().line));
      cm.removeLine(cm.getCursor().line);
    }),
    "'": function(cm) {
      cm.setOption("keyMap", "vim-prefix-d'");
      emptyBuffer();
    },
    "E": countTimes("delWordRight"),
    "B": countTimes("delWordLeft"),
    auto: "vim", nofallthrough: true, style: "fat-cursor"
  }; 
  // FIXME - does not work for bindings like "d3e"
  addCountBindings(CodeMirror.keyMap["vim-prefix-d"]);

  CodeMirror.keyMap["vim-prefix-c"] = {
    "E": function (cm) {
      countTimes("delWordRight")(cm);
      enterInsertMode(cm);
    },
    "B": function (cm) {
      countTimes("delWordLeft")(cm);
      enterInsertMode(cm);
    },
    "C": function (cm) {
      iterTimes(function (i, last) {
        CodeMirror.commands.deleteLine(cm);
        if (i) {
          CodeMirror.commands.delCharRight(cm);
          if (last) CodeMirror.commands.deleteLine(cm);
        }
      });
      enterInsertMode(cm);
    },
    auto: "vim", nofallthrough: true, style: "fat-cursor"
  };

  iterList(["vim-prefix-d", "vim-prefix-c", "vim-prefix-"], function (prefix) {
    iterList(["f", "F", "T", "t"],
      function (ch) {
        CodeMirror.keyMap[prefix][toCombo(ch)] = function (cm) {
          cm.setOption("keyMap", prefix + ch);
          emptyBuffer();
        };
      });
  });

  var MOTION_OPTIONS = {
    "t": {inclusive: false, forward: true},
    "f": {inclusive: true,  forward: true},
    "T": {inclusive: false, forward: false},
    "F": {inclusive: true,  forward: false}
  };

  function setupPrefixBindingForKey(m) {
    CodeMirror.keyMap["vim-prefix-m"][m] = function(cm) {
      mark[m] = cm.getCursor().line;
    };
    CodeMirror.keyMap["vim-prefix-d'"][m] = function(cm) {
      delTillMark(cm,m);
    };
    CodeMirror.keyMap["vim-prefix-y'"][m] = function(cm) {
      yankTillMark(cm,m);
    };
    CodeMirror.keyMap["vim-prefix-r"][m] = function (cm) {
      var cur = cm.getCursor();
      cm.replaceRange(toLetter(m), 
          {line: cur.line, ch: cur.ch},
          {line: cur.line, ch: cur.ch + 1});
      CodeMirror.commands.goColumnLeft(cm);
    };
    // all commands, related to motions till char in line
    iterObj(MOTION_OPTIONS, function (ch, options) {
      CodeMirror.keyMap["vim-prefix-" + ch][m] = function(cm) {
        moveTillChar(cm, m, options);
      };
      CodeMirror.keyMap["vim-prefix-d" + ch][m] = function(cm) {
        delTillChar(cm, m, options);
      };
      CodeMirror.keyMap["vim-prefix-c" + ch][m] = function(cm) {
        delTillChar(cm, m, options);
        enterInsertMode(cm);
      };
    });
  };
  for (var i = 65; i < 65 + 26; i++) { // uppercase alphabet char codes
    var ch = String.fromCharCode(i);
    setupPrefixBindingForKey(toCombo(ch));
    setupPrefixBindingForKey(toCombo(ch.toLowerCase()));
  }
  iterList(SPECIAL_SYMBOLS, function (ch) {
    setupPrefixBindingForKey(toCombo(ch));
  });
  setupPrefixBindingForKey("Space");

  CodeMirror.keyMap["vim-prefix-y"] = {
    "Y": countTimes(function(cm) { pushInBuffer("\n"+cm.getLine(cm.getCursor().line+yank)); yank++; }),
    "'": function(cm) {cm.setOption("keyMap", "vim-prefix-y'"); emptyBuffer();},
    auto: "vim", nofallthrough: true, style: "fat-cursor"
  };

  CodeMirror.keyMap["vim-insert"] = {
    // TODO: override navigation keys so that Esc will cancel automatic indentation from o, O, i_<CR>
    "Esc": function(cm) {
      cm.setCursor(cm.getCursor().line, cm.getCursor().ch-1, true); 
      cm.setOption("keyMap", "vim");
    },
    "Ctrl-N": "autocomplete",
    "Ctrl-P": "autocomplete",
    fallthrough: ["default"]
  };
})();
