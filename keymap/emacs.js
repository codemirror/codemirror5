// TODO number prefixes
(function() {
  // Really primitive kill-ring implementation.
  var killRing = [];
  function addToRing(str) {
    killRing.push(str);
    if (killRing.length > 50) killRing.shift();
  }
  function getFromRing() { return killRing[killRing.length - 1] || ""; }
  function popFromRing() { if (killRing.length > 1) killRing.pop(); return getFromRing(); }

  CodeMirror.keyMap.emacs = {
    "Ctrl-X": function(cm) {cm.setOption("keyMap", "emacs-Ctrl-X");},
    "Ctrl-W": function(cm) {addToRing(cm.getSelection()); cm.replaceSelection("");},
    "Ctrl-Alt-W": function(cm) {addToRing(cm.getSelection()); cm.replaceSelection("");},
    "Alt-W": function(cm) {addToRing(cm.getSelection());},
    "Ctrl-Y": function(cm) {cm.replaceSelection(getFromRing());},
    "Alt-Y": function(cm) {cm.replaceSelection(popFromRing());},
    "Ctrl-/": "undo", "Shift-Ctrl--": "undo", "Shift-Alt-,": "goDocStart", "Shift-Alt-.": "goDocEnd",
    "Ctrl-S": "findNext", "Ctrl-R": "findPrev", "Ctrl-G": "clearSearch", "Shift-Alt-5": "replace",
    "Ctrl-Z": "undo", "Cmd-Z": "undo",
    fallthrough: ["basic", "emacsy"]
  };

  CodeMirror.keyMap["emacs-Ctrl-X"] = {
    "Ctrl-S": "save", "Ctrl-W": "save", "S": "saveAll", "F": "open", "U": "undo", "K": "close",
    auto: "emacs", catchall: function(cm) {/*ignore*/}
  };
})();
