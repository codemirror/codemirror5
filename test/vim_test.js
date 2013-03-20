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
      length: lineText[i].length,
      lineText: lineText[i],
      textStart: /^\s*/.exec(lineText[i])[0].length
    };
  }
  return ret;
})();
var endOfDocument = makeCursor(lines.length - 1,
    lines[lines.length - 1].length);
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
};

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
    function doExFn(cm) {
      return function(command) {
        cm.openDialog = helpers.fakeOpenDialog(command);
        helpers.doKeys(':');
      }
    }
    function assertCursorAtFn(cm) {
      return function(line, ch) {
        var pos;
        if (ch == null && typeof line.line == 'number') {
          pos = line;
        } else {
          pos = makeCursor(line, ch);
        }
        eqPos(pos, cm.getCursor());
      }
    }
    function fakeOpenDialog(result) {
      return function(text, callback) {
        return callback(result);
      }
    }
    var helpers = {
      doKeys: doKeysFn(cm),
      doEx: doExFn(cm),
      assertCursorAt: assertCursorAtFn(cm),
      fakeOpenDialog: fakeOpenDialog,
      getRegisterController: function() {
        return CodeMirror.Vim.getRegisterController();
      }
    }
    CodeMirror.Vim.clearVimGlobalState_();
    var successful = false;
    try {
      run(cm, vim, helpers);
      successful = true;
    } finally {
      if ((debug && !successful) || verbose) {
        place.style.visibility = "visible";
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
testMotion('|', '|', makeCursor(0, 0), makeCursor(0,4));
testMotion('|_repeat', ['3', '|'], makeCursor(0, 2), makeCursor(0,4));
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
testMotion('w_endOfDocument', 'w', endOfDocument, endOfDocument);
testMotion('W', 'W', bigWord1.start);
testMotion('W_repeat', ['2', 'W'], bigWord3.start, bigWord1.start);
testMotion('e', 'e', word1.end);
testMotion('e_repeat', ['2', 'e'], word2.end);
testMotion('e_wrap', 'e', word3.end, word2.end);
testMotion('e_endOfDocument', 'e', endOfDocument, endOfDocument);
testMotion('b', 'b', word3.start, word3.end);
testMotion('b_repeat', ['2', 'b'], word2.start, word3.end);
testMotion('b_wrap', 'b', word2.start, word3.start);
testMotion('b_startOfDocument', 'b', makeCursor(0, 0), makeCursor(0, 0));
testMotion('ge', ['g', 'e'], word2.end, word3.end);
testMotion('ge_repeat', ['2', 'g', 'e'], word1.end, word3.start);
testMotion('ge_wrap', ['g', 'e'], word2.end, word3.start);
testMotion('ge_startOfDocument', ['g', 'e'], makeCursor(0, 0),
    makeCursor(0, 0));
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
testMotion('+', '+', makeCursor(1, lines[1].textStart), makeCursor(0, 8));
testMotion('-', '-', makeCursor(0, lines[0].textStart), makeCursor(1, 4));
testMotion('_', ['6','_'], makeCursor(5, lines[5].textStart), makeCursor(0, 8));
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
// Make sure that moving down after going to the end of a line always leaves you
// at the end of a line, but preserves the offset in other cases
testVim('Changing lines after Eol operation', function(cm, vim, helpers) {
  var startPos = { line: 0, ch: 0 };
  cm.setCursor(startPos);
  helpers.doKeys(['$']);
  helpers.doKeys(['j']);
  // After moving to Eol and then down, we should be at Eol of line 2
  helpers.assertCursorAt({ line: 1, ch: lines[1].length - 1 });
  helpers.doKeys(['j']);
  // After moving down, we should be at Eol of line 3
  helpers.assertCursorAt({ line: 2, ch: lines[2].length - 1 });
  helpers.doKeys(['h']);
  helpers.doKeys(['j']);
  // After moving back one space and then down, since line 4 is shorter than line 2, we should
  // be at Eol of line 2 - 1
  helpers.assertCursorAt({ line: 3, ch: lines[3].length - 1 });
  helpers.doKeys(['j']);
  helpers.doKeys(['j']);
  // After moving down again, since line 3 has enough characters, we should be back to the
  // same place we were at on line 1
  helpers.assertCursorAt({ line: 5, ch: lines[2].length - 2 });
});
//making sure gj and gk recover from clipping
testVim('gj_gk_clipping', function(cm,vim,helpers){
  cm.setCursor(0, 1);
  helpers.doKeys('g','j','g','j');
  helpers.assertCursorAt(2, 1);
  helpers.doKeys('g','k','g','k');
  helpers.assertCursorAt(0, 1);
},{value: 'line 1\n\nline 2'});
//testing a mix of j/k and gj/gk
testVim('j_k_and_gj_gk', function(cm,vim,helpers){
  cm.setSize(120);
  cm.setCursor(0, 0);
  //go to the last character on the first line
  helpers.doKeys('$');
  //move up/down on the column within the wrapped line
  //side-effect: cursor is not locked to eol anymore
  helpers.doKeys('g','k');
  var cur=cm.getCursor();
  eq(cur.line,0);
  is((cur.ch<176),'gk didn\'t move cursor back (1)');
  helpers.doKeys('g','j');
  helpers.assertCursorAt(0, 176);
  //should move to character 177 on line 2 (j/k preserve character index within line)
  helpers.doKeys('j');
  //due to different line wrapping, the cursor can be on a different screen-x now
  //gj and gk preserve screen-x on movement, much like moveV
  helpers.doKeys('3','g','k');
  cur=cm.getCursor();
  eq(cur.line,1);
  is((cur.ch<176),'gk didn\'t move cursor back (2)');
  helpers.doKeys('g','j','2','g','j');
  //should return to the same character-index
  helpers.doKeys('k');
  helpers.assertCursorAt(0, 176);
},{ lineWrapping:true, value: 'This line is intentially long to test movement of gj and gk over wrapped lines. I will start on the end of this line, then make a step up and back to set the origin for j and k.\nThis line is supposed to be even longer than the previous. I will jump here and make another wiggle with gj and gk, before I jump back to the line above. Both wiggles should not change my cursor\'s target character but both j/k and gj/gk change each other\'s reference position.'});
testVim('}', function(cm, vim, helpers) {
  cm.setCursor(0, 0);
  helpers.doKeys('}');
  helpers.assertCursorAt(1, 0);
  cm.setCursor(0, 0);
  helpers.doKeys('2', '}');
  helpers.assertCursorAt(4, 0);
  cm.setCursor(0, 0);
  helpers.doKeys('6', '}');
  helpers.assertCursorAt(5, 0);
}, { value: 'a\n\nb\nc\n\nd' });
testVim('{', function(cm, vim, helpers) {
  cm.setCursor(5, 0);
  helpers.doKeys('{');
  helpers.assertCursorAt(4, 0);
  cm.setCursor(5, 0);
  helpers.doKeys('2', '{');
  helpers.assertCursorAt(1, 0);
  cm.setCursor(5, 0);
  helpers.doKeys('6', '{');
  helpers.assertCursorAt(0, 0);
}, { value: 'a\n\nb\nc\n\nd' });

// Operator tests
testVim('dl', function(cm, vim, helpers) {
  var curStart = makeCursor(0, 0);
  cm.setCursor(curStart);
  helpers.doKeys('d', 'l');
  eq('word1 ', cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq(' ', register.text);
  is(!register.linewise);
  eqPos(curStart, cm.getCursor());
}, { value: ' word1 ' });
testVim('dl_eol', function(cm, vim, helpers) {
  var curStart = makeCursor(0, 6);
  cm.setCursor(curStart);
  helpers.doKeys('d', 'l');
  eq(' word1', cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq(' ', register.text);
  is(!register.linewise);
  helpers.assertCursorAt(0, 6);
}, { value: ' word1 ' });
testVim('dl_repeat', function(cm, vim, helpers) {
  var curStart = makeCursor(0, 0);
  cm.setCursor(curStart);
  helpers.doKeys('2', 'd', 'l');
  eq('ord1 ', cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq(' w', register.text);
  is(!register.linewise);
  eqPos(curStart, cm.getCursor());
}, { value: ' word1 ' });
testVim('dh', function(cm, vim, helpers) {
  var curStart = makeCursor(0, 3);
  cm.setCursor(curStart);
  helpers.doKeys('d', 'h');
  eq(' wrd1 ', cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq('o', register.text);
  is(!register.linewise);
  eqPos(offsetCursor(curStart, 0 , -1), cm.getCursor());
}, { value: ' word1 ' });
testVim('dj', function(cm, vim, helpers) {
  var curStart = makeCursor(0, 3);
  cm.setCursor(curStart);
  helpers.doKeys('d', 'j');
  eq(' word3', cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq(' word1\nword2\n', register.text);
  is(register.linewise);
  helpers.assertCursorAt(0, 1);
}, { value: ' word1\nword2\n word3' });
testVim('dj_end_of_document', function(cm, vim, helpers) {
  var curStart = makeCursor(0, 3);
  cm.setCursor(curStart);
  helpers.doKeys('d', 'j');
  eq(' word1 ', cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq('', register.text);
  is(!register.linewise);
  helpers.assertCursorAt(0, 3);
}, { value: ' word1 ' });
testVim('dk', function(cm, vim, helpers) {
  var curStart = makeCursor(1, 3);
  cm.setCursor(curStart);
  helpers.doKeys('d', 'k');
  eq(' word3', cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq(' word1\nword2\n', register.text);
  is(register.linewise);
  helpers.assertCursorAt(0, 1);
}, { value: ' word1\nword2\n word3' });
testVim('dk_start_of_document', function(cm, vim, helpers) {
  var curStart = makeCursor(0, 3);
  cm.setCursor(curStart);
  helpers.doKeys('d', 'k');
  eq(' word1 ', cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq('', register.text);
  is(!register.linewise);
  helpers.assertCursorAt(0, 3);
}, { value: ' word1 ' });
testVim('dw_space', function(cm, vim, helpers) {
  var curStart = makeCursor(0, 0);
  cm.setCursor(curStart);
  helpers.doKeys('d', 'w');
  eq('word1 ', cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq(' ', register.text);
  is(!register.linewise);
  eqPos(curStart, cm.getCursor());
}, { value: ' word1 ' });
testVim('dw_word', function(cm, vim, helpers) {
  var curStart = makeCursor(0, 1);
  cm.setCursor(curStart);
  helpers.doKeys('d', 'w');
  eq(' word2', cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq('word1 ', register.text);
  is(!register.linewise);
  eqPos(curStart, cm.getCursor());
}, { value: ' word1 word2' });
testVim('dw_only_word', function(cm, vim, helpers) {
  // Test that if there is only 1 word left, dw deletes till the end of the
  // line.
  var curStart = makeCursor(0, 1);
  cm.setCursor(curStart);
  helpers.doKeys('d', 'w');
  eq(' ', cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq('word1 ', register.text);
  is(!register.linewise);
  eqPos(curStart, cm.getCursor());
}, { value: ' word1 ' });
testVim('dw_eol', function(cm, vim, helpers) {
  // Assert that dw does not delete the newline if last word to delete is at end
  // of line.
  var curStart = makeCursor(0, 1);
  cm.setCursor(curStart);
  helpers.doKeys('d', 'w');
  eq(' \nword2', cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq('word1', register.text);
  is(!register.linewise);
  eqPos(curStart, cm.getCursor());
}, { value: ' word1\nword2' });
testVim('dw_repeat', function(cm, vim, helpers) {
  // Assert that dw does delete newline if it should go to the next line, and
  // that repeat works properly.
  var curStart = makeCursor(0, 1);
  cm.setCursor(curStart);
  helpers.doKeys('d', '2', 'w');
  eq(' ', cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq('word1\nword2', register.text);
  is(!register.linewise);
  eqPos(curStart, cm.getCursor());
}, { value: ' word1\nword2' });
testVim('d_inclusive', function(cm, vim, helpers) {
  // Assert that when inclusive is set, the character the cursor is on gets
  // deleted too.
  var curStart = makeCursor(0, 1);
  cm.setCursor(curStart);
  helpers.doKeys('d', 'e');
  eq('  ', cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq('word1', register.text);
  is(!register.linewise);
  eqPos(curStart, cm.getCursor());
}, { value: ' word1 ' });
testVim('d_reverse', function(cm, vim, helpers) {
  // Test that deleting in reverse works.
  cm.setCursor(1, 0);
  helpers.doKeys('d', 'b');
  eq(' word2 ', cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq('word1\n', register.text);
  is(!register.linewise);
  helpers.assertCursorAt(0, 1);
}, { value: ' word1\nword2 ' });
testVim('dd', function(cm, vim, helpers) {
  cm.setCursor(0, 3);
  var expectedBuffer = cm.getRange({ line: 0, ch: 0 },
    { line: 1, ch: 0 });
  var expectedLineCount = cm.lineCount() - 1;
  helpers.doKeys('d', 'd');
  eq(expectedLineCount, cm.lineCount());
  var register = helpers.getRegisterController().getRegister();
  eq(expectedBuffer, register.text);
  is(register.linewise);
  helpers.assertCursorAt(0, lines[1].textStart);
});
testVim('dd_prefix_repeat', function(cm, vim, helpers) {
  cm.setCursor(0, 3);
  var expectedBuffer = cm.getRange({ line: 0, ch: 0 },
    { line: 2, ch: 0 });
  var expectedLineCount = cm.lineCount() - 2;
  helpers.doKeys('2', 'd', 'd');
  eq(expectedLineCount, cm.lineCount());
  var register = helpers.getRegisterController().getRegister();
  eq(expectedBuffer, register.text);
  is(register.linewise);
  helpers.assertCursorAt(0, lines[2].textStart);
});
testVim('dd_motion_repeat', function(cm, vim, helpers) {
  cm.setCursor(0, 3);
  var expectedBuffer = cm.getRange({ line: 0, ch: 0 },
    { line: 2, ch: 0 });
  var expectedLineCount = cm.lineCount() - 2;
  helpers.doKeys('d', '2', 'd');
  eq(expectedLineCount, cm.lineCount());
  var register = helpers.getRegisterController().getRegister();
  eq(expectedBuffer, register.text);
  is(register.linewise);
  helpers.assertCursorAt(0, lines[2].textStart);
});
testVim('dd_multiply_repeat', function(cm, vim, helpers) {
  cm.setCursor(0, 3);
  var expectedBuffer = cm.getRange({ line: 0, ch: 0 },
    { line: 6, ch: 0 });
  var expectedLineCount = cm.lineCount() - 6;
  helpers.doKeys('2', 'd', '3', 'd');
  eq(expectedLineCount, cm.lineCount());
  var register = helpers.getRegisterController().getRegister();
  eq(expectedBuffer, register.text);
  is(register.linewise);
  helpers.assertCursorAt(0, lines[6].textStart);
});
// Yank commands should behave the exact same as d commands, expect that nothing
// gets deleted.
testVim('yw_repeat', function(cm, vim, helpers) {
  // Assert that yw does yank newline if it should go to the next line, and
  // that repeat works properly.
  var curStart = makeCursor(0, 1);
  cm.setCursor(curStart);
  helpers.doKeys('y', '2', 'w');
  eq(' word1\nword2', cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq('word1\nword2', register.text);
  is(!register.linewise);
  eqPos(curStart, cm.getCursor());
}, { value: ' word1\nword2' });
testVim('yy_multiply_repeat', function(cm, vim, helpers) {
  var curStart = makeCursor(0, 3);
  cm.setCursor(curStart);
  var expectedBuffer = cm.getRange({ line: 0, ch: 0 },
    { line: 6, ch: 0 });
  var expectedLineCount = cm.lineCount();
  helpers.doKeys('2', 'y', '3', 'y');
  eq(expectedLineCount, cm.lineCount());
  var register = helpers.getRegisterController().getRegister();
  eq(expectedBuffer, register.text);
  is(register.linewise);
  eqPos(curStart, cm.getCursor());
});
// Change commands behave like d commands except that it also enters insert
// mode. In addition, when the change is linewise, an additional newline is
// inserted so that insert mode starts on that line.
testVim('cw_repeat', function(cm, vim, helpers) {
  // Assert that cw does delete newline if it should go to the next line, and
  // that repeat works properly.
  var curStart = makeCursor(0, 1);
  cm.setCursor(curStart);
  helpers.doKeys('c', '2', 'w');
  eq(' ', cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq('word1\nword2', register.text);
  is(!register.linewise);
  eqPos(curStart, cm.getCursor());
  eq('vim-insert', cm.getOption('keyMap'));
}, { value: ' word1\nword2' });
testVim('cc_multiply_repeat', function(cm, vim, helpers) {
  cm.setCursor(0, 3);
  var expectedBuffer = cm.getRange({ line: 0, ch: 0 },
    { line: 6, ch: 0 });
  var expectedLineCount = cm.lineCount() - 5;
  helpers.doKeys('2', 'c', '3', 'c');
  eq(expectedLineCount, cm.lineCount());
  var register = helpers.getRegisterController().getRegister();
  eq(expectedBuffer, register.text);
  is(register.linewise);
  helpers.assertCursorAt(0, lines[0].textStart);
  eq('vim-insert', cm.getOption('keyMap'));
});
// Swapcase commands edit in place and do not modify registers.
testVim('g~w_repeat', function(cm, vim, helpers) {
  // Assert that dw does delete newline if it should go to the next line, and
  // that repeat works properly.
  var curStart = makeCursor(0, 1);
  cm.setCursor(curStart);
  helpers.doKeys('g', '~', '2', 'w');
  eq(' WORD1\nWORD2', cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq('', register.text);
  is(!register.linewise);
  eqPos(curStart, cm.getCursor());
}, { value: ' word1\nword2' });
testVim('g~g~', function(cm, vim, helpers) {
  var curStart = makeCursor(0, 3);
  cm.setCursor(curStart);
  var expectedLineCount = cm.lineCount();
  var expectedValue = cm.getValue().toUpperCase();
  helpers.doKeys('2', 'g', '~', '3', 'g', '~');
  eq(expectedValue, cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq('', register.text);
  is(!register.linewise);
  eqPos(curStart, cm.getCursor());
}, { value: ' word1\nword2\nword3\nword4\nword5\nword6' });
testVim('>{motion}', function(cm, vim, helpers) {
  cm.setCursor(1, 3);
  var expectedLineCount = cm.lineCount();
  var expectedValue = '   word1\n  word2\nword3 ';
  helpers.doKeys('>', 'k');
  eq(expectedValue, cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq('', register.text);
  is(!register.linewise);
  helpers.assertCursorAt(0, 3);
}, { value: ' word1\nword2\nword3 ', indentUnit: 2 });
testVim('>>', function(cm, vim, helpers) {
  cm.setCursor(0, 3);
  var expectedLineCount = cm.lineCount();
  var expectedValue = '   word1\n  word2\nword3 ';
  helpers.doKeys('2', '>', '>');
  eq(expectedValue, cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq('', register.text);
  is(!register.linewise);
  helpers.assertCursorAt(0, 3);
}, { value: ' word1\nword2\nword3 ', indentUnit: 2 });
testVim('<{motion}', function(cm, vim, helpers) {
  cm.setCursor(1, 3);
  var expectedLineCount = cm.lineCount();
  var expectedValue = ' word1\nword2\nword3 ';
  helpers.doKeys('<', 'k');
  eq(expectedValue, cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq('', register.text);
  is(!register.linewise);
  helpers.assertCursorAt(0, 1);
}, { value: '   word1\n  word2\nword3 ', indentUnit: 2 });
testVim('<<', function(cm, vim, helpers) {
  cm.setCursor(0, 3);
  var expectedLineCount = cm.lineCount();
  var expectedValue = ' word1\nword2\nword3 ';
  helpers.doKeys('2', '<', '<');
  eq(expectedValue, cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq('', register.text);
  is(!register.linewise);
  helpers.assertCursorAt(0, 1);
}, { value: '   word1\n  word2\nword3 ', indentUnit: 2 });

// Operator-motion tests
testVim('D', function(cm, vim, helpers) {
  var curStart = makeCursor(0, 3);
  cm.setCursor(curStart);
  helpers.doKeys('D');
  eq(' wo\nword2\n word3', cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq('rd1', register.text);
  is(!register.linewise);
  helpers.assertCursorAt(0, 3);
}, { value: ' word1\nword2\n word3' });
testVim('C', function(cm, vim, helpers) {
  var curStart = makeCursor(0, 3);
  cm.setCursor(curStart);
  helpers.doKeys('C');
  eq(' wo\nword2\n word3', cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq('rd1', register.text);
  is(!register.linewise);
  helpers.assertCursorAt(0, 3);
  eq('vim-insert', cm.getOption('keyMap'));
}, { value: ' word1\nword2\n word3' });
testVim('Y', function(cm, vim, helpers) {
  var curStart = makeCursor(0, 3);
  cm.setCursor(curStart);
  helpers.doKeys('Y');
  eq(' word1\nword2\n word3', cm.getValue());
  var register = helpers.getRegisterController().getRegister();
  eq('rd1', register.text);
  is(!register.linewise);
  helpers.assertCursorAt(0, 3);
}, { value: ' word1\nword2\n word3' });

// Action tests
testVim('a', function(cm, vim, helpers) {
  cm.setCursor(0, 1);
  helpers.doKeys('a');
  helpers.assertCursorAt(0, 2);
  eq('vim-insert', cm.getOption('keyMap'));
});
testVim('a_eol', function(cm, vim, helpers) {
  cm.setCursor(0, lines[0].length - 1);
  helpers.doKeys('a');
  helpers.assertCursorAt(0, lines[0].length);
  eq('vim-insert', cm.getOption('keyMap'));
});
testVim('i', function(cm, vim, helpers) {
  cm.setCursor(0, 1);
  helpers.doKeys('i');
  helpers.assertCursorAt(0, 1);
  eq('vim-insert', cm.getOption('keyMap'));
});
testVim('A', function(cm, vim, helpers) {
  cm.setCursor(0, 0);
  helpers.doKeys('A');
  helpers.assertCursorAt(0, lines[0].length);
  eq('vim-insert', cm.getOption('keyMap'));
});
testVim('I', function(cm, vim, helpers) {
  cm.setCursor(0, 4);
  helpers.doKeys('I');
  helpers.assertCursorAt(0, lines[0].textStart);
  eq('vim-insert', cm.getOption('keyMap'));
});
testVim('o', function(cm, vim, helpers) {
  cm.setCursor(0, 4);
  helpers.doKeys('o');
  eq('word1\n\nword2', cm.getValue());
  helpers.assertCursorAt(1, 0);
  eq('vim-insert', cm.getOption('keyMap'));
}, { value: 'word1\nword2' });
testVim('O', function(cm, vim, helpers) {
  cm.setCursor(0, 4);
  helpers.doKeys('O');
  eq('\nword1\nword2', cm.getValue());
  helpers.assertCursorAt(0, 0);
  eq('vim-insert', cm.getOption('keyMap'));
}, { value: 'word1\nword2' });
testVim('J', function(cm, vim, helpers) {
  cm.setCursor(0, 4);
  helpers.doKeys('J');
  var expectedValue = 'word1  word2\nword3\n word4';
  eq(expectedValue, cm.getValue());
  helpers.assertCursorAt(0, expectedValue.indexOf('word2') - 1);
}, { value: 'word1 \n    word2\nword3\n word4' });
testVim('J_repeat', function(cm, vim, helpers) {
  cm.setCursor(0, 4);
  helpers.doKeys('3', 'J');
  var expectedValue = 'word1  word2 word3\n word4';
  eq(expectedValue, cm.getValue());
  helpers.assertCursorAt(0, expectedValue.indexOf('word3') - 1);
}, { value: 'word1 \n    word2\nword3\n word4' });
testVim('p', function(cm, vim, helpers) {
  cm.setCursor(0, 1);
  helpers.getRegisterController().pushText('"', 'yank', 'abc\ndef', false);
  helpers.doKeys('p');
  eq('__abc\ndef_', cm.getValue());
  helpers.assertCursorAt(1, 2);
}, { value: '___' });
testVim('p_register', function(cm, vim, helpers) {
  cm.setCursor(0, 1);
  helpers.getRegisterController().getRegister('a').set('abc\ndef', false);
  helpers.doKeys('"', 'a', 'p');
  eq('__abc\ndef_', cm.getValue());
  helpers.assertCursorAt(1, 2);
}, { value: '___' });
testVim('p_wrong_register', function(cm, vim, helpers) {
  cm.setCursor(0, 1);
  helpers.getRegisterController().getRegister('a').set('abc\ndef', false);
  helpers.doKeys('p');
  eq('___', cm.getValue());
  helpers.assertCursorAt(0, 1);
}, { value: '___' });
testVim('p_line', function(cm, vim, helpers) {
  cm.setCursor(0, 1);
  helpers.getRegisterController().pushText('"', 'yank', '  a\nd\n', true);
  helpers.doKeys('2', 'p');
  eq('___\n  a\nd\n  a\nd', cm.getValue());
  helpers.assertCursorAt(1, 2);
}, { value: '___' });
testVim('P', function(cm, vim, helpers) {
  cm.setCursor(0, 1);
  helpers.getRegisterController().pushText('"', 'yank', 'abc\ndef', false);
  helpers.doKeys('P');
  eq('_abc\ndef__', cm.getValue());
  helpers.assertCursorAt(1, 3);
}, { value: '___' });
testVim('P_line', function(cm, vim, helpers) {
  cm.setCursor(0, 1);
  helpers.getRegisterController().pushText('"', 'yank', '  a\nd\n', true);
  helpers.doKeys('2', 'P');
  eq('  a\nd\n  a\nd\n___', cm.getValue());
  helpers.assertCursorAt(0, 2);
}, { value: '___' });
testVim('r', function(cm, vim, helpers) {
  cm.setCursor(0, 1);
  helpers.doKeys('3', 'r', 'u');
  eq('wuuuet\nanother', cm.getValue(),'3r failed');
  helpers.assertCursorAt(0, 3);
  cm.setCursor(0, 4);
  helpers.doKeys('v', 'j', 'h', 'r', 'Space');
  eq('wuuu  \n    her', cm.getValue(),'Replacing selection by space-characters failed');
}, { value: 'wordet\nanother' });
testVim('mark', function(cm, vim, helpers) {
  cm.setCursor(2, 2);
  helpers.doKeys('m', 't');
  cm.setCursor(0, 0);
  helpers.doKeys('\'', 't');
  helpers.assertCursorAt(2, 2);
  cm.setCursor(0, 0);
  helpers.doKeys('`', 't');
  helpers.assertCursorAt(2, 2);
});
testVim('jumpToMark_next', function(cm, vim, helpers) {
  cm.setCursor(2, 2);
  helpers.doKeys('m', 't');
  cm.setCursor(0, 0);
  helpers.doKeys(']', '`');
  helpers.assertCursorAt(2, 2);
  cm.setCursor(0, 0);
  helpers.doKeys(']', '\'');
  helpers.assertCursorAt(2, 0);
});
testVim('jumpToMark_next_repeat', function(cm, vim, helpers) {
  cm.setCursor(2, 2);
  helpers.doKeys('m', 'a');
  cm.setCursor(3, 2);
  helpers.doKeys('m', 'b');
  cm.setCursor(4, 2);
  helpers.doKeys('m', 'c');
  cm.setCursor(0, 0);
  helpers.doKeys('2', ']', '`');
  helpers.assertCursorAt(3, 2);
  cm.setCursor(0, 0);
  helpers.doKeys('2', ']', '\'');
  helpers.assertCursorAt(3, 1);
});
testVim('jumpToMark_next_sameline', function(cm, vim, helpers) {
  cm.setCursor(2, 0);
  helpers.doKeys('m', 'a');
  cm.setCursor(2, 4);
  helpers.doKeys('m', 'b');
  cm.setCursor(2, 2);
  helpers.doKeys(']', '`');
  helpers.assertCursorAt(2, 4);
});
testVim('jumpToMark_next_onlyprev', function(cm, vim, helpers) {
  cm.setCursor(2, 0);
  helpers.doKeys('m', 'a');
  cm.setCursor(4, 0);
  helpers.doKeys(']', '`');
  helpers.assertCursorAt(4, 0);
});
testVim('jumpToMark_next_nomark', function(cm, vim, helpers) {
  cm.setCursor(2, 2);
  helpers.doKeys(']', '`');
  helpers.assertCursorAt(2, 2);
  helpers.doKeys(']', '\'');
  helpers.assertCursorAt(2, 0);
});
testVim('jumpToMark_next_linewise_over', function(cm, vim, helpers) {
  cm.setCursor(2, 2);
  helpers.doKeys('m', 'a');
  cm.setCursor(3, 4);
  helpers.doKeys('m', 'b');
  cm.setCursor(2, 1);
  helpers.doKeys(']', '\'');
  helpers.assertCursorAt(3, 1);
});
testVim('jumpToMark_next_action', function(cm, vim, helpers) {
  cm.setCursor(2, 2);
  helpers.doKeys('m', 't');
  cm.setCursor(0, 0);
  helpers.doKeys('d', ']', '`');
  helpers.assertCursorAt(0, 0);
  var actual = cm.getLine(0);
  var expected = 'pop pop 0 1 2 3 4';
  eq(actual, expected, "Deleting while jumping to the next mark failed.");
});
testVim('jumpToMark_next_line_action', function(cm, vim, helpers) {
  cm.setCursor(2, 2);
  helpers.doKeys('m', 't');
  cm.setCursor(0, 0);
  helpers.doKeys('d', ']', '\'');
  helpers.assertCursorAt(0, 1);
  var actual = cm.getLine(0);
  var expected = ' (a) [b] {c} '
  eq(actual, expected, "Deleting while jumping to the next mark line failed.");
});
testVim('jumpToMark_prev', function(cm, vim, helpers) {
  cm.setCursor(2, 2);
  helpers.doKeys('m', 't');
  cm.setCursor(4, 0);
  helpers.doKeys('[', '`');
  helpers.assertCursorAt(2, 2);
  cm.setCursor(4, 0);
  helpers.doKeys('[', '\'');
  helpers.assertCursorAt(2, 0);
});
testVim('jumpToMark_prev_repeat', function(cm, vim, helpers) {
  cm.setCursor(2, 2);
  helpers.doKeys('m', 'a');
  cm.setCursor(3, 2);
  helpers.doKeys('m', 'b');
  cm.setCursor(4, 2);
  helpers.doKeys('m', 'c');
  cm.setCursor(5, 0);
  helpers.doKeys('2', '[', '`');
  helpers.assertCursorAt(3, 2);
  cm.setCursor(5, 0);
  helpers.doKeys('2', '[', '\'');
  helpers.assertCursorAt(3, 1);
});
testVim('jumpToMark_prev_sameline', function(cm, vim, helpers) {
  cm.setCursor(2, 0);
  helpers.doKeys('m', 'a');
  cm.setCursor(2, 4);
  helpers.doKeys('m', 'b');
  cm.setCursor(2, 2);
  helpers.doKeys('[', '`');
  helpers.assertCursorAt(2, 0);
});
testVim('jumpToMark_prev_onlynext', function(cm, vim, helpers) {
  cm.setCursor(4, 4);
  helpers.doKeys('m', 'a');
  cm.setCursor(2, 0);
  helpers.doKeys('[', '`');
  helpers.assertCursorAt(2, 0);
});
testVim('jumpToMark_prev_nomark', function(cm, vim, helpers) {
  cm.setCursor(2, 2);
  helpers.doKeys('[', '`');
  helpers.assertCursorAt(2, 2);
  helpers.doKeys('[', '\'');
  helpers.assertCursorAt(2, 0);
});
testVim('jumpToMark_prev_linewise_over', function(cm, vim, helpers) {
  cm.setCursor(2, 2);
  helpers.doKeys('m', 'a');
  cm.setCursor(3, 4);
  helpers.doKeys('m', 'b');
  cm.setCursor(3, 6);
  helpers.doKeys('[', '\'');
  helpers.assertCursorAt(2, 0);
});
testVim('delmark_single', function(cm, vim, helpers) {
  cm.setCursor(1, 2);
  helpers.doKeys('m', 't');
  helpers.doEx('delmarks t');
  cm.setCursor(0, 0);
  helpers.doKeys('`', 't');
  helpers.assertCursorAt(0, 0);
});
testVim('delmark_range', function(cm, vim, helpers) {
  cm.setCursor(1, 2);
  helpers.doKeys('m', 'a');
  cm.setCursor(2, 2);
  helpers.doKeys('m', 'b');
  cm.setCursor(3, 2);
  helpers.doKeys('m', 'c');
  cm.setCursor(4, 2);
  helpers.doKeys('m', 'd');
  cm.setCursor(5, 2);
  helpers.doKeys('m', 'e');
  helpers.doEx('delmarks b-d');
  cm.setCursor(0, 0);
  helpers.doKeys('`', 'a');
  helpers.assertCursorAt(1, 2);
  helpers.doKeys('`', 'b');
  helpers.assertCursorAt(1, 2);
  helpers.doKeys('`', 'c');
  helpers.assertCursorAt(1, 2);
  helpers.doKeys('`', 'd');
  helpers.assertCursorAt(1, 2);
  helpers.doKeys('`', 'e');
  helpers.assertCursorAt(5, 2);
});
testVim('delmark_multi', function(cm, vim, helpers) {
  cm.setCursor(1, 2);
  helpers.doKeys('m', 'a');
  cm.setCursor(2, 2);
  helpers.doKeys('m', 'b');
  cm.setCursor(3, 2);
  helpers.doKeys('m', 'c');
  cm.setCursor(4, 2);
  helpers.doKeys('m', 'd');
  cm.setCursor(5, 2);
  helpers.doKeys('m', 'e');
  helpers.doEx('delmarks bcd');
  cm.setCursor(0, 0);
  helpers.doKeys('`', 'a');
  helpers.assertCursorAt(1, 2);
  helpers.doKeys('`', 'b');
  helpers.assertCursorAt(1, 2);
  helpers.doKeys('`', 'c');
  helpers.assertCursorAt(1, 2);
  helpers.doKeys('`', 'd');
  helpers.assertCursorAt(1, 2);
  helpers.doKeys('`', 'e');
  helpers.assertCursorAt(5, 2);
});
testVim('delmark_multi_space', function(cm, vim, helpers) {
  cm.setCursor(1, 2);
  helpers.doKeys('m', 'a');
  cm.setCursor(2, 2);
  helpers.doKeys('m', 'b');
  cm.setCursor(3, 2);
  helpers.doKeys('m', 'c');
  cm.setCursor(4, 2);
  helpers.doKeys('m', 'd');
  cm.setCursor(5, 2);
  helpers.doKeys('m', 'e');
  helpers.doEx('delmarks b c d');
  cm.setCursor(0, 0);
  helpers.doKeys('`', 'a');
  helpers.assertCursorAt(1, 2);
  helpers.doKeys('`', 'b');
  helpers.assertCursorAt(1, 2);
  helpers.doKeys('`', 'c');
  helpers.assertCursorAt(1, 2);
  helpers.doKeys('`', 'd');
  helpers.assertCursorAt(1, 2);
  helpers.doKeys('`', 'e');
  helpers.assertCursorAt(5, 2);
});
testVim('delmark_all', function(cm, vim, helpers) {
  cm.setCursor(1, 2);
  helpers.doKeys('m', 'a');
  cm.setCursor(2, 2);
  helpers.doKeys('m', 'b');
  cm.setCursor(3, 2);
  helpers.doKeys('m', 'c');
  cm.setCursor(4, 2);
  helpers.doKeys('m', 'd');
  cm.setCursor(5, 2);
  helpers.doKeys('m', 'e');
  helpers.doEx('delmarks a b-de');
  cm.setCursor(0, 0);
  helpers.doKeys('`', 'a');
  helpers.assertCursorAt(0, 0);
  helpers.doKeys('`', 'b');
  helpers.assertCursorAt(0, 0);
  helpers.doKeys('`', 'c');
  helpers.assertCursorAt(0, 0);
  helpers.doKeys('`', 'd');
  helpers.assertCursorAt(0, 0);
  helpers.doKeys('`', 'e');
  helpers.assertCursorAt(0, 0);
});
testVim('visual', function(cm, vim, helpers) {
  helpers.doKeys('l', 'v', 'l', 'l');
  helpers.assertCursorAt(0, 3);
  eqPos(makeCursor(0, 1), cm.getCursor('anchor'));
  helpers.doKeys('d');
  eq('15', cm.getValue());
}, { value: '12345' });
testVim('visual_line', function(cm, vim, helpers) {
  helpers.doKeys('l', 'V', 'l', 'j', 'j', 'd');
  eq(' 4\n 5', cm.getValue());
}, { value: ' 1\n 2\n 3\n 4\n 5' });
testVim('visual_marks', function(cm, vim, helpers) {
  helpers.doKeys('l', 'v', 'l', 'l', 'v');
  // Test visual mode marks
  cm.setCursor(0, 0);
  helpers.doKeys('\'', '<');
  helpers.assertCursorAt(0, 1);
  helpers.doKeys('\'', '>');
  helpers.assertCursorAt(0, 3);
});
testVim('visual_join', function(cm, vim, helpers) {
  helpers.doKeys('l', 'V', 'l', 'j', 'j', 'J');
  eq(' 1 2 3\n 4\n 5', cm.getValue());
}, { value: ' 1\n 2\n 3\n 4\n 5' });
testVim('/ and n/N', function(cm, vim, helpers) {
  cm.openDialog = helpers.fakeOpenDialog('match');
  helpers.doKeys('/');
  helpers.assertCursorAt(0, 11);
  helpers.doKeys('n');
  helpers.assertCursorAt(1, 6);
  helpers.doKeys('N');
  helpers.assertCursorAt(0, 11);

  cm.setCursor(0, 0);
  helpers.doKeys('2', '/');
  helpers.assertCursorAt(1, 6);
}, { value: 'match nope match \n nope Match' });
testVim('/_case', function(cm, vim, helpers) {
  cm.openDialog = helpers.fakeOpenDialog('Match');
  helpers.doKeys('/');
  helpers.assertCursorAt(1, 6);
}, { value: 'match nope match \n nope Match' });
testVim('? and n/N', function(cm, vim, helpers) {
  cm.openDialog = helpers.fakeOpenDialog('match');
  helpers.doKeys('?');
  helpers.assertCursorAt(1, 6);
  helpers.doKeys('n');
  helpers.assertCursorAt(0, 11);
  helpers.doKeys('N');
  helpers.assertCursorAt(1, 6);

  cm.setCursor(0, 0);
  helpers.doKeys('2', '?');
  helpers.assertCursorAt(0, 11);
}, { value: 'match nope match \n nope Match' });
testVim('*', function(cm, vim, helpers) {
  cm.setCursor(0, 9);
  helpers.doKeys('*');
  helpers.assertCursorAt(0, 22);

  cm.setCursor(0, 9);
  helpers.doKeys('2', '*');
  helpers.assertCursorAt(1, 8);
}, { value: 'nomatch match nomatch match \nnomatch Match' });
testVim('*_no_word', function(cm, vim, helpers) {
  cm.setCursor(0, 0);
  helpers.doKeys('*');
  helpers.assertCursorAt(0, 0);
}, { value: ' \n match \n' });
testVim('*_symbol', function(cm, vim, helpers) {
  cm.setCursor(0, 0);
  helpers.doKeys('*');
  helpers.assertCursorAt(1, 0);
}, { value: ' /}\n/} match \n' });
testVim('#', function(cm, vim, helpers) {
  cm.setCursor(0, 9);
  helpers.doKeys('#');
  helpers.assertCursorAt(1, 8);

  cm.setCursor(0, 9);
  helpers.doKeys('2', '#');
  helpers.assertCursorAt(0, 22);
}, { value: 'nomatch match nomatch match \nnomatch Match' });
testVim('*_seek', function(cm, vim, helpers) {
  // Should skip over space and symbols.
  cm.setCursor(0, 3);
  helpers.doKeys('*');
  helpers.assertCursorAt(0, 22);
}, { value: '    :=  match nomatch match \nnomatch Match' });
testVim('#', function(cm, vim, helpers) {
  // Should skip over space and symbols.
  cm.setCursor(0, 3);
  helpers.doKeys('#');
  helpers.assertCursorAt(1, 8);
}, { value: '    :=  match nomatch match \nnomatch Match' });
testVim('.', function(cm, vim, helpers) {
  cm.setCursor(0, 0);
  helpers.doKeys('2', 'd', 'w');
  helpers.doKeys('.');
  eq('5 6', cm.getValue());
}, { value: '1 2 3 4 5 6'});
testVim('._repeat', function(cm, vim, helpers) {
  cm.setCursor(0, 0);
  helpers.doKeys('2', 'd', 'w');
  helpers.doKeys('3', '.');
  eq('6', cm.getValue());
}, { value: '1 2 3 4 5 6'});

// Ex mode tests
testVim('ex_go_to_line', function(cm, vim, helpers) {
  cm.setCursor(0, 0);
  helpers.doEx('4');
  helpers.assertCursorAt(3, 0);
}, { value: 'a\nb\nc\nd\ne\n'});
testVim('ex_write', function(cm, vim, helpers) {
  var tmp = CodeMirror.commands.save;
  var written;
  var actualCm;
  CodeMirror.commands.save = function(cm) {
    written = true;
    actualCm = cm;
  };
  // Test that w, wr, wri ... write all trigger :write.
  var command = 'write';
  for (var i = 1; i < command.length; i++) {
    written = false;
    actualCm = null;
    helpers.doEx(command.substring(0, i));
    eq(written, true);
    eq(actualCm, cm);
  }
  CodeMirror.commands.save = tmp;
});
testVim('ex_substitute_same_line', function(cm, vim, helpers) {
  cm.setCursor(1, 0);
  helpers.doEx('s/one/two');
  eq('one one\n two two', cm.getValue());
}, { value: 'one one\n one one'});
testVim('ex_substitute_global', function(cm, vim, helpers) {
  cm.setCursor(1, 0);
  helpers.doEx('%s/one/two');
  eq('two two\n two two', cm.getValue());
}, { value: 'one one\n one one'});
testVim('ex_substitute_input_range', function(cm, vim, helpers) {
  cm.setCursor(1, 0);
  helpers.doEx('1,3s/\\d/0');
  eq('0\n0\n0\n4', cm.getValue());
}, { value: '1\n2\n3\n4' });
testVim('ex_substitute_visual_range', function(cm, vim, helpers) {
  cm.setCursor(1, 0);
  // Set last visual mode selection marks '< and '> at lines 2 and 4
  helpers.doKeys('V', '2', 'j', 'v');
  helpers.doEx('\'<,\'>s/\\d/0');
  eq('1\n0\n0\n0\n5', cm.getValue());
}, { value: '1\n2\n3\n4\n5' });
testVim('ex_substitute_capture', function(cm, vim, helpers) {
  cm.setCursor(1, 0);
  helpers.doEx('s/(\\d+)/$1$1/')
  eq('a1111 a1212 a1313', cm.getValue());
}, { value: 'a11 a12 a13' });
testVim('ex_substitute_empty_query', function(cm, vim, helpers) {
  // If the query is empty, use last query.
  cm.setCursor(1, 0);
  cm.openDialog = helpers.fakeOpenDialog('1');
  helpers.doKeys('/');
  helpers.doEx('s//b');
  eq('abb ab2 ab3', cm.getValue());
}, { value: 'a11 a12 a13' });
testVim('ex_substitute_count', function(cm, vim, helpers) {
  cm.setCursor(1, 0);
  helpers.doEx('s/\\d/0/i 2');
  eq('1\n0\n0\n4', cm.getValue());
}, { value: '1\n2\n3\n4' });
testVim('ex_substitute_count_with_range', function(cm, vim, helpers) {
  cm.setCursor(1, 0);
  helpers.doEx('1,3s/\\d/0/ 3');
  eq('1\n2\n0\n0', cm.getValue());
}, { value: '1\n2\n3\n4' });
//:noh should clear highlighting of search-results but allow to resume search through n
testVim('ex_noh_clearSearchHighlight', function(cm, vim, helpers) {
  cm.openDialog = helpers.fakeOpenDialog('match');
  helpers.doKeys('?');
  helpers.doEx('noh');
  eq(vim.searchState_.getOverlay(),null,'match-highlighting wasn\'t cleared');
  helpers.doKeys('n');
  helpers.assertCursorAt(0, 11,'can\'t resume search after clearing highlighting');
}, { value: 'match nope match \n nope Match' });
// TODO: Reset key maps after each test.
testVim('ex_map_key2key', function(cm, vim, helpers) {
  helpers.doEx('map a x');
  helpers.doKeys('a');
  helpers.assertCursorAt(0, 0);
  eq('bc', cm.getValue());
}, { value: 'abc' });
testVim('ex_map_key2key_to_colon', function(cm, vim, helpers) {
  helpers.doEx('map ; :');
  var dialogOpened = false;
  cm.openDialog = function() {
    dialogOpened = true;
  }
  helpers.doKeys(';');
  eq(dialogOpened, true);
});
testVim('ex_map_ex2key:', function(cm, vim, helpers) {
  helpers.doEx('map :del x');
  helpers.doEx('del');
  helpers.assertCursorAt(0, 0);
  eq('bc', cm.getValue());
}, { value: 'abc' });
testVim('ex_map_ex2ex', function(cm, vim, helpers) {
  helpers.doEx('map :del :w');
  var tmp = CodeMirror.commands.save;
  var written = false;
  var actualCm;
  CodeMirror.commands.save = function(cm) {
    written = true;
    actualCm = cm;
  };
  helpers.doEx('del');
  CodeMirror.commands.save = tmp;
  eq(written, true);
  eq(actualCm, cm);
});
testVim('ex_map_key2ex', function(cm, vim, helpers) {
  helpers.doEx('map a :w');
  var tmp = CodeMirror.commands.save;
  var written = false;
  var actualCm;
  CodeMirror.commands.save = function(cm) {
    written = true;
    actualCm = cm;
  };
  helpers.doKeys('a');
  CodeMirror.commands.save = tmp;
  eq(written, true);
  eq(actualCm, cm);
});
// Testing registration of functions as ex-commands and mapping to <Key>-keys
testVim('ex_api_test', function(cm, vim, helpers) {
  var res=false;
  var val='from';
  CodeMirror.Vim.defineEx('extest','ext',function(cm,params){
    if(params.args)val=params.args[0];
    else res=true;
  });
  helpers.doEx(':ext to');
  eq(val,'to','Defining ex-command failed');
  CodeMirror.Vim.map('<C-CR><Space>',':ext');
  helpers.doKeys('Ctrl-Enter','Space');
  is(res,'Mapping to key failed');
});
// For now, this test needs to be last because it messes up : for future tests.
testVim('ex_map_key2key_from_colon', function(cm, vim, helpers) {
  helpers.doEx('map : x');
  helpers.doKeys(':');
  helpers.assertCursorAt(0, 0);
  eq('bc', cm.getValue());
}, { value: 'abc' });
