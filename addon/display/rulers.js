(function() {
  "use strict";

  CodeMirror.defineOption("rulers", false, function(cm, val, old) {
    if (old && old != CodeMirror.Init) {
      clearRulers(cm);
      cm.off("refresh", refreshRulers);
    }
    if (val && val.length) {
      setRulers(cm);
      cm.on("refresh", refreshRulers);
    }
  });

  function clearRulers(cm) {
    for (var i = cm.display.lineSpace.childNodes.length - 1; i >= 0; i--) {
      var node = cm.display.lineSpace.childNodes[i];
      if (/(^|\s)CodeMirror-ruler($|\s)/.test(node.className))
        node.parentNode.removeChild(node);
    }
  }

  function setRulers(cm) {
    var val = cm.getOption("rulers");
    var cw = cm.defaultCharWidth();
    var left = cm.charCoords(CodeMirror.Pos(cm.firstLine(), 0), "div").left;
    var bot = -cm.display.scroller.offsetHeight;
    for (var i = 0; i < val.length; i++) {
      var elt = document.createElement("div");
      var col, cls = null;
      if (typeof val[i] == "number") {
        col = val[i];
      } else {
        col = val[i].column;
        cls = val[i].className;
      }
      elt.className = "CodeMirror-ruler" + (cls ? " " + cls : "");
      elt.style.cssText = "left: " + (left + col * cw) + "px; top: -50px; bottom: " + bot + "px";
      cm.display.lineSpace.insertBefore(elt, cm.display.cursorDiv);
    }
  }

  function refreshRulers(cm) {
    clearRulers(cm);
    setRulers(cm);
  }
})();
