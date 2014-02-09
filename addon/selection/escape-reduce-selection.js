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
    cm.on("blur", function(event){
      lastBlurTime = new Date();
    });
    document.addEventListener('keyup', function(event) {
      // Check if key was the Escape key
      if (event.keyCode === 27)
        // Check if this CodeMirror instance was blurred by this escape
        if(new Date() - lastBlurTime < 500) {
          // Use the top most selection as the only selection
          var top = null,
              ranges = cm.doc.sel.ranges,
              length = ranges.length,
              range, i;
          // Return if there were no selections
          if (length === 0) return;

          for (i = 0; i < length; i++) {
            range = ranges[i];
            // Set top if top doesn't exists, top-most line, or first most character
            if ((top == null) || (top.anchor.line > range.anchor.line)
              || ((top.anchor.line === range.anchor.line) && (top.anchor.ch > range.anchor.ch))) {
              top = range;
            }
          }

          // Set selection to the top selection
          cm.setSelection(top.anchor, top.head);
          cm.refresh();
          cm.focus();
        }
    });
  });
});