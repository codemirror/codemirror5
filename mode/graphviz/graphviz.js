(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../../addon/mode/simple"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../../addon/mode/simple"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  // Modify from https://github.com/Stephanvs/vscode-graphviz/blob/master/dot/syntaxes/dot.tmLanguage
  // and https://github.com/PhE/jupyterlab_graphviz/blob/master/src/mode.ts

  var MODE_NAME = 'graphviz';

  var STATES = {
    start: [
      {regex: /'.*?'|".*?"/, token: "string"},
      {regex: /-+>?|=|:/, token: "operator"},
      {regex: /[;,]/, token: "comment"},
      {regex: /[{}[\]]/, token: "bracket"},

      // storage type
      {regex: /(graph|digraph|strict|node|edge|subgraph)\b/i, token: "atom"},

      // node attribute
      {regex: /\b(bottomlabel|color|comment|distortion|fillcolor|fixedsize|fontcolor|fontname|fontsize|group|height|label|layer|orientation|peripheries|regular|shape|shapefile|sides|skew|style|toplabel|URL|width|z)\b/, token: "property"},

      // edge attribute
      {regex: /\b(arrowhead|arrowsize|arrowtail|color|comment|constraint|decorate|dir|fontcolor|fontname|fontsize|headlabel|headport|headURL|label|labelangle|labeldistance|labelfloat|labelcolor|labelfontname|labelfontsize|layer|lhead|ltail|minlen|samehead|sametail|splines|style|taillabel|tailport|tailURL|weight)\b/, token: "variable-3"},

      // graph attribute
      {regex: /\b(bgcolor|center|clusterrank|color|comment|compound|concentrate|fillcolor|fontname|fontpath|fontsize|label|labeljust|labelloc|layers|margin|mclimit|nodesep|nslimit|nslimit1|ordering|orientation|page|pagedir|quantum|rank|rankdir|ranksep|ratio|remincross|rotate|samplepoints|searchsize|size|style|URL)\b/, token: "variable-3"},

      // other attribute
      {regex: /\b(box|polygon|ellipse|oval|circle|point|egg|triangle|plaintext|plain|diamond|trapezium|parallelogram|house|pentagon|hexagon|septagon|octagon|doublecircle|doubleoctagon|tripleoctagon|invtriangle|invtrapezium|invhouse|Mdiamond|Msquare|Mcircle|rect|rectangle|square|star|none|underline|cylinder|note|tab|folder|box3d|component|promoter|cds|terminator|utr|primersite|restrictionsite|fivepoverhang|threepoverhang|noverhang|assembly|signature|insulator|ribosite|rnastab|proteasesite|proteinstab|rpromoter|rarrow|larrow|lpromoter)\b/, token: "variable-3"},

      {regex: /</, token: "meta", mode: {spec: "xml", end: />>/}},
      {regex: /#.*/, token: "comment"},
      {regex: /[a-z][a-z\d_]*/i, token: "variable-2"},
      {regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i,
       token: "number"},
      {regex: /\/\/.*/, token: "comment"},
      {regex: /\/\*/, token: "comment", next: "comment"},
    ],
    // The multi-line comment state.
    comment: [
      {regex: /.*?\*\//, token: "comment", next: "start"},
      {regex: /.*/, token: "comment"}
    ],
    meta: {
      dontIndentStates: ["comment"],
      lineComment: "//"
    }
  };
  

  CodeMirror.defineSimpleMode(MODE_NAME, STATES);
})
