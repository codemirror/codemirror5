// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
      mod(require("../../lib/codemirror"));
    else if (typeof define == "function" && define.amd) // AMD
      define(["../../lib/codemirror"], mod);
    else // Plain browser env
      mod(CodeMirror);
  })(function(CodeMirror) {
    "use strict";

    CodeMirror.defineMode("elixir", function (_config, modeConfig) {

      function switchState(source, setState, f)
      {
        setState(f);
        return f(source, setState);
      }

      function switchStateWithTrigger(source, setState, f, trigger) {
        setState(f);
        return f(source, setState, trigger);
      }

      var smallRE = /[a-z_]/;
      var largeRE = /[A-Z]/;
      var digitRE = /[\d_]*(?:\.[\d_]+)?(?:[e][+\-]?[\d_]+)?/;
      var hexRE = /[\da-fA-F]/;
      var binRE = /[01]/;
      var wordRE = /[a-z_A-Z0-9'\xa1-\uffff?!]/;
      var exprRE = /^@?[\w\xa1-\uffff]/;
      var symbolRE = /[-!#$%&*+.\/<=>?\\^|~:]/;
      var sigilRE = /[wscrSDNTURWC]/;
      var whiteCharRE = /[ \t\v\f]/; // newlines are handled in tokenizer

      function normal()
      {
        return function(source, setState)
        {
          if (source.eatWhile(whiteCharRE))
          {
            return null;
          }

          var ch = source.next();

          if (ch === '#') {
            source.skipToEnd()
            return 'comment'
          }

          if (ch === '"') {
            return maybeMultiLine(source, setState)
          }

          if (ch === '_') {
            source.eatWhile(/\w/)
            return 'comment'
          }

          if (ch === '@' && source.match(exprRE)) {
            source.eat('@')
            source.eatWhile(wordRE)
            return 'variable-2'
          }

          if (largeRE.test(ch)) {
            source.eatWhile(wordRE);
            return "variable-2";
          }

          if (ch === '~') {
            if (source.eat(sigilRE)) {
              if (source.eat('"')) {
                return maybeMultiLine(source, setState)
              }

              if (source.eat("(")) {
                return switchStateWithTrigger(source, setState, stringLiteral, ")");
              } else if (source.eat("/")) {
                return switchStateWithTrigger(source, setState, stringLiteral, "/");
              } else if (source.eat("[")) {
                return switchStateWithTrigger(source, setState, stringLiteral, "]");
              } else if (source.eat("|")) {
                return switchStateWithTrigger(source, setState, stringLiteral, "|");
              } else if (source.eat("\"")) {
                return switchStateWithTrigger(source, setState, stringLiteral, "\"");
              } else if (source.eat("\'")) {
                return switchStateWithTrigger(source, setState, stringLiteral, "\'");
              } else if (source.eat("{")) {
                return switchStateWithTrigger(source, setState, stringLiteral, "}");
              }
            }
          }

          if (ch == "\'") {
            return switchStateWithTrigger(source, setState, stringLiteral, ch);
          }

          if (smallRE.test(ch)) {
            source.eatWhile(wordRE);
            if (source.eat(":")) {
              return "atom";
            }
            return "variable";
          }

          if (ch == "0") {
            if (source.eat('x')) {
              source.eatWhile(hexRE)
            } else if (source.eat('b')) {
              source.eatWhile(binRE)
            }
          }

          if (/\d/.test(ch)) {
            source.match(digitRE);
            return "number";
          }

          if (ch == ":") {
            if (source.eat('"')) {
              return switchStateWithTrigger(source, setState, atom, '"');
            }
            if (source.eat("\'")) {
              return switchStateWithTrigger(source, setState, atom, "\'");
            }
            source.eatWhile(wordRE);
            return "atom";
          }

          if (symbolRE.test(ch)) {
            source.eatWhile(symbolRE);
            return "keyword";
          }

          return null;
        }
      }

      function maybeMultiLine(source, setState) {
        return source.eat('"')
          ? source.eat('"')
            ? switchState(source, setState, chompMultiString)
            : 'string'
          : switchState(source, setState, chompSingleString);
      }

      function chompMultiString(source, setState)
      {
        while (!source.eol())
        {
          var char = source.next();
          if (char === '"' && source.eat('"') && source.eat('"'))
          {
            setState(normal());
            return 'string';
          }
        }
        return 'string';
      }

      function chompSingleString(source, setState)
      {
        while (source.skipTo('\\"')) { source.next(); source.next(); }
        if (source.skipTo('"'))
        {
          source.next();
          setState(normal());
          return 'string';
        }
        source.skipToEnd();
        setState(normal());
        return 'string';
      }

      function stringLiteral(source, setState, trigger) {
        return processEOLState(source, setState, trigger, "string")
      }

      function atom(source, setState, trigger) {
        return processEOLState(source, setState, trigger, "atom")
      }

      function processEOLState(source, setState, trigger, stateName) {
        while (!source.eol()) {
          var ch = source.next();
          if (ch == trigger) {
            setState(normal());
            return stateName;
          }
        }
        setState(normal());
        return stateName;
      }

      var wellKnownWords = (function () {
        var wkw = {};
        function setType(t) {
          return function () {
            for (var i = 0; i < arguments.length; i++)
              wkw[arguments[i]] = t;
          };
        }

        setType("keyword")(
          'alias', 'case', 'cond', 'quote', 'unquote', 'receive', 'fn',
          'do', 'else', 'else if', 'end', 'false', 'if', 'in', 'not', 'rescue',
          'for', 'true', 'when', 'nil', 'try', 'catch',
          'after', 'with', 'require', 'use', '__MODULE__', '__FILE__', '__DIR__',
          '__ENV__', '__CALLER__');

        setType("keyword")("..", ":", "::", "=", "<-", "->", "=>");

        setType("builtin")(
          "!!", "&&", "+", "++", "--", "-", ".", "<", "<<<", ">>>", "^^^", "~~~", "<=", "=~",
          "==", ">", ">=", "<=", ">=", "<>", "||", "*", "&&&", "!==", "/", "===", "|>");

        setType("builtin")(
          'abs', 'and', 'binary_part', 'bit_size', 'byte_size', 'ceil', 'div', 'elem', 'floor',
          'hd', 'in', 'is_atom', 'is_binary', 'is_bitstring', 'is_boolean', 'is_float',
          'is_function', 'is_integer', 'is_list', 'is_map', 'is_nil', 'is_number', 'is_pid',
          'is_port', 'is_reference', 'is_tuple', 'length', 'map_size', 'node', 'not', 'or', 'rem',
          'round', 'self', 'tl', 'trunc', 'tuple_size');

        setType("builtin")(
          'alias!', 'apply', 'binding', 'destructure', 'exit', 'function_exported?',
          'get_and_update_in', 'get_in', 'inspect', 'macro_exported?', 'make_ref', 'match?',
          'max', 'min', 'pop_in', 'put_elem', 'put_in', 'raise', 'reraise', 'send', 'sigil_C', 'sigil_D',
          'sigil_N', 'sigil_R', 'sigil_S', 'sigil_T', 'sigil_U', 'sigil_W', 'sigil_c', 'sigil_r',
          'sigil_s', 'sigil_w', 'spawn', 'spawn_link', 'spawn_monitor', 'struct', 'struct!',
          'throw', 'to_charlist', 'to_string', 'unless', 'update_in', 'var!');

        setType("def")(
          'def', 'defdelegate', 'defexception', 'defguard',
          'defguardp', 'defimpl', 'defmacro', 'defmacrop', 'defmodule', 'defoverridable',
          'defp', 'defprotocol', 'defstruct');

        var override = modeConfig.overrideKeywords;
        if (override) for (var word in override) if (override.hasOwnProperty(word))
          wkw[word] = override[word];

        return wkw;
      })();

      return {
        startState: function ()  { return { f: normal() }; },
        copyState:  function (s) { return { f: s.f }; },

        token: function(stream, state) {
          var type = state.f(stream, function(s) { state.f = s; });
          var word = stream.current();
          return wellKnownWords.hasOwnProperty(word) ? wellKnownWords[word] : type;
        }
      };

    });

    CodeMirror.defineMIME("text/x-elixir", "elixir");
  });
