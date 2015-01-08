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

  CodeMirror.defineMode("svx", function(config) {
    var indentUnit = config.indentUnit;

    var keywords = {
      "\\SVX":"keyword", "\\SV":"keyword", "m4":"def", "M4":"def", "\\SVX_version":"keyword"
    };

    var kpScopePrefixs = {
      "**":"variable-2", "*":"variable-2", "$$":"variable", "$":"variable",
      "^^":"attribute", "^":"attribute"
    };

    var chScopePrefixs = {
      ">":"property", "->":"property", "-":"hr", "|":"link", "?$":"qualifier", "?*":"qualifier",
      "@-":"variable-3", "@":"variable-3", "?":"qualifier"
    };

    var unsignedNumber = /\d[0-9_]*/;
    var decimalLiteral = /\d*\s*'s?d\s*\d[0-9_]*/i;
    var binaryLiteral = /\d*\s*'s?b\s*[xz01][xz01_]*/i;
    var octLiteral = /\d*\s*'s?o\s*[xz0-7][xz0-7_]*/i;
    var hexLiteral = /\d*\s*'s?h\s*[0-9a-fxz?][0-9a-fxz?_]*/i;
    var realLiteral = /(\d[\d_]*(\.\d[\d_]*)?E-?[\d_]+)|(\d[\d_]*\.\d[\d_]*)/i;

    var isOperatorChar = /[\[\]=:]/;
    var curPunc;
    var curScope;

    function tokenBase(stream, state) {
      if (state.startOfLine) {curScope=""; state.startOfLine=false;};
      var ch = stream.next();
      // strings
      if (ch == '"') {
        state.tokenize = tokenString(ch);
        return state.tokenize(stream, state);
      }
      // \SV region change keywords
      if ((stream.pos == 1) && (/\\SV/.test(stream.string))) {
        curScope = "ch";
        curPunc  = stream.string;
        if (/\\SVX_version/.test(stream.string)) {curPunc = "\\SVX_version";};
        stream.skipToEnd();
        if (curPunc=="\\SV") {
          state.tokenize = tokenSvRegion;
          return keywords[curPunc];
        };
        if (keywords.propertyIsEnumerable(curPunc)) { return  keywords[curPunc];};
        return "builtin";
      }
      // bypass nesting and 1 char punc
      if (/[\[\]{}\(\);\:]/.test(ch)) {
        curPunc = ch;
        return "meta";
      }
      // Numeric literals + m4 macro + @ stages
      if (stream.match(realLiteral) ||
          stream.match(decimalLiteral) ||
          stream.match(binaryLiteral) ||
          stream.match(octLiteral) ||
          stream.match(hexLiteral) ||
          stream.match(unsignedNumber) ||
          stream.match(realLiteral)) {
        curPunc =  stream.current();
        var style =  (/@/.test(curPunc.charAt(0))) ? chScopePrefixs[curPunc.charAt(0)]
          : ( ((/\b[mM]4+?/.test(curPunc))) ? keywords[curPunc] : "number");
        curScope = (curScope=="" && (style!="number")) ? "ch" : "kp";
        if (style=="def") stream.skipTo("(");
        return style;
      }
      // comments
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
      // sv hints?
      if ((ch == "!") && stream.pos==1) {
        stream.eat("!");
        return "comment";
      }
      // operators
      if (isOperatorChar.test(ch)) {
        stream.eatWhile(isOperatorChar);
        return "operator";
      }
      // phy hier
      if ((curScope != "") && (ch == "#")) {
        stream.eatWhile(/#[+-]\d/);
        curPunc = stream.current();
        curScope="ch";
        return "tag";
      }
      // needed? Ask Steve
      if ((/\.\.\.;/.test(stream.string))) { //bozo needed? Ask Steve
        curScope = "kp";
        curPunc  = stream.string;
        return "builtin";
      };
      // special SVX operators
      stream.match(/[a-zA-Z_0-9]+/);
      curPunc = stream.current();
      var firstCh = curPunc.charAt(0);
      var style;

      if (kpScopePrefixs.propertyIsEnumerable(firstCh)) {
        curScope = (curScope=="") ?"kp":curScope;
        style = kpScopePrefixs[firstCh];
        return style;
      }
      if (chScopePrefixs.propertyIsEnumerable(firstCh)) {
        curScope = (curScope=="") ?"ch":curScope;
        style = chScopePrefixs[firstCh];
        return style;
      }
      if (stream.match(/^[A-Z0-9]+/)) {curScope="kp";return "def";};
      return "builtin";
    }
    function tokenString(quote) {
      return function(stream, state) {
        var escaped = false, next, end = false;
        while ((next = stream.next()) != null) {
          if (next == quote && !escaped) {end = true; break;}
          escaped = !escaped && next == "\\";
        }
        if (end || !(escaped || quote == "`"))
          state.tokenize = tokenBase;
        return "string";
      };
    }
    function tokenComment(stream, state) {
      var maybeEnd = false, ch;
      while (ch = stream.next()) {
        if (ch == "/" && maybeEnd) {
          state.tokenize = null;
          break;
        }
        maybeEnd = (ch == "*");
      }
      return "comment";
    }
    function tokenSvRegionComment(stream, state) {
      var maybeEnd = false, ch;
      while (ch = stream.next()) {
        if (ch == "/" && maybeEnd) {
          state.tokenize = tokenSvRegion;
          break;
        }
        maybeEnd = (ch == "*");
      }
      return "comment";
    }
    function tokenSvRegion(stream, state) {
      var ch;
      while ( ch=stream.next() ) {
        if (ch == "\\" && stream.pos==1 && /[\\SVX]/.test(stream.string) ) {
          stream.backUp(1);
          state.tokenize = null;
          break;
        }
        if ((ch == "/") && stream.eat("*")) {
          state.tokenize = tokenSvRegionComment;
          return tokenSvRegionComment(stream, state);
        }
      }
      return "atom";
    }
    function Context(indented, column, align, prev, punc) {
      this.indented = indented;
      this.column = column;
      this.align = align;
      this.prev = prev;
      this.punc = punc;
      this.doIndent = false;
    }
    function pushContext(state, punc) {
      return state.context = new Context(state.indented, state.column, false, state.context, punc);
    }
    function pop2CtxLvlsReIndent(state) {
      state.context = state.context.prev;
      state.context = state.context.prev;
      state.indented = state.context.indented;
      return state.context ;
    }
    function pop2TopCtxLvlReIndent(state) {
      var column = state.context.column;
      while ( column != 0) {
        state.context = state.context.prev;
        column = state.context.column;
      };
      state.column = state.context.column;
      return state.context ;
    }

    // Interface

    return {
      startState: function(basecolumn) {
        return {
          tokenize: null,
          context: new Context((basecolumn || 0) - indentUnit, 0, "top", null,""),
          indented: 0,
          startOfLine: true
        };
      },

      token: function(stream, state) {
        var ctx = state.context;
        if (stream.sol()) {
          if (ctx.align == null) ctx.align = false;
          state.indented = stream.indentation();
          state.startOfLine = true;
        }
        if (stream.eatSpace()) return null;
        curPunc = null;
        var doIndent = false;
        var style = (state.tokenize || tokenBase)(stream, state);
        if (style == "comment") return style;
        if (style == "atom") return style;
        if (ctx.align == null) ctx.align = true;

        if (curScope == "ch") {
          if (curPunc==null) {    // bozo
            curPunc="~";
          };
          var curPuncFirstChar  = curPunc.charAt(0);
          var prevPuncFirstChar = ctx.punc.charAt(0);
          if (curPuncFirstChar !=  prevPuncFirstChar) {
            if  (curPuncFirstChar == "\\") {pop2TopCtxLvlReIndent(state);}
            else    if ((/[mM]/.test(curPuncFirstChar)) && prevPuncFirstChar=="@") {pop2CtxLvlsReIndent(state);}
            else    if ( /[mM]/.test(curPuncFirstChar)) {pushContext(state, curPunc); doIndent=true;}
            else    if ( /[>-\?#]/.test(curPuncFirstChar)) {pushContext(state, curPunc); doIndent=true;}
            else    if (curPuncFirstChar=="@" && prevPuncFirstChar=="|") {pushContext(state, curPunc); doIndent=true;}
            else    if (curPuncFirstChar=="@") {pushContext(state, curPunc); doIndent=true;}
            else    if (curPuncFirstChar=="|" && prevPuncFirstChar=="@") {pop2CtxLvlsReIndent(state);}
            else    if (curPuncFirstChar=="|") {pushContext(state, curPunc); doIndent=true;}
            else    {pushContext(state, curPunc); doIndent=true;};
          } else {
            if (curPuncFirstChar=="@") {
              ctx.indented = state.column - ctx.column;
              state.column = ctx.column;
            };
          }
        } else {
          state.column = state.column + ctx.indented;
          ctx.indented = 0;
        };
        //state.startOfLine = false;
        ctx.doIndent =  doIndent;
        return style;
      },

      indent: function(state, _textAfter) {
        if (state.tokenize != tokenBase && state.tokenize != null) return 0;
        var ctx = state.context;
        if (ctx.indented != 0) {
          var i = ctx.indented + ctx.column;
          state.context.indented = 0;
          return i;
        }
        if (ctx.doIndent) {
          ctx.doIndent = false;
          return (ctx.column+indentUnit);
        }
        return ctx.column ;
      },

      electricChars: "@|",
      fold: "brace",
      blockCommentStart: "/*",
      blockCommentEnd: "*/",
      lineComment: "//"
    };
  });

  CodeMirror.defineMIME("text/x-svx", "svx");

});
