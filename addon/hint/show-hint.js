CodeMirror.showHint = function(cm, getHints, options) {
  if (!options) options = {};
  var startCh = cm.getCursor().ch, continued = false;
  var closeOn = options.closeCharacters || /[\s()\[\]{};:>]/;

  function startHinting() {
    // We want a single cursor position.
    if (cm.somethingSelected()) return;

    if (options.async)
      getHints(cm, showHints, options);
    else
      return showHints(getHints(cm, options));
  }

  function getText(completion) {
    if (typeof completion == "string") return completion;
    else return completion.text;
  }

  function pickCompletion(cm, data, completion) {
    if (completion.hint) completion.hint(cm, data, completion);
    else cm.replaceRange(getText(completion), data.from, data.to);
  }

  function buildKeyMap(options, handle) {
    var baseMap = {
      Up: function() {handle.moveFocus(-1);},
      Down: function() {handle.moveFocus(1);},
      PageUp: function() {handle.moveFocus(-handle.menuSize());},
      PageDown: function() {handle.moveFocus(handle.menuSize());},
      Home: function() {handle.setFocus(0);},
      End: function() {handle.setFocus(handle.length);},
      Enter: handle.pick,
      Tab: handle.pick,
      Esc: handle.close
    };
    var ourMap = options.customKeys ? {} : baseMap;
    function addBinding(key, val) {
      var bound;
      if (typeof val != "string")
        bound = function(cm) { return val(cm, handle); };
      // This mechanism is deprecated
      else if (baseMap.hasOwnProperty(val))
        bound = baseMap[val];
      else
        bound = val;
      ourMap[key] = bound;
    }
    if (options.customKeys)
      for (var key in options.customKeys) if (options.customKeys.hasOwnProperty(key))
        addBinding(key, options.customKeys[key]);
    if (options.extraKeys)
      for (var key in options.extraKeys) if (options.extraKeys.hasOwnProperty(key))
        addBinding(key, options.extraKeys[key]);
    return ourMap;
  }

  function showHints(data) {
    if (!data || !data.list.length) {
      if (continued) {
        cm.state.completionActive = false;
        CodeMirror.signal(data, "close");
      }
      return;
    }

    var completions = data.list;
    if (!continued && options.completeSingle != false && completions.length == 1) {
      pickCompletion(cm, data, completions[0]);
      return true;
    }

    // Build the select widget
    var hints = document.createElement("ul"), selectedHint = 0;
    hints.className = "CodeMirror-hints";
    for (var i = 0; i < completions.length; ++i) {
      var elt = hints.appendChild(document.createElement("li")), completion = completions[i];
      var className = "CodeMirror-hint" + (i ? "" : " CodeMirror-hint-active");
      if (completion.className != null) className = completion.className + " " + className;
      elt.className = className;
      if (completion.render) completion.render(elt, data, completion);
      else elt.appendChild(document.createTextNode(completion.displayText || getText(completion)));
      elt.hintId = i;
    }
    var pos = cm.cursorCoords(options.alignWithWord !== false ? data.from : null);
    var left = pos.left, top = pos.bottom, below = true;
    hints.style.left = left + "px";
    hints.style.top = top + "px";
    (options.container || document.body).appendChild(hints);
    CodeMirror.signal(data, "shown");

    // If we're at the edge of the screen, then we want the menu to appear on the left of the cursor.
    var winW = window.innerWidth || Math.max(document.body.offsetWidth, document.documentElement.offsetWidth);
    var winH = window.innerHeight || Math.max(document.body.offsetHeight, document.documentElement.offsetHeight);
    var box = hints.getBoundingClientRect();
    var overlapX = box.right - winW, overlapY = box.bottom - winH;
    if (overlapX > 0) {
      if (box.right - box.left > winW) {
        hints.style.width = (winW - 5) + "px";
        overlapX -= (box.right - box.left) - winW;
      }
      hints.style.left = (left = pos.left - overlapX) + "px";
    }
    if (overlapY > 0) {
      var height = box.bottom - box.top;
      if (box.top - (pos.bottom - pos.top) - height > 0) {
        overlapY = height + (pos.bottom - pos.top);
        below = false;
      } else if (height > winH) {
        hints.style.height = (winH - 5) + "px";
        overlapY -= height - winH;
      }
      hints.style.top = (top = pos.bottom - overlapY) + "px";
    }

    function changeActive(i) {
      i = Math.max(0, Math.min(i, completions.length - 1));
      if (selectedHint == i) return;
      var node = hints.childNodes[selectedHint];
      node.className = node.className.replace(" CodeMirror-hint-active", "");
      node = hints.childNodes[selectedHint = i];
      node.className += " CodeMirror-hint-active";
      if (node.offsetTop < hints.scrollTop)
        hints.scrollTop = node.offsetTop - 3;
      else if (node.offsetTop + node.offsetHeight > hints.scrollTop + hints.clientHeight)
        hints.scrollTop = node.offsetTop + node.offsetHeight - hints.clientHeight + 3;
      CodeMirror.signal(data, "select", completions[selectedHint], node);
    }

    function screenAmount() {
      return Math.floor(hints.clientHeight / hints.firstChild.offsetHeight) || 1;
    }

    var keyMap = buildKeyMap(options, {
      moveFocus: function(n) { changeActive(selectedHint + n); },
      setFocus: function(n) { changeActive(n); },
      menuSize: function() { return screenAmount(); },
      length: completions.length,
      close: close,
      pick: pick
    });

    cm.state.completionActive = true;
    cm.addKeyMap(keyMap);
    cm.on("cursorActivity", cursorActivity);
    var closingOnBlur;
    function onBlur(){ closingOnBlur = setTimeout(close, 100); };
    function onFocus(){ clearTimeout(closingOnBlur); };
    if (options.closeOnUnfocus !== false) {
      cm.on("blur", onBlur);
      cm.on("focus", onFocus);
    }
    var startScroll = cm.getScrollInfo();
    function onScroll() {
      var curScroll = cm.getScrollInfo(), editor = cm.getWrapperElement().getBoundingClientRect();
      var newTop = top + startScroll.top - curScroll.top, point = newTop;
      if (!below) point += hints.offsetHeight;
      if (point <= editor.top || point >= editor.bottom) return close();
      hints.style.top = newTop + "px";
      hints.style.left = (left + startScroll.left - curScroll.left) + "px";
    }
    cm.on("scroll", onScroll);
    CodeMirror.on(hints, "dblclick", function(e) {
      var t = e.target || e.srcElement;
      if (t.hintId != null) {selectedHint = t.hintId; pick();}
    });
    CodeMirror.on(hints, "click", function(e) {
      var t = e.target || e.srcElement;
      if (t.hintId != null) changeActive(t.hintId);
    });
    CodeMirror.on(hints, "mousedown", function() {
      setTimeout(function(){cm.focus();}, 20);
    });

    var done = false, once;
    function close(willContinue) {
      if (done) return;
      done = true;
      clearTimeout(once);
      hints.parentNode.removeChild(hints);
      cm.removeKeyMap(keyMap);
      cm.off("cursorActivity", cursorActivity);
      if (options.closeOnUnfocus !== false) {
        cm.off("blur", onBlur);
        cm.off("focus", onFocus);
      }
      cm.off("scroll", onScroll);
      if (willContinue !== true) {
        CodeMirror.signal(data, "close");
        cm.state.completionActive = false;
      }
    }
    function pick() {
      pickCompletion(cm, data, completions[selectedHint]);
      close();
    }
    var once, lastPos = cm.getCursor(), lastLen = cm.getLine(lastPos.line).length;
    function cursorActivity() {
      clearTimeout(once);

      var pos = cm.getCursor(), line = cm.getLine(pos.line);
      if (pos.line != lastPos.line || line.length - pos.ch != lastLen - lastPos.ch ||
          pos.ch < startCh || cm.somethingSelected() ||
          (pos.ch && closeOn.test(line.charAt(pos.ch - 1))))
        close();
      else {
        once = setTimeout(function(){close(true); continued = true; startHinting();}, 170);
      }
    }
    CodeMirror.signal(data, "select", completions[0], hints.firstChild);
    return true;
  }

  return startHinting();
};
