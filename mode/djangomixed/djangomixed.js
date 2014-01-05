/**
* djangomixed.js Based on smartymixed.js by Ruslan Osmanov
*/
CodeMirror.defineMode("djangomixed", function(config) {
  var settings, regs, helpers, parsers,
  htmlMixedMode = CodeMirror.getMode(config, "htmlmixed"),
  djangoMode = CodeMirror.getMode(config, "django"),

  settings = {
    rightDelimiter: '%}',
    leftDelimiter: '{%',
    rightVarDelimiter: '}}',
    leftVarDelimiter: '{{',
    rightCommentDelimiter: '#}',
    leftCommentDelimiter: '{#',
  };

  regs = {
    eitherLeftDelimeter: new RegExp("(?:" + settings.leftDelimiter + '|' + settings.leftVarDelimiter + ')'),
    eitherRightDelimeter: new RegExp("(?:" + settings.rightDelimiter + '|' + settings.rightVarDelimiter + ')'),
    hasLeftDelimeter: new RegExp(".*(?:" + settings.leftDelimiter + '|' + settings.leftVarDelimiter + ')'),
    htmlHasLeftDelimeter: new RegExp("[^<>&{]*(?:" + settings.leftDelimiter + '|' + settings.leftVarDelimiter + ')')
  };

  helpers = {
    chain: function(stream, state, parser) {
      state.tokenize = parser;
      return parser(stream, state);
    },

    cleanChain: function(stream, state, parser) {
      state.tokenize = null;
      state.localState = null;
      state.localMode = null;
      return (typeof parser == "string") ? (parser ? parser : null) : parser(stream, state);
    },

    maybeBackup: function(stream, pat, style) {
      var cur = stream.current();
      var close = cur.search(pat),
      m;
      if (close > - 1) stream.backUp(cur.length - close);
      else if (m = cur.match(/<\/?$/)) {
        stream.backUp(cur.length);
        if (!stream.match(pat, false)) stream.match(cur[0]);
      }
      return style;
    }
  };

  parsers = {
    html: function(stream, state) {
      if (stream.match(settings.leftCommentDelimiter, false)) {
          return helpers.chain(stream, state, parsers.inBlock("comment", settings.rightCommentDelimiter));
      } else if (stream.match(regs.htmlHasLeftDelimeter, false) && state.htmlMixedState.htmlState.tagName === null) {
        state.tokenize = parsers.django;
        state.localMode = djangoMode;
        state.localState = djangoMode.startState(htmlMixedMode.indent(state.htmlMixedState, ""));
        return helpers.maybeBackup(stream, regs.eitherLeftDelimeter, djangoMode.token(stream, state.localState));
      } else if (stream.match(regs.eitherLeftDelimeter, false)) {
        state.tokenize = parsers.django;
        state.localMode = djangoMode;
        state.localState = djangoMode.startState(htmlMixedMode.indent(state.htmlMixedState, ""));
        return helpers.maybeBackup(stream, regs.eitherLeftDelimeter, djangoMode.token(stream, state.localState));
      }
      return htmlMixedMode.token(stream, state.htmlMixedState);
    },

    django: function(stream, state) {
		if (stream.match(settings.leftCommentDelimiter, false)) {
          return helpers.chain(stream, state, parsers.inBlock("comment", settings.rightCommentDelimiter));
		} else if (stream.match(settings.rightDelimiter, false)) {
			stream.eat(settings.rightDelimiter);
			state.tokenize = parsers.html;
			state.localMode = htmlMixedMode;
			state.localState = state.htmlMixedState;
			return "django tag";
		} else if (stream.match(settings.rightVarDelimiter, false)) {
			stream.eat(settings.rightVarDelimiter);
			state.tokenize = parsers.html;
			state.localMode = htmlMixedMode;
			state.localState = state.htmlMixedState;
			return "django tag";
		}

		return helpers.maybeBackup(stream, regs.eitherRightDelimeter, djangoMode.token(stream, state.localState));
    },

    inBlock: function(style, terminator) {
      return function(stream, state) {
        while (!stream.eol()) {
          if (stream.match(terminator)) {
            helpers.cleanChain(stream, state, "");
            break;
          }
          stream.next();
        }
        return style;
      };
    }
  };

  return {
    startState: function() {
      var state = htmlMixedMode.startState();
      return {
        token: parsers.html,
        localMode: null,
        localState: null,
        htmlMixedState: state,
        tokenize: null,
        inLiteral: false
      };
    },

    copyState: function(state) {
      var local = null, tok = (state.tokenize || state.token);
      if (state.localState) {
        local = CodeMirror.copyState((tok != parsers.html ? djangoMode : htmlMixedMode), state.localState);
      }
      return {
        token: state.token,
        tokenize: state.tokenize,
        localMode: state.localMode,
        localState: local,
        htmlMixedState: CodeMirror.copyState(htmlMixedMode, state.htmlMixedState),
        inLiteral: state.inLiteral
      };
    },

    token: function(stream, state) {
      var style = (state.tokenize || state.token)(stream, state);
      return style;
    },

    indent: function(state, textAfter) {
      if (state.localMode == djangoMode
         || regs.hasLeftDelimeter.test(textAfter)) {
        return CodeMirror.Pass;
      }
      return htmlMixedMode.indent(state.htmlMixedState, textAfter);
    },

    electricChars: "<",

    innerMode: function(state) {
      return {
        state: state.localState || state.htmlMixedState,
        mode: state.localMode || htmlMixedMode
      };
    }
  };
},
"htmlmixed");

CodeMirror.defineMIME("text/x-django", "djangomixed");
// vim: et ts=2 sts=2 sw=2
