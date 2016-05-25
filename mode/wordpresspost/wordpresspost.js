// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

/**
 * @name         CodeMirror WordPress Post Editor Mode
 * @description  Combines htmlmixed with the WordPress' shortcode syntax for use in the WordPress post text editor
 * @author       James Bradford
 * @link         http://arniebradfo.com
 * @license      MIT
 *
 * derived from the CodeMirror htmlmixed mode
**/

(function (mod) {
  if (typeof exports == 'object' && typeof module == 'object') { // CommonJS
    mod(require('../../lib/codemirror'), require('../htmlmixed/htmlmixed'), require('shortcode'));
  } else if (typeof define == 'function' && define.amd) { // AMD
    define(['../../lib/codemirror', '../htmlmixed/htmlmixed', 'shortcode'], mod);
  } else { // Plain browser env
    mod(CodeMirror);
  }
}(function (CodeMirror) {
  'use strict';

  CodeMirror.defineMode('wordpresspost', function (config, parserConfig) {
    var htmlmixedMode = CodeMirror.getMode(config, {
      name: 'htmlmixed',
      multilineTagIndentFactor: parserConfig.multilineTagIndentFactor,
      multilineTagIndentPastTag: parserConfig.multilineTagIndentPastTag
    });

    var shortcodeMode = CodeMirror.getMode(config, {
      name: 'shortcode',
      multilineTagIndentFactor: parserConfig.multilineTagIndentFactor,
      multilineTagIndentPastTag: parserConfig.multilineTagIndentPastTag
    });

    function shortcodeToken (stream, state) {
      state.isInShortcode = true;
      var style = shortcodeMode.token(stream, state.shortcodeState);
      var inText = state.shortcodeState.tokenize.isInText;
      var inEscape = state.shortcodeState.tokenize.isInEscape;
      if (inText) {
        state.token = htmlmixedToken;
      } else if (inEscape && /\]/.test(stream.current())) {
        var cur = stream.current();
        var open = cur.search(/\]/);
        stream.backUp(cur.length - open - 1);
        if (stream.peek() !== ']') state.token = htmlmixedToken;
      }
      return style;
    }

    function htmlmixedToken (stream, state) {
      state.isInShortcode = false;
      var style = htmlmixedMode.token(stream, state.htmlmixedState);
      var inText = state.htmlmixedState.htmlState.tokenize.isInText;
      if (inText && /\[/.test(stream.current()) && !state.htmlmixedState.localState && style === null) {
        var cur = stream.current();
        var open = cur.search(/\[/);
        stream.backUp(cur.length - open);
        if (state.shortcodeState == null) { // ===null or ===undefined
          state.shortcodeState = CodeMirror.startState(shortcodeMode, htmlmixedMode.indent(state.htmlmixedState, ''));
        }
        state.token = shortcodeToken;
      } else if (inText && /<!\-\-more|<!\-\-noteaser\-\->/.test(stream.current()) && !state.htmlmixedState.localState && style === 'comment') {
        stream.backUp(stream.current().length);
        state.token = moreToken;
      }
      return style;
    }

    function moreToken (stream, state) {
      if (stream.match('<!--more')) {
        return 'meta';
      } else if (stream.match('-->') || stream.match('<!--noteaser-->')) {
        state.token = htmlmixedToken;
        return 'meta';
      } else {
        stream.eatWhile(/[^\-/]/);
        return 'string';
      }
    }

    return {
      startState: function () {
        var state = htmlmixedMode.startState();
        return {
          token: htmlmixedToken,
          isInShortcode: false,
          shortcodeState: null,
          htmlmixedState: state
        };
      },

      copyState: function (state) {
        var shortcodeStateProx;
        if (state.shortcodeState) {
          shortcodeStateProx = CodeMirror.copyState(shortcodeMode, state.shortcodeState);
        }
        return {
          token: state.token,
          shortcodeState: shortcodeStateProx,
          htmlmixedState: CodeMirror.copyState(htmlmixedMode, state.htmlmixedState)
        };
      },

      token: function (stream, state) {
        return state.token(stream, state);
      },

      indent: function (state, textAfter) {
        if (state.isInShortcode) return htmlmixedMode.indent(state.htmlmixedState, textAfter);
        else if (!state.isInShortcode) return shortcodeMode.indent(state.shortcodeState, textAfter);
        else return CodeMirror.Pass;
      },

      innerMode: function (state) {
        if (state.isInShortcode) {
          return {
            state: state.shortcodeState,
            mode: shortcodeMode
          };
        } else {
          return {
            state: state.htmlmixedState,
            mode: htmlmixedMode
          };
        }
      }
    };
  }, 'htmlmixed', 'shortcode');
}));
