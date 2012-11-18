// Reimplementation of vim keybindings
/**
 * Supported keybindings:
 *
 * Motion:
 * h, j, k, l
 * e, E, w, W, b, B, ge, gE
 * $, ^, 0
 * gg, G
 *
 * Operator:
 * d, y
 * dd, yy
 *
 * Operator-Motion:
 * x, X, D, Y
 *
 * Action:
 * a, i, s
 * u, Ctrl-r
 *
 * Code structure:
 *  1. Default keymap
 *  2. Variable declarations and short basic helpers
 *  3. Instance (External API) implementation
 *  4. Internal state tracking objects (input state, counter) implementation
 *     and instanstiation
 *  5. Key handler (the main command dispatcher) implementation
 *  6. Motion, operator, and action implementations
 *  7. Helper functions for the key handler, motions, operators, and actions
 *
 */

(function() {
  'use strict';

  var defaultKeymap = [
    // Motions
    { keys: ['h'], type: 'motion', motion: 'moveByCharacters', motionArgs: { forward: false }},
    { keys: ['l'], type: 'motion', motion: 'moveByCharacters', motionArgs: { forward: true }},
    { keys: ['j'], type: 'motion', motion: 'moveByLines', motionArgs: { forward: true, linewise: true }},
    { keys: ['k'], type: 'motion', motion: 'moveByLines', motionArgs: { forward: false, linewise: true }},
    { keys: ['w'], type: 'motion', motion: 'moveByWords', motionArgs: { forward: true, wordEnd: false}},
    { keys: ['W'], type: 'motion', motion: 'moveByWords', motionArgs: { forward: true, wordEnd: false, bigWord: true }},
    { keys: ['e'], type: 'motion', motion: 'moveByWords', motionArgs: { forward: true, wordEnd: true}},
    { keys: ['E'], type: 'motion', motion: 'moveByWords', motionArgs: { forward: true, wordEnd: true, bigWord: true }},
    { keys: ['b'], type: 'motion', motion: 'moveByWords', motionArgs: { forward: false, wordEnd: false }},
    { keys: ['B'], type: 'motion', motion: 'moveByWords', motionArgs: { forward: false, wordEnd: false, bigWord: true }},
    { keys: ['g', 'e'], type: 'motion', motion: 'moveByWords', motionArgs: { forward: false, wordEnd: true }},
    { keys: ['g', 'E'], type: 'motion', motion: 'moveByWords', motionArgs: { forward: false, wordEnd: true, bigWord: true }},
    { keys: ['g', 'g'], type: 'motion', motion: 'moveToLineOrEdgeOfDocument', motionArgs: { forward: false, explicitRepeat: true }},
    { keys: ['G'], type: 'motion', motion: 'moveToLineOrEdgeOfDocument', motionArgs: { forward: true, explicitRepeat: true }},
    { keys: ['0'], type: 'motion', motion: 'moveToStartOfLine' },
    { keys: ["'^'"], type: 'motion', motion: 'moveToFirstNonWhiteSpaceCharacter' },
    { keys: ["'$'"], type: 'motion', motion: 'moveToEol' },
    // Operators
    { keys: ['d'], type: 'operator', operator: 'delete' },
    { keys: ['y'], type: 'operator', operator: 'yank' },
    // Operator-Motion dual commands
    { keys: ['x'], type: 'operatorMotion', operator: 'delete',
        motion: 'moveByCharacters', motionArgs: { forward: true } },
    { keys: ['X'], type: 'operatorMotion', operator: 'delete',
        motion: 'moveByCharacters', motionArgs: { forward: false } },
    { keys: ['D'], type: 'operatorMotion', operator: 'delete',
        motion: 'moveToEol' },
    { keys: ['Y'], type: 'operatorMotion', operator: 'yank',
        motion: 'moveToEol' },
    // Actions
    { keys: ['a'], type: 'action', action: 'enterInsertMode',
        motion: 'moveByCharacters', motionArgs: { forward: true, noRepeat: true } },
    { keys: ['i'], type: 'action', action: 'enterInsertMode' },
    { keys: ['s'], type: 'action', action: 'enterInsertMode',
        motion: 'moveByCharacters', motionArgs: {forward: true },
        operator: 'delete' },
    { keys: ['p'], type: 'action', action: 'paste', actionArgs: { after: true }},
    { keys: ['P'], type: 'action', action: 'paste', actionArgs: { after: false }},
    { keys: ['u'], type: 'action', action: 'undo' },
    { keys: ['Ctrl-r'], type: 'action', action: 'redo' },
  ];

  var Vim = function() {
    var alphabetRegex = /[A-Z]/;
    var numberRegex = /[\d]/;
    var whiteSpaceRegex = /\s/;
    var wordRegexp = [/\w/, /[^\w\s]/], bigWordRegexp = [/\S/];
    var inputState;
    var count;
    var registers = {};

    function isNumber(k) { return numberRegex.test(k); }
    function isAlphabet(k) { return alphabetRegex.test(k); }
    function isWhiteSpace(k) { return whiteSpaceRegex.test(k); }
    function isWhiteSpaceString(k) { return /^\s*$/.test(k); }
    function isLine(cm, line) { return line >= 0 && line < cm.lineCount(); }
    function inRangeInclusive(x, start, end) { return x >= start && x <= end; }

    var instance = {
      addKeyMap: function() {
        // Add user defined key bindings.
        // TODO: Implement this.
      },
      buildKeyMap: function() {
        // TODO: Convert keymap into dictionary format for fast lookup.
      },
      handleKey: function(cm, key) {
        if (isNumber(key) && !(key == '0' && count.get() == 0)) {
          // Increment count unless count is 0 and key is 0.
          count.pushDigit(key);
          return;
        }
        var command = keyHandler.matchCommand(key, defaultKeymap);
        if (command) {
          keyHandler.processCommand(cm, command);
        }
      },
    };

    // Represents the current input state.
    function InputState() {
      this.reset();
    }
    InputState.prototype.reset = function() {
      this.prefixRepeatDigits = [];
      this.operator = null;
      this.operatorArgs = null;
      this.motionRepeatDigits = [];
      this.motion = null;
      this.motionArgs = null;
      this.keyBuffer = []; // For matching multi-key commands.
      this.registerName = 'default';
    }
    inputState = new InputState();

    function Register() {
      // Do not create directly, use getRegister.
      this.text = '';
    }
    Register.prototype = {
      set: function(text, linewise) {
        this.text = text;
        this.linewise = !!linewise;
      }
    }
    function getRegister(name) {
      if (!registers[name]) {
        registers[name] = new Register();
      }
      return registers[name];
    }

    // Counter for keeping track of repeats.
    count = (function() {
      var value = 0;
      var explicit = false;
      return {
        get: function() { return value; },
        isExplicit: function() { return explicit; },
        pushDigit: function(n) {
          explicit = true;
          value = value * 10 + parseInt(n, 10);
        },
        clear: function() {
          explicit = false;
          value = 0;
        }
      }
    })();

    var keyHandler = {
      matchCommand: function(key, keyMap) {
        var keys = inputState.keyBuffer.concat(key);
        for (var i = 0; i < keyMap.length; i++) {
          var command = keyMap[i];
          if (arrayIsSubsetFromBeginning(keys, command.keys)) {
            if (keys.length < command.keys.length) {
              // Matches part of a multi-key command. Buffer and wait for next
              // stroke.
              inputState.keyBuffer.push(key);
              return;
            } else {
              // Matches whole comand. Return the command.
              return command;
            }
          }
        }
        // Clear the buffer since there are no partial matches.
        inputState.keyBuffer = [];
        return null;
      },
      processCommand: function(cm, command) {
        switch (command.type) {
          case 'motion':
            this.processMotion(cm, command);
            break;
          case 'operator':
            this.processOperator(cm, command);
            break;
          case 'operatorMotion':
            this.processOperatorMotion(cm, command);
            break;
          case 'action':
            this.processAction(cm, command);
            break;
          default:
            break;
        }
      },
      processMotion: function(cm, command) {
        inputState.motion = command.motion;
        inputState.motionArgs = command.motionArgs;
        this.evalInput(cm);
      },
      processOperator: function(cm, command) {
        if (inputState.operator) {
          if (inputState.operator == command.operator) {
            // Typing an operator twice like 'dd' makes the operator operate
            // linewise
            inputState.motion = 'expandToLine';
            inputState.motionArgs = { linewise: true, }
            this.evalInput(cm);
            return;
          } else {
            // 2 different operators in a row doesn't make sense.
            inputState.reset();
            count.clear();
          }
        }
        inputState.operator = command.operator;
        inputState.operatorArgs = command.operatorArgs;
      },
      processOperatorMotion: function(cm, command) {
        inputState.motion = command.motion;
        inputState.motionArgs = command.motionArgs;
        inputState.operator = command.operator;
        inputState.operatorArgs = command.operatorArgs;
        this.evalInput(cm);
      },
      processAction: function(cm, command) {
        var repeat = count.get();
        // Actions may or may not have motions and operators. Do these first.
        if (command.operator) { this.processOperator(cm, command); }
        if (command.motion) { this.processMotion(cm, command); }
        if (command.motion || command.operator) { this.evalInput(cm); }
        var actionArgs = command.actionArgs || {};
        actionArgs.repeat = repeat || 1;
        actionArgs.register = getRegister(inputState.registerName);
        actions[command.action](cm, actionArgs);
        inputState.reset();
        count.clear();
      },
      evalInput: function(cm) {
        // If the motion comand is set, execute both the operator and motion.
        // Otherwise return.
        var motion = inputState.motion;
        var motionArgs = inputState.motionArgs || {};
        var operator = inputState.operator;
        var operatorArgs = inputState.operatorArgs || {};
        var registerName = inputState.registerName;
        var curStart = cm.getCursor();
        var curEnd;
        var repeat = count.get();
        if (repeat > 0 && motionArgs.explicitRepeat) {
          motionArgs.repeatIsExplicit = true;
        } else if (motionArgs.noRepeat ||
            (!motionArgs.explicitRepeat && repeat == 0)) {
          repeat = 1;
          motionArgs.repeatIsExplicit = false;
        }
        if (!motion) { return; }
        motionArgs.repeat = repeat;
        count.clear();
        inputState.reset();
        curEnd = motions[motion](cm, motionArgs);
        if (!operator) {
          cm.setCursor(curEnd.line, curEnd.ch);
          return;
        }
        if (motionArgs.wordEnd) {
          // Move the selection end one to the right to include the last
          // character.
          if (motionArgs.forward) {
            curEnd.ch++;
          } else {
            curStart.ch++;
          }
        }
        // Swap start and end if motion was backward.
        if (curStart.line > curEnd.line ||
            (curStart.line == curEnd.line && curStart.ch > curEnd.ch)) {
          var tmp = curStart;
          curStart = curEnd;
          curEnd = tmp;
        }

        if (motionArgs.linewise) {
          // Expand selection to entire line.
          expandSelectionToLine(cm, curStart, curEnd);
        } else {
          // Clip to trailing newlines.
          clipToLine(cm, curEnd);
        }
        // TODO: Handle operators.
        operatorArgs.register = getRegister(registerName);
        // Keep track of if the operation was linewise determining how to paste
        // later.
        operatorArgs.linewise = motionArgs.linewise;
        operators[operator](cm, operatorArgs, curStart,
            curEnd);
        if (operatorArgs.enterInsertMode) {
          actions.enterInsertMode(cm);
        }
      }
    }

    /**
     * typedef {Object{line:number,ch:number}} Cursor An object containing the
     *     position of the cursor.
     */
    // All of the functions below return Cursor objects.
    var motions = {
      expandToLine: function(cm, motionArgs) {
        // Expands forward to end of line, and then to next line if repeat is > 1.
        // Does not handle backward motion!
        var cursor = cm.getCursor();
        var endLine = Math.min(cm.lineCount(),
            cursor.line + motionArgs.repeat - 1);
        return { line: endLine, ch: cm.getLine(endLine) };
      },
      moveByCharacters: function(cm, motionArgs) {
        var cursor = cm.getCursor();
        var line = cm.getLine(cursor.line);
        var repeat = motionArgs.repeat;
        if (motionArgs.forward) {
          return { line: cursor.line,
              ch: Math.min(line.length, cursor.ch + repeat) };
        } else {
          return { line: cursor.line, ch: Math.max(0, cursor.ch - repeat) };
        }
      },
      moveByLines: function(cm, motionArgs) {
        var cursor = cm.getCursor();
        var repeat = motionArgs.repeat;
        if (motionArgs.forward) {
          return { line: Math.min(cm.lineCount(), cursor.line + repeat),
              ch: cursor.ch };
        } else {
          return { line: Math.max(0, cursor.line - repeat), ch: cursor.ch };
        }
      },
      moveByWords: function(cm, motionArgs) {
        return moveToWord(cm, motionArgs.repeat, !!motionArgs.forward,
            !!motionArgs.wordEnd, !!motionArgs.bigWord);
      },
      moveToEol: function(cm) {
        var cursor = cm.getCursor();
        return { line: cursor.line, ch: cm.getLine(cursor.line).length };
      },
      moveToFirstNonWhiteSpaceCharacter: function(cm) {
        // Go to the start of the line where the text begins, or the end for
        // whitespace-only lines
        var cursor = cm.getCursor();
        var line = cm.getLine(cursor.line);
        return { line: cursor.line,
            ch: findFirstNonWhiteSpaceCharacter(cm.getLine(cursor.line)),
            user: true };
      },
      moveToStartOfLine: function(cm) {
        var cursor = cm.getCursor();
        return { line: cursor.line, ch: 0 };
      },
      moveToLineOrEdgeOfDocument: function(cm, motionArgs) {
        var lineNum = motionArgs.forward ? cm.lineCount() - 1 : 0;
        if (motionArgs.repeatIsExplicit) {
          lineNum = Math.max(0, Math.min(
                motionArgs.repeat - 1,
                cm.lineCount() - 1));
        }
        return { line: lineNum,
            ch: findFirstNonWhiteSpaceCharacter(cm.getLine(lineNum)),
            user: true };
      },
    };

    var actions = {
      enterInsertMode: function(cm) {
        cm.setOption('keyMap', 'vim-insert');
      },
      paste: function(cm, actionArgs) {
        var cur = cm.getCursor();
        for (var text = '', i = 0; i < actionArgs.repeat; i++) {
          text += actionArgs.register.text;
        }
        var curChEnd = 0;
        var linewise = actionArgs.register.linewise;
        if (linewise) {
          cur.line += actionArgs.after ? 1 : 0;
          cur.ch = 0;
          curChEnd = 0;
        } else {
          cur.ch += actionArgs.after ? 1 : 0;
          curChEnd = cur.ch;
        }
        // Set cursor in the right place to let CodeMirror handle moving it.
        cm.setCursor(cur.line, curChEnd);
        cm.replaceRange(text, cur);
        // Now fine tune the cursor to where we want it.
        if (linewise) { cm.setCursor(cm.getCursor().line - 1, 0); }
        else {
          cur = cm.getCursor();
          cm.setCursor(cur.line, cur.ch - 1);
        }
      },
      undo: function(cm, actionArgs) {
        repeatFn(cm, CodeMirror.commands.undo, actionArgs.repeat)();
      },
      redo: function(cm, actionArgs) {
        repeatFn(cm, CodeMirror.commands.redo, actionArgs.repeat)();
      },
    };

    var operators = {
      delete: function(cm, operatorArgs, curStart, curEnd) {
        operatorArgs.register.set(cm.getRange(curStart, curEnd),
            operatorArgs.linewise);
        cm.replaceRange('', curStart, curEnd);
      },
      yank: function(cm, operatorArgs, curStart, curEnd) {
        operatorArgs.register.set(cm.getRange(curStart, curEnd),
            operatorArgs.linewise);
      },
    };

    function arrayEq(a1, a2) {
      if (a1.length != a2.length) return false;
      for (var i = 0; i < a1.length; i++) {
        if (a1[i] != a2[i]) return false;
      }
      return true;
    }
    function arrayIsSubsetFromBeginning(small, big) {
      for (var i = 0; i < small.length; i++) {
        if (small[i] != big[i]) return false;
      }
      return true;
    }
    function repeatFn(cm, fn, repeat) {
      return function() {
        for (var i = 0; i < repeat; i++) fn(cm);
      }
    }

    // Remove any trailing newlines from the selection. For
    // example, with the caret at the start of the last word on the line,
    // 'dw' should word, but not the newline, while 'w' should advance the
    // caret to the first character of the next line.
    function clipToLine(cm, curEnd) {
      if (curEnd.ch == 0 ||
          isWhiteSpaceString(cm.getRange(
              {line: curEnd.line, ch: 0},
              {line: curEnd.line, ch: curEnd.ch - 1}))) {
        curEnd.line--;
        curEnd.ch = cm.getLine(curEnd.line).length;
      }
    }

    // Expand the selection to line ends.
    function expandSelectionToLine(cm, curStart, curEnd) {
      curStart.ch = 0;
      curEnd.ch = 0;
      curEnd.line++;
    }

    function findFirstNonWhiteSpaceCharacter(text) {
        var firstNonWS = text.search(/\S/);
        return firstNonWS == -1 ? text.length : firstNonWS;
    }

    /*
     * Returns the boundaries of the next word. If the cursor in the middle of the
     * word, then returns the boundaries of the current word, starting at the
     * cursor. If the cursor is at the start/end of a word, and we are going
     * forward/backward, respectively, find the boundaries of the next word.
     *
     * @param {CodeMirror} cm CodeMirror object.
     * @param {Cursor} cur The cursor position.
     * @param {boolean} forward True to search forward. False to search backward.
     * @param {boolean} bigWord True if punctuation count as part of the word.
     *     False if only [a-zA-Z0-9] characters count as part of the word.
     * @return {Object{from:number, to:number, line: number}} The boundaries of
     *     the word, or null if there are no more words.
     */
    // TODO: Treat empty lines (with no whitespace) as words.
    function findWord(cm, cur, forward, bigWord) {
      var lineNum = cur.line;
      var pos = cur.ch;
      var line = cm.getLine(lineNum);
      var dir = forward ? 1 : -1;
      var regexps = bigWord ? bigWordRegexp : wordRegexp;

      while (true) {
        var stop = (dir > 0) ? line.length : -1;
        var wordStart = stop, wordEnd = stop;
        // Find bounds of next word.
        while (pos != stop) {
          var foundWord = false;
          for (var i = 0; i < regexps.length && !foundWord; ++i) {
            if (regexps[i].test(line.charAt(pos))) {
              wordStart = pos;
              // Advance to end of word.
              for (; pos != stop && regexps[i].test(line.charAt(pos)); pos += dir) {}
              wordEnd = pos;
              foundWord = wordStart != wordEnd;
              if (wordStart == cur.ch && lineNum == cur.line
                  && wordEnd == wordStart + dir) {
                // We started at the end of a word. Find the next one.
              } else {
                return {
                    from: Math.min(wordStart, wordEnd + 1),
                    to: Math.max(wordStart, wordEnd),
                    line: lineNum};
              }
            }
          }
          if (!foundWord) {
            pos += dir;
          }
        }
        // Advance to next/prev line.
        lineNum += dir;
        if (!isLine(cm, lineNum)) return null;
        line = cm.getLine(lineNum);
        pos = (dir > 0) ? 0 : line.length;
      }
    };

    /**
     * @param {CodeMirror} cm CodeMirror object.
     * @param {int} repeat Number of words to move past.
     * @param {boolean} forward True to search forward. False to search backward.
     * @param {boolean} wordEnd True to move to end of word. False to move to
     *     beginning of word.
     * @param {boolean} bigWord True if punctuation count as part of the word.
     *     False if only alphabet characters count as part of the word.
     * @return {Cursor} The position the cursor should move to.
     */
    function moveToWord(cm, repeat, forward, wordEnd, bigWord) {
      var cur = cm.getCursor();
      for (var i = 0; i < repeat; i++) {
        var startCh = cur.ch, startLine = cur.line, word;
        var movedToNextWord = false;
        while (!movedToNextWord) {
          // Search and advance.
          word = findWord(cm, cur, forward, bigWord);
          movedToNextWord = true;
          if (word) {
            // Move to the word we just found. If by moving to the word we end up
            // in the same spot, then move an extra character and search again.
            cur.line = word.line;
            if (forward && wordEnd) {
              // 'e'
              cur.ch = word.to - 1;
            } else if (forward && !wordEnd) {
              // 'w'
              if (inRangeInclusive(cur.ch, word.from, word.to) &&
                  word.line == startLine) {
                // Still on the same word. Go to the next one.
                movedToNextWord = false;
                cur.ch = word.to - 1;
              } else {
                cur.ch = word.from;
              }
            } else if (!forward && wordEnd) {
              // 'ge'
              if (inRangeInclusive(cur.ch, word.from, word.to) &&
                  word.line == startLine) {
                // still on the same word. Go to the next one.
                movedToNextWord = false;
                cur.ch = word.from
              } else {
                cur.ch = word.to;
              }
            } else if (!forward && !wordEnd) {
              // 'b'
              cur.ch = word.from;
            }
          } else {
            // No more words to be found.
            return cur;
          }
        }
      }
      return cur;
    }

    function buildVimKeyMap() {
      /**
       * Handle the raw key event from CodeMirror. Translate the
       * Shift + key modifier to the resulting letter, while preserving other
       * modifers.
       */
      // TODO: Figure out a way to catch capslock.
      function handleKeyEvent_(cm, key, modifier) {
        if (modifier != 'Shift' && isAlphabet(key)) {
          // Convert to lower case since the key we get from CodeMirro is always
          // upper case.
          key = key.toLowerCase();
        }
        if (modifier && modifier != 'Shift') {
          // Vim will parse modifier+key combination as a single key.
          key = modifier + '-' + key;
        }
        vim.handleKey(cm, key);
      }

      // Closure to bind CodeMirror, key, modifier.
      function keyMapper(key, modifier) {
        return function(cm) {
          handleKeyEvent_(cm, key, modifier);
        }
      }

      var modifiers = ['Shift', 'Ctrl'];
      var alphabetKeys = [
              'A','B','C','D','E','F','G','H','I','J','K','L','M','N',
              'O','P','Q','R','S','T','U','V','W','X','Y','Z'];
      var specialKeys = ["'~'", "'^'", "'$'"];
      var numberKeys = ['0','1','2','3','4','5','6','7','8','9'];
      var keyMap = {
        'nofallthrough': true,
        'style': 'fat-cursor'
      };
      var i, j;
      var keys = alphabetKeys;
      function bindKeys(keys, modifier) {
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          if (modifier) {
            keyMap[modifier + '-' + key] = keyMapper(key, modifier);
          } else {
            keyMap[keys[i]] = keyMapper(key);
          }
        }
      }
      bindKeys(alphabetKeys);
      bindKeys(alphabetKeys, 'Shift');
      bindKeys(alphabetKeys, 'Ctrl');
      bindKeys(specialKeys);
      bindKeys(specialKeys, 'Ctrl');
      bindKeys(numberKeys);
      bindKeys(numberKeys, 'Ctrl');
      return keyMap;
    }
    CodeMirror.keyMap.vim2 = buildVimKeyMap();

    CodeMirror.keyMap['vim-insert'] = {
      // TODO: override navigation keys so that Esc will cancel automatic indentation from o, O, i_<CR>
      'Esc': function(cm) {
        cm.setCursor(cm.getCursor().line, cm.getCursor().ch-1, true);
        cm.setOption('keyMap', 'vim2');
      },
      'Ctrl-N': 'autocomplete',
      'Ctrl-P': 'autocomplete',
      fallthrough: ['default']
    };

    return instance;
  };
  // Initialize Vim and make it available as an API.
  var vim = Vim();
  CodeMirror.Vim = vim;
}
)();
