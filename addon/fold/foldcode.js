CodeMirror.newFoldFunction = function(rangeFinder, widget) {
  if (widget == null) widget = "\u2194";
  if (typeof widget == "string") {
    var text = document.createTextNode(widget);
    widget = document.createElement("span");
    widget.appendChild(text);
    widget.className = "CodeMirror-foldmarker";
  }

  return function(cm, pos) {
    if (typeof pos == "number") pos = CodeMirror.Pos(pos, 0);
    var range = rangeFinder(cm, pos);
    if (!range) return;

    var present = cm.findMarksAt(range.from), cleared = 0;
    for (var i = 0; i < present.length; ++i) {
      if (present[i].__isFold) {
        ++cleared;
        present[i].clear();
      }
    }
    if (cleared) return;

    var myWidget = widget.cloneNode(true);
    CodeMirror.on(myWidget, "mousedown", function() {myRange.clear();});
    var myRange = cm.markText(range.from, range.to, {
      replacedWith: myWidget,
      clearOnEnter: true,
      __isFold: true
    });
  };
};
