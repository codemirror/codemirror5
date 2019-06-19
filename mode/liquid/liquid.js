// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../xml/xml"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../xml/xml"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("liquid", function(config) {
    var htmlMode = CodeMirror.getMode(config, {name: "text/html", multilineTagIndentFactor: 2, multilineTagIndentPastTag: false});
    // innerMode returns htmlMode after {%endcomment%} and {%endraw%} but we need to re-indent.
    var xmlMode = CodeMirror.getMode(config, {name: "xml", htmlMode: true, multilineTagIndentFactor: 2, multilineTagIndentPastTag: false});
    xmlMode.electricInput = RegExp(xmlMode.electricInput.source + /|^\s*{%-?\s*end(comment|raw)\s*-?%}$/.source);

    function last(array) {
      return array[array.length - 1];
    }

    function tokenUntil(stream, state, untilRegExp) {
      if (stream.sol()) {
        for (var indent = 0; indent < state.indent; indent++) {
          if (!stream.eat(/\s/)) break;
        }
        if (indent) return null;
      }
      var oldString = stream.string;
      var match = untilRegExp.exec(oldString.substr(stream.pos));
      if (match) {
        stream.string = oldString.substr(0, stream.pos + match.index);
      }
      var result = stream.hideFirstChars(state.indent, function() {
        return htmlMode.token(stream, state.htmlState);
      });
      stream.string = oldString;
      return result;
    }

    return {
      startState: function() {
        return {
          states: [],
          indent: 0,
          quoteKind: null,
          htmlState: CodeMirror.startState(htmlMode)
        };
      },

      copyState: function (state) {
        return {
          states: state.states.concat([]),
          indent: state.indent,
          quoteKind: state.quoteKind,
          htmlState: CodeMirror.copyState(htmlMode, state.htmlState)
        };
      },

      token: function(stream, state) {
        switch (last(state.states)) {
          case undefined:
            var match;
            if (stream.match(/^{%-?\s*comment\s*-?%}/)) {
              state.indent += config.indentUnit;
              state.states.push("comment");
              return "comment";
            } else if (stream.match(/^{%-?\s*raw\s*-?%}/)) {
              state.indent += config.indentUnit;
              state.states.push("raw");
              return "keyword";
            } else if (stream.match(/^{{/)) {
              state.states.push("object");
              return "keyword";
            } else if (match = stream.match(/^{%-?\s*(\w*)/)) {
              if (match[1] == "endcase") state.indent -= 2 * config.indentUnit;
              else if (/^end/.test(match[1])) state.indent -= config.indentUnit;
              else if (match[1] == "case") state.indent += 2 * config.indentUnit;
              else if (/^(if|unless|for|tablerow)$/.test(match[1])) state.indent += config.indentUnit;
              state.states.push("tag");
              return "keyword";
            }
            return tokenUntil(stream, state, /{{|{%/);

          case "object":
          case "tag":
            var match = stream.match(/^['"]/);
            if (match) {
              state.states.push("string");
              state.quoteKind = match[0];
              return "string";
            } else if (stream.match(last(state.states) == "object" ? /^}}/ : /^%}/)) {
              state.states.pop();
            } else {
              stream.next();
            }
            return "keyword";

          case "comment":
            if (stream.match(/^.*?{%-?\s*endcomment\s*-?%}/)) {
              state.indent -= config.indentUnit;
              state.states.pop();
            } else {
              stream.skipToEnd();
            }
            return "comment";

          case "raw":
            if (stream.match(/^{%-?\s*endraw\s*-?%}/)) {
              state.indent -= config.indentUnit;
              state.states.pop();
              return "keyword";
            }
            return tokenUntil(stream, state, /{%-?\s*endraw\s*-?%}/);

          case "string":
            var match = stream.match(/^.*?(["']|\\[\s\S])/);
            if (!match) {
              stream.skipToEnd();
            } else if (match[1] == state.quoteKind) {
              state.quoteKind = null;
              state.states.pop();
            }
            return "string";
        }
      },

      indent: function(state, textAfter, line) {
        var indent = state.indent, top = last(state.states);
        if (top == "comment" && /^{%-?\s*endcomment\s*-?%}/.test(textAfter)) indent -= config.indentUnit;
        else if (top == "raw" && /^{%-?\s*endraw\s*-?%}/.test(textAfter)) indent -= config.indentUnit;
        else if (top == undefined && /^{%-?\s*endcase/.test(textAfter)) indent -= 2 * config.indentUnit;
        else if (top == undefined && /^{%-?\s*(when|end|els)/.test(textAfter)) indent -= config.indentUnit;
        return indent + htmlMode.indent(state.htmlState, textAfter, line);
      },

      innerMode: function (state) {
        if (state.states.length && last(state.states) != "raw") return null;
        else return {state: state.htmlState, mode: htmlMode};
      },

      electricInput: /^\s*{%-?\s*(when|end|endcase|els)$/,
      blockCommentStart: "{% comment %}", // TODO: This should be /{%-?\s*comment\s*-?%}/.
      blockCommentEnd: "{% endcomment %}", // TODO: This should be /{%-?\s*endcomment\s*-?%}/.
      useInnerComments: false,
      fold: "indent"
    };
  }, "xml");

  CodeMirror.defineMIME("text/x-liquid", "liquid");
});
