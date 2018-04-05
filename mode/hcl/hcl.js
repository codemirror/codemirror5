/**
 * @license
 * Copyright 2018 Google LLC.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * @fileoverview Codemirror 2 mode for HCL files.
 * @author octo@google.com (Florian Forster)
 */

(function() {
/**
 * Keywords specific to Terraform configurations.
 *
 * @dict
 */
var terraformKeywords = {
  'atlas': true,
  'backend': true,
  'data': true,
  'locals': true,
  'module': true,
  'output': true,
  'provider': true,
  'resource': true,
  'terraform': true,
  'variable': true,
};

/**
 * HCL atoms
 *
 * @dict
 */
var hclAtoms = {
  'true': true,
  'false': true,
};

/**
 * HCL configuration.
 *
 * @struct
 * @extends {CodeMirror.ModeConfig}
 */
var hclConfig = {
  name: 'clike',
};

/**
 * Terraform configuration.
 *
 * @struct
 * @extends {CodeMirror.ModeConfig}
 */
var terraformConfig = {
  name: 'clike',
  keywords: terraformKeywords,
};

/** @record */
class hclState {
  constructor() {
    /**
     * When non-null, holds a tokenizer function. Used for multi-line state.
     * @type {?function(!CodeMirror.InputStream,!hclState):string}
     */
    this.tokenize;
  }
}

/** @record */
class hclContext {
  constructor() {
    /** @type {number} */
    this.indented;

    /** @type {string} */
    this.type;
  }
}

CodeMirror.defineMode(
    'hcl',

    /**
     * @param {!CodeMirror.EditorConfig} config
     * @param {?CodeMirror.ModeConfig} parserConfig
     * @return {!CodeMirror.Mode}
     */
    function(config, parserConfig) {
      /**
       * Consumes a quoted string. Quoted strings may span multiple lines and
       * intrast to clike's string tokenizer no backslash is required at the end
       * of the line.
       * @param {!CodeMirror.InputStream} stream Codemirror input stream.
       * @param {!hclState} state HCL state object.
       * @return {string} 'string' token type.
       */
      function stringTokenizer(stream, state) {
        var escaped = false;
        var next;
        while ((next = stream.next()) != null) {
          if (next == '"' && !escaped) {
            state.tokenize = null;
            break;
          }
          escaped = !escaped && next == '\\';
        }
        return 'string';
      }

      /**
       * Creates a tokenizer that reads a heredoc string until the given
       * delimiter is encountered.
       * @param {string} delim heredoc delimiter.
       * @return {function(!CodeMirror.InputStream,!hclState):string} tokenizer
       */
      function heredocTokenizerFactory(delim) {
        return function(stream, state) {
          stream.eatSpace();
          if (stream.match(delim, true, false) && stream.eol()) {
            state.tokenize = null;
            return 'string';
          }

          stream.skipToEnd();
          return 'string';
        };
      }

      /**
       * Consume a (multi-line) heredoc literal and emit the 'string' token
       * type. This function assumes that a '<' character has already been
       * consumed.
       * @param {!CodeMirror.InputStream} stream Codemirror input stream.
       * @param {!hclState} state HCL state object.
       * @return {(string|boolean)} 'string' or false if not a heredoc string.
       */
      function heredocTokenizer(stream, state) {
        if (!stream.eat('<')) {
          return false;
        }
        stream.eat('-');

        // read rest of line into delim
        /** @type {string} */
        var delim = '';
        while (stream.peek() != null) {
          delim += stream.next();
        }

        state.tokenize = heredocTokenizerFactory(delim);
        return 'string';
      }

      var modeConfig = parserConfig.modeConfig || terraformConfig;
      modeConfig.atoms = hclAtoms;
      modeConfig.hooks = {
        /**
         * Consumes double quoted strings.
         * @param {!CodeMirror.InputStream} stream Codemirror input stream.
         * @param {!hclState} state HCL state object.
         * @return {string} 'string' token type.
         */
        '"': function(stream, state) {
          state.tokenize = stringTokenizer;
          return state.tokenize(stream, state);
        },
        /**
         * Returns "error" when reading a single quote. The purpose of this is
         * to prevent the clike base mode to accept strings in single quotes,
         * which is not legal in HCL.
         * @param {CodeMirror.InputStream} stream Codemirror input stream.
         * @return {string} 'error' token type.
         */
        '\'': function(stream) {
          return 'error';
        },
        '<': heredocTokenizer,
        /**
         * Consumes '#' line comments.
         * @param {!CodeMirror.InputStream} stream Codemirror input stream.
         * @return {string} 'comment' token type.
         */
        '#': function(stream) {
          stream.skipToEnd();
          return 'comment';
        },
        /**
         * Indentation hook. The lack of semicolons confuses the underlying
         * "clike" scanner and it interprets the second and following lines as
         * continuation of the same "statement", applying additional indent.
         * This callback disables this by always returning ctx.indented.
         *
         * @param {!hclState} state HCL state object.
         * @param {!hclContext} ctx HCL parser context.
         * @param {string} textAfter text following the current position.
         * @return {(number|boolean)} number of spaces to indent with or false
         *     to fall back to clike's default behavior.
         */
        'indent': function(state, ctx, textAfter) {
          if (ctx.type == 'statement') {
            return ctx.indented;
          }
          return false
        },
      };
      modeConfig.isPunctuationChar = /[{}\[\],]/;
      modeConfig.isOperatorChar = /=/;

      /** @type {!CodeMirror.Mode} */
      var clikeMode = CodeMirror.getMode(config, modeConfig);

      return {
        /**
         * startState initializes and returns the initial state object.
         * @param {number=} basecolumn
         * @return {!hclState} clike state object
         */
        startState: function(basecolumn) {
          return clikeMode.startState(basecolumn);
        },

        /**
         * startState initializes and returns the initial state object.
         * @param {!CodeMirror.InputStream} stream Codemirror input stream.
         * @param {!hclState} state HCL state object.
         * @return {?string} token type
         */
        token: function(stream, state) {
          return clikeMode.token(stream, state);
        },

        /**
         * indent returns the number of spaces to indent.
         * @param {!hclState} state HCL state object.
         * @param {?string} textAfter text following the current position.
         * @return {number} number of spaces.
         */
        indent: function(state, textAfter) {
          /* if state.tokenize != null, the scanner is currently within a
           * multi-line string. While typing a multi-line string, disable
           * indentation. */
          if (state.tokenize) {
            return 0;
          }

          return clikeMode.indent(state, textAfter);
        },

        electricInput: /^\s*[}\]]$/,
        closeBrackets: '[]{}',
        blockCommentStart: '/*',
        blockCommentEnd: '*/',
        blockCommentContinue: ' * ',
        lineComment: '#',
        fold: 'brace'
      };
    });
CodeMirror.defineMIME('text/x-hcl', {name: 'hcl', modeConfig: hclConfig});
CodeMirror.defineMIME(
    'text/x-terraform', {name: 'terraform', modeConfig: terraformConfig});
})();
