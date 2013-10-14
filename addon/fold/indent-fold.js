CodeMirror.registerHelper("fold", "indent", function(cm, start) {
  var lastLine = cm.lastLine(),
      tabSize = cm.getOption("tabSize"),
      firstLine = cm.getLine(start.line),
      myIndent = CodeMirror.countColumn(firstLine, null, tabSize);

  function foldEnded(curColumn, prevColumn) {
    return curColumn < myIndent ||
      (curColumn == myIndent && prevColumn >= myIndent) ||
      (curColumn > myIndent && i == lastLine);
  }

  for (var i = start.line + 1; i <= lastLine; i++) {
    var curColumn = CodeMirror.countColumn(cm.getLine(i), null, tabSize);
    var prevColumn = CodeMirror.countColumn(cm.getLine(i-1), null, tabSize);

    if (foldEnded(curColumn, prevColumn)) {
      var lastFoldLineNumber = curColumn > myIndent && i == lastLine ? i : i-1;
      var lastFoldLine = cm.getLine(lastFoldLineNumber);
      return {from: CodeMirror.Pos(start.line, firstLine.length),
              to: CodeMirror.Pos(lastFoldLineNumber, lastFoldLine.length)};
    }
  }
});

CodeMirror.indentRangeFinder = CodeMirror.fold.indent; // deprecated
