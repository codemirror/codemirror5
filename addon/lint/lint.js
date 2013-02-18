CodeMirror.validate = function(cm, getAnnotations, options) {
  if (!options)
    options = {};

  var GUTTER_ID = "CodeMirror-lint-markers";
  var SEVERITIES = /^(?:error|warning)$/;

  var tooltip = function() {
    var tt;
    return {
      show: function(nodes, e) {
	if (tt == null) {
	  tt = document.createElement("div");
	  tt.className = "CodeMirror-lint-tooltip";
	  document.body.appendChild(tt);
          CodeMirror.on(document, "mousemove", this.pos);
          this.pos(e);
	}
	tt.style.display = "block";
        tt.appendChild(nodes);
        this.fade(true);
      },
      pos: function(e) {
        if (tt.style.display == "none") return;

        var u = event.pageY, l = event.pageX;
        if (u == null) {
          u = event.clientY + document.documentElement.scrollTop;
          l = event.clientX + document.documentElement.scrollLeft;
        }
	tt.style.top = (u - tt.offsetHeight - 5) + "px";
	tt.style.left = (l + 5) + "px";
      },
      fade: function(show) {
        if (!show) setTimeout(function() {
          if (tt.style.opacity == "0") tt.style.display = "none";
        }, 600);
        else tt.style.display = "";
        tt.style.opacity = show ? 1 : 0;
      },
      hide: function() { this.fade(false); }
    };
  }();

  function LintState() {
    this.marked = [];
  }
  function getLintState(cm) {
    return cm._lintState || (cm._lintState = new LintState());
  }

  function clearMarks(cm, state) {
    if (options.gutterMarkers) cm.clearGutter(GUTTER_ID);
    for (var i = 0; i < state.marked.length; ++i)
      state.marked[i].clear();
    state.marked.length = 0;
  }

  function makeMarker(labels, severity) {
    var marker = document.createElement("div");
    marker.className = "CodeMirror-lint-marker-" + severity;

    CodeMirror.on(marker, "mouseover", function(e) {
      tooltip.show(labels, e);
    });
    CodeMirror.on(marker, "mouseout", function(e) {
      tooltip.hide();
    });

    return marker;
  }

  function getMaxSeverity(a, b) {
    if (a == "error") return a;
    else return b;
  }

  function groupByLine(annotations) {
    var lines = [];
    for (var i = 0; i < annotations.length; ++i) {
      var ann = annotations[i], line = ann.from.line;
      (lines[line] || (lines[line] = [])).push(ann);
    }
    return lines;
  }

  function markDocument(cm) {
    var state = getLintState(cm);
    clearMarks(cm, state);

    var annotations = groupByLine(getAnnotations(cm));

    for (var line = 0; line < annotations.length; ++line) {
      var anns = annotations[line];
      if (!anns) continue;

      var maxSeverity = null, tipLabel = document.createDocumentFragment();

      for (var i = 0; i < anns.length; ++i) {
        var ann = anns[i];
        var severity = ann.severity;
        if (!SEVERITIES.test(severity)) severity = "error";
        maxSeverity = getMaxSeverity(maxSeverity, severity);

	if (options.formatAnnotation) ann = options.formatAnnotation(ann);

        var label = document.createElement("div");
        label.className = "CodeMirror-hint-message-" + severity;
        label.appendChild(document.createTextNode(ann.message));
        tipLabel.appendChild(label);

        if (ann.to) state.marked.push(cm.markText(ann.from, ann.to, {
          className: "CodeMirror-lint CodeMirror-lint-" + severity
        }));
      }

      if (options.gutterMarkers !== false)
        cm.setGutterMarker(i, GUTTER_ID, makeMarker(tipLabel, maxSeverity));
    }
  }

  return markDocument(cm);
};
