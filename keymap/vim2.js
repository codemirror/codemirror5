// Reimplementation of vim keybindings

(function() {
  var alphabetRegex = /[A-Z]/;
  var numberRegex = /[\d]/;
  var whiteSpaceRegex = /\s/;
  function isNumber(k) { return numberRegex.test(k); }
  function isAlphabet(k) { return alphabetRegex.test(k); }
  function isWhiteSpace(k) { return whiteSpaceRegex.test(k); }
  function isWhiteSpaceString(k) {
    return /^\s*$/.test(k);
  }

  // Represents the current input state.
  function InputState() {
    this.reset();
  }
  InputState.prototype.reset = function() {
    this.prefixRepeatDigits = [];
    this.actionCommand = null;
    this.actionCommandArgs = null;
    this.motionRepeatDigits = [];
    this.motionCommand = null;
    this.motionCommandArgs = null;
    this.keyBuffer = ''; // For matching multi-key commands.
  }
  var inputState = new InputState();

  // Counter for keeping track of repeats.
  var count = (function() {
    var value = 0;
    return {
      peek: function() {
        return value;
      },
      pop: function() {
        var ret = value;
        value = 0;
        return ret;
      },
      popWithMin: function(min) {
        var ret = value;
        value = 0;
        return Math.max(ret, min);
      },
      pushDigit: function(n) {
        value = value * 10 + parseInt(n, 10);
      },
      clear: function() {
        value = 0;
      }
    }
  })();

  var Vim = function() {
    function enterInsertMode(cm) {
      // enter insert mode: switch mode and cursor
      count.clear();
      cm.setOption("keyMap", "vim-insert");
    }
    function repeatFn(fn) {
      return function(cm, key, modifier) {
        var times = count.popWithMin(1);
        for (var i = 0; i < times; i++) fn(cm, key, modifier);
      }
    }
    function nonRepeatFn(fn) {
      // Wrapper to clear count.
      return function(cm, key, modifier) {
        fn(cm, key, modifier);
        count.clear();
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

    var instance = function() {};
    instance.prototype = {
      buildKeyMap: function() {
        // TODO: Convert keymap into dictionary format for fast lookup.
      },
      handleKey: function(cm, key) {
        if (isNumber(key) && !(key == '0' && count.peek() == 0)) {
          // Increment count unless count is 0 and key is 0.
          count.pushDigit(key);
          return;
        }
        command = this.matchCommand(key, Vim.keymap);
        if (command) {
          this.processCommand(cm, command);
        }
      },
      matchCommand: function(key, keyMap) {
        // TODO: Handle multi-key commands like 'ge'.
        var command;
        for (var i = 0; i < keyMap.length; i++) {
          command = keyMap[i];
          if (command.keys[0] == key) {
            return command;
          }
        }
        return null;
      },
      processCommand: function(cm, command) {
        switch (command.commandType) {
          case 'motion':
            this.processMotionCommand(cm, command);
            break;
          case 'action':
            this.processActionCommand(cm, command);
            break;
          case 'actionMotion':
            this.processActionMotionCommand(cm, command);
            break;
          case 'regular':
            break;
          default:
            break;
        }
      },
      processMotionCommand: function(cm, command) {
        inputState.motionCommand = command.motion;
        inputState.motionArgs = command.motionArgs;
        this.evalInput(cm);
      },
      processActionCommand: function(cm, command) {
        inputState.actionCommand = command.action;
        inputState.actionArgs = command.actionArgs;
      },
      processActionMotionCommand: function(cm, command) {
        inputState.motionCommand = command.motion;
        inputState.motionArgs = command.motionArgs;
        inputState.actionCommand = command.action;
        inputState.actionArgs = command.actionArgs;
        this.evalInput(cm);
      },
      evalInput: function(cm) {
        // If the motion comand is set, run both the action and motion commands.
        // Otherwise return.
        var explicit_repeat = !!count.peek();
        var repeat = count.popWithMin(1);
        var motionCommand = inputState.motionCommand;
        var motionArgs = inputState.motionArgs;
        var actionCommand = inputState.actionCommand;
        var actionArgs = inputState.actionArgs;
        var curStart = cm.getCursor();
        var curEnd;
        if (!motionCommand) {
          return;
        }
        if (motionArgs) {
          motionArgs.repeat = repeat;
        }
        count.clear();
        inputState.reset();
        curEnd = Vim.motionCommands[motionCommand](cm, motionArgs);
        if (!actionCommand) {
          cm.setCursor(curEnd.line, curEnd.ch);
          return;
        }
        if (motionArgs.wordEnd) {
          // Move the selection end one to the right to include the last
          // character.
          curEnd.ch++;
        }
        // Swap start and end if motion was backward.
        if (curStart.line > curEnd.line ||
            (curStart.line == curEnd.line && curStart.ch > curEnd.ch)) {
          var tmp = curStart;
          curStart = curEnd;
          curEnd = tmp;
        }

        // Clip to trailing newlines.
        clipToLine(cm, curEnd);
        // TODO: Handle action commands.
        Vim.actionCommands[actionCommand](cm, actionArgs, curStart,
            curEnd);
      }
    }
    return new instance();
  }

  Vim.actionCommands = {
    delete: function(cm, actionArgs, curStart, curEnd) {
      cm.replaceRange('', curStart, curEnd);
    },
  };

  Vim.keymap = [
    // Motions
    { keys: ['h'], commandType: 'motion', motion: 'moveByCharacters', motionArgs: { forward: false }},
    { keys: ['l'], commandType: 'motion', motion: 'moveByCharacters', motionArgs: { forward: true }},
    { keys: ['j'], commandType: 'motion', motion: 'moveByLines', motionArgs: { forward: true }},
    { keys: ['k'], commandType: 'motion', motion: 'moveByLines', motionArgs: { forward: false }},
    { keys: ['w'], commandType: 'motion', motion: 'moveByWords', motionArgs: { forward: true, wordEnd: false}},
    { keys: ['W'], commandType: 'motion', motion: 'moveByWords', motionArgs: { forward: true, wordEnd: false, bigWord: true }},
    { keys: ['e'], commandType: 'motion', motion: 'moveByWords', motionArgs: { forward: true, wordEnd: true}},
    { keys: ['E'], commandType: 'motion', motion: 'moveByWords', motionArgs: { forward: true, wordEnd: true, bigWord: true }},
    { keys: ['b'], commandType: 'motion', motion: 'moveByWords', motionArgs: { forward: false, wordEnd: false }},
    { keys: ['B'], commandType: 'motion', motion: 'moveByWords', motionArgs: { forward: false, wordEnd: false, bigWord: true }},
    { keys: ['g', 'e'], commandType: 'motion', motion: 'moveByWords', motionArgs: { forward: false, wordEnd: true }},
    { keys: ['g', 'E'], commandType: 'motion', motion: 'moveByWords', motionArgs: { forward: false, wordEnd: true, bigWord: true }},
    { keys: ['0'], commandType: 'motion', motion: 'moveToStartOfLine' },
    { keys: ["'^'"], commandType: 'motion', motion: 'moveToFirstNonWhiteSpaceCharacter' },
    { keys: ["'$'"], commandType: 'motion', motion: 'moveToEol' },
    // Actions
    { keys: ['d'], commandType: 'action', action: 'delete' },
    // Action-Motion dual commands
    { keys: ['s'], commandType: 'actionMotion',
        action: 'enterInsertMode', actionArgs: { insertCommand: 'delete' },
        motion: 'moveByCharacters', motionArgs: { forward: true } },
  ];

  var vim = Vim();

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
  CodeMirror.Vim = Vim;
}
)();
