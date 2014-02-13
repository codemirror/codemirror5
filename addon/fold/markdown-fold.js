CodeMirror.registerHelper("fold", "markdown", function(cm, start) {
  var level, end, maxDepth = 100, firstLine = cm.getLine(start.line), lastLine = cm.lastLine();

  function headerLevel(line) {
    if (!line) return maxDepth;
    var match = line.match(/^#+/);
    return match ? match[0].length : maxDepth;
  }

  level = headerLevel(firstLine);
  if (level === maxDepth) return undefined;

  for (end = start.line + 1; end < lastLine; ++end) {
    if (headerLevel(cm.getLine(end + 1)) <= level) {
      break;
    }
  }

  return {
    from: CodeMirror.Pos(start.line, cm.getLine(start.line).length),
    to: CodeMirror.Pos(end, cm.getLine(end).length)
  };
});
