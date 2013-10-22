CodeMirror.defineMode("julia", function(_conf, parserConf) {
  var ERRORCLASS = 'error';

  function wordRegexp(words) {
    return new RegExp("^((" + words.join(")|(") + "))\\b");
  }

  var operators = parserConf.operators || /^(?:[|&^\\%*+\-<>!=\/]=?|\?|~|:|$|<:|\.[<>]|<<=?|>>>?=?|\.[<>=]=|->?|\/\/|in|\.{3})/;
  var delimiters = parserConf.delimiters || /^[;,()[\]{}]/;
  var identifiers = parserConf.identifiers|| /^[_A-Za-z][_A-Za-z0-9]*!*/;
  var blockOpeners = ["begin", "function", "type", "immutable", "let", "macro", "for", "while", "quote", "if", "else", "elseif"];
  var blockClosers = ["end", "else", "elseif"];
  var keywordList = ['if', 'else', 'elseif', 'while', 'for', 'in', 'begin', 'let', 'end', 'do', 'try', 'catch', 'finally', 'return', 'break', 'continue', 'global', 'local', 'const', 'export', 'import', 'importall', 'using', 'function', 'macro', 'module', 'baremodule', 'type', 'immutable', 'quote'];
  var builtinList = ['all', 'true', 'false', 'any', 'enumerate', 'open', 'close', 'linspace', 'nothing', 'NaN', 'Inf', 'print', 'println', 'Int8', 'Uint8', 'Int16', 'Uint16', 'Int32', 'Uint32', 'Int64', 'Uint64', 'Int128', 'Uint128', 'Bool', 'Char', 'Float16', 'Float32', 'Float64', 'Array', 'Vector', 'Matrix', 'String', 'error', 'warn', 'info'];

  //var stringPrefixes = new RegExp("^[br]?('|\")")
  var stringPrefixes = /^[br]?('|")/;
  var keywords = wordRegexp(keywordList);
  var builtins = wordRegexp(builtinList);
  var openers = wordRegexp(blockOpeners);
  var closers = wordRegexp(blockClosers);
  var indentInfo = null;

  function in_array(state) {
    var ch = cur_scope(state);
    if(ch=="[" || ch=="{") {
      return true;
    }
    else {
      return false;
    }
  }

  function cur_scope(state) {
    if(state.scopes.length==0) {
      return null;
    }
    return state.scopes[state.scopes.length - 1];
  }

  // tokenizers
  function tokenBase(stream, state) {
    // Handle scope changes
    leaving_expr = state.leaving_expr
    state.leaving_expr = false
    if(leaving_expr) {
      if(stream.match(/^'+/)) {
        return 'operator';
      }
      if(stream.match("...")) {
        return 'operator';
      }
    }

    if (stream.eatSpace()) {
      return null;
    }

    var ch = stream.peek();
    // Handle Comments
    if (ch === '#') {
        stream.skipToEnd();
        return 'comment';
    }
    if(ch==='[') {
      state.scopes.push("[");
    }

    if(ch==='{') {
      state.scopes.push("{");
    }

    var scope=cur_scope(state);

    if(scope==='[' && ch===']') {
      state.scopes.pop();
      state.leaving_expr=true;
    }

    if(scope==='{' && ch==='}') {
      state.scopes.pop();
      state.leaving_expr=true;
    }

    var match;
    if(match=stream.match(openers, false)) {
      state.scopes.push(match);
    }

    if(!in_array(state) && stream.match(closers, false)) {
      state.scopes.pop();
    }

    if(in_array(state)) {
      if(stream.match("end")) {
        return 'number';
      }

    }
    if(stream.match("=>")) {
      return 'operator';
    }
    // Handle Number Literals
    if (stream.match(/^[0-9\.]/, false)) {
      var imMatcher = RegExp(/^im\b/);
      var floatLiteral = false;
      // Floats
      if (stream.match(/^\d*\.\d+(e[\+\-]?\d+)?/i)) { floatLiteral = true; }
      if (stream.match(/^\d+\.\d*/)) { floatLiteral = true; }
      if (stream.match(/^\.\d+/)) { floatLiteral = true; }
      if (floatLiteral) {
          // Float literals may be "imaginary"
          stream.match(imMatcher);
          return 'number';
      }
      // Integers
      var intLiteral = false;
      // Hex
      if (stream.match(/^0x[0-9a-f]+/i)) { intLiteral = true; }
      // Binary
      if (stream.match(/^0b[01]+/i)) { intLiteral = true; }
      // Octal
      if (stream.match(/^0o[0-7]+/i)) { intLiteral = true; }
      // Decimal
      if (stream.match(/^[1-9]\d*(e[\+\-]?\d+)?/)) {
          // Decimal literals may be "imaginary"
          stream.eat(/J/i);
          // TODO - Can you have imaginary longs?
          intLiteral = true;
      }
      // Zero by itself with no other piece of number.
      if (stream.match(/^0(?![\dx])/i)) { intLiteral = true; }
      if (intLiteral) {
          // Integer literals may be "long"
          stream.match(imMatcher);
          return 'number';
      }
    }

    // Handle Strings
    if (stream.match(stringPrefixes)) {
      state.tokenize = tokenStringFactory(stream.current());
      return state.tokenize(stream, state);
    }

    // Handle operators and Delimiters
    if (stream.match(operators)) {
      return 'operator';
    }
    if (stream.match(delimiters)) {
      return null;
    }

    if (stream.match(keywords)) {
      return 'keyword';
    }

    if (stream.match(builtins)) {
      return 'builtin';
    }


    if (stream.match(identifiers)) {
      state.leaving_expr=true;
      return 'variable';
    }
    // Handle non-detected items
    stream.next();
    return ERRORCLASS;
  }

  function tokenStringFactory(delimiter) {
    while ('rub'.indexOf(delimiter.charAt(0).toLowerCase()) >= 0) {
      delimiter = delimiter.substr(1);
    }
    var singleline = delimiter.length == 1;
    var OUTCLASS = 'string';

    function tokenString(stream, state) {
      while (!stream.eol()) {
        stream.eatWhile(/[^'"\\]/);
        if (stream.eat('\\')) {
            stream.next();
            if (singleline && stream.eol()) {
              return OUTCLASS;
            }
        } else if (stream.match(delimiter)) {
            state.tokenize = tokenBase;
            return OUTCLASS;
        } else {
            stream.eat(/['"]/);
        }
      }
      if (singleline) {
        if (parserConf.singleLineStringErrors) {
            return ERRORCLASS;
        } else {
            state.tokenize = tokenBase;
        }
      }
      return OUTCLASS;
    }
    tokenString.isString = true;
    return tokenString;
  }

  function tokenLexer(stream, state) {
    indentInfo = null;
    var style = state.tokenize(stream, state);
    var current = stream.current();

    // Handle '.' connected identifiers
    if (current === '.') {
      style = stream.match(identifiers, false) ? null : ERRORCLASS;
      if (style === null && state.lastStyle === 'meta') {
          // Apply 'meta' style to '.' connected identifiers when
          // appropriate.
        style = 'meta';
      }
      return style;
    }

    // Handle macro calls
    if (current === '@') {
      return stream.match(identifiers, false) ? 'meta' : ERRORCLASS;
    }

    return style;
  }

  var external = {
    startState: function() {
      return {
        tokenize: tokenBase,
        scopes: [],
        leaving_expr: false
      };
    },

    token: function(stream, state) {
      var style = tokenLexer(stream, state);
      state.lastStyle = style;
      return style;
    },

    indent: function(state, textAfter) {
      var delta = 0;
      if(textAfter=="end" || textAfter=="]" || textAfter=="}" || textAfter=="else" || textAfter=="elseif") {
        delta = -1;
      }
      return (state.scopes.length + delta) * 2;
    },

    lineComment: "#",
    fold: "indent",
    electricChars: "endlsif]}"
  };
  return external;
});


CodeMirror.defineMIME("text/x-julia", "julia");
