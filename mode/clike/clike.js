CodeMirror.defineMode("clike", function(config, parserConfig) {
  var indentUnit = config.indentUnit, keywords = parserConfig.keywords,
      cpp = parserConfig.useCPP, multiLineStrings = parserConfig.multiLineStrings,
      $vars = parserConfig.$vars, atAnnotations = parserConfig.atAnnotations;
  var isOperatorChar = /[+\-*&%=<>!?|]/;

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
    if (ch == '"' || ch == "'")
      return chain(stream, state, tokenString(ch));
    else if (/[\[\]{}\(\),;\:\.]/.test(ch))
      return ret(ch);
    else if (ch == "#" && cpp && state.startOfLine) {
      stream.skipToEnd();
      return ret("directive", "c-like-preprocessor");
    }
    else if (/\d/.test(ch)) {
      stream.eatWhile(/[\w\.]/)
      return ret("number", "c-like-number");
    }
    else if (ch == "/") {
      if (stream.eat("*")) {
        return chain(stream, state, tokenComment);
      }
      else if (stream.eat("/")) {
        stream.skipToEnd();
        return ret("comment", "c-like-comment");
      }
      else {
        stream.eatWhile(isOperatorChar);
        return ret("operator");
      }
    }
    else if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return ret("operator");
    }
    else if (atAnnotations && ch == "@") {
        stream.eatWhile(/[\w\$_]/);
        return ret("annotation", "c-like-annotation");
    }
    else if ($vars && ch == "$") {
      stream.eatWhile(/[\w\$_]/);
      return ret("word", "c-like-var");
    }
    else {
      stream.eatWhile(/[\w\$_]/);
      if (keywords && keywords.propertyIsEnumerable(stream.current())) return ret("keyword", "c-like-keyword");
      return ret("word", "c-like-word");
    }
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {end = true; break;}
        escaped = !escaped && next == "\\";
      }
      if (end || !(escaped || multiLineStrings))
        state.tokenize = tokenBase;
      return ret("string", "c-like-string");
    };
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return ret("comment", "c-like-comment");
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

      if ((type == ";" || type == ":") && ctx.type == "statement") popContext(state);
      else if (type == "{") pushContext(state, stream.column(), "}");
      else if (type == "[") pushContext(state, stream.column(), "]");
      else if (type == "(") pushContext(state, stream.column(), ")");
      else if (type == "}") {
        if (ctx.type == "statement") ctx = popContext(state);
        if (ctx.type == "}") ctx = popContext(state);
        if (ctx.type == "statement") ctx = popContext(state);
      }
      else if (type == ctx.type) popContext(state);
      else if (ctx.type == "}" || ctx.type == "top") pushContext(state, stream.column(), "statement");
      state.startOfLine = false;
      return style;
    },

    indent: function(state, textAfter) {
      if (state.tokenize != tokenBase) return 0;
      var firstChar = textAfter && textAfter.charAt(0), ctx = state.context, closing = firstChar == ctx.type;
      if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : indentUnit);
      else if (ctx.align) return ctx.column + (closing ? 0 : 1);
      else return ctx.indented + (closing ? 0 : indentUnit);
    },

    electricChars: "{}"
  };
});

(function() {
  function keywords(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }
  var cKeywords = "auto if break int case long char register continue return default short do sizeof " +
    "double static else struct entry switch extern typedef float union for unsigned " +
    "goto while enum void const signed volatile";

  CodeMirror.defineMIME("text/x-csrc", {
    name: "clike",
    useCPP: true,
    keywords: keywords(cKeywords)
  });
  CodeMirror.defineMIME("text/x-c++src", {
    name: "clike",
    useCPP: true,
    keywords: keywords(cKeywords + " asm dynamic_cast namespace reinterpret_cast try bool explicit new " +
                       "static_cast typeid catch false operator template typename class friend private " +
                       "this using const_cast inline public throw virtual delete mutable protected true " +
                       "wchar_t")
  });
  CodeMirror.defineMIME("text/x-java", {
    name: "clike",
    atAnnotations: true,
    keywords: keywords("abstract assert boolean break byte case catch char class const continue default " + 
                       "do double else enum extends false final finally float for goto if implements import " +
                       "instanceof int interface long native new null package private protected public " +
                       "return short static strictfp super switch synchronized this throw throws transient " +
                       "true try void volatile while")
  });
}());
