CodeMirror.braceRangeFinder = function(cm, start) {
  var line = start.line, lineText = cm.getLine(line);
  var at = lineText.length, startChar, tokenType;
  for (; at > 0;) {
    var found = lineText.lastIndexOf("{", at);
    var startToken = '{', endToken = '}';
    if (found < start.ch) {
      found = lineText.lastIndexOf("[", at);
      if (found < start.ch) break;
      startToken = '['; endToken = ']';
    }

    tokenType = cm.getTokenAt(CodeMirror.Pos(line, found + 1)).type;
    if (!/^(comment|string)/.test(tokenType)) { startChar = found; break; }
    at = found - 1;
  }
  if (startChar == null || lineText.lastIndexOf(startToken) > startChar) return;
  var count = 1, lastLine = cm.lineCount(), end, endCh;
  outer: for (var i = line + 1; i < lastLine; ++i) {
    var text = cm.getLine(i), pos = 0;
    for (;;) {
      var nextOpen = text.indexOf(startToken, pos), nextClose = text.indexOf(endToken, pos);
      if (nextOpen < 0) nextOpen = text.length;
      if (nextClose < 0) nextClose = text.length;
      pos = Math.min(nextOpen, nextClose);
      if (pos == text.length) break;
      if (cm.getTokenAt(CodeMirror.Pos(i, pos + 1)).type == tokenType) {
        if (pos == nextOpen) ++count;
        else if (!--count) { end = i; endCh = pos; break outer; }
      }
      ++pos;
    }
  }
  if (end == null || end == line + 1) return;
  return {from: CodeMirror.Pos(line, startChar + 1),
          to: CodeMirror.Pos(end, endCh)};
};
