// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// mscgen, xù and msgenny modes
// 

(function(mod) {
  if ( typeof exports == "object" && typeof module == "object")// CommonJS
    mod(require("../../lib/codemirror"));
  else if ( typeof define == "function" && define.amd)// AMD
    define(["../../lib/codemirror"], mod);
  else// Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {//
  "use strict";

  CodeMirror.defineMode("mscgen", function(/*config, parserConfig*/) {
    return {
      startState : produceStartStateFunction(),
      copyState : produceCopyStateFunction(),
      token : produceTokenFunction({
        "keywords" : ["msc"],
        "options" : ["hscale", "width", "arcgradient", "wordwraparcs"],
        "attributes" : ["label", "idurl", "id", "url", "linecolor", "linecolour", "textcolor", "textcolour", "textbgcolor", "textbgcolour", "arclinecolor", "arclinecolour", "arctextcolor", "arctextcolour", "arctextbgcolor", "arctextbgcolour", "arcskip"],
        "brackets" : ["\\{", "\\}"], // [ and  ] are brackets too, but these get handled in with lists
        "arcsWords" : ["note", "abox", "rbox", "box"],
        "arcsOthers" : ["\\|\\|\\|", "\\.\\.\\.", "---", "--", "<->", "==", "<<=>>", "<=>", "\\.\\.", "<<>>", "::", "<:>", "->", "=>>", "=>", ">>", ":>", "<-", "<<=", "<=", "<<", "<:", "x-", "-x"],
        "singlecomment" : ["//", "#"],
        "operators" : ["="]
      }),
      lineComment : "#",
      blockCommentStart : "/*",
      blockCommentEnd : "*/"
    };
  });
  CodeMirror.defineMIME("text/x-mscgen", "mscgen");

  CodeMirror.defineMode("xu", function(/*config, parserConfig*/) {
    return {
      startState : produceStartStateFunction(),
      copyState : produceCopyStateFunction(),
      token : produceTokenFunction({
        "keywords" : ["msc"],
        "options" : ["hscale", "width", "arcgradient", "wordwraparcs", "watermark"],
        "attributes" : ["label", "idurl", "id", "url", "linecolor", "linecolour", "textcolor", "textcolour", "textbgcolor", "textbgcolour", "arclinecolor", "arclinecolour", "arctextcolor", "arctextcolour", "arctextbgcolor", "arctextbgcolour", "arcskip"],
        "brackets" : ["\\{", "\\}"],  // [ and  ] are brackets too, but these get handled in with lists
        "arcsWords" : ["note", "abox", "rbox", "box", "alt", "else", "opt", "break", "par", "seq", "strict", "neg", "critical", "ignore", "consider", "assert", "loop", "ref", "exc"],
        "arcsOthers" : ["\\|\\|\\|", "\\.\\.\\.", "---", "--", "<->", "==", "<<=>>", "<=>", "\\.\\.", "<<>>", "::", "<:>", "->", "=>>", "=>", ">>", ":>", "<-", "<<=", "<=", "<<", "<:", "x-", "-x"],
        "singlecomment" : ["//", "#"],
        "operators" : ["="]
      }),
      lineComment : "#",
      blockCommentStart : "/*",
      blockCommentEnd : "*/"
    };
  });
  CodeMirror.defineMIME("text/x-xu", "xu");

  CodeMirror.defineMode("msgenny", function(/*config, parserConfig*/) {
    return {
      startState : produceStartStateFunction(),
      copyState : produceCopyStateFunction(),
      token : produceTokenFunction({
        "keywords" : null,
        "options" : ["hscale", "width", "arcgradient", "wordwraparcs", "watermark"],
        "attributes" : null,
        "brackets" : ["\\{", "\\}"],
        "arcsWords" : ["note", "abox", "rbox", "box", "alt", "else", "opt", "break", "par", "seq", "strict", "neg", "critical", "ignore", "consider", "assert", "loop", "ref", "exc"],
        "arcsOthers" : ["\\|\\|\\|", "\\.\\.\\.", "---", "--", "<->", "==", "<<=>>", "<=>", "\\.\\.", "<<>>", "::", "<:>", "->", "=>>", "=>", ">>", ":>", "<-", "<<=", "<=", "<<", "<:", "x-", "-x"],
        "singlecomment" : ["//", "#"],
        "operators" : ["="]
      }),
      lineComment : "#",
      blockCommentStart : "/*",
      blockCommentEnd : "*/"

    };
  });
  CodeMirror.defineMIME("text/x-msgenny", "msgenny");

  function wordRegexpBoundary(words) {
    return new RegExp("\\b((" + words.join(")|(") + "))\\b", "i");
  }

  function wordRegexp(words) {
    return new RegExp("((" + words.join(")|(") + "))", "i");
  }

  function produceStartStateFunction() {
    return function() {
      return {
        inComment : false,
        inString : false,
        inAttributeList : false,
        inScript : false
      };
    };
  }

  function produceCopyStateFunction() {
    return function(pState) {
      return {
        inComment : pState.inComment,
        inString : pState.inString,
        inAttributeList : pState.inAttributeList,
        inScript : pState.inScript
      };
    };
  }

  function produceTokenFunction(pConfig) {

    return function(stream, state) {
      if (stream.match(wordRegexp(pConfig.brackets), true, true)) {
        return "bracket";
      }
      /* comments */
      if (!state.inComment) {
        if (stream.match(/\/\*[^\*\/]*/, true, true)) {
          state.inComment = true;
          return "comment";
        }
        if (stream.match(wordRegexp(pConfig.singlecomment), true, true)) {
          stream.skipToEnd();
          return "comment";
        }
      }
      if (state.inComment) {
        if (stream.match(/[^\*\/]*\*\//, true, true)) {
          state.inComment = false;
        } else {
          stream.skipToEnd();
        }
        return "comment";
      }
      /* strings */
      if (!state.inString && stream.match(/\"[^\"]*/, true, true)) {
        state.inString = true;
        return "string";
      }
      if (state.inString) {
        if (stream.match(/[^\"]*\"/, true, true)) {
          state.inString = false;
        } else {
          stream.skipToEnd();
        }
        return "string";
      }
      if (!!pConfig.keywords && stream.match(wordRegexpBoundary(pConfig.keywords), true, true)) {
        return "keyword";
      }
      if (stream.match(wordRegexpBoundary(pConfig.options), true, true)) {
        return "keyword";
      }
      if (stream.match(wordRegexpBoundary(pConfig.arcsWords), true, true)) {
        return "keyword";
      }
      if (stream.match(wordRegexp(pConfig.arcsOthers), true, true)) {
        return "keyword";
      }
      if (!!pConfig.operators && stream.match(wordRegexp(pConfig.operators), true, true)) {
        return "operator";
      }
      /* attribute lists */
      if (!pConfig.inAttributeList && !!pConfig.attributes && stream.match(/\[/, true, true)) {
        pConfig.inAttributeList = true;
        return "bracket";
      }
      if (pConfig.inAttributeList) {
        if (pConfig.attributes !== null && stream.match(wordRegexpBoundary(pConfig.attributes), true, true)) {
          return "attribute";
        }
        if (stream.match(/]/, true, true)) {
          pConfig.inAttributeList = false;
          return "bracket";
        }
      }

      stream.next();
      return "base";
    };
  }

});
