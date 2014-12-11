// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../htmlmixed/htmlmixed"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../htmlmixed/htmlmixed"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  var indentingTags = ["template", "literal", "msg", "fallbackmsg", "let", "if", "elseif",
                       "else", "switch", "case", "default", "foreach", "ifempty", "for",
                       "call", "param", "log"];

  CodeMirror.defineMode("soy", function(config) {
    var textMode = CodeMirror.getMode(config, "text/plain");
    var modes = {
      html: CodeMirror.getMode(config, "text/html"),
      attributes: textMode,
      text: textMode,
      uri: textMode,
      css: CodeMirror.getMode(config, "text/css"),
      js: CodeMirror.getMode(config, "text/javascript")
    };

    function last(array) {
      return array[array.length - 1];
    }

    function maybeBackUp(stream, state, backUpOn) {
      var token = state.localMode.token(stream, state.localState);
      var pos = stream.current().search(backUpOn);
      if (pos > 0) {
        stream.backUp(stream.current().length - pos);
      }
      return token;
    }

    return {
      startState: function() {
        return {
          kind: [],
          kindTag: [],
          soyState: [],
          localMode: modes.html,
          localState: CodeMirror.startState(modes.html)
        };
      },

      copyState: function(state) {
        return {
          tag: state.tag, // Last seen Soy tag.
          kind: state.kind.concat([]), // Values of kind="" attributes.
          kindTag: state.kindTag.concat([]), // Opened tags with kind="" attributes.
          soyState: state.soyState.concat([]),
          indent: state.indent, // Indentation of the following line.
          forceIndent: state.forceIndent, // Whether we want to enforce this indentation.
          localMode: state.localMode,
          localState: CodeMirror.copyState(state.localMode, state.localState)
        };
      },

      token: function(stream, state) {
        var match;
        state.forceIndent = true;

        switch (last(state.soyState)) {
          case "comment":
            if (stream.match(/^.*?\*\//)) {
              state.soyState.pop();
            } else {
              stream.skipToEnd();
            }
            return "comment";

          case "variable":
            if (stream.match(/^}/)) {
              state.indent -= 2 * config.indentUnit;
              state.soyState.pop();
              return "variable-2";
            }
            stream.next();
            return null;

          case "tag":
            if (stream.match(/^\/?}/)) {
              state.indent -= (/^\//.test(state.tag) || stream.current() == "/}" || indentingTags.indexOf(state.tag) == -1 ? 2 : 1) * config.indentUnit;
              state.soyState.pop();
              return "keyword";
            } else if (stream.match(/^(\w+)(?==)/)) {
              if (stream.current() == "kind" && (match = stream.match(/^="([^"]+)/, false))) {
                var kind = match[1];
                state.kind.push(kind);
                state.kindTag.push(state.tag);
                state.localMode = modes[kind] || modes.html;
                state.localState = CodeMirror.startState(state.localMode, state.indent); // TODO: Base indent isn't supported by the HTML mode.
              }
              return "attribute";
            } else if (stream.match(/^"/)) {
              state.soyState.push("string");
              return "string";
            }
            stream.next();
            return null;

          case "literal":
            if (stream.match(/^\{\/literal}/)) {
              state.indent -= config.indentUnit;
              state.soyState.pop();
              return "keyword";
            }
            return maybeBackUp(stream, state, /\{/);

          case "string":
            if (stream.match(/^.*?"/)) {
              state.soyState.pop();
            } else {
              stream.skipToEnd();
            }
            return "string";
        }

        if (stream.match(/^\/\*/)) {
          state.soyState.push("comment");
          return "comment";
        } else if (stream.match(stream.sol() ? /^\/\// : /^\s+\/\//)) {
          return "comment";
        } else if (stream.match(/^\{\$\w*/)) {
          state.indent = stream.indentation() + 2 * config.indentUnit;
          state.soyState.push("variable");
          return "variable-2";
        } else if (stream.match(/^\{literal}/)) {
          state.indent = stream.indentation() + config.indentUnit;
          state.soyState.push("literal");
          return "keyword";
        } else if (match = stream.match(/^\{([\/@\\]?\w*)/)) {
          state.indent = stream.indentation() + 2 * config.indentUnit;
          state.tag = match[1];
          if (state.tag == "/" + last(state.kindTag)) {
            // We found the tag that opened the current kind="".
            state.kind.pop();
            state.kindTag.pop();
            state.localMode = modes[last(state.kind)] || modes.html;
            state.localState = CodeMirror.startState(state.localMode, state.indent);
          }
          state.soyState.push("tag");
          return "keyword";
        }

        state.forceIndent = false;
        state.indent = stream.indentation();
        return maybeBackUp(stream, state, /\{|\/\/|\/\*/);
      },

      indent: function(state, textAfter) {
        if (/^\{(\/|(fallbackmsg|elseif|else|ifempty)\b)/.test(textAfter))
          return state.indent - config.indentUnit;

        if (state.forceIndent) {
          return state.indent;
        }
        // TODO: Defer to inner modes.
        return CodeMirror.Pass;
      },

      innerMode: function(state) {
        if (state.soyState.length && last(state.soyState) != "literal") return null;
        else return {state: state.localState, mode: state.localMode};
      },

      electricInput: /^\s*\{(\/|fallbackmsg|elseif|else|ifempty)$/,
      lineComment: "//",
      blockCommentStart: "/*",
      blockCommentEnd: "*/",
      blockCommentContinue: " * ",
      fold: "indent"
    };
  }, "htmlmixed");

  CodeMirror.registerHelper("hintWords", "soy", indentingTags.concat(
      ["delpackage", "namespace", "alias", "print", "css", "debugger"]));

  CodeMirror.defineMIME("text/x-soy", "soy");
});
