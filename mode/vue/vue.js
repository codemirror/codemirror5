// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function (mod) {
  "use strict";
  if (typeof exports === "object" && typeof module === "object") {// CommonJS
    mod(require("../../lib/codemirror"),
        require("../xml/xml"),
        require("../javascript/javascript"),
        require("../coffeescript/coffeescript"),
        require("../css/css"),
        require("../sass/sass"),
        require("../stylus/stylus"),
        require("../jade/jade"));
  } else if (typeof define === "function" && define.amd) { // AMD
    define(["../../lib/codemirror",
            "../xml/xml",
            "../javascript/javascript",
            "../coffeescript/coffeescript",
            "../css/css",
            "../sass/sass",
            "../stylus/stylus",
            "../jade/jade"], mod);
  } else { // Plain browser env
    mod(CodeMirror);
  }
})(function (CodeMirror) {


 CodeMirror.defineMode("vue-template", function(config, parserConfig) {
  "use strict";
  var mustacheOverlay = {
    token: function (stream, state) {
      var ch;
      if (stream.match("{{")) {
        while ((ch = stream.next()) != null)
          if (ch == "}" && stream.next() == "}") {
            stream.eat("}");
            return "mustache";
          }
      }
      while (stream.next() != null && !stream.match("{{", false)) {}
      return null;
    }
  };
  return CodeMirror.overlayMode(CodeMirror.getMode(config, parserConfig.backdrop || "text/html"), mustacheOverlay);
});

  CodeMirror.defineMode("vue", function (config) {
    function maybeBackup(stream, pat, style) {
      var cur = stream.current(), close = cur.search(pat);
      if (close > -1) {
        stream.backUp(cur.length - close);
      } else if (cur.match(/<\/?$/)) {
        stream.backUp(cur.length);
        if (!stream.match(pat, false)) {
          stream.match(cur);
        }
      }
      return style;
    }
    var htmlMode = CodeMirror.getMode(config, 'htmlmixed'),
      html = null,
      supported = {
        script: {
          lang: {
            javascript: CodeMirror.getMode(config, 'javascript'),
            coffee: CodeMirror.getMode(config, 'coffeescript'),
            coffeescript: CodeMirror.getMode(config, 'coffeescript'),
            babel: CodeMirror.getMode(config, 'javascript')
          },
          type: {
            'text/javascript': CodeMirror.getMode(config, 'javascript'),
            'coffeescript': CodeMirror.getMode(config, 'coffeescript'),
            'text/coffeescript': CodeMirror.getMode(config, 'coffeescript'),
            'text/x-coffeescript': CodeMirror.getMode(config, 'coffeescript')
          },
          'default': CodeMirror.getMode(config, 'javascript')
        },
        style:  {
          lang: {
            css: CodeMirror.getMode(config, 'css'),
            stylus: CodeMirror.getMode(config, 'stylus'),
            sass: CodeMirror.getMode(config, 'sass')
          },
          type: {
            'text/stylesheet': CodeMirror.getMode(config, 'css'),
            'text/x-styl': CodeMirror.getMode(config, 'stylus'),
            'stylus': CodeMirror.getMode(config, 'stylus')
          },
          'default': CodeMirror.getMode(config, 'css'),
        },
        template: {
          lang: {
            vue: CodeMirror.getMode(config, 'vue-template'),
            jade: CodeMirror.getMode(config, 'jade')
          },
          type: {
            'text/x-jade': CodeMirror.getMode(config, 'jade')
          },
          'default': CodeMirror.getMode(config, 'vue-template')
        }
      };

    function getAttrValue(stream, attr) {
      var pos = stream.pos, match;
      while (pos >= 0 && stream.string.charAt(pos) !== "<") {
        pos -= 1;
      }
      if (pos < 0) {
        return pos;
      }
      match = stream.string.slice(pos, stream.pos).match(new RegExp("\\s+" + attr + "\\s*=\\s*('|\")?([^'\"]+)('|\")?\\s*"));
      if (match) {
        return match[2];
      }
    }

    html = function (stream, state) {
      var tagName = state.htmlState.htmlState.tagName,
        style = htmlMode.token(stream, state.htmlState),
        tag,
        lang,
        type,
        mode;
      if (tagName) {
        tagName = tagName.toLowerCase();
      }
      if (stream.current() === ">" && /\btag\b/.test(style)) {
        if (tag = supported[tagName]) {
          if (lang = getAttrValue(stream, 'lang')) {
            mode = tag.lang[lang];
          } else if (type = getAttrValue(stream, 'type')) {
            mode = tag.type[type];
          } else {
            mode = tag.default;
          }
          if (mode) {
            state.token = function (stream, state) {
              if (stream.match(new RegExp("^<\/\s*" + tagName + "\s*>", 'i'), false)) {
                state.token = html;
                state.localState = state.localMode = null;
                return null;
              }
              return maybeBackup(stream, new RegExp("<\/\s*" + tagName + "\s*>"),
                                 state.localMode.token(stream, state.localState));
            }
            state.localMode = mode;
            state.localState = mode.startState && mode.startState(htmlMode.indent(state.htmlState, ""));
          }
        }
      }
      return style;
    };

    return {
      startState: function () {
        var state = htmlMode.startState();
        return {token: html, localMode: null, localState: null, htmlState: state};
      },

      copyState: function (state) {
        var local;
        if (state.localState) {
          local = CodeMirror.copyState(state.localMode, state.localState);
        }
        return {token: state.token, localMode: state.localMode, localState: local,
                htmlState: CodeMirror.copyState(htmlMode, state.htmlState)};
      },

      token: function (stream, state) {
        return state.token(stream, state);
      },

      indent: function (state, textAfter) {
        if (!state.localMode || /^\s*<\//.test(textAfter)) {
          return htmlMode.indent(state.htmlState, textAfter);
        } else if (state.localMode.indent) {
          return state.localMode.indent(state.localState, textAfter);
        } else {
          return CodeMirror.Pass;
        }
      },

      innerMode: function (state) {
        return {state: state.localState || state.htmlState, mode: state.localMode || htmlMode};
      }
    };
  }, "xml", "javascript", "coffeescript", "css", "sass", "stylus", "jade");

  CodeMirror.defineMIME("text/x-vue", "vue");

});
