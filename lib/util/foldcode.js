// the tagRangeFinder function is
//   Copyright (C) 2011 by Daniel Glazman <daniel@glazman.org>
// released under the MIT license (../../LICENSE) like the rest of CodeMirror
CodeMirror.tagRangeFinder = function(cm, line, hideEnd) {
  var nameStartChar = "A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
  var nameChar = nameStartChar + "\-\:\.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
  var xmlNAMERegExp = new RegExp("^[" + nameStartChar + "][" + nameChar + "]*");

  var lineText = cm.getLine(line);
  var found = false;
  var tag = null;
  var pos = 0;
  while (!found) {
    pos = lineText.indexOf("<", pos);
    if (-1 == pos) // no tag on line
      return;
    if (pos + 1 < lineText.length && lineText[pos + 1] == "/") { // closing tag
      pos++;
      continue;
    }
    // ok we weem to have a start tag
    if (!lineText.substr(pos + 1).match(xmlNAMERegExp)) { // not a tag name...
      pos++;
      continue;
    }
    var gtPos = lineText.indexOf(">", pos + 1);
    if (-1 == gtPos) { // end of start tag not in line
      var l = line + 1;
      var foundGt = false;
      var lastLine = cm.lineCount();
      while (l < lastLine && !foundGt) {
        var lt = cm.getLine(l);
        var gt = lt.indexOf(">");
        if (-1 != gt) { // found a >
          foundGt = true;
          var slash = lt.lastIndexOf("/", gt);
          if (-1 != slash && slash < gt) {
            var str = lineText.substr(slash, gt - slash + 1);
            if (!str.match( /\/\s*\>/ )) { // yep, that's the end of empty tag
              if (hideEnd === true) l++;
              return l;
            }
          }
        }
        l++;
      }
      found = true;
    }
    else {
      var slashPos = lineText.lastIndexOf("/", gtPos);
      if (-1 == slashPos) { // cannot be empty tag
        found = true;
        // don't continue
      }
      else { // empty tag?
        // check if really empty tag
        var str = lineText.substr(slashPos, gtPos - slashPos + 1);
        if (!str.match( /\/\s*\>/ )) { // finally not empty
          found = true;
          // don't continue
        }
      }
    }
    if (found) {
      var subLine = lineText.substr(pos + 1);
      tag = subLine.match(xmlNAMERegExp);
      if (tag) {
        // we have an element name, wooohooo !
        tag = tag[0];
        // do we have the close tag on same line ???
        if (-1 != lineText.indexOf("</" + tag + ">", pos)) // yep
        {
          found = false;
        }
        // we don't, so we have a candidate...
      }
      else
        found = false;
    }
    if (!found)
      pos++;
  }

  if (found) {
    var startTag = "(\\<\\/" + tag + "\\>)|(\\<" + tag + "\\>)|(\\<" + tag + "\\s)|(\\<" + tag + "$)";
    var startTagRegExp = new RegExp(startTag, "g");
    var endTag = "</" + tag + ">";
    var depth = 1;
    var l = line + 1;
    var lastLine = cm.lineCount();
    while (l < lastLine) {
      lineText = cm.getLine(l);
      var match = lineText.match(startTagRegExp);
      if (match) {
        for (var i = 0; i < match.length; i++) {
          if (match[i] == endTag)
            depth--;
          else
            depth++;
          if (!depth) {
            if (hideEnd === true) l++;
            return l;
          }
        }
      }
      l++;
    }
    return;
  }
};

CodeMirror.braceRangeFinder = function(cm, line, hideEnd) {
  var lineText = cm.getLine(line), at = lineText.length, startChar, tokenType;
  for (;;) {
    var found = lineText.lastIndexOf("{", at);
    if (found < 0) break;
    tokenType = cm.getTokenAt({line: line, ch: found}).className;
    if (!/^(comment|string)/.test(tokenType)) { startChar = found; break; }
    at = found - 1;
  }
  if (startChar == null || lineText.lastIndexOf("}") > startChar) return;
  var count = 1, lastLine = cm.lineCount(), end;
  outer: for (var i = line + 1; i < lastLine; ++i) {
    var text = cm.getLine(i), pos = 0;
    for (;;) {
      var nextOpen = text.indexOf("{", pos), nextClose = text.indexOf("}", pos);
      if (nextOpen < 0) nextOpen = text.length;
      if (nextClose < 0) nextClose = text.length;
      pos = Math.min(nextOpen, nextClose);
      if (pos == text.length) break;
      if (cm.getTokenAt({line: i, ch: pos + 1}).className == tokenType) {
        if (pos == nextOpen) ++count;
        else if (!--count) { end = i; break outer; }
      }
      ++pos;
    }
  }
  if (end == null || end == line + 1) return;
  if (hideEnd === true) end++;
  return end;
};

CodeMirror.indentRangeFinder = function(cm, line) {
  var tabSize = cm.getOption("tabSize");
  var myIndent = cm.getLineHandle(line).indentation(tabSize), last;
  for (var i = line + 1, end = cm.lineCount(); i < end; ++i) {
    var handle = cm.getLineHandle(i);
    if (!/^\s*$/.test(handle.text)) {
      if (handle.indentation(tabSize) <= myIndent) break;
      last = i;
    }
  }
  if (!last) return null;
  return last + 1;
};

CodeMirror.newFoldFunction = function(rangeFinder, markText, hideEnd) {
  var folded = [];
  if (markText == null) markText = "\u25bc";

  function isFolded(handle) {
    for (var i = 0; i < folded.length; ++i) {
      if (folded[i].start == handle) return {pos: i, region: folded[i]};
      if (!folded[i].start.parent) folded.splice(i--, 1);
    }
  }

  return function(cm, line) {
    cm.operation(function() {
      var l = cm.getLineHandle(line), known = isFolded(l);
      if (known) {
        folded.splice(known.pos, 1);
        cm.unfoldLines(known.region.handle);
        cm.setGutterMarker(l, "CodeMirror-folded", null);
      } else {
        var end = rangeFinder(cm, line, hideEnd);
        if (end == null) return;
        var handle = cm.foldLines(line + 1, end, true);
        CodeMirror.on(handle, "unfold", function() {
          cm.setGutterMarker(l, "CodeMirror-folded", null);
        });
        var elt = document.createElement("div");
        elt.className = "CodeMirror-foldmarker";
        elt.innerHTML = markText;
        var first = cm.setGutterMarker(line, "CodeMirror-folded", elt);
        function clear() {
          var known = isFolded(first);
          if (!known) return;
          cm.unfoldLines(known.region.handle);
          folded.splice(known.pos, 1);
        }
        CodeMirror.on(first, "delete", clear);
        CodeMirror.on(first, "change", clear);
        CodeMirror.on(cm.getLineHandle(line + 1), "delete", clear);
        folded.push({start: first, handle: handle});
      }
    });
  };
};
