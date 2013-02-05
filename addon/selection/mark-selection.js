// Because sometimes you need to mark the selected *text*.
// Use by attaching the following function call to the cursorActivity event:
  //myCodeMirror.markSelection();
// To clear the selection mark, run:
  //myCodeMirror.markSelection.clear(myCodeMirror);
// The selection will be marked with `.CodeMirror-selection`.
"use strict";

(function() {
  function lessthan(a, b) {
    if (a.line < b.line) return true;
    if (a.line == b.line) return a.ch < b.ch;
  }

  function clear(cm) {
    if (cm._selectionMark) cm._selectionMark.clear();
  }
  
  function markSelection(minChars, className) {
    var cm = this;
    clear(cm);
    if (!cm.somethingSelected()) return;
    
    var start = cm.getCursor('anchor')
      , end   = cm.getCursor();
    
    if (lessthan(end, start)) {
      var i = end;
      end = start;
      start = i;
    }
    
    cm._selectionMark = cm.markText(start, end, {className:'CodeMirror-selection'});
  }
  
  markSelection.clear = clear;
  CodeMirror.defineExtension("markSelection", markSelection);
})();
