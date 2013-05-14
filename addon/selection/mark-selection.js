// Because sometimes you need to mark the selected *text*.
//
// Adds an option 'styleSelectedText' which, when enabled, gives
// selected text the CSS class "CodeMirror-selectedtext".

(function() {
  "use strict";

  CodeMirror.defineOption("styleSelectedText", false, function(cm, val, old) {
    var prev = old && old != CodeMirror.Init;
    if (val && !prev) {
      updateSelectedText(cm);
      cm.on("cursorActivity", updateSelectedText);
    } else if (!val && prev) {
      cm.off("cursorActivity", updateSelectedText);
      removeTextMarks(cm);
    }
  });

  function cmp(pos1, pos2) {
    return pos1.line !== pos2.line ? pos1.line - pos2.line : pos1.ch - pos2.ch;
  }

  function removeTextMarks(cm) {
    if (cm._selectionMarks) {
      for(var i = 0; i < cm._selectionMarks.length; ++i) {
        cm._selectionMarks[i].clear();
      }
    }
    cm._selectionMarks = null;
  }

  function markText(cm, start, end) {
    if (cmp(start, end) === 0)
      return;
    var opt = {className: "CodeMirror-selectedtext"};
    cm._selectionMarks.push(cmp(start, end) <= 0 ? cm.markText(start, end, opt) : cm.markText(end, start, opt));
  }

  var CHUNK_SIZE = 8;
  var Pos = CodeMirror.Pos;

  function coverRange(cm, anchor, head) {
    if (Math.abs(anchor.line - head.line) < CHUNK_SIZE) {
      markText(cm, anchor, head);
      return;
    }
    if (head.line > anchor.line) {
      markText(cm, anchor, Pos(anchor.line + CHUNK_SIZE, 0));
      for(var line = anchor.line + CHUNK_SIZE; line + CHUNK_SIZE < head.line; line += CHUNK_SIZE)
        markText(cm, Pos(line, 0), Pos(line + CHUNK_SIZE, 0));
      markText(cm, Pos(line, 0), head);
    } else {
      markText(cm, anchor, Pos(anchor.line - CHUNK_SIZE + 1, 0));
      for(var line = anchor.line - CHUNK_SIZE + 1; line - CHUNK_SIZE > head.line; line -= CHUNK_SIZE)
        markText(cm, Pos(line, 0), Pos(line - CHUNK_SIZE, 0));
      markText(cm, Pos(line, 0), head);
    }
  }

  function createInitialCoverage(cm) {
    var anchor = cm.getCursor("anchor");
    var head = cm.getCursor("head");
    cm._selectionMarks = [];
    coverRange(cm, anchor, head);
  }

  function getCoveredRange(cm) {
    var first = cm._selectionMarks[0].find();
    var last = cm._selectionMarks[cm._selectionMarks.length - 1].find();
    if (!first || !last)
        return null;
    var reversed = cmp(first.from, last.to) >= 0;
    return reversed ? {anchor: first.to, head: last.from, reversed: reversed} : {anchor: first.from, head: last.to, reversed: reversed};
  }

  function incrementalCoverageUpdate(cm) {
    var anchor = cm.getCursor("anchor");
    var head = cm.getCursor("head");
    var reversed = cmp(head, anchor) < 0;
    var lastSelection = getCoveredRange(cm);
    // if the anchor of selection moved or selection changed direction - remove everything and construct from scratch.
    if (!lastSelection || cmp(anchor, lastSelection.anchor) !== 0 || (reversed ^ lastSelection.reversed)) {
      removeTextMarks(cm);
      createInitialCoverage(cm);
      return;
    }
    // fast return if nothing changed
    if (cmp(head, lastSelection.head) === 0)
      return;

    // if only column changed then update last text mark
    if (head.line === lastSelection.head.line) {
      var lastMark = cm._selectionMarks.pop();
      var position = lastMark.find();
      lastMark.clear();
      markText(cm, reversed ? position.to : position.from, head);
      return;
    }

    if (!reversed) {
      // if selection shrinks
      if (head.line < lastSelection.head.line) {
        var textMark,
          position;
        do {
          textMark = cm._selectionMarks.pop();
          position = textMark.find();
          textMark.clear();
        } while (cm._selectionMarks.length && position.from.line >= head.line);
        markText(cm, position.from, head);
      } else {
        var textMark = cm._selectionMarks.pop();
        var position = textMark.find();
        textMark.clear();
        coverRange(cm, position.from, head);
      }
    } else {
      // selection getting smaller
      if (head.line > lastSelection.head.line) {
        var textMark,
          position;
        do {
          textMark = cm._selectionMarks.pop();
          position = textMark.find();
          textMark.clear();
        } while (cm._selectionMarks.length && position.to.line <= head.line);
        markText(cm, position.to, head);
      } else {
        var textMark = cm._selectionMarks.pop();
        var position = textMark.find();
        coverRange(cm, position.to, head);
        textMark.clear();
      }
    }
  }

  function updateSelectedText(cm) {
    cm.operation(function() {
        if (!cm.somethingSelected())
          return removeTextMarks(cm);

        if (!cm._selectionMarks || !cm._selectionMarks.length)
          return createInitialCoverage(cm);

        incrementalCoverageUpdate(cm);
    });
  }
})();
