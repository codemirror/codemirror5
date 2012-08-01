CodeMirror.defineMode("htmlembedded", function(config, parserConfig) {
  
  //config settings
  var scriptStartRegex = parserConfig.scriptStartRegex || /^<%/i,
      scriptEndRegex = parserConfig.scriptEndRegex || /^%>/i;
  
  //inner modes
  var scriptingMode, htmlMixedMode;
  
  //tokenizer when in html mode
  function htmlDispatch(stream, state) {
      if (stream.match(scriptStartRegex, false)) {
          state.token=scriptingDispatch;
          return scriptingMode.token(stream, state.scriptState);
          }
      else
          return htmlMixedMode.token(stream, state.htmlState);
    }

  //tokenizer when in scripting mode
  function scriptingDispatch(stream, state) {
      if (stream.match(scriptEndRegex, false))  {
          state.token=htmlDispatch;
          return htmlMixedMode.token(stream, state.htmlState);
         }
      else
          return scriptingMode.token(stream, state.scriptState);
         }


  return {
    startState: function() {
      scriptingMode = scriptingMode || CodeMirror.getMode(config, parserConfig.scriptingModeSpec);
      htmlMixedMode = htmlMixedMode || CodeMirror.getMode(config, "htmlmixed");
      return { 
          token :  parserConfig.startOpen ? scriptingDispatch : htmlDispatch,
          htmlState : htmlMixedMode.startState(),
          scriptState : scriptingMode.startState()
      };
    },

    token: function(stream, state) {
      return state.token(stream, state);
    },

    indent: function(state, textAfter) {
      if (state.token == htmlDispatch)
        return htmlMixedMode.indent(state.htmlState, textAfter);
      else
        return scriptingMode.indent(state.scriptState, textAfter);
    },
    
    copyState: function(state) {
      return {
       token : state.token,
       htmlState : CodeMirror.copyState(htmlMixedMode, state.htmlState),
       scriptState : CodeMirror.copyState(scriptingMode, state.scriptState)
      };
    },
    

    electricChars: "/{}:"
  };
}, "htmlmixed");

CodeMirror.defineMIME("application/x-ejs", { name: "htmlembedded", scriptingModeSpec:"javascript"});
CodeMirror.defineMIME("application/x-aspx", { name: "htmlembedded", scriptingModeSpec:"text/x-csharp"});
CodeMirror.defineMIME("application/x-jsp", { name: "htmlembedded", scriptingModeSpec:"text/x-java"});
