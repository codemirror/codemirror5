(function() {
  var SPACE_CHAR_REGEX = /\s/;
  function isStopChar(ch) {
    return (ch > " " && ch < "0") ||
    (ch > "9" && ch < "A") ||
    (ch > "Z" && ch < "_") ||
    (ch > "_" && ch < "a") ||
    (ch > "z" && ch <= "~");
  }

  function isSpaceChar(ch) {
    return SPACE_CHAR_REGEX.test(ch);
  }

  function positionForCtrlArrowMove(cm, direction) {
    var head = cm.getCursor("head");
    var lineNumber = head.line;
    var column = head.ch;
    if (direction === "left")
      --column;

    if (column === -1 && direction === "left") {
      if (lineNumber > 0)
        return CodeMirror.Pos(lineNumber - 1, cm.getLine(lineNumber - 1).length);
      else
        return head;
    }

    var line = cm.getLine(lineNumber);
    if (column === line.length && direction === "right") {
      if (lineNumber + 1 < cm.lineCount())
        return CodeMirror.Pos(lineNumber + 1, 0);
      else
        return head;
    }

    var delta = direction === "left" ? -1 : +1;
    var directionDependentEndColumnOffset = (delta + 1) / 2;

    if (isSpaceChar(line.charAt(column))) {
      while(column + delta >= 0 && column + delta < line.length && isSpaceChar(line.charAt(column + delta)))
        column += delta;
      if (column + delta < 0 || column + delta === line.length)
        return CodeMirror.Pos(lineNumber, column + directionDependentEndColumnOffset);
      else
        column += delta;
    }

    var group = isStopChar(line.charAt(column));

    while(column + delta >= 0 && column + delta < line.length && isStopChar(line.charAt(column + delta)) === group && !isSpaceChar(line.charAt(column + delta)))
      column += delta;

    return CodeMirror.Pos(lineNumber, column + directionDependentEndColumnOffset);
  }

  function move(direction, shift, cm) {
    cm.setExtending(shift);
    cm.extendSelection(positionForCtrlArrowMove(cm, direction));
    cm.setExtending(false);
  }

  var saneWordMoveKeymap = {
    name: "saneWordMoveKeymap",
    "Ctrl-Left": move.bind(this, "left", false),
    "Ctrl-Right": move.bind(this, "right", false),
    "Shift-Ctrl-Left": move.bind(this, "left", true),
    "Shift-Ctrl-Right": move.bind(this, "right", true),
    "Ctrl-Backspace": function(cm) {
      move("left", true, cm);
      cm.replaceSelection("");
    }
  };

  CodeMirror.defineOption("saneWordMove", false, function(cm, val, old) {
    var wasOn = old && old != CodeMirror.Init;
    if (val && !wasOn)
      cm.addKeyMap(saneWordMoveKeymap);
    else if (!val && wasOn)
      cm.removeKeyMap(saneWordMoveKeymap.name);
  });
})();
