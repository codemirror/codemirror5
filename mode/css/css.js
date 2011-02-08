CodeMirror.addMode("css", function(config) {
  var indentUnit = config.indentUnit, type;
  function ret(style, tp) {type = tp; return style;}

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == "@") return ret("css-at", ch + stream.eatWhile(/\w/));
    else if (ch == "/" && stream.eat("*")) {
      state.tokenize = tokenCComment;
      return tokenCComment(stream, state);
    }
    else if (ch == "<" && stream.eat("!")) {
      state.tokenize = tokenSGMLComment;
      return tokenSGMLComment(stream, state);
    }
    else if (ch == "=") ret(null, "compare");
    else if ((ch == "~" || ch == "|") && stream.eat("=")) return ret(null, "compare");
    else if (ch == "\"" || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }
    else if (ch == "#") {
      stream.eatWhile(/\w/);
      return ret("css-hash", "hash");
    }
    else if (ch == "!") {
      stream.match(/^\s*\w*/);
      return ret("css-important", "important");
    }
    else if (/\d/.test(ch)) {
      stream.eatWhile(/[\w.%]/);
      return ret("css-unit", "unit");
    }
    else if (/[,.+>*\/]/.test(ch)) {
      return ret(null, "select-op");
    }
    else if (/[;{}:\[\]]/.test(ch)) {
      return ret(null, ch);
    }
    else {
      stream.eatWhile(/[\w\\\-_]/);
      return ret("css-identifier", "identifier");
    }
  }

  function tokenCComment(stream, state) {
    var maybeEnd = false, ch;
    while ((ch = stream.next()) != null) {
      if (maybeEnd && ch == "/") {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return ret("css-comment", "comment");
  }

  function tokenSGMLComment(stream, state) {
    var dashes = 0, ch;
    while ((ch = stream.next()) != null) {
      if (dashes >= 2 && ch == ">") {
        state.tokenize = tokenBase;
        break;
      }
      dashes = (ch == "-") ? dashes + 1 : 0;
    }
    return ret("css-comment", "comment");
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped)
          break;
        escaped = !escaped && ch == "\\";
      }
      if (!escaped) state.tokenize = tokenBase;
      return ret("css-string", "string");
    };
  }

  return {
    startState: function(base) {
      return {tokenize: tokenBase,
              baseIndent: base || 0,
              inBraces: false, inRule: false, inDecl: false};
    },

    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);

      if (type == "hash")
        style = state.inRule ? "css-colorcode" : "css-identifier";
      if (style == "css-identifier") {
        if (state.inRule) style = "css-value";
        else if (!state.inBraces && !state.inDecl) style = "css-selector";
      }

      if (type == "{" && state.inDecl == "@media")
        state.inDecl = false;
      else if (type == "{")
        state.inBraces = true;
      else if (type == "}")
        state.inBraces = state.inRule = state.inDecl = false;
      else if (type == ";")
        state.inRule = state.inDecl = false;
      else if (state.inBraces && type != "comment")
        state.inRule = true;
      else if (!state.inBraces && style == "css-at")
        state.inDecl = type;

      return style;
    },

    indent: function(state, textAfter) {
      if (!state.inBraces || /^\}/.test(textAfter)) return state.baseIndent;
      else if (state.inRule) return state.baseIndent + indentUnit * 2;
      else return state.baseIndent + indentUnit;
    }
  };
});
