// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("papyrus", function(config) {

    /* Papyrus keywords are all case insensitive. */
    function wordsRE(words) {
      return new RegExp("^(?:" + words.join("|") + ")$", "i");
    }

    var indentUnit = config.indentUnit;

    var indentKeywords = [ "Else", "ElseIf", "Event", "Function", "If", "While" ];
    var dedentKeywords = [ "EndEvent", "EndFunction", "EndIf", "EndWhile" ];

    var standardKeywords = [ "Auto", "Conditional", "Extends", "Property" ];
    var keywords = wordsRE(standardKeywords.concat(indentKeywords, dedentKeywords));
    var builtins = wordsRE([ "Scriptname", "ScriptName" ]);
    var types = wordsRE([ "Bool", "Int", "String" ])

    var indentTokens = wordsRE(indentKeywords);
    var dedentTokens = wordsRE(dedentKeywords);
    var dedentPartial = wordsRE(dedentKeywords);

    function normal(stream, state) {
      var ch = stream.next();

      if(ch == ';') {
        stream.skipToEnd();
        return "comment";
      }
      if (ch == "\"" || ch == "'")
        return (state.cur = string(ch))(stream, state);
      if (ch == "{")
        return (state.cur = bracketed("comment"))(stream, state);
      if (/\d/.test(ch)) {
        stream.eatWhile(/[\w.%]/);
        return "number";
      }
      if (/[\w_]/.test(ch)) {
        stream.eatWhile(/[\w\\\-_.]/);
        return "variable";
      }
      return null;
    }

    /* Multi-line comment block. */
    function bracketed(style) {
      return function(stream, state) {
        var ch;
        while ((ch = stream.next()) != null) {
          if (ch == "}") {
            state.cur = normal;
            break;
          }
        }
        return style;
      };
    }

    function string(quote) {
      return function(stream, state) {
        var escaped = false,
          ch;
        while ((ch = stream.next()) != null) {
          if (ch == quote && !escaped)
            break;
          escaped = !escaped && ch == "\\";
        }
        if (!escaped)
          state.cur = normal;
        return "string";
      };
    }

    return {
      startState: function(basecol) {
        return { basecol: basecol || 0, indentDepth: 0, cur: normal };
      },

      token: function(stream, state) {
        if (stream.eatSpace())
          return null;

        var style = state.cur(stream, state);
        var word = stream.current();

        if (style == "variable") {
          if (keywords.test(word))
            style = "keyword";
          else if (builtins.test(word))
            style = "builtin";
          else if (types.test(word))
            style = "type";
        }

        if ((style != "comment") && (style != "string")) {
          if (indentTokens.test(word))
            ++state.indentDepth;
          else if (dedentTokens.test(word))
            --state.indentDepth;
        }

        return style;
      },

      indent: function(state, textAfter) {
        var closing = dedentPartial.test(textAfter);

        return state.basecol + indentUnit * (state.indentDepth - (closing ? 1 : 0));
      },

      electricInput: new RegExp("\\b" + dedentKeywords.join("|") + "\\b", "gi"),
      lineComment: ";",
      blockCommentStart: "{",
      blockCommentEnd: "}"
    };
  });

  CodeMirror.defineMIME("text/x-papyrus", "papyrus");
});
