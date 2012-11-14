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
// ce, cb
// cc
// S, C TODO
// cf<char>, cF<char>, ct<char>, cT<char>
//
// Deleting text:
// x, X
// J
// dd, D
// de, db
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
  var sdir = "f";
  var buf = "";
  var mark = {};
  var repeatCount = 0;
  function isLine(cm, line) { return line >= 0 && line < cm.lineCount(); }
  function emptyBuffer() { buf = ""; }
  function pushInBuffer(str) { buf += str; }
  function pushRepeatCountDigit(digit) {return function(cm) {repeatCount = (repeatCount * 10) + digit}; }
  function getCountOrOne() {
    var i = repeatCount;
    return i || 1;
  }
  function clearCount() {
    repeatCount = 0;
  }
  function iterTimes(func) {
    for (var i = 0, c = getCountOrOne(); i < c; ++i) func(i, i == c - 1);
    clearCount();
  }
  function countTimes(func) {
    if (typeof func == "string") func = CodeMirror.commands[func];
    return function(cm) { iterTimes(function (i, last) { func(cm, i, last); }); };
  }

  function iterObj(o, f) {
    for (var prop in o) if (o.hasOwnProperty(prop)) f(prop, o[prop]);
  }
  function iterList(l, f) {
    for (var i = 0; i < l.length; ++i) f(l[i]);
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
  // Finds a word on the given line, and continue searching the next line if it can't find one.
  function findWord(cm, lineNum, pos, dir, regexps) {
    var line = cm.getLine(lineNum);
    while (true) {
      var stop = (dir > 0) ? line.length : -1;
      var wordStart = stop, wordEnd = stop;
      // Find bounds of next word.
      for (; pos != stop; pos += dir) {
        for (var i = 0; i < regexps.length; ++i) {
          if (regexps[i].test(line.charAt(pos))) {
            wordStart = pos;
            // Advance to end of word.
            for (; pos != stop && regexps[i].test(line.charAt(pos)); pos += dir) {}
            wordEnd = (dir > 0) ? pos : pos + 1;
            return {
                from: Math.min(wordStart, wordEnd),
                to: Math.max(wordStart, wordEnd),
                line: lineNum};
          }
        }
      }
      // Advance to next/prev line.
      lineNum += dir;
      if (!isLine(cm, lineNum)) return null;
      line = cm.getLine(lineNum);
      pos = (dir > 0) ? 0 : line.length;
    }
  }
  /**
   * @param {boolean} cm CodeMirror object.
   * @param {regexp} regexps Regular expressions for word characters.
   * @param {number} dir Direction, +/- 1.
   * @param {number} times Number of times to advance word.
   * @param {string} where Go to "start" or "end" of word, 'e' vs 'w'.
   * @param {boolean} yank Whether we are finding words to yank. If true,
   *     do not go to the next line to look for the last word. This is to
   *     prevent deleting new line on 'dw' at the end of a line.
   */
  function moveToWord(cm, regexps, dir, times, where, yank) {
    var cur = cm.getCursor();
    if (yank) {
      where = 'start';
    }
    for (var i = 0; i < times; i++) {
      var startCh = cur.ch, startLine = cur.line, word;
      while (true) {
        // Search and advance.
        word = findWord(cm, cur.line, cur.ch, dir, regexps);
        if (word) {
          if (yank && times == 1 && dir == 1 && cur.line != word.line) {
            // Stop at end of line of last word. Don't want to delete line return
            // for dw if the last deleted word is at the end of a line.
            cur.ch = cm.getLine(cur.line).length;
            break;
          } else {
            // Move to the word we just found. If by moving to the word we end up
            // in the same spot, then move an extra character and search again.
            cur.line = word.line;
            if (dir > 0 && where == 'end') {
              // 'e'
              if (startCh != word.to - 1 || startLine != word.line) {
                cur.ch = word.to - 1;
                break;
              } else {
                cur.ch = word.to;
              }
            } else if (dir > 0 && where == 'start') {
              // 'w'
              if (startCh != word.from || startLine != word.line) {
                cur.ch = word.from;
                break;
              } else {
                cur.ch = word.to;
              }
            } else if (dir < 0 && where == 'end') {
              // 'ge'
              if (startCh != word.to || startLine != word.line) {
                cur.ch = word.to;
                break;
              } else {
                cur.ch = word.from - 1;
              }
            } else if (dir < 0 && where == 'start') {
              // 'b'
              if (startCh != word.from || startLine != word.line) {
                cur.ch = word.from;
                break;
              } else {
                cur.ch = word.from - 1;
              }
            }
          }
        } else {
          // No more words to be found. Move to end of document.
          for (; isLine(cm, cur.line + dir); cur.line += dir) {}
          cur.ch = (dir > 0) ? cm.getLine(cur.line).length : 0;
          break;
        }
      }
    }
    if (where == 'end' && yank) {
      // Include the last character of the word for actions.
      cur.ch++;
    }
    return cur;
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
      pushInBuffer("\n" + cm.getLine(start));
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
      pushInBuffer("\n" + cm.getLine(c));
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
    clearCount();
    cm.setOption("keyMap", "vim-insert");
  }

  function dialog(cm, text, shortText, f) {
    if (cm.openDialog) cm.openDialog(text, f);
    else f(prompt(shortText, ""));
  }
  function showAlert(cm, text) {
    var esc = text.replace(/[<&]/, function(ch) { return ch == "<" ? "&lt;" : "&amp;"; });
    if (cm.openDialog) cm.openDialog(esc + " <button type=button>OK</button>");
    else alert(text);
  }

  // main keymap
  var map = CodeMirror.keyMap.vim = {
    // Pipe (|); TODO: should be *screen* chars, so need a util function to turn tabs into spaces?
    "'|'": function(cm) {
      cm.setCursor(cm.getCursor().line, getCountOrOne() - 1, true);
      clearCount();
    },
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
      var cursor = cm.getCursor();
      var lineN = cursor.line;
      var line = cm.getLine(lineN);
      cm.setLine(lineN, line.slice(0, cursor.ch));

      emptyBuffer();
      pushInBuffer(line.slice(cursor.ch));

      if (repeatCount > 1) {
        // we've already done it once
        --repeatCount;
        // the lines dissapear (ie, cursor stays on the same lineN),
        // so only incremenet once
        ++lineN;

        iterTimes(function() {
          pushInBuffer(cm.getLine(lineN));
          cm.removeLine(lineN);
        });
      }
    },

    "S": function (cm) {
      countTimes(function (_cm) {
        CodeMirror.commands.delCharRight(_cm);
      })(cm);
      enterInsertMode(cm);
    },
    "M": function(cm) {cm.setOption("keyMap", "vim-prefix-m"); mark = {};},
    "Y": function(cm) {cm.setOption("keyMap", "vim-prefix-y"); emptyBuffer();},
    "Shift-Y": function(cm) {
      emptyBuffer();
      iterTimes(function(i) { pushInBuffer("\n" + cm.getLine(cm.getCursor().line + i)); });
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
      (repeatCount == 0) ? cm.setCursor(cm.lineCount()) : cm.setCursor(repeatCount - 1);
      clearCount();
      CodeMirror.commands.goLineStart(cm);
    },
    "':'": function(cm) {
      var exModeDialog = ': <input type="text" style="width: 90%"/>';
      dialog(cm, exModeDialog, ':', function(command) {
        if (command.match(/^\d+$/)) {
          cm.setCursor(command - 1, cm.getCursor().ch);
        } else {
          showAlert(cm, "Bad command: " + command);
        }
      });
    },
    nofallthrough: true, style: "fat-cursor"
  };

  // standard mode switching
  iterList(["d", "t", "T", "f", "F", "c", "r"], function (ch) {
    CodeMirror.keyMap.vim[toCombo(ch)] = function (cm) {
      cm.setOption("keyMap", "vim-prefix-" + ch);
      emptyBuffer();
    };
  });

  // main num keymap
  // Add bindings that are influenced by number keys
  iterObj({
    "X": function(cm) {CodeMirror.commands.delCharRight(cm);},
    "P": function(cm) {
      var cur = cm.getCursor().line;
      if (buf!= "") {
        if (buf[0] == "\n") CodeMirror.commands.goLineEnd(cm);
        cm.replaceRange(buf, cm.getCursor());
      }
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
          nofallthrough: true,
          style: "fat-cursor"
        };
      });

  CodeMirror.keyMap["vim-prefix-g"] = {
    "E": countTimes(function(cm) { cm.setCursor(moveToWord(cm, word, -1, 1, "end"));}),
    "Shift-E": countTimes(function(cm) { cm.setCursor(moveToWord(cm, bigWord, -1, 1, "end"));}),
    "G": function (cm) {
      cm.setCursor({line: repeatCount - 1, ch: cm.getCursor().ch});
      clearCount();
    },
    auto: "vim", nofallthrough: true, style: "fat-cursor"
  };

  CodeMirror.keyMap["vim-prefix-d"] = {
    "D": countTimes(function(cm) {
      pushInBuffer("\n" + cm.getLine(cm.getCursor().line));
      cm.removeLine(cm.getCursor().line);
      cm.setOption("keyMap", "vim");
    }),
    "'": function(cm) {
      cm.setOption("keyMap", "vim-prefix-d'");
      emptyBuffer();
    },
    "B": function(cm) {
      var cur = cm.getCursor();
      var line = cm.getLine(cur.line);
      var index = line.lastIndexOf(" ", cur.ch);

      pushInBuffer(line.substring(index, cur.ch));
      cm.replaceRange("", {line: cur.line, ch: index}, cur);
      cm.setOption("keyMap", "vim");
    },
    nofallthrough: true, style: "fat-cursor"
  };

  CodeMirror.keyMap["vim-prefix-c"] = {
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
    nofallthrough: true, style: "fat-cursor"
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
      delTillMark(cm, m);
    };
    CodeMirror.keyMap["vim-prefix-y'"][m] = function(cm) {
      yankTillMark(cm, m);
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
  }
  for (var i = 65; i < 65 + 26; i++) { // uppercase alphabet char codes
    var ch = String.fromCharCode(i);
    setupPrefixBindingForKey(toCombo(ch));
    setupPrefixBindingForKey(toCombo(ch.toLowerCase()));
  }
  for (var i = 0; i < SPECIAL_SYMBOLS.length; ++i) {
    setupPrefixBindingForKey(toCombo(SPECIAL_SYMBOLS.charAt(i)));
  }
  setupPrefixBindingForKey("Space");

  CodeMirror.keyMap["vim-prefix-y"] = {
    "Y": countTimes(function(cm, i, last) {
      pushInBuffer("\n" + cm.getLine(cm.getCursor().line + i));
      cm.setOption("keyMap", "vim");
    }),
    "'": function(cm) {cm.setOption("keyMap", "vim-prefix-y'"); emptyBuffer();},
    nofallthrough: true, style: "fat-cursor"
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

  function findMatchedSymbol(cm, cur, symb) {
    var line = cur.line;
    var symb = symb ? symb : cm.getLine(line)[cur.ch];

    // Are we at the opening or closing char
    var forwards = ['(', '[', '{'].indexOf(symb) != -1;

    var reverseSymb = (function(sym) {
      switch (sym) {
        case '(' : return ')';
        case '[' : return ']';
        case '{' : return '}';
        case ')' : return '(';
        case ']' : return '[';
        case '}' : return '{';
        default : return null;
      }
    })(symb);

    // Couldn't find a matching symbol, abort
    if (reverseSymb == null) return cur;

    // Tracking our imbalance in open/closing symbols. An opening symbol wii be
    // the first thing we pick up if moving forward, this isn't true moving backwards
    var disBal = forwards ? 0 : 1;

    while (true) {
      if (line == cur.line) {
        // First pass, do some special stuff
        var currLine =  forwards ? cm.getLine(line).substr(cur.ch).split('') : cm.getLine(line).substr(0,cur.ch).split('').reverse();
      } else {
        var currLine =  forwards ? cm.getLine(line).split('') : cm.getLine(line).split('').reverse();
      }

      for (var index = 0;  index < currLine.length; index++) {
        if (currLine[index] == symb) disBal++;
        else if (currLine[index] == reverseSymb) disBal--;

        if (disBal == 0) {
          if (forwards && cur.line == line) return {line: line, ch: index + cur.ch};
          else if (forwards) return {line: line, ch: index};
          else return {line: line, ch: currLine.length - index - 1 };
        }
      }

      if (forwards) line++;
      else line--;
    }
  }

  function selectCompanionObject(cm, revSymb, inclusive) {
    var cur = cm.getCursor();

    var end = findMatchedSymbol(cm, cur, revSymb);
    var start = findMatchedSymbol(cm, end);
    start.ch += inclusive ? 1 : 0;
    end.ch += inclusive ? 0 : 1;

    return {start: start, end: end};
  }

  // takes in a symbol and a cursor and tries to simulate text objects that have
  // identical opening and closing symbols
  // TODO support across multiple lines
  function findBeginningAndEnd(cm, symb, inclusive) {
    var cur = cm.getCursor();
    var line = cm.getLine(cur.line);
    var chars = line.split('');
    var start = undefined;
    var end = undefined;
    var firstIndex = chars.indexOf(symb);

    // the decision tree is to always look backwards for the beginning first,
    // but if the cursor is in front of the first instance of the symb,
    // then move the cursor forward
    if (cur.ch < firstIndex) {
      cur.ch = firstIndex;
      cm.setCursor(cur.line, firstIndex+1);
    }
    // otherwise if the cursor is currently on the closing symbol
    else if (firstIndex < cur.ch && chars[cur.ch] == symb) {
      end = cur.ch; // assign end to the current cursor
      --cur.ch; // make sure to look backwards
    }

    // if we're currently on the symbol, we've got a start
    if (chars[cur.ch] == symb && end == null)
      start = cur.ch + 1; // assign start to ahead of the cursor
    else {
      // go backwards to find the start
      for (var i = cur.ch; i > -1 && start == null; i--)
        if (chars[i] == symb) start = i + 1;
    }

    // look forwards for the end symbol
    if (start != null && end == null) {
      for (var i = start, len = chars.length; i < len && end == null; i++) {
        if (chars[i] == symb) end = i;
      }
    }

    // nothing found
    // FIXME still enters insert mode
    if (start == null || end == null) return {
      start: cur, end: cur  
    };

    // include the symbols
    if (inclusive) {
      --start; ++end;
    }

    return {
      start: {line: cur.line, ch: start},
      end: {line: cur.line, ch: end}
    };
  }

  function offsetCursor(cm, line, ch) {
    var cur = cm.getCursor(); return {line: cur.line + line, ch: cur.ch + ch};
  }

  // These are the motion commands we use for navigation and selection with
  // certain other commands. All should return a cursor object.
  var motions = {
    "J": function(cm, times) { return offsetCursor(cm, times, 0); },
    "Down": function(cm, times) { return offsetCursor(cm, times, 0); },
    "K": function(cm, times) { return offsetCursor(cm, -times, 0); },
    "Up": function(cm, times) { return offsetCursor(cm, -times, 0); },
    "L": function(cm, times) { return offsetCursor(cm, 0, times); },
    "Right": function(cm, times) { return offsetCursor(cm, 0, times); },
    "Space": function(cm, times) { return offsetCursor(cm, 0, times); },
    "H": function(cm, times) { return offsetCursor(cm, 0, -times); },
    "Left": function(cm, times) { return offsetCursor(cm, 0, -times); },
    "Backspace": function(cm, times) { return offsetCursor(cm, 0, -times); },
    "B": function(cm, times, yank) { return moveToWord(cm, word, -1, times, 'start', yank); },
    "Shift-B": function(cm, times, yank) { return moveToWord(cm, bigWord, -1, times, 'start', yank); },
    "E": function(cm, times, yank) { return moveToWord(cm, word, 1, times, 'end', yank); },
    "Shift-E": function(cm, times, yank) { return moveToWord(cm, bigWord, 1, times, 'end', yank); },
    "W": function(cm, times, yank) { return moveToWord(cm, word, 1, times, 'start', yank); },
    "Shift-W": function(cm, times, yank) { return moveToWord(cm, bigWord, 1, times, 'start', yank); },
    "'^'": function(cm, times) {
      var cur = cm.getCursor(), line = cm.getLine(cur.line).split('');
      for (var i = 0; i < line.length; i++) {
        if (line[i].match(/[^\s]/)) return {line: cur.line, ch: index};
      }
      return cur;
    },
    "'$'": function(cm) {
      var cur = cm.getCursor(), ch = cm.getLine(cur.line).length;
      return {line: cur.line, ch: ch};
    },
    "'%'": function(cm) { return findMatchedSymbol(cm, cm.getCursor()); },
    "Esc" : function(cm) { cm.setOption("keyMap", "vim"); repeatCount = 0; return cm.getCursor(); }
  };

  // Map our movement actions each operator and non-operational movement
  iterObj(motions, function(key, motion) {
    CodeMirror.keyMap['vim-prefix-d'][key] = function(cm) {
      // Get our selected range
      var start = cm.getCursor();
      var end = motion(cm, repeatCount ? repeatCount : 1, true);

      // Set swap var if range is of negative length
      if ((start.line > end.line) || (start.line == end.line && start.ch > end.ch)) var swap = true;

      // Take action, switching start and end if swap var is set
      pushInBuffer(cm.getRange(swap ? end : start, swap ? start : end));
      cm.replaceRange("", swap ? end : start, swap ? start : end);

      // And clean up
      repeatCount = 0;
      cm.setOption("keyMap", "vim");
    };

    CodeMirror.keyMap['vim-prefix-c'][key] = function(cm) {
      var start = cm.getCursor();
      var end = motion(cm, repeatCount ? repeatCount : 1, true);

      if ((start.line > end.line) || (start.line == end.line && start.ch > end.ch)) var swap = true;
      pushInBuffer(cm.getRange(swap ? end : start, swap ? start : end));
      cm.replaceRange("", swap ? end : start, swap ? start : end);

      repeatCount = 0;
      cm.setOption('keyMap', 'vim-insert');
    };

    CodeMirror.keyMap['vim-prefix-y'][key] = function(cm) {
      var start = cm.getCursor();
      var end = motion(cm, repeatCount ? repeatCount : 1, true);

      if ((start.line > end.line) || (start.line == end.line && start.ch > end.ch)) var swap = true;
      pushInBuffer(cm.getRange(swap ? end : start, swap ? start : end));

      repeatCount = 0;
      cm.setOption("keyMap", "vim");
    };

    CodeMirror.keyMap['vim'][key] = function(cm) {
      var cur = motion(cm, repeatCount ? repeatCount : 1);
      cm.setCursor(cur.line, cur.ch);

      repeatCount = 0;
    };
  });

  function addCountBindings(keyMapName) {
    // Add bindings for number keys
    keyMap = CodeMirror.keyMap[keyMapName];
    keyMap["0"] = function(cm) {
      if (repeatCount > 0) {
        pushRepeatCountDigit(0)(cm);
      } else {
        CodeMirror.commands.goLineStart(cm);
      }
    };
    for (var i = 1; i < 10; ++i) {
      keyMap[i] = pushRepeatCountDigit(i);
    }
  }
  addCountBindings('vim');
  addCountBindings('vim-prefix-d');
  addCountBindings('vim-prefix-y');
  addCountBindings('vim-prefix-c');

  // Create our keymaps for each operator and make xa and xi where x is an operator
  // change to the corrosponding keymap
  var operators = ['d', 'y', 'c'];
  iterList(operators, function(key, index, array) {
    CodeMirror.keyMap['vim-prefix-'+key+'a'] = {
      auto: 'vim', nofallthrough: true, style: "fat-cursor"
    };
    CodeMirror.keyMap['vim-prefix-'+key+'i'] = {
      auto: 'vim', nofallthrough: true, style: "fat-cursor"
    };

    CodeMirror.keyMap['vim-prefix-'+key]['A'] = function(cm) {
      repeatCount = 0;
      cm.setOption('keyMap', 'vim-prefix-' + key + 'a');
    };

    CodeMirror.keyMap['vim-prefix-'+key]['I'] = function(cm) {
      repeatCount = 0;
      cm.setOption('keyMap', 'vim-prefix-' + key + 'i');
    };
  });

  function regexLastIndexOf(string, pattern, startIndex) {
    for (var i = startIndex == null ? string.length : startIndex; i >= 0; --i)
      if (pattern.test(string.charAt(i))) return i;
    return -1;
  }

  // Create our text object functions. They work similar to motions but they
  // return a start cursor as well
  var textObjectList = ['W', 'Shift-[', 'Shift-9', '[', "'", "Shift-'"];
  var textObjects = {
    'W': function(cm, inclusive) {
      var cur = cm.getCursor();
      var line = cm.getLine(cur.line);

      var line_to_char = new String(line.substring(0, cur.ch));
      var start = regexLastIndexOf(line_to_char, /[^a-zA-Z0-9]/) + 1;
      var end = motions["E"](cm, 1) ;

      end.ch += inclusive ? 1 : 0 ;
      return {start: {line: cur.line, ch: start}, end: end };
    },
    'Shift-[': function(cm, inclusive) { return selectCompanionObject(cm, '}', inclusive); },
    'Shift-9': function(cm, inclusive) { return selectCompanionObject(cm, ')', inclusive); },
    '[': function(cm, inclusive) { return selectCompanionObject(cm, ']', inclusive); },
    "'": function(cm, inclusive) { return findBeginningAndEnd(cm, "'", inclusive); },
    "Shift-'": function(cm, inclusive) { return findBeginningAndEnd(cm, '"', inclusive); }
  };

  // One function to handle all operation upon text objects. Kinda funky but it works
  // better than rewriting this code six times
  function textObjectManipulation(cm, object, remove, insert, inclusive) {
    // Object is the text object, delete object if remove is true, enter insert
    // mode if insert is true, inclusive is the difference between a and i
    var tmp = textObjects[object](cm, inclusive);
    var start = tmp.start;
    var end = tmp.end;

    if ((start.line > end.line) || (start.line == end.line && start.ch > end.ch)) var swap = true ;

    pushInBuffer(cm.getRange(swap ? end : start, swap ? start : end));
    if (remove) cm.replaceRange("", swap ? end : start, swap ? start : end);
    if (insert) cm.setOption('keyMap', 'vim-insert');
  }

  // And finally build the keymaps up from the text objects
  for (var i = 0; i < textObjectList.length; ++i) {
    var object = textObjectList[i];
    (function(object) {
      CodeMirror.keyMap['vim-prefix-di'][object] = function(cm) { textObjectManipulation(cm, object, true, false, false); };
      CodeMirror.keyMap['vim-prefix-da'][object] = function(cm) { textObjectManipulation(cm, object, true, false, true); };
      CodeMirror.keyMap['vim-prefix-yi'][object] = function(cm) { textObjectManipulation(cm, object, false, false, false); };
      CodeMirror.keyMap['vim-prefix-ya'][object] = function(cm) { textObjectManipulation(cm, object, false, false, true); };
      CodeMirror.keyMap['vim-prefix-ci'][object] = function(cm) { textObjectManipulation(cm, object, true, true, false); };
      CodeMirror.keyMap['vim-prefix-ca'][object] = function(cm) { textObjectManipulation(cm, object, true, true, true); };
    })(object)
  }
})();
