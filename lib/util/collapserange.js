(function() {
  CodeMirror.defaults.collapseCode = false;
  CodeMirror.defineInitHook(function(cm) {
    if(cm.getOption("collapseCode")) cm.initCollapseCode(cm);
  });
  
  CodeMirror.defineExtension("initCollapseCode", function(cm) {
    cm.n = -1;
    cm.col = [];
    cm.oldmarker = "";
    if(typeof cm.guttters == 'undefined') cm.gutters = cm.getOption("gutters");
    var gutters = cm.gutters;
    for(var i = 0; i < gutters.length; i++) {
      if(gutters[i] == "CodeMirror-linenumbers") break;
    }
    gutters.splice(i + 1, 0, "collapse");
    // Why this is necessary I shall NEVER know!
    gutters = gutters.toString().split(",");
    cm.setOption("gutters", gutters);
    cm.on("gutterClick", function(cm, line) {
      cm.setGutterMarker(line, "collapse", cm.makeMarker(cm, line));	
    });
    // No CSS class "collapse" is provided, so set styling here and refresh.
    var g = cm.getGutterElement().childNodes;
    for(i = 0; i < g.length; i++) {
      if(/CodeMirror-linenumbers/.test(g[i].getAttribute("class"))) var linenumbers = g[i]; 
      if(/collapse/.test(g[i].getAttribute("class"))) var collapse = g[i]; 
    }
    var gutterBorder = getStyle(linenumbers, "borderRight", "border-right");
    linenumbers.style.borderRight = "none";
    collapse.style.width = "0.4em";
    collapse.style.color = getStyle(linenumbers, "color", "color");
    collapse.style.borderRight = gutterBorder || "1px solid black";
    cm.refresh();
  });
  
  CodeMirror.defineExtension("makeMarker", function(cm, line) {
    var dn = "<b>&#9660;</b>";
    var up = "<b>&#9650;</b>";
    var info = cm.lineInfo(line);
    var mark = info.gutterMarkers;
    if(line <= cm.n) {
      cm.setGutterMarker(cm.n, "collapse", null);
      var nn = cm.n;
      cm.n = -1;
      if(line == nn) return;
    }
    if(typeof mark == "undefined" || mark == null) {
      if(typeof cm.oldmarker.style != "undefined") cm.oldmarker.style.color = "";
      var marker = document.createElement("div");
      marker.style.marginLeft = "-2px";
      if(cm.n == -1) marker.style.color = "red";
      if(cm.n >= 0) {
        marker.innerHTML = up;
        var c = cm.markText({line:cm.n}, {line:line-1}, {collapsed:true});
        c.begin = cm.n;
        c.end = line;
        cm.col.push(c);
        c = null;
        cm.n = -1;
        cm.scrollIntoView({line:line - 1, ch:0});
      } else {
        marker.innerHTML = dn;
        cm.n = line;
      }
      cm.oldmarker = marker;
    } else {
      for(i = 0; i < cm.col.length; i++) {
        if(cm.col[i].begin == line ||cm.col[i].end == line) {
          cm.col[i].clear();
          cm.setGutterMarker(cm.col[i].begin, "collapse", null);
          cm.setGutterMarker(cm.col[i].end, "collapse", null);
          cm.col.splice(i, 1);
          break;
        }
      }
    }
    return marker;
  });
  
  function getStyle(elt, camelCase, hyphenated){
    if (elt.currentStyle) 
      return elt.currentStyle[camelCase];
    else if (document.defaultView && document.defaultView.getComputedStyle) 
      return document.defaultView.getComputedStyle(elt, null).getPropertyValue(hyphenated);
    else 
      return null;
  }
})();