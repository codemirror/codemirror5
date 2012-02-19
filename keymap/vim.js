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
  function joinLineNext(cm) {
    var cur = cm.getCursor(), ch = cur.ch, line = cm.getLine(cur.line);
    CodeMirror.commands.goLineEnd(cm); 
    if (cur.line != cm.lineCount()) {
      CodeMirror.commands.goLineEnd(cm);
      cm.replaceSelection(" ", "end");
      CodeMirror.commands.delCharRight(cm);
    } 
  }
  function editCursor(mode) {
    if (mode == "vim-insert") {  
      // put in your cursor css changing code
    } else if (mode == "vim") {
      // put in your cursor css changing code
    }
  }
  function delTillMark(cm, cHar) { 
    var i = mark[cHar], l = cm.getCursor().line, start = i > l ? l : i, end = i > l ? i : l;
    cm.setCursor(start);
    for (var c = start; c <= end; c++) {
      pushInBuffer("\n"+cm.getLine(start)); 
      cm.removeLine(start);
    }
  }
  function yankTillMark(cm, cHar) { 
    var i = mark[cHar], l = cm.getCursor().line, start = i > l ? l : i, end = i > l ? i : l;
    for (var c = start; c <= end; c++) {
      pushInBuffer("\n"+cm.getLine(c));
    }
    cm.setCursor(start);
  }

  var map = CodeMirror.keyMap.vim = {
    "0": function(cm) {count.length > 0 ? pushCountDigit("0")(cm) : CodeMirror.commands.goLineStart(cm);},
    "A": function(cm) {popCount(); cm.setCursor(cm.getCursor().line, cm.getCursor().ch+1, true); cm.setOption("keyMap", "vim-insert"); editCursor("vim-insert");},
    "Shift-A": function(cm) {popCount(); CodeMirror.commands.goLineEnd(cm); cm.setOption("keyMap", "vim-insert"); editCursor("vim-insert");},
    "I": function(cm) {popCount(); cm.setOption("keyMap", "vim-insert"); editCursor("vim-insert");},
    "Shift-I": function(cm) {popCount(); CodeMirror.commands.goLineStartSmart(cm); cm.setOption("keyMap", "vim-insert"); editCursor("vim-insert");},
    "O": function(cm) {popCount(); CodeMirror.commands.goLineEnd(cm); cm.replaceSelection("\n", "end"); cm.setOption("keyMap", "vim-insert"); editCursor("vim-insert");},
    "Shift-O": function(cm) {popCount(); CodeMirror.commands.goLineStart(cm); cm.replaceSelection("\n", "start"); cm.setOption("keyMap", "vim-insert"); editCursor("vim-insert");},
    "G": function(cm) {cm.setOption("keyMap", "vim-prefix-g");},
    "D": function(cm) {cm.setOption("keyMap", "vim-prefix-d"); emptyBuffer();},
    "M": function(cm) {cm.setOption("keyMap", "vim-prefix-m"); mark = [];},
    "Y": function(cm) {cm.setOption("keyMap", "vim-prefix-y"); emptyBuffer(); yank = 0;},
    "/": function(cm) {var f = CodeMirror.commands.find; f && f(cm); sdir = "f"},
    "Shift-/": function(cm) {
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
    "Shift-G": function(cm) {count == "" ? cm.setCursor(cm.lineCount()) : cm.setCursor(parseInt(count)-1); popCount(); CodeMirror.commands.goLineStart(cm);},
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
           "X": function(cm) {CodeMirror.commands.delCharRight(cm)},
           "P": function(cm) {
		  var cur = cm.getCursor().line;
		  if (buf!= "") {
                    CodeMirror.commands.goLineEnd(cm); 
		    cm.replaceSelection(buf, "end");
		  }
		  cm.setCursor(cur+1);
	        },
           "Shift-X": function(cm) {CodeMirror.commands.delCharLeft(cm)},
           "Shift-J": function(cm) {joinLineNext(cm)},
           "Shift-`": function(cm) {
                        var cur = cm.getCursor(), cHar = cm.getRange({line: cur.line, ch: cur.ch}, {line: cur.line, ch: cur.ch+1});
			cHar = cHar != cHar.toLowerCase() ? cHar.toLowerCase() : cHar.toUpperCase();
                        cm.replaceRange(cHar, {line: cur.line, ch: cur.ch}, {line: cur.line, ch: cur.ch+1});
			cm.setCursor(cur.line, cur.ch+1);
	              },
           "Ctrl-B": function(cm) {CodeMirror.commands.goPageUp(cm)},
           "Ctrl-F": function(cm) {CodeMirror.commands.goPageDown(cm)},
	   "Ctrl-P": "goLineUp", "Ctrl-N": "goLineDown",
           "U": "undo", "Ctrl-R": "redo", "Shift-4": "goLineEnd"},
          function(key, cmd) { map[key] = countTimes(cmd); });

  CodeMirror.keyMap["vim-prefix-g"] = {
    "E": countTimes(function(cm) { moveToWord(cm, word, -1, "start");}),
    "Shift-E": countTimes(function(cm) { moveToWord(cm, bigWord, -1, "start");}),
    auto: "vim", 
    catchall: function(cm) {/*ignore*/}
  };

  CodeMirror.keyMap["vim-prefix-m"] = {
    "A": function(cm) {mark["A"] = cm.getCursor().line;},
    "Shift-A": function(cm) {mark["Shift-A"] = cm.getCursor().line;},
    "B": function(cm) {mark["B"] = cm.getCursor().line;},
    "Shift-B": function(cm) {mark["Shift-B"] = cm.getCursor().line;},
    "C": function(cm) {mark["C"] = cm.getCursor().line;},
    "Shift-C": function(cm) {mark["Shift-C"] = cm.getCursor().line;},
    "D": function(cm) {mark["D"] = cm.getCursor().line;},
    "Shift-D": function(cm) {mark["Shift-D"] = cm.getCursor().line;},
    "E": function(cm) {mark["E"] = cm.getCursor().line;},
    "Shift-E": function(cm) {mark["Shift-E"] = cm.getCursor().line;},
    "F": function(cm) {mark["F"] = cm.getCursor().line;},
    "Shift-F": function(cm) {mark["Shift-F"] = cm.getCursor().line;},
    "G": function(cm) {mark["G"] = cm.getCursor().line;},
    "Shift-G": function(cm) {mark["Shift-G"] = cm.getCursor().line;},
    "H": function(cm) {mark["H"] = cm.getCursor().line;},
    "Shift-H": function(cm) {mark["Shift-H"] = cm.getCursor().line;},
    "I": function(cm) {mark["I"] = cm.getCursor().line;},
    "Shift-I": function(cm) {mark["Shift-I"] = cm.getCursor().line;},
    "J": function(cm) {mark["J"] = cm.getCursor().line;},
    "Shift-J": function(cm) {mark["Shift-J"] = cm.getCursor().line;},
    "K": function(cm) {mark["K"] = cm.getCursor().line;},
    "Shift-K": function(cm) {mark["Shift-K"] = cm.getCursor().line;},
    "L": function(cm) {mark["L"] = cm.getCursor().line;},
    "Shift-L": function(cm) {mark["Shift-L"] = cm.getCursor().line;},
    "M": function(cm) {mark["M"] = cm.getCursor().line;},
    "Shift-M": function(cm) {mark["Shift-M"] = cm.getCursor().line;},
    "N": function(cm) {mark["N"] = cm.getCursor().line;},
    "Shift-N": function(cm) {mark["Shift-N"] = cm.getCursor().line;},
    "O": function(cm) {mark["O"] = cm.getCursor().line;},
    "Shift-O": function(cm) {mark["Shift-O"] = cm.getCursor().line;},
    "P": function(cm) {mark["P"] = cm.getCursor().line;},
    "Shift-P": function(cm) {mark["Shift-P"] = cm.getCursor().line;},
    "Q": function(cm) {mark["Q"] = cm.getCursor().line;},
    "Shift-Q": function(cm) {mark["Shift-Q"] = cm.getCursor().line;},
    "R": function(cm) {mark["R"] = cm.getCursor().line;},
    "Shift-R": function(cm) {mark["Shift-R"] = cm.getCursor().line;},
    "S": function(cm) {mark["S"] = cm.getCursor().line;},
    "Shift-S": function(cm) {mark["Shift-S"] = cm.getCursor().line;},
    "T": function(cm) {mark["T"] = cm.getCursor().line;},
    "Shift-T": function(cm) {mark["Shift-T"] = cm.getCursor().line;},
    "U": function(cm) {mark["U"] = cm.getCursor().line;},
    "Shift-U": function(cm) {mark["Shift-U"] = cm.getCursor().line;},
    "V": function(cm) {mark["V"] = cm.getCursor().line;},
    "Shift-V": function(cm) {mark["Shift-V"] = cm.getCursor().line;},
    "W": function(cm) {mark["W"] = cm.getCursor().line;},
    "Shift-W": function(cm) {mark["Shift-W"] = cm.getCursor().line;},
    "X": function(cm) {mark["X"] = cm.getCursor().line;},
    "Shift-X": function(cm) {mark["Shift-X"] = cm.getCursor().line;},
    "Y": function(cm) {mark["Y"] = cm.getCursor().line;},
    "Shift-Y": function(cm) {mark["Shift-Y"] = cm.getCursor().line;},
    "Z": function(cm) {mark["Z"] = cm.getCursor().line;},
    "Shift-Z": function(cm) {mark["Shift-Z"] = cm.getCursor().line;},
    auto: "vim", 
    catchall: function(cm) {/*ignore*/}
  }
  
  CodeMirror.keyMap["vim-prefix-d"] = {
    "D": countTimes(function(cm) { pushInBuffer("\n"+cm.getLine(cm.getCursor().line)); cm.removeLine(cm.getCursor().line); }),
    "'": function(cm) {cm.setOption("keyMap", "vim-prefix-d'"); emptyBuffer();},
    auto: "vim", 
    catchall: function(cm) {/*ignore*/}
  };

  CodeMirror.keyMap["vim-prefix-d'"] = {
    "A": function(cm) {delTillMark(cm,"A");},
    "Shift-A": function(cm) {delTillMark(cm,"Shift-A");},
    "B": function(cm) {delTillMark(cm,"B");},
    "Shift-B": function(cm) {delTillMark(cm,"Shift-B");},
    "C": function(cm) {delTillMark(cm,"C");},
    "Shift-C": function(cm) {delTillMark(cm,"Shift-C");},
    "D": function(cm) {delTillMark(cm,"D");},
    "Shift-D": function(cm) {delTillMark(cm,"Shift-D");},
    "E": function(cm) {delTillMark(cm,"E");},
    "Shift-E": function(cm) {delTillMark(cm,"Shift-E");},
    "F": function(cm) {delTillMark(cm,"F");},
    "Shift-F": function(cm) {delTillMark(cm,"Shift-F");},
    "G": function(cm) {delTillMark(cm,"G");},
    "Shift-G": function(cm) {delTillMark(cm,"Shift-G");},
    "H": function(cm) {delTillMark(cm,"H");},
    "Shift-H": function(cm) {delTillMark(cm,"Shift-H");},
    "I": function(cm) {delTillMark(cm,"I");},
    "Shift-I": function(cm) {delTillMark(cm,"Shift-I");},
    "J": function(cm) {delTillMark(cm,"J");},
    "Shift-J": function(cm) {delTillMark(cm,"Shift-J");},
    "K": function(cm) {delTillMark(cm,"K");},
    "Shift-K": function(cm) {delTillMark(cm,"Shift-K");},
    "L": function(cm) {delTillMark(cm,"L");},
    "Shift-L": function(cm) {delTillMark(cm,"Shift-L");},
    "M": function(cm) {delTillMark(cm,"M");},
    "Shift-M": function(cm) {delTillMark(cm,"Shift-M");},
    "N": function(cm) {delTillMark(cm,"N");},
    "Shift-N": function(cm) {delTillMark(cm,"Shift-N");},
    "O": function(cm) {delTillMark(cm,"O");},
    "Shift-O": function(cm) {delTillMark(cm,"Shift-O");},
    "P": function(cm) {delTillMark(cm,"P");},
    "Shift-P": function(cm) {delTillMark(cm,"Shift-P");},
    "Q": function(cm) {delTillMark(cm,"Q");},
    "Shift-Q": function(cm) {delTillMark(cm,"Shift-Q");},
    "R": function(cm) {delTillMark(cm,"R");},
    "Shift-R": function(cm) {delTillMark(cm,"Shift-R");},
    "S": function(cm) {delTillMark(cm,"S");},
    "Shift-S": function(cm) {delTillMark(cm,"Shift-S");},
    "T": function(cm) {delTillMark(cm,"T");},
    "Shift-T": function(cm) {delTillMark(cm,"Shift-T");},
    "U": function(cm) {delTillMark(cm,"U");},
    "Shift-U": function(cm) {delTillMark(cm,"Shift-U");},
    "V": function(cm) {delTillMark(cm,"V");},
    "Shift-V": function(cm) {delTillMark(cm,"Shift-V");},
    "W": function(cm) {delTillMark(cm,"W");},
    "Shift-W": function(cm) {delTillMark(cm,"Shift-W");},
    "X": function(cm) {delTillMark(cm,"X");},
    "Shift-X": function(cm) {delTillMark(cm,"Shift-X");},
    "Y": function(cm) {delTillMark(cm,"Y");},
    "Shift-Y": function(cm) {delTillMark(cm,"Shift-Y");},
    "Z": function(cm) {delTillMark(cm,"Z");},
    "Shift-Z": function(cm) {delTillMark(cm,"Shift-Z");},
    auto: "vim", 
    catchall: function(cm) {/*ignore*/}
  };

  CodeMirror.keyMap["vim-prefix-y'"] = {
    "A": function(cm) {yankTillMark(cm,"A");},
    "Shift-A": function(cm) {yankTillMark(cm,"Shift-A");},
    "B": function(cm) {yankTillMark(cm,"B");},
    "Shift-B": function(cm) {yankTillMark(cm,"Shift-B");},
    "C": function(cm) {yankTillMark(cm,"C");},
    "Shift-C": function(cm) {yankTillMark(cm,"Shift-C");},
    "D": function(cm) {yankTillMark(cm,"D");},
    "Shift-D": function(cm) {yankTillMark(cm,"Shift-D");},
    "E": function(cm) {yankTillMark(cm,"E");},
    "Shift-E": function(cm) {yankTillMark(cm,"Shift-E");},
    "F": function(cm) {yankTillMark(cm,"F");},
    "Shift-F": function(cm) {yankTillMark(cm,"Shift-F");},
    "G": function(cm) {yankTillMark(cm,"G");},
    "Shift-G": function(cm) {yankTillMark(cm,"Shift-G");},
    "H": function(cm) {yankTillMark(cm,"H");},
    "Shift-H": function(cm) {yankTillMark(cm,"Shift-H");},
    "I": function(cm) {yankTillMark(cm,"I");},
    "Shift-I": function(cm) {yankTillMark(cm,"Shift-I");},
    "J": function(cm) {yankTillMark(cm,"J");},
    "Shift-J": function(cm) {yankTillMark(cm,"Shift-J");},
    "K": function(cm) {yankTillMark(cm,"K");},
    "Shift-K": function(cm) {yankTillMark(cm,"Shift-K");},
    "L": function(cm) {yankTillMark(cm,"L");},
    "Shift-L": function(cm) {yankTillMark(cm,"Shift-L");},
    "M": function(cm) {yankTillMark(cm,"M");},
    "Shift-M": function(cm) {yankTillMark(cm,"Shift-M");},
    "N": function(cm) {yankTillMark(cm,"N");},
    "Shift-N": function(cm) {yankTillMark(cm,"Shift-N");},
    "O": function(cm) {yankTillMark(cm,"O");},
    "Shift-O": function(cm) {yankTillMark(cm,"Shift-O");},
    "P": function(cm) {yankTillMark(cm,"P");},
    "Shift-P": function(cm) {yankTillMark(cm,"Shift-P");},
    "Q": function(cm) {yankTillMark(cm,"Q");},
    "Shift-Q": function(cm) {yankTillMark(cm,"Shift-Q");},
    "R": function(cm) {yankTillMark(cm,"R");},
    "Shift-R": function(cm) {yankTillMark(cm,"Shift-R");},
    "S": function(cm) {yankTillMark(cm,"S");},
    "Shift-S": function(cm) {yankTillMark(cm,"Shift-S");},
    "T": function(cm) {yankTillMark(cm,"T");},
    "Shift-T": function(cm) {yankTillMark(cm,"Shift-T");},
    "U": function(cm) {yankTillMark(cm,"U");},
    "Shift-U": function(cm) {yankTillMark(cm,"Shift-U");},
    "V": function(cm) {yankTillMark(cm,"V");},
    "Shift-V": function(cm) {yankTillMark(cm,"Shift-V");},
    "W": function(cm) {yankTillMark(cm,"W");},
    "Shift-W": function(cm) {yankTillMark(cm,"Shift-W");},
    "X": function(cm) {yankTillMark(cm,"X");},
    "Shift-X": function(cm) {yankTillMark(cm,"Shift-X");},
    "Y": function(cm) {yankTillMark(cm,"Y");},
    "Shift-Y": function(cm) {yankTillMark(cm,"Shift-Y");},
    "Z": function(cm) {yankTillMark(cm,"Z");},
    "Shift-Z": function(cm) {yankTillMark(cm,"Shift-Z");},
    auto: "vim", 
    catchall: function(cm) {/*ignore*/}
  };

  CodeMirror.keyMap["vim-prefix-y"] = {
    "Y": countTimes(function(cm) { pushInBuffer("\n"+cm.getLine(cm.getCursor().line+yank)); yank++; }),
    "'": function(cm) {cm.setOption("keyMap", "vim-prefix-y'"); emptyBuffer();},
    auto: "vim", 
    catchall: function(cm) {/*ignore*/}
  };

  CodeMirror.keyMap["vim-insert"] = {
    "Esc": function(cm) {
	     cm.setCursor(cm.getCursor().line, cm.getCursor().ch-1, true); 
	     cm.setOption("keyMap", "vim");
	     editCursor("vim");
           },
    "Ctrl-N": function(cm) {/* Code to bring up autocomplete hint */},
    "Ctrl-P": function(cm) {/* Code to bring up autocomplete hint */},
    fallthrough: ["default"]
  };
})();
