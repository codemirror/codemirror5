// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

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
 * Registers: unnamed, -, a-z, A-Z, 0-9
 *   (Does not respect the special case for number registers when delete
 *    operator is made with these commands: %, (, ),  , /, ?, n, N, {, } )
 *   TODO: Implement the remaining registers.
 * Marks: a-z, A-Z, and 0-9
 *   TODO: Implement the remaining special marks. They have more complex
 *       behavior.
 *
 * Events:
 *  'vim-mode-change' - raised on the editor anytime the current mode changes,
 *                      Event object: {mode: "visual", subMode: "linewise"}
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

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../lib/codemirror"), require("../addon/search/searchcursor"), require("../addon/dialog/dialog"), require("../addon/edit/matchbrackets.js"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../lib/codemirror", "../addon/search/searchcursor", "../addon/dialog/dialog", "../addon/edit/matchbrackets"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  'use strict';

  var defaultKeymap = [
    // Key to key mapping. This goes first to make it possible to override
    // existing mappings.
    { keys: ['<Left>'], type: 'keyToKey', toKeys: ['h'] },
    { keys: ['<Right>'], type: 'keyToKey', toKeys: ['l'] },
    { keys: ['<Up>'], type: 'keyToKey', toKeys: ['k'] },
    { keys: ['<Down>'], type: 'keyToKey', toKeys: ['j'] },
    { keys: ['<Space>'], type: 'keyToKey', toKeys: ['l'] },
    { keys: ['<BS>'], type: 'keyToKey', toKeys: ['h'] },
    { keys: ['<C-Space>'], type: 'keyToKey', toKeys: ['W'] },
    { keys: ['<C-BS>'], type: 'keyToKey', toKeys: ['B'] },
    { keys: ['<S-Space>'], type: 'keyToKey', toKeys: ['w'] },
    { keys: ['<S-BS>'], type: 'keyToKey', toKeys: ['b'] },
    { keys: ['<C-n>'], type: 'keyToKey', toKeys: ['j'] },
    { keys: ['<C-p>'], type: 'keyToKey', toKeys: ['k'] },
    { keys: ['<C-[>'], type: 'keyToKey', toKeys: ['<Esc>'] },
    { keys: ['<C-c>'], type: 'keyToKey', toKeys: ['<Esc>'] },
    { keys: ['s'], type: 'keyToKey', toKeys: ['c', 'l'], context: 'normal' },
    { keys: ['s'], type: 'keyToKey', toKeys: ['x', 'i'], context: 'visual'},
    { keys: ['S'], type: 'keyToKey', toKeys: ['c', 'c'], context: 'normal' },
    { keys: ['S'], type: 'keyToKey', toKeys: ['d', 'c', 'c'], context: 'visual' },
    { keys: ['<Home>'], type: 'keyToKey', toKeys: ['0'] },
    { keys: ['<End>'], type: 'keyToKey', toKeys: ['$'] },
    { keys: ['<PageUp>'], type: 'keyToKey', toKeys: ['<C-b>'] },
    { keys: ['<PageDown>'], type: 'keyToKey', toKeys: ['<C-f>'] },
    { keys: ['<CR>'], type: 'keyToKey', toKeys: ['j', '^'], context: 'normal' },
    // Motions
    { keys: ['H'], type: 'motion',
        motion: 'moveToTopLine',
        motionArgs: { linewise: true, toJumplist: true }},
    { keys: ['M'], type: 'motion',
        motion: 'moveToMiddleLine',
        motionArgs: { linewise: true, toJumplist: true }},
    { keys: ['L'], type: 'motion',
        motion: 'moveToBottomLine',
        motionArgs: { linewise: true, toJumplist: true }},
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
        motionArgs: { forward: false, toJumplist: true }},
    { keys: ['}'], type: 'motion', motion: 'moveByParagraph',
        motionArgs: { forward: true, toJumplist: true }},
    { keys: ['<C-f>'], type: 'motion',
        motion: 'moveByPage', motionArgs: { forward: true }},
    { keys: ['<C-b>'], type: 'motion',
        motion: 'moveByPage', motionArgs: { forward: false }},
    { keys: ['<C-d>'], type: 'motion',
        motion: 'moveByScroll',
        motionArgs: { forward: true, explicitRepeat: true }},
    { keys: ['<C-u>'], type: 'motion',
        motion: 'moveByScroll',
        motionArgs: { forward: false, explicitRepeat: true }},
    { keys: ['g', 'g'], type: 'motion',
        motion: 'moveToLineOrEdgeOfDocument',
        motionArgs: { forward: false, explicitRepeat: true, linewise: true, toJumplist: true }},
    { keys: ['G'], type: 'motion',
        motion: 'moveToLineOrEdgeOfDocument',
        motionArgs: { forward: true, explicitRepeat: true, linewise: true, toJumplist: true }},
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
        motionArgs: { inclusive: true, toJumplist: true }},
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
    { keys: [';'], type: 'motion', motion: 'repeatLastCharacterSearch',
        motionArgs: { forward: true }},
    { keys: [','], type: 'motion', motion: 'repeatLastCharacterSearch',
        motionArgs: { forward: false }},
    { keys: ['\'', 'character'], type: 'motion', motion: 'goToMark',
        motionArgs: {toJumplist: true, linewise: true}},
    { keys: ['`', 'character'], type: 'motion', motion: 'goToMark',
        motionArgs: {toJumplist: true}},
    { keys: [']', '`'], type: 'motion', motion: 'jumpToMark', motionArgs: { forward: true } },
    { keys: ['[', '`'], type: 'motion', motion: 'jumpToMark', motionArgs: { forward: false } },
    { keys: [']', '\''], type: 'motion', motion: 'jumpToMark', motionArgs: { forward: true, linewise: true } },
    { keys: ['[', '\''], type: 'motion', motion: 'jumpToMark', motionArgs: { forward: false, linewise: true } },
    // the next two aren't motions but must come before more general motion declarations
    { keys: [']', 'p'], type: 'action', action: 'paste', isEdit: true,
        actionArgs: { after: true, isEdit: true, matchIndent: true}},
    { keys: ['[', 'p'], type: 'action', action: 'paste', isEdit: true,
        actionArgs: { after: false, isEdit: true, matchIndent: true}},
    { keys: [']', 'character'], type: 'motion',
        motion: 'moveToSymbol',
        motionArgs: { forward: true, toJumplist: true}},
    { keys: ['[', 'character'], type: 'motion',
        motion: 'moveToSymbol',
        motionArgs: { forward: false, toJumplist: true}},
    { keys: ['|'], type: 'motion',
        motion: 'moveToColumn',
        motionArgs: { }},
    { keys: ['o'], type: 'motion', motion: 'moveToOtherHighlightedEnd', motionArgs: { }, context:'visual'},
    { keys: ['O'], type: 'motion', motion: 'moveToOtherHighlightedEnd', motionArgs: {sameLine: true}, context:'visual'},
    // Operators
    { keys: ['d'], type: 'operator', operator: 'delete' },
    { keys: ['y'], type: 'operator', operator: 'yank' },
    { keys: ['c'], type: 'operator', operator: 'change' },
    { keys: ['>'], type: 'operator', operator: 'indent',
        operatorArgs: { indentRight: true }},
    { keys: ['<'], type: 'operator', operator: 'indent',
        operatorArgs: { indentRight: false }},
    { keys: ['g', '~'], type: 'operator', operator: 'swapcase' },
    { keys: ['n'], type: 'motion', motion: 'findNext',
        motionArgs: { forward: true, toJumplist: true }},
    { keys: ['N'], type: 'motion', motion: 'findNext',
        motionArgs: { forward: false, toJumplist: true }},
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
        operator: 'change',
        motion: 'moveToEol', motionArgs: { inclusive: true },
        operatorMotionArgs: { visualLine: true }},
    { keys: ['~'], type: 'operatorMotion',
        operator: 'swapcase', operatorArgs: { shouldMoveCursor: true },
        motion: 'moveByCharacters', motionArgs: { forward: true }},
    // Actions
    { keys: ['<C-i>'], type: 'action', action: 'jumpListWalk',
        actionArgs: { forward: true }},
    { keys: ['<C-o>'], type: 'action', action: 'jumpListWalk',
        actionArgs: { forward: false }},
    { keys: ['<C-e>'], type: 'action',
        action: 'scroll',
        actionArgs: { forward: true, linewise: true }},
    { keys: ['<C-y>'], type: 'action',
        action: 'scroll',
        actionArgs: { forward: false, linewise: true }},
    { keys: ['a'], type: 'action', action: 'enterInsertMode', isEdit: true,
        actionArgs: { insertAt: 'charAfter' }},
    { keys: ['A'], type: 'action', action: 'enterInsertMode', isEdit: true,
        actionArgs: { insertAt: 'eol' }},
    { keys: ['A'], type: 'action', action: 'enterInsertMode', isEdit: true, actionArgs: { insertAt: 'endOfSelectedArea' }, context: 'visual' },
    { keys: ['i'], type: 'action', action: 'enterInsertMode', isEdit: true,
        actionArgs: { insertAt: 'inplace' }},
    { keys: ['I'], type: 'action', action: 'enterInsertMode', isEdit: true,
        actionArgs: { insertAt: 'firstNonBlank' }},
    { keys: ['o'], type: 'action', action: 'newLineAndEnterInsertMode',
        isEdit: true, interlaceInsertRepeat: true,
        actionArgs: { after: true }},
    { keys: ['O'], type: 'action', action: 'newLineAndEnterInsertMode',
        isEdit: true, interlaceInsertRepeat: true,
        actionArgs: { after: false }},
    { keys: ['v'], type: 'action', action: 'toggleVisualMode' },
    { keys: ['V'], type: 'action', action: 'toggleVisualMode',
        actionArgs: { linewise: true }},
    { keys: ['<C-v>'], type: 'action', action: 'toggleVisualMode',
        actionArgs: { blockwise: true }},
    { keys: ['g', 'v'], type: 'action', action: 'reselectLastSelection' },
    { keys: ['J'], type: 'action', action: 'joinLines', isEdit: true },
    { keys: ['p'], type: 'action', action: 'paste', isEdit: true,
        actionArgs: { after: true, isEdit: true }},
    { keys: ['P'], type: 'action', action: 'paste', isEdit: true,
        actionArgs: { after: false, isEdit: true }},
    { keys: ['r', 'character'], type: 'action', action: 'replace', isEdit: true },
    { keys: ['@', 'character'], type: 'action', action: 'replayMacro' },
    { keys: ['q', 'character'], type: 'action', action: 'enterMacroRecordMode' },
    // Handle Replace-mode as a special case of insert mode.
    { keys: ['R'], type: 'action', action: 'enterInsertMode', isEdit: true,
        actionArgs: { replace: true }},
    { keys: ['u'], type: 'action', action: 'undo' },
    { keys: ['u'], type: 'action', action: 'changeCase', actionArgs: {toLower: true}, context: 'visual', isEdit: true },
    { keys: ['U'],type: 'action', action: 'changeCase', actionArgs: {toLower: false}, context: 'visual', isEdit: true },
    { keys: ['<C-r>'], type: 'action', action: 'redo' },
    { keys: ['m', 'character'], type: 'action', action: 'setMark' },
    { keys: ['"', 'character'], type: 'action', action: 'setRegister' },
    { keys: ['z', 'z'], type: 'action', action: 'scrollToCursor',
        actionArgs: { position: 'center' }},
    { keys: ['z', '.'], type: 'action', action: 'scrollToCursor',
        actionArgs: { position: 'center' },
        motion: 'moveToFirstNonWhiteSpaceCharacter' },
    { keys: ['z', 't'], type: 'action', action: 'scrollToCursor',
        actionArgs: { position: 'top' }},
    { keys: ['z', '<CR>'], type: 'action', action: 'scrollToCursor',
        actionArgs: { position: 'top' },
        motion: 'moveToFirstNonWhiteSpaceCharacter' },
    { keys: ['z', '-'], type: 'action', action: 'scrollToCursor',
        actionArgs: { position: 'bottom' }},
    { keys: ['z', 'b'], type: 'action', action: 'scrollToCursor',
        actionArgs: { position: 'bottom' },
        motion: 'moveToFirstNonWhiteSpaceCharacter' },
    { keys: ['.'], type: 'action', action: 'repeatLastEdit' },
    { keys: ['<C-a>'], type: 'action', action: 'incrementNumberToken',
        isEdit: true,
        actionArgs: {increase: true, backtrack: false}},
    { keys: ['<C-x>'], type: 'action', action: 'incrementNumberToken',
        isEdit: true,
        actionArgs: {increase: false, backtrack: false}},
    // Text object motions
    { keys: ['a', 'character'], type: 'motion',
        motion: 'textObjectManipulation' },
    { keys: ['i', 'character'], type: 'motion',
        motion: 'textObjectManipulation',
        motionArgs: { textObjectInner: true }},
    // Search
    { keys: ['/'], type: 'search',
        searchArgs: { forward: true, querySrc: 'prompt', toJumplist: true }},
    { keys: ['?'], type: 'search',
        searchArgs: { forward: false, querySrc: 'prompt', toJumplist: true }},
    { keys: ['*'], type: 'search',
        searchArgs: { forward: true, querySrc: 'wordUnderCursor', wholeWordOnly: true, toJumplist: true }},
    { keys: ['#'], type: 'search',
        searchArgs: { forward: false, querySrc: 'wordUnderCursor', wholeWordOnly: true, toJumplist: true }},
    { keys: ['g', '*'], type: 'search', searchArgs: { forward: true, querySrc: 'wordUnderCursor', toJumplist: true }},
    { keys: ['g', '#'], type: 'search', searchArgs: { forward: false, querySrc: 'wordUnderCursor', toJumplist: true }},
    // Ex command
    { keys: [':'], type: 'ex' }
  ];

  var Pos = CodeMirror.Pos;

  var Vim = function() {
    CodeMirror.defineOption('vimMode', false, function(cm, val) {
      if (val) {
        cm.setOption('keyMap', 'vim');
        cm.setOption('disableInput', true);
        cm.setOption('showCursorWhenSelecting', false);
        CodeMirror.signal(cm, "vim-mode-change", {mode: "normal"});
        cm.on('cursorActivity', onCursorActivity);
        maybeInitVimState(cm);
        CodeMirror.on(cm.getInputField(), 'paste', getOnPasteFn(cm));
      } else if (cm.state.vim) {
        cm.setOption('keyMap', 'default');
        cm.setOption('disableInput', false);
        cm.off('cursorActivity', onCursorActivity);
        CodeMirror.off(cm.getInputField(), 'paste', getOnPasteFn(cm));
        cm.state.vim = null;
      }
    });
    function getOnPasteFn(cm) {
      var vim = cm.state.vim;
      if (!vim.onPasteFn) {
        vim.onPasteFn = function() {
          if (!vim.insertMode) {
            cm.setCursor(offsetCursor(cm.getCursor(), 0, 1));
            actions.enterInsertMode(cm, {}, vim);
          }
        };
      }
      return vim.onPasteFn;
    }

    var numberRegex = /[\d]/;
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
    var specialSymbols = '~`!@#$%^&*()_-+=[{}]\\|/?.,<>:;"\''.split('');
    var specialKeys = ['Left', 'Right', 'Up', 'Down', 'Space', 'Backspace',
        'Esc', 'Home', 'End', 'PageUp', 'PageDown', 'Enter'];
    var validMarks = [].concat(upperCaseAlphabet, lowerCaseAlphabet, numbers, ['<', '>']);
    var validRegisters = [].concat(upperCaseAlphabet, lowerCaseAlphabet, numbers, ['-', '"', '.', ':', '/']);

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
    function isWhiteSpaceString(k) {
      return (/^\s*$/).test(k);
    }
    function inArray(val, arr) {
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] == val) {
          return true;
        }
      }
      return false;
    }

    var options = {};
    function defineOption(name, defaultValue, type) {
      if (defaultValue === undefined) { throw Error('defaultValue is required'); }
      if (!type) { type = 'string'; }
      options[name] = {
        type: type,
        defaultValue: defaultValue
      };
      setOption(name, defaultValue);
    }

    function setOption(name, value) {
      var option = options[name];
      if (!option) {
        throw Error('Unknown option: ' + name);
      }
      if (option.type == 'boolean') {
        if (value && value !== true) {
          throw Error('Invalid argument: ' + name + '=' + value);
        } else if (value !== false) {
          // Boolean options are set to true if value is not defined.
          value = true;
        }
      }
      option.value = option.type == 'boolean' ? !!value : value;
    }

    function getOption(name) {
      var option = options[name];
      if (!option) {
        throw Error('Unknown option: ' + name);
      }
      return option.value;
    }

    var createCircularJumpList = function() {
      var size = 100;
      var pointer = -1;
      var head = 0;
      var tail = 0;
      var buffer = new Array(size);
      function add(cm, oldCur, newCur) {
        var current = pointer % size;
        var curMark = buffer[current];
        function useNextSlot(cursor) {
          var next = ++pointer % size;
          var trashMark = buffer[next];
          if (trashMark) {
            trashMark.clear();
          }
          buffer[next] = cm.setBookmark(cursor);
        }
        if (curMark) {
          var markPos = curMark.find();
          // avoid recording redundant cursor position
          if (markPos && !cursorEqual(markPos, oldCur)) {
            useNextSlot(oldCur);
          }
        } else {
          useNextSlot(oldCur);
        }
        useNextSlot(newCur);
        head = pointer;
        tail = pointer - size + 1;
        if (tail < 0) {
          tail = 0;
        }
      }
      function move(cm, offset) {
        pointer += offset;
        if (pointer > head) {
          pointer = head;
        } else if (pointer < tail) {
          pointer = tail;
        }
        var mark = buffer[(size + pointer) % size];
        // skip marks that are temporarily removed from text buffer
        if (mark && !mark.find()) {
          var inc = offset > 0 ? 1 : -1;
          var newCur;
          var oldCur = cm.getCursor();
          do {
            pointer += inc;
            mark = buffer[(size + pointer) % size];
            // skip marks that are the same as current position
            if (mark &&
                (newCur = mark.find()) &&
                !cursorEqual(oldCur, newCur)) {
              break;
            }
          } while (pointer < head && pointer > tail);
        }
        return mark;
      }
      return {
        cachedCursor: undefined, //used for # and * jumps
        add: add,
        move: move
      };
    };

    // Returns an object to track the changes associated insert mode.  It
    // clones the object that is passed in, or creates an empty object one if
    // none is provided.
    var createInsertModeChanges = function(c) {
      if (c) {
        // Copy construction
        return {
          changes: c.changes,
          expectCursorActivityForChange: c.expectCursorActivityForChange
        };
      }
      return {
        // Change list
        changes: [],
        // Set to true on change, false on cursorActivity.
        expectCursorActivityForChange: false
      };
    };

    function MacroModeState() {
      this.latestRegister = undefined;
      this.isPlaying = false;
      this.isRecording = false;
      this.replaySearchQueries = [];
      this.onRecordingDone = undefined;
      this.lastInsertModeChanges = createInsertModeChanges();
    }
    MacroModeState.prototype = {
      exitMacroRecordMode: function() {
        var macroModeState = vimGlobalState.macroModeState;
        if (macroModeState.onRecordingDone) {
          macroModeState.onRecordingDone(); // close dialog
        }
        macroModeState.onRecordingDone = undefined;
        macroModeState.isRecording = false;
      },
      enterMacroRecordMode: function(cm, registerName) {
        var register =
            vimGlobalState.registerController.getRegister(registerName);
        if (register) {
          register.clear();
          this.latestRegister = registerName;
          if (cm.openDialog) {
            this.onRecordingDone = cm.openDialog(
                '(recording)['+registerName+']', null, {bottom:true});
          }
          this.isRecording = true;
        }
      }
    };

    function maybeInitVimState(cm) {
      if (!cm.state.vim) {
        // Store instance state in the CodeMirror object.
        cm.state.vim = {
          inputState: new InputState(),
          // Vim's input state that triggered the last edit, used to repeat
          // motions and operators with '.'.
          lastEditInputState: undefined,
          // Vim's action command before the last edit, used to repeat actions
          // with '.' and insert mode repeat.
          lastEditActionCommand: undefined,
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
          // Mark for rendering fake cursor for visual mode.
          fakeCursor: null,
          insertMode: false,
          // Repeat count for changes made in insert mode, triggered by key
          // sequences like 3,i. Only exists when insertMode is true.
          insertModeRepeat: undefined,
          visualMode: false,
          // If we are in visual line mode. No effect if visualMode is false.
          visualLine: false,
          visualBlock: false,
          lastSelection: null,
          lastPastedText: null,
          // Used by two-character ESC keymap routines. Should not be changed from false here.
          awaitingEscapeSecondCharacter: false
        };
      }
      return cm.state.vim;
    }
    var vimGlobalState;
    function resetVimGlobalState() {
      vimGlobalState = {
        // The current search query.
        searchQuery: null,
        // Whether we are searching backwards.
        searchIsReversed: false,
        // Replace part of the last substituted pattern
        lastSubstituteReplacePart: undefined,
        jumpList: createCircularJumpList(),
        macroModeState: new MacroModeState,
        // Recording latest f, t, F or T motion command.
        lastChararacterSearch: {increment:0, forward:true, selectedCharacter:''},
        registerController: new RegisterController({}),
        // search history buffer
        searchHistoryController: new HistoryController({}),
        // ex Command history buffer
        exCommandHistoryController : new HistoryController({})
      };
      for (var optionName in options) {
        var option = options[optionName];
        option.value = option.defaultValue;
      }
    }

    var vimApi= {
      buildKeyMap: function() {
        // TODO: Convert keymap into dictionary format for fast lookup.
      },
      // Testing hook, though it might be useful to expose the register
      // controller anyways.
      getRegisterController: function() {
        return vimGlobalState.registerController;
      },
      // Testing hook.
      resetVimGlobalState_: resetVimGlobalState,

      // Testing hook.
      getVimGlobalState_: function() {
        return vimGlobalState;
      },

      // Testing hook.
      maybeInitVimState_: maybeInitVimState,

      InsertModeKey: InsertModeKey,
      map: function(lhs, rhs, ctx) {
        // Add user defined key bindings.
        exCommandDispatcher.map(lhs, rhs, ctx);
      },
      setOption: setOption,
      getOption: getOption,
      defineOption: defineOption,
      defineEx: function(name, prefix, func){
        if (name.indexOf(prefix) !== 0) {
          throw new Error('(Vim.defineEx) "'+prefix+'" is not a prefix of "'+name+'", command not registered');
        }
        exCommands[name]=func;
        exCommandDispatcher.commandMap_[prefix]={name:name, shortName:prefix, type:'api'};
      },
      // This is the outermost function called by CodeMirror, after keys have
      // been mapped to their Vim equivalents.
      handleKey: function(cm, key) {
        var command;
        var vim = maybeInitVimState(cm);
        var macroModeState = vimGlobalState.macroModeState;
        if (macroModeState.isRecording) {
          if (key == 'q') {
            macroModeState.exitMacroRecordMode();
            clearInputState(cm);
            return;
          }
        }
        if (key == '<Esc>') {
          // Clear input state and get back to normal mode.
          clearInputState(cm);
          if (vim.visualMode) {
            exitVisualMode(cm);
          }
          return;
        }
        // Enter visual mode when the mouse selects text.
        if (!vim.visualMode &&
            !cursorEqual(cm.getCursor('head'), cm.getCursor('anchor'))) {
          vim.visualMode = true;
          vim.visualLine = false;
          CodeMirror.signal(cm, "vim-mode-change", {mode: "visual"});
          cm.on('mousedown', exitVisualMode);
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
          if (macroModeState.isRecording) {
            logKey(macroModeState, key);
          }
          return;
        }
        if (command.type == 'keyToKey') {
          // TODO: prevent infinite recursion.
          for (var i = 0; i < command.toKeys.length; i++) {
            this.handleKey(cm, command.toKeys[i]);
          }
        } else {
          if (macroModeState.isRecording) {
            logKey(macroModeState, key);
          }
          commandDispatcher.processCommand(cm, vim, command);
        }
      },
      handleEx: function(cm, input) {
        exCommandDispatcher.processCommand(cm, input);
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
      this.registerName = null; // Defaults to the unnamed register.
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

    function clearInputState(cm, reason) {
      cm.state.vim.inputState = new InputState();
      CodeMirror.signal(cm, 'vim-command-done', reason);
    }

    /*
     * Register stores information about copy and paste registers.  Besides
     * text, a register must store whether it is linewise (i.e., when it is
     * pasted, should it insert itself into a new line, or should the text be
     * inserted at the cursor position.)
     */
    function Register(text, linewise, blockwise) {
      this.clear();
      this.keyBuffer = [text || ''];
      this.insertModeChanges = [];
      this.searchQueries = [];
      this.linewise = !!linewise;
      this.blockwise = !!blockwise;
    }
    Register.prototype = {
      setText: function(text, linewise, blockwise) {
        this.keyBuffer = [text || ''];
        this.linewise = !!linewise;
        this.blockwise = !!blockwise;
      },
      pushText: function(text, linewise) {
        // if this register has ever been set to linewise, use linewise.
        if (linewise) {
          if (!this.linewise) {
            this.keyBuffer.push('\n');
          }
          this.linewise = true;
        }
        this.keyBuffer.push(text);
      },
      pushInsertModeChanges: function(changes) {
        this.insertModeChanges.push(createInsertModeChanges(changes));
      },
      pushSearchQuery: function(query) {
        this.searchQueries.push(query);
      },
      clear: function() {
        this.keyBuffer = [];
        this.insertModeChanges = [];
        this.searchQueries = [];
        this.linewise = false;
      },
      toString: function() {
        return this.keyBuffer.join('');
      }
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
      this.unnamedRegister = registers['"'] = new Register();
      registers['.'] = new Register();
      registers[':'] = new Register();
      registers['/'] = new Register();
    }
    RegisterController.prototype = {
      pushText: function(registerName, operator, text, linewise, blockwise) {
        if (linewise && text.charAt(0) == '\n') {
          text = text.slice(1) + '\n';
        }
        if (linewise && text.charAt(text.length - 1) !== '\n'){
          text += '\n';
        }
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
              this.registers['0'] = new Register(text, linewise, blockwise);
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
          this.unnamedRegister.setText(text, linewise, blockwise);
          return;
        }

        // If we've gotten to this point, we've actually specified a register
        var append = isUpperCase(registerName);
        if (append) {
          register.pushText(text, linewise);
        } else {
          register.setText(text, linewise, blockwise);
        }
        // The unnamed register always has the same value as the last used
        // register.
        this.unnamedRegister.setText(register.toString(), linewise);
      },
      // Gets the register named @name.  If one of @name doesn't already exist,
      // create it.  If @name is invalid, return the unnamedRegister.
      getRegister: function(name) {
        if (!this.isValidRegister(name)) {
          return this.unnamedRegister;
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
    function HistoryController() {
        this.historyBuffer = [];
        this.iterator;
        this.initialPrefix = null;
    }
    HistoryController.prototype = {
      // the input argument here acts a user entered prefix for a small time
      // until we start autocompletion in which case it is the autocompleted.
      nextMatch: function (input, up) {
        var historyBuffer = this.historyBuffer;
        var dir = up ? -1 : 1;
        if (this.initialPrefix === null) this.initialPrefix = input;
        for (var i = this.iterator + dir; up ? i >= 0 : i < historyBuffer.length; i+= dir) {
          var element = historyBuffer[i];
          for (var j = 0; j <= element.length; j++) {
            if (this.initialPrefix == element.substring(0, j)) {
              this.iterator = i;
              return element;
            }
          }
        }
        // should return the user input in case we reach the end of buffer.
        if (i >= historyBuffer.length) {
          this.iterator = historyBuffer.length;
          return this.initialPrefix;
        }
        // return the last autocompleted query or exCommand as it is.
        if (i < 0 ) return input;
      },
      pushInput: function(input) {
        var index = this.historyBuffer.indexOf(input);
        if (index > -1) this.historyBuffer.splice(index, 1);
        if (input.length) this.historyBuffer.push(input);
      },
      reset: function() {
        this.initialPrefix = null;
        this.iterator = this.historyBuffer.length;
      }
    };
    var commandDispatcher = {
      matchCommand: function(key, keyMap, vim) {
        var inputState = vim.inputState;
        var keys = inputState.keyBuffer.concat(key);
        var matchedCommands = [];
        var selectedCharacter;
        for (var i = 0; i < keyMap.length; i++) {
          var command = keyMap[i];
          if (matchKeysPartial(keys, command.keys)) {
            if (inputState.operator && command.type == 'action') {
              // Ignore matched action commands after an operator. Operators
              // only operate on motions. This check is really for text
              // objects since aW, a[ etcs conflicts with a.
              continue;
            }
            // Match commands that take <character> as an argument.
            if (command.keys[keys.length - 1] == 'character') {
              selectedCharacter = keys[keys.length - 1];
              if (selectedCharacter.length>1){
                switch(selectedCharacter){
                  case '<CR>':
                    selectedCharacter='\n';
                    break;
                  case '<Space>':
                    selectedCharacter=' ';
                    break;
                  default:
                    continue;
                }
              }
            }
            // Add the command to the list of matched commands. Choose the best
            // command later.
            matchedCommands.push(command);
          }
        }

        // Returns the command if it is a full match, or null if not.
        function getFullyMatchedCommandOrNull(command) {
          if (keys.length < command.keys.length) {
            // Matches part of a multi-key command. Buffer and wait for next
            // stroke.
            inputState.keyBuffer.push(key);
            return null;
          } else {
            if (command.keys[keys.length - 1] == 'character') {
              inputState.selectedCharacter = selectedCharacter;
            }
            // Clear the buffer since a full match was found.
            inputState.keyBuffer = [];
            return command;
          }
        }

        if (!matchedCommands.length) {
          // Clear the buffer since there were no matches.
          inputState.keyBuffer = [];
          return null;
        } else if (matchedCommands.length == 1) {
          return getFullyMatchedCommandOrNull(matchedCommands[0]);
        } else {
          // Find the best match in the list of matchedCommands.
          var context = vim.visualMode ? 'visual' : 'normal';
          var bestMatch; // Default to first in the list.
          for (var i = 0; i < matchedCommands.length; i++) {
            var current = matchedCommands[i];
            if (current.context == context) {
              bestMatch = current;
              break;
            } else if (!bestMatch && !current.context) {
              // Only set an imperfect match to best match if no best match is
              // set and the imperfect match is not restricted to another
              // context.
              bestMatch = current;
            }
          }
          return getFullyMatchedCommandOrNull(bestMatch);
        }
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
            clearInputState(cm);
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
        clearInputState(cm);
        vim.lastMotion = null;
        if (command.isEdit) {
          this.recordLastEdit(vim, inputState, command);
        }
        actions[command.action](cm, actionArgs, vim);
      },
      processSearch: function(cm, vim, command) {
        if (!cm.getSearchCursor) {
          // Search depends on SearchCursor.
          return;
        }
        var forward = command.searchArgs.forward;
        var wholeWordOnly = command.searchArgs.wholeWordOnly;
        getSearchState(cm).setReversed(!forward);
        var promptPrefix = (forward) ? '/' : '?';
        var originalQuery = getSearchState(cm).getQuery();
        var originalScrollPos = cm.getScrollInfo();
        function handleQuery(query, ignoreCase, smartCase) {
          vimGlobalState.searchHistoryController.pushInput(query);
          vimGlobalState.searchHistoryController.reset();
          try {
            updateSearchQuery(cm, query, ignoreCase, smartCase);
          } catch (e) {
            showConfirm(cm, 'Invalid regex: ' + query);
            return;
          }
          commandDispatcher.processMotion(cm, vim, {
            type: 'motion',
            motion: 'findNext',
            motionArgs: { forward: true, toJumplist: command.searchArgs.toJumplist }
          });
        }
        function onPromptClose(query) {
          cm.scrollTo(originalScrollPos.left, originalScrollPos.top);
          handleQuery(query, true /** ignoreCase */, true /** smartCase */);
          var macroModeState = vimGlobalState.macroModeState;
          if (macroModeState.isRecording) {
            logSearchQuery(macroModeState, query);
          }
        }
        function onPromptKeyUp(e, query, close) {
          var keyName = CodeMirror.keyName(e), up;
          if (keyName == 'Up' || keyName == 'Down') {
            up = keyName == 'Up' ? true : false;
            query = vimGlobalState.searchHistoryController.nextMatch(query, up) || '';
            close(query);
          } else {
            if ( keyName != 'Left' && keyName != 'Right' && keyName != 'Ctrl' && keyName != 'Alt' && keyName != 'Shift')
              vimGlobalState.searchHistoryController.reset();
          }
          var parsedQuery;
          try {
            parsedQuery = updateSearchQuery(cm, query,
                true /** ignoreCase */, true /** smartCase */);
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
            vimGlobalState.searchHistoryController.pushInput(query);
            vimGlobalState.searchHistoryController.reset();
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
            var macroModeState = vimGlobalState.macroModeState;
            if (macroModeState.isPlaying) {
              var query = macroModeState.replaySearchQueries.shift();
              handleQuery(query, true /** ignoreCase */, false /** smartCase */);
            } else {
              showPrompt(cm, {
                  onClose: onPromptClose,
                  prefix: promptPrefix,
                  desc: searchPromptDesc,
                  onKeyUp: onPromptKeyUp,
                  onKeyDown: onPromptKeyDown
              });
            }
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
                word.end.ch);
            if (isKeyword && wholeWordOnly) {
                query = '\\b' + query + '\\b';
            } else {
              query = escapeRegex(query);
            }

            // cachedCursor is used to save the old position of the cursor
            // when * or # causes vim to seek for the nearest word and shift
            // the cursor before entering the motion.
            vimGlobalState.jumpList.cachedCursor = cm.getCursor();
            cm.setCursor(word.start);

            handleQuery(query, true /** ignoreCase */, false /** smartCase */);
            break;
        }
      },
      processEx: function(cm, vim, command) {
        function onPromptClose(input) {
          // Give the prompt some time to close so that if processCommand shows
          // an error, the elements don't overlap.
          vimGlobalState.exCommandHistoryController.pushInput(input);
          vimGlobalState.exCommandHistoryController.reset();
          exCommandDispatcher.processCommand(cm, input);
        }
        function onPromptKeyDown(e, input, close) {
          var keyName = CodeMirror.keyName(e), up;
          if (keyName == 'Esc' || keyName == 'Ctrl-C' || keyName == 'Ctrl-[') {
            vimGlobalState.exCommandHistoryController.pushInput(input);
            vimGlobalState.exCommandHistoryController.reset();
            CodeMirror.e_stop(e);
            close();
            cm.focus();
          }
          if (keyName == 'Up' || keyName == 'Down') {
            up = keyName == 'Up' ? true : false;
            input = vimGlobalState.exCommandHistoryController.nextMatch(input, up) || '';
            close(input);
          } else {
            if ( keyName != 'Left' && keyName != 'Right' && keyName != 'Ctrl' && keyName != 'Alt' && keyName != 'Shift')
              vimGlobalState.exCommandHistoryController.reset();
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
        var selectionEnd = copyCursor(cm.getCursor('head'));
        var selectionStart = copyCursor(cm.getCursor('anchor'));
        // The difference between cur and selection cursors are that cur is
        // being operated on and ignores that there is a selection.
        var curStart = copyCursor(selectionEnd);
        var curOriginal = copyCursor(curStart);
        var curEnd;
        var repeat;
        if (operator) {
          this.recordLastEdit(vim, inputState);
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
        clearInputState(cm);
        if (motion) {
          var motionResult = motions[motion](cm, motionArgs, vim);
          vim.lastMotion = motions[motion];
          if (!motionResult) {
            return;
          }
          if (motionArgs.toJumplist) {
            var jumpList = vimGlobalState.jumpList;
            // if the current motion is # or *, use cachedCursor
            var cachedCursor = jumpList.cachedCursor;
            if (cachedCursor) {
              recordJumpPosition(cm, cachedCursor, motionResult);
              delete jumpList.cachedCursor;
            } else {
              recordJumpPosition(cm, curOriginal, motionResult);
            }
          }
          if (motionResult instanceof Array) {
            curStart = motionResult[0];
            curEnd = motionResult[1];
          } else {
            curEnd = motionResult;
          }
          // TODO: Handle null returns from motion commands better.
          if (!curEnd) {
            curEnd = Pos(curStart.line, curStart.ch);
          }
          if (vim.visualMode) {
            // Check if the selection crossed over itself. Will need to shift
            // the start point if that happened.
            // offset is set to -1 or 1 to shift the curEnd
            // left or right
            var offset = 0;
            if (cursorIsBefore(selectionStart, selectionEnd) &&
                (cursorEqual(selectionStart, curEnd) ||
                    cursorIsBefore(curEnd, selectionStart))) {
              // The end of the selection has moved from after the start to
              // before the start. We will shift the start right by 1.
              selectionStart.ch += 1;
              offset = -1;
            } else if (cursorIsBefore(selectionEnd, selectionStart) &&
                (cursorEqual(selectionStart, curEnd) ||
                    cursorIsBefore(selectionStart, curEnd))) {
              // The opposite happened. We will shift the start left by 1.
              selectionStart.ch -= 1;
              offset = 1;
            }
            // in case of visual Block selectionStart and curEnd
            // may not be on the same line,
            // Also, In case of v_o this should not happen.
            if (!vim.visualBlock && !(motionResult instanceof Array)) {
              curEnd.ch += offset;
            }
            if (vim.lastHPos != Infinity) {
              vim.lastHPos = curEnd.ch;
            }
            selectionEnd = curEnd;
            selectionStart = (motionResult instanceof Array) ? curStart : selectionStart;
            if (vim.visualLine) {
              if (cursorIsBefore(selectionStart, selectionEnd)) {
                selectionStart.ch = 0;

                var lastLine = cm.lastLine();
                if (selectionEnd.line > lastLine) {
                  selectionEnd.line = lastLine;
                }
                selectionEnd.ch = lineLength(cm, selectionEnd.line);
              } else {
                selectionEnd.ch = 0;
                selectionStart.ch = lineLength(cm, selectionStart.line);
              }
            } else if (vim.visualBlock) {
              // Select a block and
              // return the diagonally opposite end.
              selectionStart = selectBlock(cm, selectionEnd);
            }
            if (!vim.visualBlock) {
              cm.setSelection(selectionStart, selectionEnd);
            }
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
          var lastSelection = vim.lastSelection;
          operatorArgs.repeat = repeat; // Indent in visual mode needs this.
          if (vim.visualMode) {
            curStart = selectionStart;
            curEnd = selectionEnd;
            motionArgs.inclusive = true;
            operatorArgs.shouldMoveCursor = false;
          }
          // Swap start and end if motion was backward.
          if (curEnd && cursorIsBefore(curEnd, curStart)) {
            var tmp = curStart;
            curStart = curEnd;
            curEnd = tmp;
            inverted = true;
          } else if (!curEnd) {
            curEnd = copyCursor(curStart);
          }
          if (motionArgs.inclusive && !vim.visualMode) {
            // Move the selection end one to the right to include the last
            // character.
            curEnd.ch++;
          }
          if (operatorArgs.selOffset) {
            // Replaying a visual mode operation
            curEnd.line = curStart.line + operatorArgs.selOffset.line;
            if (operatorArgs.selOffset.line) {curEnd.ch = operatorArgs.selOffset.ch; }
            else { curEnd.ch = curStart.ch + operatorArgs.selOffset.ch; }
            // In case of blockwise visual
            if (lastSelection && lastSelection.visualBlock) {
              var block = lastSelection.visualBlock;
              var width = block.width;
              var height = block.height;
              curEnd = Pos(curStart.line + height, curStart.ch + width);
              // selectBlock creates a 'proper' rectangular block.
              // We do not want that in all cases, so we manually set selections.
              var selections = [];
              for (var i = curStart.line; i < curEnd.line; i++) {
                var anchor = Pos(i, curStart.ch);
                var head = Pos(i, curEnd.ch);
                var range = {anchor: anchor, head: head};
                selections.push(range);
              }
              cm.setSelections(selections);
              var blockSelected = true;
            }
          } else if (vim.visualMode) {
            var selOffset = Pos();
            selOffset.line = curEnd.line - curStart.line;
            if (selOffset.line) { selOffset.ch = curEnd.ch; }
            else { selOffset.ch = curEnd.ch - curStart.ch; }
            operatorArgs.selOffset = selOffset;
          }
          var linewise = motionArgs.linewise ||
              (vim.visualMode && vim.visualLine) ||
              operatorArgs.linewise;
          if (linewise) {
            // Expand selection to entire line.
            expandSelectionToLine(cm, curStart, curEnd);
          } else if (motionArgs.forward) {
            // Clip to trailing newlines only if the motion goes forward.
            clipToLine(cm, curStart, curEnd);
          }
          operatorArgs.registerName = registerName;
          // Keep track of linewise as it affects how paste and change behave.
          operatorArgs.linewise = linewise;
          if (!vim.visualBlock && !blockSelected) {
            cm.setSelection(curStart, curEnd);
          }
          operators[operator](cm, operatorArgs, vim, curStart,
              curEnd, curOriginal);
          if (vim.visualMode) {
            exitVisualMode(cm);
          }
        }
      },
      recordLastEdit: function(vim, inputState, actionCommand) {
        var macroModeState = vimGlobalState.macroModeState;
        if (macroModeState.isPlaying) { return; }
        vim.lastEditInputState = inputState;
        vim.lastEditActionCommand = actionCommand;
        macroModeState.lastInsertModeChanges.changes = [];
        macroModeState.lastInsertModeChanges.expectCursorActivityForChange = false;
      }
    };

    /**
     * typedef {Object{line:number,ch:number}} Cursor An object containing the
     *     position of the cursor.
     */
    // All of the functions below return Cursor objects.
    var motions = {
      moveToTopLine: function(cm, motionArgs) {
        var line = getUserVisibleLines(cm).top + motionArgs.repeat -1;
        return Pos(line, findFirstNonWhiteSpaceCharacter(cm.getLine(line)));
      },
      moveToMiddleLine: function(cm) {
        var range = getUserVisibleLines(cm);
        var line = Math.floor((range.top + range.bottom) * 0.5);
        return Pos(line, findFirstNonWhiteSpaceCharacter(cm.getLine(line)));
      },
      moveToBottomLine: function(cm, motionArgs) {
        var line = getUserVisibleLines(cm).bottom - motionArgs.repeat +1;
        return Pos(line, findFirstNonWhiteSpaceCharacter(cm.getLine(line)));
      },
      expandToLine: function(cm, motionArgs) {
        // Expands forward to end of line, and then to next line if repeat is
        // >1. Does not handle backward motion!
        var cur = cm.getCursor();
        return Pos(cur.line + motionArgs.repeat - 1, Infinity);
      },
      findNext: function(cm, motionArgs) {
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
          var pos = mark.find();
          return motionArgs.linewise ? { line: pos.line, ch: findFirstNonWhiteSpaceCharacter(cm.getLine(pos.line)) } : pos;
        }
        return null;
      },
      moveToOtherHighlightedEnd: function(cm, motionArgs, vim) {
        var ranges = cm.listSelections();
        var curEnd = cm.getCursor('head');
        var curStart = ranges[0].anchor;
        var curIndex = cursorEqual(ranges[0].head, curEnd) ? ranges.length-1 : 0;
        if (motionArgs.sameLine && vim.visualBlock) {
          curStart = Pos(curEnd.line, ranges[curIndex].anchor.ch);
          curEnd = Pos(ranges[curIndex].head.line, curEnd.ch);
        } else {
          curStart = ranges[curIndex].anchor;
        }
        cm.setCursor(curEnd);
        return ([curEnd, curStart]);
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
              cursorIsBefore(mark, cursor) : cursorIsBefore(cursor, mark);

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
          best = Pos(best.line, findFirstNonWhiteSpaceCharacter(cm.getLine(best.line)));
        }
        return best;
      },
      moveByCharacters: function(cm, motionArgs) {
        var cur = cm.getCursor();
        var repeat = motionArgs.repeat;
        var ch = motionArgs.forward ? cur.ch + repeat : cur.ch - repeat;
        return Pos(cur.line, ch);
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
          case this.moveByScroll:
          case this.moveToColumn:
          case this.moveToEol:
            endCh = vim.lastHPos;
            break;
          default:
            vim.lastHPos = endCh;
        }
        var repeat = motionArgs.repeat+(motionArgs.repeatOffset||0);
        var line = motionArgs.forward ? cur.line + repeat : cur.line - repeat;
        var first = cm.firstLine();
        var last = cm.lastLine();
        // Vim cancels linewise motions that start on an edge and move beyond
        // that edge. It does not cancel motions that do not start on an edge.
        if ((line < first && cur.line == first) ||
            (line > last && cur.line == last)) {
          return;
        }
        if (motionArgs.toFirstChar){
          endCh=findFirstNonWhiteSpaceCharacter(cm.getLine(line));
          vim.lastHPos = endCh;
        }
        vim.lastHSPos = cm.charCoords(Pos(line, endCh),'div').left;
        return Pos(line, endCh);
      },
      moveByDisplayLines: function(cm, motionArgs, vim) {
        var cur = cm.getCursor();
        switch (vim.lastMotion) {
          case this.moveByDisplayLines:
          case this.moveByScroll:
          case this.moveByLines:
          case this.moveToColumn:
          case this.moveToEol:
            break;
          default:
            vim.lastHSPos = cm.charCoords(cur,'div').left;
        }
        var repeat = motionArgs.repeat;
        var res=cm.findPosV(cur,(motionArgs.forward ? repeat : -repeat),'line',vim.lastHSPos);
        if (res.hitSide) {
          if (motionArgs.forward) {
            var lastCharCoords = cm.charCoords(res, 'div');
            var goalCoords = { top: lastCharCoords.top + 8, left: vim.lastHSPos };
            var res = cm.coordsChar(goalCoords, 'div');
          } else {
            var resCoords = cm.charCoords(Pos(cm.firstLine(), 0), 'div');
            resCoords.left = vim.lastHSPos;
            res = cm.coordsChar(resCoords, 'div');
          }
        }
        vim.lastHPos = res.ch;
        return res;
      },
      moveByPage: function(cm, motionArgs) {
        // CodeMirror only exposes functions that move the cursor page down, so
        // doing this bad hack to move the cursor and move it back. evalInput
        // will move the cursor to where it should be in the end.
        var curStart = cm.getCursor();
        var repeat = motionArgs.repeat;
        return cm.findPosV(curStart, (motionArgs.forward ? repeat : -repeat), 'page');
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
        return Pos(line, 0);
      },
      moveByScroll: function(cm, motionArgs, vim) {
        var scrollbox = cm.getScrollInfo();
        var curEnd = null;
        var repeat = motionArgs.repeat;
        if (!repeat) {
          repeat = scrollbox.clientHeight / (2 * cm.defaultTextHeight());
        }
        var orig = cm.charCoords(cm.getCursor(), 'local');
        motionArgs.repeat = repeat;
        var curEnd = motions.moveByDisplayLines(cm, motionArgs, vim);
        if (!curEnd) {
          return null;
        }
        var dest = cm.charCoords(curEnd, 'local');
        cm.scrollTo(null, scrollbox.top + dest.top - orig.top);
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
        var increment = motionArgs.forward ? -1 : 1;
        recordLastCharacterSearch(increment, motionArgs);
        if (!curEnd) return null;
        curEnd.ch += increment;
        return curEnd;
      },
      moveToCharacter: function(cm, motionArgs) {
        var repeat = motionArgs.repeat;
        recordLastCharacterSearch(0, motionArgs);
        return moveToCharacter(cm, repeat, motionArgs.forward,
            motionArgs.selectedCharacter) || cm.getCursor();
      },
      moveToSymbol: function(cm, motionArgs) {
        var repeat = motionArgs.repeat;
        return findSymbol(cm, repeat, motionArgs.forward,
            motionArgs.selectedCharacter) || cm.getCursor();
      },
      moveToColumn: function(cm, motionArgs, vim) {
        var repeat = motionArgs.repeat;
        // repeat is equivalent to which column we want to move to!
        vim.lastHPos = repeat - 1;
        vim.lastHSPos = cm.charCoords(cm.getCursor(),'div').left;
        return moveToColumn(cm, repeat);
      },
      moveToEol: function(cm, motionArgs, vim) {
        var cur = cm.getCursor();
        vim.lastHPos = Infinity;
        var retval= Pos(cur.line + motionArgs.repeat - 1, Infinity);
        var end=cm.clipPos(retval);
        end.ch--;
        vim.lastHSPos = cm.charCoords(end,'div').left;
        return retval;
      },
      moveToFirstNonWhiteSpaceCharacter: function(cm) {
        // Go to the start of the line where the text begins, or the end for
        // whitespace-only lines
        var cursor = cm.getCursor();
        return Pos(cursor.line,
                   findFirstNonWhiteSpaceCharacter(cm.getLine(cursor.line)));
      },
      moveToMatchedSymbol: function(cm) {
        var cursor = cm.getCursor();
        var line = cursor.line;
        var ch = cursor.ch;
        var lineText = cm.getLine(line);
        var symbol;
        do {
          symbol = lineText.charAt(ch++);
          if (symbol && isMatchableSymbol(symbol)) {
            var style = cm.getTokenTypeAt(Pos(line, ch));
            if (style !== "string" && style !== "comment") {
              break;
            }
          }
        } while (symbol);
        if (symbol) {
          var matched = cm.findMatchingBracket(Pos(line, ch));
          return matched.to;
        } else {
          return cursor;
        }
      },
      moveToStartOfLine: function(cm) {
        var cursor = cm.getCursor();
        return Pos(cursor.line, 0);
      },
      moveToLineOrEdgeOfDocument: function(cm, motionArgs) {
        var lineNum = motionArgs.forward ? cm.lastLine() : cm.firstLine();
        if (motionArgs.repeatIsExplicit) {
          lineNum = motionArgs.repeat - cm.getOption('firstLineNumber');
        }
        return Pos(lineNum,
                   findFirstNonWhiteSpaceCharacter(cm.getLine(lineNum)));
      },
      textObjectManipulation: function(cm, motionArgs) {
        // TODO: lots of possible exceptions that can be thrown here. Try da(
        //     outside of a () block.

        // TODO: adding <> >< to this map doesn't work, presumably because
        // they're operators
        var mirroredPairs = {'(': ')', ')': '(',
                             '{': '}', '}': '{',
                             '[': ']', ']': '['};
        var selfPaired = {'\'': true, '"': true};

        var character = motionArgs.selectedCharacter;
        // 'b' refers to  '()' block.
        // 'B' refers to  '{}' block.
        if (character == 'b') {
          character = '(';
        } else if (character == 'B') {
          character = '{';
        }

        // Inclusive is the difference between a and i
        // TODO: Instead of using the additional text object map to perform text
        //     object operations, merge the map into the defaultKeyMap and use
        //     motionArgs to define behavior. Define separate entries for 'aw',
        //     'iw', 'a[', 'i[', etc.
        var inclusive = !motionArgs.textObjectInner;

        var tmp;
        if (mirroredPairs[character]) {
          tmp = selectCompanionObject(cm, character, inclusive);
        } else if (selfPaired[character]) {
          tmp = findBeginningAndEnd(cm, character, inclusive);
        } else if (character === 'W') {
          tmp = expandWordUnderCursor(cm, inclusive, true /** forward */,
                                                     true /** bigWord */);
        } else if (character === 'w') {
          tmp = expandWordUnderCursor(cm, inclusive, true /** forward */,
                                                     false /** bigWord */);
        } else {
          // No text object defined for this, don't move.
          return null;
        }

        return [tmp.start, tmp.end];
      },

      repeatLastCharacterSearch: function(cm, motionArgs) {
        var lastSearch = vimGlobalState.lastChararacterSearch;
        var repeat = motionArgs.repeat;
        var forward = motionArgs.forward === lastSearch.forward;
        var increment = (lastSearch.increment ? 1 : 0) * (forward ? -1 : 1);
        cm.moveH(-increment, 'char');
        motionArgs.inclusive = forward ? true : false;
        var curEnd = moveToCharacter(cm, repeat, forward, lastSearch.selectedCharacter);
        if (!curEnd) {
          cm.moveH(increment, 'char');
          return cm.getCursor();
        }
        curEnd.ch += increment;
        return curEnd;
      }
    };

    var operators = {
      change: function(cm, operatorArgs, vim) {
        var selections = cm.listSelections();
        var start = selections[0], end = selections[selections.length-1];
        var curStart = cursorIsBefore(start.anchor, start.head) ? start.anchor : start.head;
        var curEnd = cursorIsBefore(end.anchor, end.head) ? end.head : end.anchor;
        var text = cm.getSelection();
        var visualBlock = vim.visualBlock;
        if (vim.lastSelection && !vim.visualMode) {
          visualBlock = vim.lastSelection.visualBlock ? true : visualBlock;
        }
        var lastInsertModeChanges = vimGlobalState.macroModeState.lastInsertModeChanges;
        lastInsertModeChanges.inVisualBlock = visualBlock;
        var replacement = new Array(selections.length).join('1').split('1');
        // save the selectionEnd mark
        var selectionEnd = vim.marks['>'] ? vim.marks['>'].find() : cm.getCursor('head');
        vimGlobalState.registerController.pushText(
            operatorArgs.registerName, 'change', text,
            operatorArgs.linewise);
        if (operatorArgs.linewise) {
          // 'C' in visual block extends the block till eol for all lines
          if (visualBlock){
            var startLine = curStart.line;
            while (startLine <= curEnd.line) {
              var endCh = lineLength(cm, startLine);
              var head = Pos(startLine, endCh);
              var anchor = Pos(startLine, curStart.ch);
              startLine++;
              cm.replaceRange('', anchor, head);
            }
          } else {
            // Push the next line back down, if there is a next line.
            replacement = '\n';
            if (curEnd.line == curStart.line && curEnd.line == cm.lastLine()) {
              replacement = '';
            }
            cm.replaceRange(replacement, curStart, curEnd);
            cm.indentLine(curStart.line, 'smart');
            // null ch so setCursor moves to end of line.
            curStart.ch = null;
            cm.setCursor(curStart);
          }
        } else {
          // Exclude trailing whitespace if the range is not all whitespace.
          var text = cm.getRange(curStart, curEnd);
          if (!isWhiteSpaceString(text)) {
            var match = (/\s+$/).exec(text);
            if (match) {
              curEnd = offsetCursor(curEnd, 0, - match[0].length);
            }
          }
          if (visualBlock) {
            cm.replaceSelections(replacement);
          } else {
            cm.setCursor(curStart);
            cm.replaceRange('', curStart, curEnd);
          }
        }
        vim.marks['>'] = cm.setBookmark(selectionEnd);
        actions.enterInsertMode(cm, {}, cm.state.vim);
      },
      // delete is a javascript keyword.
      'delete': function(cm, operatorArgs, vim) {
        var selections = cm.listSelections();
        var start = selections[0], end = selections[selections.length-1];
        var curStart = cursorIsBefore(start.anchor, start.head) ? start.anchor : start.head;
        var curEnd = cursorIsBefore(end.anchor, end.head) ? end.head : end.anchor;
        // Save the '>' mark before cm.replaceRange clears it.
        var selectionEnd, selectionStart;
        var blockwise = vim.visualBlock;
        if (vim.visualMode) {
          selectionEnd = vim.marks['>'].find();
          selectionStart = vim.marks['<'].find();
        } else if (vim.lastSelection) {
          selectionEnd = vim.lastSelection.curStartMark.find();
          selectionStart = vim.lastSelection.curEndMark.find();
          blockwise = vim.lastSelection.visualBlock;
        }
        var text = cm.getSelection();
        vimGlobalState.registerController.pushText(
            operatorArgs.registerName, 'delete', text,
            operatorArgs.linewise, blockwise);
        var replacement = new Array(selections.length).join('1').split('1');
        // If the ending line is past the last line, inclusive, instead of
        // including the trailing \n, include the \n before the starting line
        if (operatorArgs.linewise &&
            curEnd.line == cm.lastLine() && curStart.line == curEnd.line) {
          var tmp = copyCursor(curEnd);
          curStart.line--;
          curStart.ch = lineLength(cm, curStart.line);
          curEnd = tmp;
          cm.replaceRange('', curStart, curEnd);
        } else {
          cm.replaceSelections(replacement);
        }
        // restore the saved bookmark
        if (selectionEnd) {
          var curStartMark = cm.setBookmark(selectionStart);
          var curEndMark = cm.setBookmark(selectionEnd);
          if (vim.visualMode) {
            vim.marks['<'] = curStartMark;
            vim.marks['>'] = curEndMark;
          } else {
            vim.lastSelection.curStartMark = curStartMark;
            vim.lastSelection.curEndMark = curEndMark;
          }
        }
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
      swapcase: function(cm, operatorArgs, _vim, _curStart, _curEnd, _curOriginal) {
        var selections = cm.getSelections();
        var ranges = cm.listSelections();
        var swapped = [];
        for (var j = 0; j < selections.length; j++) {
          var toSwap = selections[j];
          var text = '';
          for (var i = 0; i < toSwap.length; i++) {
            var character = toSwap.charAt(i);
            text += isUpperCase(character) ? character.toLowerCase() :
                character.toUpperCase();
          }
          swapped.push(text);
        }
        cm.replaceSelections(swapped);
        var curStart  = ranges[0].anchor;
        var curEnd = ranges[0].head;
        if (!operatorArgs.shouldMoveCursor) {
          cm.setCursor(cursorIsBefore(curStart, curEnd) ? curStart : curEnd);
        }
      },
      yank: function(cm, operatorArgs, vim, _curStart, _curEnd, curOriginal) {
        var text = cm.getSelection();
        vimGlobalState.registerController.pushText(
            operatorArgs.registerName, 'yank',
            text, operatorArgs.linewise, vim.visualBlock);
        cm.setCursor(curOriginal);
      }
    };

    var actions = {
      jumpListWalk: function(cm, actionArgs, vim) {
        if (vim.visualMode) {
          return;
        }
        var repeat = actionArgs.repeat;
        var forward = actionArgs.forward;
        var jumpList = vimGlobalState.jumpList;

        var mark = jumpList.move(cm, forward ? repeat : -repeat);
        var markPos = mark ? mark.find() : undefined;
        markPos = markPos ? markPos : cm.getCursor();
        cm.setCursor(markPos);
      },
      scroll: function(cm, actionArgs, vim) {
        if (vim.visualMode) {
          return;
        }
        var repeat = actionArgs.repeat || 1;
        var lineHeight = cm.defaultTextHeight();
        var top = cm.getScrollInfo().top;
        var delta = lineHeight * repeat;
        var newPos = actionArgs.forward ? top + delta : top - delta;
        var cursor = copyCursor(cm.getCursor());
        var cursorCoords = cm.charCoords(cursor, 'local');
        if (actionArgs.forward) {
          if (newPos > cursorCoords.top) {
             cursor.line += (newPos - cursorCoords.top) / lineHeight;
             cursor.line = Math.ceil(cursor.line);
             cm.setCursor(cursor);
             cursorCoords = cm.charCoords(cursor, 'local');
             cm.scrollTo(null, cursorCoords.top);
          } else {
             // Cursor stays within bounds.  Just reposition the scroll window.
             cm.scrollTo(null, newPos);
          }
        } else {
          var newBottom = newPos + cm.getScrollInfo().clientHeight;
          if (newBottom < cursorCoords.bottom) {
             cursor.line -= (cursorCoords.bottom - newBottom) / lineHeight;
             cursor.line = Math.floor(cursor.line);
             cm.setCursor(cursor);
             cursorCoords = cm.charCoords(cursor, 'local');
             cm.scrollTo(
                 null, cursorCoords.bottom - cm.getScrollInfo().clientHeight);
          } else {
             // Cursor stays within bounds.  Just reposition the scroll window.
             cm.scrollTo(null, newPos);
          }
        }
      },
      scrollToCursor: function(cm, actionArgs) {
        var lineNum = cm.getCursor().line;
        var charCoords = cm.charCoords(Pos(lineNum, 0), 'local');
        var height = cm.getScrollInfo().clientHeight;
        var y = charCoords.top;
        var lineHeight = charCoords.bottom - y;
        switch (actionArgs.position) {
          case 'center': y = y - (height / 2) + lineHeight;
            break;
          case 'bottom': y = y - height + lineHeight*1.4;
            break;
          case 'top': y = y + lineHeight*0.4;
            break;
        }
        cm.scrollTo(null, y);
      },
      replayMacro: function(cm, actionArgs, vim) {
        var registerName = actionArgs.selectedCharacter;
        var repeat = actionArgs.repeat;
        var macroModeState = vimGlobalState.macroModeState;
        if (registerName == '@') {
          registerName = macroModeState.latestRegister;
        }
        while(repeat--){
          executeMacroRegister(cm, vim, macroModeState, registerName);
        }
      },
      enterMacroRecordMode: function(cm, actionArgs) {
        var macroModeState = vimGlobalState.macroModeState;
        var registerName = actionArgs.selectedCharacter;
        macroModeState.enterMacroRecordMode(cm, registerName);
      },
      enterInsertMode: function(cm, actionArgs, vim) {
        if (cm.getOption('readOnly')) { return; }
        vim.insertMode = true;
        vim.insertModeRepeat = actionArgs && actionArgs.repeat || 1;
        var insertAt = (actionArgs) ? actionArgs.insertAt : null;
        if (vim.visualMode) {
          var selections = getSelectedAreaRange(cm, vim);
          var selectionStart = selections[0];
          var selectionEnd = selections[1];
        }
        if (insertAt == 'eol') {
          var cursor = cm.getCursor();
          cursor = Pos(cursor.line, lineLength(cm, cursor.line));
          cm.setCursor(cursor);
        } else if (insertAt == 'charAfter') {
          cm.setCursor(offsetCursor(cm.getCursor(), 0, 1));
        } else if (insertAt == 'firstNonBlank') {
          if (vim.visualMode && !vim.visualBlock) {
            if (selectionEnd.line < selectionStart.line) {
              cm.setCursor(selectionEnd);
            } else {
              selectionStart = Pos(selectionStart.line, 0);
              cm.setCursor(selectionStart);
            }
            cm.setCursor(motions.moveToFirstNonWhiteSpaceCharacter(cm));
          } else if (vim.visualBlock) {
            selectionEnd = Pos(selectionEnd.line, selectionStart.ch);
            cm.setCursor(selectionStart);
            selectBlock(cm, selectionEnd);
          } else {
            cm.setCursor(motions.moveToFirstNonWhiteSpaceCharacter(cm));
          }
        } else if (insertAt == 'endOfSelectedArea') {
          if (vim.visualBlock) {
            selectionStart = Pos(selectionStart.line, selectionEnd.ch);
            cm.setCursor(selectionStart);
            selectBlock(cm, selectionEnd);
          } else if (selectionEnd.line < selectionStart.line) {
            selectionEnd = Pos(selectionStart.line, 0);
            cm.setCursor(selectionEnd);
          }
        } else if (insertAt == 'inplace') {
          if (vim.visualMode){
            return;
          }
        }
        cm.setOption('keyMap', 'vim-insert');
        cm.setOption('disableInput', false);
        if (actionArgs && actionArgs.replace) {
          // Handle Replace-mode as a special case of insert mode.
          cm.toggleOverwrite(true);
          cm.setOption('keyMap', 'vim-replace');
          CodeMirror.signal(cm, "vim-mode-change", {mode: "replace"});
        } else {
          cm.setOption('keyMap', 'vim-insert');
          CodeMirror.signal(cm, "vim-mode-change", {mode: "insert"});
        }
        if (!vimGlobalState.macroModeState.isPlaying) {
          // Only record if not replaying.
          cm.on('change', onChange);
          CodeMirror.on(cm.getInputField(), 'keydown', onKeyEventTargetKeyDown);
        }
        if (vim.visualMode) {
          exitVisualMode(cm);
        }
      },
      toggleVisualMode: function(cm, actionArgs, vim) {
        var repeat = actionArgs.repeat;
        var curStart = cm.getCursor();
        var curEnd;
        var selections = cm.listSelections();
        // TODO: The repeat should actually select number of characters/lines
        //     equal to the repeat times the size of the previous visual
        //     operation.
        if (!vim.visualMode) {
          cm.on('mousedown', exitVisualMode);
          vim.visualMode = true;
          vim.visualLine = !!actionArgs.linewise;
          vim.visualBlock = !!actionArgs.blockwise;
          if (vim.visualLine) {
            curStart.ch = 0;
            curEnd = clipCursorToContent(
              cm, Pos(curStart.line + repeat - 1, lineLength(cm, curStart.line)),
              true /** includeLineBreak */);
          } else {
            curEnd = clipCursorToContent(
              cm, Pos(curStart.line, curStart.ch + repeat),
              true /** includeLineBreak */);
          }
          cm.setSelection(curStart, curEnd);
          CodeMirror.signal(cm, "vim-mode-change", {mode: "visual", subMode: vim.visualLine ? "linewise" : ""});
        } else {
          curStart = cm.getCursor('anchor');
          curEnd = cm.getCursor('head');
          if (vim.visualLine) {
            if (actionArgs.blockwise) {
              // This means Ctrl-V pressed in linewise visual
              vim.visualBlock = true;
              selectBlock(cm, curEnd);
              CodeMirror.signal(cm, 'vim-mode-change', {mode: 'visual', subMode: 'blockwise'});
            } else if (!actionArgs.linewise) {
              // v pressed in linewise, switch to characterwise visual mode
              CodeMirror.signal(cm, 'vim-mode-change', {mode: 'visual'});
            } else {
              exitVisualMode(cm);
            }
            vim.visualLine = false;
          } else if (vim.visualBlock) {
            if (actionArgs.linewise) {
              // Shift-V pressed in blockwise visual mode
              vim.visualLine = true;
              curStart = Pos(selections[0].anchor.line, 0);
              curEnd = Pos(selections[selections.length-1].anchor.line, lineLength(cm, selections[selections.length-1].anchor.line));
              cm.setSelection(curStart, curEnd);
              CodeMirror.signal(cm, 'vim-mode-change', {mode: 'visual', subMode: 'linewise'});
            } else if (!actionArgs.blockwise) {
              // v pressed in blockwise mode, Switch to characterwise
              if (curEnd != selections[0].head) {
                curStart = selections[0].anchor;
              } else {
                curStart = selections[selections.length-1].anchor;
              }
              cm.setSelection(curStart, curEnd);
              CodeMirror.signal(cm, 'vim-mode-change', {mode: 'visual'});
            } else {
              exitVisualMode(cm);
            }
            vim.visualBlock = false;
          } else if (actionArgs.linewise) {
              // Shift-V pressed in characterwise visual mode. Switch to linewise
              // visual mode instead of exiting visual mode.
              vim.visualLine = true;
              curStart.ch = cursorIsBefore(curStart, curEnd) ? 0 :
                lineLength(cm, curStart.line);
              curEnd.ch = cursorIsBefore(curStart, curEnd) ?
                lineLength(cm, curEnd.line) : 0;
              cm.setSelection(curStart, curEnd);
              CodeMirror.signal(cm, "vim-mode-change", {mode: "visual", subMode: "linewise"});
            } else if (actionArgs.blockwise) {
              vim.visualBlock = true;
              selectBlock(cm, curEnd);
              CodeMirror.signal(cm, 'vim-mode-change', {mode: 'visual', subMode: 'blockwise'});
            } else {
              exitVisualMode(cm);
            }
        }
        updateMark(cm, vim, '<', cursorIsBefore(curStart, curEnd) ? curStart
            : curEnd);
        updateMark(cm, vim, '>', cursorIsBefore(curStart, curEnd) ? curEnd
            : curStart);
      },
      reselectLastSelection: function(cm, _actionArgs, vim) {
        var curStart = vim.marks['<'].find();
        var curEnd = vim.marks['>'].find();
        var lastSelection = vim.lastSelection;
        if (lastSelection) {
          // Set the selections as per last selection
          var selectionStart = lastSelection.curStartMark.find();
          var selectionEnd = lastSelection.curEndMark.find();
          var blockwise = lastSelection.visualBlock;
          // update last selection
          updateLastSelection(cm, vim, curStart, curEnd);
          if (blockwise) {
            cm.setCursor(selectionStart);
            selectionStart = selectBlock(cm, selectionEnd);
          } else {
            cm.setSelection(selectionStart, selectionEnd);
            selectionStart = cm.getCursor('anchor');
            selectionEnd = cm.getCursor('head');
          }
          if (vim.visualMode) {
            updateMark(cm, vim, '<', cursorIsBefore(selectionStart, selectionEnd) ? selectionStart
              : selectionEnd);
            updateMark(cm, vim, '>', cursorIsBefore(selectionStart, selectionEnd) ? selectionEnd
              : selectionStart);
          }
          // Last selection is updated now
          vim.visualMode = true;
          if (lastSelection.visualLine) {
            vim.visualLine = true;
            vim.visualBlock = false;
          } else if (lastSelection.visualBlock) {
            vim.visualLine = false;
            vim.visualBlock = true;
          } else {
            vim.visualBlock = vim.visualLine = false;
          }
          CodeMirror.signal(cm, "vim-mode-change", {mode: "visual", subMode: vim.visualLine ? "linewise" : ""});
        }
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
          curEnd = clipCursorToContent(cm, Pos(curStart.line + repeat - 1,
                                               Infinity));
        }
        var finalCh = 0;
        cm.operation(function() {
          for (var i = curStart.line; i < curEnd.line; i++) {
            finalCh = lineLength(cm, curStart.line);
            var tmp = Pos(curStart.line + 1,
                          lineLength(cm, curStart.line + 1));
            var text = cm.getRange(curStart, tmp);
            text = text.replace(/\n\s*/g, ' ');
            cm.replaceRange(text, curStart, tmp);
          }
          var curFinalPos = Pos(curStart.line, finalCh);
          cm.setCursor(curFinalPos);
        });
      },
      newLineAndEnterInsertMode: function(cm, actionArgs, vim) {
        vim.insertMode = true;
        var insertAt = copyCursor(cm.getCursor());
        if (insertAt.line === cm.firstLine() && !actionArgs.after) {
          // Special case for inserting newline before start of document.
          cm.replaceRange('\n', Pos(cm.firstLine(), 0));
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
        this.enterInsertMode(cm, { repeat: actionArgs.repeat }, vim);
      },
      paste: function(cm, actionArgs, vim) {
        var cur = copyCursor(cm.getCursor());
        var register = vimGlobalState.registerController.getRegister(
            actionArgs.registerName);
        var text = register.toString();
        if (!text) {
          return;
        }
        if (actionArgs.matchIndent) {
          // length that considers tabs and cm.options.tabSize
          var whitespaceLength = function(str) {
            var tabs = (str.split("\t").length - 1);
            var spaces = (str.split(" ").length - 1);
            return tabs * cm.options.tabSize + spaces * 1;
          };
          var currentLine = cm.getLine(cm.getCursor().line);
          var indent = whitespaceLength(currentLine.match(/^\s*/)[0]);
          // chomp last newline b/c don't want it to match /^\s*/gm
          var chompedText = text.replace(/\n$/, '');
          var wasChomped = text !== chompedText;
          var firstIndent = whitespaceLength(text.match(/^\s*/)[0]);
          var text = chompedText.replace(/^\s*/gm, function(wspace) {
            var newIndent = indent + (whitespaceLength(wspace) - firstIndent);
            if (newIndent < 0) {
              return "";
            }
            else if (cm.options.indentWithTabs) {
              var quotient = Math.floor(newIndent / cm.options.tabSize);
              return Array(quotient + 1).join('\t');
            }
            else {
              return Array(newIndent + 1).join(' ');
            }
          });
          text += wasChomped ? "\n" : "";
        }
        if (actionArgs.repeat > 1) {
          var text = Array(actionArgs.repeat + 1).join(text);
        }
        var linewise = register.linewise;
        var blockwise = register.blockwise;
        if (linewise) {
          if(vim.visualMode) {
            text = vim.visualLine ? text.slice(0, -1) : '\n' + text.slice(0, text.length - 1) + '\n';
          } else if (actionArgs.after) {
            // Move the newline at the end to the start instead, and paste just
            // before the newline character of the line we are on right now.
            text = '\n' + text.slice(0, text.length - 1);
            cur.ch = lineLength(cm, cur.line);
          } else {
            cur.ch = 0;
          }
        } else {
          if (blockwise) {
            text = text.split('\n');
            for (var i = 0; i < text.length; i++) {
              text[i] = (text[i] == '') ? ' ' : text[i];
            }
          }
          cur.ch += actionArgs.after ? 1 : 0;
        }
        var curPosFinal;
        var idx;
        if (vim.visualMode) {
          //  save the pasted text for reselection if the need arises
          vim.lastPastedText = text;
          var lastSelectionCurEnd;
          var selectedArea = getSelectedAreaRange(cm, vim);
          var selectionStart = selectedArea[0];
          var selectionEnd = selectedArea[1];
          var selectedText = cm.getSelection();
          var selections = cm.listSelections();
          var emptyStrings = new Array(selections.length).join('1').split('1');
          // save the curEnd marker before it get cleared due to cm.replaceRange.
          if (vim.lastSelection) {
            lastSelectionCurEnd = vim.lastSelection.curEndMark.find();
          }
          // push the previously selected text to unnamed register
          vimGlobalState.registerController.unnamedRegister.setText(selectedText);
          if (blockwise) {
            // first delete the selected text
            cm.replaceSelections(emptyStrings);
            // Set new selections as per the block length of the yanked text
            selectionEnd = Pos(selectionStart.line + text.length-1, selectionStart.ch);
            cm.setCursor(selectionStart);
            selectBlock(cm, selectionEnd);
            cm.replaceSelections(text);
            curPosFinal = selectionStart;
          } else if (vim.visualBlock) {
            cm.replaceSelections(emptyStrings);
            cm.setCursor(selectionStart);
            cm.replaceRange(text, selectionStart, selectionStart);
            curPosFinal = selectionStart;
          } else {
            cm.replaceRange(text, selectionStart, selectionEnd);
            curPosFinal = cm.posFromIndex(cm.indexFromPos(selectionStart) + text.length - 1);
          }
          // restore the the curEnd marker
          if(lastSelectionCurEnd) {
            vim.lastSelection.curEndMark = cm.setBookmark(lastSelectionCurEnd);
          }
          if (linewise) {
            curPosFinal.ch=0;
          }
        } else {
          if (blockwise) {
            cm.setCursor(cur);
            for (var i = 0; i < text.length; i++) {
              var line = cur.line+i;
              if (line > cm.lastLine()) {
                cm.replaceRange('\n',  Pos(line, 0));
              }
              var lastCh = lineLength(cm, line);
              if (lastCh < cur.ch) {
                extendLineToColumn(cm, line, cur.ch);
              }
            }
            cm.setCursor(cur);
            selectBlock(cm, Pos(cur.line + text.length-1, cur.ch));
            cm.replaceSelections(text);
            curPosFinal = cur;
          } else {
            cm.replaceRange(text, cur);
            // Now fine tune the cursor to where we want it.
            if (linewise && actionArgs.after) {
              curPosFinal = Pos(
              cur.line + 1,
              findFirstNonWhiteSpaceCharacter(cm.getLine(cur.line + 1)));
            } else if (linewise && !actionArgs.after) {
              curPosFinal = Pos(
                cur.line,
                findFirstNonWhiteSpaceCharacter(cm.getLine(cur.line)));
            } else if (!linewise && actionArgs.after) {
              idx = cm.indexFromPos(cur);
              curPosFinal = cm.posFromIndex(idx + text.length - 1);
            } else {
              idx = cm.indexFromPos(cur);
              curPosFinal = cm.posFromIndex(idx + text.length);
            }
          }
        }
        cm.setCursor(curPosFinal);
        if (vim.visualMode) {
          exitVisualMode(cm);
        }
      },
      undo: function(cm, actionArgs) {
        cm.operation(function() {
          repeatFn(cm, CodeMirror.commands.undo, actionArgs.repeat)();
          cm.setCursor(cm.getCursor('anchor'));
        });
      },
      redo: function(cm, actionArgs) {
        repeatFn(cm, CodeMirror.commands.redo, actionArgs.repeat)();
      },
      setRegister: function(_cm, actionArgs, vim) {
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
        var selections = cm.listSelections();
        if (vim.visualMode) {
          curStart = cm.getCursor('start');
          curEnd = cm.getCursor('end');
        } else {
          var line = cm.getLine(curStart.line);
          replaceTo = curStart.ch + actionArgs.repeat;
          if (replaceTo > line.length) {
            replaceTo=line.length;
          }
          curEnd = Pos(curStart.line, replaceTo);
        }
        if (replaceWith=='\n') {
          if (!vim.visualMode) cm.replaceRange('', curStart, curEnd);
          // special case, where vim help says to replace by just one line-break
          (CodeMirror.commands.newlineAndIndentContinueComment || CodeMirror.commands.newlineAndIndent)(cm);
        } else {
          var replaceWithStr = cm.getRange(curStart, curEnd);
          //replace all characters in range by selected, but keep linebreaks
          replaceWithStr = replaceWithStr.replace(/[^\n]/g, replaceWith);
          if (vim.visualBlock) {
            // Tabs are split in visua block before replacing
            var spaces = new Array(cm.options.tabSize+1).join(' ');
            replaceWithStr = cm.getSelection();
            replaceWithStr = replaceWithStr.replace(/\t/g, spaces).replace(/[^\n]/g, replaceWith).split('\n');
            cm.replaceSelections(replaceWithStr);
          } else {
            cm.replaceRange(replaceWithStr, curStart, curEnd);
          }
          if (vim.visualMode) {
            curStart = cursorIsBefore(selections[0].anchor, selections[0].head) ?
                         selections[0].anchor : selections[0].head;
            cm.setCursor(curStart);
            exitVisualMode(cm);
          } else {
            cm.setCursor(offsetCursor(curEnd, 0, -1));
          }
        }
      },
      incrementNumberToken: function(cm, actionArgs) {
        var cur = cm.getCursor();
        var lineStr = cm.getLine(cur.line);
        var re = /-?\d+/g;
        var match;
        var start;
        var end;
        var numberStr;
        var token;
        while ((match = re.exec(lineStr)) !== null) {
          token = match[0];
          start = match.index;
          end = start + token.length;
          if (cur.ch < end)break;
        }
        if (!actionArgs.backtrack && (end <= cur.ch))return;
        if (token) {
          var increment = actionArgs.increase ? 1 : -1;
          var number = parseInt(token) + (increment * actionArgs.repeat);
          var from = Pos(cur.line, start);
          var to = Pos(cur.line, end);
          numberStr = number.toString();
          cm.replaceRange(numberStr, from, to);
        } else {
          return;
        }
        cm.setCursor(Pos(cur.line, start + numberStr.length - 1));
      },
      repeatLastEdit: function(cm, actionArgs, vim) {
        var lastEditInputState = vim.lastEditInputState;
        if (!lastEditInputState) { return; }
        var repeat = actionArgs.repeat;
        if (repeat && actionArgs.repeatIsExplicit) {
          vim.lastEditInputState.repeatOverride = repeat;
        } else {
          repeat = vim.lastEditInputState.repeatOverride || repeat;
        }
        repeatLastEdit(cm, vim, repeat, false /** repeatForInsert */);
      },
      changeCase: function(cm, actionArgs, vim) {
        var selectionStart = getSelectedAreaRange(cm, vim)[0];
        var text = cm.getSelection();
        var lastSelectionCurEnd;
        var blockSelection;
        if (vim.lastSelection) {
        // save the curEnd marker to avoid its removal due to cm.replaceRange
          lastSelectionCurEnd = vim.lastSelection.curEndMark.find();
          blockSelection = vim.lastSelection.visualBlock;
        }
        var toLower = actionArgs.toLower;
        text = toLower ? text.toLowerCase() : text.toUpperCase();
        cm.replaceSelections(vim.visualBlock || blockSelection ? text.split('\n') : [text]);
        // restore the last selection curEnd marker
        if (lastSelectionCurEnd) {
          vim.lastSelection.curEndMark = cm.setBookmark(lastSelectionCurEnd);
        }
        cm.setCursor(selectionStart);
        if (vim.visualMode) {
          exitVisualMode(cm);
        }
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
      return Pos(line, ch);
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
      return Pos(cur.line + offsetLine, cur.ch + offsetCh);
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
    function repeatFn(cm, fn, repeat) {
      return function() {
        for (var i = 0; i < repeat; i++) {
          fn(cm);
        }
      };
    }
    function copyCursor(cur) {
      return Pos(cur.line, cur.ch);
    }
    function cursorEqual(cur1, cur2) {
      return cur1.ch == cur2.ch && cur1.line == cur2.line;
    }
    function cursorIsBefore(cur1, cur2) {
      if (cur1.line < cur2.line) {
        return true;
      }
      if (cur1.line == cur2.line && cur1.ch < cur2.ch) {
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
      return s.split('').reverse().join('');
    }
    function trim(s) {
      if (s.trim) {
        return s.trim();
      }
      return s.replace(/^\s+|\s+$/g, '');
    }
    function escapeRegex(s) {
      return s.replace(/([.?*+$\[\]\/\\(){}|\-])/g, '\\$1');
    }
    function extendLineToColumn(cm, lineNum, column) {
      var endCh = lineLength(cm, lineNum);
      var spaces = new Array(column-endCh+1).join(' ');
      cm.setCursor(Pos(lineNum, endCh));
      cm.replaceRange(spaces, cm.getCursor());
    }
    // This functions selects a rectangular block
    // of text with selectionEnd as any of its corner
    // Height of block:
    // Difference in selectionEnd.line and first/last selection.line
    // Width of the block:
    // Distance between selectionEnd.ch and any(first considered here) selection.ch
    function selectBlock(cm, selectionEnd) {
      var selections = [], ranges = cm.listSelections();
      var firstRange = ranges[0].anchor, lastRange = ranges[ranges.length-1].anchor;
      var start, end, direction, selectionStart;
      var curEnd = cm.getCursor('head');
      var originalSelectionEnd = copyCursor(selectionEnd);
      start = firstRange.line;
      end = lastRange.line;
      if (selectionEnd.line < curEnd.line) {
        direction = 'up';
      } else if (selectionEnd.line > curEnd.line) {
        direction = 'down';
      } else {
        if (selectionEnd.ch != curEnd.ch) {
          direction = selectionEnd.ch > curEnd.ch ? 'right' : 'left';
        }
        selectionStart = cm.getCursor('anchor');
      }
      var primIndex = getIndex(ranges, curEnd);
      // sets to true when selectionEnd already lies inside the existing selections
      selectionEnd = cm.clipPos(selectionEnd);
      var contains = getIndex(ranges, selectionEnd) < 0 ? false : true;
      var isClipped = !cursorEqual(originalSelectionEnd, selectionEnd);
      // This function helps to check selection crossing
      // in case of short lines.
      var processSelectionCrossing = function() {
        if (isClipped) {
          if (curEnd.ch >= selectionStart.ch) {
            selectionStart.ch++;
          }
        } else if (curEnd.ch == lineLength(cm, curEnd.line)) {
          if (cursorEqual(ranges[primIndex].anchor, ranges[primIndex].head) && ranges.length>1) {
            if (direction == 'up') {
              if (contains || primIndex>0) {
              start = firstRange.line;
              end = selectionEnd.line;
              selectionStart = ranges[primIndex-1].anchor;
            }
          } else {
              if (contains || primIndex == 0) {
                end = lastRange.line;
                start = selectionEnd.line;
                selectionStart = ranges[primIndex+1].anchor;
              }
            }
            if (selectionEnd.ch >= selectionStart.ch) {
              selectionStart.ch--;
            }
          }
        }
      };
      switch(direction) {
        case 'up':
          start = contains ? firstRange.line : selectionEnd.line;
          end = contains ? selectionEnd.line : lastRange.line;
          selectionStart = lastRange;
          processSelectionCrossing();
          break;
        case 'down':
          start = contains ? selectionEnd.line : firstRange.line;
          end = contains ? lastRange.line : selectionEnd.line;
          selectionStart = firstRange;
          processSelectionCrossing();
          break;
        case 'left':
          if ((selectionEnd.ch <= selectionStart.ch) && (curEnd.ch > selectionStart.ch)) {
            selectionStart.ch++;
            selectionEnd.ch--;
          }
          break;
        case 'right':
          if ((selectionStart.ch <= selectionEnd.ch) && (curEnd.ch < selectionStart.ch)) {
            selectionStart.ch--;
            selectionEnd.ch++;
          }
          break;
        default:
          start = selectionStart.line;
          end = selectionEnd.line;
      }
      while (start <= end) {
        var anchor = {line: start, ch: selectionStart.ch};
        var head = {line: start, ch: selectionEnd.ch};
        var range = {anchor: anchor, head: head};
        selections.push(range);
        if (cursorEqual(head, selectionEnd)) {
            primIndex = selections.indexOf(range);
        }
        start++;
      }
      // Update selectionEnd and selectionStart
      // after selection crossing
      selectionEnd.ch = selections[0].head.ch;
      selectionStart.ch = selections[0].anchor.ch;
      if (cursorEqual(selectionEnd, selections[0].head)) {
        selectionStart.line = selections[selections.length-1].anchor.line;
      } else {
        selectionStart.line = selections[0].anchor.line;
      }
      cm.setSelections(selections, primIndex);
      return selectionStart;
    }
    // getIndex returns the index of the cursor in the selections.
    function getIndex(ranges, cursor, end) {
      var pos = -1;
      for (var i = 0; i < ranges.length; i++) {
        var atAnchor = cursorEqual(ranges[i].anchor, cursor);
        var atHead = cursorEqual(ranges[i].head, cursor);
        if (end == 'head') {
        pos = atHead ? i : pos;
        } else if (end == 'anchor') {
          pos = atAnchor ? i : pos;
        } else {
          pos = (atAnchor || atHead) ? i : pos;
        }
      }
      return pos;
    }
    function getSelectedAreaRange(cm, vim) {
      var lastSelection = vim.lastSelection;
      var getCurrentSelectedAreaRange = function() {
        var selections = cm.listSelections();
        var start =  selections[0];
        var end = selections[selections.length-1];
        var selectionStart = cursorIsBefore(start.anchor, start.head) ? start.anchor : start.head;
        var selectionEnd = cursorIsBefore(end.anchor, end.head) ? end.head : end.anchor;
        return [selectionStart, selectionEnd];
      };
      var getLastSelectedAreaRange = function() {
        var selectionStart = cm.getCursor();
        var selectionEnd = cm.getCursor();
        var block = lastSelection.visualBlock;
        if (block) {
          var width = block.width;
          var height = block.height;
          selectionEnd = Pos(selectionStart.line + height, selectionStart.ch + width);
          var selections = [];
          // selectBlock creates a 'proper' rectangular block.
          // We do not want that in all cases, so we manually set selections.
          for (var i = selectionStart.line; i < selectionEnd.line; i++) {
            var anchor = Pos(i, selectionStart.ch);
            var head = Pos(i, selectionEnd.ch);
            var range = {anchor: anchor, head: head};
            selections.push(range);
          }
          cm.setSelections(selections);
        } else {
          var start = lastSelection.curStartMark.find();
          var end = lastSelection.curEndMark.find();
          var line = end.line - start.line;
          var ch = end.ch - start.ch;
          selectionEnd = {line: selectionEnd.line + line, ch: line ? selectionEnd.ch : ch + selectionEnd.ch};
          if (lastSelection.visualLine) {
            selectionStart = Pos(selectionStart.line, 0);
            selectionEnd = Pos(selectionEnd.line, lineLength(cm, selectionEnd.line));
          }
          cm.setSelection(selectionStart, selectionEnd);
        }
        return [selectionStart, selectionEnd];
      };
      if (!vim.visualMode) {
      // In case of replaying the action.
        return getLastSelectedAreaRange();
      } else {
        return getCurrentSelectedAreaRange();
      }
    }
    function updateLastSelection(cm, vim, selectionStart, selectionEnd) {
      if (!selectionStart || !selectionEnd) {
        selectionStart = vim.marks['<'].find() || cm.getCursor('anchor');
        selectionEnd = vim.marks['>'].find() || cm.getCursor('head');
      }
      // To accommodate the effect of lastPastedText in the last selection
      if (vim.lastPastedText) {
        selectionEnd = cm.posFromIndex(cm.indexFromPos(selectionStart) + vim.lastPastedText.length);
        vim.lastPastedText = null;
      }
      var ranges = cm.listSelections();
      // This check ensures to set the cursor
      // position where we left off in previous selection
      var swap = getIndex(ranges, selectionStart, 'head') > -1;
      if (vim.visualBlock) {
        var height = Math.abs(selectionStart.line - selectionEnd.line)+1;
        var width =  Math.abs(selectionStart.ch - selectionEnd.ch);
        var block = {height: height, width: width};
      }
      // can't use selection state here because yank has already reset its cursor
      // Also, Bookmarks make the visual selections robust to edit operations
      vim.lastSelection = {'curStartMark': cm.setBookmark(swap ? selectionEnd : selectionStart),
                           'curEndMark': cm.setBookmark(swap ? selectionStart : selectionEnd),
                           'visualMode': vim.visualMode,
                           'visualLine': vim.visualLine,
                           'visualBlock': block};
    }

    function exitVisualMode(cm) {
      cm.off('mousedown', exitVisualMode);
      var vim = cm.state.vim;
      var selectionStart = cm.getCursor('anchor');
      var selectionEnd = cm.getCursor('head');
      // hack to place the cursor at the right place
      // in case of visual block
      if (vim.visualBlock && (cursorIsBefore(selectionStart, selectionEnd))) {
          selectionEnd.ch--;
      }
      updateLastSelection(cm, vim);
      vim.visualMode = false;
      vim.visualLine = false;
      vim.visualBlock = false;
      if (!cursorEqual(selectionStart, selectionEnd)) {
        cm.setCursor(clipCursorToContent(cm, selectionEnd));
      }
      CodeMirror.signal(cm, "vim-mode-change", {mode: "normal"});
      if (vim.fakeCursor) {
        vim.fakeCursor.clear();
      }
    }

    // Remove any trailing newlines from the selection. For
    // example, with the caret at the start of the last word on the line,
    // 'dw' should word, but not the newline, while 'w' should advance the
    // caret to the first character of the next line.
    function clipToLine(cm, curStart, curEnd) {
      var selection = cm.getRange(curStart, curEnd);
      // Only clip if the selection ends with trailing newline + whitespace
      if (/\n\s*$/.test(selection)) {
        var lines = selection.split('\n');
        // We know this is all whitepsace.
        lines.pop();

        // Cases:
        // 1. Last word is an empty line - do not clip the trailing '\n'
        // 2. Last word is not an empty line - clip the trailing '\n'
        var line;
        // Find the line containing the last word, and clip all whitespace up
        // to it.
        for (var line = lines.pop(); lines.length > 0 && line && isWhiteSpaceString(line); line = lines.pop()) {
          curEnd.line--;
          curEnd.ch = 0;
        }
        // If the last word is not an empty line, clip an additional newline
        if (line) {
          curEnd.line--;
          curEnd.ch = lineLength(cm, curEnd.line);
        } else {
          curEnd.ch = 0;
        }
      }
    }

    // Expand the selection to line ends.
    function expandSelectionToLine(_cm, curStart, curEnd) {
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

    function expandWordUnderCursor(cm, inclusive, _forward, bigWord, noSymbol) {
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
      var wordEnd = idx + wordAfterRegex[0].length;
      // TODO: Find a better way to do this. It will be slow on very long lines.
      var revTextBeforeIdx = reverse(textBeforeIdx);
      var wordBeforeRegex = matchRegex.exec(revTextBeforeIdx);
      if (wordBeforeRegex) {
        wordStart -= wordBeforeRegex[0].length;
      }

      if (inclusive) {
        // If present, trim all whitespace after word.
        // Otherwise, trim all whitespace before word.
        var textAfterWordEnd = line.substring(wordEnd);
        var whitespacesAfterWord = textAfterWordEnd.match(/^\s*/)[0].length;
        if (whitespacesAfterWord > 0) {
          wordEnd += whitespacesAfterWord;
        } else {
          var revTrim = revTextBeforeIdx.length - wordStart;
          var textBeforeWordStart = revTextBeforeIdx.substring(revTrim);
          var whitespacesBeforeWord = textBeforeWordStart.match(/^\s*/)[0].length;
          wordStart -= whitespacesBeforeWord;
        }
      }

      return { start: Pos(cur.line, wordStart),
               end: Pos(cur.line, wordEnd) };
    }

    function recordJumpPosition(cm, oldCur, newCur) {
      if (!cursorEqual(oldCur, newCur)) {
        vimGlobalState.jumpList.add(cm, oldCur, newCur);
      }
    }

    function recordLastCharacterSearch(increment, args) {
        vimGlobalState.lastChararacterSearch.increment = increment;
        vimGlobalState.lastChararacterSearch.forward = args.forward;
        vimGlobalState.lastChararacterSearch.selectedCharacter = args.selectedCharacter;
    }

    var symbolToMode = {
        '(': 'bracket', ')': 'bracket', '{': 'bracket', '}': 'bracket',
        '[': 'section', ']': 'section',
        '*': 'comment', '/': 'comment',
        'm': 'method', 'M': 'method',
        '#': 'preprocess'
    };
    var findSymbolModes = {
      bracket: {
        isComplete: function(state) {
          if (state.nextCh === state.symb) {
            state.depth++;
            if (state.depth >= 1)return true;
          } else if (state.nextCh === state.reverseSymb) {
            state.depth--;
          }
          return false;
        }
      },
      section: {
        init: function(state) {
          state.curMoveThrough = true;
          state.symb = (state.forward ? ']' : '[') === state.symb ? '{' : '}';
        },
        isComplete: function(state) {
          return state.index === 0 && state.nextCh === state.symb;
        }
      },
      comment: {
        isComplete: function(state) {
          var found = state.lastCh === '*' && state.nextCh === '/';
          state.lastCh = state.nextCh;
          return found;
        }
      },
      // TODO: The original Vim implementation only operates on level 1 and 2.
      // The current implementation doesn't check for code block level and
      // therefore it operates on any levels.
      method: {
        init: function(state) {
          state.symb = (state.symb === 'm' ? '{' : '}');
          state.reverseSymb = state.symb === '{' ? '}' : '{';
        },
        isComplete: function(state) {
          if (state.nextCh === state.symb)return true;
          return false;
        }
      },
      preprocess: {
        init: function(state) {
          state.index = 0;
        },
        isComplete: function(state) {
          if (state.nextCh === '#') {
            var token = state.lineText.match(/#(\w+)/)[1];
            if (token === 'endif') {
              if (state.forward && state.depth === 0) {
                return true;
              }
              state.depth++;
            } else if (token === 'if') {
              if (!state.forward && state.depth === 0) {
                return true;
              }
              state.depth--;
            }
            if (token === 'else' && state.depth === 0)return true;
          }
          return false;
        }
      }
    };
    function findSymbol(cm, repeat, forward, symb) {
      var cur = copyCursor(cm.getCursor());
      var increment = forward ? 1 : -1;
      var endLine = forward ? cm.lineCount() : -1;
      var curCh = cur.ch;
      var line = cur.line;
      var lineText = cm.getLine(line);
      var state = {
        lineText: lineText,
        nextCh: lineText.charAt(curCh),
        lastCh: null,
        index: curCh,
        symb: symb,
        reverseSymb: (forward ?  { ')': '(', '}': '{' } : { '(': ')', '{': '}' })[symb],
        forward: forward,
        depth: 0,
        curMoveThrough: false
      };
      var mode = symbolToMode[symb];
      if (!mode)return cur;
      var init = findSymbolModes[mode].init;
      var isComplete = findSymbolModes[mode].isComplete;
      if (init) { init(state); }
      while (line !== endLine && repeat) {
        state.index += increment;
        state.nextCh = state.lineText.charAt(state.index);
        if (!state.nextCh) {
          line += increment;
          state.lineText = cm.getLine(line) || '';
          if (increment > 0) {
            state.index = 0;
          } else {
            var lineLen = state.lineText.length;
            state.index = (lineLen > 0) ? (lineLen-1) : 0;
          }
          state.nextCh = state.lineText.charAt(state.index);
        }
        if (isComplete(state)) {
          cur.line = line;
          cur.ch = state.index;
          repeat--;
        }
      }
      if (state.nextCh || state.curMoveThrough) {
        return Pos(line, state.index);
      }
      return cur;
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
     * @param {boolean} emptyLineIsWord True if empty lines should be treated
     *     as words.
     * @return {Object{from:number, to:number, line: number}} The boundaries of
     *     the word, or null if there are no more words.
     */
    function findWord(cm, cur, forward, bigWord, emptyLineIsWord) {
      var lineNum = cur.line;
      var pos = cur.ch;
      var line = cm.getLine(lineNum);
      var dir = forward ? 1 : -1;
      var regexps = bigWord ? bigWordRegexp : wordRegexp;

      if (emptyLineIsWord && line == '') {
        lineNum += dir;
        line = cm.getLine(lineNum);
        if (!isLine(cm, lineNum)) {
          return null;
        }
        pos = (forward) ? 0 : line.length;
      }

      while (true) {
        if (emptyLineIsWord && line == '') {
          return { from: 0, to: 0, line: lineNum };
        }
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
      throw new Error('The impossible happened.');
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
      var curStart = copyCursor(cur);
      var words = [];
      if (forward && !wordEnd || !forward && wordEnd) {
        repeat++;
      }
      // For 'e', empty lines are not considered words, go figure.
      var emptyLineIsWord = !(forward && wordEnd);
      for (var i = 0; i < repeat; i++) {
        var word = findWord(cm, cur, forward, bigWord, emptyLineIsWord);
        if (!word) {
          var eodCh = lineLength(cm, cm.lastLine());
          words.push(forward
              ? {line: cm.lastLine(), from: eodCh, to: eodCh}
              : {line: 0, from: 0, to: 0});
          break;
        }
        words.push(word);
        cur = Pos(word.line, forward ? (word.to - 1) : word.from);
      }
      var shortCircuit = words.length != repeat;
      var firstWord = words[0];
      var lastWord = words.pop();
      if (forward && !wordEnd) {
        // w
        if (!shortCircuit && (firstWord.from != curStart.ch || firstWord.line != curStart.line)) {
          // We did not start in the middle of a word. Discard the extra word at the end.
          lastWord = words.pop();
        }
        return Pos(lastWord.line, lastWord.from);
      } else if (forward && wordEnd) {
        return Pos(lastWord.line, lastWord.to - 1);
      } else if (!forward && wordEnd) {
        // ge
        if (!shortCircuit && (firstWord.to != curStart.ch || firstWord.line != curStart.line)) {
          // We did not start in the middle of a word. Discard the extra word at the end.
          lastWord = words.pop();
        }
        return Pos(lastWord.line, lastWord.to);
      } else {
        // b
        return Pos(lastWord.line, lastWord.from);
      }
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
      return Pos(cm.getCursor().line, idx);
    }

    function moveToColumn(cm, repeat) {
      // repeat is always >= 1, so repeat - 1 always corresponds
      // to the column we want to go to.
      var line = cm.getCursor().line;
      return clipCursorToContent(cm, Pos(line, repeat - 1));
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

    // TODO: perhaps this finagling of start and end positions belonds
    // in codmirror/replaceRange?
    function selectCompanionObject(cm, symb, inclusive) {
      var cur = cm.getCursor(), start, end;

      var bracketRegexp = ({
        '(': /[()]/, ')': /[()]/,
        '[': /[[\]]/, ']': /[[\]]/,
        '{': /[{}]/, '}': /[{}]/})[symb];
      var openSym = ({
        '(': '(', ')': '(',
        '[': '[', ']': '[',
        '{': '{', '}': '{'})[symb];
      var curChar = cm.getLine(cur.line).charAt(cur.ch);
      // Due to the behavior of scanForBracket, we need to add an offset if the
      // cursor is on a matching open bracket.
      var offset = curChar === openSym ? 1 : 0;

      start = cm.scanForBracket(Pos(cur.line, cur.ch + offset), -1, null, {'bracketRegex': bracketRegexp});
      end = cm.scanForBracket(Pos(cur.line, cur.ch + offset), 1, null, {'bracketRegex': bracketRegexp});

      if (!start || !end) {
        return { start: cur, end: cur };
      }

      start = start.pos;
      end = end.pos;

      if ((start.line == end.line && start.ch > end.ch)
          || (start.line > end.line)) {
        var tmp = start;
        start = end;
        end = tmp;
      }

      if (inclusive) {
        end.ch += 1;
      } else {
        start.ch += 1;
      }

      return { start: start, end: end };
    }

    // Takes in a symbol and a cursor and tries to simulate text objects that
    // have identical opening and closing symbols
    // TODO support across multiple lines
    function findBeginningAndEnd(cm, symb, inclusive) {
      var cur = copyCursor(cm.getCursor());
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
        start: Pos(cur.line, start),
        end: Pos(cur.line, end)
      };
    }

    // Search functions
    defineOption('pcre', true, 'boolean');
    function SearchState() {}
    SearchState.prototype = {
      getQuery: function() {
        return vimGlobalState.query;
      },
      setQuery: function(query) {
        vimGlobalState.query = query;
      },
      getOverlay: function() {
        return this.searchOverlay;
      },
      setOverlay: function(overlay) {
        this.searchOverlay = overlay;
      },
      isReversed: function() {
        return vimGlobalState.isReversed;
      },
      setReversed: function(reversed) {
        vimGlobalState.isReversed = reversed;
      }
    };
    function getSearchState(cm) {
      var vim = cm.state.vim;
      return vim.searchState_ || (vim.searchState_ = new SearchState());
    }
    function dialog(cm, template, shortText, onClose, options) {
      if (cm.openDialog) {
        cm.openDialog(template, onClose, { bottom: true, value: options.value,
            onKeyDown: options.onKeyDown, onKeyUp: options.onKeyUp });
      }
      else {
        onClose(prompt(shortText, ''));
      }
    }
    function splitBySlash(argString) {
      var slashes = findUnescapedSlashes(argString) || [];
      if (!slashes.length) return [];
      var tokens = [];
      // in case of strings like foo/bar
      if (slashes[0] !== 0) return;
      for (var i = 0; i < slashes.length; i++) {
        if (typeof slashes[i] == 'number')
          tokens.push(argString.substring(slashes[i] + 1, slashes[i+1]));
      }
      return tokens;
    }

    function findUnescapedSlashes(str) {
      var escapeNextChar = false;
      var slashes = [];
      for (var i = 0; i < str.length; i++) {
        var c = str.charAt(i);
        if (!escapeNextChar && c == '/') {
          slashes.push(i);
        }
        escapeNextChar = !escapeNextChar && (c == '\\');
      }
      return slashes;
    }

    // Translates a search string from ex (vim) syntax into javascript form.
    function translateRegex(str) {
      // When these match, add a '\' if unescaped or remove one if escaped.
      var specials = '|(){';
      // Remove, but never add, a '\' for these.
      var unescape = '}';
      var escapeNextChar = false;
      var out = [];
      for (var i = -1; i < str.length; i++) {
        var c = str.charAt(i) || '';
        var n = str.charAt(i+1) || '';
        var specialComesNext = (n && specials.indexOf(n) != -1);
        if (escapeNextChar) {
          if (c !== '\\' || !specialComesNext) {
            out.push(c);
          }
          escapeNextChar = false;
        } else {
          if (c === '\\') {
            escapeNextChar = true;
            // Treat the unescape list as special for removing, but not adding '\'.
            if (n && unescape.indexOf(n) != -1) {
              specialComesNext = true;
            }
            // Not passing this test means removing a '\'.
            if (!specialComesNext || n === '\\') {
              out.push(c);
            }
          } else {
            out.push(c);
            if (specialComesNext && n !== '\\') {
              out.push('\\');
            }
          }
        }
      }
      return out.join('');
    }

    // Translates the replace part of a search and replace from ex (vim) syntax into
    // javascript form.  Similar to translateRegex, but additionally fixes back references
    // (translates '\[0..9]' to '$[0..9]') and follows different rules for escaping '$'.
    function translateRegexReplace(str) {
      var escapeNextChar = false;
      var out = [];
      for (var i = -1; i < str.length; i++) {
        var c = str.charAt(i) || '';
        var n = str.charAt(i+1) || '';
        if (escapeNextChar) {
          // At any point in the loop, escapeNextChar is true if the previous
          // character was a '\' and was not escaped.
          out.push(c);
          escapeNextChar = false;
        } else {
          if (c === '\\') {
            escapeNextChar = true;
            if ((isNumber(n) || n === '$')) {
              out.push('$');
            } else if (n !== '/' && n !== '\\') {
              out.push('\\');
            }
          } else {
            if (c === '$') {
              out.push('$');
            }
            out.push(c);
            if (n === '/') {
              out.push('\\');
            }
          }
        }
      }
      return out.join('');
    }

    // Unescape \ and / in the replace part, for PCRE mode.
    function unescapeRegexReplace(str) {
      var stream = new CodeMirror.StringStream(str);
      var output = [];
      while (!stream.eol()) {
        // Search for \.
        while (stream.peek() && stream.peek() != '\\') {
          output.push(stream.next());
        }
        if (stream.match('\\/', true)) {
          // \/ => /
          output.push('/');
        } else if (stream.match('\\\\', true)) {
          // \\ => \
          output.push('\\');
        } else {
          // Don't change anything
          output.push(stream.next());
        }
      }
      return output.join('');
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
    function parseQuery(query, ignoreCase, smartCase) {
      // First update the last search register
      var lastSearchRegister = vimGlobalState.registerController.getRegister('/');
      lastSearchRegister.setText(query);
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
      if (!getOption('pcre')) {
        regexPart = translateRegex(regexPart);
      }
      if (smartCase) {
        ignoreCase = (/^[^A-Z]*$/).test(regexPart);
      }
      var regexp = new RegExp(regexPart,
          (ignoreCase || forceIgnoreCase) ? 'i' : undefined);
      return regexp;
    }
    function showConfirm(cm, text) {
      if (cm.openNotification) {
        cm.openNotification('<span style="color: red">' + text + '</span>',
                            {bottom: true, duration: 5000});
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
          var props = ['global', 'multiline', 'ignoreCase', 'source'];
          for (var i = 0; i < props.length; i++) {
              var prop = props[i];
              if (r1[prop] !== r2[prop]) {
                  return false;
              }
          }
          return true;
      }
      return false;
    }
    // Returns true if the query is valid.
    function updateSearchQuery(cm, rawQuery, ignoreCase, smartCase) {
      if (!rawQuery) {
        return;
      }
      var state = getSearchState(cm);
      var query = parseQuery(rawQuery, !!ignoreCase, !!smartCase);
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
              return 'searching';
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
            return 'searching';
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
        var cursor = cm.getSearchCursor(query, pos);
        for (var i = 0; i < repeat; i++) {
          var found = cursor.find(prev);
          if (i == 0 && found && cursorEqual(cursor.from(), pos)) { found = cursor.find(prev); }
          if (!found) {
            // SearchCursor may have returned null because it hit EOF, wrap
            // around and try again.
            cursor = cm.getSearchCursor(query,
                (prev) ? Pos(cm.lastLine()) : Pos(cm.firstLine(), 0) );
            if (!cursor.find(prev)) {
              return;
            }
          }
        }
        return cursor.from();
      });
    }
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
    function getUserVisibleLines(cm) {
      var scrollInfo = cm.getScrollInfo();
      var occludeToleranceTop = 6;
      var occludeToleranceBottom = 10;
      var from = cm.coordsChar({left:0, top: occludeToleranceTop + scrollInfo.top}, 'local');
      var bottomY = scrollInfo.clientHeight - occludeToleranceBottom + scrollInfo.top;
      var to = cm.coordsChar({left:0, top: bottomY}, 'local');
      return {top: from.line, bottom: to.line};
    }

    // Ex command handling
    // Care must be taken when adding to the default Ex command map. For any
    // pair of commands that have a shared prefix, at least one of their
    // shortNames must not match the prefix of the other command.
    var defaultExCommandMap = [
      { name: 'map' },
      { name: 'nmap', shortName: 'nm' },
      { name: 'vmap', shortName: 'vm' },
      { name: 'unmap' },
      { name: 'write', shortName: 'w' },
      { name: 'undo', shortName: 'u' },
      { name: 'redo', shortName: 'red' },
      { name: 'set', shortName: 'set' },
      { name: 'sort', shortName: 'sor' },
      { name: 'substitute', shortName: 's', possiblyAsync: true },
      { name: 'nohlsearch', shortName: 'noh' },
      { name: 'delmarks', shortName: 'delm' },
      { name: 'registers', shortName: 'reg', excludeFromCommandHistory: true },
      { name: 'global', shortName: 'g' }
    ];
    Vim.ExCommandDispatcher = function() {
      this.buildCommandMap_();
    };
    Vim.ExCommandDispatcher.prototype = {
      processCommand: function(cm, input, opt_params) {
        var vim = cm.state.vim;
        var commandHistoryRegister = vimGlobalState.registerController.getRegister(':');
        var previousCommand = commandHistoryRegister.toString();
        if (vim.visualMode) {
          exitVisualMode(cm);
        }
        var inputStream = new CodeMirror.StringStream(input);
        // update ": with the latest command whether valid or invalid
        commandHistoryRegister.setText(input);
        var params = opt_params || {};
        params.input = input;
        try {
          this.parseInput_(cm, inputStream, params);
        } catch(e) {
          showConfirm(cm, e);
          throw e;
        }
        var command;
        var commandName;
        if (!params.commandName) {
          // If only a line range is defined, move to the line.
          if (params.line !== undefined) {
            commandName = 'move';
          }
        } else {
          command = this.matchCommand_(params.commandName);
          if (command) {
            commandName = command.name;
            if (command.excludeFromCommandHistory) {
              commandHistoryRegister.setText(previousCommand);
            }
            this.parseCommandArgs_(inputStream, params, command);
            if (command.type == 'exToKey') {
              // Handle Ex to Key mapping.
              for (var i = 0; i < command.toKeys.length; i++) {
                CodeMirror.Vim.handleKey(cm, command.toKeys[i]);
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
        try {
          exCommands[commandName](cm, params);
          // Possibly asynchronous commands (e.g. substitute, which might have a
          // user confirmation), are responsible for calling the callback when
          // done. All others have it taken care of for them here.
          if ((!command || !command.possiblyAsync) && params.callback) {
            params.callback();
          }
        } catch(e) {
          showConfirm(cm, e);
          throw e;
        }
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
            var mark = cm.state.vim.marks[inputStream.next()];
            if (mark && mark.find()) {
              return mark.find().line;
            }
            throw new Error('Mark not set');
          default:
            inputStream.backUp(1);
            return undefined;
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
      map: function(lhs, rhs, ctx) {
        if (lhs != ':' && lhs.charAt(0) == ':') {
          if (ctx) { throw Error('Mode not supported for ex mappings'); }
          var commandName = lhs.substring(1);
          if (rhs != ':' && rhs.charAt(0) == ':') {
            // Ex to Ex mapping
            this.commandMap_[commandName] = {
              name: commandName,
              type: 'exToEx',
              toInput: rhs.substring(1),
              user: true
            };
          } else {
            // Ex to key mapping
            this.commandMap_[commandName] = {
              name: commandName,
              type: 'exToKey',
              toKeys: parseKeyString(rhs),
              user: true
            };
          }
        } else {
          if (rhs != ':' && rhs.charAt(0) == ':') {
            // Key to Ex mapping.
            var mapping = {
              keys: parseKeyString(lhs),
              type: 'keyToEx',
              exArgs: { input: rhs.substring(1) },
              user: true};
            if (ctx) { mapping.context = ctx; }
            defaultKeymap.unshift(mapping);
          } else {
            // Key to key mapping
            var mapping = {
              keys: parseKeyString(lhs),
              type: 'keyToKey',
              toKeys: parseKeyString(rhs),
              user: true
            };
            if (ctx) { mapping.context = ctx; }
            defaultKeymap.unshift(mapping);
          }
        }
      },
      unmap: function(lhs, ctx) {
        var arrayEquals = function(a, b) {
          if (a === b) return true;
          if (a == null || b == null) return true;
          if (a.length != b.length) return false;
          for (var i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
          }
          return true;
        };
        if (lhs != ':' && lhs.charAt(0) == ':') {
          // Ex to Ex or Ex to key mapping
          if (ctx) { throw Error('Mode not supported for ex mappings'); }
          var commandName = lhs.substring(1);
          if (this.commandMap_[commandName] && this.commandMap_[commandName].user) {
            delete this.commandMap_[commandName];
            return;
          }
        } else {
          // Key to Ex or key to key mapping
          var keys = parseKeyString(lhs);
          for (var i = 0; i < defaultKeymap.length; i++) {
            if (arrayEquals(keys, defaultKeymap[i].keys)
                && defaultKeymap[i].context === ctx
                && defaultKeymap[i].user) {
              defaultKeymap.splice(i, 1);
              return;
            }
          }
        }
        throw Error('No such mapping.');
      }
    };

    // Converts a key string sequence of the form a<C-w>bd<Left> into Vim's
    // keymap representation.
    function parseKeyString(str) {
      var key, match;
      var keys = [];
      while (str) {
        match = (/<\w+-.+?>|<\w+>|./).exec(str);
        if (match === null)break;
        key = match[0];
        str = str.substring(match.index + key.length);
        keys.push(key);
      }
      return keys;
    }

    var exCommands = {
      map: function(cm, params, ctx) {
        var mapArgs = params.args;
        if (!mapArgs || mapArgs.length < 2) {
          if (cm) {
            showConfirm(cm, 'Invalid mapping: ' + params.input);
          }
          return;
        }
        exCommandDispatcher.map(mapArgs[0], mapArgs[1], ctx);
      },
      nmap: function(cm, params) { this.map(cm, params, 'normal'); },
      vmap: function(cm, params) { this.map(cm, params, 'visual'); },
      unmap: function(cm, params, ctx) {
        var mapArgs = params.args;
        if (!mapArgs || mapArgs.length < 1) {
          if (cm) {
            showConfirm(cm, 'No such mapping: ' + params.input);
          }
          return;
        }
        exCommandDispatcher.unmap(mapArgs[0], ctx);
      },
      move: function(cm, params) {
        commandDispatcher.processCommand(cm, cm.state.vim, {
            type: 'motion',
            motion: 'moveToLineOrEdgeOfDocument',
            motionArgs: { forward: false, explicitRepeat: true,
              linewise: true },
            repeatOverride: params.line+1});
      },
      set: function(cm, params) {
        var setArgs = params.args;
        if (!setArgs || setArgs.length < 1) {
          if (cm) {
            showConfirm(cm, 'Invalid mapping: ' + params.input);
          }
          return;
        }
        var expr = setArgs[0].split('=');
        var optionName = expr[0];
        var value = expr[1];
        var forceGet = false;

        if (optionName.charAt(optionName.length - 1) == '?') {
          // If post-fixed with ?, then the set is actually a get.
          if (value) { throw Error('Trailing characters: ' + params.argString); }
          optionName = optionName.substring(0, optionName.length - 1);
          forceGet = true;
        }
        if (value === undefined && optionName.substring(0, 2) == 'no') {
          // To set boolean options to false, the option name is prefixed with
          // 'no'.
          optionName = optionName.substring(2);
          value = false;
        }
        var optionIsBoolean = options[optionName] && options[optionName].type == 'boolean';
        if (optionIsBoolean && value == undefined) {
          // Calling set with a boolean option sets it to true.
          value = true;
        }
        if (!optionIsBoolean && !value || forceGet) {
          var oldValue = getOption(optionName);
          // If no value is provided, then we assume this is a get.
          if (oldValue === true || oldValue === false) {
            showConfirm(cm, ' ' + (oldValue ? '' : 'no') + optionName);
          } else {
            showConfirm(cm, '  ' + optionName + '=' + oldValue);
          }
        } else {
          setOption(optionName, value);
        }
      },
      registers: function(cm,params) {
        var regArgs = params.args;
        var registers = vimGlobalState.registerController.registers;
        var regInfo = '----------Registers----------<br><br>';
        if (!regArgs) {
          for (var registerName in registers) {
            var text = registers[registerName].toString();
            if (text.length) {
              regInfo += '"' + registerName + '    ' + text + '<br>';
            }
          }
        } else {
          var registerName;
          regArgs = regArgs.join('');
          for (var i = 0; i < regArgs.length; i++) {
            registerName = regArgs.charAt(i);
            if (!vimGlobalState.registerController.isValidRegister(registerName)) {
              continue;
            }
            var register = registers[registerName] || new Register();
            regInfo += '"' + registerName + '    ' + register.toString() + '<br>';
          }
        }
        showConfirm(cm, regInfo);
      },
      sort: function(cm, params) {
        var reverse, ignoreCase, unique, number;
        function parseArgs() {
          if (params.argString) {
            var args = new CodeMirror.StringStream(params.argString);
            if (args.eat('!')) { reverse = true; }
            if (args.eol()) { return; }
            if (!args.eatSpace()) { return 'Invalid arguments'; }
            var opts = args.match(/[a-z]+/);
            if (opts) {
              opts = opts[0];
              ignoreCase = opts.indexOf('i') != -1;
              unique = opts.indexOf('u') != -1;
              var decimal = opts.indexOf('d') != -1 && 1;
              var hex = opts.indexOf('x') != -1 && 1;
              var octal = opts.indexOf('o') != -1 && 1;
              if (decimal + hex + octal > 1) { return 'Invalid arguments'; }
              number = decimal && 'decimal' || hex && 'hex' || octal && 'octal';
            }
            if (args.eatSpace() && args.match(/\/.*\//)) { 'patterns not supported'; }
          }
        }
        var err = parseArgs();
        if (err) {
          showConfirm(cm, err + ': ' + params.argString);
          return;
        }
        var lineStart = params.line || cm.firstLine();
        var lineEnd = params.lineEnd || params.line || cm.lastLine();
        if (lineStart == lineEnd) { return; }
        var curStart = Pos(lineStart, 0);
        var curEnd = Pos(lineEnd, lineLength(cm, lineEnd));
        var text = cm.getRange(curStart, curEnd).split('\n');
        var numberRegex = (number == 'decimal') ? /(-?)([\d]+)/ :
           (number == 'hex') ? /(-?)(?:0x)?([0-9a-f]+)/i :
           (number == 'octal') ? /([0-7]+)/ : null;
        var radix = (number == 'decimal') ? 10 : (number == 'hex') ? 16 : (number == 'octal') ? 8 : null;
        var numPart = [], textPart = [];
        if (number) {
          for (var i = 0; i < text.length; i++) {
            if (numberRegex.exec(text[i])) {
              numPart.push(text[i]);
            } else {
              textPart.push(text[i]);
            }
          }
        } else {
          textPart = text;
        }
        function compareFn(a, b) {
          if (reverse) { var tmp; tmp = a; a = b; b = tmp; }
          if (ignoreCase) { a = a.toLowerCase(); b = b.toLowerCase(); }
          var anum = number && numberRegex.exec(a);
          var bnum = number && numberRegex.exec(b);
          if (!anum) { return a < b ? -1 : 1; }
          anum = parseInt((anum[1] + anum[2]).toLowerCase(), radix);
          bnum = parseInt((bnum[1] + bnum[2]).toLowerCase(), radix);
          return anum - bnum;
        }
        numPart.sort(compareFn);
        textPart.sort(compareFn);
        text = (!reverse) ? textPart.concat(numPart) : numPart.concat(textPart);
        if (unique) { // Remove duplicate lines
          var textOld = text;
          var lastLine;
          text = [];
          for (var i = 0; i < textOld.length; i++) {
            if (textOld[i] != lastLine) {
              text.push(textOld[i]);
            }
            lastLine = textOld[i];
          }
        }
        cm.replaceRange(text.join('\n'), curStart, curEnd);
      },
      global: function(cm, params) {
        // a global command is of the form
        // :[range]g/pattern/[cmd]
        // argString holds the string /pattern/[cmd]
        var argString = params.argString;
        if (!argString) {
          showConfirm(cm, 'Regular Expression missing from global');
          return;
        }
        // range is specified here
        var lineStart = (params.line !== undefined) ? params.line : cm.firstLine();
        var lineEnd = params.lineEnd || params.line || cm.lastLine();
        // get the tokens from argString
        var tokens = splitBySlash(argString);
        var regexPart = argString, cmd;
        if (tokens.length) {
          regexPart = tokens[0];
          cmd = tokens.slice(1, tokens.length).join('/');
        }
        if (regexPart) {
          // If regex part is empty, then use the previous query. Otherwise
          // use the regex part as the new query.
          try {
           updateSearchQuery(cm, regexPart, true /** ignoreCase */,
             true /** smartCase */);
          } catch (e) {
           showConfirm(cm, 'Invalid regex: ' + regexPart);
           return;
          }
        }
        // now that we have the regexPart, search for regex matches in the
        // specified range of lines
        var query = getSearchState(cm).getQuery();
        var matchedLines = [], content = '';
        for (var i = lineStart; i <= lineEnd; i++) {
          var matched = query.test(cm.getLine(i));
          if (matched) {
            matchedLines.push(i+1);
            content+= cm.getLine(i) + '<br>';
          }
        }
        // if there is no [cmd], just display the list of matched lines
        if (!cmd) {
          showConfirm(cm, content);
          return;
        }
        var index = 0;
        var nextCommand = function() {
          if (index < matchedLines.length) {
            var command = matchedLines[index] + cmd;
            exCommandDispatcher.processCommand(cm, command, {
              callback: nextCommand
            });
          }
          index++;
        };
        nextCommand();
      },
      substitute: function(cm, params) {
        if (!cm.getSearchCursor) {
          throw new Error('Search feature not available. Requires searchcursor.js or ' +
              'any other getSearchCursor implementation.');
        }
        var argString = params.argString;
        var tokens = argString ? splitBySlash(argString) : [];
        var regexPart, replacePart = '', trailing, flagsPart, count;
        var confirm = false; // Whether to confirm each replace.
        var global = false; // True to replace all instances on a line, false to replace only 1.
        if (tokens.length) {
          regexPart = tokens[0];
          replacePart = tokens[1];
          if (replacePart !== undefined) {
            if (getOption('pcre')) {
              replacePart = unescapeRegexReplace(replacePart);
            } else {
              replacePart = translateRegexReplace(replacePart);
            }
            vimGlobalState.lastSubstituteReplacePart = replacePart;
          }
          trailing = tokens[2] ? tokens[2].split(' ') : [];
        } else {
          // either the argString is empty or its of the form ' hello/world'
          // actually splitBySlash returns a list of tokens
          // only if the string starts with a '/'
          if (argString && argString.length) {
            showConfirm(cm, 'Substitutions should be of the form ' +
                ':s/pattern/replace/');
            return;
          }
        }
        // After the 3rd slash, we can have flags followed by a space followed
        // by count.
        if (trailing) {
          flagsPart = trailing[0];
          count = parseInt(trailing[1]);
          if (flagsPart) {
            if (flagsPart.indexOf('c') != -1) {
              confirm = true;
              flagsPart.replace('c', '');
            }
            if (flagsPart.indexOf('g') != -1) {
              global = true;
              flagsPart.replace('g', '');
            }
            regexPart = regexPart + '/' + flagsPart;
          }
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
        replacePart = replacePart || vimGlobalState.lastSubstituteReplacePart;
        if (replacePart === undefined) {
          showConfirm(cm, 'No previous substitute regular expression');
          return;
        }
        var state = getSearchState(cm);
        var query = state.getQuery();
        var lineStart = (params.line !== undefined) ? params.line : cm.getCursor().line;
        var lineEnd = params.lineEnd || lineStart;
        if (count) {
          lineStart = lineEnd;
          lineEnd = lineStart + count - 1;
        }
        var startPos = clipCursorToContent(cm, Pos(lineStart, 0));
        var cursor = cm.getSearchCursor(query, startPos);
        doReplace(cm, confirm, global, lineStart, lineEnd, cursor, query, replacePart, params.callback);
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
        if (!params.argString || !trim(params.argString)) {
          showConfirm(cm, 'Argument required');
          return;
        }

        var state = cm.state.vim;
        var stream = new CodeMirror.StringStream(trim(params.argString));
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
              showConfirm(cm, 'Invalid argument: ' + startMark + '-');
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

    /**
    * @param {CodeMirror} cm CodeMirror instance we are in.
    * @param {boolean} confirm Whether to confirm each replace.
    * @param {Cursor} lineStart Line to start replacing from.
    * @param {Cursor} lineEnd Line to stop replacing at.
    * @param {RegExp} query Query for performing matches with.
    * @param {string} replaceWith Text to replace matches with. May contain $1,
    *     $2, etc for replacing captured groups using Javascript replace.
    * @param {function()} callback A callback for when the replace is done.
    */
    function doReplace(cm, confirm, global, lineStart, lineEnd, searchCursor, query,
        replaceWith, callback) {
      // Set up all the functions.
      cm.state.vim.exMode = true;
      var done = false;
      var lastPos = searchCursor.from();
      function replaceAll() {
        cm.operation(function() {
          while (!done) {
            replace();
            next();
          }
          stop();
        });
      }
      function replace() {
        var text = cm.getRange(searchCursor.from(), searchCursor.to());
        var newText = text.replace(query, replaceWith);
        searchCursor.replace(newText);
      }
      function next() {
        var found;
        // The below only loops to skip over multiple occurrences on the same
        // line when 'global' is not true.
        while(found = searchCursor.findNext() &&
              isInRange(searchCursor.from(), lineStart, lineEnd)) {
          if (!global && lastPos && searchCursor.from().line == lastPos.line) {
            continue;
          }
          cm.scrollIntoView(searchCursor.from(), 30);
          cm.setSelection(searchCursor.from(), searchCursor.to());
          lastPos = searchCursor.from();
          done = false;
          return;
        }
        done = true;
      }
      function stop(close) {
        if (close) { close(); }
        cm.focus();
        if (lastPos) {
          cm.setCursor(lastPos);
          var vim = cm.state.vim;
          vim.exMode = false;
          vim.lastHPos = vim.lastHSPos = lastPos.ch;
        }
        if (callback) { callback(); }
      }
      function onPromptKeyDown(e, _value, close) {
        // Swallow all keys.
        CodeMirror.e_stop(e);
        var keyName = CodeMirror.keyName(e);
        switch (keyName) {
          case 'Y':
            replace(); next(); break;
          case 'N':
            next(); break;
          case 'A':
            // replaceAll contains a call to close of its own. We don't want it
            // to fire too early or multiple times.
            var savedCallback = callback;
            callback = undefined;
            cm.operation(replaceAll);
            callback = savedCallback;
            break;
          case 'L':
            replace();
            // fall through and exit.
          case 'Q':
          case 'Esc':
          case 'Ctrl-C':
          case 'Ctrl-[':
            stop(close);
            break;
        }
        if (done) { stop(close); }
      }

      // Actually do replace.
      next();
      if (done) {
        showConfirm(cm, 'No matches for ' + query.source);
        return;
      }
      if (!confirm) {
        replaceAll();
        if (callback) { callback(); };
        return;
      }
      showPrompt(cm, {
        prefix: 'replace with <strong>' + replaceWith + '</strong> (y/n/a/q/l)',
        onKeyDown: onPromptKeyDown
      });
    }

    // Register Vim with CodeMirror
    function buildVimKeyMap() {
      /**
       * Handle the raw key event from CodeMirror. Translate the
       * Shift + key modifier to the resulting letter, while preserving other
       * modifers.
       */
      function cmKeyToVimKey(key, modifier) {
        var vimKey = key;
        if (isUpperCase(vimKey) && modifier == 'Ctrl') {
            vimKey = vimKey.toLowerCase();
        }
        if (modifier) {
          // Vim will parse modifier+key combination as a single key.
          vimKey = modifier.charAt(0) + '-' + vimKey;
        }
        var specialKey = ({Enter:'CR',Backspace:'BS',Delete:'Del'})[vimKey];
        vimKey = specialKey ? specialKey : vimKey;
        vimKey = vimKey.length > 1 ? '<'+ vimKey + '>' : vimKey;
        return vimKey;
      }

      // Closure to bind CodeMirror, key, modifier.
      function keyMapper(vimKey) {
        return function(cm) {
          CodeMirror.signal(cm, 'vim-keypress', vimKey);
          CodeMirror.Vim.handleKey(cm, vimKey);
        };
      }

      var cmToVimKeymap = {
        'nofallthrough': true,
        'style': 'fat-cursor'
      };
      function bindKeys(keys, modifier) {
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          if (!modifier && key.length == 1) {
            // Wrap all keys without modifiers with '' to identify them by their
            // key characters instead of key identifiers.
            key = "'" + key + "'";
          }
          var vimKey = cmKeyToVimKey(keys[i], modifier);
          var cmKey = modifier ? modifier + '-' + key : key;
          cmToVimKeymap[cmKey] = keyMapper(vimKey);
        }
      }
      bindKeys(upperCaseAlphabet);
      bindKeys(lowerCaseAlphabet);
      bindKeys(upperCaseAlphabet, 'Ctrl');
      bindKeys(specialSymbols);
      bindKeys(specialSymbols, 'Ctrl');
      bindKeys(numbers);
      bindKeys(numbers, 'Ctrl');
      bindKeys(specialKeys);
      bindKeys(specialKeys, 'Ctrl');
      return cmToVimKeymap;
    }
    CodeMirror.keyMap.vim = buildVimKeyMap();

    function exitInsertMode(cm) {
      var vim = cm.state.vim;
      var macroModeState = vimGlobalState.macroModeState;
      var insertModeChangeRegister = vimGlobalState.registerController.getRegister('.');
      var isPlaying = macroModeState.isPlaying;
      var lastChange = macroModeState.lastInsertModeChanges;
      // In case of visual block, the insertModeChanges are not saved as a
      // single word, so we convert them to a single word
      // so as to update the ". register as expected in real vim.
      var text = [];
      if (!isPlaying) {
        var selLength = lastChange.inVisualBlock ? vim.lastSelection.visualBlock.height : 1;
        var changes = lastChange.changes;
        var text = [];
        var i = 0;
        // In case of multiple selections in blockwise visual,
        // the inserted text, for example: 'f<Backspace>oo', is stored as
        // 'f', 'f', InsertModeKey 'o', 'o', 'o', 'o'. (if you have a block with 2 lines).
        // We push the contents of the changes array as per the following:
        // 1. In case of InsertModeKey, just increment by 1.
        // 2. In case of a character, jump by selLength (2 in the example).
        while (i < changes.length) {
          // This loop will convert 'ff<bs>oooo' to 'f<bs>oo'.
          text.push(changes[i]);
          if (changes[i] instanceof InsertModeKey) {
             i++;
          } else {
             i+= selLength;
          }
        }
        lastChange.changes = text;
        cm.off('change', onChange);
        CodeMirror.off(cm.getInputField(), 'keydown', onKeyEventTargetKeyDown);
      }
      if (!isPlaying && vim.insertModeRepeat > 1) {
        // Perform insert mode repeat for commands like 3,a and 3,o.
        repeatLastEdit(cm, vim, vim.insertModeRepeat - 1,
            true /** repeatForInsert */);
        vim.lastEditInputState.repeatOverride = vim.insertModeRepeat;
      }
      delete vim.insertModeRepeat;
      vim.insertMode = false;
      cm.setCursor(cm.getCursor().line, cm.getCursor().ch-1);
      cm.setOption('keyMap', 'vim');
      cm.setOption('disableInput', true);
      cm.toggleOverwrite(false); // exit replace mode if we were in it.
      // update the ". register before exiting insert mode
      insertModeChangeRegister.setText(lastChange.changes.join(''));
      CodeMirror.signal(cm, "vim-mode-change", {mode: "normal"});
      if (macroModeState.isRecording) {
        logInsertModeChange(macroModeState);
      }
    }

    defineOption('enableInsertModeEscKeys', false, 'boolean');
    // Use this option to customize the two-character ESC keymap.
    // If you want to use characters other than i j or k you'll have to add
    // lines to the vim-insert and await-second keymaps later in this file.
    defineOption('insertModeEscKeys', 'kj', 'string');
    // The timeout in milliseconds for the two-character ESC keymap should be
    // adjusted according to your typing speed to prevent false positives.
    defineOption('insertModeEscKeysTimeout', 200, 'number');
    function firstEscCharacterHandler(ch) {
      return function(cm){
        var keys = getOption('insertModeEscKeys');
        var firstEscCharacter = keys && keys.length > 1 && keys.charAt(0);
        if (!getOption('enableInsertModeEscKeys')|| firstEscCharacter !== ch) {
          return CodeMirror.Pass;
        } else {
          cm.replaceRange(ch, cm.getCursor(), cm.getCursor(), "+input");
          cm.setOption('keyMap', 'await-second');
          cm.state.vim.awaitingEscapeSecondCharacter = true;
          setTimeout(
              function(){
                if(cm.state.vim.awaitingEscapeSecondCharacter) {
                    cm.state.vim.awaitingEscapeSecondCharacter = false;
                    cm.setOption('keyMap', 'vim-insert');
                }
              },
              getOption('insertModeEscKeysTimeout'));
        }
      };
    }
    function secondEscCharacterHandler(ch){
      return function(cm) {
        var keys = getOption('insertModeEscKeys');
        var secondEscCharacter = keys && keys.length > 1 && keys.charAt(1);
        if (!getOption('enableInsertModeEscKeys')|| secondEscCharacter !== ch) {
          return CodeMirror.Pass;
          // This is not the handler you're looking for. Just insert as usual.
        } else {
          if (cm.state.vim.insertMode) {
            var lastChange = vimGlobalState.macroModeState.lastInsertModeChanges;
            if (lastChange && lastChange.changes.length) {
              lastChange.changes.pop();
            }
          }
          cm.state.vim.awaitingEscapeSecondCharacter = false;
          cm.replaceRange('', {ch: cm.getCursor().ch - 1, line: cm.getCursor().line},
                          cm.getCursor(), "+input");
          exitInsertMode(cm);
        }
      };
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
      // The next few lines are where you'd add additional handlers if
      // you wanted to use keys other than i j and k for two-character
      // escape sequences. Don't forget to add them in the await-second
      // section as well.
      "'i'": firstEscCharacterHandler('i'),
      "'j'": firstEscCharacterHandler('j'),
      "'k'": firstEscCharacterHandler('k'),
      fallthrough: ['default']
    };

    CodeMirror.keyMap['await-second'] = {
      "'i'": secondEscCharacterHandler('i'),
      "'j'": secondEscCharacterHandler('j'),
      "'k'": secondEscCharacterHandler('k'),
      fallthrough: ['vim-insert']
    };

    CodeMirror.keyMap['vim-replace'] = {
      'Backspace': 'goCharLeft',
      fallthrough: ['vim-insert']
    };

    function executeMacroRegister(cm, vim, macroModeState, registerName) {
      var register = vimGlobalState.registerController.getRegister(registerName);
      var keyBuffer = register.keyBuffer;
      var imc = 0;
      macroModeState.isPlaying = true;
      macroModeState.replaySearchQueries = register.searchQueries.slice(0);
      for (var i = 0; i < keyBuffer.length; i++) {
        var text = keyBuffer[i];
        var match, key;
        while (text) {
          // Pull off one command key, which is either a single character
          // or a special sequence wrapped in '<' and '>', e.g. '<Space>'.
          match = (/<\w+-.+?>|<\w+>|./).exec(text);
          key = match[0];
          text = text.substring(match.index + key.length);
          CodeMirror.Vim.handleKey(cm, key);
          if (vim.insertMode) {
            var changes = register.insertModeChanges[imc++].changes;
            vimGlobalState.macroModeState.lastInsertModeChanges.changes =
                changes;
            repeatInsertModeChanges(cm, changes, 1);
            exitInsertMode(cm);
          }
        }
      };
      macroModeState.isPlaying = false;
    }

    function logKey(macroModeState, key) {
      if (macroModeState.isPlaying) { return; }
      var registerName = macroModeState.latestRegister;
      var register = vimGlobalState.registerController.getRegister(registerName);
      if (register) {
        register.pushText(key);
      }
    }

    function logInsertModeChange(macroModeState) {
      if (macroModeState.isPlaying) { return; }
      var registerName = macroModeState.latestRegister;
      var register = vimGlobalState.registerController.getRegister(registerName);
      if (register) {
        register.pushInsertModeChanges(macroModeState.lastInsertModeChanges);
      }
    }

    function logSearchQuery(macroModeState, query) {
      if (macroModeState.isPlaying) { return; }
      var registerName = macroModeState.latestRegister;
      var register = vimGlobalState.registerController.getRegister(registerName);
      if (register) {
        register.pushSearchQuery(query);
      }
    }

    /**
     * Listens for changes made in insert mode.
     * Should only be active in insert mode.
     */
    function onChange(_cm, changeObj) {
      var macroModeState = vimGlobalState.macroModeState;
      var lastChange = macroModeState.lastInsertModeChanges;
      if (!macroModeState.isPlaying) {
        while(changeObj) {
          lastChange.expectCursorActivityForChange = true;
          if (changeObj.origin == '+input' || changeObj.origin == 'paste'
              || changeObj.origin === undefined /* only in testing */) {
            var text = changeObj.text.join('\n');
            lastChange.changes.push(text);
          }
          // Change objects may be chained with next.
          changeObj = changeObj.next;
        }
      }
    }

    /**
    * Listens for any kind of cursor activity on CodeMirror.
    */
    function onCursorActivity(cm) {
      var vim = cm.state.vim;
      if (vim.insertMode) {
        // Tracking cursor activity in insert mode (for macro support).
        var macroModeState = vimGlobalState.macroModeState;
        if (macroModeState.isPlaying) { return; }
        var lastChange = macroModeState.lastInsertModeChanges;
        if (lastChange.expectCursorActivityForChange) {
          lastChange.expectCursorActivityForChange = false;
        } else {
          // Cursor moved outside the context of an edit. Reset the change.
          lastChange.changes = [];
        }
      } else if (cm.doc.history.lastSelOrigin == '*mouse') {
        // Reset lastHPos if mouse click was done in normal mode.
        vim.lastHPos = cm.doc.getCursor().ch;
        if (cm.somethingSelected()) {
          // If something is still selected, enter visual mode.
          vim.visualMode = true;
        }
      }
      if (vim.visualMode) {
        var from, head;
        from = head = cm.getCursor('head');
        var anchor = cm.getCursor('anchor');
        var to = Pos(head.line, from.ch + (cursorIsBefore(anchor, head) ? -1 : 1));
        if (cursorIsBefore(to, from)) {
          var temp = from;
          from = to;
          to = temp;
        }
        if (vim.fakeCursor) {
          vim.fakeCursor.clear();
        }
        vim.fakeCursor = cm.markText(from, to, {className: 'cm-animate-fat-cursor'});
      }
    }

    /** Wrapper for special keys pressed in insert mode */
    function InsertModeKey(keyName) {
      this.keyName = keyName;
    }

    /**
    * Handles raw key down events from the text area.
    * - Should only be active in insert mode.
    * - For recording deletes in insert mode.
    */
    function onKeyEventTargetKeyDown(e) {
      var macroModeState = vimGlobalState.macroModeState;
      var lastChange = macroModeState.lastInsertModeChanges;
      var keyName = CodeMirror.keyName(e);
      function onKeyFound() {
        lastChange.changes.push(new InsertModeKey(keyName));
        return true;
      }
      if (keyName.indexOf('Delete') != -1 || keyName.indexOf('Backspace') != -1) {
        CodeMirror.lookupKey(keyName, ['vim-insert'], onKeyFound);
      }
    }

    /**
     * Repeats the last edit, which includes exactly 1 command and at most 1
     * insert. Operator and motion commands are read from lastEditInputState,
     * while action commands are read from lastEditActionCommand.
     *
     * If repeatForInsert is true, then the function was called by
     * exitInsertMode to repeat the insert mode changes the user just made. The
     * corresponding enterInsertMode call was made with a count.
     */
    function repeatLastEdit(cm, vim, repeat, repeatForInsert) {
      var macroModeState = vimGlobalState.macroModeState;
      macroModeState.isPlaying = true;
      var isAction = !!vim.lastEditActionCommand;
      var cachedInputState = vim.inputState;
      function repeatCommand() {
        if (isAction) {
          commandDispatcher.processAction(cm, vim, vim.lastEditActionCommand);
        } else {
          commandDispatcher.evalInput(cm, vim);
        }
      }
      function repeatInsert(repeat) {
        if (macroModeState.lastInsertModeChanges.changes.length > 0) {
          // For some reason, repeat cw in desktop VIM does not repeat
          // insert mode changes. Will conform to that behavior.
          repeat = !vim.lastEditActionCommand ? 1 : repeat;
          var changeObject = macroModeState.lastInsertModeChanges;
          repeatInsertModeChanges(cm, changeObject.changes, repeat);
        }
      }
      vim.inputState = vim.lastEditInputState;
      if (isAction && vim.lastEditActionCommand.interlaceInsertRepeat) {
        // o and O repeat have to be interlaced with insert repeats so that the
        // insertions appear on separate lines instead of the last line.
        for (var i = 0; i < repeat; i++) {
          repeatCommand();
          repeatInsert(1);
        }
      } else {
        if (!repeatForInsert) {
          // Hack to get the cursor to end up at the right place. If I is
          // repeated in insert mode repeat, cursor will be 1 insert
          // change set left of where it should be.
          repeatCommand();
        }
        repeatInsert(repeat);
      }
      vim.inputState = cachedInputState;
      if (vim.insertMode && !repeatForInsert) {
        // Don't exit insert mode twice. If repeatForInsert is set, then we
        // were called by an exitInsertMode call lower on the stack.
        exitInsertMode(cm);
      }
      macroModeState.isPlaying = false;
    };

    function repeatInsertModeChanges(cm, changes, repeat) {
      function keyHandler(binding) {
        if (typeof binding == 'string') {
          CodeMirror.commands[binding](cm);
        } else {
          binding(cm);
        }
        return true;
      }
      var curStart = cm.getCursor();
      var inVisualBlock = vimGlobalState.macroModeState.lastInsertModeChanges.inVisualBlock;
      if (inVisualBlock) {
        // Set up block selection again for repeating the changes.
        var vim = cm.state.vim;
        var block = vim.lastSelection.visualBlock;
        var curEnd = Pos(curStart.line + block.height-1, curStart.ch);
        cm.setCursor(curStart);
        selectBlock(cm, curEnd);
        repeat = cm.listSelections().length;
        cm.setCursor(curStart);
      }
      for (var i = 0; i < repeat; i++) {
        for (var j = 0; j < changes.length; j++) {
          var change = changes[j];
          if (change instanceof InsertModeKey) {
            CodeMirror.lookupKey(change.keyName, ['vim-insert'], keyHandler);
          } else {
            var cur = cm.getCursor();
            cm.replaceRange(change, cur, cur);
          }
        }
        if (inVisualBlock) {
          curStart.line++;
          cm.setCursor(curStart);
        }
      }
    }

    resetVimGlobalState();
    return vimApi;
  };
  // Initialize Vim and make it available as an API.
  CodeMirror.Vim = Vim();
});
