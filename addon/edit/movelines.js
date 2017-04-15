(function() {
  // Moves selected lines with selection by an offset.
  function moveSelectedLines(cm, offset) {
    if (offset == 0) {
      return 0;
    }

    var cursorStart = cm.getCursor('start');
    var cursorEnd = cm.getCursor('end');
    var cursor = cm.getCursor();

    offset = cm.moveLines(cursorStart.line, cursorEnd.line, offset);

    // Calculating type of selection: left-to-right or right-to-left.
    var leftToRightSelection = (cursor.line == cursorEnd.line
        && cursor.ch == cursorEnd.ch);

    // Moving the selection.
    cursorStart.line += offset;
    cursorEnd.line += offset;
    if (leftToRightSelection) {
      cm.setSelection(cursorStart, cursorEnd);
    } else {
      cm.setSelection(cursorEnd, cursorStart);
    }

    return offset;
  }

  // Moves a block of lines by an offset.
  function moveLines(cm, start, end, offset) {
    if (offset == 0 || start > end) {
      return 0;
    }

    // Clipping the offset so that the move wouldn't go beyond the first or the last line.
    if (start + offset < cm.firstLine()) {
      offset = cm.firstLine() - start;
    } else if (end + offset > cm.lastLine()) {
        offset = cm.lastLine() - end;
    }

    // Copying the selected lines.
    var selectedLines = [];
    for (var line = start; line <= end; line++) {
      selectedLines.push(cm.getLine(line));
    }

    // Shifting lines that are next to the selected ones into their new places.
    if (offset > 0) {  // Shifting lines below up.
      for (var line = end + 1; line <= end + offset; line++) {
        cm.setLine(line - selectedLines.length, cm.getLine(line));
      }
    } else {  // Shifting lines above down.
      for (var line = start - 1; line >= start + offset; line--) {
        cm.setLine(line + selectedLines.length, cm.getLine(line));
      }
    }

    // Pasting original selected lines in their destination location.
    for (var line = start; line <= end; line++) {
      cm.setLine(line + offset, selectedLines[line - start]);
    }

    return offset;
  }

  function moveSelectedLinesUp(cm) {
    return cm.operation(function() {
      moveSelectedLines(cm, -1);
    });
  }

  function moveSelectedLinesDown(cm) {
    return cm.operation(function() {
      moveSelectedLines(cm, 1);
    });
  }

  CodeMirror.defineExtension("moveLines", function(start, end, offset) {
    return moveLines(this, start, end, offset);
  });

  CodeMirror.defineExtension("moveSelectedLines", function(offset) {
    return moveSelectedLines(this, offset);
  });

  CodeMirror.defineExtension("moveSelectedLinesUp", function() {
    return moveSelectedLinesUp(this);
  });

  CodeMirror.defineExtension("moveSelectedLinesDown", function() {
    return moveSelectedLinesDown(this);
  });

  CodeMirror.commands.moveSelectedLinesUp = moveSelectedLinesUp;
  CodeMirror.commands.moveSelectedLinesDown = moveSelectedLinesDown;

  CodeMirror.defineOption("moveLines", false, function(cm, val, old) {
    if (old && old != CodeMirror.Init)
      cm.removeKeyMap("moveLines");
    if (val) {
      var map = {name: "moveLines"};
      map[typeof val == "string" ? val : "Alt-Up"] = 'moveSelectedLinesUp';
      map[typeof val == "string" ? val : "Alt-Down"] = 'moveSelectedLinesDown';
      cm.addKeyMap(map);
    }
  });
})();
