// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../../addon/mode/simple"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../../addon/mode/simple"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

    CodeMirror.defineSimpleMode("factor", {
      // The start state contains the rules that are intially used
      start: [
        // comments
        {regex: /#?!.*/, token: "comment"},
        // strings """, multiline --> state
        {regex: /"""/, token: "string", next: "string3"},
        {regex: /"/, token: "string", next: "string"},
        // numbers: dec, hex, unicode, bin, fractional, complex
        {regex: /(?:[+-]?)(?:0x[\d,a-f]+)|(?:0o[0-7]+)|(?:0b[0,1]+)|(?:\d+.?\d*)/, token: "number"},
        //{regex: /[+-]?/} //fractional
        // definition: defining word, defined word, etc
        {regex: /(\:)(\s+)(\S+)(\s+)(\()/, token: ["keyword", null, "def", null, "keyword"], next: "stack"},
        // stack effect: ( words -- words ) --> state
        //{regex: /\(/, token: "meta", next: "stack"},
        // vocabulary using --> state
        {regex: /USING\:/, token: "keyword", next: "vocabulary"},
        // vocabulary definition/use
        {regex: /(USE\:|IN\:)(\s+)(\S+)/, token: ["keyword", null, "variable-2"]},
        // <constructors>
        {regex: /<\S+>/, token: "builtin"},
        // "keywords", incl. ; t f . [ ] { } defining words
        {regex: /;|t|f|if|\.|\[|\]|\{|\}/, token: "keyword"}
        // any id (?)

        // The regex matches the token, the token property contains the type
        //{regex: /"(?:[^\\]|\\.)*?"/, token: "string"},
        // You can match multiple tokens at once. Note that the captured
        // groups must span the whole string in this case
        //{regex: /(function)(\s+)([a-z$][\w$]*)/,
        // token: ["keyword", null, "variable-2"]},
        // Rules are matched in the order in which they appear, so there is
        // no ambiguity between this one and the one above
        //{regex: /(?:function|var|return|if|for|while|else|do|this)\b/,
        // token: "keyword"},
        //{regex: /true|false|null|undefined/, token: "atom"},
        //{regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i,
        // token: "number"},
        //{regex: /\/\/.*/, token: "comment"},
        //{regex: /\/(?:[^\\]|\\.)*?\//, token: "variable-3"},
        // A next property will cause the mode to move to a different state
        //{regex: /\/\*/, token: "comment", next: "comment"},
        //{regex: /[-+\/*=<>!]+/, token: "operator"},
        // indent and dedent properties guide autoindentation
        //{regex: /[\{\[\(]/, indent: true},
        //{regex: /[\}\]\)]/, dedent: true},
        //{regex: /[a-z$][\w$]*/, token: "variable"},
        // You can embed other modes with the mode property. This rule
        // causes all code between << and >> to be highlighted with the XML
        // mode.
        //{regex: /<</, token: "meta", mode: {spec: "xml", end: />>/}}
      ],
      vocabulary: [
        {regex: /;/, token: "keyword", next: "start"},
        {regex: /\S+/, token: "variable-2"}
      ],
      string: [
          {regex: /(?:[^\\]|\\.)*?"/, token: "string", next: "start"},
          {regex: /.*/, token: "string"}
      ],
      string3: [
          {regex: /(?:[^\\]|\\.)*?"""/, token: "string", next: "start"},
          {regex: /.*/, token: "string"}
      ],
      stack: [
        {regex: /\)/, token: "meta", next: "start"},
        {regex: /--/, token: "meta"},
        {regex: /\S*/, token: "atom"}
      ],
      // The multi-line comment state.
      //comment: [
      //  {regex: /.*?\*\//, token: "comment", next: "start"},
      //  {regex: /.*/, token: "comment"}
      //],
      // The meta property contains global information about the mode. It
      // can contain properties like lineComment, which are supported by
      // all modes, and also directives like dontIndentStates, which are
      // specific to simple modes.
      meta: {
        dontIndentStates: ["start", "vocabulary", "string", "string3", "stack"],
        lineComment: [ "!", "#!" ]
      }
    });

CodeMirror.defineMIME("text/x-factor", "factor");

});
