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

CodeMirror.defineMode("julia", function(_conf, parserConf) {
  var ERRORCLASS = 'error';

  function wordRegexp(words) {
    return new RegExp("^((" + words.join(")|(") + "))\\b");
  }

  var operators = parserConf.operators || /^\.?[|&^\\%*+\-<>!=\/]=?|\?|~|:|\$|\.[<>]|<<=?|>>>?=?|\.[<>=]=|->?|\/\/|\bin\b(?!\()|[\u2208\u2209](?!\()/;
  var delimiters = parserConf.delimiters || /^[;,()[\]{}]/;
  var identifiers = parserConf.identifiers || /^[_A-Za-z\u00A1-\uFFFF][_A-Za-z0-9\u00A1-\uFFFF]*!*/;
  var blockOpeners = ["begin", "function", "type", "immutable", "let", "macro", "for", "while", "quote", "if", "else", "elseif", "try", "finally", "catch", "do"];
  var blockClosers = ["end", "else", "elseif", "catch", "finally"];
  var keywordList = ['if', 'else', 'elseif', 'while', 'for', 'begin', 'let', 'end', 'do', 'try', 'catch', 'finally', 'return', 'break', 'continue', 'global', 'local', 'const', 'export', 'import', 'importall', 'using', 'function', 'macro', 'module', 'baremodule', 'type', 'immutable', 'quote', 'typealias', 'abstract', 'bitstype'];
  var builtinList = ['true', 'false', 'nothing', 'NaN', 'Inf'];

  //var stringPrefixes = new RegExp("^[br]?('|\")")
  var stringPrefixes = /^(`|'|"{3}|([brv]?"))/;
  var keywords = wordRegexp(keywordList);
  var builtins = wordRegexp(builtinList);
  var openers = wordRegexp(blockOpeners);
  var closers = wordRegexp(blockClosers);
  var macro = /^@[_A-Za-z][_A-Za-z0-9]*/;
  var symbol = /^:[_A-Za-z\u00A1-\uFFFF][_A-Za-z0-9\u00A1-\uFFFF]*!*/;
  var typeAnnotation = /^::[^.,;"{()=$\s]+({[^}]*}+)*/;

  function inArray(state) {
    var ch = currentScope(state);
    if (ch == '[') {
      return true;
    }
    return false;
  }

  function currentScope(state) {
    if (state.scopes.length == 0) {
      return null;
    }
    return state.scopes[state.scopes.length - 1];
  }

  // tokenizers
  function tokenBase(stream, state) {
    //Handle multiline comments
    if (stream.match(/^#=\s*/)) {
      state.scopes.push('#=');
    }
    if (currentScope(state) == '#=' && stream.match(/^=#/)) {
      state.scopes.pop();
      return 'comment';
    }
    if (state.scopes.indexOf('#=') >= 0) {
      if (!stream.match(/.*?(?=(#=|=#))/)) {
        stream.skipToEnd();
      }
      return 'comment';
    }

    // Handle scope changes
    var leavingExpr = state.leavingExpr;
    if (stream.sol()) {
      leavingExpr = false;
    }
    state.leavingExpr = false;
    if (leavingExpr) {
      if (stream.match(/^'+/)) {
        return 'operator';
      }
    }

    if (stream.match(/^\.{2,3}/)) {
      return 'operator';
    }

    if (stream.eatSpace()) {
      return null;
    }

    var ch = stream.peek();

    // Handle single line comments
    if (ch === '#') {
      stream.skipToEnd();
      return 'comment';
    }

    if (ch === '[') {
      state.scopes.push('[');
    }

    var scope = currentScope(state);

    if (scope == '[' && ch === ']') {
      state.scopes.pop();
      state.leavingExpr = true;
    }

    if (scope == '(' && ch === ')') {
      state.scopes.pop();
      state.leavingExpr = true;
    }

    var match;
    if (!inArray(state) && (match=stream.match(openers, false))) {
      state.scopes.push(match);
    }

    if (!inArray(state) && stream.match(closers, false)) {
      state.scopes.pop();
    }

    if (inArray(state)) {
      if (state.lastToken == 'end' && stream.match(/^:/)) {
        return 'operator';
      }
      if (stream.match(/^end/)) {
        return 'number';
      }
    }

    if (stream.match(/^=>/)) {
      return 'operator';
    }

    // Handle Number Literals
    if (stream.match(/^[0-9\.]/, false)) {
      var imMatcher = RegExp(/^im\b/);
      var floatLiteral = false;
      // Floats
      if (stream.match(/^\d*\.(?!\.)\d+([ef][\+\-]?\d+)?/i)) { floatLiteral = true; }
      if (stream.match(/^\d+\.(?!\.)\d*/)) { floatLiteral = true; }
      if (stream.match(/^\.\d+/)) { floatLiteral = true; }
      if (stream.match(/^0x\.[0-9a-f]+p[\+\-]?\d+/i)) { floatLiteral = true; }
      if (floatLiteral) {
          // Float literals may be "imaginary"
          stream.match(imMatcher);
          state.leavingExpr = true;
          return 'number';
      }
      // Integers
      var intLiteral = false;
      // Hex
      if (stream.match(/^0x[0-9a-f]+/i)) { intLiteral = true; }
      // Binary
      if (stream.match(/^0b[01]+/i)) { intLiteral = true; }
      // Octal
      if (stream.match(/^0o[0-7]+/i)) { intLiteral = true; }
      // Decimal
      if (stream.match(/^[1-9]\d*(e[\+\-]?\d+)?/)) {
          intLiteral = true;
      }
      // Zero by itself with no other piece of number.
      if (stream.match(/^0(?![\dx])/i)) { intLiteral = true; }
      if (intLiteral) {
          // Integer literals may be "long"
          stream.match(imMatcher);
          state.leavingExpr = true;
          return 'number';
      }
    }

    if (stream.match(/^<:/)) {
      return 'operator';
    }

    if (stream.match(typeAnnotation)) {
      return 'builtin';
    }

    // Handle symbols
    if (!leavingExpr && stream.match(symbol) || stream.match(/:\./)) {
      return 'builtin';
    }

    // Handle parametric types
    if (stream.match(/^{[^}]*}(?=\()/)) {
      return 'builtin';
    }

    // Handle operators and Delimiters
    if (stream.match(operators)) {
      return 'operator';
    }

    // Handle Strings
    if (stream.match(stringPrefixes)) {
      state.tokenize = tokenStringFactory(stream.current());
      return state.tokenize(stream, state);
    }

    if (stream.match(macro)) {
      return 'meta';
    }

    if (stream.match(delimiters)) {
      return null;
    }

    if (stream.match(keywords)) {
      return 'keyword';
    }

    if (stream.match(builtins)) {
      return 'builtin';
    }

    var isDefinition = state.isDefinition ||
                       state.lastToken == 'function' ||
                       state.lastToken == 'macro' ||
                       state.lastToken == 'type' ||
                       state.lastToken == 'immutable';

    if (stream.match(identifiers)) {
      if (isDefinition) {
        if (stream.peek() === '.') {
          state.isDefinition = true;
          return 'variable';
        }
        state.isDefinition = false;
        return 'def';
      }
      if (stream.match(/^({[^}]*})*\(/, false)) {
        return callOrDef(stream, state);
      }
      state.leavingExpr = true;
      return 'variable';
    }

    // Handle non-detected items
    stream.next();
    return ERRORCLASS;
  }

  function callOrDef(stream, state) {
    var match = stream.match(/^(\(\s*)/);
    if (match) {
      if (state.firstParenPos < 0)
        state.firstParenPos = state.scopes.length;
      state.scopes.push('(');
      state.charsAdvanced += match[1].length;
    }
    if (currentScope(state) == '(' && stream.match(/^\)/)) {
      state.scopes.pop();
      state.charsAdvanced += 1;
      if (state.scopes.length <= state.firstParenPos) {
        var isDefinition = stream.match(/^\s*?=(?!=)/, false);
        stream.backUp(state.charsAdvanced);
        state.firstParenPos = -1;
        state.charsAdvanced = 0;
        if (isDefinition)
          return 'def';
        return 'builtin';
      }
    }
    // Unfortunately javascript does not support multiline strings, so we have
    // to undo anything done upto here if a function call or definition splits
    // over two or more lines.
    if (stream.match(/^$/g, false)) {
      stream.backUp(state.charsAdvanced);
      while (state.scopes.length > state.firstParenPos + 1)
        state.scopes.pop();
      state.firstParenPos = -1;
      state.charsAdvanced = 0;
      return 'builtin';
    }
    state.charsAdvanced += stream.match(/^([^()]*)/)[1].length;
    return callOrDef(stream, state);
  }

  function tokenStringFactory(delimiter) {
    while ('bruv'.indexOf(delimiter.charAt(0).toLowerCase()) >= 0) {
      delimiter = delimiter.substr(1);
    }
    var singleline = delimiter == "'";
    var OUTCLASS = 'string';

    function tokenString(stream, state) {
      while (!stream.eol()) {
        stream.eatWhile(/[^'"\\]/);
        if (stream.eat('\\')) {
            stream.next();
            if (singleline && stream.eol()) {
              return OUTCLASS;
            }
        } else if (stream.match(delimiter)) {
            state.tokenize = tokenBase;
            return OUTCLASS;
        } else {
            stream.eat(/['"]/);
        }
      }
      if (singleline) {
        if (parserConf.singleLineStringErrors) {
            return ERRORCLASS;
        } else {
            state.tokenize = tokenBase;
        }
      }
      return OUTCLASS;
    }
    tokenString.isString = true;
    return tokenString;
  }

  var external = {
    startState: function() {
      return {
        tokenize: tokenBase,
        scopes: [],
        lastToken: null,
        leavingExpr: false,
        isDefinition: false,
        charsAdvanced: 0,
        firstParenPos: -1
      };
    },

    token: function(stream, state) {
      var style = state.tokenize(stream, state);
      var current = stream.current();

      if (current && style) {
        state.lastToken = current;
      }

      // Handle '.' connected identifiers
      if (current === '.') {
        style = stream.match(identifiers, false) || stream.match(macro, false) ||
                stream.match(/\(/, false) ? 'operator' : ERRORCLASS;
      }
      return style;
    },

    indent: function(state, textAfter) {
      var delta = 0;
      if (textAfter == "end" || textAfter == "]" || textAfter == "}" || textAfter == "else" || textAfter == "elseif" || textAfter == "catch" || textAfter == "finally") {
        delta = -1;
      }
      return (state.scopes.length + delta) * _conf.indentUnit;
    },

    lineComment: "#",
    fold: "indent",
    electricChars: "edlsifyh]}"
  };
  return external;
});


CodeMirror.defineMIME("text/x-julia", "julia");

});
