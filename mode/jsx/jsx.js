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

  // Depth means the amount of open braces in JS context, in XML
  // context 0 means not in tag, 1 means in tag, and 2 means in tag
  // and js block comment.
  function Context(state, mode, depth, prev) {
    this.state = state; this.mode = mode; this.depth = depth; this.prev = prev
  }

  function copyContext(context) {
    return new Context(CodeMirror.copyState(context.mode, context.state),
                       context.mode,
                       context.depth,
                       context.prev && copyContext(context.prev))
  }

  CodeMirror.defineMode("jsx", function(config) {
    var xmlMode = CodeMirror.getMode(config, {name: "xml", allowMissing: true, multilineTagIndentPastTag: false})
    var jsMode = CodeMirror.getMode(config, "javascript")

    return {
      startState: function() {
        return {context: new Context(CodeMirror.startState(jsMode), jsMode)}
      },

      copyState: function(state) {
        return {context: copyContext(state.context)}
      },

      token: function(stream, state) {
        var cx = state.context
        if (cx.mode == xmlMode) {
          if (cx.depth == 2) { // Inside a JS /* */ comment
            if (stream.match(/^.*?\*\//)) cx.depth = 1
            else stream.skipToEnd()
            return "comment"
          } else if (stream.peek() == "{") {
            xmlMode.skipAttribute(cx.state)
            var tagName = cx.state.tagName
            cx.state.tagName = null
            state.context = new Context(CodeMirror.startState(jsMode, xmlMode.indent(cx.state, "")),
                                        jsMode, 0, state.context)
            cx.state.tagName = tagName
            return this.token(stream, state)
          } else if (cx.depth == 1 && stream.match("//")) {
            stream.skipToEnd()
            return "comment"
          } else if (cx.depth == 1 && stream.match("/*")) {
            cx.depth = 2
            return this.token(stream, state)
          } else { // FIXME skip attribute
            var style = xmlMode.token(stream, cx.state), cur = stream.current(), stop
            if (/\btag\b/.test(style)) {
              if (/>$/.test(cur)) {
                if (cx.state.context) cx.depth = 0
                else state.context = state.context.prev
              } else if (/^</.test(cur)) {
                cx.depth = 1
              }
            } else if (!style && (stop = cur.indexOf("{")) > -1) {
              stream.backUp(cur.length - stop)
            }
            return style
          }
        } else { // jsMode
          if (stream.peek() == "<" && jsMode.expressionAllowed(stream, cx.state)) {
            jsMode.skipExpression(cx.state)
            state.context = new Context(CodeMirror.startState(xmlMode, jsMode.indent(cx.state, "")),
                                        xmlMode, 0, state.context)
            return this.token(stream, state)
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
        return state.context
      }
    }
  }, "xml", "javascript")

  CodeMirror.defineMIME("text/jsx", "jsx")
})
