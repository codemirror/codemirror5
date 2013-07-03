(function() {
  "use strict";

  CodeMirror.defineOption("matchTags", false, function(cm, val, old) {
    if (old && old != CodeMirror.Init) {
      cm.off("cursorActivity", doMatchTags);
      cm.off("viewportChange", maybeUpdateMatch);
      clear(cm);
    }
    if (val) {
      cm.on("cursorActivity", doMatchTags);
      cm.on("viewportChange", maybeUpdateMatch);
      doMatchTags(cm);
    }
  });

  function clear(cm) {
    if (cm.state.tagHit) cm.state.tagHit.clear();
    if (cm.state.tagOther) cm.state.tagOther.clear();
    cm.state.tagHit = null; cm.state.tagOther = null;    
  }

  function doMatchTags(cm) {
    cm.operation(function() {
      clear(cm);
      var cur = cm.getCursor(), range = cm.getViewport();
      range.from = Math.min(range.from, cur.line); range.to = Math.max(cur.line + 1, range.to);
      var match = CodeMirror.findMatchingTag(cm, cur, range);

      if(match)
      {
        var hit = match.at == "open" ? match.open : match.close;
        if(hit)cm.state.tagHit = cm.markText(hit.from, hit.to, {className: "CodeMirror-matchingtag"});

        var other = match.at == "close" ? match.open : match.close;
        if (cm.state.findOtherTag = !other) return;
        cm.state.tagOther = cm.markText(other.from, other.to, {className: "CodeMirror-matchingtag"});
      } else {
        cm.state.findOtherTag = false;
      }

    });
  }

  function maybeUpdateMatch(cm) {
    if (cm.state.findOtherTag) doMatchTags(cm);
  }

  CodeMirror.commands.toMatchingTag = function(cm) {
    var found = CodeMirror.findMatchingTag(cm, cm.getCursor());
    if (found) {
      var other = found.at == "close" ? found.open : found.close;
      cm.setSelection(other.to, other.from);
    }
  };
})();
