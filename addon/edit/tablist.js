// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  CodeMirror.commands.tabAndIndentMarkdownList = function(cm) {
    var ranges = cm.listSelections();
      var pos = ranges[0].head;
      var eolState = cm.getStateAfter(pos.line);
      var inList = eolState.list !== false;

      if (inList) {
        cm.execCommand('indentMore');
        return;
      }

      if(cm.options.indentWithTabs){
        cm.execCommand('insertTab');
      }
      else{
        var spaces = Array(cm.options.tabSize + 1).join(" ");
        cm.replaceSelection(spaces);
      }
  };

  CodeMirror.commands.shiftTabAndUnindentMarkdownList = function(cm) {
    var ranges = cm.listSelections();
    var pos = ranges[0].head;
    var eolState = cm.getStateAfter(pos.line);
    var inList = eolState.list !== false;

    if (inList) {
      cm.execCommand('indentLess');
      return;
    }

    if(cm.options.indentWithTabs){
      cm.execCommand('insertTab');
    }
    else{
      var spaces = Array(cm.options.tabSize + 1).join(" ");
      cm.replaceSelection(spaces);
    }
  };
});
