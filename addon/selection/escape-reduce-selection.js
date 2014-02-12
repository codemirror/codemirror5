// Because sometimes you need to reduce your selections to only a single selection
//
// Adds an option 'escapeReducesSelections' which, when enabled, gives
// users the ability to press escape to unselect all selections
// but the one highest in the document

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";
  CodeMirror.defineOption("escapeReducesSelections", false, function(cm) {
    var lastBlurTime = 0;
    cm.on("blur", function(){
      lastBlurTime = new Date();
    });
    document.addEventListener('keyup', function(event) {
      // Check if key was the Escape key
      if (event.keyCode === 27)
        // Check if this CodeMirror instance was blurred by this escape
        if(new Date() - lastBlurTime < 500) {
          // Use the most original selection as the default selection
          var range = cm.listSelections()[0];
          cm.setSelection(range.anchor, range.head);
          cm.focus();
        }
    });
  });
});