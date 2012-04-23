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
// gg TODO
// f<char>, F<char>, t<char>, T<char> TODO
// Ctrl-O, Ctrl-I TODO
// /, ?, n, N TODO (does not work)
// #, * TODO
//
// Entering insert mode:
// i, I, a, A, o, O
// s TODO
// ce, cb TODO
// cc, S, C TODO
// cf<char>, cF<char>, ct<char>, cT<char> TODO
//
// Deleting text:
// x, X 
// J
// dd, D FIXME - D does the wrong thing
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


// TODO:
//
// Design:
//  - different cursor for different modes
//  - status bar
// 
// Overall:
//  - code vim mode for CodeMirror in itself

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
    function iterList(l, f) {
        for (var i in l) f(l[i]);
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
        var i = mark[cHar];
        if (i === undefined) {
            console.log('Mark not set'); // TODO - show in status bar
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
            console.log('Mark not set'); // TODO - show in status bar
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
    
    function charIdxInLine(cm, cHar, inclusive, forward) {
        // Search for cHar in line. 
        // If inclusive = true, include it too.
        // If forward = true, search forward, else search backwards.
        // If char is not found on this line, do nothing
        var cur = cm.getCursor(), line = cm.getLine(cur.line), ch, idx;
        if (cHar.slice(0, 6) == 'Shift-') {
            ch = cHar.slice(0, 1);
        } else {
            ch = cHar.toLowerCase();
            if (ch == 'space') {
                ch = ' ';
            }
        }
        if (forward) {
            idx = line.indexOf(ch, cur.ch + 1); 
            if (idx != -1 && inclusive) idx += 1;
        } else {
            idx = line.lastIndexOf(ch, cur.ch);
            if (idx != -1 && !inclusive) idx += 1;
        }
        return idx;
    }

    function moveTillChar(cm, cHar, inclusive, forward) {
        // Move to cHar in line, as found by charIdxInLine. 
        var idx = charIdxInLine(cm, cHar, inclusive, forward);
    }

    function delTillChar(cm, cHar, inclusive, forward) {
        // delete text in this line, untill cHar is met. 
        // If inclusive = true, delete it too.
        // If forward = true, delete forward, else delete backwards.
        // If char is not found on this line, do nothing
        var idx = charIdxInLine(cm, cHar, inclusive, forward);
        var cur = cm.getCursor();
        if (idx !== -1) {
            if (forward) {
                cm.replaceRange('', {line: cur.line, ch: cur.ch}, {line: cur.line, ch: idx});
            } else {
                cm.replaceRange('', {line: cur.line, ch: idx}, {line: cur.line, ch: cur.ch});
            }
        }
    }

    var map = CodeMirror.keyMap.vim = {
        "0": function(cm) {
            count.length > 0 ? pushCountDigit("0")(cm) : CodeMirror.commands.goLineStart(cm);
        },
        // Pipe (|); TODO: should be *screen* chars, so need a util function to turn tabs into spaces?
        "'|'": function(cm) {
            cm.setCursor(cm.getCursor().line, popCount() - 1, true);
        },
        "'^'": function(cm) {
            popCount();
            goLineStartText(cm);
        },
        "A": function(cm) {
            popCount(); 
            cm.setCursor(cm.getCursor().line, cm.getCursor().ch+1, true);
            cm.setOption("keyMap", "vim-insert");
            editCursor("vim-insert");
        },
        "Shift-A": function(cm) {
            popCount();
            CodeMirror.commands.goLineEnd(cm);
            cm.setOption("keyMap", "vim-insert");
            editCursor("vim-insert");
        },
        "I": function(cm) {
            popCount();
            cm.setOption("keyMap", "vim-insert");
            editCursor("vim-insert");
        },
        "Shift-I": function(cm) {
            popCount();
            goLineStartText(cm);
            cm.setOption("keyMap", "vim-insert");
            editCursor("vim-insert");
        },
        "O": function(cm) {
            popCount();
            CodeMirror.commands.goLineEnd(cm);
            CodeMirror.commands.newlineAndIndent(cm);
            cm.setOption("keyMap", "vim-insert");
            editCursor("vim-insert");
        },
        "Shift-O": function(cm) {
            popCount();
            CodeMirror.commands.goLineStart(cm);
            cm.replaceSelection("\n", "start");
            cm.indentLine(cm.getCursor().line);
            cm.setOption("keyMap", "vim-insert");
            editCursor("vim-insert");
        },
        "G": function(cm) {
            cm.setOption("keyMap", "vim-prefix-g");
        },
        "D": function(cm) {
            cm.setOption("keyMap", "vim-prefix-d");
            emptyBuffer();
        },
        "T": function(cm) {
            cm.setOption("keyMap", "vim-prefix-t");
            emptyBuffer();
        },
        "Shift-T": function(cm) {
            cm.setOption("keyMap", "vim-prefix-T");
            emptyBuffer();
        },
        "F": function(cm) {
            cm.setOption("keyMap", "vim-prefix-f");
            emptyBuffer();
        },
        "Shift-F": function(cm) {
            cm.setOption("keyMap", "vim-prefix-F");
            emptyBuffer();
        },
        "Shift-D": function(cm) {
            emptyBuffer();
            mark["Shift-D"] = cm.getCursor(false).line;
            cm.setCursor(cm.getCursor(true).line);
            delTillMark(cm,"Shift-D"); mark = [];
        },
        "M": function(cm) {
            cm.setOption("keyMap", "vim-prefix-m");
            mark = [];
        },
        "Y": function(cm) {
            cm.setOption("keyMap", "vim-prefix-y");
            emptyBuffer();
            yank = 0;
        },
        "Shift-Y": function(cm) {
            emptyBuffer();
            mark["Shift-D"] = cm.getCursor(false).line;
            cm.setCursor(cm.getCursor(true).line);
            yankTillMark(cm,"Shift-D"); mark = [];
        },
        "/": function(cm) {
            var f = CodeMirror.commands.find;
            f && f(cm);
            sdir = "f";
        },
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
        nofallthrough: true
    };
    // Add bindings for number keys
    for (var i = 1; i < 10; ++i) map[i] = pushCountDigit(i);
    // Add bindings that are influenced by number keys
    iterObj({
        "H": "goColumnLeft", 
        "L": "goColumnRight",
        "J": "goLineDown",
        "K": "goLineUp", 
        "Left": "goColumnLeft",
        "Right": "goColumnRight",
        "Down": "goLineDown", 
        "Up": "goLineUp", 
        "Backspace": "goCharLeft",
        "Space": "goCharRight",
        "B": function(cm) {
            moveToWord(cm, word, -1, "end");
        },
        "E": function(cm) {
            moveToWord(cm, word, 1, "end");
        },
        "W": function(cm) {
            moveToWord(cm, word, 1, "start");
        },
        "Shift-B": function(cm) {
            moveToWord(cm, bigWord, -1, "end");
        },
        "Shift-E": function(cm) {
            moveToWord(cm, bigWord, 1, "end");
        },
        "Shift-W": function(cm) {
            moveToWord(cm, bigWord, 1, "start");
        },
        "X": function(cm) {
            CodeMirror.commands.delCharRight(cm);
        },
        "P": function(cm) {
            var cur = cm.getCursor().line;
            if (buf!= "") {
                CodeMirror.commands.goLineEnd(cm); 
                cm.replaceSelection(buf, "end");
            }
            cm.setCursor(cur+1);
        },
        "Shift-P": function(cm) {
            var cur = cm.getCursor().line;
            if (buf!= "") {
                CodeMirror.commands.goLineUp(cm); 
                CodeMirror.commands.goLineEnd(cm); 
                cm.replaceSelection(buf, "end");
            }
            cm.setCursor(cur+1);
        },
        "Shift-X": function(cm) {
            CodeMirror.commands.delCharLeft(cm);
        },
        "Shift-J": function(cm) {
            joinLineNext(cm);
        },
        "'~'": function(cm) {
            var cur = cm.getCursor(), cHar = cm.getRange({line: cur.line, ch: cur.ch}, {line: cur.line, ch: cur.ch+1});
            cHar = cHar != cHar.toLowerCase() ? cHar.toLowerCase() : cHar.toUpperCase();
            cm.replaceRange(cHar, {line: cur.line, ch: cur.ch}, {line: cur.line, ch: cur.ch+1});
            cm.setCursor(cur.line, cur.ch+1);
        },
        "Ctrl-B": function(cm) {
            CodeMirror.commands.goPageUp(cm);
        },
        "Ctrl-F": function(cm) {
            CodeMirror.commands.goPageDown(cm);
        },
        "Ctrl-P": "goLineUp", 
        "Ctrl-N": "goLineDown",
        "U": "undo", 
        "Ctrl-R": "redo", 
        "'$'": "goLineEnd"
    }, function(key, cmd) { map[key] = countTimes(cmd); });

    CodeMirror.keyMap["vim-prefix-g"] = {
        "E": countTimes(function(cm) {
            moveToWord(cm, word, -1, "start");
        }),
        "Shift-E": countTimes(function(cm) {
            moveToWord(cm, bigWord, -1, "start");
        }),
        auto: "vim", 
        nofallthrough: true
    };

    CodeMirror.keyMap["vim-prefix-m"] = {
        auto: "vim", 
        nofallthrough: true
    };

    CodeMirror.keyMap["vim-prefix-d"] = {
        "D": countTimes(function(cm) {
            pushInBuffer("\n"+cm.getLine(cm.getCursor().line));
            cm.removeLine(cm.getCursor().line);
        }),
        "E": "delWordRight",
        "B": "delWordLeft",
        "T": function(cm) {
            cm.setOption("keyMap", "vim-prefix-dt");
            emptyBuffer();
        },
        "Shift-T": function(cm) {
            cm.setOption("keyMap", "vim-prefix-dT");
            emptyBuffer();
        },
        "F": function(cm) {
            cm.setOption("keyMap", "vim-prefix-df");
            emptyBuffer();
        },
        "Shift-F": function(cm) {
            cm.setOption("keyMap", "vim-prefix-dF");
            emptyBuffer();
        },
        "'": function(cm) {
            cm.setOption("keyMap", "vim-prefix-d'");
            emptyBuffer();
        },
        auto: "vim", 
        nofallthrough: true
    };

    function initPrefixKeyMap(prefix) {
    }
    iterList([
            "vim-prefix-d'", 
            "vim-prefix-y'", 
            "vim-prefix-df",
            "vim-prefix-dF",
            "vim-prefix-dt",
            "vim-prefix-dT",
            "vim-prefix-f",
            "vim-prefix-F",
            "vim-prefix-t",
            "vim-prefix-T",
            ], 
            function (prefix) {
                CodeMirror.keyMap[prefix] = {
                    auto: "vim", 
                    nofallthrough: true
                };
            });

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
        CodeMirror.keyMap["vim-prefix-dt"][m] = function(cm) {
            delTillChar(cm, m, false, true);
        };
        CodeMirror.keyMap["vim-prefix-df"][m] = function(cm) {
            delTillChar(cm, m, true, true);
        };
        CodeMirror.keyMap["vim-prefix-dT"][m] = function(cm) {
            delTillChar(cm, m, false, false);
        };
        CodeMirror.keyMap["vim-prefix-dF"][m] = function(cm) {
            delTillChar(cm, m, true, false);
        };
    };

    // iterate through uppercase alphabet char codes
    for (var i = 65; i < 65 + 26; i++) {
        // apply for `letter` and 'Shift-' + `letter`
        for (var m = String.fromCharCode(i); m.length < 8; m = "Shift-" + m) {
            setupPrefixBindingForKey(m);
        }
    }

    CodeMirror.keyMap["vim-prefix-y"] = {
        "Y": countTimes(function(cm) { pushInBuffer("\n"+cm.getLine(cm.getCursor().line+yank)); yank++; }),
        "'": function(cm) {cm.setOption("keyMap", "vim-prefix-y'"); emptyBuffer();},
        auto: "vim", 
        nofallthrough: true
    };

    CodeMirror.keyMap["vim-insert"] = {
        // TODO: override navigation keys so that Esc will cancel automatic indentation from o, O, i_<CR>
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
