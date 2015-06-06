// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// Factor syntax highlight - simple mode
//
// by Dimage Sapelkin (https://github.com/kerabromsmu)

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../../addon/mode/simple"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../../addon/mode/simple"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

    CodeMirror.defineMode("factor", function(){
      // The start state contains the rules that are intially used
      var mD = { // modeDefinition
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
          // vocabulary using --> state
          {regex: /USING\:/, token: "keyword", next: "vocabulary"},
          // vocabulary definition/use
          {regex: /(USE\:|IN\:)(\s+)(\S+)/, token: ["keyword", null, "variable-2"]},
          // <constructors>
          {regex: /<\S+>/, token: "builtin"},
          // "keywords", incl. ; t f . [ ] { } defining words
          {regex: /(?:;|t|f|if|\.|\[|\]|\{|\}|MAIN:)(?=\s|$)/, token: "keyword"},
          // any id (?)
          {regex: /\S+/, token: "variable"},

          {
            regex: /(?:\s*)|./,
            token: null
          }
        ],
        vocabulary: [
          {regex: /;/, token: "keyword", next: "start"},
          {regex: /\S+/, token: "variable-2"},
          {
            regex: /(?:\s*)|./,
            token: null
          }
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
          {regex: /\S+/, token: "variable-3"},
          {
            regex: /(?:\s*)|./,
            token: null
          }
        ],
        // The meta property contains global information about the mode. It
        // can contain properties like lineComment, which are supported by
        // all modes, and also directives like dontIndentStates, which are
        // specific to simple modes.
        meta: {
          dontIndentStates: ["start", "vocabulary", "string", "string3", "stack"],
          lineComment: [ "!", "#!" ]
        }
      };

      return {
          startState: function() {
            return {state:"start", more:null, words:null};
          },

        token: function(stream, state) {
          var stDef = mD[state.state];
          var stMore = state.more;
          //console.log(stMore);
          if (stMore && stMore.length>0) {
            //console.log(state.words[0] + " -" + state.more[0] + "- " + state.state);
            stream.match(state.words.shift());
            return state.more.shift();
          } else {
            state.words = null;
            state.more = null;
          }
          for (var idx in stDef) {
            var rule = stDef[idx], rx = new RegExp("^" + rule.regex.source), tk = rule.token, nx = rule.next || state.state;
            if (tk) tk = tk.slice(0); // make a copy of the string to avoid mutilating the initial string
            var a = stream.match(rx, false);
            if (a) {
              state.state = nx;
              if (a.length > 1) {
                state.more = tk;
                state.words = a.slice(2);
                //console.log(a[1] + " @@ " + state.words + " -" + tk + "- " + state.state);
                stream.match(a[1]);
                return state.more.shift();
              }
              //console.log(a[0] + " -" + tk + "- " + state.state);
              stream.match(a[0]);
              return tk;
            }
          }
          stream.eat(/./);
          return "error";
        }
      };
    });

  CodeMirror.defineMIME("text/x-factor", "factor");
});
