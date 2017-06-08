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

  var Pos = CodeMirror.Pos;
  var listTokenRE = /^(\s*)(>[> ]*|[*+-] \[[x ]\]|[*+-]|(\d+)[.)])(\s*)$/;

  function matchListToken(pos, cm) {
    /* Get some info about the current state */
    var eolState = cm.getStateAfter(pos.line);
    var inList = eolState.list !== false;
    var inQuote = eolState.quote !== 0;

    /* Get the line from the start to where the cursor currently is */
    var lineStart = cm.getRange(Pos(pos.line, 0), pos);

    /* Matches the beginning of the list line with the list token RE */
    var match = listTokenRE.exec(lineStart);

    /* Not being in a list, or being in a list but not right after the list
     * token, are both not considered a match */
    if ((!inList && !inQuote) || !match)
      return false
    else
      return true
  }

  CodeMirror.commands.autoIndentMarkdownList = function(cm) {
    if (cm.getOption("disableInput")) return CodeMirror.Pass;
    var ranges = cm.listSelections();
    for (var i = 0; i < ranges.length; i++) {
      var pos = ranges[i].head;

      if (!ranges[i].empty() || !matchListToken(pos, cm)) {
        /* If no match, call regular Tab handler */
        cm.execCommand("defaultTab");
        return;
      }

      /* Select the whole list line and indent it by one unit */
      cm.indentLine(pos.line, "add");
    }
  };

  CodeMirror.commands.autoUnindentMarkdownList = function(cm) {
    if (cm.getOption("disableInput")) return CodeMirror.Pass;
    var ranges = cm.listSelections();
    for (var i = 0; i < ranges.length; i++) {
      var pos = ranges[i].head;

      if (!ranges[i].empty() || !matchListToken(pos, cm)) {
        /* If no match, call regular Shift-Tab handler */
        cm.execCommand("indentAuto");
        return;
      }

      /* Select the whole list line and unindent it by one unit */
      cm.indentLine(pos.line, "subtract");
    }
  };
});
