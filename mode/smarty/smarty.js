/**
 * Much of this borrows from xml.js.
 */
CodeMirror.defineMode("smarty", function(config, parserConfig) {

  var builtInFuncs = ["include", "include_php", "debug", "extends", "literal"];
  var regs = {
    operatorChars:   /[+\-*&%=<>!?]/,
    validIdentifier: /[a-zA-Z0-9\_]/,
    stringChar:      /[\'\"]/
  }

  function tokenizer(stream, state) {
    function chain(parser) {
      state.tokenize = parser;
      return parser(stream, state);
    }

    var ch = stream.next();
    if (ch == "{") {
      if (stream.eat("*")) {
        return chain(inBlock("comment", "*}"));
      } else {
        state.tokenize = inSmarty;
        return "tag";
      }
    } else {
      stream.eatWhile(/[^\{]/);
      return null;
    }
  }

  function inSmarty(stream, state) {
    var ch = stream.next();

    if (ch == "}") {
      state.last = null;
      state.tokenize = tokenizer;
      return "tag";
    }
    else if (ch == "$") {
      stream.eatWhile(regs.validIdentifier);
      state.last = "variable";
      return "variable-2";
    }
    else if (ch == ".") {
      if (state.last == "variable") {
        state.last = "property";
      }
      return "operator";
    }
    else if (regs.stringChar.test(ch)) {
      state.last = "string";
      state.tokenize = inAttribute(ch);
      return state.tokenize(stream, state);
    }
    else if (regs.operatorChars.test(ch)) {
      state.last = "operator";
      stream.eatWhile(regs.operatorChars);
      return "operator";
    }
    else if (ch == "[" || ch == "]") {
      state.last = "brackets";
      return "bracket";
    }
    else if (/\d/.test(ch)) {
      state.last = "number";
      stream.eatWhile(/\d/);
      return "number";
    }
    else {
      if (state.last == "variable") {
        if (ch == "@") {
          stream.eatWhile(regs.validIdentifier);
          state.last = "property";
          return "property";
        }
        else if (ch == "|") {
          stream.eatWhile(regs.validIdentifier);
          state.last = "modifier";
          return "qualifier";
        }
      }
      else if (state.last == "whitespace") {
        stream.eatWhile(regs.validIdentifier);
        state.last = "modifier";
        return "attribute";
      }
      else if (state.last == "property") {
        stream.eatWhile(regs.validIdentifier);
        state.last = null;
        return "property";
      }
      else if (/\s/.test(ch)) {
        state.last = "whitespace";
        return null;
      }

      var str = "";
      if (ch != "/") {
    	str += ch;
      }
      var c = "";
      while ((c = stream.eat(regs.validIdentifier))) {
        str += c;
      }

      var i;
      for (i=0, j=builtInFuncs.length; i<j; i++) {
        if (builtInFuncs[i] == str) {
          state.last = "keyword";
          return "keyword";
        }
      }

      state.last = "tag";
      return "tag";
    }
  }

  function inAttribute(quote) {
    return function(stream, state) {
      while (!stream.eol()) {
        if (stream.next() == quote) {
          state.tokenize = inSmarty;
          break;
        }
      }
      return "string";
    };
  }

  function inBlock(style, terminator) {
    return function(stream, state) {
      while (!stream.eol()) {
        if (stream.match(terminator)) {
          state.tokenize = tokenizer;
          break;
        }
        stream.next();
      }
      return style;
    };
  }


  return {
    startState: function() {
      return {tokenize: tokenizer, localState: null, mode: "smarty" };
    },
/*    copyState: function(state) {
      return {token: state.token, localState: null, mode: state.mode };
    },
*/
    token: function(stream, state) {
      return state.tokenize(stream, state);
    },

//    compareStates: function(a, b) {
      //return htmlMode.compareStates(a.htmlState, b.htmlState);
//    },

    electricChars: ""
  }
});

CodeMirror.defineMIME("text/x-smarty", "smarty");