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
      delete cm.state.activeLines;
    }
  });

  function clearActiveLine(cm) {
    if ("activeLines" in cm.state) {
      for(var i = 0; i < cm.state.activeLines.length; i++) {
        cm.removeLineClass(cm.state.activeLines[i], "wrap", WRAP_CLASS);
        cm.removeLineClass(cm.state.activeLines[i], "background", BACK_CLASS);
      }
    }
  }

  function updateActiveLine(cm) {
    clearActiveLine(cm);
    cm.state.activeLines = [];
    cm.eachSelection(function(sel) {
      var line;
      for (var i = sel.from.line; i <= sel.to.line; i++) {
        line = cm.getLineHandle(i);
        if (!Array.prototype.indexOf || -1 == cm.state.activeLines.indexOf(line)){
          cm.addLineClass(line, "wrap", WRAP_CLASS);
          cm.addLineClass(line, "background", BACK_CLASS);
          cm.state.activeLines.push(line);
        }
      }
    });
  }
})();
