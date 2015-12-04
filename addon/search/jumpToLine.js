// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// Define search commands. Depends on dialog.js or another
// implementation of the openDialog method.

// Replace works a little oddly -- it will do the replace on the next
// Ctrl-G (or whatever is bound to findNext) press. You prevent a
// replace by making sure the match is no longer selected when hitting
// Ctrl-G.

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("./searchcursor"), require("../dialog/dialog"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "./searchcursor", "../dialog/dialog"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  function dialog(cm, text, shortText, deflt, f) {
    if (cm.openDialog) cm.openDialog(text, f, {value: deflt, selectValueOnOpen: true});
    else f(prompt(shortText, deflt));
  }

  var jumpDialog =
    'Jump to line: <input type="text" style="width: 10em" class="CodeMirror-search-field"/> <span style="color: #888" class="CodeMirror-search-hint">(Use line:column or scroll% syntax)</span>';

  function jumpToLine(cm) {
    var cur = cm.getCursor();
     dialog(cm, jumpDialog, 'Jump to line:', (cur.line+1)+':'+(cur.ch+1), function(posStr) {
      if (!posStr) return;

      var clnMatch = /^\s*([\+\-]?\d+)\s*\:\s*(\d+)\s*$/.exec(posStr);
      var prcMatch = /^\s*([\+\-]?\d+(\.\d+))\%\s*/.exec(posStr);
      var lnMatch = /^\s*\:?\s*([\+\-]?\d+)\s*/.exec(posStr);
      if (clnMatch) {
        try {
          var line = parseInt(clnMatch[1]);
          var ch = parseInt(clnMatch[2]);
          if ('+-'.indexOf(clnMatch[1].charAt(0))>=0)
            line = cur.line+line+1;
        }
        catch (error) { return; }
        cm.setCursor(line-1, ch-1);
      }
      else if (prcMatch) {
        try {
          var prc = parseFloat(prcMatch[1]);
          var line = cm.lineCount()*prc/100;
          if ('+-'.indexOf(prcMatch[1].charAt(0))>=0)
            line = cur.line+line+1;
        }
        catch (error) { return; }
        cm.setCursor(line-1, cur.ch);
      }
      else if (lnMatch) {
        try {
          var line = parseInt(lnMatch[1]);
          if ('+-'.indexOf(lnMatch[1].charAt(0))>=0)
            line = cur.line+line+1;
        }
        catch (error) { return; }
        cm.setCursor(line-1, cur.ch);
      }
     })
  }

  CodeMirror.commands.jumpToLine = jumpToLine;
  CodeMirror.keyMap.default["Alt-G"] = "jumpToLine";
});
