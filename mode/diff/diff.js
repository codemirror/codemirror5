CodeMirror.defineMode("diff", function() {

  var TOKEN_NAMES = {
    '+': "plus",
    '-': "minus",
    '@': "rangeinfo"
  };

  return {
    token: function(stream) {
      var tw_pos = stream.string.search(/[\t ]+?$/);

      if (!stream.sol() || tw_pos === 0) {
        stream.skipToEnd();
        return "trailing-whitespace-" + (
          TOKEN_NAMES[stream.string.charAt(0)] || "normal");
      }

      var token_name = TOKEN_NAMES[stream.peek()] || stream.skipToEnd();

      if (tw_pos === -1) {
        stream.skipToEnd();
      } else {
        stream.pos = tw_pos;
      }

      return token_name;
    }
  };
});

CodeMirror.defineMIME("text/x-diff", "diff");
