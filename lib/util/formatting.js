// ============== Formatting extensions ============================
// A common storage for all mode-specific formatting features
if (!CodeMirror.modeExtensions) CodeMirror.modeExtensions = {};

// Returns the extension of the editor's current mode
CodeMirror.defineExtension("getModeExt", function () {
  return CodeMirror.modeExtensions[this.getOption("mode")];
});

// If the current mode is 'htmlmixed', returns the extension of a mode located at
// the specified position (can be htmlmixed, css or javascript). Otherwise, simply
// returns the extension of the editor's current mode.
CodeMirror.defineExtension("getModeExtAtPos", function (pos) {
  var token = this.getTokenAt(pos);
  if (token && token.state && token.state.mode)
    return CodeMirror.modeExtensions[token.state.mode == "html" ? "htmlmixed" : token.state.mode];
  else
    return this.getModeExt();
});

// Comment/uncomment the specified range
CodeMirror.defineExtension("commentRange", function (isComment, from, to) {
  var curMode = this.getModeExtAtPos(this.getCursor());
  if (isComment) { // Comment range
    var commentedText = this.getRange(from, to);
    this.replaceRange(curMode.commentStart + this.getRange(from, to) + curMode.commentEnd
      , from, to);
    if (from.line == to.line && from.ch == to.ch) { // An empty comment inserted - put cursor inside
      this.setCursor(from.line, from.ch + curMode.commentStart.length);
    }
  }
  else { // Uncomment range
    var selText = this.getRange(from, to);
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
    this.replaceRange(selText, from, to);
  }
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
  var absStart = this.indexFromPos(from);
  var absEnd = this.indexFromPos(to);
  // Insert additional line breaks where necessary according to the
  // mode's syntax
  var res = this.getModeExt().autoFormatLineBreaks(this.getValue(), absStart, absEnd);
  var cmInstance = this;

  // Replace and auto-indent the range
  this.operation(function () {
    cmInstance.replaceRange(res, from, to);
    var startLine = cmInstance.posFromIndex(absStart).line;
    var endLine = cmInstance.posFromIndex(absStart + res.length).line;
    for (var i = startLine; i <= endLine; i++) {
      cmInstance.indentLine(i, "smart");
    }
  });
});

// Define extensions for a few modes

CodeMirror.modeExtensions["css"] = {
  commentStart: "/*",
  commentEnd: "*/",
  wordWrapChars: [";", "\\{", "\\}"],
  autoFormatLineBreaks: function (text) {
    return text.replace(new RegExp("(;|\\{|\\})([^\r\n])", "g"), "$1\n$2");
  }
};

CodeMirror.modeExtensions["javascript"] = {
  commentStart: "/*",
  commentEnd: "*/",
  wordWrapChars: [";", "\\{", "\\}"],

  getNonBreakableBlocks: function (text) {
    var nonBreakableRegexes = [
        new RegExp("for\\s*?\\(([\\s\\S]*?)\\)"),
        new RegExp("'([\\s\\S]*?)('|$)"),
        new RegExp("\"([\\s\\S]*?)(\"|$)"),
        new RegExp("//.*([\r\n]|$)")
      ];
    var nonBreakableBlocks = new Array();
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
  },

  autoFormatLineBreaks: function (text) {
    var curPos = 0;
    var reLinesSplitter = new RegExp("(;|\\{|\\})([^\r\n])", "g");
    var nonBreakableBlocks = this.getNonBreakableBlocks(text);
    if (nonBreakableBlocks != null) {
      var res = "";
      for (var i = 0; i < nonBreakableBlocks.length; i++) {
        if (nonBreakableBlocks[i].start > curPos) { // Break lines till the block
          res += text.substring(curPos, nonBreakableBlocks[i].start).replace(reLinesSplitter, "$1\n$2");
          curPos = nonBreakableBlocks[i].start;
        }
        if (nonBreakableBlocks[i].start <= curPos
          && nonBreakableBlocks[i].end >= curPos) { // Skip non-breakable block
          res += text.substring(curPos, nonBreakableBlocks[i].end);
          curPos = nonBreakableBlocks[i].end;
        }
      }
      if (curPos < text.length - 1) {
        res += text.substr(curPos).replace(reLinesSplitter, "$1\n$2");
      }
      return res;
    }
    else {
      return text.replace(reLinesSplitter, "$1\n$2");
    }
  }
};

