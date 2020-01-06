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

  function wordRegexp(words) {
    return new RegExp("^((" + words.join(")|(") + "))\\b");
  };

  // let multilineCommentsStart = /\/\*[^*]/;
  // let multilineCommentsEnd = /\*\//;
  // let multilineDocumentationstart = /(\/(\/\/)|(\*\*))/;
  // let multilineDocumentationEnd = /^.*?\*\//;

  let pathLiteral = "";
  let stringLiteral = /"([^'\r\n'\\]|'\\'.)*"/;
  let hexLiteral = /(hex)(("([0-9a-fA-F]{2})*")|'([0-9a-fA-F]{2})*')/;
  let identifier = /[a-zA-Z_$][a-zA-Z_$0-9]*/;

  let hexNumber = /(0x)[0-9a-fA-F]+/;
  let decimalNumber = /[0-9]+(\.[0-9]*)?([eE][0-9]+)?/;

  let operators = /[+\-*\/%&^|=<>!~]+/;

  let atoms = /(true|false)/;
  let numberUnits = wordRegexp([
    "wei", "szabo", "finney", "ether", // Ether units
    "seconds", "minutes", "hours", "days", "weeks", "years" // Time units
  ]);
  let definition = wordRegexp([
    "contract", "library", "interface",
    "struct", "modifier", "function", "event", "enum"
  ]);
  let natSpecTags = /@(title|author|notice|dev|param|return)\b/;

  let blockProperties = /\b(coinbase|difficulty|gaslimit|number|timestamp)\b/;
  let msgProperties = /\b(data|sender|value)\b/;
  let txProperties = /\b(gasprice|origin)\b/;

  let typeList = ["address", "bool", "string", "int", "uint", "fixed", "ufixed", "bytes"];
  for (let i = 8; i <= 256; i += 8) {
    typeList.push( "int" + i);
    typeList.push("uint" + i);
  }
  for (let i = 8; i <= 256; i += 8) {
    for (let j = 0; j <= 80; j++) {
      typeList.push( "fixed" + i + "x" + j);
      typeList.push("ufixed" + i + "x" + j);
    }
  }
  for (let i = 1; i <= 32; i++) typeList.push("bytes" + i);
  let builtinTypes = wordRegexp(typeList);

  function tokenBase(stream, state) {
    // Whitespace
    if (stream.eatSpace()) return null;

    // Multi-line documentation
    if (state.inMultiLineDoc) {
      if (stream.match("*/")) {
        state.inMultiLineDoc = false;
        return "comment";
      }
      if (stream.match(natSpecTags)) return "tag";
      stream.skipToEnd();
      return "comment";
    }
    if (stream.match("/**")) {
      state.inMultiLineDoc = true;
      return "comment";
    }

    // Single-line documentation
    // @todo doesn't work well!
    if (state.inSingleLineDoc) {
      if (stream.match(natSpecTags)) return "tag";
      if (stream.eol()) state.inSingleLineDoc = false;
      stream.skipToEnd();
      return "comment";
    }
    if (stream.match("///")) {
      state.inSingleLineDoc = true;
      return "comment";
    }

    // Multi-line comment
    if (state.inComment) {
      if (stream.match("*/")) {
        state.inComment = false;
        return "comment";
      }
      stream.skipToEnd();
      return "comment";
    }
    if (stream.match("/*")) {
      state.inComment = true;
      return "comment";
    }

    // Single-line comment
    if (stream.match("//")) {
      stream.skipToEnd();
      return "comment";
    }

    // Strings and Numbers
    if (stream.match(stringLiteral)) return "string";
    if (stream.match(hexLiteral)) return "number";
    if (stream.match(hexNumber) || stream.match(decimalNumber)) return "number";

    // Operator
    if (stream.match(operators)) return "operator";

    if (stream.match(atoms)) return "atom";
    if (stream.match(builtinTypes)) return "type";

    if (stream.match(definition)) {
      state.isDefinition = true;
      return "keyword";
    }

    if (state.isDefinition && stream.match(identifier)) {
      state.isDefinition = false;
      return "def";
    }

    // Others
    if (stream.match(identifier)) return null;

    stream.next();
    return null;
  }

  CodeMirror.defineMode("solidity", function() {

    return {
      startState: function() {
        return {
          tokenize: tokenBase,
          lastToken: null,
          inComment: false,
          inSingleLineDoc: false,
          inMultiLineDoc: false,
          inDefinition: false,
        }
      },

      token: function(stream, state) {
        let style = state.tokenize(stream, state);
        let current = stream.current();

        if (current && style) state.lastToken = current;

        return style;
      },

      lineComment: "//",
      blockCommentStart: "/*",
      blockCommentEnd: "*/"
    }
  });

  CodeMirror.defineMIME("text/x-solidity", "solidity");
});
