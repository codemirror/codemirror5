var code = '' +
' wOrd1 (#%\n' +
' word3] \n' +
'aopop pop 0 1 2 3 4\n' +
' (a) [b] {c} \n' +
'int getchar(void) {\n' +
'  static char buf[BUFSIZ];\n' +
'  static char *bufp = buf;\n' +
'  if (n == 0) {  /* buffer is empty */\n' +
'    n = read(0, buf, sizeof buf);\n' +
'    bufp = buf;\n' +
'  }\n' +
'  return (--n >= 0) ? (unsigned char) *bufp++ : EOF;\n' +
'}\n';

var lines = (function() {
  lineText = code.split('\n');
  var ret = [];
  for (var i = 0; i < lineText.length; i++) {
    ret[i] = {
      line: i,
      length: lineText[i].length + 1, // We stripped out the \n
      textStart: /^\s*/.exec(lineText[i])[0].length
    };
  }
  return ret;
})();
var wordLine = lines[0];
var bigWordLine = lines[1];
var charLine = lines[2];
var bracesLine = lines[3];

var word1 = {
  start: { line: wordLine.line, ch: 1 },
  end: { line: wordLine.line, ch: 5 }
};
var word2 = {
  start: { line: wordLine.line, ch: word1.end.ch + 2 },
  end: { line: wordLine.line, ch: word1.end.ch + 4 }
};
var word3 = {
  start: { line: bigWordLine.line, ch: 1 },
  end: { line: bigWordLine.line, ch: 5 }
};
var bigWord1 = word1;
var bigWord2 = word2;
var bigWord3 = {
  start: { line: bigWordLine.line, ch: 1 },
  end: { line: bigWordLine.line, ch: 7 }
};
var bigWord4 = {
  start: { line: bigWordLine.line, ch: bigWord1.end.ch + 3 },
  end: { line: bigWordLine.line, ch: bigWord1.end.ch + 7 }
}
var oChars = [ { line: charLine.line, ch: 1 },
    { line: charLine.line, ch: 3 },
    { line: charLine.line, ch: 7 } ];
var pChars = [ { line: charLine.line, ch: 2 },
    { line: charLine.line, ch: 4 },
    { line: charLine.line, ch: 6 },
    { line: charLine.line, ch: 8 } ];
var numChars = [ { line: charLine.line, ch: 10 },
    { line: charLine.line, ch: 12 },
    { line: charLine.line, ch: 14 },
    { line: charLine.line, ch: 16 },
    { line: charLine.line, ch: 18 }];
var parens1 = {
  start: { line: bracesLine.line, ch: 1 },
  end: { line: bracesLine.line, ch: 3 }
};
var squares1 = {
  start: { line: bracesLine.line, ch: 5 },
  end: { line: bracesLine.line, ch: 7 }
};
var curlys1 = {
  start: { line: bracesLine.line, ch: 9 },
  end: { line: bracesLine.line, ch: 11 }
};

function copyCursor(cur) {
  return { ch: cur.ch, line: cur.line };
}

function testVim(name, run, opts, expectedFail) {
  var vimOpts = {
    lineNumbers: true,
    mode: 'text/x-csrc',
    keyMap: 'vim',
    showCursorWhenSelecting: true,
    value: code
  };
  for (var prop in opts) {
    if (opts.hasOwnProperty(prop)) {
      vimOpts[prop] = opts[prop];
    }
  }
  return test('vim_' + name, function() {
    var place = document.getElementById("testground");
    var cm = CodeMirror(place, vimOpts);
    CodeMirror.Vim.maybeInitState(cm);
    var vim = cm.vimState;

    function doKeysFn(cm) {
      return function(args) {
        if (args instanceof Array) {
          arguments = args;
        }
        for (var i = 0; i < arguments.length; i++) {
          CodeMirror.Vim.handleKey(cm, arguments[i]);
        }
      }
    }
    function assertCursorAtFn(cm) {
      return function(pos) {
        eqPos(pos, cm.getCursor());
      }
    }
    var helpers = {
      doKeys: doKeysFn(cm),
      assertCursorAt: assertCursorAtFn(cm)
    }
    var successful = false;
    try {
      run(cm, vim, helpers);
      successful = true;
    } finally {
      if ((debug && !successful) || verbose) {
        place.style.visibility = "";
      } else {
        place.removeChild(cm.getWrapperElement());
      }
    }
  }, expectedFail);
};

/**
 * @param name Name of the test
 * @param keys An array of keys or a string with a single key to simulate.
 * @param endPos The expected end position of the cursor.
 * @param startPos The position the cursor should start at, defaults to 0, 0.
 */