CodeMirror.modeExtensions["xml"] = {
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
};

CodeMirror.modeExtensions["htmlmixed"] = {
  commentStart: "<!--",
  commentEnd: "-->",
  wordWrapChars: [">", ";", "\\{", "\\}"],

  getModeInfos: function (text, absPos) {
    var modeInfos = new Array();
    modeInfos[0] =
      {
        pos: 0,
        modeExt: CodeMirror.modeExtensions["xml"],
        modeName: "xml"
      };

    var modeMatchers = new Array();
    modeMatchers[0] =
      {
        regex: new RegExp("<style[^>]*>([\\s\\S]*?)(</style[^>]*>|$)", "i"),
        modeExt: CodeMirror.modeExtensions["css"],
        modeName: "css"
      };
    modeMatchers[1] =
      {
        regex: new RegExp("<script[^>]*>([\\s\\S]*?)(</script[^>]*>|$)", "i"),
        modeExt: CodeMirror.modeExtensions["javascript"],
        modeName: "javascript"
      };

    var lastCharPos = (typeof (absPos) !== "undefined" ? absPos : text.length - 1);
    // Detect modes for the entire text
    for (var i = 0; i < modeMatchers.length; i++) {
      var curPos = 0;
      while (curPos <= lastCharPos) {
        var m = text.substr(curPos).match(modeMatchers[i].regex);
        if (m != null) {
          if (m.length > 1 && m[1].length > 0) {
            // Push block begin pos
            var blockBegin = curPos + m.index + m[0].indexOf(m[1]);
            modeInfos.push(
              {
                pos: blockBegin,
                modeExt: modeMatchers[i].modeExt,
                modeName: modeMatchers[i].modeName
              });
            // Push block end pos
            modeInfos.push(
              {
                pos: blockBegin + m[1].length,
                modeExt: modeInfos[0].modeExt,
                modeName: modeInfos[0].modeName
              });
            curPos += m.index + m[0].length;
            continue;
          }
          else {
            curPos += m.index + Math.max(m[0].length, 1);
          }
        }
        else { // No more matches
          break;
        }
      }
    }
    // Sort mode infos
    modeInfos.sort(function sortModeInfo(a, b) {
      return a.pos - b.pos;
    });

    return modeInfos;
  },

  autoFormatLineBreaks: function (text, startPos, endPos) {
    var modeInfos = this.getModeInfos(text);
    var reBlockStartsWithNewline = new RegExp("^\\s*?\n");
    var reBlockEndsWithNewline = new RegExp("\n\\s*?$");
    var res = "";
    // Use modes info to break lines correspondingly
    if (modeInfos.length > 1) { // Deal with multi-mode text
      for (var i = 1; i <= modeInfos.length; i++) {
        var selStart = modeInfos[i - 1].pos;
        var selEnd = (i < modeInfos.length ? modeInfos[i].pos : endPos);

        if (selStart >= endPos) { // The block starts later than the needed fragment
          break;
        }
        if (selStart < startPos) {
          if (selEnd <= startPos) { // The block starts earlier than the needed fragment
            continue;
          }
          selStart = startPos;
        }
        if (selEnd > endPos) {
          selEnd = endPos;
        }
        var textPortion = text.substring(selStart, selEnd);
        if (modeInfos[i - 1].modeName != "xml") { // Starting a CSS or JavaScript block
          if (!reBlockStartsWithNewline.test(textPortion)
              && selStart > 0) { // The block does not start with a line break
            textPortion = "\n" + textPortion;
          }
          if (!reBlockEndsWithNewline.test(textPortion)
              && selEnd < text.length - 1) { // The block does not end with a line break
            textPortion += "\n";
          }
        }
        res += modeInfos[i - 1].modeExt.autoFormatLineBreaks(textPortion);
      }
    }
    else { // Single-mode text
      res = modeInfos[0].modeExt.autoFormatLineBreaks(text.substring(startPos, endPos));
    }

    return res;
  }
};
