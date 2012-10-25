// ============== Formatting extensions ============================
(function() {
  // Define extensions for a few modes
  CodeMirror.extendMode("css", {
    commentStart: "/*",
    commentEnd: "*/",
    wordWrapChars: [";", "\\{", "\\}"],
    autoFormatLineBreaks: function (text) {
      return text.replace(new RegExp("(;|\\{|\\})([^\r\n])", "g"), "$1\n$2");
    }
  });

  function jsNonBreakableBlocks(text) {
    var nonBreakableRegexes = [/for\s*?\((.*?)\)/,
                               /\"(.*?)(\"|$)/,
                               /\'(.*?)(\'|$)/,
                               /\/\*(.*?)(\*\/|$)/,
                               /\/\/.*/];
    var nonBreakableBlocks = [];
    for (var i = 0; i < nonBreakableRegexes.length; i++) {
      var curPos = 0;
      while (curPos < text.length) {
        var m = text.substr(curPos).match(nonBreakableRegexes[i]);
        if (m != null) {
          nonBreakableBlocks.push({
            start: curPos + m.index,
            end: curPos + m.index + m[0].length
          });
          curPos += m.index + Math.max(1, m[0].length);
        }
        else { // No more matches
          break;
        }
      }
    }
    nonBreakableBlocks.sort(function (a, b) {
      return a.start - b.start;
    });

    return nonBreakableBlocks;
  }

  CodeMirror.extendMode("javascript", {
    commentStart: "/*",
    commentEnd: "*/",
    wordWrapChars: [";", "\\{", "\\}"],

    autoFormatLineBreaks: function (text) {
      var curPos = 0;
      var split = this.jsonMode ? function(str) {
        return str.replace(/([,{])/g, "$1\n").replace(/}/g, "\n}");
      } : function(str) {
        return str.replace(/(;|\{|\})([^\r\n;])/g, "$1\n$2");
      };
      var nonBreakableBlocks = jsNonBreakableBlocks(text), res = "";
      if (nonBreakableBlocks != null) {
        for (var i = 0; i < nonBreakableBlocks.length; i++) {
          if (nonBreakableBlocks[i].start > curPos) { // Break lines till the block
            res += split(text.substring(curPos, nonBreakableBlocks[i].start));
            curPos = nonBreakableBlocks[i].start;
          }
          if (nonBreakableBlocks[i].start <= curPos
              && nonBreakableBlocks[i].end >= curPos) { // Skip non-breakable block
            res += text.substring(curPos, nonBreakableBlocks[i].end);
            curPos = nonBreakableBlocks[i].end;
          }
        }
        if (curPos < text.length)
          res += split(text.substr(curPos));
      } else {
        res = split(text);
      }
      return res.replace(/^\n*|\n*$/, "");
    }
  });

  CodeMirror.extendMode("xml", {
    commentStart: "<!--",
    commentEnd: "-->",
    wordWrapChars: [">"],

    autoFormatLineBreaks: function (text) {
      var lines = text.split("\n");
      var reProcessedPortion = new RegExp("(^\\s*?<|^[^<]*?)(.+)(>\\s*?$|[^>]*?$)");
      var reOpenBrackets = new RegExp("<", "g");
      var reCloseBrackets = new RegExp("(>)([^\r\n])", "g");
      for (var i = 0; i < lines.length; i++) {
        var mToProcess = lines[i].match(reProcessedPortion);
        if (mToProcess != null && mToProcess.length > 3) { // The line starts with whitespaces and ends with whitespaces
          lines[i] = mToProcess[1]
            + mToProcess[2].replace(reOpenBrackets, "\n$&").replace(reCloseBrackets, "$1\n$2")
            + mToProcess[3];
          continue;
        }
      }
      return lines.join("\n");
    }
  });

  function localModeAt(cm, pos) {
    return CodeMirror.innerMode(cm.getMode(), cm.getTokenAt(pos).state).mode;
  }

  function enumerateModesBetween(cm, line, start, end) {
    var outer = cm.getMode(), text = cm.getLine(line);
    if (end == null) end = text.length;
    if (!outer.innerMode) return [{from: start, to: end, mode: outer}];
    var state = cm.getTokenAt({line: line, ch: start}).state;
    var mode = CodeMirror.innerMode(outer, state).mode;
    var found = [], stream = new CodeMirror.StringStream(text);
    stream.pos = stream.start = start;
    for (;;) {
      outer.token(stream, state);
      var curMode = CodeMirror.innerMode(outer, state).mode;
      if (curMode != mode) {
        var cut = stream.start;
        // Crappy heuristic to deal with the fact that a change in
        // mode can occur both at the end and the start of a token,
        // and we don't know which it was.
        if (mode.name == "xml" && text.charAt(stream.pos - 1) == ">") cut = stream.pos;
        found.push({from: start, to: cut, mode: mode});
        start = cut;
        mode = curMode;
      }
      if (stream.pos >= end) break;
      stream.start = stream.pos;
    }
    if (start < end) found.push({from: start, to: end, mode: mode});
    return found;
  }

  // Comment/uncomment the specified range
  CodeMirror.defineExtension("commentRange", function (isComment, from, to) {
    var curMode = localModeAt(this, from), cm = this;
    this.operation(function() {
      if (isComment) { // Comment range
        cm.replaceRange(curMode.commentEnd, to);
        cm.replaceRange(curMode.commentStart, from);
        if (from.line == to.line && from.ch == to.ch) // An empty comment inserted - put cursor inside
          cm.setCursor(from.line, from.ch + curMode.commentStart.length);
      } else { // Uncomment range
        var selText = cm.getRange(from, to);
        var startIndex = selText.indexOf(curMode.commentStart);
        var endIndex = selText.lastIndexOf(curMode.commentEnd);
        if (startIndex > -1 && endIndex > -1 && endIndex > startIndex) {
          // Take string till comment start
          selText = selText.substr(0, startIndex)
          // From comment start till comment end
            + selText.substring(startIndex + curMode.commentStart.length, endIndex)
          // From comment end till string end
            + selText.substr(endIndex + curMode.commentEnd.length);
        }
        cm.replaceRange(selText, from, to);
      }
    });
  });

  // Applies automatic mode-aware indentation to the specified range
  CodeMirror.defineExtension("autoIndentRange", function (from, to) {
    var cmInstance = this;
    this.operation(function () {
      for (var i = from.line; i <= to.line; i++) {
        cmInstance.indentLine(i, "smart");
      }
    });
  });

  // Applies automatic formatting to the specified range
  CodeMirror.defineExtension("autoFormatRange", function (from, to) {
    var cm = this;
    cm.operation(function () {
      for (var cur = from.line, end = to.line; cur <= end; ++cur) {
        var f = {line: cur, ch: cur == from.line ? from.ch : 0};
        var t = {line: cur, ch: cur == end ? to.ch : null};
        var modes = enumerateModesBetween(cm, cur, f.ch, t.ch), mangled = "";
        var text = cm.getRange(f, t);
        for (var i = 0; i < modes.length; ++i) {
          var part = modes.length > 1 ? text.slice(modes[i].from, modes[i].to) : text;
          if (mangled) mangled += "\n";
          if (modes[i].mode.autoFormatLineBreaks) {
            mangled += modes[i].mode.autoFormatLineBreaks(part);
          } else mangled += text;
        }
        if (mangled != text) {
          for (var count = 0, pos = mangled.indexOf("\n"); pos != -1; pos = mangled.indexOf("\n", pos + 1), ++count) {}
          cm.replaceRange(mangled, f, t);
          cur += count;
          end += count;
        }
      }
      for (var cur = from.line + 1; cur <= end; ++cur)
        cm.indentLine(cur, "smart");
      cm.setSelection(from, cm.getCursor(false));
    });
  });
})();
