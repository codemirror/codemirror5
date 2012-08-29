CodeMirror.defineMode("ini", function() {
  return {
    startState: function() {
      return {context: ""};
    },

    token: function(stream, state) {
      
      if (stream.eatSpace()) return null;
      var ch = stream.next();
      if (ch == ";") {stream.skipToEnd(); return "comment";}
      else if (ch == "[") {state.context = "section"; return "bracket";}
      else if (ch == "]") {state.context = "key"; return "bracket";}
      else if (ch == "=") {state.context = "value"; return "operator";}
      else
      {
        if (state.context == "section") 
        {
          if (!stream.skipTo("]")) stream.skipToEnd();
          return "keyword";
        }
        else if(state.context == "key")
        {
          if (!stream.skipTo("=")) stream.skipToEnd();
          return "attribute";
        }
        else if(state.context == "value")
        {
          stream.skipToEnd();
          state.context = "key";
          return "variable";
        }
      }
    }
  };
});

CodeMirror.defineMIME("text/ini", "ini");
