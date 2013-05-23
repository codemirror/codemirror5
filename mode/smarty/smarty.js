/**
 * Smarty 2 and 3 mode.
 */
CodeMirror.defineMode("smarty", function(config) {
  "use strict";

  // our default settings; check to see if they're overridden
  var settings = {
    rightDelimiter: '}',
    leftDelimiter: '{',
    smartyVersion: 2 // for backward compatibility
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

  var keyFunctions = ["debug", "extends", "function", "include", "literal"];
  var last;
  var regs = {
    operatorChars: /[+\-*&%=<>!?]/,
    validIdentifier: /[a-zA-Z0-9_]/,
    stringChar: /['"]/
  };

  var helpers = {
    continue: function(style, lastType) {
      last = lastType;
      return style;
    },
    chain: function(stream, state, parser) {
      state.tokenize = parser;
      return parser(stream, state);
    }
  };


  // our various parsers
  var parsers = {

    // the main tokenizer
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
            last = "startTag";
            return "tag";
          }
        }
      } else {
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
        return helpers.continue("tag", null);
      }

      if (stream.match(settings.leftDelimiter, true)) {
        state.depth++;
        return helpers.continue("tag", "startTag");
      }

      var ch = stream.next();
      if (ch == "$") {
        stream.eatWhile(regs.validIdentifier);
        return helpers.continue("variable-2", "variable");
      } else if (ch == ".") {
        return helpers.continue("operator", "property");
      } else if (regs.stringChar.test(ch)) {
        state.tokenize = parsers.inAttribute(ch);
        return helpers.continue("string", "string");
      } else if (regs.operatorChars.test(ch)) {
        stream.eatWhile(regs.operatorChars);
        return helpers.continue("operator", "operator");
      } else if (ch == "[" || ch == "]") {
        return helpers.continue("bracket", "bracket");
      } else if (/\d/.test(ch)) {
        stream.eatWhile(/\d/);
        return helpers.continue("number", "number");
      } else {

        if (state.last == "variable") {
          if (ch == "@") {
            stream.eatWhile(regs.validIdentifier);
            return helpers.continue("property", "property");
          } else if (ch == "|") {
            stream.eatWhile(regs.validIdentifier);
            return helpers.continue("qualifier", "modifier");
          }
        } else if (state.last == "whitespace") {
          stream.eatWhile(regs.validIdentifier);
          return helpers.continue("attribute", "modifier");
        } if (state.last == "property") {
          stream.eatWhile(regs.validIdentifier);
          return helpers.continue("property", null);
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
        for (var i=0, j=keyFunctions.length; i<j; i++) {
          if (keyFunctions[i] == str) {
            return helpers.continue("keyword", "keyword");
          }
        }
        if (/\s/.test(ch)) {
          return null;
        }
        return helpers.continue("tag", "tag");
      }
    },

    inAttribute: function(quote) {
      return function(stream, state) {
        while (!stream.eol()) {
          if (stream.next() == quote) {
            state.tokenize = parsers.smarty;
            break;
          }
        }
        return "string";
      };
    },

    inBlock: function(style, terminator) {
      return function(stream, state) {
        while (!stream.eol()) {
          if (stream.match(terminator)) {
            state.tokenize = parsers.tokenizer;
            break;
          }
          stream.next();
        }
        return style;
      };
    }
  };


  // the public API for CodeMirror
  return {
    startState: function() {
      return {
        tokenize: parsers.tokenizer,
        mode: "smarty",
        last: null,
        depth: 0
      };
    },
    token: function(stream, state) {
      var style = state.tokenize(stream, state);
      state.last = last;
      return style;
    },
    electricChars: ""
  };
});

CodeMirror.defineMIME("text/x-smarty", "smarty");