// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function (mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../haskell/haskell"))
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../haskell/haskell"], mod)
  else // Plain browser env
    mod(CodeMirror)
})(function (CodeMirror) {
  CodeMirror.defineMode("haskell-literate", function (config) {
    var haskellMode = CodeMirror.getMode(config, "haskell")
    return {
      startState: function () {
        return {
          haskellCode: false,
          haskellState: CodeMirror.startState(haskellMode)
        }
      },
      token: function (stream, state) {
        if ((stream.sol() && stream.next() == '>') || state.haskellCode) {
          state.haskellCode = true
          return haskellMode.token(stream, state.haskellState)
        } else {
          stream.skipToEnd()
          return "comment"
        }
      },
      blankLine: function (state) {
        state.haskellCode = false
      },
      innerMode: function (state) {
        return {state: state.haskellState, mode: haskellMode};
      }
    }
  })
})
