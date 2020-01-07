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

  let keywords = wordRegexp([
    "pragma", "import", "as", "is", "using", "new", "assembly",
    "public", "private", "external", "internal", "memory", "storage", "calldata",
    "pure", "view", "payable", "constant", "anonymous", "indexed", "virtual", "override", "returns",
    "constructor", "assert", "require", "revert", "addmod", "mulmod",
    "blockhash", "keccak256", "sha256", "ripemd160", "ecrecover",
    "now", "this", "super", "selfdestruct", "delete", "type",
    "if", "else", "try", "catch", "while", "_", "for", "do", "continue", "break", "return", "throw", "emit",
  ]);
  let globalVariables = wordRegexp(["abi", "block", "msg", "tx"]);
  let reserved = wordRegexp([
    "after", "alias", "apply", "auto", "case", "copyof", "default", "define", "finel",
    "immutable", "implements", "in", "inline", "let", "macro", "match", "mutable", "null",
    "of", "partial", "promise", "reference", "relocatable", "sealed", "sizeof",
    "static", "suppors", "switch", "typedef", "typeof", "unchecked"
  ]);

  let stringLiteral = /('.*')|(".*")/;
  let hexLiteral    = /(hex)(("([0-9a-fA-F]{2})*")|'([0-9a-fA-F]{2})*')/;
  let identifier    = /[a-zA-Z_$][a-zA-Z_$0-9]*/;
  let hexNumber     = /\-?(0x)[0-9a-fA-F]+(_?[0-9a-fA-F]+)*\b/;
  let decimalNumber = /\-?[0-9](\.[0-9]*)?([eE][0-9]+)?/;
  let operators     = /[+\-*\/%&^|:=<>!~]+/;

  let atoms = wordRegexp(["true", "false"]);
  let numberUnits = wordRegexp([
    "wei", "szabo", "finney", "ether", // Ether units
    "seconds", "minutes", "hours", "days", "weeks", "years" // Time units
  ]);
  let definition = wordRegexp([
    "contract", "library", "interface", "mapping",
    "struct", "modifier", "function", "event", "enum"
  ]);
  let natSpecTags = /@(title|author|notice|dev|param|return)\b/;

  let abiMembers = wordRegexp(["decode", "encode", "encodePacked", "encodeWithSelector", "encodeWithSignature"]);
  let blockMembers = wordRegexp(["coinbase", "difficulty", "gaslimit", "number", "timestamp"]);
  let msgMembers = wordRegexp(["data", "sender", "value"]);
  let txMembers = wordRegexp(["gasprice", "origin"]);

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
    let current = stream.current();

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
    if (state.inSingleLineDoc) {
      if (stream.sol()) {
        state.inSingleLineDoc = false;
        return "comment";
      }
      if (stream.match(natSpecTags)) return "tag";
      stream.skipToEnd();
      state.inSingleLineDoc = false;
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

    // `payable` is a builtin keyword but `address payable` is a type
    if (state.lastToken == "address" && stream.match("payable")) return "type";
    if (stream.match(builtinTypes)) return "type";

    if (stream.match(stringLiteral)) return "string";
    if (stream.match(hexLiteral)) return "number";
    if (stream.match(hexNumber) || stream.match(decimalNumber)) return "number";

    if (stream.match(operators)) return "operator";
    if (stream.match(atoms)) return "atom";

    if (stream.match(definition)) {
      state.isDefinition = true;
      return "keyword";
    }

    if (state.isDefinition && stream.match(identifier)) {
      state.isDefinition = false;
      return "def";
    }

    if (stream.match(keywords)) return "keyword";
    if (stream.match(numberUnits)) return "keyword";
    if (stream.match(reserved)) return "keyword";

    // Global variables and their properties
    if (stream.match(globalVariables)) return "keyword";
    if (state.lastToken === "abi." && stream.match(abiMembers)) return "keyword";
    if (state.lastToken === "block." && stream.match(blockMembers)) return "keyword";
    if (state.lastToken === "msg." && stream.match(msgMembers)) return "keyword";
    if (state.lastToken === "tx." && stream.match(txMembers)) return "keyword";

    // Property
    if (state.lastToken === ".") return "property";

    // Others
    if (stream.match(identifier)) return "variable";

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
          global: null
        }
      },

      token: function(stream, state) {
        let style = state.tokenize(stream, state);
        let current = stream.current();

        if (globalVariables.test(state.lastToken) && current == ".") {
          state.lastToken += current;
        } else if (current && style){
          state.lastToken = current;
        }

        return style;
      },

      lineComment: "//",
      blockCommentStart: "/*",
      blockCommentEnd: "*/"
    }
  });

  CodeMirror.defineMIME("text/x-solidity", "solidity");
});
