// CodeMirror-mode equivalent to a no-op.

CodeMirror.defineMode("null", function() {
  return {
    token: function(stream) {
      stream.skipToEnd();
      return null;
    }
  };
});

CodeMirror.defineMIME("text/plain", "null");
