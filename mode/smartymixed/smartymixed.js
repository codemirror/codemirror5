/**
* @file smartymixed.js
* @brief Smarty Mixed Codemirror mode (Smarty + Mixed HTML)
* @author Ruslan Osmanov <rrosmanov at gmail dot com>
* @version 2.0
* @date 04.07.2013
*/
CodeMirror.defineMode("smartymixed", function(config) {
  var settings, regs, helpers, parsers, htmlMode = CodeMirror.getMode(config, {
    name: "xml",
    htmlMode: true
  }),
  cssMode = CodeMirror.getMode(config, "css"),
  jsMode = CodeMirror.getMode(config, "javascript"),
  smartyMode = CodeMirror.getMode(config, "smarty"),

  settings = {
    rightDelimiter: '}',
    leftDelimiter: '{'
  };

  if (config.hasOwnProperty("leftDelimiter")) {
    settings.leftDelimiter = config.leftDelimiter;
  }
  if (config.hasOwnProperty("rightDelimiter")) {
    settings.rightDelimiter = config.rightDelimiter;
  }

  regs = {
    operatorChars: /[+\-*& =<>!?]/,
    validIdentifier: /[a-zA-Z0-9_]/,
    stringChar: /['"]/,
    smartyLiteralOpen: new RegExp(settings.leftDelimiter + 'literal' + settings.rightDelimiter),
    smartyLiteralClose: new RegExp(settings.leftDelimiter + '\/literal' + settings.rightDelimiter),
    smartyLeftDelimOpen: new RegExp("^" + settings.leftDelimiter + "\\*")
  };

  helpers = {
    cont: function(style, lastType) {
      last = lastType;
      return style;
    },

    chain: function(stream, state, parser) {
      state.tokenize = parser;
      return parser(stream, state);
    },

    cleanChain: function(stream, state, parser) {
      state.tokenize = null;
      state.localState = null;
      state.localMode = null;
      return (typeof parser == "string") ? parser : parser(stream, state);
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
      var tagName = state.htmlState.tagName;
      var style = helpers.maybeBackup(stream, settings.leftDelimiter, htmlMode.token(stream, state.htmlState));

      if (tagName == "script" && /\btag\b/.test(style) && stream.current() == ">") {
        state.tokenize = parsers.script;
        state.localMode = jsMode;
        state.localState = jsMode.startState(htmlMode.indent(state.htmlState, ""));
      } else if (tagName == "style" && /\btag\b/.test(style) && stream.current() == ">") {
        state.tokenize = parsers.css;
        state.localMode = cssMode;
        state.localState = cssMode.startState(htmlMode.indent(state.htmlState, ""));
      } else if (stream.match(settings.leftDelimiter, false)) {
        state.tokenize = parsers.smarty;
        state.localMode = smartyMode;
        state.localState = smartyMode.startState(htmlMode.indent(state.htmlState, ""));
      }
      
      return style;
    },

    script: function(stream, state) {
      if (stream.match(/^<\/\s*script\s*>/i, false)) {
        return helpers.cleanChain(stream, state, parsers.html);
      }
      return helpers.maybeBackup(stream, /<\/\s*script\s*>/, state.localMode.token(stream, state.localState));
    },

    css: function(stream, state) {
      if (stream.match(/^<\/\s*style\s*>/i, false)) {
        return helpers.cleanChain(stream, state, parsers.html);
      }
      return helpers.maybeBackup(stream, /<\/\s*style\s*>/, cssMode.token(stream, state.localState));
    },

    smarty: function(stream, state) {
      if (stream.match(settings.leftDelimiter, false)) {
        if (stream.match(regs.smartyLeftDelimOpen, false)) {
          return helpers.chain(stream, state, parsers.inBlock("comment", "*" + settings.rightDelimiter));
        }
      } else if (stream.match(settings.rightDelimiter, true)) {
        if (stream.current() != settings.rightDelimiter) {
          return helpers.cleanChain(stream, state, parsers.html);
        }

        stream.eat(settings.rightDelimiter);
        return helpers.cleanChain(stream, state, "tag");
      }

      return helpers.maybeBackup(stream, settings.rightDelimiter, smartyMode.token(stream, state.localState));
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
      var state = htmlMode.startState();
      return {
        token: parsers.html,
        localMode: null,
        localState: null,
        htmlState: state,
        tokenize: null
      };
    },

    copyState: function(state) {
      var local = null;
      if (state.localState) {
        var tok = (state.tokenize || state.token);
        local = CodeMirror.copyState(
          tok == parsers.css ? cssMode :
            (tok == parsers.script ? jsMode : smartyMode), state.localState);
      }
      return {
        token: state.token,
        tokenize: state.tokenize,
        localMode: state.localMode,
        localState: local,
        htmlState: CodeMirror.copyState(htmlMode, state.htmlState),
      };
    },

    token: function(stream, state) {
      return (state.tokenize || state.token)(stream, state);
    },

    indent: function(state, textAfter) {
      if (state.localMode == smartyMode) {
        return CodeMirror.Pass;
      } else if (!state.localMode || /^\s*<\//.test(textAfter)) {
        return htmlMode.indent(state.htmlState, textAfter);
      } else if (state.localMode.indent) {
        return state.localMode.indent(state.localState, textAfter);
      }
      return CodeMirror.Pass;
    },

    electricChars: "/{}:",

    innerMode: function(state) {
      return {
        state: state.localState || state.htmlState,
        mode: state.localMode || htmlMode
      };
    }
  };
},
"xml", "javascript", "css", "smarty");

CodeMirror.defineMIME("text/x-smarty", "smartymixed");

// vim: et ts=2 sts=2 sw=2
