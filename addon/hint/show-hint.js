CodeMirror.showHint = function(cm, getHints, options) {
  if (!options) options = {};
  
  function collectHints(previousToken) {
    // We want a single cursor position.
    if (cm.somethingSelected()) return;

    var token = cm.getTokenAt(cm.getCursor());

    // Don't show completions if token has changed
    if (previousToken != null &&
        (token.start != previousToken.start || token.type != previousToken.type))
      return;

    var result = getHints(cm, options);
    if (!result || !result.list.length) return;
    var completions = result.list;
    // When there is only one completion, use it directly.
    if (!previousToken && options.completeSingle !== false && completions.length == 1) {
      cm.replaceRange(completions[0], result.from, result.to);
      return true;
    }

    // Build the select widget
    var hints = document.createElement("ul"), selectedHint = 0;
    hints.className = "CodeMirror-hints";
    for (var i = 0; i < completions.length; ++i) {
      var elt = hints.appendChild(document.createElement("li"));
      elt.className = "CodeMirror-hint" + (i ? "" : " CodeMirror-hint-active");
      elt.appendChild(document.createTextNode(completions[i]));
      elt.hintId = i;
    }
    var pos = cm.cursorCoords(options.alignWithWord !== false ? result.from : null);
    hints.style.left = pos.left + "px";
    hints.style.top = pos.bottom + "px";
    document.body.appendChild(hints);

    // If we're at the edge of the screen, then we want the menu to appear on the left of the cursor.
    var winW = window.innerWidth || Math.max(document.body.offsetWidth, document.documentElement.offsetWidth);
    if (winW - pos.left < hints.clientWidth)
      hints.style.left = (pos.left - sel.clientWidth) + "px";

    function changeActive(i) {
      if (i < 0 || i >= completions.length || selectedHint == i) return;
      hints.childNodes[selectedHint].className = "CodeMirror-hint";
      var node = hints.childNodes[selectedHint = i];
      node.className = "CodeMirror-hint CodeMirror-hint-active";
      if (node.offsetTop < hints.scrollTop)
        hints.scrollTop = node.offsetTop - 3;
      else if (node.offsetTop + node.offsetHeight > hints.scrollTop + hints.clientHeight)
        hints.scrollTop = node.offsetTop + node.offsetHeight - hints.clientHeight + 3;
    }

    var ourMap = {
      Up: function() {changeActive(selectedHint - 1);},
      Down: function() {changeActive(selectedHint + 1);},
      Enter: pick,
      Tab: pick,
      Esc: close
    };
    if (options.customKeys) for (var key in options.customKeys) if (options.customKeys.hasOwnProperty(key)) {
      var val = options.customKeys[key];
      if (/^(Up|Down|Enter|Esc)$/.test(key)) val = ourMap[val];
      ourMap[key] = val;
    }

    cm.addKeyMap(ourMap);
    cm.on("cursorActivity", cursorActivity);
    CodeMirror.on(hints, "dblclick", function(e) {
      var t = e.target || e.srcElement;
      if (t.hintId != null) {selectedHint = t.hintId; pick();}
      setTimeout(function(){cm.focus();}, 20);
    });
    CodeMirror.on(hints, "click", function(e) {
      var t = e.target || e.srcElement;
      if (t.hintId != null) changeActive(t.hintId);
      setTimeout(function(){cm.focus();}, 20);
    });

    var done = false, once;
    function close() {
      if (done) return;
      done = true;
      clearTimeout(once);
      hints.parentNode.removeChild(hints);
      cm.removeKeyMap(ourMap);
      cm.off("cursorActivity", cursorActivity);
    }
    function pick() {
      cm.replaceRange(completions[selectedHint], result.from, result.to);
      close();
    }
    var once;
    function cursorActivity() {
      clearTimeout(once);
      once = setTimeout(function(){close(); collectHints(token);}, 70);
    }
    return true;
  }
  return collectHints();
};
