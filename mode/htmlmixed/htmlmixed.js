CodeMirror.addMode("htmlmixed", function(config, parserConfig) {
  var htmlMode = CodeMirror.getMode(config, {name: "xml", htmlMode: true});
  var jsMode = CodeMirror.getMode(config, "javascript");
  var cssMode = CodeMirror.getMode(config, "css");

  function copyState() {
    return {
      token: this.token,
      localState: this.localState && CodeMirror.copyState(this.localState),
      htmlState: CodeMirror.copyState(this.htmlState),
      copy: copyState
    };
  }

  function html(stream, state) {
    var style = htmlMode.token(stream, state.htmlState);
    if (style == "xml-tag" && stream.current() == ">" && state.htmlState.context) {
      if (/^script$/i.test(state.htmlState.context.tagName)) {
        state.token = javascript;
        state.localState = jsMode.startState(htmlMode.indent(state.htmlState, ""));
      }
      else if (/^style$/i.test(state.htmlState.context.tagName)) {
        state.token = css;
        state.localState = cssMode.startState(htmlMode.indent(state.htmlState, ""));
      }
    }
    return style;
  }
  function javascript(stream, state) {
    if (stream.match(/^<\/\s*script\s*>/i, false)) {
      state.token = html;
      state.curState = null;
      return html(stream, state);
    }
    return jsMode.token(stream, state.localState);
  }
  function css(stream, state) {
    if (stream.match(/^<\/\s*style\s*>/i, false)) {
      state.token = html;
      state.localState = null;
      return html(stream, state);
    }
    return cssMode.token(stream, state.localState);
  }

  return {
    startState: function() {
      var state = htmlMode.startState();
      return {
        token: html,
        localState: null,
        htmlState: state,
        copy: copyState
      };
    },

    token: function(stream, state) {
      return state.token(stream, state);
    },

    indent: function(state, textAfter) {
      if (state.token == html || /^\s*<\//.test(textAfter))
        return htmlMode.indent(state.htmlState, textAfter);
      else if (state.token == javascript)
        return jsMode.indent(state.localState, textAfter);
      else
        return cssMode.indent(state.localState, textAfter);
    }
  }
});