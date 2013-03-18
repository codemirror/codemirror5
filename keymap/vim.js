/**
 * Supported keybindings:
 *
 *   Motion:
 *   h, j, k, l
 *   gj, gk
 *   e, E, w, W, b, B, ge, gE
 *   f<character>, F<character>, t<character>, T<character>
 *   $, ^, 0, -, +, _
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
 *   x, X, D, Y, C, ~
 *
 *   Action:
 *   a, i, s, A, I, S, o, O
 *   zz, z., z<CR>, zt, zb, z-
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
    { keys: ['s'], type: 'keyToKey', toKeys: ['c', 'l'] },
    { keys: ['S'], type: 'keyToKey', toKeys: ['c', 'c'] },
    { keys: ['Home'], type: 'keyToKey', toKeys: ['0'] },
    { keys: ['End'], type: 'keyToKey', toKeys: ['$'] },
    { keys: ['PageUp'], type: 'keyToKey', toKeys: ['Ctrl-b'] },
    { keys: ['PageDown'], type: 'keyToKey', toKeys: ['Ctrl-f'] },
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
    { keys: ['g','j'], type: 'motion',
        motion: 'moveByDisplayLines',
        motionArgs: { forward: true }},
    { keys: ['g','k'], type: 'motion',
        motion: 'moveByDisplayLines',
        motionArgs: { forward: false }},
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
    { keys: ['{'], type: 'motion', motion: 'moveByParagraph',
        motionArgs: { forward: false }},
    { keys: ['}'], type: 'motion', motion: 'moveByParagraph',
        motionArgs: { forward: true }},
    { keys: ['Ctrl-f'], type: 'motion',
        motion: 'moveByPage', motionArgs: { forward: true }},
    { keys: ['Ctrl-b'], type: 'motion',
        motion: 'moveByPage', motionArgs: { forward: false }},
    { keys: ['g', 'g'], type: 'motion',
        motion: 'moveToLineOrEdgeOfDocument',
        motionArgs: { forward: false, explicitRepeat: true, linewise: true }},
    { keys: ['G'], type: 'motion',
        motion: 'moveToLineOrEdgeOfDocument',
        motionArgs: { forward: true, explicitRepeat: true, linewise: true }},
    { keys: ['0'], type: 'motion', motion: 'moveToStartOfLine' },
    { keys: ['^'], type: 'motion',
        motion: 'moveToFirstNonWhiteSpaceCharacter' },
    { keys: ['+'], type: 'motion',
        motion: 'moveByLines',
        motionArgs: { forward: true, toFirstChar:true }},
    { keys: ['-'], type: 'motion',
        motion: 'moveByLines',
        motionArgs: { forward: false, toFirstChar:true }},
    { keys: ['_'], type: 'motion',
        motion: 'moveByLines',
        motionArgs: { forward: true, toFirstChar:true, repeatOffset:-1 }},
    { keys: ['$'], type: 'motion',
        motion: 'moveToEol',
        motionArgs: { inclusive: true }},
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
    { keys: [']', '`',], type: 'motion', motion: 'jumpToMark', motionArgs: { forward: true } },
    { keys: ['[', '`',], type: 'motion', motion: 'jumpToMark', motionArgs: { forward: false } },
    { keys: [']', '\''], type: 'motion', motion: 'jumpToMark', motionArgs: { forward: true, linewise: true } },
    { keys: ['[', '\''], type: 'motion', motion: 'jumpToMark', motionArgs: { forward: false, linewise: true } },
    { keys: ['|'], type: 'motion',
        motion: 'moveToColumn',
        motionArgs: { }},
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
    { keys: ['n'], type: 'motion', motion: 'findNext',
        motionArgs: { forward: true }},
    { keys: ['N'], type: 'motion', motion: 'findNext',
        motionArgs: { forward: false }},
    // Operator-Motion dual commands
    { keys: ['x'], type: 'operatorMotion', operator: 'delete',
        motion: 'moveByCharacters', motionArgs: { forward: true },
        operatorMotionArgs: { visualLine: false }},
    { keys: ['X'], type: 'operatorMotion', operator: 'delete',
        motion: 'moveByCharacters', motionArgs: { forward: false },
        operatorMotionArgs: { visualLine: true }},
    { keys: ['D'], type: 'operatorMotion', operator: 'delete',
      motion: 'moveToEol', motionArgs: { inclusive: true },
        operatorMotionArgs: { visualLine: true }},
    { keys: ['Y'], type: 'operatorMotion', operator: 'yank',
        motion: 'moveToEol', motionArgs: { inclusive: true },
        operatorMotionArgs: { visualLine: true }},
    { keys: ['C'], type: 'operatorMotion',
        operator: 'change', operatorArgs: { enterInsertMode: true },
        motion: 'moveToEol', motionArgs: { inclusive: true },
        operatorMotionArgs: { visualLine: true }},
    { keys: ['~'], type: 'operatorMotion', operator: 'swapcase',
        motion: 'moveByCharacters', motionArgs: { forward: true }},
    // Actions
    { keys: ['a'], type: 'action', action: 'enterInsertMode',
        actionArgs: { insertAt: 'charAfter' }},
    { keys: ['A'], type: 'action', action: 'enterInsertMode',
        actionArgs: { insertAt: 'eol' }},
    { keys: ['i'], type: 'action', action: 'enterInsertMode' },
    { keys: ['I'], type: 'action', action: 'enterInsertMode',
        motion: 'moveToFirstNonWhiteSpaceCharacter' },
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
    { keys: ['z', 'z'], type: 'action', action: 'scrollToCursor',
        actionArgs: { position: 'center' }},
    { keys: ['z', '.'], type: 'action', action: 'scrollToCursor',
        actionArgs: { position: 'center' },
        motion: 'moveToFirstNonWhiteSpaceCharacter' },
    { keys: ['z', 't'], type: 'action', action: 'scrollToCursor',
        actionArgs: { position: 'top' }},
    { keys: ['z', 'Enter'], type: 'action', action: 'scrollToCursor',
        actionArgs: { position: 'top' },
        motion: 'moveToFirstNonWhiteSpaceCharacter' },
    { keys: ['z', '-'], type: 'action', action: 'scrollToCursor',
        actionArgs: { position: 'bottom' }},
    { keys: ['z', 'b'], type: 'action', action: 'scrollToCursor',
        actionArgs: { position: 'bottom' },
        motion: 'moveToFirstNonWhiteSpaceCharacter' },
    { keys: ['.'], type: 'action', action: 'repeatLastEdit' },
    // Text object motions
    { keys: ['a', 'character'], type: 'motion',
        motion: 'textObjectManipulation' },
    { keys: ['i', 'character'], type: 'motion',
        motion: 'textObjectManipulation',
        motionArgs: { textObjectInner: true }},
    // Search
    { keys: ['/'], type: 'search',
        searchArgs: { forward: true, querySrc: 'prompt' }},
    { keys: ['?'], type: 'search',
        searchArgs: { forward: false, querySrc: 'prompt' }},
    { keys: ['*'], type: 'search',
        searchArgs: { forward: true, querySrc: 'wordUnderCursor' }},
    { keys: ['#'], type: 'search',
        searchArgs: { forward: false, querySrc: 'wordUnderCursor' }},
    // Ex command
    { keys: [':'], type: 'ex' }
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
        'Esc', 'Home', 'End', 'PageUp', 'PageDown', 'Enter'];
    var validMarks = upperCaseAlphabet.concat(lowerCaseAlphabet).concat(
        numbers).concat(['<', '>']);
    var validRegisters = upperCaseAlphabet.concat(lowerCaseAlphabet).concat(
        numbers).concat('-\"'.split(''));

    function isAlphabet(k) {
      return alphabetRegex.test(k);
    }
    function isLine(cm, line) {
      return line >= cm.firstLine() && line <= cm.lastLine();
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
      return (/^[\w]$/).test(k);
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
        if (arr[i] == val) {
          return true;
        }
      }
      return false;
    }

    // Global Vim state. Call getVimGlobalState to get and initialize.
    var vimGlobalState;
    function getVimGlobalState() {
      if (!vimGlobalState) {
        vimGlobalState = {
          // The current search query.
          searchQuery: null,
          // Whether we are searching backwards.
          searchIsReversed: false,
          registerController: new RegisterController({})
        };
      }
      return vimGlobalState;
    }
    function getVimState(cm) {
      if (!cm.vimState) {
        // Store instance state in the CodeMirror object.
        cm.vimState = {
          inputState: new InputState(),
          // When using jk for navigation, if you move from a longer line to a
          // shorter line, the cursor may clip to the end of the shorter line.
          // If j is pressed again and cursor goes to the next line, the
          // cursor should go back to its horizontal position on the longer
          // line if it can. This is to keep track of the horizontal position.
          lastHPos: -1,
          // Doing the same with screen-position for gj/gk
          lastHSPos: -1,
          // The last motion command run. Cleared if a non-motion command gets
          // executed in between.
          lastMotion: null,
          marks: {},
          visualMode: false,
          // If we are in visual line mode. No effect if visualMode is false.
          visualLine: false
        };
      }
      return cm.vimState;
    }

    var vimApi= {
      buildKeyMap: function() {
        // TODO: Convert keymap into dictionary format for fast lookup.
      },
      // Testing hook, though it might be useful to expose the register
      // controller anyways.
      getRegisterController: function() {
        return getVimGlobalState().registerController;
      },
      // Testing hook.
      clearVimGlobalState_: function() {
        vimGlobalState = null;
      },
      map: function(lhs, rhs) {
        // Add user defined key bindings.
        exCommandDispatcher.map(lhs, rhs);
      },
      defineEx: function(name, prefix, func){
        if (name.indexOf(prefix) === 0) {
          exCommands[name]=func;
          exCommandDispatcher.commandMap_[prefix]={name:name, shortName:prefix, type:'api'};
        }else throw new Error("(Vim.defineEx) \""+prefix+"\" is not a prefix of \""+name+"\", command not registered");
      },
      // Initializes vim state variable on the CodeMirror object. Should only be
      // called lazily by handleKey or for testing.
      maybeInitState: function(cm) {
        getVimState(cm);
      },
      // This is the outermost function called by CodeMirror, after keys have
      // been mapped to their Vim equivalents.
      handleKey: function(cm, key) {
        var command;
        var vim = getVimState(cm);
        if (key == 'Esc') {
          // Clear input state and get back to normal mode.
          vim.inputState = new InputState();
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
        if (!vim.visualMode &&
            !cursorEqual(cm.getCursor('head'), cm.getCursor('anchor'))) {
          vim.visualMode = true;
          vim.visualLine = false;
        }
        if (key != '0' || (key == '0' && vim.inputState.getRepeat() === 0)) {
          // Have to special case 0 since it's both a motion and a number.
          command = commandDispatcher.matchCommand(key, defaultKeymap, vim);
        }
        if (!command) {
          if (isNumber(key)) {
            // Increment count unless count is 0 and key is 0.
            vim.inputState.pushRepeatDigit(key);
          }
          return;
        }
        if (command.type == 'keyToKey') {
          // TODO: prevent infinite recursion.
          for (var i = 0; i < command.toKeys.length; i++) {
            this.handleKey(cm, command.toKeys[i]);
          }
        } else {
          commandDispatcher.processCommand(cm, vim, command);
        }
      }
    };

    // Represents the current input state.
    function InputState() {
      this.prefixRepeat = [];
      this.motionRepeat = [];

      this.operator = null;
      this.operatorArgs = null;
      this.motion = null;
      this.motionArgs = null;
      this.keyBuffer = []; // For matching multi-key commands.
      this.registerName = null; // Defaults to the unamed register.
    }
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

    /*
     * Register stores information about copy and paste registers.  Besides
     * text, a register must store whether it is linewise (i.e., when it is
     * pasted, should it insert itself into a new line, or should the text be
     * inserted at the cursor position.)
     */
    function Register(text, linewise) {
      this.clear();
      if (text) {
        this.set(text, linewise);
      }
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
      },
      toString: function() { return this.text; }
    };

    /*
     * vim registers allow you to keep many independent copy and paste buffers.
     * See http://usevim.com/2012/04/13/registers/ for an introduction.
     *
     * RegisterController keeps the state of all the registers.  An initial
     * state may be passed in.  The unnamed register '"' will always be
     * overridden.
     */
    function RegisterController(registers) {
      this.registers = registers;
      this.unamedRegister = registers['\"'] = new Register();
    }
    RegisterController.prototype = {
      pushText: function(registerName, operator, text, linewise) {
        // Lowercase and uppercase registers refer to the same register.
        // Uppercase just means append.
        var register = this.isValidRegister(registerName) ?
            this.getRegister(registerName) : null;
        // if no register/an invalid register was specified, things go to the
        // default registers
        if (!register) {
          switch (operator) {
            case 'yank':
              // The 0 register contains the text from the most recent yank.
              this.registers['0'] = new Register(text, linewise);
              break;
            case 'delete':
            case 'change':
              if (text.indexOf('\n') == -1) {
                // Delete less than 1 line. Update the small delete register.
                this.registers['-'] = new Register(text, linewise);
              } else {
                // Shift down the contents of the numbered registers and put the
                // deleted text into register 1.
                this.shiftNumericRegisters_();
                this.registers['1'] = new Register(text, linewise);
              }
              break;
          }
          // Make sure the unnamed register is set to what just happened
          this.unamedRegister.set(text, linewise);
          return;
        }

        // If we've gotten to this point, we've actually specified a register
        var append = isUpperCase(registerName);
        if (append) {
          register.append(text, linewise);
          // The unamed register always has the same value as the last used
          // register.
          this.unamedRegister.append(text, linewise);
        } else {
          register.set(text, linewise);
          this.unamedRegister.set(text, linewise);
        }
      },
      // Gets the register named @name.  If one of @name doesn't already exist,
      // create it.  If @name is invalid, return the unamedRegister.
      getRegister: function(name) {
        if (!this.isValidRegister(name)) {
          return this.unamedRegister;
        }
        name = name.toLowerCase();
        if (!this.registers[name]) {
          this.registers[name] = new Register();
        }
        return this.registers[name];
      },
      isValidRegister: function(name) {
        return name && inArray(name, validRegisters);
      },
      shiftNumericRegisters_: function() {
        for (var i = 9; i >= 2; i--) {
          this.registers[i] = this.getRegister('' + (i - 1));
        }
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
                if(inputState.selectedCharacter.length>1){
                  switch(inputState.selectedCharacter){
                    case "Enter":
                      inputState.selectedCharacter='\n';
                      break;
                    case "Space":
                      inputState.selectedCharacter=' ';
                      break;
                    default:
                      continue;
                  }
                }
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
        vim.inputState.repeatOverride = command.repeatOverride;
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
          case 'search':
            this.processSearch(cm, vim, command);
            break;
          case 'ex':
          case 'keyToEx':
            this.processEx(cm, vim, command);
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
            vim.inputState = new InputState();
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
        vim.inputState = new InputState();
        vim.lastMotion = null,
        actions[command.action](cm, actionArgs, vim);
      },
      processSearch: function(cm, vim, command) {
        if (!cm.getSearchCursor) {
          // Search depends on SearchCursor.
          return;
        }
        var forward = command.searchArgs.forward;
        getSearchState(cm).setReversed(!forward);
        var promptPrefix = (forward) ? '/' : '?';
        var originalQuery = getSearchState(cm).getQuery();
        var originalScrollPos = cm.getScrollInfo();
        function handleQuery(query, ignoreCase, smartCase) {
          try {
            updateSearchQuery(cm, query, ignoreCase, smartCase);
          } catch (e) {
            showConfirm(cm, 'Invalid regex: ' + regexPart);
            return;
          }
          commandDispatcher.processMotion(cm, vim, {
            type: 'motion',
            motion: 'findNext',
            motionArgs: { forward: true }
          });
        }
        function onPromptClose(query) {
          cm.scrollTo(originalScrollPos.left, originalScrollPos.top);
          handleQuery(query, true /** ignoreCase */, true /** smartCase */);
        }
        function onPromptKeyUp(e, query) {
          var parsedQuery;
          try {
            parsedQuery = updateSearchQuery(cm, query,
                true /** ignoreCase */, true /** smartCase */)
          } catch (e) {
            // Swallow bad regexes for incremental search.
          }
          if (parsedQuery) {
            cm.scrollIntoView(findNext(cm, !forward, parsedQuery), 30);
          } else {
            clearSearchHighlight(cm);
            cm.scrollTo(originalScrollPos.left, originalScrollPos.top);
          }
        }
        function onPromptKeyDown(e, query, close) {
          var keyName = CodeMirror.keyName(e);
          if (keyName == 'Esc' || keyName == 'Ctrl-C' || keyName == 'Ctrl-[') {
            updateSearchQuery(cm, originalQuery);
            clearSearchHighlight(cm);
            cm.scrollTo(originalScrollPos.left, originalScrollPos.top);

            CodeMirror.e_stop(e);
            close();
            cm.focus();
          }
        }
        switch (command.searchArgs.querySrc) {
          case 'prompt':
            showPrompt(cm, {
                onClose: onPromptClose,
                prefix: promptPrefix,
                desc: searchPromptDesc,
                onKeyUp: onPromptKeyUp,
                onKeyDown: onPromptKeyDown
            });
            break;
          case 'wordUnderCursor':
            var word = expandWordUnderCursor(cm, false /** inclusive */,
                true /** forward */, false /** bigWord */,
                true /** noSymbol */);
            var isKeyword = true;
            if (!word) {
              word = expandWordUnderCursor(cm, false /** inclusive */,
                  true /** forward */, false /** bigWord */,
                  false /** noSymbol */);
              isKeyword = false;
            }
            if (!word) {
              return;
            }
            var query = cm.getLine(word.start.line).substring(word.start.ch,
                word.end.ch + 1);
            if (isKeyword) {
              query = '\\b' + query + '\\b';
            } else {
              query = escapeRegex(query);
            }
            cm.setCursor(word.start);
            handleQuery(query, true /** ignoreCase */, false /** smartCase */);
            break;
        }
      },
      processEx: function(cm, vim, command) {
        function onPromptClose(input) {
          exCommandDispatcher.processCommand(cm, input);
        }
        function onPromptKeyDown(e, input, close) {
          var keyName = CodeMirror.keyName(e);
          if (keyName == 'Esc' || keyName == 'Ctrl-C' || keyName == 'Ctrl-[') {
            CodeMirror.e_stop(e);
            close();
            cm.focus();
          }
        }
        if (command.type == 'keyToEx') {
          // Handle user defined Ex to Ex mappings
          exCommandDispatcher.processCommand(cm, command.exArgs.input);
        } else {
          if (vim.visualMode) {
            showPrompt(cm, { onClose: onPromptClose, prefix: ':', value: '\'<,\'>',
                onKeyDown: onPromptKeyDown});
          } else {
            showPrompt(cm, { onClose: onPromptClose, prefix: ':',
                onKeyDown: onPromptKeyDown});
          }
        }
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
        var curOriginal = copyCursor(curStart);
        var curEnd;
        var repeat;
        if (operator) {
          this.recordLastEdit(cm, vim, inputState);
        }
        if (inputState.repeatOverride !== undefined) {
          // If repeatOverride is specified, that takes precedence over the
          // input state's repeat. Used by Ex mode and can be user defined.
          repeat = inputState.repeatOverride;
        } else {
          repeat = inputState.getRepeat();
        }
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
        vim.inputState = new InputState();
        if (motion) {
          var motionResult = motions[motion](cm, motionArgs, vim);
          vim.lastMotion = motions[motion];
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
            cm.setSelection(selectionStart, selectionEnd);
            updateMark(cm, vim, '<',
                cursorIsBefore(selectionStart, selectionEnd) ? selectionStart
                    : selectionEnd);
            updateMark(cm, vim, '>',
                cursorIsBefore(selectionStart, selectionEnd) ? selectionEnd
                    : selectionStart);
          } else if (!operator) {
            curEnd = clipCursorToContent(cm, curEnd);
            cm.setCursor(curEnd.line, curEnd.ch);
          }
        }

        if (operator) {
          var inverted = false;
          vim.lastMotion = null;
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
            inverted = true;
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
              curEnd, curOriginal);
          if (vim.visualMode) {
            exitVisualMode(cm, vim);
          }
          if (operatorArgs.enterInsertMode) {
            actions.enterInsertMode(cm);
          }
        }
      },
      recordLastEdit: function(cm, vim, inputState) {
        vim.lastEdit = inputState;
      }
    };

    /**
     * typedef {Object{line:number,ch:number}} Cursor An object containing the
     *     position of the cursor.
     */
    // All of the functions below return Cursor objects.
    var motions = {
      expandToLine: function(cm, motionArgs) {
        // Expands forward to end of line, and then to next line if repeat is
        // >1. Does not handle backward motion!
        var cur = cm.getCursor();
        return { line: cur.line + motionArgs.repeat - 1, ch: Infinity };
      },
      findNext: function(cm, motionArgs, vim) {
        var state = getSearchState(cm);
        var query = state.getQuery();
        if (!query) {
          return;
        }
        var prev = !motionArgs.forward;
        // If search is initiated with ? instead of /, negate direction.
        prev = (state.isReversed()) ? !prev : prev;
        highlightSearchMatches(cm, query);
        return findNext(cm, prev/** prev */, query, motionArgs.repeat);
      },
      goToMark: function(cm, motionArgs, vim) {
        var mark = vim.marks[motionArgs.selectedCharacter];
        if (mark) {
          return mark.find();
        }
        return null;
      },
      jumpToMark: function(cm, motionArgs, vim) {
        var best = cm.getCursor(); 
        for (var i = 0; i < motionArgs.repeat; i++) {
          var cursor = best;
          for (var key in vim.marks) {
            if (!isLowerCase(key)) {
              continue;
            }
            var mark = vim.marks[key].find();
            var isWrongDirection = (motionArgs.forward) ?
              cursorIsBefore(mark, cursor) : cursorIsBefore(cursor, mark)

            if (isWrongDirection) {
              continue;
            }
            if (motionArgs.linewise && (mark.line == cursor.line)) {
              continue;
            }

            var equal = cursorEqual(cursor, best);
            var between = (motionArgs.forward) ? 
              cusrorIsBetween(cursor, mark, best) :
              cusrorIsBetween(best, mark, cursor);

            if (equal || between) {
              best = mark;
            }
          }
        }

        if (motionArgs.linewise) {
          // Vim places the cursor on the first non-whitespace character of
          // the line if there is one, else it places the cursor at the end
          // of the line, regardless of whether a mark was found.
          best.ch = findFirstNonWhiteSpaceCharacter(cm.getLine(best.line));
        }
        return best;
      },
      moveByCharacters: function(cm, motionArgs) {
        var cur = cm.getCursor();
        var repeat = motionArgs.repeat;
        var ch = motionArgs.forward ? cur.ch + repeat : cur.ch - repeat;
        return { line: cur.line, ch: ch };
      },
      moveByLines: function(cm, motionArgs, vim) {
        var cur = cm.getCursor();
        var endCh = cur.ch;
        // Depending what our last motion was, we may want to do different
        // things. If our last motion was moving vertically, we want to
        // preserve the HPos from our last horizontal move.  If our last motion
        // was going to the end of a line, moving vertically we should go to
        // the end of the line, etc.
        switch (vim.lastMotion) {
          case this.moveByLines:
          case this.moveByDisplayLines:
          case this.moveToColumn:
          case this.moveToEol:
            endCh = vim.lastHPos;
            break;
          default:
            vim.lastHPos = endCh;
        }
        var repeat = motionArgs.repeat+(motionArgs.repeatOffset||0);
        var line = motionArgs.forward ? cur.line + repeat : cur.line - repeat;
        if (line < cm.firstLine() || line > cm.lastLine() ) {
          return null;
        }
        if(motionArgs.toFirstChar){
          endCh=findFirstNonWhiteSpaceCharacter(cm.getLine(line));
          vim.lastHPos = endCh;
        }
        vim.lastHSPos = cm.charCoords({line:line, ch:endCh},"div").left;
        return { line: line, ch: endCh };
      },
      moveByDisplayLines: function(cm, motionArgs, vim) {
        var cur = cm.getCursor();
        switch (vim.lastMotion) {
          case this.moveByDisplayLines:
          case this.moveByLines:
          case this.moveToColumn:
          case this.moveToEol:
            break;
          default:
            vim.lastHSPos = cm.charCoords(cur,"div").left;
        }
        var repeat = motionArgs.repeat;
        var res=cm.findPosV(cur,(motionArgs.forward ? repeat : -repeat),"line",vim.lastHSPos);
        if(res.hitSide)return null;
        vim.lastHPos = res.ch;
        return res;
      },
      moveByPage: function(cm, motionArgs) {
        // CodeMirror only exposes functions that move the cursor page down, so
        // doing this bad hack to move the cursor and move it back. evalInput
        // will move the cursor to where it should be in the end.
        var curStart = cm.getCursor();
        var repeat = motionArgs.repeat;
        cm.moveV((motionArgs.forward ? repeat : -repeat), 'page');
        var curEnd = cm.getCursor();
        cm.setCursor(curStart);
        return curEnd;
      },
      moveByParagraph: function(cm, motionArgs) {
        var line = cm.getCursor().line;
        var repeat = motionArgs.repeat;
        var inc = motionArgs.forward ? 1 : -1;
        for (var i = 0; i < repeat; i++) {
          if ((!motionArgs.forward && line === cm.firstLine() ) ||
              (motionArgs.forward && line == cm.lastLine())) {
            break;
          }
          line += inc;
          while (line !== cm.firstLine() && line != cm.lastLine() && cm.getLine(line)) {
            line += inc;
          }
        }
        return { line: line, ch: 0 };
      },
      moveByWords: function(cm, motionArgs) {
        return moveToWord(cm, motionArgs.repeat, !!motionArgs.forward,
            !!motionArgs.wordEnd, !!motionArgs.bigWord);
      },
      moveTillCharacter: function(cm, motionArgs) {
        var repeat = motionArgs.repeat;
        var curEnd = moveToCharacter(cm, repeat, motionArgs.forward,
            motionArgs.selectedCharacter);
        if(!curEnd)return cm.getCursor();
        var increment = motionArgs.forward ? -1 : 1;
        curEnd.ch += increment;
        return curEnd;
      },
      moveToCharacter: function(cm, motionArgs) {
        var repeat = motionArgs.repeat;
        return moveToCharacter(cm, repeat, motionArgs.forward,
            motionArgs.selectedCharacter) || cm.getCursor();
      },
      moveToColumn: function(cm, motionArgs, vim) {
        var repeat = motionArgs.repeat;
        // repeat is equivalent to which column we want to move to!
        vim.lastHPos = repeat - 1;
        vim.lastHSPos = cm.charCoords(cm.getCursor(),"div").left;
        return moveToColumn(cm, repeat);
      },
      moveToEol: function(cm, motionArgs, vim) {
        var cur = cm.getCursor();
        vim.lastHPos = Infinity;
        var retval={ line: cur.line + motionArgs.repeat - 1, ch: Infinity }
        var end=cm.clipPos(retval);
        end.ch--;
        vim.lastHSPos = cm.charCoords(end,"div").left;
        return retval;
      },
      moveToFirstNonWhiteSpaceCharacter: function(cm) {
        // Go to the start of the line where the text begins, or the end for
        // whitespace-only lines
        var cursor = cm.getCursor();
        return { line: cursor.line,
            ch: findFirstNonWhiteSpaceCharacter(cm.getLine(cursor.line)) };
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
        var lineNum = motionArgs.forward ? cm.lastLine() : cm.firstLine();
        if (motionArgs.repeatIsExplicit) {
          lineNum = motionArgs.repeat - cm.getOption('firstLineNumber');
        }
        return { line: lineNum,
            ch: findFirstNonWhiteSpaceCharacter(cm.getLine(lineNum)) };
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
        getVimGlobalState().registerController.pushText(
            operatorArgs.registerName, 'change', cm.getRange(curStart, curEnd),
            operatorArgs.linewise);
        if (operatorArgs.linewise) {
          // Delete starting at the first nonwhitespace character of the first
          // line, instead of from the start of the first line. This way we get
          // an indent when we get into insert mode. This behavior isn't quite
          // correct because we should treat this as a completely new line, and
          // indent should be whatever codemirror thinks is the right indent.
          // But cm.indentLine doesn't seem work on empty lines.
          // TODO: Fix the above.
          curStart.ch =
              findFirstNonWhiteSpaceCharacter(cm.getLine(curStart.line));
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
        getVimGlobalState().registerController.pushText(
            operatorArgs.registerName, 'delete', cm.getRange(curStart, curEnd),
            operatorArgs.linewise);
        cm.replaceRange('', curStart, curEnd);
        if (operatorArgs.linewise) {
          cm.setCursor(motions.moveToFirstNonWhiteSpaceCharacter(cm));
        } else {
          cm.setCursor(curStart);
        }
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
      swapcase: function(cm, operatorArgs, vim, curStart, curEnd, curOriginal) {
        var toSwap = cm.getRange(curStart, curEnd);
        var swapped = '';
        for (var i = 0; i < toSwap.length; i++) {
          var character = toSwap.charAt(i);
          swapped += isUpperCase(character) ? character.toLowerCase() :
              character.toUpperCase();
        }
        cm.replaceRange(swapped, curStart, curEnd);
        cm.setCursor(curOriginal);
      },
      yank: function(cm, operatorArgs, vim, curStart, curEnd, curOriginal) {
        getVimGlobalState().registerController.pushText(
            operatorArgs.registerName, 'yank',
            cm.getRange(curStart, curEnd), operatorArgs.linewise);
        cm.setCursor(curOriginal);
      }
    };

    var actions = {
      scrollToCursor: function(cm, actionArgs) {
        var lineNum = cm.getCursor().line;
        var heightProp = window.getComputedStyle(cm.getScrollerElement()).
            getPropertyValue('height');
        var height = parseInt(heightProp);
        var y = cm.charCoords({line: lineNum, ch: 0}, "local").top;
        var halfHeight = parseInt(height) / 2;
        switch (actionArgs.position) {
          case 'center': y = y - (height / 2) + 10;
              break;
          case 'bottom': y = y - height;
              break;
          case 'top': break;
        }
        cm.scrollTo(null, y);
        // The calculations are slightly off, use scrollIntoView to nudge the
        // view into the right place.
        cm.scrollIntoView();
      },
      enterInsertMode: function(cm, actionArgs) {
        var insertAt = (actionArgs) ? actionArgs.insertAt : null;
        if (insertAt == 'eol') {
          var cursor = cm.getCursor();
          cursor = { line: cursor.line, ch: lineLength(cm, cursor.line) };
          cm.setCursor(cursor);
        } else if (insertAt == 'charAfter') {
          cm.setCursor(offsetCursor(cm.getCursor(), 0, 1));
        }
        cm.setOption('keyMap', 'vim-insert');
      },
      toggleVisualMode: function(cm, actionArgs, vim) {
        var repeat = actionArgs.repeat;
        var curStart = cm.getCursor();
        var curEnd;
        // TODO: The repeat should actually select number of characters/lines
        //     equal to the repeat times the size of the previous visual
        //     operation.
        if (!vim.visualMode) {
          vim.visualMode = true;
          vim.visualLine = !!actionArgs.linewise;
          if (vim.visualLine) {
            curStart.ch = 0;
            curEnd = clipCursorToContent(cm, {
              line: curStart.line + repeat - 1,
              ch: lineLength(cm, curStart.line)
            }, true /** includeLineBreak */);
          } else {
            curEnd = clipCursorToContent(cm, {
              line: curStart.line,
              ch: curStart.ch + repeat
            }, true /** includeLineBreak */);
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
          curStart = cm.getCursor('anchor');
          curEnd = cm.getCursor('head');
          if (!vim.visualLine && actionArgs.linewise) {
            // Shift-V pressed in characterwise visual mode. Switch to linewise
            // visual mode instead of exiting visual mode.
            vim.visualLine = true;
            curStart.ch = cursorIsBefore(curStart, curEnd) ? 0 :
                lineLength(cm, curStart.line);
            curEnd.ch = cursorIsBefore(curStart, curEnd) ?
                lineLength(cm, curEnd.line) : 0;
            cm.setSelection(curStart, curEnd);
          } else if (vim.visualLine && !actionArgs.linewise) {
            // v pressed in linewise visual mode. Switch to characterwise visual
            // mode instead of exiting visual mode.
            vim.visualLine = false;
          } else {
            exitVisualMode(cm, vim);
          }
        }
        updateMark(cm, vim, '<', cursorIsBefore(curStart, curEnd) ? curStart
            : curEnd);
        updateMark(cm, vim, '>', cursorIsBefore(curStart, curEnd) ? curEnd
            : curStart);
      },
      joinLines: function(cm, actionArgs, vim) {
        var curStart, curEnd;
        if (vim.visualMode) {
          curStart = cm.getCursor('anchor');
          curEnd = cm.getCursor('head');
          curEnd.ch = lineLength(cm, curEnd.line) - 1;
        } else {
          // Repeat is the number of lines to join. Minimum 2 lines.
          var repeat = Math.max(actionArgs.repeat, 2);
          curStart = cm.getCursor();
          curEnd = clipCursorToContent(cm, { line: curStart.line + repeat - 1,
              ch: Infinity });
        }
        var finalCh = 0;
        cm.operation(function() {
          for (var i = curStart.line; i < curEnd.line; i++) {
            finalCh = lineLength(cm, curStart.line);
            var tmp = { line: curStart.line + 1,
                ch: lineLength(cm, curStart.line + 1) };
            var text = cm.getRange(curStart, tmp);
            text = text.replace(/\n\s*/g, ' ');
            cm.replaceRange(text, curStart, tmp);
          }
          var curFinalPos = { line: curStart.line, ch: finalCh };
          cm.setCursor(curFinalPos);
        });
      },
      newLineAndEnterInsertMode: function(cm, actionArgs) {
        var insertAt = cm.getCursor();
        if (insertAt.line === cm.firstLine() && !actionArgs.after) {
          // Special case for inserting newline before start of document.
          cm.replaceRange('\n', { line: cm.firstLine(), ch: 0 });
          cm.setCursor(cm.firstLine(), 0);
        } else {
          insertAt.line = (actionArgs.after) ? insertAt.line :
              insertAt.line - 1;
          insertAt.ch = lineLength(cm, insertAt.line);
          cm.setCursor(insertAt);
          var newlineFn = CodeMirror.commands.newlineAndIndentContinueComment ||
              CodeMirror.commands.newlineAndIndent;
          newlineFn(cm);
        }
        this.enterInsertMode(cm);
      },
      paste: function(cm, actionArgs, vim) {
        var cur = cm.getCursor();
        var register = getVimGlobalState().registerController.getRegister(
            actionArgs.registerName);
        if (!register.text) {
          return;
        }
        for (var text = '', i = 0; i < actionArgs.repeat; i++) {
          text += register.text;
        }
        var linewise = register.linewise;
        if (linewise) {
          if (actionArgs.after) {
            // Move the newline at the end to the start instead, and paste just
            // before the newline character of the line we are on right now.
            text = '\n' + text.slice(0, text.length - 1);
            cur.ch = lineLength(cm, cur.line);
          } else {
            cur.ch = 0;
          }
        } else {
          cur.ch += actionArgs.after ? 1 : 0;
        }
        cm.replaceRange(text, cur);
        // Now fine tune the cursor to where we want it.
        var curPosFinal;
        var idx;
        if (linewise && actionArgs.after) {
          curPosFinal = { line: cur.line + 1,
              ch: findFirstNonWhiteSpaceCharacter(cm.getLine(cur.line + 1)) };
        } else if (linewise && !actionArgs.after) {
          curPosFinal = { line: cur.line,
              ch: findFirstNonWhiteSpaceCharacter(cm.getLine(cur.line)) };
        } else if (!linewise && actionArgs.after) {
          idx = cm.indexFromPos(cur);
          curPosFinal = cm.posFromIndex(idx + text.length - 1);
        } else {
          idx = cm.indexFromPos(cur);
          curPosFinal = cm.posFromIndex(idx + text.length);
        }
        cm.setCursor(curPosFinal);
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
        updateMark(cm, vim, markName, cm.getCursor());
      },
      replace: function(cm, actionArgs, vim) {
        var replaceWith = actionArgs.selectedCharacter;
        var curStart = cm.getCursor();
        var replaceTo;
        var curEnd;
        if(vim.visualMode){
          curStart=cm.getCursor('start');
          curEnd=cm.getCursor('end');
          // workaround to catch the character under the cursor
          //  existing workaround doesn't cover actions
          curEnd=cm.clipPos({line: curEnd.line, ch: curEnd.ch+1});
        }else{
          var line = cm.getLine(curStart.line);
          replaceTo = curStart.ch + actionArgs.repeat;
          if (replaceTo > line.length) {
            replaceTo=line.length;
          }
          curEnd = { line: curStart.line, ch: replaceTo };
        }
        if(replaceWith=='\n'){
          if(!vim.visualMode) cm.replaceRange('', curStart, curEnd);
          // special case, where vim help says to replace by just one line-break
          (CodeMirror.commands.newlineAndIndentContinueComment || CodeMirror.commands.newlineAndIndent)(cm);
        }else {
          var replaceWithStr=cm.getRange(curStart, curEnd);
          //replace all characters in range by selected, but keep linebreaks
          replaceWithStr=replaceWithStr.replace(/[^\n]/g,replaceWith);
          cm.replaceRange(replaceWithStr, curStart, curEnd);
          if(vim.visualMode){
            cm.setCursor(curStart);
            exitVisualMode(cm,vim);
          }else{
            cm.setCursor(offsetCursor(curEnd, 0, -1));
          }
        }
      },
      repeatLastEdit: function(cm, actionArgs, vim) {
        // TODO: Make this repeat insert mode changes.
        var lastEdit = vim.lastEdit;
        if (lastEdit) {
          if (actionArgs.repeat && actionArgs.repeatIsExplicit) {
            vim.lastEdit.repeatOverride = actionArgs.repeat;
          }
          var currentInputState = vim.inputState;
          vim.inputState = vim.lastEdit;
          commandDispatcher.evalInput(cm, vim);
          vim.inputState = currentInputState;
        }
      }
    };

    var textObjects = {
      // TODO: lots of possible exceptions that can be thrown here. Try da(
      //     outside of a () block.
      // TODO: implement text objects for the reverse like }. Should just be
      //     an additional mapping after moving to the defaultKeyMap.
      'w': function(cm, inclusive) {
        return expandWordUnderCursor(cm, inclusive, true /** forward */,
            false /** bigWord */);
      },
      'W': function(cm, inclusive) {
        return expandWordUnderCursor(cm, inclusive,
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

    /*
     * Below are miscellaneous utility functions used by vim.js
     */

    /**
     * Clips cursor to ensure that line is within the buffer's range
     * If includeLineBreak is true, then allow cur.ch == lineLength.
     */
    function clipCursorToContent(cm, cur, includeLineBreak) {
      var line = Math.min(Math.max(cm.firstLine(), cur.line), cm.lastLine() );
      var maxCh = lineLength(cm, line) - 1;
      maxCh = (includeLineBreak) ? maxCh + 1 : maxCh;
      var ch = Math.min(Math.max(0, cur.ch), maxCh);
      return { line: line, ch: ch };
    }
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
    function offsetCursor(cur, offsetLine, offsetCh) {
      return { line: cur.line + offsetLine, ch: cur.ch + offsetCh };
    }
    function arrayEq(a1, a2) {
      if (a1.length != a2.length) {
        return false;
      }
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
      return { line: cur.line, ch: cur.ch };
    }
    function cursorEqual(cur1, cur2) {
      return cur1.ch == cur2.ch && cur1.line == cur2.line;
    }
    function cursorIsBefore(cur1, cur2) {
      if (cur1.line < cur2.line) {
        return true;
      } else if (cur1.line == cur2.line && cur1.ch < cur2.ch) {
        return true;
      }
      return false;
    }
    function cusrorIsBetween(cur1, cur2, cur3) {
      // returns true if cur2 is between cur1 and cur3.
      var cur1before2 = cursorIsBefore(cur1, cur2);
      var cur2before3 = cursorIsBefore(cur2, cur3);
      return cur1before2 && cur2before3;
    }
    function lineLength(cm, lineNum) {
      return cm.getLine(lineNum).length;
    }
    function reverse(s){
      return s.split("").reverse().join("");
    }
    function trim(s) {
      if (s.trim) {
        return s.trim();
      } else {
        return s.replace(/^\s+|\s+$/g, '');
      }
    }
    function escapeRegex(s) {
      return s.replace(/([.?*+$\[\]\/\\(){}|\-])/g, "\\$1");
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
        cm.setCursor(clipCursorToContent(cm, selectionEnd));
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
        curEnd.ch = lineLength(cm, curEnd.line);
      }
    }

    // Expand the selection to line ends.
    function expandSelectionToLine(cm, curStart, curEnd) {
      curStart.ch = 0;
      curEnd.ch = 0;
      curEnd.line++;
    }

    function findFirstNonWhiteSpaceCharacter(text) {
      if (!text) {
        return 0;
      }
      var firstNonWS = text.search(/\S/);
      return firstNonWS == -1 ? text.length : firstNonWS;
    }

    function expandWordUnderCursor(cm, inclusive, forward, bigWord, noSymbol) {
      var cur = cm.getCursor();
      var line = cm.getLine(cur.line);
      var idx = cur.ch;

      // Seek to first word or non-whitespace character, depending on if
      // noSymbol is true.
      var textAfterIdx = line.substring(idx);
      var firstMatchedChar;
      if (noSymbol) {
        firstMatchedChar = textAfterIdx.search(/\w/);
      } else {
        firstMatchedChar = textAfterIdx.search(/\S/);
      }
      if (firstMatchedChar == -1) {
        return null;
      }
      idx += firstMatchedChar;
      textAfterIdx = line.substring(idx);
      var textBeforeIdx = line.substring(0, idx);

      var matchRegex;
      // Greedy matchers for the "word" we are trying to expand.
      if (bigWord) {
        matchRegex = /^\S+/;
      } else {
        if ((/\w/).test(line.charAt(idx))) {
          matchRegex = /^\w+/;
        } else {
          matchRegex = /^[^\w\s]+/;
        }
      }

      var wordAfterRegex = matchRegex.exec(textAfterIdx);
      var wordStart = idx;
      var wordEnd = idx + wordAfterRegex[0].length - 1;
      // TODO: Find a better way to do this. It will be slow on very long lines.
      var wordBeforeRegex = matchRegex.exec(reverse(textBeforeIdx));
      if (wordBeforeRegex) {
        wordStart -= wordBeforeRegex[0].length;
      }

      if (inclusive) {
        wordEnd++;
      }

      return { start: { line: cur.line, ch: wordStart },
        end: { line: cur.line, ch: wordEnd }};
    }

    /*
     * Returns the boundaries of the next word. If the cursor in the middle of
     * the word, then returns the boundaries of the current word, starting at
     * the cursor. If the cursor is at the start/end of a word, and we are going
     * forward/backward, respectively, find the boundaries of the next word.
     *
     * @param {CodeMirror} cm CodeMirror object.
     * @param {Cursor} cur The cursor position.
     * @param {boolean} forward True to search forward. False to search
     *     backward.
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
                  line: lineNum };
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
     * @param {boolean} forward True to search forward. False to search
     *     backward.
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
            // Move to the word we just found. If by moving to the word we end
            // up in the same spot, then move an extra character and search
            // again.
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
            // No more words to be found. Move to the end.
            if (forward) {
              return { line: cur.line, ch: lineLength(cm, cur.line) };
            } else {
              return { line: cur.line, ch: 0 };
            }
          }
        }
      }
      return cur;
    }

    function moveToCharacter(cm, repeat, forward, character) {
      var cur = cm.getCursor();
      var start = cur.ch;
      var idx;
      for (var i = 0; i < repeat; i ++) {
        var line = cm.getLine(cur.line);
        idx = charIdxInLine(start, line, character, forward, true);
        if (idx == -1) {
          return null;
        }
        start = idx;
      }
      return { line: cm.getCursor().line, ch: idx };
    }

    function moveToColumn(cm, repeat) {
      // repeat is always >= 1, so repeat - 1 always corresponds
      // to the column we want to go to.
      var line = cm.getCursor().line;
      return clipCursorToContent(cm, { line: line, ch: repeat - 1 });
    }

    function updateMark(cm, vim, markName, pos) {
      if (!inArray(markName, validMarks)) {
        return;
      }
      if (vim.marks[markName]) {
        vim.marks[markName].clear();
      }
      vim.marks[markName] = cm.setBookmark(pos);
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
      symb = symb ? symb : cm.getLine(line).charAt(cur.ch);

      // Are we at the opening or closing char
      var forwards = inArray(symb, ['(', '[', '{']);

      var reverseSymb = ({
        '(': ')', ')': '(',
        '[': ']', ']': '[',
        '{': '}', '}': '{'})[symb];

      // Couldn't find a matching symbol, abort
      if (!reverseSymb) {
        return cur;
      }

      // set our increment to move forward (+1) or backwards (-1)
      // depending on which bracket we're matching
      var increment = ({'(': 1, '{': 1, '[': 1})[symb] || -1;
      var depth = 1, nextCh = symb, index = cur.ch, lineText = cm.getLine(line);
      // Simple search for closing paren--just count openings and closings till
      // we find our match
      // TODO: use info from CodeMirror to ignore closing brackets in comments
      // and quotes, etc.
      while (nextCh && depth > 0) {
        index += increment;
        nextCh = lineText.charAt(index);
        if (!nextCh) {
          line += increment;
          lineText = cm.getLine(line) || '';
          if (increment > 0) {
            index = 0;
          } else {
            var lineLen = lineText.length;
            index = (lineLen > 0) ? (lineLen-1) : 0;
          }
          nextCh = lineText.charAt(index);
        }
        if (nextCh === symb) {
          depth++;
        } else if (nextCh === reverseSymb) {
          depth--;
        }
      }

      if (nextCh) {
        return { line: line, ch: index };
      }
      return cur;
    }

    function selectCompanionObject(cm, revSymb, inclusive) {
      var cur = cm.getCursor();

      var end = findMatchedSymbol(cm, cur, revSymb);
      var start = findMatchedSymbol(cm, end);
      start.ch += inclusive ? 1 : 0;
      end.ch += inclusive ? 0 : 1;

      return { start: start, end: end };
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

    // Takes in a symbol and a cursor and tries to simulate text objects that
    // have identical opening and closing symbols
    // TODO support across multiple lines
    function findBeginningAndEnd(cm, symb, inclusive) {
      var cur = cm.getCursor();
      var line = cm.getLine(cur.line);
      var chars = line.split('');
      var start, end, i, len;
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
        for (i = cur.ch; i > -1 && !start; i--) {
          if (chars[i] == symb) {
            start = i + 1;
          }
        }
      }

      // look forwards for the end symbol
      if (start && !end) {
        for (i = start, len = chars.length; i < len && !end; i++) {
          if (chars[i] == symb) {
            end = i;
          }
        }
      }

      // nothing found
      if (!start || !end) {
        return { start: cur, end: cur };
      }

      // include the symbols
      if (inclusive) {
        --start; ++end;
      }

      return {
        start: { line: cur.line, ch: start },
        end: { line: cur.line, ch: end }
      };
    }

    // Search functions
    function SearchState() {}
    SearchState.prototype = {
      getQuery: function() {
        return getVimGlobalState().query;
      },
      setQuery: function(query) {
        getVimGlobalState().query = query;
      },
      getOverlay: function() {
        return this.searchOverlay;
      },
      setOverlay: function(overlay) {
        this.searchOverlay = overlay;
      },
      isReversed: function() {
        return getVimGlobalState().isReversed;
      },
      setReversed: function(reversed) {
        getVimGlobalState().isReversed = reversed;
      }
    };
    function getSearchState(cm) {
      var vim = getVimState(cm);
      return vim.searchState_ || (vim.searchState_ = new SearchState());
    }
    function dialog(cm, template, shortText, onClose, options) {
      if (cm.openDialog) {
        cm.openDialog(template, onClose, { bottom: true, value: options.value,
            onKeyDown: options.onKeyDown, onKeyUp: options.onKeyUp });
      }
      else {
        callback(prompt(shortText, ""));
      }
    }
    function findUnescapedSlashes(str) {
      var escapeNextChar = false;
      var slashes = [];
      for (var i = 0; i < str.length; i++) {
        var c = str.charAt(i);
        if (!escapeNextChar && c == '/') {
          slashes.push(i);
        }
        escapeNextChar = (c == '\\');
      }
      return slashes;
    }
    /**
     * Extract the regular expression from the query and return a Regexp object.
     * Returns null if the query is blank.
     * If ignoreCase is passed in, the Regexp object will have the 'i' flag set.
     * If smartCase is passed in, and the query contains upper case letters,
     *   then ignoreCase is overridden, and the 'i' flag will not be set.
     * If the query contains the /i in the flag part of the regular expression,
     *   then both ignoreCase and smartCase are ignored, and 'i' will be passed
     *   through to the Regex object.
     */
    function parseQuery(cm, query, ignoreCase, smartCase) {
      // Check if the query is already a regex.
      if (query instanceof RegExp) { return query; }
      // First try to extract regex + flags from the input. If no flags found,
      // extract just the regex. IE does not accept flags directly defined in
      // the regex string in the form /regex/flags
      var slashes = findUnescapedSlashes(query);
      var regexPart;
      var forceIgnoreCase;
      if (!slashes.length) {
        // Query looks like 'regexp'
        regexPart = query;
      } else {
        // Query looks like 'regexp/...'
        regexPart = query.substring(0, slashes[0]);
        var flagsPart = query.substring(slashes[0]);
        forceIgnoreCase = (flagsPart.indexOf('i') != -1);
      }
      if (!regexPart) {
        return null;
      }
      if (smartCase) {
        ignoreCase = (/^[^A-Z]*$/).test(regexPart);
      }
      var regexp = new RegExp(regexPart,
          (ignoreCase || forceIgnoreCase) ? 'i' : undefined);
      return regexp;
    }
    function showConfirm(cm, text) {
      if (cm.openConfirm) {
        cm.openConfirm('<span style="color: red">' + text +
            '</span> <button type="button">OK</button>', function() {},
            {bottom: true});
      } else {
        alert(text);
      }
    }
    function makePrompt(prefix, desc) {
      var raw = '';
      if (prefix) {
        raw += '<span style="font-family: monospace">' + prefix + '</span>';
      }
      raw += '<input type="text"/> ' +
          '<span style="color: #888">';
      if (desc) {
        raw += '<span style="color: #888">';
        raw += desc;
        raw += '</span>';
      }
      return raw;
    }
    var searchPromptDesc = '(Javascript regexp)';
    function showPrompt(cm, options) {
      var shortText = (options.prefix || '') + ' ' + (options.desc || '');
      var prompt = makePrompt(options.prefix, options.desc);
      dialog(cm, prompt, shortText, options.onClose, options);
    }
    function regexEqual(r1, r2) {
      if (r1 instanceof RegExp && r2 instanceof RegExp) {
          var props = ["global", "multiline", "ignoreCase", "source"];
          for (var i = 0; i < props.length; i++) {
              var prop = props[i];
              if (r1[prop] !== r2[prop]) {
                  return(false);
              }
          }
          return(true);
      }
      return(false);
    }
    // Returns true if the query is valid.
    function updateSearchQuery(cm, rawQuery, ignoreCase, smartCase) {
      if (!rawQuery) {
        return;
      }
      var state = getSearchState(cm);
      var query = parseQuery(cm, rawQuery, !!ignoreCase, !!smartCase);
      if (!query) {
        return;
      }
      highlightSearchMatches(cm, query);
      if (regexEqual(query, state.getQuery())) {
        return query;
      }
      state.setQuery(query);
      return query;
    }
    function searchOverlay(query) {
      if (query.source.charAt(0) == '^') {
        var matchSol = true;
      }
      return {
        token: function(stream) {
          if (matchSol && !stream.sol()) {
            stream.skipToEnd();
            return;
          }
          var match = stream.match(query, false);
          if (match) {
            if (match[0].length == 0) {
              // Matched empty string, skip to next.
              stream.next();
              return;
            }
            if (!stream.sol()) {
              // Backtrack 1 to match \b
              stream.backUp(1);
              if (!query.exec(stream.next() + match[0])) {
                stream.next();
                return null;
              }
            }
            stream.match(query);
            return "searching";
          }
          while (!stream.eol()) {
            stream.next();
            if (stream.match(query, false)) break;
          }
        },
        query: query
      };
    }
    function highlightSearchMatches(cm, query) {
      var overlay = getSearchState(cm).getOverlay();
      if (!overlay || query != overlay.query) {
        if (overlay) {
          cm.removeOverlay(overlay);
        }
        overlay = searchOverlay(query);
        cm.addOverlay(overlay);
        getSearchState(cm).setOverlay(overlay);
      }
    }
    function findNext(cm, prev, query, repeat) {
      if (repeat === undefined) { repeat = 1; }
      return cm.operation(function() {
        var pos = cm.getCursor();
        if (!prev) {
          pos.ch += 1;
        }
        var cursor = cm.getSearchCursor(query, pos);
        for (var i = 0; i < repeat; i++) {
          if (!cursor.find(prev)) {
            // SearchCursor may have returned null because it hit EOF, wrap
            // around and try again.
            cursor = cm.getSearchCursor(query,
                (prev) ? { line: cm.lastLine() } : {line: cm.firstLine(), ch: 0} );
            if (!cursor.find(prev)) {
              return;
            }
          }
        }
        return cursor.from();
      });}
    function clearSearchHighlight(cm) {
      cm.removeOverlay(getSearchState(cm).getOverlay());
      getSearchState(cm).setOverlay(null);
    }
    /**
     * Check if pos is in the specified range, INCLUSIVE.
     * Range can be specified with 1 or 2 arguments.
     * If the first range argument is an array, treat it as an array of line
     * numbers. Match pos against any of the lines.
     * If the first range argument is a number,
     *   if there is only 1 range argument, check if pos has the same line
     *       number
     *   if there are 2 range arguments, then check if pos is in between the two
     *       range arguments.
     */
    function isInRange(pos, start, end) {
      if (typeof pos != 'number') {
        // Assume it is a cursor position. Get the line number.
        pos = pos.line;
      }
      if (start instanceof Array) {
        return inArray(pos, start);
      } else {
        if (end) {
          return (pos >= start && pos <= end);
        } else {
          return pos == start;
        }
      }
    }

    // Ex command handling
    // Care must be taken when adding to the default Ex command map. For any
    // pair of commands that have a shared prefix, at least one of their
    // shortNames must not match the prefix of the other command.
    var defaultExCommandMap = [
      { name: 'map', type: 'builtIn' },
      { name: 'write', shortName: 'w', type: 'builtIn' },
      { name: 'undo', shortName: 'u', type: 'builtIn' },
      { name: 'redo', shortName: 'red', type: 'builtIn' },
      { name: 'substitute', shortName: 's', type: 'builtIn'},
      { name: 'nohlsearch', shortName: 'noh', type: 'builtIn'},
      { name: 'delmarks', shortName: 'delm', type: 'builtin'}
    ];
    Vim.ExCommandDispatcher = function() {
      this.buildCommandMap_();
    };
    Vim.ExCommandDispatcher.prototype = {
      processCommand: function(cm, input) {
        var inputStream = new CodeMirror.StringStream(input);
        var params = {};
        params.input = input;
        try {
          this.parseInput_(cm, inputStream, params);
        } catch(e) {
          showConfirm(cm, e);
          return;
        }
        var commandName;
        if (!params.commandName) {
          // If only a line range is defined, move to the line.
          if (params.line !== undefined) {
            commandName = 'move';
          }
        } else {
          var command = this.matchCommand_(params.commandName);
          if (command) {
            commandName = command.name;
            this.parseCommandArgs_(inputStream, params, command);
            if (command.type == 'exToKey') {
              // Handle Ex to Key mapping.
              for (var i = 0; i < command.toKeys.length; i++) {
                vim.handleKey(cm, command.toKeys[i]);
              }
              return;
            } else if (command.type == 'exToEx') {
              // Handle Ex to Ex mapping.
              this.processCommand(cm, command.toInput);
              return;
            }
          }
        }
        if (!commandName) {
          showConfirm(cm, 'Not an editor command ":' + input + '"');
          return;
        }
        exCommands[commandName](cm, params);
      },
      parseInput_: function(cm, inputStream, result) {
        inputStream.eatWhile(':');
        // Parse range.
        if (inputStream.eat('%')) {
          result.line = cm.firstLine();
          result.lineEnd = cm.lastLine();
        } else {
          result.line = this.parseLineSpec_(cm, inputStream);
          if (result.line !== undefined && inputStream.eat(',')) {
            result.lineEnd = this.parseLineSpec_(cm, inputStream);
          }
        }

        // Parse command name.
        var commandMatch = inputStream.match(/^(\w+)/);
        if (commandMatch) {
          result.commandName = commandMatch[1];
        } else {
          result.commandName = inputStream.match(/.*/)[0];
        }

        return result;
      },
      parseLineSpec_: function(cm, inputStream) {
        var numberMatch = inputStream.match(/^(\d+)/);
        if (numberMatch) {
          return parseInt(numberMatch[1], 10) - 1;
        }
        switch (inputStream.next()) {
          case '.':
            return cm.getCursor().line;
          case '$':
            return cm.lastLine();
          case '\'':
            var mark = getVimState(cm).marks[inputStream.next()];
            if (mark && mark.find()) {
              return mark.find().line;
            } else {
              throw "Mark not set";
            }
            break;
          default:
            inputStream.backUp(1);
            return cm.getCursor().line;
        }
      },
      parseCommandArgs_: function(inputStream, params, command) {
        if (inputStream.eol()) {
          return;
        }
        params.argString = inputStream.match(/.*/)[0];
        // Parse command-line arguments
        var delim = command.argDelimiter || /\s+/;
        var args = trim(params.argString).split(delim);
        if (args.length && args[0]) {
          params.args = args;
        }
      },
      matchCommand_: function(commandName) {
        // Return the command in the command map that matches the shortest
        // prefix of the passed in command name. The match is guaranteed to be
        // unambiguous if the defaultExCommandMap's shortNames are set up
        // correctly. (see @code{defaultExCommandMap}).
        for (var i = commandName.length; i > 0; i--) {
          var prefix = commandName.substring(0, i);
          if (this.commandMap_[prefix]) {
            var command = this.commandMap_[prefix];
            if (command.name.indexOf(commandName) === 0) {
              return command;
            }
          }
        }
        return null;
      },
      buildCommandMap_: function() {
        this.commandMap_ = {};
        for (var i = 0; i < defaultExCommandMap.length; i++) {
          var command = defaultExCommandMap[i];
          var key = command.shortName || command.name;
          this.commandMap_[key] = command;
        }
      },
      map: function(lhs, rhs) {
        if (lhs != ':' && lhs.charAt(0) == ':') {
          var commandName = lhs.substring(1);
          if (rhs != ':' && rhs.charAt(0) == ':') {
            // Ex to Ex mapping
            this.commandMap_[commandName] = {
              name: commandName,
              type: 'exToEx',
              toInput: rhs.substring(1)
            };
          } else {
            // Ex to key mapping
            this.commandMap_[commandName] = {
              name: commandName,
              type: 'exToKey',
              toKeys: parseKeyString(rhs)
            };
          }
        } else {
          if (rhs != ':' && rhs.charAt(0) == ':') {
            // Key to Ex mapping.
            defaultKeymap.unshift({
              keys: parseKeyString(lhs),
              type: 'keyToEx',
              exArgs: { input: rhs.substring(1) }});
          } else {
            // Key to key mapping
            defaultKeymap.unshift({
              keys: parseKeyString(lhs),
              type: 'keyToKey',
              toKeys: parseKeyString(rhs)
            });
          }
        }
      }
    };

    // Converts a key string sequence of the form a<C-w>bd<Left> into Vim's
    // keymap representation.
    function parseKeyString(str) {
      var idx = 0;
      var keys = [];
      while (idx < str.length) {
        if (str.charAt(idx) != '<') {
          keys.push(str.charAt(idx));
          idx++;
          continue;
        }
        // Vim key notation here means desktop Vim key-notation.
        // See :help key-notation in desktop Vim.
        var vimKeyNotationStart = ++idx;
        while (str.charAt(idx++) != '>') {}
        var vimKeyNotation = str.substring(vimKeyNotationStart, idx - 1);
        var mod='';
        var match = (/^C-(.+)$/).exec(vimKeyNotation);
        if (match) {
          mod='Ctrl-';
          vimKeyNotation=match[1];
        }
        var key;
        switch (vimKeyNotation) {
          case 'BS':
            key = 'Backspace';
            break;
          case 'CR':
            key = 'Enter';
            break;
          case 'Del':
            key = 'Delete';
            break;
          default:
            key = vimKeyNotation;
            break;
        }
        keys.push(mod + key);
      }
      return keys;
    }

    var exCommands = {
      map: function(cm, params) {
        var mapArgs = params.args;
        if (!mapArgs || mapArgs.length < 2) {
          if (cm) {
            showConfirm(cm, 'Invalid mapping: ' + params.input);
          }
          return;
        }
        exCommandDispatcher.map(mapArgs[0], mapArgs[1], cm);
      },
      move: function(cm, params) {
        commandDispatcher.processMotion(cm, getVimState(cm), {
            motion: 'moveToLineOrEdgeOfDocument',
            motionArgs: { forward: false, explicitRepeat: true,
              linewise: true },
            repeatOverride: params.line+1});
      },
      substitute: function(cm, params) {
        var argString = params.argString;
        var slashes = findUnescapedSlashes(argString);
        if (slashes[0] !== 0) {
          showConfirm(cm, 'Substitutions should be of the form ' +
              ':s/pattern/replace/');
          return;
        }
        var regexPart = argString.substring(slashes[0] + 1, slashes[1]);
        var replacePart = '';
        var flagsPart;
        var count;
        if (slashes[1]) {
          replacePart = argString.substring(slashes[1] + 1, slashes[2]);
        }
        if (slashes[2]) {
          // After the 3rd slash, we can have flags followed by a space followed
          // by count.
          var trailing = argString.substring(slashes[2] + 1).split(' ');
          flagsPart = trailing[0];
          count = parseInt(trailing[1]);
        }
        if (flagsPart) {
          regexPart = regexPart + '/' + flagsPart;
        }
        if (regexPart) {
          // If regex part is empty, then use the previous query. Otherwise use
          // the regex part as the new query.
          try {
            updateSearchQuery(cm, regexPart, true /** ignoreCase */,
              true /** smartCase */);
          } catch (e) {
            showConfirm(cm, 'Invalid regex: ' + regexPart);
            return;
          }
        }
        var state = getSearchState(cm);
        var query = state.getQuery();
        var lineStart = params.line || cm.firstLine();
        var lineEnd = params.lineEnd || lineStart;
        if (count) {
          lineStart = lineEnd;
          lineEnd = lineStart + count - 1;
        }
        var startPos = clipCursorToContent(cm, { line: lineStart, ch: 0 });
        function doReplace() {
          for (var cursor = cm.getSearchCursor(query, startPos);
               cursor.findNext() &&
                   isInRange(cursor.from(), lineStart, lineEnd);) {
            var text = cm.getRange(cursor.from(), cursor.to());
            var newText = text.replace(query, replacePart);
            cursor.replace(newText);
          }
          var vim = getVimState(cm);
          if (vim.visualMode) {
            exitVisualMode(cm, vim);
          }
        }
        cm.operation(doReplace);
      },
      redo: CodeMirror.commands.redo,
      undo: CodeMirror.commands.undo,
      write: function(cm) {
        if (CodeMirror.commands.save) {
          // If a save command is defined, call it.
          CodeMirror.commands.save(cm);
        } else {
          // Saves to text area if no save command is defined.
          cm.save();
        }
      },
      nohlsearch: function(cm) {
        clearSearchHighlight(cm);
      },
      delmarks: function(cm, params) {
        if (!params.argString || !params.argString.trim()) {
          showConfirm(cm, 'Argument required');
          return;
        }

        var state = getVimState(cm);
        var stream = new CodeMirror.StringStream(params.argString.trim());
        while (!stream.eol()) {
          stream.eatSpace();

          // Record the streams position at the beginning of the loop for use
          // in error messages.
          var count = stream.pos;

          if (!stream.match(/[a-zA-Z]/, false)) {
            showConfirm(cm, 'Invalid argument: ' + params.argString.substring(count));
            return;
          }

          var sym = stream.next();
          // Check if this symbol is part of a range
          if (stream.match('-', true)) {
            // This symbol is part of a range.

            // The range must terminate at an alphabetic character.
            if (!stream.match(/[a-zA-Z]/, false)) {
              showConfirm(cm, 'Invalid argument: ' + params.argString.substring(count));
              return;
            }

            var startMark = sym;
            var finishMark = stream.next();
            // The range must terminate at an alphabetic character which
            // shares the same case as the start of the range.
            if (isLowerCase(startMark) && isLowerCase(finishMark) ||
                isUpperCase(startMark) && isUpperCase(finishMark)) {
              var start = startMark.charCodeAt(0);
              var finish = finishMark.charCodeAt(0);
              if (start >= finish) {
                showConfirm(cm, 'Invalid argument: ' + params.argString.substring(count));
                return;
              }

              // Because marks are always ASCII values, and we have
              // determined that they are the same case, we can use
              // their char codes to iterate through the defined range.
              for (var j = 0; j <= finish - start; j++) {
                var mark = String.fromCharCode(start + j);
                delete state.marks[mark];
              }
            } else {
              showConfirm(cm, 'Invalid argument: ' + startMark + "-");
              return;
            }
          } else {
            // This symbol is a valid mark, and is not part of a range.
            delete state.marks[sym];
          }
        }
      }
    };

    var exCommandDispatcher = new Vim.ExCommandDispatcher();

    // Register Vim with CodeMirror
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
      'Enter': function(cm) {
        var fn = CodeMirror.commands.newlineAndIndentContinueComment ||
            CodeMirror.commands.newlineAndIndent;
        fn(cm);
      },
      fallthrough: ['default']
    };

    return vimApi;
  };
  // Initialize Vim and make it available as an API.
  var vim = Vim();
  CodeMirror.Vim = vim;
}
)();
