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
    var x = 0, y = 0;
    while (node) {
      x += node.offsetLeft; y += node.offsetTop;
      node = node.offsetParent;
      if (node && node != document.body) {
        x -= node.scrollLeft || 0; y -= node.scrollLeft || 0;
      }
    }
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
    if (!to) return 0;
    if (!from) return to.length;
    for (var i = from.length, j = to.length; i >= 0 && j >= 0; --i, --j)
      if (from.charAt(i) != to.charAt(j)) break;
    return j + 1;
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

  function Line(div) {
    this.div = div; this.styles = []; this.stateAfter = this.text = null;
  }
  Line.prototype = {
    setText: function(text) {
      this.text = text;
      var st = this.styles;
      // Hack to preserve styling of unchanged start and end of line
      if (text && st.length > 2) {
        var from = 0, to = text.length, sfrom = 0, sto = st.length - 2;
        for (var cmp = st[sfrom]; from < to && sfrom < sto && text.indexOf(cmp, from) == from;) {
          from += cmp.length; cmp = st[sfrom += 2];
        }
        for (var cmp = st[sto]; to > from && sto > sfrom && text.lastIndexOf(cmp, to) == to - cmp.length; ) {
          to -= cmp.length; cmp = st[sto -= 2];
        }
        st.splice(sfrom, sto + 2 - sfrom, text.slice(from, to), null);
      }
      else if (text) st.splice(0, st.length, text, null);
      else st.length = 0;
      this.stateAfter = null;
      this.updateDOM();
    },
    setSelection: function(from, to) {
      if (this.selFrom != from || this.selTo != to) {
        this.selFrom = from; this.selTo = to;
        this.updateDOM();
      }
    },
    highlight: function(parser, state) {
      var stream = new StringStream(this.text), st = this.styles;
      st.length = 0;
      while (!stream.done()) {
        var start = stream.pos, style = parser.token(stream, state, start == 0);
        var substr = this.text.slice(start, stream.pos);
        if (st.length && st[st.length-1] == style)
          st[st.length-2] += substr;
        else if (substr) {
          this.styles.push(substr);
          this.styles.push(style);
        }
      }
      this.updateDOM();
    },
    updateDOM: function() {
      var html = [], st = this.styles, pos = 0;
      var sfrom = this.selFrom, sto = this.selTo, sel = sfrom == null ? 2 : 0;
      function addPiece(text, style, last) {
        var cls = style, len = text.length, cut;
        if (sel === 0) {
          var off = sfrom - pos;
          if (off === 0) {
            if (sfrom === sto) {sel = 2; html.push("<span class=\"CodeMirror-cursor\"></span>");}
            else sel = 1;
          }
          else if (off <= len && off < len) cut = off;
        }
        if (sel === 1 && sto != null) {
          var off = sto - pos;
          if (off === 0) sel = 2;
          else if (off < len) cut = off;
        }
        if (sel === 1) cls += " CodeMirror-selected";
        html.push("<span" + (cls ? " class=\"" + cls + "\">" : ">") +
                  prepareCode(cut == null ? text : text.slice(0, cut)) + "</span>");
        pos += cut || len;
        if (cut) addPiece(text.slice(cut), style, last);
      }
      for (var i = 0, l = st.length; i < l; i+=2)
        addPiece(st[i], st[i+1] || "");
      var empty = !html.html;
      if (!empty && pos === sfrom && sfrom === sto) html.push("<span class=\"CodeMirror-cursor\"></span>");
      if (sel === 1 && sto == null) html.push("<span class=\"CodeMirror-selected\"> </span>");
      else if (empty) addPiece(" ", "");
      this.div.innerHTML = html.join("");
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
    if (place.appendChild) place.appendChild(div); else place(div);
    div.className = "CodeMirror";
    var input = div.appendChild(document.createElement("textarea"));
    input.style.position = "absolute";
    input.style.width = "10000px";
    input.style.padding = "0";
    input.style.left = input.style.top = "-100000px";
    var code = div.appendChild(document.createElement("div"));
    code.className = "CodeMirror-code";
    var measure = code.appendChild(document.createElement("span"));
    measure.style.position = "absolute";
    measure.style.visibility = "hidden";
    measure.innerHTML = "-";

    if (options.lineNumbers) {
      var lineNumbers = code.appendChild(document.createElement("div"));
      lineNumbers.className = "CodeMirror-line-numbers";
    }

    var poll = new Delayed(), highlight = new Delayed(), blinker;

    var parser, lines = [], work, history = new History();
    setParser(options.parser);
    var zero = {line: 0, ch: 0};
    var sel = {from: zero, to: zero, inverted: false}, prevSel = {from: zero, to: zero};
    var shiftSelecting, reducedSelection, focused, updateInput, textChanged;
    setValue(options.value || "");
    displaySelection();
    restartBlink();
    setTimeout(prepareInput, 0);

    connect(code, "mousedown", operation(onMouseDown));
    connect(code, "dblclick", operation(onDblClick));
    connect(input, "keyup", operation(onKeyUp));
    connect(input, "keydown", operation(onKeyDown));
    connect(input, "focus", onFocus);
    connect(input, "blur", onBlur);

    connect(code, "dragenter", function(e){e.stop();});
    connect(code, "dragover", function(e){e.stop();});
    connect(code, "drop", operation(onDrop));
    connect(code, "paste", function(){input.focus(); fastPoll();});
    connect(input, "paste", fastPoll);

    if (document.activeElement == input) onFocus();
    else onBlur();

    function setValue(code) {
      history = null;
      updateLines(0, lines.length, code.split(/\r?\n/g));
      setCursor(0);
      history = new History();
    }
    function getValue(code) {
      var text = [];
      for (var i = 0, l = lines.length; i < l; ++i)
        text.push(lines[i].text);
      return text.join("\n");
    }

    function onMouseDown(e) {
      var start = mouseEventPos(e), last = start;
      if (!start) return;
      setCursor(start.line, start.ch, false);
      if (e.button() != 1) return;

      e.stop();
      function end() {
        if (!focused) {input.focus(); onFocus();}
        updateInput = true;
        move(); up(); leave();
      }

      var move = connect(document, "mousemove", operation(function(e) {
        var cur = mouseEventPos(e);
        if (cur && !posEq(cur, last)) {
          last = cur;
          setSelection(start, cur);
        }
      }), true);
      var up = connect(document, "mouseup", operation(function(e) {
        var cur = mouseEventPos(e);
        if (cur) setSelection(start, cur);
        e.stop();
        end();
      }), true);
      var leave = connect(document, "mouseout", operation(function(e) {
        if (e.target() == document.body) end();
      }), true);
    }
    function onDblClick(e) {
      var pos = mouseEventPos(e);
      if (!pos) return;
      selectWordAt(pos);
      e.stop();
    }
    function onDrop(e) {
      try {var text = e.e.dataTransfer.getData("Text");}
      catch(e){}
      if (!text || options.readOnly) return;
      var pos = mouseEventPos(e);
      if (pos) {
        setSelection(pos, pos);
        replaceSelection(text);
      }
    }
    function onKeyDown(e) {
      if (!focused) onFocus();

      var code = e.e.keyCode, ctrl = e.e.ctrlKey && !e.e.altKey;

      if (code == 33 || code == 34) {scrollPage(code == 34); e.stop();} // page up/down
      else if (ctrl && (code == 36 || code == 35)) {scrollEnd(code == 36); e.stop();} // ctrl-home/end
      else if (ctrl && code == 65) {selectAll(); e.stop();} // ctrl-a
      else if (!ctrl && code == 13) {insertNewline(); e.stop();} // enter
      else if (!ctrl && code == 9) {handleTab(); e.stop();} // tab
      else if (ctrl && code == 90) {undo(); e.stop();} // ctrl-z
      else if (ctrl && (event.shiftKey && code == 90) || code == 89) {redo(); e.stop();} // ctrl-shift-z, ctrl-y
      else if (code == 16) {shiftSelecting = sel.inverted ? sel.to : sel.from;} // shift
      else {
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
    }
    function onKeyUp(e) {
      if (reducedSelection) {
        reducedSelection = null;
        prepareInput();
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

    function updateLines(from, to, newText) {
      // Make sure only changed lines are replaced
      while (from < to && newText[0] == lines[from].text) {
        ++from; newText.shift();
      }
      while (to > from + 1 && newText[newText.length-1] == lines[to-1].text) {
        --to; newText.pop();
      }
      if (from == to && !newText.length) return;

      if (history) {
        var old = [];
        for (var i = from; i < to; ++i) old.push(lines[i].text);
        history.addChange(from, newText.length, old);
        while (history.done.length > options.undoDepth) history.done.shift();
      }
      updateLines1(from, to, newText);
    }
    function unredoHelper(from, to) {
      var change = from.pop();
      if (change) {
        var replaced = [], end = change.start + change.added;
        for (var i = change.start; i < end; ++i) replaced.push(lines[i].text);
        updateLines1(change.start, end, change.old);
        to.push({start: change.start, added: change.old.length, old: replaced});
        setCursor(change.start + change.old.length - 1,
                  editEnd(replaced[replaced.length-1], change.old[change.old.length-1]));
      }
    }
    function undo() {unredoHelper(history.done, history.undone);}
    function redo() {unredoHelper(history.undone, history.done);}

    function updateLines1(from, to, newText) {
      // Update lines length and the associated DIVs
      var lendiff = newText.length - (to - from);
      if (lendiff < 0) {
        var removed = lines.splice(from, -lendiff);
        for (var i = 0, l = removed.length; i < l; ++i)
          code.removeChild(removed[i].div);
      }
      else if (lendiff > 0) {
        var spliceargs = [from, 0], before = lines[from] ? lines[from].div : null;
        for (var i = 0; i < lendiff; ++i) {
          var div = code.insertBefore(document.createElement("div"), before);
          spliceargs.push(new Line(div));
        }
        lines.splice.apply(lines, spliceargs);
      }
      for (var i = 0, l = newText.length; i < l; ++i)
        lines[from + i].setText(newText[i]);

      var newWork = [];
      for (var i = 0, l = work.length; i < l; ++i) {
        var task = work[i];
        if (task < from) newWork.push(task);
        else if (task >= to) newWork.push(task + lendiff);
      }
      if (newText.length) newWork.push(from);
      work = newWork;
      startWorker(100);

      var selLine = sel.from.line;
      if (lendiff || from != selLine || to != selLine + 1)
        updateInput = true;
      textChanged = true;
      updateLineNumbers();
    }
    function updateLineNumbers() {
      var ln = lineNumbers, l = lines.length;
      // TODO profile, optimize (especially for huge changes, innerHTML might be faster)
      if (ln) {
        var nums = ln.childNodes.length;
        while (nums > l) {
          ln.removeChild(ln.lastChild);
          --nums;
        }
        while (nums < l) {
          var num = ln.appendChild(document.createElement("div"));
          num.innerHTML = (nums++) + options.firstLineNumber;
        }
      }
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

      if (changed) {
        shiftSelecting = null;
        updateLines(editing.from, editing.to, text.split(/\r?\n/g));
      }
      editing.text = text; editing.start = sr.start; editing.end = sr.end;

      setSelection(from, to);
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

    function displaySelection() {
      if (posEq(prevSel.from, sel.from) && posEq(prevSel.to, sel.to)) return;

      for (var i = prevSel.from.line, e = Math.min(lines.length, sel.from.line, prevSel.to.line + 1); i < e; ++i)
        lines[i].setSelection(null);
      for (var i = Math.max(sel.to.line + 1, prevSel.from.line), e = Math.min(prevSel.to.line, lines.length); i <= e; ++i)
        lines[i].setSelection(null);
      if (sel.from.line == sel.to.line)
        lines[sel.from.line].setSelection(sel.from.ch, sel.to.ch);
      else {
        lines[sel.from.line].setSelection(sel.from.ch, null);
        for (var i = sel.from.line + 1; i < sel.to.line; ++i)
          lines[i].setSelection(0, null);
        lines[sel.to.line].setSelection(0, sel.to.ch);
      }
      
      var head = sel.inverted ? sel.from : sel.to, div = lines[head.line].div;
      // TODO properly take offsetParent into account
      var curtop = div.offsetTop, curleft = div.offsetLeft + head.ch * charWidth();

      var screen = code.clientHeight, screentop = code.scrollTop;
      if (curtop < screentop)
        code.scrollTop = Math.max(0, curtop - 10);
      else if ((curtop += lineHeight()) > screentop + screen)
        code.scrollTop = (curtop + 10) - screen;

      var screenw = div.offsetWidth, screenleft = code.scrollLeft;
      if (curleft < screenleft)
        code.scrollLeft = Math.max(0, curleft - 10);
      else if (curleft > screenw + screenleft)
        code.scrollLeft = (curleft + 10) - screenw;
    }

    function setSelection(from, to) {
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
      sel.from = from; sel.to = to;
    }

    function clipPos(pos) {
      if (pos.line < 0) return {line: 0, ch: 0};
      if (pos.line >= lines.length) return {line: lines.length-1, ch: lines[lines.length-1].text.length};
      var ch = pos.ch;
      if (ch < 0) ch = 0;
      else if (ch > lines[pos.line].length) ch = lines[pos.line].length;
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
      updateInput = true;
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

      if (diff > 0) {
        var space = "";
        for (var i = 0; i < diff; ++i) space = space + " ";
        updateLines(n, n + 1, [space + text]);
      }
      else
        updateLines(n, n + 1, [text.slice(-diff)]);
      var from = copyPos(sel.from), to = copyPos(sel.to);
      if (from.line == n) from.ch = Math.max(indentation, from.ch + diff);
      if (to.line == n) to.ch = Math.max(indentation, to.ch + diff);
      setSelection(from, to);
    }

    function replaceRange(code, from, to) {
      from = clipPos(from);
      if (!to) to = from; else to = clipPos(to);
      var end = replaceRange1(code, from, to);
      setSelection(adjustPos(sel.from), adjustPos(sel.to));
      function adjustPos(pos) {
        if (posLess(pos, from)) return pos;
        if (posLess(pos, to)) return end;
        if (pos.line == to.line) return {line: end.line, ch: pos.ch + end.ch - to.ch};
        return {line: pos.line + end.line - to.line, ch: pos.ch};
      }
      return end;
    }
    function replaceRange1(code, from, to) {
      code = code.split(/\r?\n/g);
      code[0] = lines[from.line].text.slice(0, from.ch) + code[0];
      var endch = code[code.length-1].length;
      code[code.length-1] += lines[to.line].text.slice(to.ch);
      var diff = code.length - (to.line - from.line + 1);
      updateLines(from.line, to.line + 1, code);
      return {line: to.line + diff, ch: endch};
    }

    function replaceSelection(code, collapse) {
      var end = replaceRange1(code, sel.from, sel.to);
      if (collapse == "end") setSelection(end, end);
      else if (collapse == "start") setSelection(sel.from, sel.from);
      else setSelection(sel.from, end);
    }
    function getSelection(lineSep) {
      var l1 = sel.from.line, l2 = sel.to.line;
      if (l1 == l2) return lines[l1].text.slice(sel.from.ch, sel.to.ch);
      var code = [lines[l1].text.slice(sel.from.ch)];
      for (var i = l1 + 1; i < l2; ++i) code.push(lines[i].text);
      code.push(lines[l2].text.slice(0, sel.to.ch));
      return code.join(lineSep || "\n");
    }

    function setParser(pname) {
      parser = parsers[pname];
      if (!parser) throw new Error("No parser " + pname + " found.");
      for (var i = 0, l = lines.length; i < l; ++i)
        lines[i].stateAfter = null;
      work = [0];
    }
    function setLineNumbers(on) {
      if (!options.lineNumbers != !on) {
        if (options.lineNumbers = on) {
          lineNumbers = code.insertBefore(document.createElement("div"), code.firstChild);
          lineNumbers.className = "CodeMirror-line-numbers";
          updateLineNumbers();
          // TODO Webkit doesn't seem to properly colour DIV margins at this point
        }
        else {
          code.removeChild(lineNumbers);
          lineNumbers = null;
        }
      }
    }
    function cursorCoords(start) {
      function measure(node, offset) {
        var off = eltOffset(node);
        return {x: off.left + offset, y: off.top, yBot: off.top + node.offsetHeight};
      }
      var curNode = findCursor();
      if (curNode) return measure(curNode, 0);
      if (start)
        for (var n = lines[sel.from.line].div.firstChild; n; n = n.nextSibling)
          if (/\bCodeMirror-selected\b/.test(n.className))
            return measure(n, 0);
      else
        for (var n = lines[sel.to.line].div.lastChild; n; n = n.previousSibling)
          if (/\bCodeMirror-selected\b/.test(n.className))
            return measure(n, n.offsetWidth);
    }

    function lineHeight() {
      return measure.offsetHeight;
    }
    function charWidth() {
      return measure.offsetWidth || 1;
    }
    function mouseEventPos(e) {
      var target = e.target(), ln = lines.length;
      if (/span/i.test(target.nodeName)) target = target.parentNode;
      if (target == code) {
        var lastLine = lines[ln-1].div;
        var y = e.pageY() - eltOffset(lastLine.firstChild).top;
        if (y > lastLine.offsetHeight) return {line: ln-1, ch: 0};
      }
      else if (target.parentNode == code) {
        // TODO this search is linear complexity, might be bad for huge docs
        var x = eltOffset(target.firstChild).left, mx = e.pageX(), cw = charWidth();
        var ch = Math.round((mx - x) / cw);
        for (var i = 0; i < ln; ++i) {
          var line = lines[i];
          if (line.div === target) {
            if (line.text.lastIndexOf("\t", ch) > -1) {
              if (target == e.target()) return {line: i, ch: line.text.length};
              var pos = 0;
              for (var n = line.div.firstChild; n; n = n.nextSibling) {
                if (!n.firstChild) continue;
                var w = n.offsetWidth, val = n.firstChild.nodeValue;
                if (x + w > mx) {
                  var tab = val.indexOf("\t"), ch = Math.round((mx - x) / cw);
                  if (tab == -1 || tab >= ch) return {line: i, ch: pos + ch};
                  // Click was inside a span with tabs in it. Create a
                  // span per character so that we can find its exact location.
                  try {
                    var html = [];
                    for (var j = 0, l = val.length; j < l; ++j)
                      html.push("<span>" + prepareCode(val.charAt(j)) + "</span>");
                    n.innerHTML = html.join("");
                    for (var j = n.firstChild; j; j = j.nextSibling) {
                      var w = j.offsetWidth;
                      if (x + w > mx) return {line: i, ch: pos + Math.round((mx - x) / w)};
                      ++pos; x += w;
                    }
                  }
                  finally {n.innerHTML = prepareCode(val);}
                }
                pos += val.length; x += w;
              }
            }
            return {line: i, ch: Math.min(line.text.length, ch)};
          }
        }
      }
    }

    function findCursor() {
      if (posEq(sel.from, sel.to)) {
        var div = lines[sel.from.line].div;
        if (div.getElementsByClassName) return div.getElementsByClassName("CodeMirror-cursor")[0];
        else for (var n = div.firstChild; n; n = n.nextSibling)
               if (/\bCodeMirror-cursor\b/.test(n.className)) return n;
      }
    }
    function restartBlink() {
      clearInterval(blinker);
      var on = true;
      blinker = setInterval(function() {
        var cur = findCursor();
        if (cur)
          cur.style.visibility = (on = !on) ? "" : "hidden";
      }, 650);
    }

    function getStateBefore(n) {
      var state;
      for (var search = n - 1, lim = n - 40;; --search) {
        if (search < 0) {state = parser.startState(options); break;}
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
      // TODO have a mode where the document is always parsed to the end
      var end = +new Date + options.workTime;
      while (work.length) {
        var task = work.pop()
        if (task >= lines.length || lines[task].stateAfter) continue;
        if (task) {
          var state = lines[task-1].stateAfter;
          if (!state) continue;
          state = copyState(state);
        }
        else var state = parser.startState(options);

        for (var i = task, l = lines.length; i < l; ++i) {
          var line = lines[i];
          if (line.stateAfter) break;
          if (+new Date > end) {
            work.push(i);
            startWorker(options.workDelay);
            return;
          }
          line.highlight(parser, state);
          line.stateAfter = copyState(state);
        }
      }
    }
    function startWorker(time) {
      if (!work.length) return;
      highlight.set(time, highlightWorker);
    }

    function startOperation() {
      prevSel.from = sel.from; prevSel.to = sel.to;
      updateInput = textChanged = false;
    }
    function endOperation() {
      var selChanged = !posEq(prevSel.from, sel.from) || !posEq(prevSel.to, sel.to);
      if (selChanged) {
        displaySelection();
        restartBlink();
      }
      if (updateInput || prevSel.from.line != sel.from.line || prevSel.to.line != sel.to.line)
        prepareInput();
      if ((selChanged || textChanged) && options.onCursorActivity)
        options.onCursorActivity(instance);
      if (textChanged && options.onChange)
        options.onChange(instance);
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

      operation: function(f){return operation(f)();}
    };
    return instance;
  }

  CodeMirror.defaults = {
    value: "",
    indentUnit: 2,
    parser: null,
    lineNumbers: false,
    firstLineNumber: 1,
    readOnly: false,
    onChange: null,
    onCursorActivity: null,
    workTime: 200,
    workDelay: 300,
    undoDepth: 40
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
