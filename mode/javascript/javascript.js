CodeMirror.addParser("javascript", (function() {
  function nextUntilUnescaped(stream, end) {
    var escaped = false, next;
    while ((next = stream.next()) != null) {
      if (next == end && !escaped)
        return false;
      escaped = !escaped && next == "\\";
    }
    return escaped;
  }

  var keywords = function(){
    function kw(type) {return {type: type, style: "js-keyword"};}
    var A = kw("keyword a"), B = kw("keyword b"), C = kw("keyword c");
    var operator = kw("operator"), atom = {type: "atom", style: "js-atom"};
    return {
      "if": A, "while": A, "with": A, "else": B, "do": B, "try": B, "finally": B,
      "return": C, "break": C, "continue": C, "new": C, "delete": C, "throw": C,
      "var": kw("var"), "function": kw("function"), "catch": kw("catch"),
      "for": kw("for"), "switch": kw("switch"), "case": kw("case"), "default": kw("default"),
      "in": operator, "typeof": operator, "instanceof": operator,
      "true": atom, "false": atom, "null": atom, "undefined": atom, "NaN": atom, "Infinity": atom
    };
  }();

  var isOperatorChar = /[+\-*&%=<>!?|]/;

  function chain(stream, state, f) {
    state.tokenize = f;
    return f(stream, state);
  }

  function jsTokenBase(stream, state) {
    function readOperator() {
      while (stream.eat(isOperatorChar));
      return {type: "operator", style: "js-operator"};
    }

    stream.eatSpace();
    var ch = stream.next();
    if (ch == '"' || ch == "'")
      return chain(stream, state, jsTokenString(ch));
    else if (/[\[\]{}\(\),;\:\.]/.test(ch))
      return {type: ch, style: "js-punctuation"};
    else if (ch == "0" && stream.eat(/x/i)) {
      while (stream.eat(/[\da-f]/i));
      return {type: "number", style: "js-atom"};
    }      
    else if (/\d/.test(ch)) {
      stream.match(/^\d*(?:\.\d*)?(?:e[+\-]?\d+)?/);
      return {type: "number", style: "js-atom"};
    }
    else if (ch == "/") {
      if (stream.eat("*")) {
        return chain(stream, state, jsTokenComment);
      }
      else if (stream.eat("/")) {
        while (stream.next() != null);
        return {type: "comment", style: "js-comment"};
      }
      else if (state.reAllowed) { // TODO update this
        nextUntilUnescaped(stream, "/");
        while (stream.eat(/[gimy]/)); // 'y' is "sticky" option in Mozilla
        return {type: "regexp", style: "js-string"};
      }
      else return readOperator();
    }
    else if (isOperatorChar.test(ch))
      return readOperator();
    else {
      var word = ch + stream.eatWhile(/[\w\$_]/);
      var known = keywords.propertyIsEnumerable(word) && keywords[word];
      return known ? {type: known.type, style: known.style, content: word} :
                     {type: "variable", style: "js-variable", content: word};
    }
  }

  function jsTokenString(quote) {
    return function(stream, state) {
      if (!nextUntilUnescaped(stream, quote))
        state.tokenize = jsTokenBase;
      return {type: "string", style: "js-string"};
    };
  }

  function jsTokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (next == "/" && maybeEnd) {
        state.tokenize = jsTokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return {type: "comment", style: "js-comment"};
  }

  return {
    startState: function() {
      return {tokenize: jsTokenBase, reAllowed: true};
    },
    token: function(stream, state) {
      return state.tokenize(stream, state).style;
    }
  };
})());
