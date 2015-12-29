// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../xml/xml"), require("../javascript/javascript"))
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../xml/xml", "../javascript/javascript"], mod)
  else // Plain browser env
    mod(CodeMirror)
})(function(CodeMirror) {
  "use strict"

  function copyContext(context) {
    return {state: CodeMirror.copyState(context.mode, context.state),
            mode: context.mode,
            depth: context.depth,
            prev: context.prev && copyContext(context.prev)}
  }

  CodeMirror.defineMode("jsx", function(config) {
    var xmlMode = CodeMirror.getMode(config, "xml")
    var jsMode = CodeMirror.getMode(config, "javascript")

    return {
      startState: function() {
        return {context: {state: CodeMirror.startState(jsMode), mode: jsMode}}
      },

      copyState: function(state) {
        return {context: copyContext(state.context)}
      },

      token: function(stream, state) {
        var cx = state.context
        if (cx.mode == xmlMode) {
          if (stream.peek() == "{") {
            xmlMode.skipAttribute(cx.state)
            state.context = {state: CodeMirror.startState(jsMode, xmlMode.indent(cx.state, "")),
                             mode: jsMode,
                             depth: 1,
                             prev: state.context}
            return jsMode.token(stream, state.context.state)
          } else { // FIXME skip attribute
            var style = xmlMode.token(stream, cx.state), cur, brace
            if (/\btag\b/.test(style) && !cx.state.context && /^\/?>$/.test(stream.current()))
              state.context = state.context.prev
            else if (!style && (brace = (cur = stream.current()).indexOf("{")) > -1)
              stream.backUp(cur.length - brace)
            return style
          }
        } else { // jsMode
          if (stream.peek() == "<" && jsMode.expressionAllowed(stream, cx.state)) {
            jsMode.skipExpression(cx.state)
            state.context = {state: CodeMirror.startState(xmlMode, jsMode.indent(cx.state, "")),
                             mode: xmlMode,
                             prev: state.context}
            return xmlMode.token(stream, state.context.state)
          } else {
            var style = jsMode.token(stream, cx.state)
            if (!style && cx.depth != null) {
              var cur = stream.current()
              if (cur == "{") {
                cx.depth++
              } else if (cur == "}") {
                if (--cx.depth == 0) state.context = state.context.prev
              }
            }
            return style
          }
        }
      },

      indent: function(state, textAfter, fullLine) {
        return state.context.mode.indent(state.context.state, textAfter, fullLine)
      },

      innerMode: function(state) {
        return state.context[state.context.length - 1]
      }
    }
  }, "xml", "javascript")

  CodeMirror.defineMIME("text/jsx", "jsx")
})
