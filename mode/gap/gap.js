// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function (mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../../addon/mode/simple"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../../addon/mode/simple"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function (CodeMirror) {
  'use strict';

  function createRegularExpression(words) {
    return new RegExp('(?:' + words.join('|') + ')', 'm');
  }

  var builtins = createRegularExpression(['Group', 'Sum', 'List', 'Fibonacci', 'Primes', 'InstallGlobalFunction']); // TODO add long list of standard functions from gap manual
  var other = /./;
  var comment = /#.*$/;
  var blockLiterals = /"""/;
  var literals = /"/;
  var numbers = /(?:(\d+)?\.?\d+(?![\w_@\\]))/;
  var variables = /(?:\\[(),.]?|[a-zA-Z0-9_@]+)/;
  var properties = /(?:\+|-|\*|\/|\^|~|!\.|=|<>|<|<=|>|>=|!\[|:=|\.|\.\.|->|,|;|!\{|\[|]|\{|}|\(|\)|:)/;
  var keywords = /Assert|Info|IsBound|QUIT|TryNextMethod|Unbind|and|atomic|break|continue|do|elif|else|end|false|fi|for|function|if|in|local|mod|not|od|or|quit|readonly|readwrite|rec|repeat|return|then|true|until|while/;
  var indentTokens = /function|if|repeat|while/;
  var dedentTokens = /end|od|fi/;
  var electricTokens = /fi;|od;|end;|else|elif/;

  CodeMirror.defineSimpleMode('gap', {
    start: [
      {regex: indentTokens, token: 'keyword', indent: true},
      {regex: dedentTokens, token: 'keyword', dedent: true},
      {regex: comment, token: 'comment'},
      {regex: blockLiterals, token: 'string', next: 'string2'},
      {regex: literals, token: 'string', next: 'string'},
      {regex: builtins, token: 'builtin'},
      {regex: properties, token: 'property'},
      {regex: numbers, token: 'number'},
      {regex: keywords, token: 'keyword'},
      {regex: variables, token: 'variable'},
      {regex: other, token: null}
    ],
    string: [
      {regex: /(?:[^\\]|\\.)*?"/, token: 'string', next: 'start'},
      {regex: /.*/, token: 'string'}
    ],
    string2: [
      {regex: /(?:[^\\]|\\.)*?"""/, token: 'string', next: 'start'},
      {regex: /.*/, token: 'string'}
    ],
    meta: {lineComment: '#', electricInput: electricTokens}
  });

  CodeMirror.defineMIME('text/x-gap', 'gap');

});
