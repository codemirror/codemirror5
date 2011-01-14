CodeMirror.addParser("javascript", (function() {
  // Tokenizer

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

  function nextUntilUnescaped(stream, end) {
    var escaped = false, next;
    while ((next = stream.next()) != null) {
      if (next == end && !escaped)
        return false;
      escaped = !escaped && next == "\\";
    }
    return escaped;
  }

  function jsTokenBase(stream, state) {
    function readOperator(ch) {
      return {type: "operator", style: "js-operator", content: ch + stream.eatWhile(isOperatorChar)};
    }

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
      else if (state.reAllowed) {
        nextUntilUnescaped(stream, "/");
        while (stream.eat(/[gimy]/)); // 'y' is "sticky" option in Mozilla
        return {type: "regexp", style: "js-string"};
      }
      else return readOperator(ch);
    }
    else if (isOperatorChar.test(ch))
      return readOperator(ch);
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
      if (ch == "/" && maybeEnd) {
        state.tokenize = jsTokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return {type: "comment", style: "js-comment"};
  }

  // Parser

  var atomicTypes = {"atom": true, "number": true, "variable": true, "string": true, "regexp": true};

  function JSLexical(indented, column, type, align, prev, info) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.prev = prev;
    this.info = info;
    if (align != null) this.align = align;
  }

  function indentJS(state, textAfter) {
    var firstChar = textAfter && textAfter.charAt(0), lexical = state.lexical,
        type = lexical.type, closing = firstChar == type, iu = state.indentUnit;
    if (type == "vardef") return lexical.indented + 4;
    else if (type == "form" && firstChar == "{") return lexical.indented;
    else if (type == "stat" || type == "form") return lexical.indented + iu;
    else if (lexical.info == "switch" && !closing)
      return lexical.indented + (/^(?:case|default)\b/.test(textAfter) ? iu : 2 * iu);
    else if (lexical.align) return lexical.column - (closing ? 1 : 0);
    else return lexical.indented + (closing ? 0 : iu);
  }

  function startState(basecolumn, indentUnit) {
    if (!indentUnit) indentUnit = 2;
    return {
      tokenize: jsTokenBase,
      reAllowed: true,
      cc: [],
      lexical: new JSLexical((basecolumn || 0) - indentUnit, 0, "block", false),
      context: null,
      indented: 0,
      indentUnit: indentUnit
    };
  }

  function parseJS(token, column, indent, state) {
    var cc = state.cc, type = token.type;

    function pass() {
      for (var i = arguments.length - 1; i >= 0; i--) cc.push(arguments[i]);
    }
    var cx = {
      state: state,
      column: column,
      pass: pass,
      cont: function(){pass.apply(null, arguments); return true;},
      register: function(varname) {
        if (state.context) {
          cx.marked = "js-variabledef";
          state.context.vars[varname] = true;
        }
      }
    };
    function inScope(varname) {
      var cursor = state.context;
      while (cursor) {
        if (cursor.vars[varname])
          return true;
        cursor = cursor.prev;
      }
    }
  
    if (indent != null) {
      if (!state.lexical.hasOwnProperty("align"))
        state.lexical.align = false;
      state.indented = indent;
    }
    
    if (type == "whitespace" || type == "comment")
      return token.style;
    if (!state.lexical.hasOwnProperty("align"))
      state.lexical.align = true;

    while(true) {
      var combinator = cc.length ? cc.pop() : state.json ? expression : statement;
      if (combinator(cx, type, token.content)) {
        while(cc.length && cc[cc.length - 1].lex)
          cc.pop()(cx);
        if (cx.marked) return cx.marked;
        if (type == "variable" && inScope(token.content)) return "js-localvariable";
        return token.style;
      }
    }
  }

  // Combinators

  function pushcontext(cx) {
    cx.state.context = {prev: cx.state.context, vars: {"this": true, "arguments": true}};
  }
  function popcontext(cx) {
    cx.state.context = cx.state.context.prev;
  }
  function pushlex(type, info) {
    var result = function(cx) {
      var state = cx.state;
      state.lexical = new JSLexical(state.indented, cx.column, type, null, state.lexical, info)
    };
    result.lex = true;
    return result;
  }
  function poplex(cx) {
    var state = cx.state;
    if (state.lexical.type == ")")
      state.indented = state.lexical.indented;
    state.lexical = state.lexical.prev;
  }
  poplex.lex = true;

  function expect(wanted) {
    return function expecting(cx, type) {
      if (type == wanted) return cx.cont();
      else if (wanted == ";") return;
      else return cx.cont(arguments.callee);
    };
  }

  function statement(cx, type) {
    if (type == "var") return cx.cont(pushlex("vardef"), vardef1, expect(";"), poplex);
    if (type == "keyword a") return cx.cont(pushlex("form"), expression, statement, poplex);
    if (type == "keyword b") return cx.cont(pushlex("form"), statement, poplex);
    if (type == "{") return cx.cont(pushlex("}"), block, poplex);
    if (type == ";") return cx.cont();
    if (type == "function") return cx.cont(functiondef);
    if (type == "for") return cx.cont(pushlex("form"), expect("("), pushlex(")"), forspec1, expect(")"),
                                      poplex, statement, poplex);
    if (type == "variable") return cx.cont(pushlex("stat"), maybelabel);
    if (type == "switch") return cx.cont(pushlex("form"), expression, pushlex("}", "switch"), expect("{"),
                                         block, poplex, poplex);
    if (type == "case") return cx.cont(expression, expect(":"));
    if (type == "default") return cx.cont(expect(":"));
    if (type == "catch") return cx.cont(pushlex("form"), pushcontext, expect("("), funarg, expect(")"),
                                        statement, poplex, popcontext);
    return cx.pass(pushlex("stat"), expression, expect(";"), poplex);
  }
  function expression(cx, type) {
    if (atomicTypes.hasOwnProperty(type)) return cx.cont(maybeoperator);
    if (type == "function") return cx.cont(functiondef);
    if (type == "keyword c") return cx.cont(expression);
    if (type == "(") return cx.cont(pushlex(")"), expression, expect(")"), poplex, maybeoperator);
    if (type == "operator") return cx.cont(expression);
    if (type == "[") return cx.cont(pushlex("]"), commasep(expression, "]"), poplex, maybeoperator);
    if (type == "{") return cx.cont(pushlex("}"), commasep(objprop, "}"), poplex, maybeoperator);
    return cx.cont();
  }
  function maybeoperator(cx, type, value) {
    if (type == "operator" && /\+\+|--/.test(value)) return cx.cont(maybeoperator);
    if (type == "operator") return cx.cont(expression);
    if (type == ";") return;
    if (type == "(") return cx.cont(pushlex(")"), commasep(expression, ")"), poplex, maybeoperator);
    if (type == ".") return cx.cont(property, maybeoperator);
    if (type == "[") return cx.cont(pushlex("]"), expression, expect("]"), poplex, maybeoperator);
  }
  function maybelabel(cx, type) {
    if (type == ":") return cx.cont(poplex, statement);
    return cx.pass(maybeoperator, expect(";"), poplex);
  }
  function property(cx, type) {
    if (type == "variable") {cx.marked = "js-property"; return cx.cont();}
  }
  function objprop(cx, type) {
    if (type == "variable") cx.marked = "js-property";
    if (atomicTypes.hasOwnProperty(type)) return cx.cont(expect(":"), expression);
  }
  function commasep(what, end) {
    function proceed(cx, type) {
      if (type == ",") return cx.cont(what, proceed);
      if (type == end) return cx.cont();
      return cx.cont(expect(end));
    }
    return function commaSeparated(cx, type) {
      if (type == end) return cx.cont();
      else return cx.pass(what, proceed);
    };
  }
  function block(cx, type) {
    if (type == "}") return cx.cont();
    return cx.pass(statement, block);
  }
  function vardef1(cx, type, value) {
    if (type == "variable"){cx.register(value); return cx.cont(vardef2);}
    return cx.cont();
  }
  function vardef2(cx, type, value) {
    if (value == "=") return cx.cont(expression, vardef2);
    if (type == ",") return cx.cont(vardef1);
  }
  function forspec1(cx, type) {
    if (type == "var") return cx.cont(vardef1, forspec2);
    if (type == ";") return cx.pass(forspec2);
    if (type == "variable") return cx.cont(formaybein);
    return cx.pass(forspec2);
  }
  function formaybein(cx, type, value) {
    if (value == "in") return cx.cont(expression);
    return cx.cont(maybeoperator, forspec2);
  }
  function forspec2(cx, type, value) {
    if (type == ";") return cx.cont(forspec3);
    if (value == "in") return cx.cont(expression);
    return cx.cont(expression, expect(";"), forspec3);
  }
  function forspec3(cx, type) {
    if (type != ")") cx.cont(expression);
  }
  function functiondef(cx, type, value) {
    if (type == "variable") {cx.register(value); return cx.cont(functiondef);}
    if (type == "(") return cx.cont(pushcontext, commasep(funarg, ")"), statement, popcontext);
  }
  function funarg(cx, type, value) {
    if (type == "variable") {cx.register(value); return cx.cont();}
  }

  // Interface

  return {
    startState: startState,
    token: function(stream, state) {
      if (stream.column() == 0)
        var indent = stream.eatSpace();
      var token = state.tokenize(stream, state);
      state.reAllowed = token.type == "operator" || token.type == "keyword c" || token.type.match(/^[\[{}\(,;:]$/);
      stream.eatSpace();
      return parseJS(token, stream.column(), indent, state);
    },
    indent: indentJS
  };
})());
