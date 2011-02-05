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
    },
    pageX: function() {
      if (this.e.pageX != null) return this.e.pageX;
      else return this.e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    },
    pageY: function() {
      if (this.e.pageY != null) return this.e.pageY;
      else return this.e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
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

  var lineSep = (window.opera || /MSIE/.test(navigator.userAgent)) ? "\r\n" : "\n";

  function eltOffset(node) {
    var x = 0, y = 0, n2 = node;
    for (var n = node; n; n = n.offsetParent) {x += n.offsetLeft; y += n.offsetTop;}
    for (var n = node; n != document.body; n = n.parentNode) {x -= n.scrollLeft; y -= n.scrollTop;}
    return {left: x, top: y};
  }

  function posEq(a, b) {return a.line == b.line && a.ch == b.ch;}
  function posLess(a, b) {return a.line < b.line || (a.line == b.line && a.ch < b.ch);}
  function copyPos(x) {return {line: x.line, ch: x.ch};}

  function htmlEscape(str) {
    return str.replace(/[<&]/, function(str) {return str == "&" ? "&amp;" : "&lt;";});
  }
  var prepareCode = htmlEscape;
  if (/\bMSIE [456]\./.test(navigator.userAgent))
    prepareCode = function(str) {return htmlEscape(str.replace(/[ \t]/g, "\u00a0"));};

  function editEnd(from, to) {
    if (!to) return from ? from.length : 0;
    if (!from) return to.length;
    for (var i = from.length, j = to.length; i >= 0 && j >= 0; --i, --j)
      if (from.charAt(i) != to.charAt(j)) break;
    return j + 1;
  }

  function indexOf(collection, elt) {
    if (collection.indexOf) return collection.indexOf(elt);
    for (var i = 0, e = collection.length; i < e; ++i)
      if (collection[i] == elt) return i;
    return -1;
  }

  if (window.getSelection) {
    var selRange = function(te) {
      return {start: te.selectionStart, end: te.selectionEnd};
    };
    var setSelRange = function(te, start, end) {
      te.setSelectionRange(start, end);
    };
  }
  else {
    var selRange = function(te) {
      try {var range = document.selection.createRange();}
      catch(e) {return null;}
      if (!range || range.parentElement() != te) return null;
      var val = te.value, len = val.length, localRange = te.createTextRange();
      localRange.moveToBookmark(range.getBookmark());
      var endRange = te.createTextRange();
      endRange.collapse(false);

      if (localRange.compareEndPoints("StartToEnd", endRange) > -1)
        return {start: len, end: len};

      var start = -localRange.moveStart("character", -len);
      for (var i = val.indexOf("\r"); i > -1 && i < start; i = val.indexOf("\r", i+1), start++);

      if (localRange.compareEndPoints("EndToEnd", endRange) > -1)
        return {start: start, end: len};

      var end = -localRange.moveEnd("character", -len);
      for (var i = val.indexOf("\r"); i > -1 && i < end; i = val.indexOf("\r", i+1), end++);
      return {start: start, end: end};
    };
    var setSelRange = function(te, start, end) {
      var range = te.createTextRange();
      range.collapse(true);
      var endrange = range.duplicate();
      var newlines = 0, txt = te.value;
      for (var pos = txt.indexOf("\n"); pos > -1 && pos < start; pos = txt.indexOf("\n", pos + 1))
        ++newlines;
      range.move("character", start - newlines);
      for (; pos > -1 && pos < end; pos = txt.indexOf("\n", pos + 1))
        ++newlines;
      endrange.move("character", end - newlines);
      range.setEndPoint("EndToEnd", endrange);
      range.select();
    };
  }

  var movementKeys = {};
  for (var i = 35; i <= 40; ++i)
    movementKeys[i] = movementKeys["c" + i] = true;

  function Delayed() {this.id = null;}
  Delayed.prototype = {set: function(ms, f) {clearTimeout(this.id); this.id = setTimeout(f, ms);}};

  function copyStyles(from, to, source, dest) {
    for (var i = 0, pos = 0, state = 0; pos < to; i+=2) {
      var part = source[i], end = pos + part.length;
      if (state === 0) {
        if (end > from) dest.push(part.slice(from - pos, Math.min(part.length, to - pos)), source[i+1]);
        if (end >= from) state = 1;
      }
      else if (state === 1) {
        if (end > to) dest.push(part.slice(0, to - pos), source[i+1]);
        else dest.push(part, source[i+1]);
      }
      pos = end;
    }    
  }

  function Line(text, styles) {
    this.styles = styles || [text, null];
    this.stateAfter = null;
    this.text = text;
    this.marked = null;
  }
  Line.prototype = {
    replace: function(from, to, text) {
      var st = [], mk = this.marked;
      copyStyles(0, from, this.styles, st);
      if (text) st.push(text, null);
      copyStyles(to, this.text.length, this.styles, st);
      this.styles = st;
      this.text = this.text.slice(0, from) + text + this.text.slice(to);
      this.stateAfter = null;
      if (mk) {
        var diff = text.length - (to - from), end = this.text.length;
        function fix(n) {return n <= Math.min(to, to + diff) ? n : n + diff;}
        for (var i = 0; i < mk.length; ++i) {
          var mark = mk[i], del = false;
          if (mark.from >= end) del = true;
          else {mark.from = fix(mark.from); if (mark.to != null) mark.to = fix(mark.to);}
          if (del || mark.from >= mark.to) {mk.splice(i, 1); i--;}
        }
      }
    },
    split: function(pos, textBefore) {
      var st = [textBefore, null];
      copyStyles(pos, this.text.length, this.styles, st);
      return new Line(textBefore + this.text.slice(pos), st);
    },
    addMark: function(from, to, style) {
      var mk = this.marked, mark = {from: from, to: to, style: style};
      if (this.marked == null) this.marked = [];
      this.marked.push(mark);
      this.marked.sort(function(a, b){return a.from - b.from;});
      return mark;
    },
    removeMark: function(mark) {
      var mk = this.marked;
      if (!mk) return;
      for (var i = 0; i < mk.length; ++i)
        if (mk[i] == mark) {mk.splice(i, 1); break;}
    },
    highlight: function(parser, state) {
      var stream = new StringStream(this.text), st = this.styles;
      st.length = 0;
      while (!stream.done()) {
        var start = stream.pos, style = parser.token(stream, state, start == 0);
        var substr = this.text.slice(start, stream.pos);
        if (st.length && st[st.length-1] == style)
          st[st.length-2] += substr;
        else if (substr)
          this.styles.push(substr, style);
      }
    },
    getHTML: function(sfrom, sto) {
      if (!this.marked && sfrom === 0 && sto === null)
        return '<span class="CodeMirror-selected">' + prepareCode(this.text) + " </span>";

      var html = [], st = this.styles, allText = this.text, marked = this.marked;
      function span(text, style) {
        if (!text) return;
        if (style) html.push('<span class="', style, '">', prepareCode(text), "</span>");
        else html.push(text);
      }
      if (sfrom === sto) sfrom = null;

      if (!allText)
        span(" ");
      else if (!marked && sfrom === null)
        for (var i = 0, e = st.length; i < e; i+=2) span(st[i], st[i+1]);
      else {
        var pos = 0, i = 0, text = "", style, sg = 0;
        function copyUntil(end) {
          for (;;) {
            var upto = pos + text.length;
            span(upto > end ? text.slice(0, end - pos) : text, style);
            if (upto >= end) {text = text.slice(end - pos); pos = end; break;}
            pos = upto;
            text = st[i++]; style = st[i++];
          }
        }
        function chunkUntil(end, cStyle) {
          var acc = [];
          for (;;) {
            var upto = pos + text.length;
            if (upto >= end) {
              var size = end - pos;
              acc.push(text.slice(0, size));
              span(acc.join(""), cStyle);
              text = text.slice(size);
              pos += size;
              break;
            }
            acc.push(text);
            pos = upto;
            text = st[i++]; style = st[i++];
          }
        }
        var markpos = 0, mark;
        function nextMark() {
          if (!marked) return null;
          for (; markpos < marked.length; markpos++) {
            mark = marked[markpos];
            var end = mark.to == null ? allText.length : mark.to;
            if (end > pos) return Math.max(mark.from, pos);
          }
        }

        while (pos < allText.length) {
          var nextmark = nextMark();
          if (sfrom != null && sfrom >= pos && (nextmark == null || sfrom <= nextmark)) {
            copyUntil(sfrom);
            if (sto == null) {
              span(allText.slice(pos) + " ", "CodeMirror-selected");
              break;
            }
            chunkUntil(sto, "CodeMirror-selected");
          }
          else if (nextmark != null) {
            copyUntil(nextmark);
            var end = mark.to == null ? allText.length : mark.to;
            chunkUntil(sfrom == null || sfrom < pos ? end : Math.min(sfrom, end), mark.style);
          }
          else copyUntil(allText.length);
        }
      }

      return html.join("");
    }
  };

  function History() {
    this.time = 0;
    this.done = []; this.undone = [];
  }
  History.prototype = {
    addChange: function(start, added, old) {
      this.undone.length = 0;
      var time = +new Date, last = this.done[this.done.length - 1];
      if (time - this.time > 400 || !last ||
          last.start > start + added || last.start + last.added < start - last.added + last.old.length)
        this.done.push({start: start, added: added, old: old});
      else {
        var oldoff = 0;
        if (start < last.start) {
          for (var i = last.start - start - 1; i >= 0; --i)
            last.old.unshift(old[i]);
          last.added += last.start - start;
          last.start = start;
        }
        else if (last.start < start) {
          oldoff = start - last.start;
          added += oldoff;
        }
        for (var i = last.added, e = old.length; i < e; ++i)
          last.old.push(old[i]);
        if (last.added < added) last.added = added;
      }
      this.time = time;
    }
  };

  function CodeMirror(place, options) {
    if (!options) options = {};
    var defaults = CodeMirror.defaults;
    for (var opt in defaults)
      if (defaults.hasOwnProperty(opt) && !options.hasOwnProperty(opt))
        options[opt] = defaults[opt];

    var div = document.createElement("div");
    div.className = "CodeMirror";
    div.innerHTML = '<div class="CodeMirror-code">' +
      '<div style="position: relative"><div style="position: absolute"><div class="CodeMirror-gutter"></div>' +
      '<div style="position: relative"><div style="position: absolute; visibility: hidden"><span>-</span></div>' +
      '<div style="overflow: hidden; position: absolute; width: 0">' + 
      '<textarea style="position: absolute; width: 10000px;"></textarea></div>' +
      '<span class="CodeMirror-cursor">&nbsp;</span><div class="CodeMirror-lines"></div></div></div></div>';
    if (place.appendChild) place.appendChild(div); else place(div);
    var code = div.lastChild, space = code.firstChild, mover = space.firstChild,
        gutter = mover.firstChild, measure = mover.lastChild.firstChild, inputDiv = measure.nextSibling,
        cursor = inputDiv.nextSibling, lineDiv = cursor.nextSibling, input = inputDiv.firstChild;
//    inputDiv.style.width = "30em"; inputDiv.style.height = "5em"; input.rows = 3;
    if (options.tabindex != null) input.tabindex = options.tabindex;
    if (!options.lineNumbers) gutter.style.display = "none";

    var poll = new Delayed(), highlight = new Delayed(), blinker;

    var parser, lines = [new Line("")], work, history = new History();
    setParser(options.parser, options.parserConfig);
    var zero = {line: 0, ch: 0};
    var sel = {from: zero, to: zero, inverted: false};
    var shiftSelecting, reducedSelection, focused, updateInput, changes, textChanged, selectionChanged;
    var showingFrom = 0, showingTo = 0, editing, bracketHighlighted;
    operation(function(){setValue(options.value || ""); updateInput = false;})();
    setTimeout(prepareInput, 20);

    connect(code, "mousedown", operation(onMouseDown));
    connect(code, "dblclick", operation(onDblClick));
    connect(code, "scroll", updateDisplay);
    connect(window, "resize", updateDisplay);
    connect(input, "keyup", operation(onKeyUp));
    connect(input, "keydown", operation(onKeyDown));
    connect(input, "focus", onFocus);
    connect(input, "blur", onBlur);

    connect(code, "dragenter", function(e){e.stop();});
    connect(code, "dragover", function(e){e.stop();});
    connect(code, "drop", operation(onDrop));
    connect(code, "paste", function(){input.focus(); fastPoll();});
    connect(input, "paste", fastPoll);

    function stopScroll(e) {
      var up = e.e.detail || e.e.wheelDelta > 0;
      if (up ? code.scrollTop == 0 : code.scrollTop + code.clientHeight >= code.scrollHeight)
        e.stop();
    }
    connect(div, "mousewheel", stopScroll);
    connect(div, "DOMMouseScroll", stopScroll);

    if (document.activeElement == input) onFocus();
    else onBlur();

    function setValue(code) {
      history = null;
      var top = {line: 0, ch: 0};
      updateLines(top, {line: lines.length - 1, ch: lines[lines.length-1].text.length},
                  code, top, top);
      history = new History();
    }
    function getValue(code) {
      var text = [];
      for (var i = 0, l = lines.length; i < l; ++i)
        text.push(lines[i].text);
      return text.join("\n");
    }

    function onMouseDown(e) {
      var start = posFromMouse(e), last = start;
      if (!start) return;
      setCursor(start.line, start.ch, false);
      if (e.button() != 1) return;
      if (!focused) onFocus();

      e.stop();
      function end() {
        input.focus();
        updateInput = true;
        move(); up(); leave();
      }

      var move = connect(document, "mousemove", operation(function(e) {
        var cur = posFromMouse(e);
        if (cur && !posEq(cur, last)) {
          last = cur;
          setSelection(start, cur);
          updateInput = false;
        }
      }), true);
      var up = connect(document, "mouseup", operation(function(e) {
        var cur = posFromMouse(e);
        if (cur) setSelection(start, cur);
        e.stop();
        end();
      }), true);
      var leave = connect(document, "mouseout", operation(function(e) {
        if (e.target() == document.body) end();
      }), true);
    }
    function onDblClick(e) {
      var pos = posFromMouse(e);
      if (!pos) return;
      selectWordAt(pos);
      e.stop();
    }
    // TODO file drops
    function onDrop(e) {
      try {var text = e.e.dataTransfer.getData("Text");}
      catch(e){}
      if (!text || options.readOnly) return;
      var pos = posFromMouse(e);
      if (pos) replaceRange(text, pos, pos);
    }
    function onKeyDown(e) {
      if (!focused) onFocus();

      var code = e.e.keyCode, ctrl = e.e.ctrlKey && !e.e.altKey, done = false;

      if (code == 33 || code == 34) {scrollPage(code == 34); done = true;} // page up/down
      else if (ctrl && (code == 36 || code == 35)) {scrollEnd(code == 36); done = true;} // ctrl-home/end
      else if (ctrl && code == 65) {selectAll(); done = true;} // ctrl-a
      else if (code == 16) {shiftSelecting = sel.inverted ? sel.to : sel.from;} // shift
      else if (!options.readOnly) {
        if (!ctrl && code == 13) {insertNewline(); done = true;} // enter
        else if (!ctrl && code == 9) {handleTab(); done = true;} // tab
        else if (ctrl && code == 90) {undo(); done = true;} // ctrl-z
        else if (ctrl && ((event.shiftKey && code == 90) || code == 89)) {redo(); done = true;} // ctrl-shift-z, ctrl-y
      }

      if (done) {e.stop(); return;}
      var id = (ctrl ? "c" : "") + code;
      if (sel.inverted && movementKeys.hasOwnProperty(id)) {
        var range = selRange(input);
        if (range) {
          reducedSelection = {anchor: range.start};
          setSelRange(input, range.start, range.start);
        }
      }
      fastPoll(20, id);
    }
    function onKeyUp(e) {
      if (reducedSelection) {
        reducedSelection = null;
        updateInput = true;
      }
      if (e.e.keyCode == 16)
        shiftSelecting = null;
    }

    function onFocus() {
      focused = true;
      slowPoll();
      if (div.className.search(/\bCodeMirror-focused\b/) == -1)
        div.className += " CodeMirror-focused";
      restartBlink();
    }
    function onBlur() {
      clearInterval(blinker);
      shiftSelecting = null;
      focused = false;
      div.className = div.className.replace(" CodeMirror-focused", "");
    }

    function updateLines(from, to, newText, selFrom, selTo) {
      if (typeof newText == "string") newText = newText.split(/\r?\n/g);
      if (history) {
        var old = [];
        for (var i = from.line, e = to.line + 1; i < e; ++i) old.push(lines[i].text);
        history.addChange(from.line, newText.length, old);
        while (history.done.length > options.undoDepth) history.done.shift();
      }
      updateLines1(from, to, newText, selFrom, selTo);
    }
    function unredoHelper(from, to) {
      var change = from.pop();
      if (change) {
        var replaced = [], end = change.start + change.added;
        for (var i = change.start; i < end; ++i) replaced.push(lines[i].text);
        to.push({start: change.start, added: change.old.length, old: replaced});
        var pos = clipPos({line: change.start + change.old.length - 1,
                           ch: editEnd(replaced[replaced.length-1], change.old[change.old.length-1])});
        updateLines1({line: change.start, ch: 0}, {line: end - 1, ch: lines[end-1].text.length}, change.old, pos, pos);
      }
    }
    function undo() {unredoHelper(history.done, history.undone);}
    function redo() {unredoHelper(history.undone, history.done);}

    function updateLines1(from, to, newText, selFrom, selTo) {
      // Update lines length and the associated DIVs
      var nlines = to.line - from.line, firstLine = lines[from.line], lastLine = lines[to.line];
      if (from.line == to.line) {
        if (newText.length == 1)
          firstLine.replace(from.ch, to.ch, newText[0]);
        else {
          var lastLine = firstLine.split(to.ch, newText[newText.length-1]);
          var spliceargs = [from.line + 1, nlines];
          firstLine.replace(from.ch, firstLine.text.length, newText[0]);
          for (var i = 1, e = newText.length - 1; i < e; ++i) spliceargs.push(new Line(newText[i]));
          spliceargs.push(lastLine);
          lines.splice.apply(lines, spliceargs);
        }
      }
      else if (newText.length == 1) {
        firstLine.replace(from.ch, firstLine.text.length, newText[0] + lastLine.text.slice(to.ch));
        lines.splice(from.line + 1, nlines);
      }
      else {
        var spliceargs = [from.line + 1, nlines - 1];
        firstLine.replace(from.ch, firstLine.text.length, newText[0]);
        lastLine.replace(0, to.ch, newText[newText.length-1]);
        for (var i = 1, e = newText.length - 1; i < e; ++i) spliceargs.push(new Line(newText[i]));
        lines.splice.apply(lines, spliceargs);
      }

      var newWork = [], lendiff = newText.length - nlines - 1;
      for (var i = 0, l = work.length; i < l; ++i) {
        var task = work[i];
        if (task < from.line) newWork.push(task);
        else if (task > to.line) newWork.push(task + lendiff);
      }
      if (newText.length) newWork.push(from.line);
      work = newWork;
      startWorker(100);
      changes.push({from: from.line, to: to.line + 1, diff: lendiff});
      textChanged = true;

      function updateLine(n) {return n <= Math.min(to.line, to.line + lendiff) ? n : n + lendiff;}
      setSelection(selFrom, selTo, updateLine(sel.from.line), updateLine(sel.to.line));

      space.style.height = (lines.length * lineHeight()) + "px";
    }

    function slowPoll() {
      poll.set(2000, function() {
        startOperation();
        readInput();
        if (focused) slowPoll();
        endOperation();
      });
    }
    function fastPoll(keyId) {
      var misses = 0;
      function p() {
        startOperation();
        var state = readInput();
        if (state == "moved" && keyId) movementKeys[keyId] = true;
        if (state) {poll.set(80, p); misses = 0;}
        else if (misses++ < 4) {poll.set(80, p);}
        else slowPoll();
        endOperation();
      }
      poll.set(20, p);
    }

    function readInput() {
      var changed = false, text = input.value, sr = selRange(input);
      if (!sr) return false;
      var changed = editing.text != text, rs = reducedSelection;
      var moved = changed || sr.start != editing.start || sr.end != (rs ? editing.start : editing.end);
      if (reducedSelection && !moved && sel.from.line == 0 && sel.from.ch == 0)
        reducedSelection = null;
      else if (!moved) return false;
      if (changed) {
        shiftSelecting = reducedSelection = null;
        if (options.readOnly) {updateInput = true; return "changed";}
      }

      function computeOffset(n, startLine) {
        var pos = 0;
        while (true) {
          var found = text.indexOf("\n", pos);
          if (found == -1 || (text.charAt(found-1) == "\r" ? found - 1 : found) >= n)
            return {line: startLine, ch: n - pos};
          ++startLine;
          pos = found + 1;
        }
      }
      var from = computeOffset(sr.start, editing.from),
          to = computeOffset(sr.end, editing.from);
      if (rs) {
        from = sr.start == rs.anchor ? to : from;
        to = shiftSelecting ? sel.to : sr.start == rs.anchor ? from : to;
        if (!posLess(from, to)) {
          reducedSelection = null;
          sel.inverted = false;
          var tmp = from; from = to; to = tmp;
        }
      }

      if (from.line == to.line && from.line == sel.from.line && from.line == sel.to.line)
        updateInput = false;
      if (changed) {
        // TODO clean this up. it's awful. seriously
        var start = 0, end = text.length, len = Math.min(end, editing.text.length);
        var c, line = editing.from, nl = -1;
        while (start < len && (c = text.charAt(start)) == editing.text.charAt(start)) {
          ++start;
          if (c == "\n") {line++; nl = start;}
        }
        var ch = nl > -1 ? start - nl : start, endline = editing.to - 1, edend = editing.text.length;
        for (;;) {
          c = editing.text.charAt(edend);
          if (c == "\n") endline--;
          if (text.charAt(end) != c) {++end; ++edend; break;}
          if (edend <= start || end <= start) break;
          --end; --edend;
        }
        var nl = editing.text.lastIndexOf("\n", edend - 1), endch = nl == -1 ? edend : edend - nl - 1;
        updateLines({line: line, ch: ch}, {line: endline, ch: endch}, text.slice(start, end), from, to);
        shiftSelecting = null;
        if (line != endline || from.line != line) updateInput = true;
      }
      else setSelection(from, to);

      editing.text = text; editing.start = sr.start; editing.end = sr.end;
      return changed ? "changed" : moved ? "moved" : false;
    }

    function prepareInput() {
      var text = [];
      var from = Math.max(0, sel.from.line - 1), to = Math.min(lines.length, sel.to.line + 2);
      for (var i = from; i < to; ++i) text.push(lines[i].text);
      text = input.value = text.join(lineSep);
      var startch = sel.from.ch, endch = sel.to.ch;
      for (var i = from; i < sel.from.line; ++i)
        startch += lineSep.length + lines[i].text.length;
      for (var i = from; i < sel.to.line; ++i)
        endch += lineSep.length + lines[i].text.length;
      editing = {text: text, from: from, to: to, start: startch, end: endch};
      setSelRange(input, startch, reducedSelection ? startch : endch);
    }

    function scrollCursorIntoView() {
      var cursor = localCursorCoords(sel.inverted);
      cursor.x += space.offsetLeft; cursor.y += space.offsetTop;
      var screen = code.clientHeight, screentop = code.scrollTop;
      if (cursor.y < screentop)
        code.scrollTop = Math.max(0, cursor.y - 10);
      else if ((cursor.y += lineHeight()) > screentop + screen)
        code.scrollTop = (cursor.y + 10) - screen;

      var screenw = space.offsetWidth, screenleft = code.scrollLeft;
      if (cursor.x < screenleft)
        code.scrollLeft = Math.max(0, cursor.x - 10);
      else if (cursor.x > screenw + screenleft)
        code.scrollLeft = (cursor.x + 10) - screenw;
    }

    function updateDisplay(changes) {
      if (!code.clientWidth) return;
      var lh = lineHeight(), top = code.scrollTop - space.offsetTop;
      var visibleFrom = Math.max(0, Math.floor(top / lh));
      var visibleTo = Math.min(lines.length, Math.ceil((top + div.clientHeight) / lh));

      var intact = [{from: showingFrom, to: showingTo, at: 0}];
      for (var i = 0, l = changes ? changes.length : 0; i < l; ++i) {
        var change = changes[i], intact2 = [], diff = change.diff || 0;
        for (var j = 0, l2 = intact.length; j < l2; ++j) {
          var range = intact[j];
          if (change.to <= range.from)
            intact2.push({from: range.from + diff, to: range.to + diff, at: range.at});
          else if (range.to <= change.from)
            intact2.push(range);
          else {
            if (change.from > range.from)
              intact2.push({from: range.from, to: change.from, at: range.at})
            if (change.to < range.to)
              intact2.push({from: change.to + diff, to: range.to + diff,
                            at: range.at + (change.to - range.from)});
          }
        }
        intact = intact2;
      }

      var from = Math.min(showingFrom, Math.max(visibleFrom - 3, 0)),
          to = Math.min(lines.length, Math.max(showingTo, visibleTo + 3)),
          updates = [], pos = from, at = from - showingFrom, changedLines = 0, added = 0;
      if (at > 0) {updates.push({from: pos, to: pos, size: at, at: 0}); added -= at;}
      else if (at < 0) {at = 0; pos -= at;}

      for (var i = 0, l = intact.length; i < l; ++i) {
        var range = intact[i];
        if (range.to <= pos) continue;
        if (range.from >= to) break;
        if (range.from > pos) {
          var size = range.at - at;
          updates.push({from: pos, to: range.from, size: size, at: at});
          changedLines += range.from - pos;
          added += (range.from - pos) - size;
        }
        pos = range.to;
        at = range.at + (range.to - range.from);
      }
      if (pos < to) {
        var size = Math.max(0, (showingTo + added) - pos);
        changedLines += to - pos;
        updates.push({from: pos, to: to, size: size, at: at});
      }
      if (!updates.length) return;
      // TODO heuristic, do some tests
      if (changedLines > (visibleTo - visibleFrom) * .3)
        refreshDisplay(visibleFrom, visibleTo);
      else
        patchDisplay(updates, from, to);
    }

    function refreshDisplay(from, to) {
      from = Math.max(from - 10, 0); to = Math.min(to + 10, lines.length);
      var html = [], start = {line: from, ch: 0}, inSel = posLess(sel.from, start) && !posLess(sel.to, start);
      for (var i = from; i < to; ++i) {
        var ch1 = null, ch2 = null;
        if (inSel) {
          ch1 = 0;
          if (sel.to.line == i) {inSel = false; ch2 = sel.to.ch;}
        }
        else if (sel.from.line == i) {
          if (sel.to.line == i) {ch1 = sel.from.ch; ch2 = sel.to.ch;}
          else {inSel = true; ch1 = sel.from.ch;}
        }
        html.push("<div>", lines[i].getHTML(ch1, ch2), "</div>");
      }
      lineDiv.innerHTML = html.join("");
      showingFrom = from; showingTo = to;
      mover.style.top = (from * lineHeight()) + "px";
      updateGutter();
    }
    // TODO has been observed to leave nodes at bottom of document
    function patchDisplay(updates, from, to) {
      // TODO optimize DOM manipulation
      var sfrom = sel.from.line, sto = sel.to.line, off = 0;
      for (var i = 0, e = updates.length; i < e; ++i) {
        var rec = updates[i];
        var extra = (rec.to - rec.from) - rec.size;
        if (extra) {
          var nodeAfter = lineDiv.childNodes[rec.at + off + rec.size] || null;
          for (var j = Math.max(0, -extra); j > 0; --j)
            lineDiv.removeChild(nodeAfter ? nodeAfter.previousSibling : lineDiv.lastChild);
          for (var j = Math.max(0, extra); j > 0; --j)
            lineDiv.insertBefore(document.createElement("div"), nodeAfter);
        }
        var node = lineDiv.childNodes[rec.at + off], inSel = sfrom < rec.from && sto >= rec.from;
        for (var j = rec.from; j < rec.to; ++j) {
          var ch1 = null, ch2 = null;
          if (inSel) {
            ch1 = 0;
            if (sto == j) {inSel = false; ch2 = sel.to.ch;}
          }
          else if (sfrom == j) {
            if (sto == j) {ch1 = sel.from.ch; ch2 = sel.to.ch;}
            else {inSel = true; ch1 = sel.from.ch;}
          }
          node.innerHTML = lines[j].getHTML(ch1, ch2);
          node = node.nextSibling;
        }
        off += extra;
      }
      showingFrom = from; showingTo = to;

      mover.style.top = (from * lineHeight()) + "px";
      if (off) updateGutter();
    }
    function updateGutter() {
      if (gutter.style.display == "none") return;
      gutter.style.height = Math.max(lineDiv.offsetHeight, code.clientHeight - 2 * space.offsetTop) + "px";
      var html = [];
      if (options.lineNumbers)
        for (var i = showingFrom; i < showingTo; ++i)
          html.push("<div>" + (i + 1) + "</div>");
      gutter.innerHTML = html.join("");
      lineDiv.parentNode.style.marginLeft = gutter.offsetWidth + "px";
    }

    function setSelection(from, to, oldFrom, oldTo) {
      if (posEq(sel.from, from) && posEq(sel.to, to)) return;
      var sh = shiftSelecting;
      if (posLess(to, from)) {var tmp = to; to = from; from = tmp;}
      if (sh) {
        if (posLess(sh, from)) from = sh;
        else if (posLess(to, sh)) to = sh;
      }

      var startEq = posEq(sel.to, to), endEq = posEq(sel.from, from);
      if (posEq(from, to)) sel.inverted = false;
      else if (startEq && !endEq) sel.inverted = true;
      else if (endEq && !startEq) sel.inverted = false;

      // TODO leave lines that had only a cursor alone
      if (oldFrom == null) {oldFrom = sel.from.line; oldTo = sel.to.line;}
      if (posEq(from, to)) {
        if (!posEq(sel.from, sel.to))
          changes.push({from: oldFrom, to: oldTo + 1});
      }
      else if (posEq(sel.from, sel.to)) {
        changes.push({from: from.line, to: to.line + 1});
      }
      else {
        if (!posEq(from, sel.from)) {
          if (from.line < oldFrom)
            changes.push({from: from.line, to: Math.min(to.line, oldFrom) + 1});
          else
            changes.push({from: oldFrom, to: Math.min(oldTo, from.line) + 1});
        }
        if (!posEq(to, sel.to)) {
          if (to.line < oldTo)
            changes.push({from: Math.max(oldFrom, from.line), to: oldTo + 1});
          else
            changes.push({from: Math.max(from.line, oldTo), to: to.line + 1});
        }
      }
      sel.from = from; sel.to = to;
      selectionChanged = true;
    }

    function updateCursor() {
      var head = sel.inverted ? sel.from : sel.to;
      var x = charX(head.line, head.ch) + "px", y = (head.line - showingFrom) * lineHeight() + "px";
      inputDiv.style.top = y; inputDiv.style.left = x;
      if (posEq(sel.from, sel.to)) {
        cursor.style.top = y; cursor.style.left = x;
        cursor.style.display = "";
      }
      else cursor.style.display = "none";
    }
    function clipPos(pos) {
      if (pos.line < 0) return {line: 0, ch: 0};
      if (pos.line >= lines.length) return {line: lines.length-1, ch: lines[lines.length-1].text.length};
      var ch = pos.ch;
      if (ch < 0) ch = 0;
      else if (ch > lines[pos.line].text.length) ch = lines[pos.line].text.length;
      return ch == pos.ch ? pos : {line: pos.line, ch: ch};
    }
    function setCursor(line, ch) {
      var pos = clipPos({line: line, ch: ch || 0});
      setSelection(pos, pos);
    }
    function scrollPage(down) {
      var linesPerPage = Math.floor(div.clientHeight / lineHeight()), head = sel.inverted ? sel.from : sel.to;
      setCursor(head.line + (Math.max(linesPerPage - 1, 1) * (down ? 1 : -1)), head.ch);
    }
    function scrollEnd(top) {
      setCursor(top ? 0 : lines.length - 1);
    }
    function selectAll() {
      var endLine = lines.length - 1;
      setSelection({line: 0, ch: 0}, {line: endLine, ch: lines[endLine].text.length});
    }
    function selectWordAt(pos) {
      var line = lines[pos.line].text;
      var start = pos.ch, end = pos.ch;
      while (start > 0 && /\w/.test(line.charAt(start - 1))) --start;
      while (end < line.length - 1 && /\w/.test(line.charAt(end))) ++end;
      setSelection({line: pos.line, ch: start}, {line: pos.line, ch: end});
    }
    function insertNewline() {
      replaceSelection("\n", "end");
      indentLine(sel.from.line);
    }
    function handleTab() {
      for (var i = sel.from.line, e = sel.to.line; i <= e; ++i)
        indentLine(i);
    }
    function indentLine(n) {
      var state = getStateBefore(n);
      if (!state) return;
      var text = lines[n].text;
      var curSpace = text.match(/^\s*/)[0].length;
      var indentation = parser.indent(state, text.slice(curSpace)), diff = indentation - curSpace;
      if (!diff) return;

      var from = copyPos(sel.from), to = copyPos(sel.to);
      if (from.line == n) from.ch = Math.max(indentation, from.ch + diff);
      if (to.line == n) to.ch = Math.max(indentation, to.ch + diff);

      if (diff > 0) {
        var space = "";
        for (var i = 0; i < diff; ++i) space = space + " ";
        updateLines({line: n, ch: 0}, {line: n, ch: 0}, space, from, to);
      }
      else
        updateLines({line: n, ch: 0}, {line: n, ch: -diff}, "", from, to);
    }

    function replaceRange(code, from, to) {
      from = clipPos(from);
      if (!to) to = from; else to = clipPos(to);
      function adjustPos(pos) {
        if (posLess(pos, from)) return pos;
        if (posLess(pos, to)) return end;
        if (pos.line == to.line) return {line: end.line, ch: pos.ch + end.ch - to.ch};
        return {line: pos.line + end.line - to.line, ch: pos.ch};
      }
      var end;
      replaceRange1(code, from, to, function(end1) {
        end = end1;
        return {from: adjustPos(sel.from), to: adjustPos(sel.to)};
      });
      return end;
    }
    function replaceRange1(code, from, to, computeSel) {
      var nl = code.indexOf("\n"), nls = 0;
      for (var i = code.indexOf("\n", nl + 1); i > -1; ++i) {++nls; nl = i;}
      var endch = nl == -1 ? code.length : code.length - nl - 1;
      var diff = (to.line - from.line + 1) - nls;
      var newSel = computeSel({line: to.line + diff, ch: endch});
      updateLines(from, to, code, newSel.from, newSel.to);
    }

    function replaceSelection(code, collapse) {
      replaceRange1(code, sel.from, sel.to, function(end) {
        if (collapse == "end") return {from: end, to: end};
        else if (collapse == "start") return {from: sel.from, to: sel.from};
        else return {from: sel.from, to: end};
      });
    }
    function getSelection(lineSep) {
      var l1 = sel.from.line, l2 = sel.to.line;
      if (l1 == l2) return lines[l1].text.slice(sel.from.ch, sel.to.ch);
      var code = [lines[l1].text.slice(sel.from.ch)];
      for (var i = l1 + 1; i < l2; ++i) code.push(lines[i].text);
      code.push(lines[l2].text.slice(0, sel.to.ch));
      return code.join(lineSep || "\n");
    }

    function setParser(pname, config) {
      var pfactory = parsers[pname];
      if (!pfactory) throw new Error("No parser " + pname + " found.");
      parser = pfactory(options, config);
      for (var i = 0, l = lines.length; i < l; ++i)
        lines[i].stateAfter = null;
      work = [0];
    }
    function setLineNumbers(on) {
      options.lineNumbers = on;
      gutter.style.display = on ? "" : "none";
      if (on) updateGutter();
    }

    function charX(line, pos) {
      var text = lines[line].text;
      if (text.lastIndexOf("\t", pos) == -1) return pos * charWidth();
      try {
        measure.firstChild.firstChild.nodeValue = text.slice(0, pos);
        return measure.firstChild.offsetWidth;
      } finally {measure.firstChild.firstChild.nodeValue = "-";}
    }
    function charFromX(line, x) {
      var text = lines[line].text, cw = charWidth();
      if (text.indexOf("\t") == -1) return Math.min(text.length, Math.round(x / cw));
      var mspan = measure.firstChild, mtext = mspan.firstChild;
      try {
        var from = 0, to = text.length;
        for (;;) {
          if (to - from <= 1) return from;
          var middle = Math.ceil((from + to) / 2);
          mtext.nodeValue = text.slice(0, middle);
          if (mspan.offsetWidth > x) to = middle;
          else from = middle;
        }
      } finally {mtext.nodeValue = "-";}
    }
    function localCursorCoords(start) {
      var head = start ? sel.from : sel.to;
      return {x: charX(head.line, head.ch), y: head.line * lineHeight()};
    }
    function cursorCoords(start) {
      var local = localCursorCoords(start), off = eltOffset(space);
      return {x: off.left + local.x, y: off.top + local.y, yBot: off.top + local.y + lineHeight()};
    }

    // TODO does this always hold? deal with hidden editor
    function lineHeight() {
      var nlines = lineDiv.childNodes.length;
      if (nlines) return lineDiv.offsetHeight / nlines;
      else return measure.offsetHeight || 1;
    }
    function charWidth() {return measure.firstChild.offsetWidth || 1;}

    function posFromMouse(e) {
      var off = eltOffset(lineDiv),
          x = e.pageX() - off.left,
          y = e.pageY() - off.top;
      if (e.target() == code && y < (lines.length * lineHeight())) return null;
      var line = showingFrom + Math.floor(y / lineHeight()), clipLine = Math.min(Math.max(0, line), lines.length-1);
      return clipPos({line: line, ch: charFromX(clipLine, x)});
    }

    function restartBlink() {
      clearInterval(blinker);
      var on = true;
      cursor.style.visibility = "";
      blinker = setInterval(function() {
        cursor.style.visibility = (on = !on) ? "" : "hidden";
      }, 650);
    }
    function markText(from, to, className) {
      from = clipPos(from); to = clipPos(to);
      var accum = [];
      function add(line, from, to, className) {
        var line = lines[line], mark = line.addMark(from, to, className);
        mark.line = line;
        accum.push(mark);
      }
      if (from.line == to.line) add(from.line, from.ch, to.ch, className);
      else {
        add(from.line, from.ch, null, className);
        for (var i = from.line + 1, e = to.line; i < e; ++i)
          add(i, 0, null, className);
        add(to.line, 0, to.ch, className);
      }
      changes.push({from: from.line, to: to.line + 1});
      return function() {
        var start, end;
        for (var i = 0; i < accum.length; ++i) {
          var mark = accum[i], found = lines.indexOf(mark.line);
          mark.line.removeMark(mark);
          if (found > -1) {
            if (start == null) start = found;
            end = found;
          }
        }
        if (start != null) changes.push({from: start, to: end + 1});
      };
    }

    var matching = {"(": ")>", ")": "(<", "[": "]>", "]": "[<", "{": "}>", "}": "{<"};
    function matchBrackets() {
      var head = sel.inverted ? sel.from : sel.to, line = lines[head.line], pos = head.ch - 1;
      var match = (pos >= 0 && matching[line.text.charAt(pos)]) || matching[line.text.charAt(++pos)];
      if (!match) return;
      var ch = match.charAt(0), forward = match.charAt(1) == ">", d = forward ? 1 : -1, st = line.styles;
      for (var off = forward ? pos + 1 : pos, i = 0, e = st.length; i < st; i+=2)
        if ((off -= st[i].length) <= 0) {var style = st[i+1]; break;}

      var stack = [line.text.charAt(pos)], re = /[(){}[\]]/;
      function scan(line, from, to) {
        if (!line.text) return;
        var st = line.styles, pos = forward ? 0 : line.text.length - 1, cur;
        for (var i = forward ? 0 : st.length - 2, e = forward ? st.length : -2; i != e; i += 2*d) {
          var text = st[i];
          if (st[i+1] != null && st[i+1] != style) {pos += d * text.length; continue;}
          for (var j = forward ? 0 : text.length - 1, te = forward ? text.length : -1; j != te; j += d, pos+=d) {
            if (pos >= from && pos < to && re.test(cur = text.charAt(j))) {
              var match = matching[cur];
              if (match.charAt(1) == ">" == forward) stack.push(cur);
              else if (stack.pop() != match.charAt(0)) return {pos: pos, match: false};
              else if (!stack.length) return {pos: pos, match: true};
            }
          }
        }
      }
      for (var i = head.line, e = forward ? Math.min(i + 30, lines.length) : Math.max(0, i - 30); i != e; i+=d) {
        var line = lines[i], first = i == head.line;
        var found = scan(line, first && forward ? pos + 1 : 0, first && !forward ? pos : line.text.length);
        if (found) {
          var style = found.match ? "CodeMirror-matchingbracket" : "CodeMirror-nonmatchingbracket";
          var one = markText({line: head.line, ch: pos}, {line: head.line, ch: pos+1}, style),
              two = markText({line: i, ch: found.pos}, {line: i, ch: found.pos + 1}, style);
          bracketHighlighted = operation(function(){one(); two();});
          break;
        }
      }
    }

    function getStateBefore(n) {
      var state;
      for (var search = n - 1, lim = n - 40;; --search) {
        if (search < 0) {state = parser.startState(); break;}
        if (search < lim) return null;
        if (state = lines[search].stateAfter) {state = copyState(state); break;}
      }
      for (++search; search < n; ++search) {
        var line = lines[search];
        line.highlight(parser, state);
        line.stateAfter = copyState(state);
      }
      if (!lines[n].stateAfter) work.push(n);
      return state;
    }
    function highlightWorker(start) {
      // TODO have a mode where the document is always parsed to the end (?)
      var end = +new Date + options.workTime;
      while (work.length) {
        if (!lines[showingFrom].stateAfter) var task = showingFrom;
        else var task = work.pop()
        if (task >= lines.length || lines[task].stateAfter) continue;
        for (var i = task - 1, e = Math.max(0, task - 50); i >= e && !state; --i)
          var state = lines[i].stateAfter;
        if (state) state = copyState(state);
        else state = parser.startState(); // TODO hack to approximate proper state for non-0 lines

        for (var i = task, l = lines.length; i < l; ++i) {
          var line = lines[i];
          if (line.stateAfter) break;
          if (+new Date > end) {
            work.push(i);
            startWorker(options.workDelay);
            break;
          }
          line.highlight(parser, state);
          line.stateAfter = copyState(state);
        }
        changes.push({from: task, to: i});
      }
    }
    function startWorker(time) {
      if (!work.length) return;
      highlight.set(time, operation(highlightWorker));
    }

    function startOperation() {
      updateInput = null; changes = []; textChanged = false; selectionChanged = false;
    }
    function endOperation() {
      if (selectionChanged) scrollCursorIntoView();
      if (changes.length) updateDisplay(changes);
      if (selectionChanged) {updateCursor(); restartBlink();}
      if (updateInput === true || (updateInput !== false && selectionChanged))
        setTimeout(prepareInput, 20);

      if (selectionChanged && options.onCursorActivity)
        options.onCursorActivity(instance);
      if (textChanged && options.onChange)
        options.onChange(instance);
      if (selectionChanged && options.autoMatchBrackets)
        setTimeout(operation(function() {
          if (bracketHighlighted) {bracketHighlighted(); bracketHighlighted = null;}
          matchBrackets();
        }), 20);
    }
    var nestedOperation = 0;
    function operation(f) {
      return function() {
        if (!nestedOperation++) startOperation();
        try {var result = f.apply(this, arguments);}
        finally {if (!--nestedOperation) endOperation();}
        return result;
      };
    }

    function SearchCursor(query, pos, caseFold) {
      this.atOccurrence = false;
      if (caseFold == undefined) caseFold = typeof query == "string" && query == query.toLowerCase();

      if (pos == "cursor") pos = sel.from;
      else if (pos && typeof pos == "object") pos = clipPos(pos);
      else pos = {line: 0, ch: 0};
      this.pos = {from: pos, to: pos};

      if (typeof query != "string") // Regexp match
        this.matches = function(reverse, pos) {
          if (reverse) {
            var line = lines[pos.line].text.slice(0, pos.ch), match = line.match(query), start = 0;
            while (match) {
              var ind = line.indexOf(match[0]);
              start += ind;
              line = line.slice(ind + 1);
              var newmatch = line.match(query);
              if (newmatch) match = newmatch;
              else break;
            }
          }
          else {
            var line = lines[pos.line].text.slice(pos.ch), match = line.match(query),
                start = match && pos.ch + line.indexOf(match[0]);
          }
          if (match)
            return {from: {line: pos.line, ch: start},
                    to: {line: pos.line, ch: start + match[0].length},
                    match: match};
        };
      else { // String match
        if (caseFold) query = query.toLowerCase();
        var fold = caseFold ? function(str){return str.toLowerCase();} : function(str){return str;};
        var target = query.split("\n");
        if (target.length == 1)
          this.matches = function(reverse, pos) {
            var line = fold(lines[pos.line].text), len = query.length, match;
            if (reverse ? (pos.ch >= len && (match = line.lastIndexOf(query, pos.ch - len)) != -1)
                        : (match = line.indexOf(query, pos.ch)) != -1)
              return {from: {line: pos.line, ch: match},
                      to: {line: pos.line, ch: match + len}};
          };
        else
          this.matches = function(reverse, pos) {
            var ln = pos.line, idx = (reverse ? target.length - 1 : 0), match = target[idx], line = fold(lines[ln].text);
            var offsetA = (reverse ? line.indexOf(match) + match.length : line.lastIndexOf(match));
            if (reverse ? offsetA >= pos.ch || offsetA != match.length
                        : offsetA <= pos.ch || offsetA != line.length - match.length)
              return;
            while (true) {
              if (reverse ? !ln : ln == lines.length - 1) return;
              line = fold(lines[ln += reverse ? -1 : 1].text);
              match = target[reverse ? --idx : ++idx];
              if (idx > 0 && idx < target.length - 1) {
                if (line != match) return;
                else continue;
              }
              var offsetB = (reverse ? line.lastIndexOf(match) : line.indexOf(match) + match.length);
              if (reverse ? offsetB != line.length - match.length : offsetB != match.length)
                return;
              var start = {line: pos.line, ch: offsetA}, end = {line: ln, ch: offsetB};
              return {from: reverse ? end : start, to: reverse ? start : end};
            }
          };
      }
    }

    SearchCursor.prototype = {
      findNext: function() {return this.find(false);},
      findPrevious: function() {return this.find(true);},

      find: function(reverse) {
        var self = this, pos = clipPos(reverse ? this.pos.from : this.pos.to);
        function savePosAndFail(line) {
          var pos = {line: line, ch: 0};
          self.pos = {from: pos, to: pos};
          self.atOccurrence = false;
          return false;
        }

        while (true) {
          if (this.pos = this.matches(reverse, pos))
            return this.atOccurrence = true;

          if (reverse) {
            if (!pos.line) return savePosAndFail(0);
            pos = {line: pos.line-1, ch: lines[pos.line-1].text.length};
          }
          else {
            if (pos.line == lines.length - 1) return savePosAndFail(lines.length);
            pos = {line: pos.line+1, ch: 0};
          }
        }
      },

      select: operation(function() {
        if (this.atOccurrence)
          setSelection(clipPos(this.pos.from), clipPos(this.pos.to));
      }),

      replace: operation(function(string) {
        if (this.atOccurrence) {
          var fragments = this.pos.match;
          if (fragments)
            string = string.replace(/\\(\d)/, function(m, i){return fragments[i];});
          this.pos.to = replaceRange(string, clipPos(this.pos.from), clipPos(this.pos.to));
          this.atOccurrence = false;
        }
      }),

      position: function() {
        if (this.atOccurrence) return {line: this.pos.from.line, ch: this.pos.from.ch};
      }
    };

    function isLine(l) {return l >= 0 && l < lines.length;}
    
    var instance = {
      getValue: getValue,
      setValue: operation(setValue),
      getSelection: getSelection,
      replaceSelection: operation(replaceSelection),
      focus: function(){input.focus(); onFocus();},
      setParser: setParser,
      setLineNumbers: setLineNumbers,
      setReadOnly: function(on) {options.readOnly = on;},
      cursorCoords: cursorCoords,
      undo: operation(undo),
      redo: operation(redo),
      getSearchCursor: function(query, pos, caseFold) {return new SearchCursor(query, pos, caseFold);},
      markText: operation(function(a, b, c){return operation(markText(a, b, c));}),
      matchBrackets: operation(matchBrackets),

      lineCount: function() {return lines.length;},
      getCursor: function(start) {var p = start ? sel.from : sel.to; return {line: p.line, ch: p.ch};},
      setCursor: operation(function(line, ch) {
        if (ch == null && typeof line.line == "number") setCursor(line.line, line.ch);
        else setCursor(line, ch);
      }),
      setSelection: operation(function(start, end) {setSelection(clipPos(start), end ? clipPos(end) : start);}),
      getLine: function(line) {if (isLine(line)) return lines[line].text;},
      setLine: operation(function(line, text) {
        if (isLine(line)) replaceRange(text, {line: line, ch: 0}, {line: line, ch: lines[line].text.length});
      }),
      removeLine: operation(function(line) {
        if (isLine(line)) replaceRange("", {line: line, ch: 0}, {line: line+1, ch: 0});
      }),
      replaceRange: operation(replaceRange),

      operation: function(f){return operation(f)();},
      refresh: function(){updateDisplay([{from: 0, to: lines.length}]);}
    };
    return instance;
  }

  CodeMirror.defaults = {
    value: "",
    indentUnit: 2,
    parser: null,
    parserConfig: null,
    lineNumbers: false,
    firstLineNumber: 1,
    readOnly: false,
    onChange: null,
    onCursorActivity: null,
    autoMatchBrackets: false,
    workTime: 200,
    workDelay: 300,
    undoDepth: 40,
    tabindex: null
  };

  var parsers = {};
  CodeMirror.addParser = function(name, parser) {
    if (!CodeMirror.defaults.parser) CodeMirror.defaults.parser = name;
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
      textarea.parentNode.removeChild(instance.div);
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
      else var ok = ch && (match.test ? match.test(ch) : match(ch));
      if (ok) {++this.pos; return ch;}
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
      while (/\s/.test(this.string.charAt(this.pos))) ++this.pos;
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
