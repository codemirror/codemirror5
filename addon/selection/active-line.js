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
      updateActiveLine(cm);
      cm.on("cursorActivity", updateActiveLine);
    } else if (!val && prev) {
      cm.off("cursorActivity", updateActiveLine);
      clearActiveLine(cm);
      delete cm._activeLine;
    }
  });
  
  function clearActiveLine(cm) {
    if ("_activeLine" in cm) {
      cm.removeLineClass(cm._activeLine, "wrap", WRAP_CLASS);
      cm.removeLineClass(cm._activeLine, "background", BACK_CLASS);
    }
  }

  function updateActiveLine(cm) {
    var line = cm.getLineHandle(cm.getCursor().line);
    if (cm._activeLine == line) return;
    clearActiveLine(cm);
    cm.addLineClass(line, "wrap", WRAP_CLASS);
    cm.addLineClass(line, "background", BACK_CLASS);
    cm._activeLine = line;
  }
})();
