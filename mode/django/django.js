/**
 * Django Template mode. Based on code for smarty.js mode.
 */
CodeMirror.defineMode("django", function(config) {
  "use strict";

  // cf http://stackoverflow.com/questions/8996541
  var exit_after_tag = ( config.mode == "text/x-django" ) ? true : false;

  // our default settings; check to see if they're overridden
  var settings = {
    rightDelimiter: '%}',
    leftDelimiter: '{%',
    rightVarDelimiter: '}}',
    leftVarDelimiter: '{{',
    rightCommentDelimiter: '#}',
    leftCommentDelimiter: '{#'
  };

  var last;
  var regs = {
    djangoComment: new RegExp("^" + settings.leftCommentDelimiter),
    eitherLeftDelimeter: new RegExp("(?:" + settings.leftDelimiter + '|' + settings.leftVarDelimiter + ')'),
    eitherRightDelimeter: new RegExp("(?:" + settings.rightDelimiter + '|' + settings.rightVarDelimiter + ')'),
    validIdentifier: /[a-zA-Z0-9_\.]/,
    stringChar: /['"]/
  };

  var helpers = {
    cont: function(style, lastType) {
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
      if (stream.match(settings.leftCommentDelimiter, true)) {
          return helpers.chain(stream, state, parsers.inBlock("comment", settings.rightCommentDelimiter));
    } else if (stream.match(settings.leftDelimiter, true)) {
         state.depth++;
         state.tokenize = parsers.django;
        return helpers.cont("django tag", "startTag");
    } else if (stream.match(settings.leftVarDelimiter, true)) {
         state.depth++;
         state.tokenize = parsers.django;
        return helpers.cont("django tag", "startTag");
    } else if (stream.match(settings.rightDelimiter, true)) {
        return helpers.cont("django tag", "endTag");
    } else if (stream.match(settings.rightVarDelimiter, true)) {
        return helpers.cont("django tag", "endTag");
      } else {
        stream.next();
        return null;
      }
    },

    // parsing Django content
    django: function(stream, state) {
      if (stream.match(settings.rightDelimiter, true)) {
         state.tokenize = exit_after_tag ? null : parsers.tokenizer;
        return helpers.cont("django tag", null);
      }

      if (stream.match(settings.rightVarDelimiter, true)) {
         state.tokenize = exit_after_tag ? null : parsers.tokenizer;
        return helpers.cont("django tag", null);
      }

      if (stream.match(settings.leftDelimiter, true)) {
        state.depth++;
        return helpers.cont("django tag", "startTag");
      }

      if (stream.match(settings.leftVarDelimiter, true)) {
        state.depth++;
        return helpers.cont("django tag", "startTag");
      }

      var ch = stream.next();
      if (regs.stringChar.test(ch)) {
        state.tokenize = parsers.inAttribute(ch);
        return helpers.cont("django string", "string");
      } else if (/\d/.test(ch)) {
        stream.eatWhile(/\d/);
        return helpers.cont("django number", "number");
      } else {

        if (state.last == "startTag") {
          stream.eatWhile(regs.validIdentifier);
          return helpers.cont("django keyword", "keyword");
        } else if (state.last == "whitespace") {
          stream.eatWhile(regs.validIdentifier);
          return helpers.cont("django property", "modifier");
        } else if (/\s/.test(ch)) {
          return helpers.cont( 'django whitespace', "whitespace");
        }

        var str = "";
        if (ch != "/") {
          str += ch;
        }
        var c = null;
        while (c = stream.eat(regs.validIdentifier)) {
          str += c;
        }
        if (/\s/.test(ch)) {
          return null;
        }
        return helpers.cont("django tag", "tag");
      }
    },

    inAttribute: function(quote) {
      return function(stream, state) {
        var prevChar = null;
        var currChar = null;
        while (!stream.eol()) {
          currChar = stream.peek();
          if (stream.next() == quote && prevChar !== '\\') {
            state.tokenize = parsers.django;
            break;
          }
          prevChar = currChar;
        }
        return "django string";
      };
    },

    inBlock: function(style, terminator) {
      return function(stream, state) {
        while (!stream.eol()) {
          if (stream.match(terminator)) {
            state.tokenize = ( exit_after_tag == true ) ? null : tokenizer;
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
        mode: "django",
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

CodeMirror.defineMIME("text/x-django", "django");
