(function() {
  "use strict"

  // full haml mode. This handled embeded ruby and html fragments too
  CodeMirror.defineMode("haml", function(config, parserConfig) {
    var htmlMode = CodeMirror.getMode(config, {name: "htmlmixed"});
    var rubyMode = CodeMirror.getMode(config, "ruby");
    var indentUnit = config.indentUnit || 2;

    function handleHaml(stream, state) {
      if (state.previousToken.style == "comment" ) {
        if (state.indented > state.previousToken.indented) {
          stream.skipToEnd();
          return "commentLine";
        }
      }

      var ch = stream.peek();
      var style = null;
      if (state.startOfLine) {
        if (ch == "!" && stream.match("!!")) {
          stream.skipToEnd();
          style = "tag";
        } else if (stream.match(/^%[\w:#\.]+=/)) {
          state.tokenize = ruby;
          style = "tag"
        } else if (stream.match(/^%[\w:]+/)) {
          style = "hamlTag"
        } else if (ch == "/" ) {
          stream.skipToEnd();
          style = "comment";
        }
      }
      return style;
    }

    function ruby(stream, state) {
      var ch = stream.peek();

      if (ch == ")" || ch == "}") {
        stream.next(); // skip these characters
        state.tokenize = html;
        return null;
      } else if (stream.match("-#")) {
        stream.skipToEnd();
        return "comment";
      }

      return rubyMode.token(stream, state.rubyState);
    }

    function html(stream, state) {
      var ch = stream.peek();

      // handle cases when we switch from html to haml block
      var maybeHaml = handleHaml(stream, state)
      if (maybeHaml !== null) return maybeHaml;

      // only in html context, we handle selector of haml
      if (state.startOfLine || state.previousToken.style == "hamlTag") {
        if ( ch == "#" || ch == ".") {
          stream.match(/[\w-#\.]*/);
          return "attribute";
        }
      }

      // handle cases when we switch to ruby block
      // donot handle --> as valid ruby, make it HTML close comment instead
      if (state.startOfLine && !stream.match("-->", false) &&
          (ch == "=" || ch == "-" )) {
        state.tokenize = ruby;
        return null;
      }
      if (state.previousToken.style == "hamlTag"  && (ch == "(" || ch == "{")) {
        // haml attributes attributes
        //stream.next();
        state.tokenize = ruby;
        return null;
      }
      return htmlMode.token(stream, state.htmlState);
    }

    return {
      // default to html mode
      startState: function(base) {
        var htmlState = htmlMode.startState();
        var rubyState = rubyMode.startState();
        return {
          htmlState: htmlState,
          rubyState: rubyState,
          indented: 0,
          previousToken: { style: null, indented: 0},
          tokenize: html,
        }
      },

      copyState: function(state) {
        return {
          htmlState : CodeMirror.copyState(htmlMode, state.htmlState),
          rubyState: CodeMirror.copyState(rubyMode, state.rubyState),
          indented: state.indented,
          previousToken: state.previousToken,
          tokenize: state.tokenize
        };
      },

      token: function(stream, state) {
        if (stream.sol()) {
          state.indented = stream.indentation();
          state.startOfLine = true;
        }
        if (stream.eatSpace()) return null;
        var style = state.tokenize(stream, state);
        state.startOfLine = false;
        // dont record comment line as we only want to measure comment line with
        // the opening comment block
        if (style != "commentLine") {
          state.previousToken = { style: style, indented: state.indented };
        }
        // if current state is ruby and the previous token is not `,` reset the
        // tokenize to html
        if (stream.eol() && state.tokenize == ruby) {
          stream.backUp(1);
          var ch = stream.peek();
          stream.next();
          if (ch && ch != ",") {
            state.tokenize = html;
          }
        }
        // reprocess some of the specific style tag when finish setting previousToken
        if (style == "hamlTag") {
          style = "tag";
        } else if (style == "commentLine") {
          style = "comment";
        }
        return style;
      },

      indent: function(state, textAfter) {
        return state.indented;
      },
    };
  }, "htmlmixed", "ruby");

  CodeMirror.defineMIME("text/x-haml", "haml");
})();
