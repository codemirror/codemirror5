var CodeMirror = (function() {
  function Event(orig) {this.e = orig;}
  Event.prototype = {
    stop: function() {
      if (this.e.stopPropagation) this.e.stopPropagation();
      else this.e.cancelBubble = true;
      if (this.e.preventDefault) this.e.preventDefault();
      else this.e.returnValue = false;
    },
    target: function() {
      return this.e.target || this.e.srcElement;
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
  function addTextSpan(node, text) {
    var span = node.appendChild(document.createElement("span"));
    span.appendChild(document.createTextNode(text));
    return span;
  }

  function mth(self, name) {
    var f = self[name];
    return function(){return f.apply(self, arguments);};
  }

  function posEq(a, b) {return a.line == b.line && a.ch == b.ch;}
  function posLess(a, b) {return a.line < b.line || a.ch < b.ch;}

  function CodeMirror(place, options) {
    var div = this.div = place.appendChild(document.createElement("div"));
    div.className = "CodeMirror";
    var te = this.input = div.appendChild(document.createElement("textarea"));
    te.style.position = "absolute";
    te.style.width = "10000px";
    te.style.left = te.style.top = "-100000px";
    var code = this.code = div.appendChild(document.createElement("div"));
    code.className = "CodeMirror-code";
    this.cursor = code.appendChild(document.createElement("div"));
    this.cursor.className = "CodeMirror-cursor";
    this.cursor.style.display = "none";
    this.measure = code.appendChild(document.createElement("span"));
    this.measure.style.position = "absolute";
    this.measure.style.visibility = "hidden";
    this.measure.innerHTML = "-";
    
    this.lines = [];
    this.setValue(options.value || "");
    var zero = {line: 0, ch: 0};
    this.selection = {from: zero, to: zero}; this.prevSelection = {from: zero, to: zero};
    this.setCursor(0);

    var self = this;
    connect(div, "mousedown", mth(this, "onMouseDown"));
    connect(te, "focus", mth(this, "onFocus"));
    connect(te, "blur", mth(this, "onBlur"));
    connect(te, "keyup", mth(this, "onKeyUp"));
    connect(te, "keypress", function() {setTimeout(mth(self, "onActivity"), 0);});
    connect(te, "keydown", mth(this, "onKeyDown"));
    connect(te, "mouseup", mth(this, "onActivity"));
    // TODO polling timer

    this.focused = document.activeElement == te;

    this.restartBlink();
  }

  CodeMirror.prototype = {
    setValue: function(code) {
      this.updateLines(0, this.lines.length, code.split(/\r?\n/g));
    },

    onMouseDown: function(e) {
      var start = this.mouseEventPos(e), last = start, self = this;
      this.setCursor(start.line, start.ch);
      function end() {
        if (!self.focused) {
          self.input.focus();
          self.onFocus();
        }
        move(); up(); leave();
      }

      var move = connect(this.div, "mousemove", function(e) {
        var cur = self.clipPos(self.mouseEventPos(e));
        if (!posEq(cur, last)) {
          last = cur;
          self.setSelection(self.clipPos(start), cur);
        }
      }, true);
      var up = connect(this.div, "mouseup", function(e) {
        self.setSelection(self.clipPos(start), self.clipPos(self.mouseEventPos(e)));
        end();
      }, true);
      var leave = connect(this.div, "mouseleave", function(e) {
        if (e.target() == self.div) end();
      }, true);
    },
    onKeyDown: function(e) {
      var code = e.e.keyCode, ctrl = e.e.ctrlKey && !e.e.altKey;
      if (code == 33 || code == 34) { // page up/down
        this.scrollPage(code == 34);
        e.stop();
      }
      else if (ctrl && (code == 36 || code == 35)) { // ctrl-home/end
        this.scrollEnd(code == 36);
        e.stop();
      }
      else if (ctrl && code == 65) { // ctrl-a
        this.selectAll();
        e.stop();
      }
      else if (code == 16) { // shift
        this.shiftSelect = {from: this.selection.from, to: this.selection.to};
      }
      else {
        var self = this;
        function poll() {if (self.onActivity()) setTimeout(poll, 200);}
        setTimeout(poll, 200);
      }
    },
    onKeyUp: function(e) {
      if (e.e.keyCode == 16 && this.shiftSelect) {
        var sh = this.shiftSelect, sel = this.selection;
        if (posLess(sh.from, sel.from)) this.setSelection(sh.from, sel.to);
        else if (posLess(sel.to, sh.to)) this.setSelection(sel.from, sh.to);
        this.shiftSelect = null;
      }
      else {
        this.onActivity();
      }
    },

    onFocus: function() {
      this.focused = true;
      this.displaySelection();
    },
    onBlur: function() {
      this.focused = false;
      this.displaySelection();
    },

    updateLines: function(from, to, newText) {
      // Update this.lines length and the associated DIVs
      var lendiff = newText.length - (to - from);
      if (lendiff < 0) {
        var removed = this.lines.splice(from, -lendiff);
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
        line.tokens = null;
        line.div.innerHTML = "";
        addTextSpan(line.div, line.text);
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
      if (from.line != this.selection.from.line || to.line != this.selection.to.line)
        changed = true;
      else if (from.ch != this.selection.from.ch || to.ch != this.selection.to.ch)
        changed = "sel";
      this.selection.from = from; this.selection.to = to;

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
        this.restartBlink();
        this.displaySelection();
        if (changed != "sel") this.prepareInput();
      }
      return changed;
    },

    prepareInput: function() {
      var sel = this.selection, text = [];
      var from = Math.max(0, sel.from.line - 1), to = Math.min(this.lines.length, sel.to.line + 2);
      for (var i = from; i < to; i++) text.push(this.lines[i].text);
      text = this.input.value = text.join("\n");
      this.editing = {text: text, from: from, to: to};
      var startch = sel.from.ch, endch = sel.to.ch;
      for (var i = from; i < sel.from.line; i++)
        startch += 1 + this.lines[i].text.length;
      for (var i = from; i < sel.to.line; i++)
        endch += 1 + this.lines[i].text.length;
      this.input.selectionEnd = endch;
      this.input.selectionStart = startch;
    },

    displaySelection: function() {
      var sel = this.selection, pr = this.prevSelection;
      if (!this.focused) {
        this.cursor.style.display = "none";
      }
      else if (posEq(sel.from, sel.to)) {
        if (!posEq(pr.from, pr.to)) {
          for (var i = pr.from.line; i <= pr.to.line; i++)
            this.removeSelectedStyle(i);
        }
        this.cursor.style.display = "";
        var linediv = this.lines[sel.from.line].div;
        this.cursor.style.top = linediv.offsetTop + "px";
        this.cursor.style.left = (linediv.offsetLeft + this.charWidth() * sel.from.ch) + "px";
      }
      else {
        this.cursor.style.display = "none";
        if (!posEq(pr.from, pr.to)) {
          for (var i = pr.from.line, e = Math.min(sel.from.line, pr.to.line + 1); i < e; i++)
            this.removeSelectedStyle(i);
          for (var i = Math.max(sel.to.line + 1, pr.from.line); i < pr.to.line; i++)
            this.removeSelectedStyle(i);
        }
        if (sel.from.line == sel.to.line) {
          this.setSelectedStyle(sel.from.line, sel.from.ch, sel.to.ch);
        }
        else {
          this.setSelectedStyle(sel.from.line, sel.from.ch, null);
          for (var i = sel.from.line + 1; i < sel.to.line - 1; i++)
            this.setSelectedStyle(i, 0, null);
          this.setSelectedStyle(sel.to.line, 0, sel.to.ch);
        }
      }
      pr.from = sel.from; pr.to = sel.to;

      var ypos = this.lines[sel.from.line].div.offsetTop, line = this.lineHeight(),
          screen = this.code.clientHeight, screentop = this.code.scrollTop;
      if (ypos < screentop)
        this.code.scrollTop = Math.max(0, ypos - 10);
      else if (ypos + line > screentop + screen)
        this.code.scrollTop = (ypos + line + 10) - screen;
      // TODO horizontal scrolling
    },

    setSelection: function(from, to) {
      if (posLess(to, from)) {var tmp = to; to = from; from = tmp;}
      this.selection.from = from; this.selection.to = to;
      this.displaySelection();
      this.prepareInput();
    },

    setCursor: function(line, ch) {
      var pos = this.clipPos({line: line, ch: ch || 0});
      this.setSelection(pos, pos);
    },
    scrollPage: function(down) {
      var linesPerPage = Math.floor(this.div.clientHeight / this.lineHeight());
      this.setCursor(this.selection.from.line + (Math.max(linesPerPage - 1, 1) * (down ? 1 : -1)));
    },
    scrollEnd: function(top) {
      this.setCursor(top ? 0 : this.lines.length - 1);
    },
    selectAll: function() {
      var endLine = this.lines.length - 1;
      this.setSelection({line: 0, ch: 0}, {line: endLine, ch: this.lines[endLine].text.length});
    },

    lineHeight: function() {
      return this.lines[0].div.offsetHeight;
    },
    charWidth: function() {
      return this.measure.offsetWidth || 1;
    },
    mouseEventPos: function(e) {
      var off = eltOffset(this.lines[0].div),
          x = e.e.pageX - off.left + this.code.scrollLeft,
          y = e.e.pageY - off.top + this.code.scrollTop;
      return {line: Math.floor(y / this.lineHeight()), ch: Math.floor(x / this.charWidth())};
    },
    clipPos: function(pos) {
      pos.line = Math.max(0, Math.min(this.lines.length - 1, pos.line));
      pos.ch = Math.max(0, Math.min(this.lines[pos.line].text.length, pos.ch));
      return pos;
    },

    removeSelectedStyle: function(line) {
      if (line >= this.lines.length) return;
      line = this.lines[line];
      line.div.innerHTML = "";
      addTextSpan(line.div, line.text);
    },
    setSelectedStyle: function(line, start, end) {
      line = this.lines[line];
      if (!line.text) return;
      if (end == null) end = line.text.length;
      line.div.innerHTML = "";
      if (start > 0)
        addTextSpan(line.div, line.text.slice(0, start));
      addTextSpan(line.div, line.text.slice(start, end)).className = "CodeMirror-selected";
      if (end < line.text.length)
        addTextSpan(line.div, line.text.slice(end));
    },

    restartBlink: function() {
      clearInterval(this.blinker);
      this.cursor.style.visibility = "";
      var self = this;
      this.blinker = setInterval(function() {
        if (!self.div.parentNode) clearInterval(self.blinker);
        var st = self.cursor.style;
        st.visibility = st.visibility ? "" : "hidden";
      }, 650);
    }
  };

  return CodeMirror;
})();
