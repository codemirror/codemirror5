var CodeMirror = (function() {
  function Event(orig) {this.e = orig;}
  Event.prototype = {
    stop: function() {
      if (this.e.stopPropagation) this.e.stopPropagation();
      else this.e.cancelBubble = true;
      if (this.e.preventDefault) this.e.preventDefault();
      else this.e.returnValue = false;
    }
  };

  function connect(node, type, handler, disconnect) {
    function wrapHandler(event) {handler(new Event(event || window.event));}
    if (typeof node.addEventListener == "function") {
      node.addEventListener(type, wrapHandler, false);
      if (disconnect) return function() {node.removeEventListener(type, wrapHandler, false);};
    }
    else {
      node.attachEvent("on" + type, wrapHandler);
      if (disconnect) return function() {node.detachEvent("on" + type, wrapHandler);};
    }
  }

  function removeElement(node) {
    if (node.parentNode) node.parentNode.removeChild(node);
  }
  function eltOffset(node) {
    var x = 0, y = 0;
    while (node) {
      x += node.offsetLeft; y += node.offsetTop;
      node = node.offsetParent;
    }
    return {left: x, top: y};
  }

  function mth(self, name) {
    var f = self[name];
    return function(){return f.apply(self, arguments);};
  }

  function CodeMirror(place, options) {
    var div = this.div = place.appendChild(document.createElement("div"));
    div.className = "CodeMirror";
    var te = this.input = div.appendChild(document.createElement("textarea"));
    te.style.position = "absolute";
    //    te.style.left = te.style.top = "-10000px";
    te.style.top = "10em";
    var code = this.code = div.appendChild(document.createElement("div"));
    code.className = "CodeMirror-code";
    this.cursorDiv = code.appendChild(document.createElement("div"));
    this.cursorDiv.className = "CodeMirror-cursor";
    this.cursorDiv.style.display = "none";
    
    this.lines = [];
    this.setValue(options.value || "");
    this.cursor = {};
    this.setCursor(0);

    var self = this;
    connect(div, "click", mth(this, "onClick"));
    connect(te, "focus", mth(this, "onFocus"));
    connect(te, "blur", mth(this, "onBlur"));
    connect(te, "keyup", mth(this, "onActivity"));
    connect(te, "keypress", function() {setTimeout(mth(self, "onActivity"), 20);});
    connect(te, "keydown", mth(this, "onKeyDown"));
    connect(te, "mouseup", mth(this, "onActivity"));
    // TODO polling timer

    this.blinker = setInterval(function() {
      if (!div.parentNode) clearInterval(self.blinker);
      var st = self.cursorDiv.style;
      st.visibility = st.visibility ? "" : "hidden";
    }, 650);
  }

  CodeMirror.prototype = {
    setValue: function(code) {
      this.updateLines(0, this.lines.length, code.split(/\r?\n/g));
    },

    onClick: function(e) {
      var off = eltOffset(this.lines[0].div),
          x = e.e.pageX - off.left + this.code.scrollLeft,
          y = e.e.pageY - off.top + this.code.scrollTop;
      this.input.focus();
      this.setCursor(Math.floor(y / this.lineHeight()), Math.floor(x / this.charWidth()));
      this.onFocus();
    },
    onKeyDown: function(e) {
      var code = e.e.keyCode, ctrl = e.e.ctrlKey && !e.e.altKey;
      if (code == 33 || code == 34) { // Page up/down
        this.scrollPage(code == 34);
        e.stop();
      }
      if (ctrl && (code == 36 || code == 35)) { // Home, end
        this.scrollEnd(code == 36);
        e.stop();
      }
      else {
        var self = this;
        function poll() {if (self.onActivity()) setTimeout(poll, 200);}
        setTimeout(poll, 200);
      }
    },

    onFocus: function(){},
    onBlur: function(){
      this.cursorDiv.style.display = "none";
    },

    updateLines: function(from, to, newText) {
      // Update this.lines length and the associated DIVs
      var lendiff = newText.length - (to - from);
      if (lendiff < 0) {
        var removed = this.lines.splice(to - newText.length, -lendiff);
        for (var i = 0, l = removed.length; i < l; i++)
          removeElement(removed[i].div);
      }
      else if (lendiff > 0) {
        var spliceargs = [from, 0], before = this.lines[from] ? this.lines[from].div : null;
        for (var i = 0; i < lendiff; i++) {
          var div = this.code.insertBefore(document.createElement("div"), before);
          spliceargs.push({div: div});
        }
        this.lines.splice.apply(this.lines, spliceargs);
      }
      for (var i = 0, l = newText.length; i < l; i++) {
        var line = this.lines[from + i];
        var text = line.text = newText[i];
        line.div.innerHTML = "";
        var span = line.div.appendChild(document.createElement("span"));
        span.appendChild(document.createTextNode(text));
      }
    },

    onActivity: function() {
      var ed = this.editing, changed = false;
      var editedText = this.input.value, editedLines = editedText.split("\n");

      function computeOffset(n, startLine) {
        for (var i = 0;; i++) {
          var ll = editedLines[i].length;
          if (n <= ll) return {line: startLine, ch: n};
          startLine++; n -= (ll + 1);
        }
      }
      var from = computeOffset(this.input.selectionStart, ed.from),
          to = computeOffset(this.input.selectionEnd, ed.from);
      if (from.line != this.cursor.from.line || to.line != this.cursor.to.line)
        changed = true;
      else if (from.ch != this.cursor.from.ch || to.ch != this.cursor.to.ch)
        changed = "cur";
      this.cursor.from = from; this.cursor.to = to;

      if (editedText != ed.text) {
        var editStart = ed.from, editEnd = ed.to;
        while (editStart < this.lines.length && editedLines[0] == this.lines[editStart].text) {
          editStart++; editedLines.shift();
        }
        while (editEnd > editStart && editedLines[editedLines.length-1] == this.lines[editEnd-1].text) {
          editEnd--; editedLines.pop();
        }
        this.updateLines(editStart, editEnd, editedLines);
        changed = true;
      }

      if (changed) {
        if (changed != "cur") this.prepareInput();
        this.updateCursor();
      }
      return changed;
    },

    prepareInput: function() {
      var cursor = this.cursor, text = [];
      var from = Math.max(0, cursor.from.line - 1), to = Math.min(this.lines.length, cursor.to.line + 2);
      for (var i = from; i < to; i++) text.push(this.lines[i].text);
      text = this.input.value = text.join("\n");
      this.editing = {text: text, from: from, to: to};
      var startch = cursor.from.ch, endch = cursor.to.ch;
      for (var i = from; i < cursor.from.line; i++)
        startch += 1 + this.lines[i].text.length;
      for (var i = from; i < cursor.to.line; i++)
        endch += 1 + this.lines[i].text.length;
      this.input.selectionEnd = endch;
      this.input.selectionStart = startch;
    },

    updateCursor: function() {
      // TODO respect focus state
      var cur = this.cursor;
      if (cur.from.line == cur.to.line && cur.from.ch == cur.to.ch) {
        this.cursorDiv.style.display = "";
        this.cursorDiv.style.top = this.lines[cur.from.line].div.offsetTop + "px";
        this.cursorDiv.style.left = (this.charWidth() * cur.from.ch) + "px";
      }
      else {
        this.cursorDiv.style.display = "none";
        // TODO selection
      }

      var ypos = this.lines[cur.from.line].div.offsetTop, line = this.lineHeight(),
          screen = this.code.clientHeight, screentop = this.code.scrollTop;
      if (ypos < screentop)
        this.code.scrollTop = Math.max(0, ypos - 10);
      else if (ypos + line > screentop + screen)
        this.code.scrollTop = (ypos + line + 10) - screen;
      // TODO horizontal scrolling
    },

    lineHeight: function() {
      return this.lines[0].div.offsetHeight;
    },
    charWidth: function() {
      for (var i = 0, l = this.lines.length; i < l; i++) {
        var line = this.lines[i];
        if (line.text) return line.div.firstChild.offsetWidth / line.text.length;
      }
      return 1;
    },

    setCursor: function(line, ch) {
      line = Math.max(0, Math.min(this.lines.length - 1, line));
      ch = Math.max(0, Math.min(this.lines[line].text.length, ch || 0));
      this.cursor.from = this.cursor.to = {line: line, ch: ch};
      this.updateCursor();
      this.prepareInput();
    },
    scrollPage: function(down) {
      var linesPerPage = Math.floor(this.div.clientHeight / this.lineHeight());
      this.setCursor(this.cursor.from.line + (Math.max(linesPerPage - 1, 1) * (down ? 1 : -1)));
    },
    scrollEnd: function(top) {
      this.setCursor(top ? 0 : this.lines.length - 1);
    }
  };

  return CodeMirror;
})();
