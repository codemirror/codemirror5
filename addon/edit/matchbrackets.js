(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  var ie_lt8 = /MSIE \d/.test(navigator.userAgent) &&
    (document.documentMode == null || document.documentMode < 8);

  var Pos = CodeMirror.Pos;

  var matching = {"(": ")>", ")": "(<", "[": "]>", "]": "[<", "{": "}>", "}": "{<"};
  function findMatchingBracket(cm, where, strict) {
    var state = cm.state.matchBrackets;
    var maxScanLen = (state && state.maxScanLineLength) || 10000;
    var maxScanLines = (state && state.maxScanLines) || 100;

    var line = cm.getLineHandle(where.line), pos = where.ch - 1;
    var match = (pos >= 0 && matching[line.text.charAt(pos)]) || matching[line.text.charAt(++pos)];
    if (!match) return null;
    var forward = match.charAt(1) == ">", d = forward ? 1 : -1;
    if (strict && forward != (pos == where.ch)) return null;
    var style = cm.getTokenTypeAt(Pos(where.line, pos + 1));

    var stack = [line.text.charAt(pos)], re = /[(){}[\]]/;
    function scan(line, lineNo, start) {
      if (!line.text) return;
      var pos = forward ? 0 : line.text.length - 1, end = forward ? line.text.length : -1;
      if (line.text.length > maxScanLen) return null;
      if (start != null) pos = start + d;
      for (; pos != end; pos += d) {
        var ch = line.text.charAt(pos);
        if (re.test(ch) && cm.getTokenTypeAt(Pos(lineNo, pos + 1)) == style) {
          var match = matching[ch];
          if (match.charAt(1) == ">" == forward) stack.push(ch);
          else if (stack.pop() != match.charAt(0)) return {pos: pos, match: false};
          else if (!stack.length) return {pos: pos, match: true};
        }
      }
    }
    for (var i = where.line, found, e = forward ? Math.min(i + maxScanLines, cm.lineCount()) : Math.max(-1, i - maxScanLines); i != e; i+=d) {
      if (i == where.line) found = scan(line, i, pos);
      else found = scan(cm.getLineHandle(i), i);
      if (found) break;
    }
    return {from: Pos(where.line, pos), to: found && Pos(i, found.pos),
            match: found && found.match, forward: forward};
  }

  function matchBrackets(cm, autoclear) {
    // Disable brace matching in long lines, since it'll cause hugely slow updates
    var maxHighlightLen = cm.state.matchBrackets.maxHighlightLineLength || 1000;
    var marks = [], ranges = cm.listSelections();
    for (var i = 0; i < ranges.length; i++) {
      var match = ranges[i].empty() && findMatchingBracket(cm, ranges[i].head);
      if (match && cm.getLine(match.from.line).length <= maxHighlightLen &&
          match.to && cm.getLine(match.to.line).length <= maxHighlightLen) {
        var style = match.match ? "CodeMirror-matchingbracket" : "CodeMirror-nonmatchingbracket";
        marks.push(cm.markText(match.from, Pos(match.from.line, match.from.ch + 1), {className: style}));
        if (match.to)
          marks.push(cm.markText(match.to, Pos(match.to.line, match.to.ch + 1), {className: style}));
      }
    }

    if (marks.length) {
      // Kludge to work around the IE bug from issue #1193, where text
      // input stops going to the textare whever this fires.
      if (ie_lt8 && cm.state.focused) cm.display.input.focus();

      var clear = function() {
        cm.operation(function() {
          for (var i = 0; i < marks.length; i++) marks[i].clear();
        });
      };
      if (autoclear) setTimeout(clear, 800);
      else return clear;
    }
  }

  var currentlyHighlighted = null;
  function doMatchBrackets(cm) {
    cm.operation(function() {
      if (currentlyHighlighted) {currentlyHighlighted(); currentlyHighlighted = null;}
      currentlyHighlighted = matchBrackets(cm, false);
    });
  }

  CodeMirror.defineOption("matchBrackets", false, function(cm, val, old) {
    if (old && old != CodeMirror.Init)
      cm.off("cursorActivity", doMatchBrackets);
    if (val) {
      cm.state.matchBrackets = typeof val == "object" ? val : {};
      cm.on("cursorActivity", doMatchBrackets);
    }
  });

  CodeMirror.defineExtension("matchBrackets", function() {matchBrackets(this, true);});
  CodeMirror.defineExtension("findMatchingBracket", function(pos, strict){
    return findMatchingBracket(this, pos, strict);
  });
});
