// By the Neo4j Team and contributors.
// https://github.com/neo4j-contrib/CodeMirror

(function() {
  var wordRegexp;

  wordRegexp = function(words) {
    return new RegExp("^(?:" + words.join("|") + ")$", "i");
  };

  CodeMirror.defineMode("cypher", function(config) {
    var curPunc, funcs, indentUnit, keywords, operatorChars, popContext, preds, pushContext, tokenBase, tokenLiteral;
    tokenBase = function(stream/*, state*/) {
      var ch, curPunc, type, word;
      ch = stream.next();
      curPunc = null;
      if (ch === "\"" || ch === "'") {
        stream.match(/.+?["']/);
        return "string";
      }
      if (/[{}\(\),\.;\[\]]/.test(ch)) {
        curPunc = ch;
        return "node";
      } else if (ch === "/" && stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      } else if (operatorChars.test(ch)) {
        stream.eatWhile(operatorChars);
        return null;
      } else {
        stream.eatWhile(/[_\w\d]/);
        if (stream.eat(":")) {
          stream.eatWhile(/[\w\d_\-]/);
          return "atom";
        }
        word = stream.current();
        type = void 0;
        if (funcs.test(word)) {
          return "builtin";
        }
        if (preds.test(word)) {
          return "def";
        } else if (keywords.test(word)) {
          return "keyword";
        } else {
          return "variable";
        }
      }
    };
    tokenLiteral = function(quote) {
      return function(stream, state) {
        var ch, escaped;
        escaped = false;
        ch = void 0;
        while ((ch = stream.next()) != null) {
          if (ch === quote && !escaped) {
            state.tokenize = tokenBase;
            break;
          }
          escaped = !escaped && ch === "\\";
        }
        return "string";
      };
    };
    pushContext = function(state, type, col) {
      return state.context = {
        prev: state.context,
        indent: state.indent,
        col: col,
        type: type
      };
    };
    popContext = function(state) {
      state.indent = state.context.indent;
      return state.context = state.context.prev;
    };
    indentUnit = config.indentUnit;
    curPunc = void 0;
    funcs = wordRegexp(["abs", "acos", "allShortestPaths", "asin", "atan", "atan2", "avg", "ceil", "coalesce", "collect", "cos", "cot", "count", "degrees", "e", "endnode", "exp", "extract", "filter", "floor", "haversin", "head", "id", "labels", "last", "left", "length", "log", "log10", "lower", "ltrim", "max", "min", "node", "nodes", "percentileCont", "percentileDisc", "pi", "radians", "rand", "range", "reduce", "rel", "relationship", "relationships", "replace", "right", "round", "rtrim", "shortestPath", "sign", "sin", "split", "sqrt", "startnode", "stdev", "stdevp", "str", "substring", "sum", "tail", "tan", "timestamp", "toFloat", "toInt", "trim", "type", "upper"]);
    preds = wordRegexp(["all", "and", "any", "has", "in", "none", "not", "or", "single", "xor"]);
    keywords = wordRegexp(["as", "asc", "ascending", "assert", "by", "case", "commit", "constraint", "create", "csv", "cypher", "delete", "desc", "descending", "distinct", "drop", "else", "end", "false", "foreach", "from", "headers", "in", "index", "is", "limit", "load", "match", "merge", "null", "on", "optional", "order", "periodic", "remove", "return", "scan", "set", "skip", "start", "then", "true", "union", "unique", "using", "when", "where", "with"]);
    operatorChars = /[*+\-<>=&|~%^]/;
    return {
      startState: function(/*base*/) {
        return {
          tokenize: tokenBase,
          context: null,
          indent: 0,
          col: 0
        };
      },
      token: function(stream, state) {
        var style;
        if (stream.sol()) {
          if (state.context && (state.context.align == null)) {
            state.context.align = false;
          }
          state.indent = stream.indentation();
        }
        if (stream.eatSpace()) {
          return null;
        }
        style = state.tokenize(stream, state);
        if (style !== "comment" && state.context && (state.context.align == null) && state.context.type !== "pattern") {
          state.context.align = true;
        }
        if (curPunc === "(") {
          pushContext(state, ")", stream.column());
        } else if (curPunc === "[") {
          pushContext(state, "]", stream.column());
        } else if (curPunc === "{") {
          pushContext(state, "}", stream.column());
        } else if (/[\]\}\)]/.test(curPunc)) {
          while (state.context && state.context.type === "pattern") {
            popContext(state);
          }
          if (state.context && curPunc === state.context.type) {
            popContext(state);
          }
        } else if (curPunc === "." && state.context && state.context.type === "pattern") {
          popContext(state);
        } else if (/atom|string|variable/.test(style) && state.context) {
          if (/[\}\]]/.test(state.context.type)) {
            pushContext(state, "pattern", stream.column());
          } else if (state.context.type === "pattern" && !state.context.align) {
            state.context.align = true;
            state.context.col = stream.column();
          }
        }
        return style;
      },
      indent: function(state, textAfter) {
        var closing, context, firstChar;
        firstChar = textAfter && textAfter.charAt(0);
        context = state.context;
        if (/[\]\}]/.test(firstChar)) {
          while (context && context.type === "pattern") {
            context = context.prev;
          }
        }
        closing = context && firstChar === context.type;
        if (!context) {
          return 0;
        } else if (context.type === "keywords") {
          return CodeMirror.commands.newlineAndIndent;
        } else if (context.align) {
          return context.col + (closing ? 0 : 1);
        } else {
          return context.indent + (closing ? 0 : indentUnit);
        }
      }
    };
  });

  CodeMirror.modeExtensions["cypher"] = {
    autoFormatLineBreaks: function(text) {
      var i, lines, reProcessedPortion;
      lines = text.split("\n");
      reProcessedPortion = /\s+\b(return|where|order by|match|with|skip|limit|create|delete|set)\b\s/g;
      i = 0;
      while (i < lines.length) {
        lines[i] = lines[i].replace(reProcessedPortion, " \n$1 ").trim();
        i++;
      }
      return lines.join("\n");
    }
  };

  CodeMirror.defineMIME("application/x-cypher-query", "cypher");

}).call(this);

