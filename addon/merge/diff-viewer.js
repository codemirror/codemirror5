(function(mod) {
  if (typeof exports == "object" && typeof module == "object") { // CommonJS
    mod(require("../../lib/codemirror"));
    mod(require("./merge"));
  }
  else if (typeof define == "function" && define.amd) { // AMD
    define(["../../lib/codemirror"], mod);
    define(["./merge"], mod);
  }
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  CodeMirror.diff_viewer = {};
  CodeMirror.diff_viewer.instance = {};
  CodeMirror.diff_viewer.diff = function(
      diff_container,
      leftText,
      rightText) {
    if(document
        .getElementsByClassName(diff_container)[0]
        .children.length > 0)  {
      CodeMirror
        .diff_viewer
        .instance[diff_container]
        .editor().setValue(leftText);
      CodeMirror
        .diff_viewer
        .instance[diff_container]
        .rightOriginal().getDoc().setValue(rightText);
    }
    else {
      var diff_view_instance = CodeMirror.MergeView(
        document.getElementsByClassName(diff_container)[0], {
          value: leftText,
          readOnly: true,
          origLeft: null,
          orig: rightText,
          lineNumbers: true,
          highlightDifferences: true,
          connect: null,
          mode:"text",
          collapseIdentical: false
        }
      );
      CodeMirror.diff_viewer.instance[diff_container] = diff_view_instance;
    }

    CodeMirror.diff_viewer.refresh(diff_container);
  };

  CodeMirror.diff_viewer.refresh = function (instance) {
    setTimeout(function() {
      CodeMirror.diff_viewer.instance[instance].edit.refresh();
      CodeMirror.diff_viewer.instance[instance].right.orig.refresh();
    }, 200);
  };

});
