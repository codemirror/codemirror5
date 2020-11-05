// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function (mod) {
  if (typeof exports == "object" && typeof module == "object")
    // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd)
    // AMD
    define(["../../lib/codemirror"], mod);
  // Plain browser env
  else mod(CodeMirror);
})(function (CodeMirror) {
  "use strict";

  CodeMirror.defineMode("v", function (config) {
    var indentUnit = config.indentUnit;

    var keywords = {
      as: true,
      asm: true,
      assert: true,
      atomic: true,
      break: true,
      const: true,
      continue: true,
      defer: true,
      else: true,
      embed: true,
      enum: true,
      false: true,
      fn: true,
      for: true,
      go: true,
      goto: true,
      if: true,
      import: true,
      in: true,
      interface: true,
      is: true,
      lock: true,
      match: true,
      module: true,
      mut: true,
      none: true,
      or: true,
      pub: true,
      return: true,
      rlock: true,
      select: true,
      shared: true,
      sizeof: true,
      static: true,
      struct: true,
      true: true,
      type: true,
      typeof: true,
      union: true,
      unsafe: true,
    };

    var atoms = {
      bool: true,
      i8: true,
      i16: true,
      int: true,
      i64: true,
      byte: true,
      u16: true,
      u32: true,
      u64: true,
      f32: true,
      f64: true,
      string: true,
      voidptr: true,
      byteptr: true,
      intptr: true,
      charptr: true,
    };

    var isOperatorChar = /[+\-*&^%:=<>!|\/]/;

    var curPunc;

    function tokenBase(stream, state) {
      var ch = stream.next();
      if (ch == '"' || ch == "'" || ch == "`") {
        state.tokenize = tokenString(ch);
        return state.tokenize(stream, state);
      }
      if (/[\d\.]/.test(ch)) {
        if (ch == ".") {
          stream.match(/^[0-9]+([eE][\-+]?[0-9]+)?/);
        } else if (ch == "0") {
          stream.match(/^[xX][0-9a-fA-F]+/) || stream.match(/^0[0-7]+/);
        } else {
          stream.match(/^[0-9]*\.?[0-9]*([eE][\-+]?[0-9]+)?/);
        }
        return "number";
      }
      if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
        curPunc = ch;
        return null;
      }
      if (ch == "/") {
        if (stream.eat("*")) {
          state.tokenize = tokenComment;
          return tokenComment(stream, state);
        }
        if (stream.eat("/")) {
          stream.skipToEnd();
          return "comment";
        }
      }
      if (isOperatorChar.test(ch)) {
        stream.eatWhile(isOperatorChar);
        return "operator";
      }
      stream.eatWhile(/[\w\$_\xa1-\uffff]/);
      var cur = stream.current();
      if (keywords.propertyIsEnumerable(cur)) {
        if (cur == "case" || cur == "default") curPunc = "case";
        return "keyword";
      }
      if (atoms.propertyIsEnumerable(cur)) return "atom";
      return "variable";
    }

    function tokenString(quote) {
      return function (stream, state) {
        var escaped = false,
          next,
          end = false;
        while ((next = stream.next()) != null) {
          if (next == quote && !escaped) {
            end = true;
            break;
          }
          escaped = !escaped && quote != "`" && next == "\\";
        }
        if (end || !(escaped || quote == "`")) state.tokenize = tokenBase;
        return "string";
      };
    }

    function tokenComment(stream, state) {
      var maybeEnd = false,
        ch;
      while ((ch = stream.next())) {
        if (ch == "/" && maybeEnd) {
          state.tokenize = tokenBase;
          break;
        }
        maybeEnd = ch == "*";
      }
      return "comment";
    }

    function Context(indented, column, type, align, prev) {
      this.indented = indented;
      this.column = column;
      this.type = type;
      this.align = align;
      this.prev = prev;
    }
    function pushContext(state, col, type) {
      return (state.context = new Context(
        state.indented,
        col,
        type,
        null,
        state.context
      ));
    }
    function popContext(state) {
      if (!state.context.prev) return;
      var t = state.context.type;
      if (t == ")" || t == "]" || t == "}")
        state.indented = state.context.indented;
      return (state.context = state.context.prev);
    }

    // Interface

    return {
      startState: function (basecolumn) {
        return {
          tokenize: null,
          context: new Context((basecolumn || 0) - indentUnit, 0, "top", false),
          indented: 0,
          startOfLine: true,
        };
      },

      token: function (stream, state) {
        var ctx = state.context;
        if (stream.sol()) {
          if (ctx.align == null) ctx.align = false;
          state.indented = stream.indentation();
          state.startOfLine = true;
          if (ctx.type == "case") ctx.type = "}";
        }
        if (stream.eatSpace()) return null;
        curPunc = null;
        var style = (state.tokenize || tokenBase)(stream, state);
        if (style == "comment") return style;
        if (ctx.align == null) ctx.align = true;

        if (curPunc == "{") pushContext(state, stream.column(), "}");
        else if (curPunc == "[") pushContext(state, stream.column(), "]");
        else if (curPunc == "(") pushContext(state, stream.column(), ")");
        else if (curPunc == "case") ctx.type = "case";
        else if (curPunc == "}" && ctx.type == "}") popContext(state);
        else if (curPunc == ctx.type) popContext(state);
        state.startOfLine = false;
        return style;
      },

      indent: function (state, textAfter) {
        if (state.tokenize != tokenBase && state.tokenize != null)
          return CodeMirror.Pass;
        var ctx = state.context,
          firstChar = textAfter && textAfter.charAt(0);
        if (ctx.type == "case" && /^(?:case|default)\b/.test(textAfter)) {
          state.context.type = "}";
          return ctx.indented;
        }
        var closing = firstChar == ctx.type;
        if (ctx.align) return ctx.column + (closing ? 0 : 1);
        else return ctx.indented + (closing ? 0 : indentUnit);
      },

      electricChars: "{}):",
      closeBrackets: "()[]{}''\"\"``",
      fold: "brace",
      blockCommentStart: "/*",
      blockCommentEnd: "*/",
      lineComment: "//",
    };
  });

  CodeMirror.defineMIME("text/v", "v");
  CodeMirror.defineMIME("text/x-v", "v");
});
