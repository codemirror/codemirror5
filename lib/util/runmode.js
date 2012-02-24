CodeMirror.runMode = function(string, modespec, callback, options) {
  var mode = CodeMirror.getMode(CodeMirror.defaults, modespec);
  var isNode = callback.nodeType == 1;
  var tabSize = (options && options.tabSize) || CodeMirror.defaults.tabSize;
  if (isNode) {
    var node = callback, accum = [], col = 0;
    callback = function(text, style) {
      if (text == "\n") {
        accum.push("<br>");
        col = 0;
        return;
      }
      var escaped = "";
      // HTML-escape and replace tabs
      for (var pos = 0;;) {
        var idx = text.indexOf("\t", pos);
        if (idx == -1) {
          escaped += CodeMirror.htmlEscape(text.slice(pos));
          col += text.length - pos;
          break;
        } else {
          col += idx - pos;
          escaped += CodeMirror.htmlEscape(text.slice(pos, idx));
          var size = tabSize - col % tabSize;
          col += size;
          for (var i = 0; i < size; ++i) escaped += " ";
          pos = idx + 1;
        }
      }

      if (style) 
        accum.push("<span class=\"cm-" + CodeMirror.htmlEscape(style) + "\">" + escaped + "</span>");
      else
        accum.push(escaped);
    }
  }
  var lines = CodeMirror.splitLines(string), state = CodeMirror.startState(mode);
  for (var i = 0, e = lines.length; i < e; ++i) {
    if (i) callback("\n");
    var stream = new CodeMirror.StringStream(lines[i]);
    while (!stream.eol()) {
      var style = mode.token(stream, state);
      callback(stream.current(), style, i, stream.start);
      stream.start = stream.pos;
    }
  }
  if (isNode)
    node.innerHTML = accum.join("");
};
