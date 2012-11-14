// Reimplementation of vim keybindings
// word1
/**
 * Supported keybindings:
 *
 *   Motion:
 *   h, j, k, l
 *   e, E, w, W, b, B, ge, gE
 *   f<character>, F<character>, t<character>, T<character>
 *   $, ^, 0
 *   gg, G
 *   %
 *   '<character>, `<character>
 *
 *   Operator:
 *   d, y, c
 *   dd, yy, cc
 *   g~, g~g~
 *   >, <, >>, <<
 *
 *   Operator-Motion:
 *   x, X, D, Y, ~
 *
 *   Action:
 *   a, i, s, A, I, S, o, O
 *   J
 *   u, Ctrl-r
 *   m<character>
 *   r<character>
 *
 *   Modes:
 *   ESC - leave insert mode, visual mode, and clear input state.
 *   Ctrl-[, Ctrl-c - same as ESC.
 *
 * Registers: unamed, -, a-z, A-Z, 0-9
 *   (Does not respect the special case for number registers when delete
 *    operator is made with these commands: %, (, ),  , /, ?, n, N, {, } )
 *   TODO: Implement the remaining registers.
 * Marks: a-z, A-Z, and 0-9
 *   TODO: Implement the remaining special marks. They have more complex
 *       behavior.
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
 *  8. Set up Vim to work as a keymap for CodeMirror.
 *
 */