function testMotion(name, keys, endPos, startPos) {
  testVim(name, function(cm, vim, helpers) {
    if (!startPos) {
      startPos = { line: 0, ch: 0 };
    }
    cm.setCursor(startPos);
    helpers.doKeys(keys);
    helpers.assertCursorAt(endPos);
  });
};

function makeCursor(line, ch) {
  return { line: line, ch: ch };
};

function offsetCursor(cur, offsetLine, offsetCh) {
  return { line: cur.line + offsetLine, ch: cur.ch + offsetCh };
};

// Motion tests
testMotion('h', 'h', makeCursor(0, 0), word1.start);
testMotion('h_repeat', ['3', 'h'], offsetCursor(word1.end, 0, -3), word1.end);
testMotion('l', 'l', makeCursor(0, 1));
testMotion('l_repeat', ['2', 'l'], makeCursor(0, 2));
testMotion('j', 'j', offsetCursor(word1.end, 1, 0), word1.end);
testMotion('j_repeat', ['2', 'j'], offsetCursor(word1.end, 2, 0), word1.end);
testMotion('k', 'k', offsetCursor(word3.end, -1, 0), word3.end);
testMotion('k_repeat', ['2', 'k'], makeCursor(0, 4), makeCursor(2, 4));
testMotion('w', 'w', word1.start);
testMotion('w_repeat', ['2', 'w'], word2.start);
testMotion('w_wrap', ['w'], word3.start, word2.start);
testMotion('W', 'W', bigWord1.start);
testMotion('W_repeat', ['2', 'W'], bigWord3.start, bigWord1.start);
testMotion('e', 'e', word1.end);
testMotion('e_repeat', ['2', 'e'], word2.end);
testMotion('e_wrap', 'e', word3.end, word2.end);
testMotion('b', 'b', word3.start, word3.end);
testMotion('b_repeat', ['2', 'b'], word2.start, word3.end);
testMotion('b_wrap', 'b', word2.start, word3.start);
testMotion('ge', ['g', 'e'], word2.end, word3.end);
testMotion('ge_repeat', ['2', 'g', 'e'], word1.end, word3.start);
testMotion('ge_wrap', ['g', 'e'], word2.end, word3.start);
testMotion('gg', ['g', 'g'], makeCursor(lines[0].line, lines[0].textStart),
    makeCursor(3, 1));
testMotion('gg_repeat', ['3', 'g', 'g'],
    makeCursor(lines[2].line, lines[2].textStart));
testMotion('G', 'G',
    makeCursor(lines[lines.length - 1].line, lines[lines.length - 1].textStart),
    makeCursor(3, 1));
testMotion('G_repeat', ['3', 'G'], makeCursor(lines[2].line,
    lines[2].textStart));
// TODO: Make the test code long enough to test Ctrl-F and Ctrl-B.
testMotion('0', '0', makeCursor(0, 0), makeCursor(0, 8));
testMotion('^', '^', makeCursor(0, lines[0].textStart), makeCursor(0, 8));
testMotion('$', '$', makeCursor(0, lines[0].length - 1), makeCursor(0, 1));
testMotion('$_repeat', ['2', '$'], makeCursor(1, lines[1].length - 1),
    makeCursor(0, 3));
testMotion('f', ['f', 'p'], pChars[0], makeCursor(charLine.line, 0));
testMotion('f_repeat', ['2', 'f', 'p'], pChars[2], pChars[0]);
testMotion('f_num', ['f', '2'], numChars[2], makeCursor(charLine.line, 0));
testMotion('t', ['t','p'], offsetCursor(pChars[0], 0, -1),
    makeCursor(charLine.line, 0));
testMotion('t_repeat', ['2', 't', 'p'], offsetCursor(pChars[2], 0, -1),
    pChars[0]);
testMotion('F', ['F', 'p'], pChars[0], pChars[1]);
testMotion('F_repeat', ['2', 'F', 'p'], pChars[0], pChars[2]);
testMotion('T', ['T', 'p'], offsetCursor(pChars[0], 0, 1), pChars[1]);
testMotion('T_repeat', ['2', 'T', 'p'], offsetCursor(pChars[0], 0, 1), pChars[2]);
testMotion('%_parens', ['%'], parens1.end, parens1.start);
testMotion('%_squares', ['%'], squares1.end, squares1.start);
testMotion('%_braces', ['%'], curlys1.end, curlys1.start);

