(function() {
  "use strict";

  CodeMirror.defineOption("matchTags", false, function(cm, val, old) {
    if (old && old != CodeMirror.Init)
      cm.off("cursorActivity", doMatchTags);
    if (val)
      cm.on("cursorActivity", doMatchTags);
  });

  function doMatchTags(cm) {
    cm.operation(function() {
      if (cm.state.matchedTags) { cm.state.matchedTags(); cm.state.matchedTags = null; }

      var cur = cm.getCursor();
      var match = CodeMirror.findMatchingTag(cm, cur) || CodeMirror.findEnclosingTag(cm, cur);
      if (!match) return;
      var one = cm.markText(match.open.from, match.open.to, {className: "CodeMirror-matchingbracket"});
      var two = cm.markText(match.close.from, match.close.to, {className: "CodeMirror-matchingbracket"});
      cm.state.matchedTags = function() { one.clear(); two.clear(); };
    });
  }

  CodeMirror.commands.toMatchingTag = function(cm) {
    var found = CodeMirror.findMatchingTag(cm, cm.getCursor());
    if (found) {
      var other = found.at == "close" ? found.open : found.close;
      cm.setSelection(other.to, other.from);
    }
  };
})();
