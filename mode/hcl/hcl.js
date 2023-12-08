// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/5/LICENSE

(function (mod) {
 if (typeof exports == "object" && typeof module == "object") // CommonJS
   mod(require("../../lib/codemirror"));
 else if (typeof define == "function" && define.amd) // AMD
   define(["../../lib/codemirror"], mod);
 else // Plain browser env
   mod(CodeMirror);
})(function (CodeMirror) {
 "use strict";

 CodeMirror.defineMode("hcl", function (config) {
   var indentUnit = config.indentUnit;

   var keywords = {
     "resource": true,
     "variable": true,
     "output": true,
     "module": true,
     "provider": true,
     "data": true,
     "locals": true,
     "terraform": true,
     "if": true,
     "else": true,
     "for": true,
     "foreach": true,
     "in": true,
     "true": true,
     "false": true,
     "null": true,
   };

   var atoms = {
     "true": true,
     "false": true,
     "null": true,
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
         stream.match(/^[0-9_]+([eE][\-+]?[0-9_]+)?/);
       } else {
         stream.match(/^[0-9_]*\.?[0-9_]*([eE][\-+]?[0-9_]+)?/);
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
       if (end || !(escaped || quote == "`"))
         state.tokenize = tokenBase;
       return "string";
     };
   }

   function tokenComment(stream, state) {
     var maybeEnd = false,
       ch;
     while (ch = stream.next()) {
       if (ch == "/" && maybeEnd) {
         state.tokenize = tokenBase;
         break;
       }
       maybeEnd = (ch == "*");
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
     return state.context = new Context(state.indented, col, type, null, state.context);
   }
   function popContext(state) {
     if (!state.context.prev) return;
     var t = state.context.type;
     if (t == ")" || t == "]" || t == "}")
       state.indented = state.context.indented;
     return state.context = state.context.prev;
   }

   // Interface

   return {
     startState: function (basecolumn) {
       return {
         tokenize: null,
         context: new Context((basecolumn || 0) - indentUnit, 0, "top", false),
         indented: 0,
         startOfLine: true
       };
     },

     token: function (stream, state) {
       var ctx = state.context;
       if (stream.sol()) {
         if (ctx.align == null) ctx.align = false;
         state.indented = stream.indentation();
         state.startOfLine = true;
       }
       if (stream.eatSpace()) return null;
       curPunc = null;
       var style = (state.tokenize || tokenBase)(stream, state);
       if (style == "comment") return style;
       if (ctx.align == null) ctx.align = true;

       if (curPunc == "{") pushContext(state, stream.column(), "}");
       else if (curPunc == "[") pushContext(state, stream.column(), "]");
       else if (curPunc == "(") pushContext(state, stream.column(), ")");
       else if (curPunc == "}" && ctx.type == "}") popContext(state);
       else if (curPunc == ctx.type) popContext(state);
       state.startOfLine = false;
       return style;
     },

     indent: function (state, textAfter) {
       if (state.tokenize != tokenBase && state.tokenize != null) return CodeMirror.Pass;
       var ctx = state.context, firstChar = textAfter && textAfter.charAt(0);
       if (firstChar == "#" || firstChar == ";") return 0;
       if (stream.sol()) {
         if (ctx.type == "case" && /^(?:case|default)\b/.test(textAfter)) {
           state.context.type = "}";
           return ctx.indented;
         }
         var closing = firstChar == ctx.type;
         if (ctx.align) return ctx.column + (closing ? 0 : 1);
         else return ctx.indented + (closing ? 0 : indentUnit);
       }
     },

     electricChars: "{}):",
     closeBrackets: "()[]{}''\"\"``",
     fold: "brace",
     blockCommentStart: "/*",
     blockCommentEnd: "*/",
     lineComment: "//"
   };
 });

 CodeMirror.defineMIME("text/x-hcl", "hcl");

});