// Operator tests
testVim('dw_space', function(cm, vim, helpers) {
  cm.setCursor(0, 0);
  helpers.doKeys('d', 'w');
  eq('word1 ', cm.getValue());
  var register = vim.registerController.getRegister();
  eq(' ', register.text);
  is(!register.linewise);
}, { value: ' word1 ' });
testVim('dw_word', function(cm, vim, helpers) {
  cm.setCursor(0, 1);
  helpers.doKeys('d', 'w');
  eq(' word2', cm.getValue());
  var register = vim.registerController.getRegister();
  eq('word1 ', register.text);
  is(!register.linewise);
}, { value: ' word1 word2' });
testVim('dw_only_word', function(cm, vim, helpers) {
  // Test that if there is only 1 word left, dw deletes till the end of the
  // line.
  cm.setCursor(0, 1);
  helpers.doKeys('d', 'w');
  eq(' ', cm.getValue());
  var register = vim.registerController.getRegister();
  eq('word1 ', register.text);
  is(!register.linewise);
}, { value: ' word1 ' });
testVim('dw_eol', function(cm, vim, helpers) {
  // Assert that dw does not delete the newline if last word to delete is at end
  // of line.
  cm.setCursor(0, 1);
  helpers.doKeys('d', 'w');
  eq(' \nword2', cm.getValue());
  var register = vim.registerController.getRegister();
  eq('word1', register.text);
  is(!register.linewise);
}, { value: ' word1\nword2' });
testVim('dw_repeat', function(cm, vim, helpers) {
  // Assert that dw does delete newline if it should go to the next line, and
  // that repeat works properly.
  cm.setCursor(0, 1);
  helpers.doKeys('d', '2', 'w');
  eq(' ', cm.getValue());
  var register = vim.registerController.getRegister();
  eq('word1\nword2', register.text);
  is(!register.linewise);
}, { value: ' word1\nword2' });
testVim('d_inclusive', function(cm, vim, helpers) {
  // Assert that when inclusive is set, the character the cursor is on gets
  // deleted too.
  cm.setCursor(0, 1);
  helpers.doKeys('d', 'e');
  eq('  ', cm.getValue());
  var register = vim.registerController.getRegister();
  eq('word1', register.text);
  is(!register.linewise);
}, { value: ' word1 ' });
testVim('d_reverse', function(cm, vim, helpers) {
  // Test that deleting in reverse works.
  cm.setCursor(1, 0);
  helpers.doKeys('d', 'b');
  eq(' word2 ', cm.getValue());
  var register = vim.registerController.getRegister();
  eq('word1\n', register.text);
  is(!register.linewise);
}, { value: ' word1\nword2 ' });
testVim('dd', function(cm, vim, helpers) {
  cm.setCursor(0, 3);
  var expectedBuffer = cm.getRange({ line: 0, ch: 0 },
    { line: 1, ch: 0 });
  var expectedLineCount = cm.lineCount() - 1;
  helpers.doKeys('d', 'd');
  eq(expectedLineCount, cm.lineCount());
  var register = vim.registerController.getRegister();
  eq(expectedBuffer, register.text);
  is(register.linewise);
});
testVim('dd_prefix_repeat', function(cm, vim, helpers) {
  cm.setCursor(0, 3);
  var expectedBuffer = cm.getRange({ line: 0, ch: 0 },
    { line: 2, ch: 0 });
  var expectedLineCount = cm.lineCount() - 2;
  helpers.doKeys('2', 'd', 'd');
  eq(expectedLineCount, cm.lineCount());
  var register = vim.registerController.getRegister();
  eq(expectedBuffer, register.text);
  is(register.linewise);
});
testVim('dd_motion_repeat', function(cm, vim, helpers) {
  cm.setCursor(0, 3);
  var expectedBuffer = cm.getRange({ line: 0, ch: 0 },
    { line: 2, ch: 0 });
  var expectedLineCount = cm.lineCount() - 2;
  helpers.doKeys('d', '2', 'd');
  eq(expectedLineCount, cm.lineCount());
  var register = vim.registerController.getRegister();
  eq(expectedBuffer, register.text);
  is(register.linewise);
});
testVim('dd_multiply_repeat', function(cm, vim, helpers) {
  cm.setCursor(0, 3);
  var expectedBuffer = cm.getRange({ line: 0, ch: 0 },
    { line: 6, ch: 0 });
  var expectedLineCount = cm.lineCount() - 6;
  helpers.doKeys('2', 'd', '3', 'd');
  eq(expectedLineCount, cm.lineCount());
  var register = vim.registerController.getRegister();
  eq(expectedBuffer, register.text);
  is(register.linewise);
});
// Yank commands should behave the exact same as d commands, expect that nothing
// gets deleted.
testVim('yw_repeat', function(cm, vim, helpers) {
  // Assert that dw does delete newline if it should go to the next line, and
  // that repeat works properly.
  cm.setCursor(0, 1);
  helpers.doKeys('y', '2', 'w');
  eq(' word1\nword2', cm.getValue());
  var register = vim.registerController.getRegister();
  eq('word1\nword2', register.text);
  is(!register.linewise);
}, { value: ' word1\nword2' });
testVim('yy_multiply_repeat', function(cm, vim, helpers) {
  cm.setCursor(0, 3);
  var expectedBuffer = cm.getRange({ line: 0, ch: 0 },
    { line: 6, ch: 0 });
  var expectedLineCount = cm.lineCount();
  helpers.doKeys('2', 'y', '3', 'y');
  eq(expectedLineCount, cm.lineCount());
  var register = vim.registerController.getRegister();
  eq(expectedBuffer, register.text);
  is(register.linewise);
});
// Change commands behave like d commands except that it also enters insert
// mode. In addition, when the change is linewise, an additional newline is
// inserted so that insert mode starts on that line.
testVim('cw_repeat', function(cm, vim, helpers) {
  // Assert that dw does delete newline if it should go to the next line, and
  // that repeat works properly.
  cm.setCursor(0, 1);
  helpers.doKeys('c', '2', 'w');
  eq(' ', cm.getValue());
  var register = vim.registerController.getRegister();
  eq('word1\nword2', register.text);
  is(!register.linewise);
  eq('vim-insert', cm.getOption('keyMap'));
}, { value: ' word1\nword2' });
testVim('cc_multiply_repeat', function(cm, vim, helpers) {
  cm.setCursor(0, 3);
  var expectedBuffer = cm.getRange({ line: 0, ch: 0 },
    { line: 6, ch: 0 });
  var expectedLineCount = cm.lineCount() - 5;
  helpers.doKeys('2', 'c', '3', 'c');
  eq(expectedLineCount, cm.lineCount());
  var register = vim.registerController.getRegister();
  eq(expectedBuffer, register.text);
  is(register.linewise);
  eq('vim-insert', cm.getOption('keyMap'));
});
// Swapcase commands edit in place and do not modify registers.
testVim('g~w_repeat', function(cm, vim, helpers) {
  // Assert that dw does delete newline if it should go to the next line, and
  // that repeat works properly.
  cm.setCursor(0, 1);
  helpers.doKeys('g', '~', '2', 'w');
  eq(' WORD1\nWORD2', cm.getValue());
  var register = vim.registerController.getRegister();
  eq('', register.text);
  is(!register.linewise);
}, { value: ' word1\nword2' });
testVim('g~g~', function(cm, vim, helpers) {
  cm.setCursor(0, 3);
  var expectedLineCount = cm.lineCount();
  var expectedValue = cm.getValue().toUpperCase();
  helpers.doKeys('2', 'g', '~', '3', 'g', '~');
  eq(expectedValue, cm.getValue());
  var register = vim.registerController.getRegister();
  eq('', register.text);
  is(!register.linewise);
}, { value: ' word1\nword2\nword3\nword4\nword5\nword6' });
testVim('>{motion}', function(cm, vim, helpers) {
  cm.setCursor(1, 3);
  var expectedLineCount = cm.lineCount();
  var expectedValue = '   word1\n  word2\nword3 ';
  helpers.doKeys('>', 'k');
  eq(expectedValue, cm.getValue());
  var register = vim.registerController.getRegister();
  eq('', register.text);
  is(!register.linewise);
}, { value: ' word1\nword2\nword3 ', indentUnit: 2 });
testVim('>>', function(cm, vim, helpers) {
  cm.setCursor(0, 3);
  var expectedLineCount = cm.lineCount();
  var expectedValue = '   word1\n  word2\nword3 ';
  helpers.doKeys('2', '>', '>');
  eq(expectedValue, cm.getValue());
  var register = vim.registerController.getRegister();
  eq('', register.text);
  is(!register.linewise);
}, { value: ' word1\nword2\nword3 ', indentUnit: 2 });
testVim('<{motion}', function(cm, vim, helpers) {
  cm.setCursor(1, 3);
  var expectedLineCount = cm.lineCount();
  var expectedValue = ' word1\nword2\nword3 ';
  helpers.doKeys('<', 'k');
  eq(expectedValue, cm.getValue());
  var register = vim.registerController.getRegister();
  eq('', register.text);
  is(!register.linewise);
}, { value: '   word1\n  word2\nword3 ', indentUnit: 2 });
testVim('<<', function(cm, vim, helpers) {
  cm.setCursor(0, 3);
  var expectedLineCount = cm.lineCount();
  var expectedValue = ' word1\nword2\nword3 ';
  helpers.doKeys('2', '<', '<');
  eq(expectedValue, cm.getValue());
  var register = vim.registerController.getRegister();
  eq('', register.text);
  is(!register.linewise);
}, { value: '   word1\n  word2\nword3 ', indentUnit: 2 });
