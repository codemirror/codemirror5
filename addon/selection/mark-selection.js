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
      clearSelectedText(cm);
      delete cm._selectionMark;
    }
  });

  function clearSelectedText(cm) {
    if (cm._selectionMark) cm._selectionMark.clear();
  }

  function updateSelectedText(cm) {
    clearSelectedText(cm);

    if (cm.somethingSelected())
      cm._selectionMark = cm.markText(cm.getCursor("start"), cm.getCursor("end"),
                                      {className: "CodeMirror-selectedtext"});
    else
      cm._selectionMark = null;
  }
})();
