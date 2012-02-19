CodeMirror.defineMode("diff", function() {
  return {
    token: function(stream) {
      var ch = stream.next();
      stream.skipToEnd();
      if (ch == "+") return "plus";
      if (ch == "-") return "minus";
      if (ch == "@") return "rangeinfo";
    }
  };
});

CodeMirror.defineMIME("text/x-diff", "diff");
