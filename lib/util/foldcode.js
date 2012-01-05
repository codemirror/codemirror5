// the tagRangeFinder function is
//   Copyright (C) 2011 by Daniel Glazman <daniel@glazman.org>
// released under the MIT license (../../LICENSE) like the rest of CodeMirror
CodeMirror.tagRangeFinder = function(cm, line) {
  var nameStartChar = "A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
  var nameChar = nameStartChar + "\-\.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
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
            if (!str.match( /\/\s*\>/ )) // yep, that's the end of empty tag
              return l+1;
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
    var startTag = "(\\<\\/" + tag + "\\>)|(\\<" + tag + "\\>)|(\\<" + tag + "\s)|(\\<" + tag + "$)";
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
          if (!depth)
            return l+1;
        }
      }
      l++;
    }
    return;
  }
};

CodeMirror.braceRangeFinder = function(cm, line) {
  var lineText = cm.getLine(line);
  var startChar = lineText.lastIndexOf("{");
  if (startChar < 0 || lineText.lastIndexOf("}") > startChar) return;
  var tokenType = cm.getTokenAt({line: line, ch: startChar}).className;
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
  return end;
};


CodeMirror.newFoldFunction = function(rangeFinder, markText) {
  var folded = [];
  if (markText == null) markText = '<div style="position: absolute; left: 2px; color:#600">&#x25bc;</div>%N%';

  function isFolded(cm, n) {
    for (var i = 0; i < folded.length; ++i) {
      var start = cm.lineInfo(folded[i].start);
      if (!start) folded.splice(i--, 1);
      else if (start.line == n) return {pos: i, region: folded[i]};
    }
  }

  function expand(cm, region) {
    cm.clearMarker(region.start);
    for (var i = 0; i < region.hidden.length; ++i)
      cm.showLine(region.hidden[i]);
  }

  return function(cm, line) {
    cm.operation(function() {
      var known = isFolded(cm, line);
      if (known) {
        folded.splice(known.pos, 1);
        expand(cm, known.region);
      } else {
        var end = rangeFinder(cm, line);
        if (end == null) return;
        var hidden = [];
        for (var i = line + 1; i < end; ++i) {
          var handle = cm.hideLine(i);
          if (handle) hidden.push(handle);
        }
        var first = cm.setMarker(line, markText);
        var region = {start: first, hidden: hidden};
        cm.onDeleteLine(first, function() { expand(cm, region); });
        folded.push(region);
      }
    });
  };
};
