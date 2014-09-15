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

CodeMirror.defineMode('makefile', function() {

  var words = {};

  function tokenBase(stream, state) {
    if (stream.eatSpace()) return null;

    var sol = stream.sol();
    var ch = stream.next();
    var cur = stream.current();

    // ifeq, ifneq
    if (ch === 'i' && (stream.match('feq ') || stream.match('fneq '))) {
      stream.skipToEnd();
      return "bracket";
    }
    // else, endif
    if (ch === 'e' && (stream.match('lse') || stream.match('ndif')) && stream.eol()) { return "bracket"; }
    // include
    if (sol && ch === 'i' && stream.match('nclude ')) { return "string"; }
    // makros
    if (sol && (stream.match(/^[\w]+[\s]+/) || stream.match(/^[\w]+/)) &&
       (stream.peek() === '?' || stream.peek() === '=')) { return "variable-2"; }

    // Makefile targets
    if (sol && stream.eat(':')) {
      if (stream.eat('=')) {
        return "variable-2";
      } else {
        return "header";
      }
    }
    else if (sol && ch === '$' && stream.match(/^\(+[\w]+\)+/) && stream.eat(':')) { return "header"; }
    else if (sol && stream.match(/^\$+\(+[\w]+\)+/) && stream.eat(':')) { return "header"; }
    else if (sol && stream.match(/^(.)+[\w]+:+ /)) { return "header"; }
    else if (sol && stream.match(/^(.)+[\w]+:/) && stream.eol()) { return "header"; }

    if (ch === '@') { return "atom"; }
    if (ch === '*') { return "quote"; }
    if (ch === '\\' && stream.eol()) { return "comment"; }
    if (ch === '#') {
      if (sol && stream.eat('!')) {
        stream.skipToEnd();
        return 'meta'; // 'comment'?
      }
      stream.skipToEnd();
      return 'tag';
    }
    if (ch === '%') {
        if (sol && stream.eat(':')) {
        return 'header';
      }
      return 'atom';
    }

    if (ch === '$' && stream.eat('$') && stream.match(/^[\w]+/)) { return "variable-2"; }
    if (ch === '$' && stream.eat('(')) {
      state.tokens.unshift(tokenDollar);
      return tokenize(stream, state);
    }
    if (ch === '$' && stream.eat('{')) {
      state.tokens.unshift(tokenDollarB);
      return tokenize(stream, state);
    }
    if (ch === '$' && (stream.eat('@') || stream.eat('<') || stream.eat('^'))) { return "quote"; }

    if (ch === '\'' || ch === '"' || ch === '`') {
      state.tokens.unshift(tokenString(ch));
      return tokenize(stream, state);
    }
    stream.eatWhile(/[\w-]/);
    return words.hasOwnProperty(cur) ? words[cur] : null;
  }

  function tokenString(quote) {
    return function(stream, state) {
      var next, end = false, escaped = false;
      while ((next = stream.next()) != null) {
        if (next === quote && !escaped) {
          end = true;
          break;
        }
      }
      if (end || !escaped) {
        state.tokens.shift();
      }
      return ((quote === ')' || quote === '}') ? 'variable-2' : 'string');
    };
  };


  var tokenDollar = function(stream, state) {
    if (state.tokens.length > 1) stream.eat('$');
    state.tokens[0] = tokenString(')');
    return tokenize(stream, state);
  };
  var tokenDollarB = function(stream, state) {
    if (state.tokens.length > 1) stream.eat('$');
    state.tokens[0] = tokenString('}');
    return tokenize(stream, state);
  };

  function tokenize(stream, state) {
    return (state.tokens[0] || tokenBase) (stream, state);
  };

  return {
    startState: function() {return {tokens:[]};},
    token: function(stream, state) {
      return tokenize(stream, state);
    }
  };
});

CodeMirror.defineMIME('text/x-makefile', 'makefile');

});
