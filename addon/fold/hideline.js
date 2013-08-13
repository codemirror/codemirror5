(function() {
  "use strict";

  function doHide(cm, start, end, options) {
    var opt = options || {};
    opt['collapsed'] = true;
    (cm.state.hiddenLines = cm.state.hiddenLines || []).push({from: start, to: end});
    return cm.markText(CodeMirror.Pos(start - 1), CodeMirror.Pos(end), opt);
  }

  function getHiddenRegion(cm, line) {
    var hiddenLines = cm.state.hiddenLines;
    if (!hiddenLines) return null;
    for (var i = 0; i < hiddenLines.length; i++) {
      if (hiddenLines[i].from <= line && line <= hiddenLines[i].to) {
        return hiddenLines[i];
      }
    }
    return null;
  }

  function doShow(cm, marker) {
    var hiddenLines = cm.state.hiddenLines;
    if (!hiddenLines) return;
    var region = marker.find();
    marker.clear();
    for (var i = 0; i < hiddenLines.length; i++) {
      if (hiddenLines[i].from == region.from.line && hiddenLines[i].to == region.to.line) {
        hiddenLines.splice(i, 1);
        break;
      }
    }
  }

  CodeMirror.defineExtension("hideLine", function(start, end, options) { return doHide(this, start, end, options); });
  CodeMirror.defineExtension("showLine", function(marker) { doShow(this, marker); });
  CodeMirror.defineExtension("getHiddenRegion", function(line) { return getHiddenRegion(this, line); });
  CodeMirror.defineExtension("hasHiddenLines", function() { return this.state.hasOwnProperty('hiddenLines'); });
})();