// ST (Structured Text Language 61131-3 )

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("st", function() {
  function words(str) {
    var pref="", suf, obj = {}, word, words = str.split("|");
    for (var i = 0; i < words.length; ++i) {
      word = words[i];
      if (~word.indexOf("(")) {
        word = word.split("(");
        pref = word[0]; 
        word = word[1];
      }
      if (~word.indexOf(")")) {
        word = pref+word.split(")")[0];
        pref = "";
      }
      obj[pref+word] = true;
    }
    return obj;
  }
  var ERRORCLASS = "error";
  var statements = "IF|CASE|FOR|WHILE|REPEAT";
  var keywords = words(
      statements+"|END_("+statements+")|"+
      "THEN|ELSIF|ELSE|OF|TO|BY|DO||UNTIL|CONTINUE|EXIT|GOTO|RETURN"+
      "AT|ARRAY|"+
      "REF_TO"        //References shall be declared to a defined data type using the keyword REF_TO
      );
  var varTags = words(
      "RETAIN|"+       // Retentive variables
      "NON_RETAIN|"+   // Non-retentive variables
      "PROTECTED|"+    // Only access from inside the own entity and its derivations (default)
      "PUBLIC|"+       // Access allowed from all entities
      "PRIVATE|"+      // Only access from the own entity
      "INTERNAL|"+     // Only access within the same namespace
      "CONSTANT"       // Constant (variable cannot be modified)
      );
  var block = "ACTION|CLASS|CONFIGURATION|FUNCTION|FUNCTION_BLOCK|INTERFACE|METHOD|NAMESPACE|PROGRAM|RESOURCE|STEP|STRUCT|TRANSITION|TYPE|VAR";
  var funcktionBlock = words(block+"|END_("+block+")|VAR_(INPUT|OUTPUT|IN_OUT|EXTERNAL|GLOBAL|ACCESS|TEMP|CONFIG)");
  var builtinFunctions = words(
    // Reference operation
    "REF|"+
    // Standard functions Get lower/upper bound of an array
    "LOWER_BOUND|UPPER_BOUND|"+
    // Numerical and arithmetic functions
    "ABS|SQRT|LN|LOG|EXP|SIN|COS|TAN|ASIN|ACOS|ATAN|ATAN2|ADD|MUL|SUB|DIV|MOD|EXPT|MOVE|"+
    // Bit shift functions
    "SHL|SHR|ROL|ROR|"+ 
    // Bitwise Boolean functions
    "AND|OR|XOR|NOT|AT|IN|"+ 
    // Selection function
    "MOVE|SEL|MAX|MIN|LIMIT|MUX|"+
    // Comparison functions
    "GT|GE|EQ|LE|LT|NE|"+
    // Character string functions
    "LEN|LEFT|RIGHT|MID|CONCAT|INSERT|DELETE|REPLACE|FIND|"+
    // Numerical functions of time and duration data types
    "ADD|ADD_(TIME|LTIME|TOD_TIME|LTOD_LTIME|DT_TIME|LDT_LTIME)|"+
    "SUB|SUB_(TIME|LTIMEDATE_DATE|LDATE_LDATE|TOD_TIME|LTOD_LTIME|TOD_TOD|DT_TIME|LDT_LTIME|DT_DT|LDT_LDT)|"+
    "MUL|MUL_(TIME|LTIME)|DIV|DIV_(TIME|LTIME)|"+
    // Additional functions of time data types
    "CONCAT_(DATE_TOD|DATE_LTOD|DATE|TOD|LTOD|DT|LDT)|"+
    "SPLIT_(DATE|TOD|LTOD|DT|LDT)|"+
    "DAY_OF_WEEK|"+
    // Function for endianess conversion
    "TO_BIG_ENDIAN|TO_LITTLE_ENDIAN|BIG_ENDIAN_TO|LITTLE_ENDIAN_TO|"+
    // Validate functions
    "IS_VALID|IS_VALID_BCD"
    /////
    //"TO_(LREAL|REAL|LINT|DINT|INT|SINT|ULINT|UDINT|UINT|USINT)" 

    );

  var elementaryDataTypes = words(
    "ANY|REAL|LREAL|USINT|UINT|UDINT|ULINT|SINT|INT|DINT|LINT|TIME|BOOL|BYTE|WORD|DWORD|LWORD|STRING|WSTRING|CHAR|WCHAR|"+
    "TIME_OF_DAY|LTIME_OF_DAY|DATE_AND_TIME|LDATE_AND_TIME|DATE|LDATE|TIME|LTIME|"+
    "TOD|LTOD|DT|LDT"
    );

  var atoms = words("TRUE|FALSE|NaN|Inf|NULL");
  var operators = words("MOD|AND|XOR|OR|NOT");
  var isDirectVariable = /^%[IQM][XBWDL]?[\d+][\d\.]*/i;
  var isRelativeLocation = /^%[XBWDL]?\d+\.?[0-7]?/i;
  var isOperatorChar = /^[+\-*&=<>!\^/]/;
  var isTypedNumber = /^[\w]+(#[\w-:'"\.]+)+/i;
  var isNumber = /^(([\d_]+\.?)|([\d_]*\.)*e[-+]?[\d_]+)|(([\d_]+\.?)|([\d_]*\.[\d_]+))/i;
  var isDelimiter = /^[\,;\:\.]/;
  var isBracket = /^[\[\]{}\(\)]/;

  function chain(stream, state, f) {
    state.tokenize = f;
    return f(stream, state);
  }

  function tokenBase(stream, state) {
    var ch = stream.peek();

    if (ch == '/' && stream.match("//")) {
        stream.skipToEnd();
        return "comment";
    }
    if (ch == '/' && stream.match("/*")) {
      return chain(stream, state, tokenComment2);
    }
    if (ch == '(' && stream.match("(*")) {
      return chain(stream, state, tokenComment);
    }
    if (ch == "{"){
      return chain(stream, state, tokenPragma);
    }

    if (ch == '"' || ch == "'") {
      state.tokenize = tokenString(ch, ch=='"'?'string':'string-2');
      return state.tokenize(stream, state);
    }

    if (ch == "%") { 
        if (stream.match(isDirectVariable)) {
          return "variable-2";
        }
        if (stream.match(isRelativeLocation)) {
          return "variable-3";
        }
    }

    if (stream.match(isTypedNumber)) {
      // TODO: validate typed number
      return 'number';
    }

    if (stream.match(isNumber)) {
      return 'number';
    }

    if (ch == ":" && stream.match(":=")) {
      return "operator";
    }

    if (stream.eatWhile(isOperatorChar)) {
      return "operator";
    }

    if (stream.eat(isDelimiter)) {
      return "punctuation";
    }

    if (stream.eat(isBracket)) {
      return "bracket";
    }

    stream.eatWhile(/[\w_]+/);
    var cur = stream.current();
    if (cur) {
      var ucur = cur.toUpperCase();

      if (operators.propertyIsEnumerable(ucur) && "(" == stream.peek()){ //LL(1)
          return "operator";
      }
//      console.log('-', state.lastToken, ucur);
      if (funcktionBlock.propertyIsEnumerable(ucur)) return "keyword";
      if (elementaryDataTypes.propertyIsEnumerable(ucur)) return "builtin";
      if (builtinFunctions.propertyIsEnumerable(ucur)) return "builtin";
      if (varTags.propertyIsEnumerable(ucur)) return "tag";

      if (keywords.propertyIsEnumerable(ucur)) return "keyword";
      if (atoms.propertyIsEnumerable(cur)) return "atom";
      if (/^[\w]+_TO_[\w]+/i.test(cur)) return "builtin"; // XXX: Data type conversion function
      if (/^TO_[\w]+/i.test(cur)) return "builtin"; // XXX: Data type conversion function

    } else {
      stream.next();
    }

    // Handle non-detected items
    // return ERRORCLASS;
    return "variable";
  }

  function tokenString(quote, style) {
    return function(stream, state) {
      var escaped = true, next, end = false;
      while ((next = stream.next()) != null) {

        if (next == quote && !escaped) {end = true; break;}
        escaped = !escaped && next == "$";
      }
      if (end || !escaped) state.tokenize = null;
      return style;
    };
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, maybeNested = false, ch;
    while ((ch = stream.next())) {
      if (ch == ")" && maybeEnd) {
        if (state.nestComment > 0) {
          state.nestComment--;
        } else {
          state.tokenize = tokenBase;
          break;
        }
      } else if (ch == "*" && maybeNested) {
        state.nestComment++;
      }
      maybeEnd = (ch == "*");
      maybeNested = (ch == "(");
    }
    return "comment";
  }

  function tokenComment2(stream, state) {
    var maybeEnd = false, maybeNested = false, ch;
    while ((ch = stream.next())) {
      if (ch == "/" && maybeEnd) {
        if (state.nestComment2 > 0) {
          state.nestComment2--;
        } else {
          state.tokenize = tokenBase;
          break;
        }
      } else if (ch == "*" && maybeNested) {
        state.nestComment2++;
      }
      maybeEnd = (ch == "*");
      maybeNested = (ch == "/");
    }
    return "comment";
  }

  function tokenPragma(stream, state) {
    var ch;
    state.nestPragma=state.nestPragma || 0;
    while (ch = stream.next()) {
      if (ch == "}") {
        state.nestPragma--;
        if (state.nestPragma < 1) {
          state.tokenize = null;
          break;
        }
      } else if (ch == "{") {
        state.nestPragma++;
      }
    }
    return "meta";
  }


  // Interface
  return {
    startState: function() {
      return {
//      lastToken: null,
      tokenize: null,
      nestComment: 0,
      nestComment2: 0,
      nestPragma: 0
      };
    },

    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style == "comment" || style == "meta") return style;
//      var current = stream.current();
//      if (current && style) {
//        state.lastToken = current;
//      }
      return style;
    },
    fold: "indent",
    lineComment: "//",
    blockCommentStart: "(*",
    blockCommentEnd: "*)"
  };
});

CodeMirror.defineMIME("text/x-iec-61131-3", "st");

});
