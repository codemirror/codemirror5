(function() {
  "use strict";

  function doFold(cm, pos, options) {
    var finder = options && (options.call ? options : options.rangeFinder);
    if (!finder) finder = cm.getHelper(pos, "fold");
    if (!finder) return;
    if (typeof pos == "number") pos = CodeMirror.Pos(pos, 0);
    var minSize = options && options.minFoldSize || 0;

    function getRange(allowFolded) {
      var range = finder(cm, pos);
      if (!range || range.to.line - range.from.line < minSize) return null;
      var marks = cm.findMarksAt(range.from);
      for (var i = 0; i < marks.length; ++i) {
        if (marks[i].__isFold) {
          if (!allowFolded) return null;
          range.cleared = true;
          var found = marks[i].find();
          marks[i].clear();
          CodeMirror.signal(cm, "unfold", cm, found.from, found.to);
        }
      }
      return range;
    }

    var range = getRange(true);
    if (options && options.scanUp) while (!range && pos.line > cm.firstLine()) {
      pos = CodeMirror.Pos(pos.line - 1, 0);
      range = getRange(false);
    }
    if (!range || range.cleared) return;

    var myWidget = makeWidget(options);
    CodeMirror.on(myWidget, "mousedown", function() {myRange.doc.cm.foldCode(myRange.find().from);});
    var myRange = cm.markText(range.from, range.to, {
      replacedWith: myWidget,
      clearOnEnter: true,
      __isFold: true
    });
    CodeMirror.signal(cm, "fold", cm, range.from, range.to);
  }

  function makeWidget(options) {
    var widget = (options && options.widget) || "\u2194";
    if (typeof widget == "string") {
      var text = document.createTextNode(widget);
      widget = document.createElement("span");
      widget.appendChild(text);
      widget.className = "CodeMirror-foldmarker";
    }
    return widget;
  }

  // Clumsy backwards-compatible interface
  CodeMirror.newFoldFunction = function(rangeFinder, widget) {
    return function(cm, pos) { doFold(cm, pos, {rangeFinder: rangeFinder, widget: widget}); };
  };

  // New-style interface
  CodeMirror.defineExtension("foldCode", function(pos, options) { doFold(this, pos, options); });

  CodeMirror.registerHelper("fold", "combine", function() {
    var funcs = Array.prototype.slice.call(arguments, 0);
    return function(cm, start) {
      for (var i = 0; i < funcs.length; ++i) {
        var found = funcs[i](cm, start);
        if (found) return found;
      }
    };
  });
})();
