// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../../addon/mode/simple"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../../addon/mode/simple"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";
  
  var keywords = [
    'graph',
    'stateDiagram',
    'sequenceDiagram',
    'classDiagram',
    'pie',
    'erDiagram',
    'flowchart',
    'gantt',
    'gitGraph',
    'journey',
    'participant', 
    'as',
    
    // sequence diagram keywords
    // https://github.com/mermaid-js/mermaid/blob/master/src/diagrams/sequence/parser/sequenceDiagram.jison
    'end',
    'rect',
    'opt',
    'alt',
    'else',
    'par',
    'and',
    'end',
    'left of',
    'right of',
    'over',
    'note',
    'activate',
    'deactivate',
    'title',
    'autonumber',

    // flowchart keywords
    // https://github.com/mermaid-js/mermaid/blob/master/src/diagrams/flowchart/parser/flow.jison
    // TODO:
    'subgraph',
  ]
  var keywordsRegex = new RegExp("\\b(" + keywords.join('|') + ")\\b")

  CodeMirror.defineSimpleMode("mermaid", {
    start: [
      {
        regex: keywordsRegex,
        token: "keyword"
      },
      {
        regex: /(---|===|-->|==>|->>|->)/,
        token: "operator"
      },
      {
        regex: /".*?"/, 
        token: "string"
      },
      {
        regex: /[[{(}]+.+?[)\]}]+/,
        token: "string"
      },
      {
        regex: /%%.*$/,
        token: "comment"
      }
    ]
  });

  CodeMirror.defineMIME("text/x-mermaid", "mermaid");
});

