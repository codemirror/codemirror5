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
        require("../jade/jade"),
        require("../handlebars/handlebars"));
  } else if (typeof define === "function" && define.amd) { // AMD
    define(["../../lib/codemirror",
            "../xml/xml",
            "../javascript/javascript",
            "../coffeescript/coffeescript",
            "../css/css",
            "../sass/sass",
            "../stylus/stylus",
            "../jade/jade",
            "../handlebars/handlebars"], mod);
  } else { // Plain browser env
    mod(CodeMirror);
  }
})(function (CodeMirror) {
  var nestedModes = {
    script: {
      attributes: {
        lang: {
          coffeescript: /coffee(script)?/
        },
        type: {
          coffeescript: /^(?:text|application)\/(?:x-)?coffee(?:script)?$/
        }
      }
    },
    style:  {
      attributes: {
        lang: {
          stylus: /^stylus$/i,
          sass: /^sass$/i
        },
        type: {
          stylus: /^(text\/)?(x-)?styl(us)?$/i,
          sass: /^text\/sass/i
        }
      }
    },
    template: {
      attributes: {
        lang: {
          vue: /^vue-template$/i,
          jade: /^jade$/i,
          handlebars: /^handlebars$/i
        },
        type: {
          jade: /^(text\/)?(x-)?jade$/i,
          handlebars: /^text\/x-handlebars-template$/i
        }
      },
      defaultMode: 'vue-template'
    }
  };

  CodeMirror.defineMode("vue-template", function (config, parserConfig) {
    "use strict";
    var mustacheOverlay = {
      token: function (stream) {
        var ch;
        if (stream.match("{{")) {
          while ((ch = stream.next()) !== null) {
            if (ch === "}" && stream.next() === "}") {
              stream.eat("}");
              return "mustache";
            }
          }
        }
        while (stream.next() && !stream.match("{{", false)) {}
        return null;
      }
    };
    return CodeMirror.overlayMode(CodeMirror.getMode(config, parserConfig.backdrop || "text/html"), mustacheOverlay);
  });

  CodeMirror.defineMode("vue", function (config) {
    return CodeMirror.getMode(config, {name: "htmlmixed", modes: nestedModes});
  },"htmlmixed", "xml", "javascript", "coffeescript", "css", "sass", "stylus", "jade", "handlebars");

  CodeMirror.defineMIME("script/x-vue", "vue");
});
