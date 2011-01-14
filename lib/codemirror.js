// TODO handle 0-offsets when editor is hidden

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
    },
    button: function() {
      if (this.e.which) return this.e.which;
      else if (this.e.button & 1) return 1;
      else if (this.e.button & 2) return 3;
      else if (this.e.button & 4) return 2;
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

  var lineSep = window.opera ? "\r\n" : "\n";

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

  function posEq(a, b) {return a.line == b.line && a.ch == b.ch;}
  function posLess(a, b) {return a.line < b.line || (a.line == b.line && a.ch < b.ch);}
  function copyPos(x) {return {line: x.line, ch: x.ch};}

  function htmlEscape(str) {
    return str.replace(/[<&]/, function(str) {return str == "&" ? "&amp;" : "&lt;";});
  }

  var movementKeys = {};
  for (var i = 35; i <= 40; i++)
    movementKeys[i] = movementKeys["c" + i] = true;

  function lineElt(line) {return line.selDiv || line.div;}

  function CodeMirror(place, options) {
    var div = this.div = document.createElement("div");
    if (place.appendChild) place.appendChild(div); else place(div);
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
    this.restartBlink();
    this.measure = code.appendChild(document.createElement("span"));
    this.measure.style.position = "absolute";
    this.measure.style.visibility = "hidden";
    this.measure.innerHTML = "-";

    this.parser = parsers[options.parser || defaultParser];
    if (!this.parser) throw new Error("No parser found.");
    
    this.lines = []; this.work = [];
    var zero = {line: 0, ch: 0};
    this.selection = {from: zero, to: zero}; this.prevSelection = {from: zero, to: zero};
    this.$setValue(options.value || "");
    this.endOperation();

    var self = this;
    connect(code, "mousedown", this.operation("onMouseDown"));
    connect(te, "keyup", this.operation("onKeyUp"));
    connect(te, "keydown", this.operation("onKeyDown"));
    connect(te, "focus", function(){self.onFocus();});
    connect(te, "blur", function(){self.onBlur();});

    connect(code, "dragenter", function(e){e.stop();});
    connect(code, "dragover", function(e){e.stop();});
    connect(code, "drop", this.operation("onDrop"));
    connect(code, "paste", function(e){self.input.focus(); self.schedulePoll(20);});

    if (document.activeElement == te) this.onFocus();
    else this.onBlur();
  }

  CodeMirror.prototype = {
    $setValue: function(code) {
      this.replaceLines(0, this.lines.length, code.split(/\r?\n/g));
    },
    getValue: function(code) {
      var lines = [];
      for (var i = 0, l = this.lines.length; i < l; i++)
        lines.push(this.lines[i].text);
      return lines.join("\n");
    },

    onMouseDown: function(e) {
      // Make sure we're not clicking the scrollbar
      var corner = eltOffset(this.code);
      if (e.e.pageX - corner.left > this.code.clientWidth ||
          e.e.pageY - corner.top > this.code.clientHeight) return;

      this.shiftSelecting = null;
      var start = this.mouseEventPos(e), last = start, self = this;
      this.setCursor(start.line, start.ch, false);
      if (e.button() != 1) return;

      e.stop();
      function end() {
        if (!self.focused) {
          self.input.focus();
          self.onFocus();
          self.prepareInput();
        }
        self.updateInput = true;
        move(); up(); leave();
      }

      var move = connect(this.div, "mousemove", this.operation(function(e) {
        var cur = this.clipPos(this.mouseEventPos(e));
        if (!posEq(cur, last)) {
          last = cur;
          this.setSelection(this.clipPos(start), cur);
        }
      }), true);
      var up = connect(this.div, "mouseup", this.operation(function(e) {
        this.setSelection(this.clipPos(start), this.clipPos(this.mouseEventPos(e)));
        end();
      }), true);
      // TODO dragging out of window should scroll
      var leave = connect(this.div, "mouseout", this.operation(function(e) {
        if (e.target() == this.div) end();
      }), true);
    },
    onDrop: function(e) {
      try {var text = e.e.dataTransfer.getData("Text");}
      catch(e){}
      if (!text) return;
      var pos = this.clipPos(this.mouseEventPos(e));
      this.setSelection(pos, pos);
      this.$replaceSelection(text);
    },
    onKeyDown: function(e) {
      if (!this.focused) this.onFocus();

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
      else if (!ctrl && code == 13) { // enter
        this.insertNewline();
        e.stop();
      }
      else if (!ctrl && code == 9) { // tab
        this.handleTab();
        e.stop();
      }
      else if (code == 16) { // shift
        this.shiftSelecting = this.selection.inverted ? this.selection.to : this.selection.from;
      }
      else {
        var id = (ctrl ? "c" : "") + code;
        if (this.selection.inverted && movementKeys.hasOwnProperty(id)) {
          this.reducedSelection = {anchor: this.input.selectionStart};
          this.input.selectionEnd = this.input.selectionStart;
        }
        this.schedulePoll(20, id);
      }
    },
    onKeyUp: function(e) {
      if (this.reducedSelection) {
        this.reducedSelection = null;
        this.prepareInput();
      }
      if (e.e.keyCode == 16)
        this.shiftSelecting = null;
    },

    onFocus: function() {
      this.focused = true;
      this.schedulePoll(2000);
      if (this.div.className.search(/\bCodeMirror-focused\b/) == -1)
        this.div.className += " CodeMirror-focused";
    },
    onBlur: function() {
      this.shiftSelecting = null;
      this.focused = false;
      this.div.className = this.div.className.replace(" CodeMirror-focused", "");
    },

    replaceLines: function(from, to, newText) {
      // Make sure only changed lines are replaced
      var lines = this.lines;
      while (from < to && newText[0] == lines[from].text) {
        from++; newText.shift();
      }
      while (to > from + 1 && newText[newText.length-1] == lines[to-1].text) {
        to--; newText.pop();
      }

      // Update this.lines length and the associated DIVs
      var lendiff = newText.length - (to - from);
      if (lendiff < 0) {
        var removed = lines.splice(from, -lendiff);
        for (var i = 0, l = removed.length; i < l; i++)
          removeElement(lineElt(removed[i]));
      }
      else if (lendiff > 0) {
        var spliceargs = [from, 0], before = lines[from] ? lines[from].div : null;
        for (var i = 0; i < lendiff; i++) {
          var div = this.code.insertBefore(document.createElement("div"), before);
          spliceargs.push({div: div});
        }
        lines.splice.apply(lines, spliceargs);
      }
      for (var i = 0, l = newText.length; i < l; i++) {
        var line = lines[from + i];
        var text = line.text = newText[i];
        if (line.selDiv) this.code.replaceChild(line.div, line.selDiv);
        line.stateAfter = line.selDiv = null;
        line.div.innerHTML = "";
        addTextSpan(line.div, line.text);
      }

      var newWork = [];
      for (var i = 0, l = this.work.length; i < l; i++) {
        var task = this.work[i];
        if (task < from) newWork.push(task);
        else if (task >= to) newWork.push(task + lendiff);
      }
      if (newText.length) newWork.push(from);
      this.work = newWork;
      this.startWorker(100);

      var selLine = this.selection.from.line;
      if (lendiff || from != selLine || to != selLine + 1)
        this.updateInput = true;
    },

    schedulePoll: function(time, keyId) {
      var self = this;
      function pollForKey() {
        var state = self.readInput();
        if (state == "moved") movementKeys[keyId] = true;
        if (state) self.schedulePoll(200, keyId);
        else self.schedulePoll(2000);
      }
      function poll() {
        self.readInput();
        if (self.focused) self.schedulePoll(2000);
      }
      clearTimeout(this.pollTimer);
      if (time) this.pollTimer = setTimeout(this.operation(keyId ? pollForKey : poll), time);
    },

    readInput: function() {
      var ed = this.editing, changed = false, sel = this.selection, te = this.input;
      var text = te.value, selstart = te.selectionStart, selend = te.selectionEnd;
      var changed = ed.text != text, rs = this.reducedSelection;
      var moved = changed || selstart != ed.start || selend != (rs ? ed.start : ed.end);
      if (!moved) return false;

      function computeOffset(n, startLine) {
        var pos = 0;
        while (true) {
          var found = text.indexOf("\n", pos);
          if (found == -1 || (text.charAt(found-1) == "\r" ? found - 1 : found) >= n)
            return {line: startLine, ch: n - pos};
          startLine++;
          pos = found + 1;
        }
      }
      var from = computeOffset(selstart, ed.from),
          to = computeOffset(selend, ed.from);
      if (rs) {
        from = selstart == rs.anchor ? to : from;
        to = this.shiftSelecting ? sel.to : selstart == rs.anchor ? from : to;
        if (!posLess(from, to)) {
          this.reducedSelection = null;
          this.selection.inverted = false;
          var tmp = from; from = to; to = tmp;
        }
      }

      if (changed) {
        this.shiftSelecting = null;
        this.replaceLines(ed.from, ed.to, text.split(/\r?\n/g));
      }
      ed.text = text; ed.start = selstart; ed.end = selend;

      this.setSelection(from, to);
      return changed ? "changed" : moved ? "moved" : false;
    },

    prepareInput: function() {
      var sel = this.selection, text = [];
      var from = Math.max(0, sel.from.line - 1), to = Math.min(this.lines.length, sel.to.line + 2);
      for (var i = from; i < to; i++) text.push(this.lines[i].text);
      text = this.input.value = text.join(lineSep);
      var startch = sel.from.ch, endch = sel.to.ch;
      for (var i = from; i < sel.from.line; i++)
        startch += lineSep.length + this.lines[i].text.length;
      for (var i = from; i < sel.to.line; i++)
        endch += lineSep.length + this.lines[i].text.length;
      this.editing = {text: text, from: from, to: to, start: startch, end: endch};
      this.input.setSelectionRange(startch, this.reducedSelection ? startch : endch);
    },

    displaySelection: function() {
      var sel = this.selection, pr = this.prevSelection;
      if (posEq(sel.from, sel.to)) {
        this.cursor.style.display = "";
        if (!posEq(pr.from, pr.to)) {
          for (var i = pr.from.line; i <= pr.to.line; i++)
            this.removeSelectedStyle(i);
        }
        var linediv = lineElt(this.lines[sel.from.line]);
        this.cursor.style.top = linediv.offsetTop + "px";
        this.cursor.style.left = (linediv.offsetLeft + this.charWidth() * sel.from.ch) + "px";
      }
      else {
        this.cursor.style.display = "none";
        if (!posEq(pr.from, pr.to)) {
          for (var i = pr.from.line, e = Math.min(sel.from.line, pr.to.line + 1); i < e; i++)
            this.removeSelectedStyle(i);
          for (var i = Math.max(sel.to.line + 1, pr.from.line); i <= pr.to.line; i++)
            this.removeSelectedStyle(i);
        }
        if (sel.from.line == sel.to.line) {
          this.setSelectedStyle(sel.from.line, sel.from.ch, sel.to.ch);
        }
        else {
          this.setSelectedStyle(sel.from.line, sel.from.ch, null);
          for (var i = sel.from.line + 1; i < sel.to.line; i++)
            this.setSelectedStyle(i, 0, null);
          this.setSelectedStyle(sel.to.line, 0, sel.to.ch);
        }
      }

      var head = sel.inverted ? sel.from : sel.to, headLine = lineElt(this.lines[head.line]);
      var ypos = headLine.offsetTop, line = this.lineHeight(),
          screen = this.code.clientHeight, screentop = this.code.scrollTop;
      if (ypos < screentop)
        this.code.scrollTop = Math.max(0, ypos - 10);
      else if (ypos + line > screentop + screen)
        this.code.scrollTop = (ypos + line + 10) - screen;

      var xpos = head.ch * this.charWidth(),
          screenw = headLine.offsetWidth, screenleft = this.code.scrollLeft;
      if (xpos < screenleft)
        this.code.scrollLeft = Math.max(0, xpos - 10);
      else if (xpos > screenw + screenleft)
        this.code.scrollLeft = (xpos + 10) - screenw;
    },

    setSelection: function(from, to) {
      var sel = this.selection, sh = this.shiftSelecting;
      if (posLess(to, from)) {var tmp = to; to = from; from = tmp;}
      if (sh) {
        if (posLess(sh, from)) from = sh;
        else if (posLess(to, sh)) to = sh;
      }

      var startEq = posEq(sel.to, to), endEq = posEq(sel.from, from);
      if (posEq(from, to)) sel.inverted = false;
      else if (startEq && !endEq) sel.inverted = true;
      else if (endEq && !startEq) sel.inverted = false;
      sel.from = from; sel.to = to;
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
      this.shiftSelecting = null;
      var endLine = this.lines.length - 1;
      this.setSelection({line: 0, ch: 0}, {line: endLine, ch: this.lines[endLine].text.length});
    },
    insertNewline: function() {
      this.$replaceSelection("\n", "end");
      this.indentLine(this.selection.from.line);
    },
    handleTab: function() {
      var sel = this.selection;
      for (var i = sel.from.line, e = sel.to.line; i <= e; i++)
        this.indentLine(i);
    },
    indentLine: function(n) {
      var state = this.getStateBefore(n);
      if (!state) return;
      var text = this.lines[n].text;
      var curSpace = text.match(/^\s*/)[0].length;
      var indentation = this.parser.indent(state, text.slice(curSpace)), diff = indentation - curSpace;
      if (!diff) return;

      if (diff > 0) {
        var space = "";
        for (var i = 0; i < diff; i++) space = space + " ";
        this.replaceLines(n, n + 1, [space + text]);
      }
      else
        this.replaceLines(n, n + 1, [text.slice(-diff)]);
      var from = copyPos(this.selection.from), to = copyPos(this.selection.to);
      if (from.line == n) from.ch = Math.max(indentation, from.ch + diff);
      if (to.line == n) to.ch = Math.max(indentation, to.ch + diff);
      this.setSelection(from, to);
    },

    $replaceSelection: function(code, collapse) {
      var lines = code.split(/\r?\n/g), sel = this.selection;
      lines[0] = this.lines[sel.from.line].text.slice(0, sel.from.ch) + lines[0];
      var endch = lines[lines.length-1].length;
      lines[lines.length-1] += this.lines[sel.to.line].text.slice(sel.to.ch);
      var from = sel.from, to = {line: sel.from.line + lines.length - 1, ch: endch};
      this.replaceLines(sel.from.line, sel.to.line + 1, lines);
      if (collapse == "end") from = to;
      else if (collapse == "start") to = from;
      this.setSelection(from, to);
    },

    lineHeight: function() {
      var firstline = this.lines[0];
      return lineElt(firstline).offsetHeight;
    },
    charWidth: function() {
      return this.measure.offsetWidth || 1;
    },
    mouseEventPos: function(e) {
      var off = eltOffset(lineElt(this.lines[0])),
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
      if (!line.selDiv) return;
      this.code.replaceChild(line.div, line.selDiv);
      line.selDiv = null;
    },
    setSelectedStyle: function(line, start, end) {
      line = this.lines[line];
      var div = line.selDiv, repl = line.div;
      if (div) {
        if (div.start == start && div.end == end) return;
        repl = div;
      }
      div = line.selDiv = document.createElement("div");
      if (start > 0)
        addTextSpan(div, line.text.slice(0, start));
      var seltext = line.text.slice(start, end == null ? line.text.length : end);
      if (end == null) seltext += " ";
      addTextSpan(div, seltext).className = "CodeMirror-selected";
      if (end != null && end < line.text.length)
        addTextSpan(div, line.text.slice(end));
      div.start = start; div.end = end;
      this.code.replaceChild(div, repl);
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
    },

    highlightLine: function(line, state) {
      var stream = new StringStream(line.text), html = [];
      while (!stream.done()) {
        var start = stream.pos, style = this.parser.token(stream, state, start == 0);
        var str = line.text.slice(start, stream.pos);
        html.push("<span class=\"" + style + "\">" + htmlEscape(str) + "</span>");
      }
      // TODO benchmark with removing/cloning/hiding/whatever
      line.div.innerHTML = html.join("");
    },
    getStateBefore: function(n) {
      var state;
      for (var search = n - 1, lim = n - 40;; search--) {
        if (search < 0) {state = this.parser.startState(); break;}
        if (search < lim) return null;
        if (state = this.lines[search].stateAfter) {state = copyState(state); break;}
      }
      for (search++; search < n; search++) {
        var line = this.lines[search];
        this.highlightLine(line, state);
        line.stateAfter = copyState(state);
      }
      if (!this.lines[n].stateAfter) this.work.push(n);
      return state;
    },
    highlightWorker: function(start) {
      // TODO have a mode where the document is always parsed to the end
      var end = +new Date + 200;
      while (this.work.length) {
        var task = this.work.pop()
        if (this.lines[task].stateAfter) continue;
        if (task) {
          var state = this.lines[task-1].stateAfter;
          if (!state) continue;
          state = copyState(state);
        }
        else var state = this.parser.startState();

        for (var i = task, l = this.lines.length; i < l; i++) {
          var line = this.lines[i];
          if (line.stateAfter) break;
          if (+new Date > end) {
            this.work.push(i);
            this.startWorker(300);
            return;
          }
          this.highlightLine(line, state);
          line.stateAfter = copyState(state);
        }
      }
    },
    startWorker: function(time) {
      if (!this.work.length) return;
      var self = this;
      clearTimeout(this.highlightTimeout);
      this.highlightTimeout = setTimeout(this.operation("highlightWorker"), time);
    },

    startOperation: function() {
      var ps = this.prevSelection, sel = this.selection;
      ps.from = sel.from; ps.to = sel.to;
      this.updateInput = false;
    },
    endOperation: function() {
      var ps = this.prevSelection, sel = this.selection;
      if (!posEq(ps.from, sel.from) || !posEq(ps.to, sel.to)) {
        this.displaySelection();
        this.restartBlink();
      }
      if (ps.from.line != sel.from.line || ps.to.line != sel.to.line || this.updateInput)
        this.prepareInput();
    },
    operation: function(f) {
      var self = this;
      if (typeof f == "string") f = this[f];
      return function() {
        self.startOperation();
        var result = f.apply(self, arguments);
        self.endOperation();
        return result;
      };
    }
  };

  // Wrap API functions as operations
  var proto = CodeMirror.prototype;
  function apiOp(name) {
    var f = proto[name];
    proto[name.slice(1)] = function() {
      this.startOperation();
      return f.apply(this, arguments);
      this.endOperation();
    };
  }
  for (var n in proto) if (n.charAt(0) == "$") apiOp(n);

  var parsers = {}, defaultParser = null;
  CodeMirror.addParser = function(name, parser) {
    if (!defaultParser) defaultParser = name;
    parsers[name] = parser;
  };

  CodeMirror.fromTextArea = function(textarea, options) {
    if (options && options.value == null)
      options.value = textarea.value;

    function save() {textarea.value = instance.getValue();}
    if (textarea.form) {
      var rmSubmit = connect(textarea.form, "submit", save);
      var realSubmit = textarea.form.submit;
      function wrappedSubmit() {
        updateField();
        textarea.form.submit = realSubmit;
        textarea.form.submit();
        textarea.form.submit = wrappedSubmit;
      }
      textarea.form.submit = wrappedSubmit;
    }

    textarea.style.display = "none";
    var instance = new CodeMirror(function(node) {
      textarea.parentNode.insertBefore(node, textarea.nextSibling);
    }, options);
    instance.save = save;
    instance.toTextArea = function() {
      save();
      textaarea.parentNode.removeChild(instance.div);
      textarea.style.display = "";
      if (textarea.form) {
        textarea.form.submit = realSubmit;
        rmSubmit();
      }
    };
    return instance;
  };

  function StringStream(string) {
    this.pos = 0;
    this.string = string;
  }
  StringStream.prototype = {
    done: function() {return this.pos >= this.string.length;},
    peek: function() {return this.string.charAt(this.pos);},
    next: function() {
      if (this.pos < this.string.length)
        return this.string.charAt(this.pos++);
    },
    eat: function(match) {
      var ch = this.string.charAt(this.pos);
      if (typeof match == "string") var ok = ch == match;
      else var ok = ch && match.test ? match.test(ch) : match(ch);
      if (ok) {this.pos++; return ch;}
    },
    eatWhile: function(match) {
      var start = this.pos;
      while (this.eat(match));
      if (this.pos > start) return this.string.slice(start, this.pos);
    },
    backUp: function(n) {this.pos -= n;},
    column: function() {return this.pos;},
    eatSpace: function() {
      var start = this.pos;
      while (/\s/.test(this.string.charAt(this.pos))) this.pos++;
      return this.pos - start;
    },
    match: function(pattern, consume, caseInsensitive) {
      if (typeof pattern == "string") {
        function cased(str) {return caseInsensitive ? str.toLowerCase() : str;}
        if (cased(this.string).indexOf(cased(pattern), this.pos) == this.pos) {
          if (consume !== false) this.pos += str.length;
          return true;
        }
      }
      else {
        var match = this.string.slice(this.pos).match(pattern);
        if (match && consume !== false) this.pos += match[0].length;
        return match;
      }
    }
  };

  function copyState(state) {
    if (state.copy) return state.copy();
    var nstate = {};
    for (var n in state) {
      var val = state[n];
      if (val instanceof Array) val = val.concat([]);
      nstate[n] = val;
    }
    return nstate;
  }

  return CodeMirror;
})();
