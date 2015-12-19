// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function (mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../gfm/gfm"), require("../yaml/yaml"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../gfm/gfm", "../yaml/yaml"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function (CodeMirror) {

  // a mixed mode for Markdown text with an optional YAML front matter
  CodeMirror.defineMode("yaml-markdown", function (config) {
    var gfmMode = CodeMirror.getMode(config, {name: "gfm"});
    var yamlMode = CodeMirror.getMode(config, {name: "yaml"});

    return {
      startState: function () {
        var gfmState = gfmMode.startState();
        var yamlState = yamlMode.startState();
        return {
          firstLine: true,
          mode: gfmMode,
          gfmState: gfmState,
          yamlState: yamlState
        };
      },
      copyState: function (state) {
        return {
          mode: state.mode,
          gfmState: gfmMode.copyState(state.gfmState),
          yamlState: state.yamlState
        };
      },
      token: function (stream, state) {
        if (state.firstLine && stream.match(/---/, false)) {
          state.firstLine = false;
          state.mode = yamlMode;
          return yamlMode.token(stream, state.yamlState);
        } else if (state.mode == yamlMode && stream.match(/---/, false)) {
          state.mode = gfmMode;
          return yamlMode.token(stream, state.yamlState);
        } else if (state.mode == yamlMode) {
          return state.mode.token(stream, state.yamlState);
        } else {
          return state.mode.token(stream, state.gfmState);
        }
      },
      innerMode: function (state) {
        if (state.mode == gfmMode) {
          return gfmMode.innerMode(state.gfmState);
        } else {
          return {mode: yamlMode, state: state};
        }
      },
      blankLine: function (state) {
        if (state.mode == gfmMode) {
          return gfmMode.blankLine(state.gfmState)
        }
      }
    };
  });
});
