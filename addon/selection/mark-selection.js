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
      cm.on("cursorActivity", cm.operation.bind(cm, updateSelectedText.bind(cm, cm)));
    } else if (!val && prev) {
      cm.off("cursorActivity", cm.operation.bind(updateSelectedText.bind(cm, cm)));
      clearSelectedText(cm);
      delete cm._selectionMark;
    }
  });

  function cmp(pos1, pos2) {
    return pos1.line !== pos2.line ? pos1.line - pos2.line : pos1.ch - pos2.ch;
  }

  var marks = null;
  var lastSelection = null;

  function removeTextMarks(cm) {
    if (marks) {
      for(var i = 0; i < marks.length; ++i) {
        marks[i].clear();
      }
    }
    marks = null;
    lastSelection = null;
  }

  function markText(cm, start, end) {
    if (cmp(start, end) === 0)
      return;
    var opt = {className: "CodeMirror-selectedtext"};
    marks.push(cmp(start, end) <= 0 ? cm.markText(start, end, opt) : cm.markText(end, start, opt));
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

    lastSelection = {
      anchor: Pos(anchor.line, anchor.ch),
      head: Pos(head.line, head.ch),
      reversed: cmp(head, anchor) < 0
    };

    marks = [];
    coverRange(cm, anchor, head);
  }

  function incrementalCoverageUpdate(cm) {
    var anchor = cm.getCursor("anchor");
    var head = cm.getCursor("head");
    var reversed = cmp(head, anchor) < 0;
    // if the anchor of selection moved or selection changed direction - remove everything and construct from scratch.
    if (cmp(anchor, lastSelection.anchor) !== 0 || (reversed ^ lastSelection.reversed)) {
      removeTextMarks(cm);
      createInitialCoverage(cm);
      return;
    }
    // fast return if nothing changed
    if (cmp(head, lastSelection.head) === 0)
      return;

    // if only column changed then update last text mark
    if (head.line === lastSelection.head.line) {
      var lastMark = marks.pop();
      var position = lastMark.find();
      lastMark.clear();
      markText(cm, reversed ? position.to : position.from, head);
      lastSelection.head = head;
      lastSelection.reversed = reversed;
      return;
    }

    if (!reversed) {
      // if selection shrinks
      if (head.line < lastSelection.head.line) {
        var textMark,
          position;
        do {
          textMark = marks.pop();
          position = textMark.find();
          textMark.clear();
        } while (marks.length && position.from.line >= head.line);
        markText(cm, position.from, head);
      } else {
        var textMark = marks.pop();
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
          textMark = marks.pop();
          position = textMark.find();
          textMark.clear();
        } while (marks.length && position.to.line <= head.line);
        markText(cm, position.to, head);
      } else {
        var textMark = marks.pop();
        var position = textMark.find();
        coverRange(cm, position.to, head);
        textMark.clear();
      }
    }
    lastSelection.head = head;
    lastSelection.reversed = reversed;
  }

  function updateSelectedText(cm) {
    if (!cm.somethingSelected())
      return removeTextMarks(cm);

    if (!lastSelection)
      return createInitialCoverage(cm);

    incrementalCoverageUpdate(cm);
  }
})();
