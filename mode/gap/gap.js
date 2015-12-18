// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// based on the python codemirror mode
(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  function wordRegexp(words) {
    return new RegExp("^((" + words.join(")|(") + "))\\b");
  }

  var wordOperators = wordRegexp(["and", "or", "not", "is", "mod"]);
  var gapKeywords = [
        "and", "atomic", "break", "continue", "do"
      , "elif", "else", "end", "false", "fi", "for"
      , "function", "if", "in", "local", "mod", "not"
      , "od", "or", "readonly", "readwrite", "rec"
      , "repeat", "return", "then", "true", "until"
      , "while", "quit", "QUIT"
      ];
  var gapBuiltins = [ "IsBound", "Unbind", "Info", "Assert"
                      , "TryNextMethod" ];

  CodeMirror.registerHelper("hintWords", "gap", gapKeywords.concat(gapBuiltins));

  function top(state) {
    return state.scopes[state.scopes.length - 1];
  }

  CodeMirror.defineMode("gap", function(conf, parserConf) {
    var ERRORCLASS = "error";

    var singleDelimiters = parserConf.singleDelimiters || /^[\(\)\[\]\{\},:`=;\.]/;
    var doubleOperators = parserConf.doubleOperators || /^([!<>]==|<>|<<|>>|\/\/|\*\*)/;
    var doubleDelimiters = parserConf.doubleDelimiters || /^(\!.|\!\[)/;

    var singleOperators = parserConf.singleOperators || /^[\+\-\*\/%&|\^~<>!]/;
    var identifiers = parserConf.identifiers|| /^[_A-Za-z0-9\\*]*[_A-Za-z\\*][_A-Za-z0-9\\*]*/;

    var myKeywords = gapKeywords, myBuiltins = gapBuiltins;
    var stringPrefixes = new RegExp("^(([rub]|(ur)|(br))?('{3}|\"{3}|['\"]))", "i");
    var keywords = wordRegexp(myKeywords);
    var builtins = wordRegexp(myBuiltins);

    if (conf) {};

    // tokenizers
    function tokenBase(stream, state) {
      if (stream.eatSpace()) return null;
      var ch = stream.peek();

      // Handle Comments
      if (ch == "#") {
        stream.skipToEnd();
        return "comment";
      }
       // Handle operators and Delimiters
        if (stream.match(doubleDelimiters))
            return "punctuation";

        if (stream.match(doubleOperators) || stream.match(singleOperators))
            return "operator";

        if (stream.match(singleDelimiters))
            return "punctuation";

        if (state.lastToken == "." && stream.match(identifiers))
            return "property";

        if (stream.match(keywords) || stream.match(wordOperators))
            return "keyword";

        if (stream.match(builtins))
            return "builtin";

        if (stream.match(identifiers)) {
            return "variable";
        }

      // Handle Number Literals
      if (stream.match(/^[0-9\.]/, false)) {
        var floatLiteral = false;
        // Floats
        if (stream.match(/^\d*\.\d+(e[\+\-]?\d+)?/i)) { floatLiteral = true; }
        if (stream.match(/^\d+\.\d*/)) { floatLiteral = true; }
        if (stream.match(/^\.\d+/)) { floatLiteral = true; }
        if (floatLiteral) {
          return "number";
        }
        // Integers
        if (stream.match(/^\d+/)) {
          return "number";
        }
      }

      // Literal permutation. Note that permutations do not
      // necessarily come as literals.
      if (stream.match(/^\([1-9][0-9]*(,[1-9][0-9]*)*\)/)) {
          return "number";
      }

      // Handle Strings
      if (stream.match(stringPrefixes)) {
        state.tokenize = tokenStringFactory(stream.current());
        return state.tokenize(stream, state);
      }

     // Handle non-detected items
      stream.next();
      return ERRORCLASS;
    }

    function tokenStringFactory(delimiter) {
      var singleline = delimiter.length == 1;
      var OUTCLASS = "string";

    function tokenString(stream, state) {
      while (!stream.eol()) {
          stream.eatWhile(/[^'"\\]/);
          if (stream.eat("\\")) {
            stream.next();
            if (singleline && stream.eol())
              return OUTCLASS;
          } else if (stream.match(delimiter)) {
            state.tokenize = tokenBase;
            return OUTCLASS;
          } else {
            stream.eat(/['"]/);
          }
        }
        if (singleline) {
          if (parserConf.singleLineStringErrors)
            return ERRORCLASS;
          else
            state.tokenize = tokenBase;
        }
        return OUTCLASS;
      }
      tokenString.isString = true;
      return tokenString;
    }

    function tokenLexer(stream, state) {
      var style = state.tokenize(stream, state);

      if ((style == "variable" || style == "builtin")
          && state.lastToken == "meta")
        style = "meta";

      return style;
    }

    var external = {
      startState: function(basecolumn) {
        return {
          tokenize: tokenBase,
          scopes: [{offset: basecolumn || 0, type: "g", align: null}],
          lastToken: null,
          lambda: false,
          dedent: 0
        };
      },

      token: function(stream, state) {
        var addErr = state.errorToken;
        if (addErr) state.errorToken = false;
        var style = tokenLexer(stream, state);

        if (style && style != "comment")
          state.lastToken = (style == "keyword" || style == "punctuation") ? stream.current() : style;
        if (style == "punctuation") style = null;

        if (stream.eol() && state.lambda)
          state.lambda = false;
        return addErr ? style + " " + ERRORCLASS : style;
      },

      indent: function(state, textAfter) {
        if (state.tokenize != tokenBase)
          return state.tokenize.isString ? CodeMirror.Pass : 0;

        var scope = top(state);
        var closing = textAfter && textAfter.charAt(0) == scope.type;
        if (scope.align != null)
          return scope.align - (closing ? 1 : 0);
        else if (closing && state.scopes.length > 1)
          return state.scopes[state.scopes.length - 2].offset;
        else
          return scope.offset;
      },

      closeBrackets: {triples: "'\""},
      lineComment: "#",
      fold: "indent"
    };
    return external;
  });

  CodeMirror.defineMIME("text/x-gap", "gap");
});
