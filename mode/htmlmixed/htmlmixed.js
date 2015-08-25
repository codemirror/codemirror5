// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../xml/xml"), require("../javascript/javascript"), require("../css/css"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../xml/xml", "../javascript/javascript", "../css/css"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";
var nestedModes = {
    script: {
      attributes: {
        lang: {
          javascript: /(javascript|babel)/i
        },
        type: {
          javascript: /^(?:text|application)\/(?:x-)?(?:java|ecma)script$|^$/i
        }
      },
      defaultMode: 'javascript'
    },
    style:  {
      attributes: {
        lang: {
          css: /^css$/i
        },
        type: {
          css: /^(text\/)?(x-)?stylesheet$/i
        }
      },
      defaultMode: 'css'
    }
  }, attrRegexpCache = {}, tagRegexpCache = {};

  function deepmerge(target, src) {
    var array = Array.isArray(src);
    var dst = array && [] || {};

    if (array) {
        target = target || [];
        dst = dst.concat(target);
        src.forEach(function(e, i) {
            if (typeof dst[i] === 'undefined') {
                dst[i] = e;
            } else if (typeof e === 'object') {
                dst[i] = deepmerge(target[i], e);
            } else {
                if (target.indexOf(e) === -1) {
                    dst.push(e);
                }
            }
        });
    } else {
        if (target && typeof target === 'object') {
            Object.keys(target).forEach(function (key) {
                dst[key] = target[key];
            })
        }
        Object.keys(src).forEach(function (key) {
            if (typeof src[key] !== 'object' || !src[key]) {
                dst[key] = src[key];
            }
            else {
                if (!target[key]) {
                    dst[key] = src[key];
                } else {
                    dst[key] = deepmerge(target[key], src[key]);
                }
            }
        });
    }

    return dst;
  }

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

  function getAttrRegexp(attr) {
    var regexp;
    if (regexp = attrRegexpCache[attr]) {
      return regexp;
    }
    return attrRegexpCache[attr] = new RegExp("\\s+" + attr + "\\s*=\\s*('|\")?([^'\"]+)('|\")?\\s*");
  }

  function getAttrValue(stream, attr) {
    var pos = stream.pos, match;
    while (pos >= 0 && stream.string.charAt(pos) !== "<") {
      pos -= 1;
    }
    if (pos < 0) {
      return pos;
    }
    if (match = stream.string.slice(pos, stream.pos).match(getAttrRegexp(attr))) {
      return match[2];
    }
  }

  function getMode(modes, tagName, value) {
    if (!value) {
      return modes[tagName].defaultMode;
    }
    var attr, mode;
    modes = modes[tagName];
    for (attr in modes.attributes){
      for (mode in modes.attributes[attr]) {
        if (modes.attributes[attr][mode].test(value)) {
          return mode;
        }
      }
    }
    return modes.defaultMode;
  }

  function getTagRegexp(tagName) {
    var regexp;
    if (regexp = tagRegexpCache[tagName]) {
      return regexp;
    }
    return tagRegexpCache[tagName] = new RegExp("^<\/\s*" + tagName + "\s*>", 'i');
  }

  CodeMirror.defineMode("htmlmixed", function (config, parserConfig) {
    var htmlMode = CodeMirror.getMode(config, {name: "xml",
                                             htmlMode: true,
                                             multilineTagIndentFactor: parserConfig.multilineTagIndentFactor,
                                             multilineTagIndentPastTag: parserConfig.multilineTagIndentPastTag}),
        html, modes;
    modes = deepmerge(deepmerge({}, nestedModes), parserConfig.modes || {});
    if (parserConfig.scriptTypes) {
      for (var i = 0; i < parserConfig.scriptTypes.length; ++i) {
        var conf = parserConfig.scriptTypes[i];
        modes.script.attributes[conf.mode] = conf.matches;
      }
    }
    html = function (stream, state) {
      var tagName = state.htmlState.tagName,
        style = htmlMode.token(stream, state.htmlState),
        mode;
      if (tagName) {
        tagName = tagName.toLowerCase();
      }
      if (stream.current() === ">" && (tag = modes[tagName]) &&  /\btag\b/.test(style) &&
         (mode = getMode(modes, tagName, getAttrValue(stream, 'lang')))) {
        state.token = function (stream, state) {
          var regexp = getTagRegexp(tagName);
          if (stream.match(regexp, false)) {
            state.token = html;
            state.localState = state.localMode = null;
            return null;
          }
          return maybeBackup(stream, regexp, state.localMode.token(stream, state.localState));
        }
        mode = CodeMirror.getMode(config, mode);
        state.localMode = mode;
        state.localState = mode.startState && mode.startState(htmlMode.indent(state.htmlState, ""));
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
  }, "xml", "javascript", "css");

CodeMirror.defineMIME("text/html", "htmlmixed");
});
