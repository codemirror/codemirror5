CodeMirror.defineMode("diff", function() {
  return {
    token: function(stream) {
      var ch = stream.next();
      stream.skipToEnd();
      if (ch == "+") return "diff-plus";
      if (ch == "-") return "diff-minus";
      if (ch == "@") return "diff-rangeinfo";
    }
  };
});

CodeMirror.defineMIME("text/x-diff", "diff");
