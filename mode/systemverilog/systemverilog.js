CodeMirror.defineMode("systemverilog", function(config, parserConfig) {

  var LOG = false;

  var indentUnit = config.indentUnit,
      statementIndentUnit = parserConfig.statementIndentUnit || indentUnit,
      multiLineStrings = parserConfig.multiLineStrings;

  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }

  /** 
   * Keywords from IEEE 1800-2012
   */
  var keywords = words(
    "accept_on alias always always_comb always_ff always_latch and assert assign assume automatic before begin bind " +
    "bins binsof bit break buf bufif0 bufif1 byte case casex casez cell chandle checker class clocking cmos config " +
    "const constraint context continue cover covergroup coverpoint cross deassign default defparam design disable " +
    "dist do edge else end endcase endchecker endclass endclocking endconfig endfunction endgenerate endgroup " +
    "endinterface endmodule endpackage endprimitive endprogram endproperty endspecify endsequence endtable endtask " +
    "enum event eventually expect export extends extern final first_match for force foreach forever fork forkjoin " +
    "function generate genvar global highz0 highz1 if iff ifnone ignore_bins illegal_bins implements implies import " +
    "incdir include initial inout input inside instance int integer interconnect interface intersect join join_any " +
    "join_none large let liblist library local localparam logic longint macromodule matches medium modport module " +
    "nand negedge nettype new nexttime nmos nor noshowcancelled not notif0 notif1 null or output package packed " +
    "parameter pmos posedge primitive priority program property protected pull0 pull1 pulldown pullup " +
    "pulsestyle_ondetect pulsestyle_onevent pure rand randc randcase randsequence rcmos real realtime ref reg " +
    "reject_on release repeat restrict return rnmos rpmos rtran rtranif0 rtranif1 s_always s_eventually s_nexttime " +
    "s_until s_until_with scalared sequence shortint shortreal showcancelled signed small soft solve specify " +
    "specparam static string strong strong0 strong1 struct super supply0 supply1 sync_accept_on sync_reject_on " +
    "table tagged task this throughout time timeprecision timeunit tran tranif0 tranif1 tri tri0 tri1 triand trior " +
    "trireg type typedef union unique unique0 unsigned until until_with untyped use uwire var vectored virtual void " +
    "wait wait_order wand weak weak0 weak1 while wildcard wire with within wor xnor xor")

  /** Operators from IEEE 1800-2012
     unary_operator ::=
       + | - | ! | ~ | & | ~& | | | ~| | ^ | ~^ | ^~
     binary_operator ::=
       + | - | * | / | % | == | != | === | !== | ==? | !=? | && | || | **
       | < | <= | > | >= | & | | | ^ | ^~ | ~^ | >> | << | >>> | <<<
       | -> | <->
     inc_or_dec_operator ::= ++ | --
     unary_module_path_operator ::=
       ! | ~ | & | ~& | | | ~| | ^ | ~^ | ^~
     binary_module_path_operator ::=
       == | != | && | || | & | | | ^ | ^~ | ~^
  */
  var isOperatorChar = /[\+\-\*\/!~&|^%=?:]/;
  var isBracketChar = /[\[\]{}()]/;

  var unsignedNumber = /[0-9_]+/;
  var decimalLiteral = /\d*\s*'s?d\s*[0-9_]+/i;
  var binaryLiteral = /\d*\s*'s?b\s*[xz01_]+/i;
  var octLiteral = /\d*\s*'s?o\s*[xz0-7_]+/i;
  var hexLiteral = /\d*\s*'s?h\s*[0-9a-fxz?_]+/i;
  var realLiteral = /([\d_]+(\.[\d_]+)?E-?[\d_]+)|([\d_]+\.[\d_]+)/i;

  var curPunc;
  var curKeyword;

  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }

  // Opening/closing pairs
  var openClose = {};
  openClose["begin"    ] = "end";
  openClose["case"     ] = "endcase";
  openClose["casex"    ] = "endcase";
  openClose["casez"    ] = "endcase";
  openClose["checker"  ] = "endchecker";
  openClose["class"    ] = "endclass";
  openClose["clocking" ] = "endclocking";
  openClose["config"   ] = "endconfig";
  openClose["function" ] = "endfunction";
  openClose["generate" ] = "endgenerate";
  openClose["group"    ] = "endgroup";
  openClose["interface"] = "endinterface";
  openClose["module"   ] = "endmodule";
  openClose["package"  ] = "endpackage";
  openClose["primitive"] = "endprimitive";
  openClose["program"  ] = "endprogram";
  openClose["property" ] = "endproperty";
  openClose["specify"  ] = "endspecify";
  openClose["sequence" ] = "endsequence";
  openClose["table"    ] = "endtable";
  openClose["task"     ] = "endtask";
  openClose["do"       ] = "while";
  openClose["fork"     ] = "join";  // TODO: handle join_any, join_none

  var blockClosings = [];
  for (k in openClose) {
    blockClosings.push(openClose[k]);
  }
  blockClosings.push("join_any");
  blockClosings.push("join_none");

  var statementKeywods = words("always always_comb always_ff always_latch assert assign assume else for foreach forever if initial repeat while");

  function endChars(words) {
    var result = "";
    for (var i in words) {
      var c = words[i].slice(-1)
      if (result.indexOf(c) < 0) {
        result += c;
      }
    }
    return result;
  }

  function tokenBase(stream, state) {
    var ch = stream.peek();
    if (/[,;\.]/.test(ch)) {
      curPunc = stream.next();
      return null;
    }
    if (isBracketChar.test(ch)) {
      curPunc = stream.next();
      return "bracket";
    }
    // Macros (tick-defines)
    if (ch == '`') {
      stream.next();
      if (stream.eatWhile(/[\w\$_]/)) {
        return "def";
      } else {
        return null;
      }
    }
    // System calls
    if (ch == '$') {
      stream.next();
      if (stream.eatWhile(/[\w\$_]/)) {
        return "meta";
      } else {
        return null;
      }
    }
    // Strings
    if (ch == '"') {
      stream.next();
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }
    // Comments
    if (ch == "/") {
      stream.next();
      if (stream.eat("*")) {
        state.tokenize = tokenComment;
        return tokenComment(stream, state);
      }
      if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }
      stream.backUp(1);
    }

    // Numeric literals
    if (stream.match(realLiteral) ||
        stream.match(decimalLiteral) ||
        stream.match(binaryLiteral) ||
        stream.match(octLiteral) ||
        stream.match(hexLiteral) ||
        stream.match(unsignedNumber) || 
        stream.match(realLiteral)) {
      return "number";
    }

    // Operators
    if (stream.eatWhile(isOperatorChar)) {
      return "meta";
    }

    // Keywords / plain variables
    if (stream.eatWhile(/[\w\$_]/)) {
      var cur = stream.current();
      if (keywords[cur]) {
        if (openClose[cur]) {
          curPunc = "newblock";
        }
        if (statementKeywods[cur]) {
          curPunc = "newstatement";
        }
        curKeyword = cur;
        return "keyword";
      }
      return "variable";
    }

    stream.next();
    return null;
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
      return "string";
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
    return "comment";
  }

  function Context(indented, column, type, align, prev) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.align = align;
    this.prev = prev;
    this.log = function(depth) {
      if (!depth) depth = 0;
      console.log(depth, this);
      if (this.prev) this.prev.log(depth+1);
    }
  }
  function pushContext(state, col, type) {
    var indent = state.indented;
    var c = new Context(indent, col, type, null, state.context);
    if (LOG) {console.log("Pushed Context"); c.log(0);}
    return state.context = c;
  }
  function popContext(state) {
    var t = state.context.type;
    if (t == ")" || t == "]" || t == "}")
      state.indented = state.context.indented;
    if (LOG) {console.log("Popped Context"); state.context.prev.log(0);}
    return state.context = state.context.prev;
  }

  // Interface
  return {

    // Characters to force current line to reindent
    electricChars: "{}()[];" + endChars(blockClosings),

    startState: function(basecolumn) {
      return {
        tokenize: null,
        context: new Context((basecolumn || 0) - indentUnit, 0, "top", false),
        indented: 0,
        startOfLine: true,
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
      curPunc = null;
      curKeyword = null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style == "comment" || style == "meta" || style == "variable") return style;

      if (curPunc == ";" && ctx.type == "statement") {
        ctx = popContext(state);
        while (ctx && ctx.type == "statement") ctx = popContext(state);
      }
      else if (curPunc == ctx.type) {
        popContext(state);
        //ctx = popContext(state);    // TODO: This breaks the simple "if (a)\n" case 
        while (ctx && ctx.type == "statement") ctx = popContext(state);
      }
      else if (ctx.type && ctx.type == curKeyword) {
        ctx = popContext(state);
        while (ctx && ctx.type == "statement") ctx = popContext(state);
      }
      else if (curPunc == "{") pushContext(state, stream.column(), "}");
      else if (curPunc == "[") pushContext(state, stream.column(), "]");
      else if (curPunc == "(") pushContext(state, stream.column(), ")");
      else if (curPunc == "newstatement") {
        pushContext(state, stream.column(), "statement");
      } else if (curPunc == "newblock") {
        var close = openClose[curKeyword];
        pushContext(state, stream.column(), close);
      }

      state.startOfLine = false;
      return style;
    },

    indent: function(state, textAfter) {
      if (state.tokenize != tokenBase && state.tokenize != null) return CodeMirror.Pass;
      var ctx = state.context, firstChar = textAfter && textAfter.charAt(0);
      if (ctx.type == "statement" && firstChar == "}") ctx = ctx.prev;
      var textAfterToSpace = textAfter.split(" ")[0];
      var closing = (textAfterToSpace == ctx.type);
      if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : statementIndentUnit);
      else if (ctx.type == ")" && !closing) return ctx.indented + statementIndentUnit;
      else return ctx.indented + (closing ? 0 : indentUnit);
    },

    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    lineComment: "//"
  };
});

(function() {

  CodeMirror.defineMIME("text/x-systemverilog", {
    name: "systemverilog"
  });
}());
