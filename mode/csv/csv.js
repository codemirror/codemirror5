(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../../addon/mode/simple"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../../addon/mode/simple"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  // Regex is taken from https://github.com/mechatroner/vscode_rainbow_csv/blob/master/syntaxes/csv.tmLanguage.json
  CodeMirror.defineSimpleMode('csv', {
    start: [
      {
        regex: /((?: *"(?:[^"]*"")*[^"]*" *(?:,|$))|(?:[^,]*(?:,|$))|)((?: *"(?:[^"]*"")*[^"]*" *(?:,|$))|(?:[^,]*(?:,|$))|)((?: *"(?:[^"]*"")*[^"]*" *(?:,|$))|(?:[^,]*(?:,|$))|)((?: *"(?:[^"]*"")*[^"]*" *(?:,|$))|(?:[^,]*(?:,|$))|)((?: *"(?:[^"]*"")*[^"]*" *(?:,|$))|(?:[^,]*(?:,|$))|)((?: *"(?:[^"]*"")*[^"]*" *(?:,|$))|(?:[^,]*(?:,|$))|)((?: *"(?:[^"]*"")*[^"]*" *(?:,|$))|(?:[^,]*(?:,|$))|)((?: *"(?:[^"]*"")*[^"]*" *(?:,|$))|(?:[^,]*(?:,|$))|)((?: *"(?:[^"]*"")*[^"]*" *(?:,|$))|(?:[^,]*(?:,|$))|)/,
        token: [
          "variable",
          "variable-2",
          "variable-3",
          "operator",
          "keyword",
          "variable",
          "variable-2",
          "variable-3",
          "operator",
          "keyword"
        ]
      }
    ]
  })
})
