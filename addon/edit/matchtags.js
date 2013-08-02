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
      var markers = [];
      cm.withSelection(function() {
        var cur = cm.getCursor();
        var match = CodeMirror.findMatchingTag(cm, cur) || CodeMirror.findEnclosingTag(cm, cur);
        if (!match) return;
        markers.push(cm.markText(match.open.from, match.open.to, {className: "CodeMirror-matchingbracket"}));
        markers.push(cm.markText(match.close.from, match.close.to, {className: "CodeMirror-matchingbracket"}));
      });
      cm.state.matchedTags = function() { for (var i = 0; i < markers.length; i++) markers[i].clear(); };
    });
  }

  CodeMirror.commands.toMatchingTag = function(cm) {
    cm.withSelection(function() {
      var found = CodeMirror.findMatchingTag(cm, cm.getCursor());
      if (found) {
        var other = found.at == "close" ? found.open : found.close;
        cm.setSelection(other.to, other.from);
      }
    });
  };
})();
