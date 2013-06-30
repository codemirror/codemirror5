/**
* @file smartymixed.js
* @brief Smarty Mixed Codemirror mode (Smarty + Mixed HTML)
* @author Ruslan Osmanov <rrosmanov at gmail dot com>
* @version 1.2
* @date 30.06.2013
*/
CodeMirror.defineMode("smartymixed", function(config) {
  var settings, keyFunctions, last, regs, helpers, parsers, htmlMode = CodeMirror.getMode(config, {
    name: "xml",
    htmlMode: true
  }),
  cssMode = CodeMirror.getMode(config, "css"),
  jsMode = CodeMirror.getMode(config, "javascript"),

  // our default settings; check to see if they're overridden
  settings = {
    rightDelimiter: '}',
    leftDelimiter: '{',
    smartyVersion: 3 // for backward compatibility
  };
  if (config.hasOwnProperty("leftDelimiter")) {
    settings.leftDelimiter = config.leftDelimiter;
  }
  if (config.hasOwnProperty("rightDelimiter")) {
    settings.rightDelimiter = config.rightDelimiter;
  }
  if (config.hasOwnProperty("smartyVersion") && config.smartyVersion === 3) {
    settings.smartyVersion = 3;
  }

  keyFunctions = ["assign", "debug", "extends", "function", "include", "literal", "strip", "section", "sectionelse",
    "foreach", "foreachelse", "ldelim", "rdelim", "break", "continue", "if", "else", "elseif"];
  regs = {
    operatorChars: /[+\-*& =<>!?]/,
    validIdentifier: /[a-zA-Z0-9_]/,
    stringChar: /['"]/,
    smartyLiteralOpen: new RegExp(settings.leftDelimiter + 'literal' + settings.rightDelimiter),
    smartyLiteralClose: new RegExp(settings.leftDelimiter + '\/literal' + settings.rightDelimiter)
  };

  helpers = {
    cont: function(style, lastType) {
      last = lastType;
      return style;
    },

    chain: function(stream, state, parser) {
      state.tokenize = parser;
      state.localMode = null;
      state.localState = null;
      return parser(stream, state);
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
    },

    smartyIndent: function(state, n) {
      state.smartyIndent += n;
    }
  };

  parsers = {
    // the main smarty tokenizer
    tokenizer: function(stream, state) {
      if (stream.match(settings.leftDelimiter, true)) {
        if (stream.eat("*")) {
          return helpers.chain(stream, state, parsers.inBlock("comment", "*" + settings.rightDelimiter));
        } else {
          // Smarty 3 allows { and } surrounded by whitespace to NOT slip into Smarty mode
          state.depth++;
          var isEol = stream.eol();
          var isFollowedByWhitespace = /\s/.test(stream.peek());
          if (settings.smartyVersion === 3 && settings.leftDelimiter === "{" && (isEol || isFollowedByWhitespace)) {
            state.depth--;
            return null;
          } else {
            state.tokenize = parsers.smarty;
            state.localMode = null;
            state.localState = null;
            last = "startTag";
            return "tag";
          }
        }
      } else {
        if (stream.match(/[<>]/, false)) {
          state.tokenize = null;
          state.localMode = null;
          state.localState = null;
          return null;
        }

        stream.next();
        return null;
      }
    },

    // parsing Smarty content
    smarty: function(stream, state) {
      if (stream.match(settings.rightDelimiter, true)) {
        if (settings.smartyVersion === 3) {
          state.depth--;
          if (state.depth <= 0) {
            state.tokenize = parsers.tokenizer;
          }
        } else {
          state.tokenize = parsers.tokenizer;
        }
        state.localState = null;
        state.localMode = null;
        return helpers.cont("tag", null);
      }

      if (stream.match(settings.leftDelimiter, true)) {
        state.depth++;
        return helpers.cont("tag", "startTag");
      }

      var ch = stream.next();
      if (ch == "$") {
        stream.eatWhile(regs.validIdentifier);
        return helpers.cont("variable-2", "variable");
      } else if (ch == "|") {
        return helpers.cont("operator", "pipe");
      } else if (ch == ".") {
        return helpers.cont("operator", "property");
      } else if (regs.stringChar.test(ch)) {
        state.tokenize = parsers.inAttribute(ch);
        return helpers.cont("string", "string");
      } else if (regs.operatorChars.test(ch)) {
        stream.eatWhile(regs.operatorChars);
        return helpers.cont("operator", "operator");
      } else if (ch == "[" || ch == "]") {
        return helpers.cont("bracket", "bracket");
      } else if (ch == "(" || ch == ")") {
        return helpers.cont("bracket", "operator");
      } else if (/\d/.test(ch)) {
        stream.eatWhile(/\d/);
        return helpers.cont("number", "number");
      } else {

        if (state.last == "variable") {
          if (ch == "@") {
            stream.eatWhile(regs.validIdentifier);
            return helpers.cont("property", "property");
          } else if (ch == "|") {
            stream.eatWhile(regs.validIdentifier);
            return helpers.cont("qualifier", "modifier");
          }
        } else if (state.last == "pipe") {
          stream.eatWhile(regs.validIdentifier);
          return helpers.cont("qualifier", "modifier");
        } else if (state.last == "whitespace") {
          stream.eatWhile(regs.validIdentifier);
          return helpers.cont("attribute", "modifier");
        }
        if (state.last == "property") {
          stream.eatWhile(regs.validIdentifier);
          return helpers.cont("property", null);
        }
        if (state.last == "modifier" && ch == ":") {
          return helpers.cont("operator", null);
        } else if (/\s/.test(ch)) {
          last = "whitespace";
          return null;
        }

        var str = "";
        if (ch != "/") {
          str += ch;
        }
        var c = null;
        while (c = stream.eat(regs.validIdentifier)) {
          str += c;
        }
        for (var i = 0, j = keyFunctions.length; i < j; i++) {
          if (keyFunctions[i] == str) {
            return helpers.cont("keyword", "keyword");
          }
        }
        if (/\s/.test(ch)) {
          return null;
        }
        return helpers.cont("tag", "tag");
      }
    },

    inAttribute: function(quote) {
      return function(stream, state) {
        var prevChar = null;
        var currChar = null;
        while (!stream.eol()) {
          currChar = stream.peek();
          if (stream.next() == quote && prevChar !== '\\') {
            state.tokenize = parsers.smarty;
            break;
          }
          prevChar = currChar;
        }
        return "string";
      };
    },

    inBlock: function(style, terminator) {
      return function(stream, state) {
        while (!stream.eol()) {
          if (stream.match(terminator)) {
            state.tokenize = null; //parsers.tokenizer;
            break;
          }
          stream.next();
        }
        return style;
      };
    },

    html: function(stream, state) {
      var tagName = state.htmlState.tagName;
      var style = htmlMode.token(stream, state.htmlState);

      if (tagName == "script" && /\btag\b/.test(style) && stream.current() == ">") {
        state.tokenize = parsers.script;
        state.localMode = jsMode;
        state.localState = jsMode.startState(htmlMode.indent(state.htmlState, ""));
      } else if (tagName == "style" && /\btag\b/.test(style) && stream.current() == ">") {
        state.tokenize = parsers.css;
        state.localMode = cssMode;
        state.localState = cssMode.startState(htmlMode.indent(state.htmlState, ""));

      }
      return style;
    },

    script: function(stream, state) {
      if (stream.match(/^<\/\s*script\s*>/i, false)) {
        state.tokenize = null;
        state.localState = null;
        state.localMode = null;
        return parsers.html(stream, state);
      }
      return helpers.maybeBackup(stream, /<\/\s*script\s*>/, state.localMode.token(stream, state.localState));
    },

    css: function(stream, state) {
      if (stream.match(/^<\/\s*style\s*>/i, false)) {
        state.tokenize = null;
        state.localState = null;
        state.localMode = null;
        return parsers.html(stream, state);
      }
      return helpers.maybeBackup(stream, /<\/\s*style\s*>/, cssMode.token(stream, state.localState));
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
        tokenize: null,
        last: null,
        depth: 0,
        inLiteral: false
      };
    },

    copyState: function(state) {
      var local = null;
      if (state.localState) {
        var tok = (state.tokenize || state.token);
        local = CodeMirror.copyState(tok == parsers.css ? cssMode: (tok == parsers.script ? jsMode: null), state.localState);
      }
      return {
        token: state.token,
        tokenize: state.tokenize,
        localMode: state.localMode,
        localState: local,
        htmlState: CodeMirror.copyState(htmlMode, state.htmlState),
        last: state.last,
        depth: state.depth,
        inLiteral: state.inLiteral
      };
    },

    token: function(stream, state) {
      var style;

      if (stream.match(settings.leftDelimiter, false)) {
        // {literal} and {/literal}
        if (!state.inLiteral && stream.match(regs.smartyLiteralOpen, true)) {
          state.inLiteral = true;
          return "keyword";
        } else if (state.inLiteral && stream.match(regs.smartyLiteralClose, true)) {
          state.inLiteral = false;
          return "keyword";
        }

        if (!state.inLiteral) {
          stream.eat(settings.leftDelimiter);
          if (stream.eat("*")) { // comment block started
            // eat until the end of the comment block
            return helpers.chain(stream, state, parsers.inBlock("comment", "*" + settings.rightDelimiter));
          } else {
            // Smarty 3 allows { and } surrounded by whitespace to NOT slip into Smarty mode
            state.depth++;
            var isEol = stream.eol();
            var isFollowedByWhitespace = /\s/.test(stream.peek());
            if (settings.smartyVersion === 3 && settings.leftDelimiter === "{" && (isEol || isFollowedByWhitespace)) {
              state.depth--;
              return null;
            } else {
              state.tokenize = parsers.smarty;
              state.localMode = null;
              state.localState = null;
              last = "startTag";
              return "tag";
            }
          }
        }
      }

      style = (state.tokenize || state.token)(stream, state);

      state.last = last;
      return style;
    },

    indent: function(state, textAfter) {
      if (!state.localMode &&
         (state.tokenize == parsers.tokenizer || state.tokenize == parsers.smarty)) {
        // Looks like smarty
        return CodeMirror.Pass;
      }

      if (!state.localMode || /^\s*<\//.test(textAfter)) {
        return htmlMode.indent(state.htmlState, textAfter);
      } else if (state.localMode.indent) {
        return state.localMode.indent(state.localState, textAfter);
      } else {
        return CodeMirror.Pass;
      }
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
"xml", "javascript", "css");

CodeMirror.defineMIME("text/x-smarty", "smartymixed");

// vim: et ts=2 sts=2 sw=2
