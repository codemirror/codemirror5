// Because sometimes you need to style the cursor's line.
//
// Adds an option 'styleActiveLine' which, when enabled, gives the
// active line's wrapping <div> the CSS class "CodeMirror-activeline",
// and gives its background <div> the class "CodeMirror-activeline-background".

(function() {
  "use strict";
  var WRAP_CLASS = "CodeMirror-activeline";
  var BACK_CLASS = "CodeMirror-activeline-background";

  CodeMirror.defineOption("styleActiveLine", false, function(cm, val, old) {
    var prev = old && old != CodeMirror.Init;
    if (val && !prev) {
      updateActiveLine(cm, cm.getCursor().line);
      cm.on("beforeSelectionChange", selectionChange);
    } else if (!val && prev) {
      cm.off("beforeSelectionChange", selectionChange);
      clearActiveLine(cm);
      delete cm.state.activeLine;
    }
  });

  function clearActiveLine(cm) {
    if ("activeLine" in cm.state) {
      cm.removeLineClass(cm.state.activeLine, "wrap", WRAP_CLASS);
      cm.removeLineClass(cm.state.activeLine, "background", BACK_CLASS);
    }
  }

  function updateActiveLine(cm, selectedLine) {
    var line = cm.getLineHandleVisualStart(selectedLine);
    if (cm.state.activeLine == line) return;
    cm.operation(function() {
      clearActiveLine(cm);
      cm.addLineClass(line, "wrap", WRAP_CLASS);
      cm.addLineClass(line, "background", BACK_CLASS);
      cm.state.activeLine = line;
    });
  }

  function selectionChange(cm, sel) {
    updateActiveLine(cm, sel.head.line);
  }
})();
