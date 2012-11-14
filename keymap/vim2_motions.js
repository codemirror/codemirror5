(function() {
  Vim = CodeMirror.Vim;

  var wordRegexp = [/\w/, /[^\w\s]/], bigWordRegexp = [/\S/];
  function isLine(cm, line) { return line >= 0 && line < cm.lineCount(); }
  function inRangeInclusive(x, start, end) { return x >= start && x <= end; }
  /**
   * typedef {Object{line:number,ch:number}} Cursor An object containing the
   *     position of the cursor.
   */
  Vim.motionCommands = {
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
      var firstNonWS = line.search(/\S/);
      return { line: cursor.line,
          ch: firstNonWS == -1 ? line.length : firstNonWS, user: true };
    },
    moveToStartOfLine: function(cm) {
      var cursor = cm.getCursor();
      return { line: cursor.line, ch: 0 };
    },
  };

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
          // No more words to be found. Move to end of document.
          for (; isLine(cm, cur.line + dir); cur.line += dir) {}
          cur.ch = (dir > 0) ? cm.getLine(cur.line).length : 0;
        }
      }
    }
    return cur;
  }
})();