(function() {
  'use strict';

  var defaultKeymap = [
    // Key to key mapping. This goes first to make it possible to override
    // existing mappings.
    { keys: ['Left'], type: 'keyToKey', toKeys: ['h'] },
    { keys: ['Right'], type: 'keyToKey', toKeys: ['l'] },
    { keys: ['Up'], type: 'keyToKey', toKeys: ['k'] },
    { keys: ['Down'], type: 'keyToKey', toKeys: ['j'] },
    { keys: ['Space'], type: 'keyToKey', toKeys: ['l'] },
    { keys: ['Backspace'], type: 'keyToKey', toKeys: ['h'] },
    { keys: ['Ctrl-Space'], type: 'keyToKey', toKeys: ['W'] },
    { keys: ['Ctrl-Backspace'], type: 'keyToKey', toKeys: ['B'] },
    { keys: ['Shift-Space'], type: 'keyToKey', toKeys: ['w'] },
    { keys: ['Shift-Backspace'], type: 'keyToKey', toKeys: ['b'] },
    { keys: ['Ctrl-n'], type: 'keyToKey', toKeys: ['j'] },
    { keys: ['Ctrl-p'], type: 'keyToKey', toKeys: ['k'] },
    { keys: ['Ctrl-['], type: 'keyToKey', toKeys: ['Esc'] },
    { keys: ['Ctrl-c'], type: 'keyToKey', toKeys: ['Esc'] },
    // Motions
    { keys: ['h'], type: 'motion',
        motion: 'moveByCharacters',
        motionArgs: { forward: false }},
    { keys: ['l'], type: 'motion',
        motion: 'moveByCharacters',
        motionArgs: { forward: true }},
    { keys: ['j'], type: 'motion',
        motion: 'moveByLines',
        motionArgs: { forward: true, linewise: true }},
    { keys: ['k'], type: 'motion',
        motion: 'moveByLines',
        motionArgs: { forward: false, linewise: true }},
    { keys: ['w'], type: 'motion',
        motion: 'moveByWords',
        motionArgs: { forward: true, wordEnd: false }},
    { keys: ['W'], type: 'motion',
        motion: 'moveByWords',
        motionArgs: { forward: true, wordEnd: false, bigWord: true }},
    { keys: ['e'], type: 'motion',
        motion: 'moveByWords',
        motionArgs: { forward: true, wordEnd: true, inclusive: true }},
    { keys: ['E'], type: 'motion',
        motion: 'moveByWords',
        motionArgs: { forward: true, wordEnd: true, bigWord: true,
            inclusive: true }},
    { keys: ['b'], type: 'motion',
        motion: 'moveByWords',
        motionArgs: { forward: false, wordEnd: false }},
    { keys: ['B'], type: 'motion',
        motion: 'moveByWords',
        motionArgs: { forward: false, wordEnd: false, bigWord: true }},
    { keys: ['g', 'e'], type: 'motion',
        motion: 'moveByWords',
        motionArgs: { forward: false, wordEnd: true, inclusive: true }},
    { keys: ['g', 'E'], type: 'motion',
        motion: 'moveByWords',
        motionArgs: { forward: false, wordEnd: true, bigWord: true,
            inclusive: true }},
    { keys: ['Ctrl-f'], type: 'motion',
        motion: 'moveByPage', motionArgs: { forward: true }},
    { keys: ['Ctrl-b'], type: 'motion',
        motion: 'moveByPage', motionArgs: { forward: false }},
    { keys: ['g', 'g'], type: 'motion',
        motion: 'moveToLineOrEdgeOfDocument',
        motionArgs: { forward: false, explicitRepeat: true }},
    { keys: ['G'], type: 'motion',
        motion: 'moveToLineOrEdgeOfDocument',
        motionArgs: { forward: true, explicitRepeat: true }},
    { keys: ['0'], type: 'motion', motion: 'moveToStartOfLine' },
    { keys: ['^'], type: 'motion',
        motion: 'moveToFirstNonWhiteSpaceCharacter' },
    { keys: ['$'], type: 'motion', motion: 'moveToEol' },
    { keys: ['%'], type: 'motion',
        motion: 'moveToMatchedSymbol',
        motionArgs: { inclusive: true }},
    { keys: ['f', 'character'], type: 'motion',
        motion: 'moveToCharacter',
        motionArgs: { forward: true , inclusive: true }},
    { keys: ['F', 'character'], type: 'motion',
        motion: 'moveToCharacter',
        motionArgs: { forward: false }},
    { keys: ['t', 'character'], type: 'motion',
        motion: 'moveTillCharacter',
        motionArgs: { forward: true, inclusive: true }},
    { keys: ['T', 'character'], type: 'motion',
        motion: 'moveTillCharacter',
        motionArgs: { forward: false }},
    { keys: ['\'', 'character'], type: 'motion', motion: 'goToMark' },
    { keys: ['`', 'character'], type: 'motion', motion: 'goToMark' },
    // Operators
    { keys: ['d'], type: 'operator', operator: 'delete' },
    { keys: ['y'], type: 'operator', operator: 'yank' },
    { keys: ['c'], type: 'operator', operator: 'change',
        operatorArgs: { enterInsertMode: true } },
    { keys: ['>'], type: 'operator', operator: 'indent',
        operatorArgs: { indentRight: true }},
    { keys: ['<'], type: 'operator', operator: 'indent',
        operatorArgs: { indentRight: false }},
    { keys: ['g', '~'], type: 'operator', operator: 'swapcase' },
    // Operator-Motion dual commands
    { keys: ['x'], type: 'operatorMotion', operator: 'delete',
        motion: 'moveByCharacters', motionArgs: { forward: true },
        operatorMotionArgs: { visualLine: false }},
    { keys: ['X'], type: 'operatorMotion', operator: 'delete',
        motion: 'moveByCharacters', motionArgs: { forward: false },
        operatorMotionArgs: { visualLine: true }},
    { keys: ['D'], type: 'operatorMotion', operator: 'delete',
        motion: 'moveToEol' , operatorMotionArgs: { visualLine: true }},
    { keys: ['Y'], type: 'operatorMotion', operator: 'yank',
        motion: 'moveToEol' , operatorMotionArgs: { visualLine: true }},
    { keys: ['~'], type: 'operatorMotion', operator: 'swapcase',
        motion: 'moveByCharacters', motionArgs: { forward: true }},
    // Actions
    { keys: ['a'], type: 'action', action: 'enterInsertMode',
        motion: 'moveByCharacters',
        motionArgs: { forward: true, noRepeat: true }},
    { keys: ['A'], type: 'action', action: 'enterInsertMode',
        motion: 'moveToEol' },
    { keys: ['i'], type: 'action', action: 'enterInsertMode' },
    { keys: ['I'], type: 'action', action: 'enterInsertMode',
        motion: 'moveToFirstNonWhiteSpaceCharacter' },
    { keys: ['s'], type: 'action', action: 'enterInsertMode',
        motion: 'moveByCharacters', motionArgs: { forward: true },
        operator: 'delete' },
    { keys: ['S'], type: 'action', action: 'enterInsertMode',
        motion: 'moveByLines',
        motionArgs: { forward: true, linewise: true, explicitRepeat: true },
        operator: 'delete' },
    { keys: ['o'], type: 'action', action: 'newLineAndEnterInsertMode',
        actionArgs: { after: true }},
    { keys: ['O'], type: 'action', action: 'newLineAndEnterInsertMode',
        actionArgs: { after: false }},
    { keys: ['v'], type: 'action', action: 'toggleVisualMode' },
    { keys: ['V'], type: 'action', action: 'toggleVisualMode',
        actionArgs: { linewise: true }},
    { keys: ['J'], type: 'action', action: 'joinLines' },
    { keys: ['p'], type: 'action', action: 'paste',
        actionArgs: { after: true }},
    { keys: ['P'], type: 'action', action: 'paste',
        actionArgs: { after: false }},
    { keys: ['r', 'character'], type: 'action', action: 'replace' },
    { keys: ['u'], type: 'action', action: 'undo' },
    { keys: ['Ctrl-r'], type: 'action', action: 'redo' },
    { keys: ['m', 'character'], type: 'action', action: 'setMark' },
    { keys: ['\"', 'character'], type: 'action', action: 'setRegister' },
    // Text object motions
    { keys: ['a', 'character'], type: 'motion',
        motion: 'textObjectManipulation' },
    { keys: ['i', 'character'], type: 'motion',
        motion: 'textObjectManipulation',
        motionArgs: { textObjectInner: true }}
  ];

  var Vim = function() {
    var alphabetRegex = /[A-Za-z]/;
    var numberRegex = /[\d]/;
    var whiteSpaceRegex = /\s/;
    var wordRegexp = [(/\w/), (/[^\w\s]/)], bigWordRegexp = [(/\S/)];
    function makeKeyRange(start, size) {
      var keys = [];
      for (var i = start; i < start + size; i++) {
        keys.push(String.fromCharCode(i));
      }
      return keys;
    }
    var upperCaseAlphabet = makeKeyRange(65, 26);
    var lowerCaseAlphabet = makeKeyRange(97, 26);
    var numbers = makeKeyRange(48, 10);
    var SPECIAL_SYMBOLS = '~`!@#$%^&*()_-+=[{}]\\|/?.,<>:;\"\'';
    var specialSymbols = SPECIAL_SYMBOLS.split('');
    var specialKeys = ['Left', 'Right', 'Up', 'Down', 'Space', 'Backspace',
        'Esc'];
    var validMarks = upperCaseAlphabet.concat(lowerCaseAlphabet).concat(
        numbers);
    var validRegisters = upperCaseAlphabet.concat(lowerCaseAlphabet).concat(
        numbers).concat('-\"'.split(''));

    function isAlphabet(k) {
      return alphabetRegex.test(k);
    }
    function isLine(cm, line) {
      return line >= 0 && line < cm.lineCount();
    }
    function isLowerCase(k) {
      return (/^[a-z]$/).test(k);
    }
    function isMatchableSymbol(k) {
      return '()[]{}'.indexOf(k) != -1;
    }
    function isNumber(k) {
      return numberRegex.test(k);
    }
    function isUpperCase(k) {
      return (/^[A-Z]$/).test(k);
    }
    function isAlphanumeric(k) {
      return (/^[a-zA-Z-0-9]/).test(k);
    }
    function isWhiteSpace(k) {
      return whiteSpaceRegex.test(k);
    }
    function isWhiteSpaceString(k) {
      return (/^\s*$/).test(k);
    }
    function inRangeInclusive(x, start, end) {
      return x >= start && x <= end;
    }
    function inArray(val, arr) {
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] == val) { return true; }
      }
      return false;
    }

    var vimApi= {
      addKeyMap: function() {
        // Add user defined key bindings.
        // TODO: Implement this.
      },
      buildKeyMap: function() {
        // TODO: Convert keymap into dictionary format for fast lookup.
      },
      // Initializes vim state variable on the CodeMirror object. Should only be
      // called lazily by handleKey or for testing.
      maybeInitState: function(cm) {
        if (!cm.vimState) {
          // Store instance state in the CodeMirror object.
          cm.vimState = {
            inputState: new InputState(),
            marks: {},
            registerController: new RegisterController({}),
            visualMode: false,
            // If we are in visual line mode. No effect if visualMode is false.
            visualLine: false
          };
        }
      },
      // This is the outermost function called by CodeMirror, after keys have
      // been mapped to their Vim equivalents.
      handleKey: function(cm, key) {
        this.maybeInitState(cm);
        var vim = cm.vimState;
        if (key == 'Esc') {
          // Clear input state and get back to normal mode.
          vim.inputState.reset();
          if (vim.visualMode) {
            exitVisualMode(cm, vim);
          }
          return;
        }
        if (vim.visualMode &&
            cursorEqual(cm.getCursor('head'), cm.getCursor('anchor'))) {
          // The selection was cleared. Exit visual mode.
          exitVisualMode(cm, vim);
        }
        if (key != '0' || (key == '0' && vim.inputState.getRepeat() === 0)) {
          // Have to special case 0 since it's both a motion and a number.
          var command = commandDispatcher.matchCommand(key, defaultKeymap,
              vim);
        }
        if (!command && isNumber(key)) {
          // Increment count unless count is 0 and key is 0.
          vim.inputState.pushRepeatDigit(key);
          return;
        }
        if (command) {
          if (command.type == 'keyToKey') {
            // TODO: prevent infinite recursion.
            for (var i = 0; i < command.toKeys.length; i++) {
              this.handleKey(cm, command.toKeys[i]);
            }
          } else {
            commandDispatcher.processCommand(cm, vim, command);
          }
        }
      }
    };

    // Represents the current input state.
    function InputState() {
      this.reset();
    }
    InputState.prototype.reset = function() {
      this.prefixRepeat = [];
      this.motionRepeat = [];

      this.operator = null;
      this.operatorArgs = null;
      this.motion = null;
      this.motionArgs = null;
      this.keyBuffer = []; // For matching multi-key commands.
      this.registerName = null; // Defaults to the unamed register.
    };
    InputState.prototype.pushRepeatDigit = function(n) {
      if (!this.operator) {
        this.prefixRepeat = this.prefixRepeat.concat(n);
      } else {
        this.motionRepeat = this.motionRepeat.concat(n);
      }
    };
    InputState.prototype.getRepeat = function() {
      var repeat = 0;
      if (this.prefixRepeat.length > 0 || this.motionRepeat.length > 0) {
        repeat = 1;
        if (this.prefixRepeat.length > 0) {
          repeat *= parseInt(this.prefixRepeat.join(''), 10);
        }
        if (this.motionRepeat.length > 0) {
          repeat *= parseInt(this.motionRepeat.join(''), 10);
        }
      }
      return repeat;
    };

    function Register() {
      this.clear();
    }
    Register.prototype = {
      set: function(text, linewise) {
        this.text = text;
        this.linewise = !!linewise;
      },
      append: function(text, linewise) {
        // if this register has ever been set to linewise, use linewise.
        if (linewise || this.linewise) {
          this.text += '\n' + text;
          this.linewise = true;
        } else {
          this.text += text;
        }
      },
      clear: function() {
        this.text = '';
        this.linewise = false;
      }
    };

    function RegisterController(registers) {
      this.registers = registers;
      this.lastUpdatedRegisterName = null;
      this.unamedRegister = registers['\"'] = new Register();
    }
    RegisterController.prototype = {
      pushText: function(registerName, operator, text, linewise) {
        // Lowercase and uppercase registers refer to the same register.
        // Uppercase just means append.
        var append = isUpperCase(registerName);
        var register = this.isValidRegister(registerName) ?
            this.getRegister(registerName) : null;
        if (register &&
            registerName.toLowerCase() != this.lastUpdatedRegisterName) {
          // Switched registers, clear the unamed register.
          this.lastUpdatedRegisterName = registerName.toLowerCase();
          this.unamedRegister.set('', false);
        } else {
          this.lastUpdatedRegisterName = null;
        }
        // The unamed register always has the same value as the last used
        // register.
        if (append) {
          if (register) {
            register.append(text, linewise);
          }
          this.unamedRegister.append(text, linewise);
        } else {
          if (register) {
            register.set(text, linewise);
          }
          this.unamedRegister.set(text, linewise);
        }
        if (!register) {
          // These only happen if no register was explicitly specified.
          if (operator == 'yank') {
            // The 0 register contains the text from the most recent yank.
            this.getRegisterInternal('0').set(text, linewise);
          } else if (operator == 'delete' || operator == 'change') {
            if (text.indexOf('\n') == -1) {
              // Delete less than 1 line. Update the small delete register.
              this.getRegisterInternal('-').set(text, linewise);
            } else {
              // Shift down the contents of the numbered registers and put the
              // deleted text into register 1.
              for (var i = 9; i >= 2; i--) {
                var from = this.getRegisterInternal('' + (i - 1));
                this.registers['' + i] = from;
              }
              this.registers['1'] = new Register();
              this.registers['1'].set(text, linewise);
            }
          }
        }
      },
      getRegister: function(name) {
        if (!this.isValidRegister(name)) {
          return this.unamedRegister;
        }
        return this.getRegisterInternal(name);
      },
      getRegisterInternal: function(name) {
        if (!name) {
          return null;
        }
        name = name.toLowerCase();
        if (!this.registers[name]) {
          this.registers[name] = new Register();
        }
        return this.registers[name];
      },
      isValidRegister: function(name) {
        return name && inArray(name, validRegisters);
      }
    };

    var commandDispatcher = {
      matchCommand: function(key, keyMap, vim) {
        var inputState = vim.inputState;
        var keys = inputState.keyBuffer.concat(key);
        for (var i = 0; i < keyMap.length; i++) {
          var command = keyMap[i];
          if (matchKeysPartial(keys, command.keys)) {
            if (keys.length < command.keys.length) {
              // Matches part of a multi-key command. Buffer and wait for next
              // stroke.
              inputState.keyBuffer.push(key);
              return null;
            } else {
              if (inputState.operator && command.type == 'action') {
                // Ignore matched action commands after an operator. Operators
                // only operate on motions. This check is really for text
                // objects since aW, a[ etcs conflicts with a.
                continue;
              }
              // Matches whole comand. Return the command.
              if (command.keys[keys.length - 1] == 'character') {
                inputState.selectedCharacter = keys[keys.length - 1];
              }
              inputState.keyBuffer = [];
              return command;
            }
          }
        }
        // Clear the buffer since there are no partial matches.
        inputState.keyBuffer = [];
        return null;
      },
      processCommand: function(cm, vim, command) {
        switch (command.type) {
          case 'motion':
            this.processMotion(cm, vim, command);
            break;
          case 'operator':
            this.processOperator(cm, vim, command);
            break;
          case 'operatorMotion':
            this.processOperatorMotion(cm, vim, command);
            break;
          case 'action':
            this.processAction(cm, vim, command);
            break;
          default:
            break;
        }
      },
      processMotion: function(cm, vim, command) {
        vim.inputState.motion = command.motion;
        vim.inputState.motionArgs = copyArgs(command.motionArgs);
        this.evalInput(cm, vim);
      },
      processOperator: function(cm, vim, command) {
        var inputState = vim.inputState;
        if (inputState.operator) {
          if (inputState.operator == command.operator) {
            // Typing an operator twice like 'dd' makes the operator operate
            // linewise
            inputState.motion = 'expandToLine';
            inputState.motionArgs = { linewise: true };
            this.evalInput(cm, vim);
            return;
          } else {
            // 2 different operators in a row doesn't make sense.
            inputState.reset();
          }
        }
        inputState.operator = command.operator;
        inputState.operatorArgs = copyArgs(command.operatorArgs);
        if (vim.visualMode) {
          // Operating on a selection in visual mode. We don't need a motion.
          this.evalInput(cm, vim);
        }
      },
      processOperatorMotion: function(cm, vim, command) {
        var visualMode = vim.visualMode;
        var operatorMotionArgs = copyArgs(command.operatorMotionArgs);
        if (operatorMotionArgs) {
          // Operator motions may have special behavior in visual mode.
          if (visualMode && operatorMotionArgs.visualLine) {
            vim.visualLine = true;
          }
        }
        this.processOperator(cm, vim, command);
        if (!visualMode) {
          this.processMotion(cm, vim, command);
        }
      },
      processAction: function(cm, vim, command) {
        var inputState = vim.inputState;
        var repeat = inputState.getRepeat();
        var repeatIsExplicit = !!repeat;
        var actionArgs = copyArgs(command.actionArgs) || {};
        if (inputState.selectedCharacter) {
          actionArgs.selectedCharacter = inputState.selectedCharacter;
        }
        // Actions may or may not have motions and operators. Do these first.
        if (command.operator) {
          this.processOperator(cm, vim, command);
        }
        if (command.motion) {
          this.processMotion(cm, vim, command);
        }
        if (command.motion || command.operator) {
          this.evalInput(cm, vim);
        }
        actionArgs.repeat = repeat || 1;
        actionArgs.repeatIsExplicit = repeatIsExplicit;
        actionArgs.registerName = inputState.registerName;
        inputState.reset();
        actions[command.action](cm, actionArgs, vim);
      },
      evalInput: function(cm, vim) {
        // If the motion comand is set, execute both the operator and motion.
        // Otherwise return.
        var inputState = vim.inputState;
        var motion = inputState.motion;
        var motionArgs = inputState.motionArgs || {};
        var operator = inputState.operator;
        var operatorArgs = inputState.operatorArgs || {};
        var registerName = inputState.registerName;
        var selectionEnd = cm.getCursor('head');
        var selectionStart = cm.getCursor('anchor');
        // The difference between cur and selection cursors are that cur is
        // being operated on and ignores that there is a selection.
        var curStart = copyCursor(selectionEnd);
        var curEnd;
        var repeat = inputState.getRepeat();
        if (repeat > 0 && motionArgs.explicitRepeat) {
          motionArgs.repeatIsExplicit = true;
        } else if (motionArgs.noRepeat ||
            (!motionArgs.explicitRepeat && repeat === 0)) {
          repeat = 1;
          motionArgs.repeatIsExplicit = false;
        }
        if (inputState.selectedCharacter) {
          // If there is a character input, stick it in all of the arg arrays.
          motionArgs.selectedCharacter = operatorArgs.selectedCharacter =
              inputState.selectedCharacter;
        }
        motionArgs.repeat = repeat;
        inputState.reset();
        if (motion) {
          var motionResult = motions[motion](cm, motionArgs, vim);
          if (!motionResult) {
            return;
          }
          if (motionResult instanceof Array) {
            curStart = motionResult[0];
            curEnd = motionResult[1];
          } else {
            curEnd = motionResult;
          }
          // TODO: Handle null returns from motion commands better.
          if (!curEnd) {
            curEnd = { ch: curStart.ch, line: curStart.line };
          }
          if (vim.visualMode) {
            // Check if the selection crossed over itself. Will need to shift
            // the start point if that happened.
            if (cursorIsBefore(selectionStart, selectionEnd) &&
                (cursorEqual(selectionStart, curEnd) ||
                    cursorIsBefore(curEnd, selectionStart))) {
              // The end of the selection has moved from after the start to
              // before the start. We will shift the start right by 1.
              selectionStart.ch += 1;
            } else if (cursorIsBefore(selectionEnd, selectionStart) &&
                (cursorEqual(selectionStart, curEnd) ||
                    cursorIsBefore(selectionStart, curEnd))) {
              // The opposite happened. We will shift the start left by 1.
              selectionStart.ch -= 1;
            }
            selectionEnd = curEnd;
            if (vim.visualLine) {
              if (cursorIsBefore(selectionStart, selectionEnd)) {
                selectionStart.ch = 0;
                selectionEnd.ch = lineLength(cm, selectionEnd.line);
              } else {
                selectionEnd.ch = 0;
                selectionStart.ch = lineLength(cm, selectionStart.line);
              }
            }
            // Need to set the cursor to clear the selection. Otherwise,
            // CodeMirror can't figure out that we changed directions...
            cm.setCursor(selectionStart);
            cm.setSelection(selectionStart, selectionEnd);
          } else {
            cm.setCursor(curEnd.line, curEnd.ch);
          }
        }

        if (operator) {
          operatorArgs.repeat = repeat; // Indent in visual mode needs this.
          if (vim.visualMode) {
            curStart = selectionStart;
            curEnd = selectionEnd;
            motionArgs.inclusive = true;
          }
          // Swap start and end if motion was backward.
          if (cursorIsBefore(curEnd, curStart)) {
            var tmp = curStart;
            curStart = curEnd;
            curEnd = tmp;
            var inverted = true;
          }
          if (motionArgs.inclusive && !(vim.visualMode && inverted)) {
            // Move the selection end one to the right to include the last
            // character.
            curEnd.ch++;
          }
          var linewise = motionArgs.linewise ||
              (vim.visualMode && vim.visualLine);
          if (linewise) {
            // Expand selection to entire line.
            expandSelectionToLine(cm, curStart, curEnd);
          } else if (motionArgs.forward) {
            // Clip to trailing newlines only if we the motion goes forward.
            clipToLine(cm, curStart, curEnd);
          }
          operatorArgs.registerName = registerName;
          // Keep track of linewise as it affects how paste and change behave.
          operatorArgs.linewise = linewise;
          operators[operator](cm, operatorArgs, vim, curStart,
              curEnd);
          if (vim.visualMode) {
            exitVisualMode(cm, vim);
          }
          if (operatorArgs.enterInsertMode) {
            actions.enterInsertMode(cm);
          }
        }
      }
    };

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
        return { line: endLine, ch: lineLength(cm, endLine) };
      },
      goToMark: function(cm, motionArgs, vim) {
        var mark = vim.marks[motionArgs.selectedCharacter];
        if (mark) {
          return mark.find();
        }
        return null;
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
      moveByPage: function(cm, motionArgs) {
        // CodeMirror only exposes functions that move the cursor page down, so
        // doing this bad hack to move the cursor and move it back. evalInput will
        // move the cursor to where it should be in the end.
        // TODO: Consider making motions move the cursor by default, so as to not
        //     need this ugliness. But it might make visual mode hard.
        var curStart = cm.getCursor();
        var repeat = motionArgs.repeat;
        cm.moveV(motionArgs.forward ? repeat : (-1 * repeat), 'page');
        var curEnd = cm.getCursor();
        cm.setCursor(curStart);
        return curEnd;
      },
      moveByWords: function(cm, motionArgs) {
        return moveToWord(cm, motionArgs.repeat, !!motionArgs.forward,
            !!motionArgs.wordEnd, !!motionArgs.bigWord);
      },
      moveTillCharacter: function(cm, motionArgs) {
        var repeat = motionArgs.repeat;
        var curEnd = moveToCharacter(cm, repeat, motionArgs.forward,
            motionArgs.selectedCharacter);
        if (motionArgs.forward) {
          curEnd.ch--;
        }
        else {
          curEnd.ch++;
        }
        return curEnd;
      },
      moveToCharacter: function(cm, motionArgs) {
        var repeat = motionArgs.repeat;
        return moveToCharacter(cm, repeat, motionArgs.forward,
            motionArgs.selectedCharacter);
      },
      moveToEol: function(cm, motionArgs) {
        var cursor = cm.getCursor();
        var line = Math.min(cursor.line + motionArgs.repeat - 1,
            cm.lineCount());
        return { line: line, ch: cm.getLine(line).length };
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
      moveToMatchedSymbol: function(cm, motionArgs) {
        var cursor = cm.getCursor();
        var symbol = cm.getLine(cursor.line).charAt(cursor.ch);
        if (isMatchableSymbol(symbol)) {
          return findMatchedSymbol(cm, cm.getCursor(), motionArgs.symbol);
        } else {
          return cursor;
        }
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
      textObjectManipulation: function(cm, motionArgs) {
        var character = motionArgs.selectedCharacter;
        // Inclusive is the difference between a and i
        // TODO: Instead of using the additional text object map to perform text
        //     object operations, merge the map into the defaultKeyMap and use
        //     motionArgs to define behavior. Define separate entries for 'aw',
        //     'iw', 'a[', 'i[', etc.
        var inclusive = !motionArgs.textObjectInner;
        if (!textObjects[character]) {
          // No text object defined for this, don't move.
          return null;
        }
        var tmp = textObjects[character](cm, inclusive);
        var start = tmp.start;
        var end = tmp.end;
        return [start, end];
      }
    };

    var operators = {
      change: function(cm, operatorArgs, vim, curStart, curEnd) {
        vim.registerController.pushText(operatorArgs.registerName, 'change',
            cm.getRange(curStart, curEnd), operatorArgs.linewise);
        if (operatorArgs.linewise) {
          // Insert an additional newline so that insert mode can start there.
          // curEnd should be on the first character of the new line.
          cm.replaceRange('\n', curStart, curEnd);
        } else {
          cm.replaceRange('', curStart, curEnd);
        }
        cm.setCursor(curStart);
      },
      // delete is a javascript keyword.
      'delete': function(cm, operatorArgs, vim, curStart, curEnd) {
        vim.registerController.pushText(operatorArgs.registerName, 'delete',
            cm.getRange(curStart, curEnd), operatorArgs.linewise);
        cm.replaceRange('', curStart, curEnd);
      },
      indent: function(cm, operatorArgs, vim, curStart, curEnd) {
        var startLine = curStart.line;
        var endLine = curEnd.line;
        // In visual mode, n> shifts the selection right n times, instead of
        // shifting n lines right once.
        var repeat = (vim.visualMode) ? operatorArgs.repeat : 1;
        if (operatorArgs.linewise) {
          // The only way to delete a newline is to delete until the start of
          // the next line, so in linewise mode evalInput will include the next
          // line. We don't want this in indent, so we go back a line.
          endLine--;
        }
        for (var i = startLine; i <= endLine; i++) {
          for (var j = 0; j < repeat; j++) {
            cm.indentLine(i, operatorArgs.indentRight);
          }
        }
        cm.setCursor(curStart);
        cm.setCursor(motions.moveToFirstNonWhiteSpaceCharacter(cm));
      },
      swapcase: function(cm, operatorArgs, vim, curStart, curEnd) {
        var toSwap = cm.getRange(curStart, curEnd);
        var swapped = '';
        for (var i = 0; i < toSwap.length; i++) {
          var character = toSwap[i];
          swapped += isUpperCase(character) ? character.toLowerCase() :
              character.toUpperCase();
        }
        cm.replaceRange(swapped, curStart, curEnd);
      },
      yank: function(cm, operatorArgs, vim, curStart, curEnd) {
        vim.registerController.pushText(operatorArgs.registerName, 'yank',
            cm.getRange(curStart, curEnd), operatorArgs.linewise);
      }
    };

    var actions = {
      enterInsertMode: function(cm) {
        cm.setOption('keyMap', 'vim-insert');
      },
      toggleVisualMode: function(cm, actionArgs, vim) {
        var repeat = actionArgs.repeat;
        var curStart = cm.getCursor();
        var curEnd;
        vim.visualLine = !!actionArgs.linewise;
        // TODO: The repeat should actually select number of characters/lines
        //     equal to the repeat times the size of the previous visual
        //     operation.
        if (!vim.visualMode) {
          vim.visualMode = true;
          if (vim.visualLine) {
            curStart.ch = 0;
            curEnd = {
              line: Math.min(curStart.line + repeat - 1, cm.lineCount()),
              ch: lineLength(cm, curStart.line)
            };
          } else {
            curEnd = {
                line: curStart.line,
                ch: Math.min(curStart.ch + repeat,
                    lineLength(cm, curStart.line))
            };
          }
          // Make the initial selection.
          if (!actionArgs.repeatIsExplicit && !vim.visualLine) {
            // This is a strange case. Here the implicit repeat is 1. The
            // following commands lets the cursor hover over the 1 character
            // selection.
            cm.setCursor(curEnd);
            cm.setSelection(curEnd, curStart);
          } else {
            cm.setSelection(curStart, curEnd);
          }
        } else {
          exitVisualMode(cm, vim);
        }
      },
      joinLines: function(cm, actionArgs, vim) {
        if (vim.visualMode) {
          var curStart = cm.getCursor('anchor');
          var curEnd = cm.getCursor('head');
          curEnd.ch = lineLength(cm, curEnd.line) - 1;
        } else {
          // Repeat is the number of lines to join. Minimum 2 lines.
          var repeat = Math.max(actionArgs.repeat, 2);
          var curStart = cm.getCursor();
          var lineNumEnd = Math.min(curStart.line + repeat - 1,
              cm.lineCount() - 1);
          var curEnd = { line: lineNumEnd,
              ch: lineLength(cm, lineNumEnd) - 1 };
        }
        var text = cm.getRange(curStart, curEnd).replace(/\n\s*/g, ' ');
        cm.replaceRange(text, curStart, curEnd);
        cm.setCursor(curStart);
      },
      newLineAndEnterInsertMode: function(cm, actionArgs) {
        var insertAt = cm.getCursor();
        insertAt.ch = 0;
        insertAt.line = (actionArgs.after) ? insertAt.line + 1 : insertAt.line;
        cm.replaceRange('\n', insertAt);
        cm.setCursor(insertAt);
        this.enterInsertMode(cm);
      },
      paste: function(cm, actionArgs, vim) {
        var cur = cm.getCursor();
        var register = vim.registerController.getRegister(
            actionArgs.registerName);
        if (!register.text) { return; }
        for (var text = '', i = 0; i < actionArgs.repeat; i++) {
          text += register.text;
        }
        var curChEnd = 0;
        var linewise = register.linewise;
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
        if (linewise) {
          cm.setCursor(cm.getCursor().line - 1, 0);
        }
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
      setRegister: function(cm, actionArgs, vim) {
        vim.inputState.registerName = actionArgs.selectedCharacter;
      },
      setMark: function(cm, actionArgs, vim) {
        var markName = actionArgs.selectedCharacter;
        if (!inArray(markName, validMarks)) {
          return;
        }
        if (vim.marks[markName]) {
          vim.marks[markName].clear();
        }
        vim.marks[markName] = cm.setBookmark(cm.getCursor());
      },
      replace: function(cm, actionArgs) {
        var replaceWith = actionArgs.selectedCharacter;
        var curStart = cm.getCursor();
        var line = cm.getLine(curStart.line);
        var replaceTo = curStart.ch + actionArgs.repeat;
        if (replaceTo > line.length) {
          return;
        }
        var curEnd = { line: curStart.line, ch: replaceTo };
        var replaceWithStr = '';
        for (var i = 0; i < curEnd.ch - curStart.ch; i++) {
          replaceWithStr += replaceWith;
        }
        cm.replaceRange(replaceWithStr, curStart, curEnd);
      }
    };

    var textObjects = {
      // TODO: lots of possible exceptions that can be thrown here. Try da(
      //     outside of a () block.
      // TODO: implement text objects for the reverse like }. Should just be
      //     an additional mapping after moving to the defaultKeyMap.
      'w': function(cm, inclusive) {
        return expandToWord(cm, inclusive, true /** forward */,
            false /** bigWord */);
      },
      'W': function(cm, inclusive) {
        return expandToWord(cm, inclusive,
            true /** forward */, true /** bigWord */);
      },
      '{': function(cm, inclusive) {
        return selectCompanionObject(cm, '}', inclusive);
      },
      '(': function(cm, inclusive) {
        return selectCompanionObject(cm, ')', inclusive);
      },
      '[': function(cm, inclusive) {
        return selectCompanionObject(cm, ']', inclusive);
      },
      '\'': function(cm, inclusive) {
        return findBeginningAndEnd(cm, "'", inclusive);
      },
      '\"': function(cm, inclusive) {
        return findBeginningAndEnd(cm, '"', inclusive);
      }
    };

    // Merge arguments in place, for overriding arguments.
    function mergeArgs(to, from) {
      for (var prop in from) {
        if (from.hasOwnProperty(prop)) {
          to[prop] = from[prop];
        }
      }
    }
    function copyArgs(args) {
      var ret = {};
      for (var prop in args) {
        if (args.hasOwnProperty(prop)) {
          ret[prop] = args[prop];
        }
      }
      return ret;
    }
    function arrayEq(a1, a2) {
      if (a1.length != a2.length) return false;
      for (var i = 0; i < a1.length; i++) {
        if (a1[i] != a2[i]) {
          return false;
        }
      }
      return true;
    }
    function matchKeysPartial(pressed, mapped) {
      for (var i = 0; i < pressed.length; i++) {
        // 'character' means any character. For mark, register commads, etc.
        if (pressed[i] != mapped[i] && mapped[i] != 'character') {
          return false;
        }
      }
      return true;
    }
    function arrayIsSubsetFromBeginning(small, big) {
      for (var i = 0; i < small.length; i++) {
        if (small[i] != big[i]) {
          return false;
        }
      }
      return true;
    }
    function repeatFn(cm, fn, repeat) {
      return function() {
        for (var i = 0; i < repeat; i++) {
          fn(cm);
        }
      };
    }
    function copyCursor(cur) {
      return { line: cur.line, ch: cur.ch, user: cur.user };
    }
    function cursorEqual(cur1, cur2) {
      return cur1.ch == cur2.ch && cur1.line == cur2.line;
    }
    function cursorIsBefore(cur1, cur2) {
      if (cur1.line < cur2.line) {
        return true;
      } else if (cur1.line == cur2.line && cur1.ch < cur2.ch) {
        return true;
      } else {
        return false;
      }
    }
    function lineLength(cm, lineNum) {
      return cm.getLine(lineNum).length;
    }

    function exitVisualMode(cm, vim) {
      vim.visualMode = false;
      vim.visualLine = false;
      var selectionStart = cm.getCursor('anchor');
      var selectionEnd = cm.getCursor('head');
      if (!cursorEqual(selectionStart, selectionEnd)) {
        // Clear the selection and set the cursor only if the selection has not
        // already been cleared. Otherwise we risk moving the cursor somewhere
        // it's not supposed to be.
        cm.setCursor(selectionEnd);
      }
    }

    // Remove any trailing newlines from the selection. For
    // example, with the caret at the start of the last word on the line,
    // 'dw' should word, but not the newline, while 'w' should advance the
    // caret to the first character of the next line.
    function clipToLine(cm, curStart, curEnd) {
      var selection = cm.getRange(curStart, curEnd);
      var lines = selection.split('\n');
      if (lines.length > 1 && isWhiteSpaceString(lines.pop())) {
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

    function expandToWord(cm, inclusive, forward, bigWord) {
      var cur = cm.getCursor();
      var line = cm.getLine(cur.line);

      var line_to_char = new String(line.substring(0, cur.ch));
      // TODO: Case when small word is matching symbols does not work right with
      //     the current regexLastIndexOf check.
      var start = regexLastIndexOf(line_to_char,
          (!bigWord) ? /[^a-zA-Z0-9]/ : /\s/) + 1;
      var end = motions.moveByWords(cm, { repeat: 1, forward: true,
          wordEnd: true, bigWord: bigWord });
      end.ch += inclusive ? 1 : 0 ;
      return {start: {line: cur.line, ch: start}, end: end };
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
              while (pos != stop && regexps[i].test(line.charAt(pos))) {
                pos += dir;
              }
              wordEnd = pos;
              foundWord = wordStart != wordEnd;
              if (wordStart == cur.ch && lineNum == cur.line &&
                  wordEnd == wordStart + dir) {
                // We started at the end of a word. Find the next one.
                continue;
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
        if (!isLine(cm, lineNum)) {
          return null;
        }
        line = cm.getLine(lineNum);
        pos = (dir > 0) ? 0 : line.length;
      }
      // Should never get here.
      throw 'The impossible happened.';
    }

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
                cur.ch = word.from;
              } else {
                cur.ch = word.to;
              }
            } else if (!forward && !wordEnd) {
              // 'b'
              cur.ch = word.from;
            }
          } else {
            // No more words to be found. Move to end of line.
            return { line: cur.line, ch: lineLength(cm, cur.line) };
          }
        }
      }
      return cur;
    }

    function moveToCharacter(cm, repeat, forward, character) {
      var cur = cm.getCursor();
      var start = cur.ch;
      for (var i = 0; i < repeat; i ++) {
        var line = cm.getLine(cur.line);
        var idx = charIdxInLine(start, line, character, forward, true);
        if (idx == -1) {
          return cur;
        }
        start = idx;
      }
      return { line: cm.getCursor().line,
        ch: idx };
    }

    function charIdxInLine(start, line, character, forward, includeChar) {
      // Search for char in line.
      // motion_options: {forward, includeChar}
      // If includeChar = true, include it too.
      // If forward = true, search forward, else search backwards.
      // If char is not found on this line, do nothing
      var idx;
      if (forward) {
        idx = line.indexOf(character, start + 1);
        if (idx != -1 && !includeChar) {
          idx -= 1;
        }
      } else {
        idx = line.lastIndexOf(character, start - 1);
        if (idx != -1 && !includeChar) {
          idx += 1;
        }
      }
      return idx;
    }

    function findMatchedSymbol(cm, cur, symb) {
      var line = cur.line;
      symb = symb ? symb : cm.getLine(line)[cur.ch];

      // Are we at the opening or closing char
      var forwards = (['(', '[', '{'].indexOf(symb) != -1);

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
      if (!reverseSymb) return cur;

      // Tracking our imbalance in open/closing symbols. An opening symbol will
      // be the first thing we pick up if moving forward, this isn't true moving
      // backwards
      var disBal = forwards ? 0 : 1;

      var currLine;
      while (true) {
        if (line == cur.line) {
          // First pass, do some special stuff
          currLine = forwards ? cm.getLine(line).substr(cur.ch).split('') :
            cm.getLine(line).substr(0,cur.ch).split('').reverse();
        } else {
          currLine = forwards ? cm.getLine(line).split('') :
            cm.getLine(line).split('').reverse();
        }

        for (var index = 0; index < currLine.length; index++) {
          if (currLine[index] == symb) {
            disBal++;
          } else if (currLine[index] == reverseSymb) {
            disBal--;
          }

          if (disBal === 0) {
            if (forwards && cur.line == line) {
              return { line: line, ch: index + cur.ch};
            } else if (forwards) {
              return { line: line, ch: index};
            } else {
              return {line: line, ch: currLine.length - index - 1 };
            }
          }
        }

        if (forwards) {
          line++;
        } else {
          line--;
        }
      }
      return cur;
    }

    function selectCompanionObject(cm, revSymb, inclusive) {
      var cur = cm.getCursor();

      var end = findMatchedSymbol(cm, cur, revSymb);
      var start = findMatchedSymbol(cm, end);
      start.ch += inclusive ? 1 : 0;
      end.ch += inclusive ? 0 : 1;

      return {start: start, end: end};
    }

    function regexLastIndexOf(string, pattern, startIndex) {
      for (var i = !startIndex ? string.length : startIndex;
          i >= 0; --i) {
        if (pattern.test(string.charAt(i))) {
          return i;
        }
      }
      return -1;
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
        // Why is this line even here???
        // cm.setCursor(cur.line, firstIndex+1);
      }
      // otherwise if the cursor is currently on the closing symbol
      else if (firstIndex < cur.ch && chars[cur.ch] == symb) {
        end = cur.ch; // assign end to the current cursor
        --cur.ch; // make sure to look backwards
      }

      // if we're currently on the symbol, we've got a start
      if (chars[cur.ch] == symb && !end) {
        start = cur.ch + 1; // assign start to ahead of the cursor
      } else {
        // go backwards to find the start
        for (var i = cur.ch; i > -1 && !start; i--) {
          if (chars[i] == symb) {
            start = i + 1;
          }
        }
      }

      // look forwards for the end symbol
      if (start && !end) {
        for (var i = start, len = chars.length; i < len && !end; i++) {
          if (chars[i] == symb) {
            end = i;
          }
        }
      }

      // nothing found
      // FIXME still enters insert mode
      if (!start || !end) return {
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

    function buildVimKeyMap() {
      /**
       * Handle the raw key event from CodeMirror. Translate the
       * Shift + key modifier to the resulting letter, while preserving other
       * modifers.
       */
      // TODO: Figure out a way to catch capslock.
      function handleKeyEvent_(cm, key, modifier) {
        if (isUpperCase(key)) {
          // Convert to lower case if shift is not the modifier since the key
          // we get from CodeMirror is always upper case.
          if (modifier == 'Shift') {
            modifier = null;
          }
          else {
            key = key.toLowerCase();
          }
        }
        if (modifier) {
          // Vim will parse modifier+key combination as a single key.
          key = modifier + '-' + key;
        }
        vim.handleKey(cm, key);
      }

      // Closure to bind CodeMirror, key, modifier.
      function keyMapper(key, modifier) {
        return function(cm) {
          handleKeyEvent_(cm, key, modifier);
        };
      }

      var modifiers = ['Shift', 'Ctrl'];
      var keyMap = {
        'nofallthrough': true,
        'style': 'fat-cursor'
      };
      function bindKeys(keys, modifier) {
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          if (!modifier && inArray(key, specialSymbols)) {
            // Wrap special symbols with '' because that's how CodeMirror binds
            // them.
            key = "'" + key + "'";
          }
          if (modifier) {
            keyMap[modifier + '-' + key] = keyMapper(keys[i], modifier);
          } else {
            keyMap[key] = keyMapper(keys[i]);
          }
        }
      }
      bindKeys(upperCaseAlphabet);
      bindKeys(upperCaseAlphabet, 'Shift');
      bindKeys(upperCaseAlphabet, 'Ctrl');
      bindKeys(specialSymbols);
      bindKeys(specialSymbols, 'Ctrl');
      bindKeys(numbers);
      bindKeys(numbers, 'Ctrl');
      bindKeys(specialKeys);
      bindKeys(specialKeys, 'Ctrl');
      return keyMap;
    }
    CodeMirror.keyMap.vim = buildVimKeyMap();

    function exitInsertMode(cm) {
      cm.setCursor(cm.getCursor().line, cm.getCursor().ch-1, true);
      cm.setOption('keyMap', 'vim');
    }

    CodeMirror.keyMap['vim-insert'] = {
      // TODO: override navigation keys so that Esc will cancel automatic
      // indentation from o, O, i_<CR>
      'Esc': exitInsertMode,
      'Ctrl-[': exitInsertMode,
      'Ctrl-C': exitInsertMode,
      'Ctrl-N': 'autocomplete',
      'Ctrl-P': 'autocomplete',
      fallthrough: ['default']
    };

    return vimApi;
  };
  // Initialize Vim and make it available as an API.
  var vim = Vim();
  CodeMirror.Vim = vim;
}
)();
