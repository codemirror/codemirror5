CodeMirror.defineMode("smalltalk", function(config, parserConfig) {
  var keywords = {"true": 1, "false": 1, nil: 1, self: 1, "super": 1, thisContext: 1};
  var indentUnit = config.indentUnit;

  function chain(stream, state, f) {
    state.tokenize = f;
    return f(stream, state);
  }

  var type;
  function ret(tp, style) {
    type = tp;
    return style;
  }

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == '"')
      return chain(stream, state, tokenComment(ch));
    else if (ch == "'")
      return chain(stream, state, tokenString(ch));
    else if (ch == "#") {
      stream.eatWhile(/[\w\$_]/);
      return ret("string", "string");
    }
    else if (ch == '$') {
      if (stream.next() == "<") {
        stream.eatWhile(/\d/);
        stream.eat(/\>/);
      }
      return ret("string", "string");
    }
    else if (ch == "^" || (ch == ":" && stream.eat("="))) {
      return ret("operator", "operator");
    }
    else if (/\d/.test(ch)) {
      stream.eatWhile(/[\w\.]/)
      return ret("number", "number");
    }
    else if (/[\[\]()]/.test(ch)) {
      return ret(ch, null);
    }
    else {
      stream.eatWhile(/[\w\$_]/);
      if (keywords && keywords.propertyIsEnumerable(stream.current())) return ret("keyword", "keyword");
      return ret("word", "variable");
    }
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {end = true; break;}
        escaped = !escaped && next == "\\";
      }
      if (end || !(escaped))
        state.tokenize = tokenBase;
      return ret("string", "string");
    };
  }

  function tokenComment(quote) {
    return function(stream, state) {
      var next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote) {end = true; break;}
      }
      if (end)
        state.tokenize = tokenBase;
      return ret("comment", "comment");
    };
  }

  function Context(indented, column, type, align, prev) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.align = align;
    this.prev = prev;
  }

  function pushContext(state, col, type) {
    return state.context = new Context(state.indented, col, type, null, state.context);
  }
  function popContext(state) {
    return state.context = state.context.prev;
  }

  // Interface

  return {
    startState: function(basecolumn) {
      return {
        tokenize: tokenBase,
        context: new Context((basecolumn || 0) - indentUnit, 0, "top", false),
        indented: 0,
        startOfLine: true
      };
    },

    token: function(stream, state) {
      var ctx = state.context;
      if (stream.sol()) {
        if (ctx.align == null) ctx.align = false;
        state.indented = stream.indentation();
        state.startOfLine = true;
      }
      if (stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);
      if (type == "comment") return style;
      if (ctx.align == null) ctx.align = true;

      if (type == "[") pushContext(state, stream.column(), "]");
      else if (type == "(") pushContext(state, stream.column(), ")");
      else if (type == ctx.type) popContext(state);
      state.startOfLine = false;
      return style;
    },

    indent: function(state, textAfter) {
      if (state.tokenize != tokenBase) return 0;
      var firstChar = textAfter && textAfter.charAt(0), ctx = state.context, closing = firstChar == ctx.type;
      if (ctx.align) return ctx.column + (closing ? 0 : 1);
      else return ctx.indented + (closing ? 0 : indentUnit);
    },

    electricChars: "]"
  };
});

CodeMirror.defineMIME("text/x-stsrc", {name: "smalltalk"});
