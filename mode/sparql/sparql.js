// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/5/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("sparql", function(config) {
  var indentUnit = config.indentUnit;
  var curPunc;

  function wordRegexp(words) {
    return new RegExp("^(?:" + words.join("|") + ")$", "i");
  }
  var ops = wordRegexp(["str", "lang", "langmatches", "datatype", "bound", "sameterm", "isiri", "isuri",
                        "iri", "uri", "bnode", "count", "sum", "min", "max", "avg", "sample",
                        "group_concat", "rand", "abs", "ceil", "floor", "round", "concat", "substr", "strlen",
                        "replace", "ucase", "lcase", "encode_for_uri", "contains", "strstarts", "strends",
                        "strbefore", "strafter", "year", "month", "day", "hours", "minutes", "seconds",
                        "timezone", "tz", "now", "uuid", "struuid", "md5", "sha1", "sha256", "sha384",
                        "sha512", "coalesce", "if", "strlang", "strdt", "isnumeric", "regex", "exists",
                        "isblank", "isliteral", "a", "bind"]);
  var keywords = wordRegexp(["base", "prefix", "select", "distinct", "reduced", "construct", "describe",
                             "ask", "from", "named", "where", "order", "limit", "offset", "filter", "optional",
                             "graph", "by", "asc", "desc", "as", "having", "undef", "values", "group",
                             "minus", "in", "not", "service", "silent", "using", "insert", "delete", "union",
                             "true", "false", "with",
                             "data", "copy", "to", "move", "add", "create", "drop", "clear", "load", "into"]);
  var operatorChars = /[*+\-<>=&|\^\/!\?]/;
  var PN_CHARS_BASE =
    "[A-Z]|[a-z]|[\\u{00C0}-\\u{00D6}]|[\\u{00D8}-\\u{00F6}]|[\\u{00F8}-\\u{02FF}]|" +
    "[\\u{0370}-\\u{037D}]|[\\u{037F}-\\u{1FFF}]|[\\u{200C}-\\u{200D}]|[\\u{2070}-\\u{218F}]|" +
    "[\\u{2C00}-\\u{2FEF}]|[\\u{3001}-\\u{D7FF}]|[\\u{F900}-\\u{FDCF}]|[\\u{FDF0}-\\u{FFFD}]|[\\u{10000}-\\u{EFFFF}]";
  var PN_CHARS_U = PN_CHARS_BASE + "|_";
  var PN_CHARS = PN_CHARS_U + "|-|[0-9]|\\u{00B7}|[\\u{0300}-\\u{036F}]|[\\u{203F}-\\u{2040}]";
  var PREFIX_START = new RegExp(PN_CHARS_BASE, "u");
  var PREFIX_MID = new RegExp(PN_CHARS + "|\\.", "u");
  var PREFIX_END = new RegExp(PN_CHARS, "u");

  function tokenBase(stream, state) {
    var ch = stream.next();
    curPunc = null;
    if (ch == "$" || ch == "?") {
      if(ch == "?" && stream.match(/\s/, false)){
        return "operator";
      }
      stream.match(/^[A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][A-Za-z0-9_\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]*/);
      return "variable-2";
    }
    else if (ch == "<" && !stream.match(/^[\s\u00a0=]/, false)) {
      stream.match(/^[^\s\u00a0>]*>?/);
      return "atom";
    }
    else if (ch == "\"" || ch == "'") {
      state.tokenize = tokenLiteral(ch);
      return state.tokenize(stream, state);
    }
    else if (/[{}\(\),\.;\[\]]/.test(ch)) {
      curPunc = ch;
      return "bracket";
    }
    else if (ch == "#") {
      stream.skipToEnd();
      return "comment";
    }
    else if (operatorChars.test(ch)) {
      return "operator";
    }
    else if (ch == ":") {
      eatPnLocal(stream);
      return "atom";
    }
    else if (ch == "@") {
      stream.eatWhile(/[a-z\d\-]/i);
      return "meta";
    }
    else {
      if (PREFIX_START.test(ch)) {
        if (stream.eatWhile(PREFIX_MID)) {
          stream.backUp(1);
          if (stream.eat(PREFIX_END) && stream.eat(":")) {
            eatPnLocal(stream);
            return "atom";
          }
        } else if (stream.eat(":")) {
          eatPnLocal(stream);
          return "atom";
        }
      }
      stream.eatWhile(/[_\w\d]/);
      var word = stream.current();
      if (ops.test(word))
        return "builtin";
      else if (keywords.test(word))
        return "keyword";
      else
        return "variable";
    }
  }

  function eatPnLocal(stream) {
    stream.match(/(\.(?=[\w_\-\\%])|[:\w_-]|\\[-\\_~.!$&'()*+,;=/?#@%]|%[a-f\d][a-f\d])+/i);
  }

  function tokenLiteral(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped) {
          state.tokenize = tokenBase;
          break;
        }
        escaped = !escaped && ch == "\\";
      }
      return "string";
    };
  }

  function pushContext(state, type, col) {
    state.context = {prev: state.context, indent: state.indent, col: col, type: type};
  }
  function popContext(state) {
    state.indent = state.context.indent;
    state.context = state.context.prev;
  }

  return {
    startState: function() {
      return {tokenize: tokenBase,
              context: null,
              indent: 0,
              col: 0};
    },

    token: function(stream, state) {
      if (stream.sol()) {
        if (state.context && state.context.align == null) state.context.align = false;
        state.indent = stream.indentation();
      }
      if (stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);

      if (style != "comment" && state.context && state.context.align == null && state.context.type != "pattern") {
        state.context.align = true;
      }

      if (curPunc == "(") pushContext(state, ")", stream.column());
      else if (curPunc == "[") pushContext(state, "]", stream.column());
      else if (curPunc == "{") pushContext(state, "}", stream.column());
      else if (/[\]\}\)]/.test(curPunc)) {
        while (state.context && state.context.type == "pattern") popContext(state);
        if (state.context && curPunc == state.context.type) {
          popContext(state);
          if (curPunc == "}" && state.context && state.context.type == "pattern")
            popContext(state);
        }
      }
      else if (curPunc == "." && state.context && state.context.type == "pattern") popContext(state);
      else if (/atom|string|variable/.test(style) && state.context) {
        if (/[\}\]]/.test(state.context.type))
          pushContext(state, "pattern", stream.column());
        else if (state.context.type == "pattern" && !state.context.align) {
          state.context.align = true;
          state.context.col = stream.column();
        }
      }

      return style;
    },

    indent: function(state, textAfter) {
      var firstChar = textAfter && textAfter.charAt(0);
      var context = state.context;
      if (/[\]\}]/.test(firstChar))
        while (context && context.type == "pattern") context = context.prev;

      var closing = context && firstChar == context.type;
      if (!context)
        return 0;
      else if (context.type == "pattern")
        return context.col;
      else if (context.align)
        return context.col + (closing ? 0 : 1);
      else
        return context.indent + (closing ? 0 : indentUnit);
    },

    lineComment: "#"
  };
});

CodeMirror.defineMIME("application/sparql-query", "sparql");

});
