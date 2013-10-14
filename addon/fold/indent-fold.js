CodeMirror.registerHelper("fold", "indent", function(cm, start) {
  var foldEnded = function(myIndent, curColumn, prevColumn, numLines) {
    return ( (curColumn < myIndent) ||
             (curColumn == myIndent && prevColumn >= myIndent) ||
             (curColumn > myIndent && i == numLines-1) );
  };

  var numLines = cm.lineCount(),
      tabSize = cm.getOption("tabSize"),
      firstLine = cm.getLine(start.line),
      myIndent = CodeMirror.countColumn(firstLine, null, tabSize);

  for (var i = start.line + 1 ; i < numLines ; i++) {
    var curColumn = CodeMirror.countColumn(cm.getLine(i), null, tabSize);
    var prevColumn = CodeMirror.countColumn(cm.getLine(i-1), null, tabSize);

    if (foldEnded(myIndent, curColumn, prevColumn, numLines)) {
      var lastFoldLineNumber = (curColumn > myIndent && i == numLines-1) ? i : i-1;
      var lastFoldLine = cm.getLine(lastFoldLineNumber);
      return {from: CodeMirror.Pos(start.line, firstLine.length),
              to: CodeMirror.Pos(lastFoldLineNumber, lastFoldLine.length)};
    }
  }
});
CodeMirror.indentRangeFinder = CodeMirror.fold.indent; // deprecated
