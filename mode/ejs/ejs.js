CodeMirror.defineMode("ejs", function(config, parserConfig) {
  var htmlMixedMode = CodeMirror.getMode(config, "htmlmixed");
  var serversideJsMode = CodeMirror.getMode(config, "javascript");
  
  function clientSide(stream, state) {
      if (stream.match(/^<%/i, false)) {
          state.token=serversideJavascript;
          return serversideJsMode.token(stream, state.jsState);
          }
      else
          return htmlMixedMode.token(stream, state.htmlState);
    }

  function serversideJavascript(stream, state) {
      if (stream.match(/^%>/i, false))  {
          state.token=clientSide;
          return htmlMixedMode.token(stream, state.htmlState);
         }
      else
          return serversideJsMode.token(stream, state.jsState);
         }


  return {
    startState: function() {
      return { 
          token : clientSide,
          htmlState : htmlMixedMode.startState(),
          jsState : serversideJsMode.startState()
          }
    },

    token: function(stream, state) {
      return state.token(stream, state);
    },

    indent: function(state, textAfter) {
      if (state.token == clientSide)
        return htmlMixedMode.indent(state.htmlState, textAfter);
      else
        return serversideJsMode.indent(state.jsState, textAfter);
    },
    
    copyState: function(state) {
      return {
       token : state.token,
       htmlState : CodeMirror.copyState(htmlMixedMode, state.htmlState),
       jsState : CodeMirror.copyState(serversideJsMode, state.jsState)
       }
    },
    

    electricChars: "/{}:"
  }
});

CodeMirror.defineMIME("application/x-ejs", "ejs");