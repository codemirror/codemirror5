// A number of extra keybindings for multiple-selection handling
// Depends on addon/search/searchcursor.js and optionally addon/dialog/dialogs.js

(function() {
  "use strict";

  var pc = CodeMirror.keyMap.pcDefault, mac = CodeMirror.keyMap.macDefault;
  var Pos = CodeMirror.Pos;

  function dialog(cm, text, shortText, f) {
    if (cm.openDialog) cm.openDialog(text, f);
    else f(prompt(shortText, ""));
  }

  // Split selection
  pc["Shift-Ctrl-L"] = mac["Shift-Cmd-L"] = function(cm) {
    var ranges = [], from = cm.getCursor("from"), to = cm.getCursor("to");
    for (var line = from.line; line <= to.line; ++line)
      ranges.push({anchor: line == from.line ? from : Pos(line, 0),
                   head: line == to.line ? to : Pos(line)});
    cm.setSelections(ranges, 0);
  };

  // Add next occurrence to selection
  pc["Ctrl-D"] = mac["Cmd-D"] = function(cm) {
    var at = cm.getCursor("to");
    var cur = cm.getSearchCursor(cm.getRange(cm.getCursor("from"), at), at);
    if (!cur.findNext()) return;
    cm.addSelection(cur.from(), cur.to());
  };

  // Go to a single selection
  pc["Alt-Esc"] = mac["Alt-Esc"] = function(cm) {
    cm.setSelection(cm.getCursor("anchor"), cm.getCursor("head"));
  };

  // Select matching parts of current selection
  var dialogText = 'Match: <input type="text" style="width: 10em"/> <span style="color: #888">(Use /re/ syntax for regexp)</span>';
  pc["Alt-F"] = mac["Alt-F"] = function(cm) {
    if (!cm.somethingSelected()) return;
    dialog(cm, dialogText, "Match:", function(query) {
      var isRE = query.match(/^\/(.*)\/([a-z]*)$/);
      if (isRE) query = new RegExp(isRE[1], isRE[2].indexOf("i") == -1 ? "" : "i");
      cm.selectMatches(query);
    });
  };
})();
