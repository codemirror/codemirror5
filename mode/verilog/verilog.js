// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("verilog", function(config, parserConfig) {

  var indentUnit = config.indentUnit,
      statementIndentUnit = parserConfig.statementIndentUnit || indentUnit,
      dontAlignCalls = parserConfig.dontAlignCalls,
      noIndentKeywords = parserConfig.noIndentKeywords || [],
      multiLineStrings = parserConfig.multiLineStrings,
      hooks = parserConfig.hooks || {};

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
    "wait wait_order wand weak weak0 weak1 while wildcard wire with within wor xnor xor");

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

  var unsignedNumber = /\d[0-9_]*/;
  var decimalLiteral = /\d*\s*'s?d\s*\d[0-9_]*/i;
  var binaryLiteral = /\d*\s*'s?b\s*[xz01][xz01_]*/i;
  var octLiteral = /\d*\s*'s?o\s*[xz0-7][xz0-7_]*/i;
  var hexLiteral = /\d*\s*'s?h\s*[0-9a-fxz?][0-9a-fxz?_]*/i;
  var realLiteral = /(\d[\d_]*(\.\d[\d_]*)?E-?[\d_]+)|(\d[\d_]*\.\d[\d_]*)/i;

  var closingBracketOrWord = /^((\w+)|[)}\]])/;
  var closingBracket = /[)}\]]/;

  var curPunc;
  var curKeyword;

  // Block openings which are closed by a matching keyword in the form of ("end" + keyword)
  // E.g. "task" => "endtask"
  var blockKeywords = words(
    "case checker class clocking config function generate interface module package" +
    "primitive program property specify sequence table task"
  );
  // Opening/closing pairs
  var openClose = {};
  for (var keyword in blockKeywords) {
    openClose[keyword] = "end" + keyword;
  }
  openClose["begin"] = "end";
  openClose["casex"] = "endcase";
  openClose["casez"] = "endcase";
  openClose["do"   ] = "while";
  openClose["fork" ] = "join;join_any;join_none";
  openClose["covergroup"] = "endgroup";

  for (var i in noIndentKeywords) {
    var keyword = noIndentKeywords[i];
    if (openClose[keyword]) {
      openClose[keyword] = undefined;
    }
  }

  // Keywords which open statements that are ended with a semi-colon
  var statementKeywords = words("always always_comb always_ff always_latch assert assign assume else export for foreach forever if import initial repeat while");

  function tokenBase(stream, state) {
    var ch = stream.peek(), style;
    if (hooks[ch] && ((style = hooks[ch](stream, state)) != false)) {return style;}
    if (hooks["tokenBase"] && ((style = hooks["tokenBase"](stream, state)) != false)) {return style;}

    if (/[,;:\.]/.test(ch)) {
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
    // Time literals
    if (ch == '#') {
      stream.next();
      stream.eatWhile(/[\d_.]/);
      return "def";
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
        if (statementKeywords[cur]) {
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
  }
  function pushContext(state, col, type) {
    var indent = state.indented;
    var c = new Context(indent, col, type, null, state.context);
    return state.context = c;
  }
  function popContext(state) {
    var t = state.context.type;
    if (t == ")" || t == "]" || t == "}") {
      state.indented = state.context.indented;
    }
    return state.context = state.context.prev;
  }

  function isClosing(text, contextClosing) {
    if (text == contextClosing) {
      return true;
    } else {
      // contextClosing may be mulitple keywords separated by ;
      var closingKeywords = contextClosing.split(";");
      for (var i in closingKeywords) {
        if (text == closingKeywords[i]) {
          return true;
        }
      }
      return false;
    }
  }

  function buildElectricInputRegEx() {
    // Reindentation should occur on any bracket char: {}()[]
    // or on a match of any of the block closing keywords, at
    // the end of a line
    var allClosings = [];
    for (var i in openClose) {
      if (openClose[i]) {
        var closings = openClose[i].split(";");
        for (var j in closings) {
          allClosings.push(closings[j]);
        }
      }
    }
    var re = new RegExp("[{}()\\[\\]]|(" + allClosings.join("|") + ")$");
    return re;
  }

  // Interface
  return {

    // Regex to force current line to reindent
    electricInput: buildElectricInputRegEx(),

    startState: function(basecolumn) {
      return {
        tokenize: null,
        context: new Context((basecolumn || 0) - indentUnit, 0, "top", false),
        indented: 0,
        startOfLine: true,
        vxContext: (hooks["startStateContext"]) ? new hooks["startStateContext"](parserConfig) : null
      };
    },

    token: function(stream, state) {
      var ctx = state.context;
      if (stream.sol()) {
        if (ctx.align == null) ctx.align = false;
        state.indented = stream.indentation();
        state.startOfLine = true;
      }
      if (hooks["token"]) {hooks["token"](stream, state);}
      if (stream.eatSpace()) return null;
      curPunc = null;
      curKeyword = null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style == "comment" || style == "meta" || style == "variable") return style;
      if (ctx.align == null) ctx.align = true;

      if (curPunc == ctx.type) {
        popContext(state);
      }
      else if ((curPunc == ";" && ctx.type == "statement") ||
               (ctx.type && isClosing(curKeyword, ctx.type))) {
        ctx = popContext(state);
        while (ctx && ctx.type == "statement") ctx = popContext(state);
      }
      else if (curPunc == "{") { pushContext(state, stream.column(), "}"); }
      else if (curPunc == "[") { pushContext(state, stream.column(), "]"); }
      else if (curPunc == "(") { pushContext(state, stream.column(), ")"); }
      else if (ctx && ctx.type == "endcase" && curPunc == ":") { pushContext(state, stream.column(), "statement"); }
      else if (curPunc == "newstatement") {
        pushContext(state, stream.column(), "statement");
      } else if (curPunc == "newblock") {
        if (curKeyword == "function" && ctx && (ctx.type == "statement" || ctx.type == "endgroup")) {
          // The 'function' keyword can appear in some other contexts where it actually does not
          // indicate a function (import/export DPI and covergroup definitions).
          // Do nothing in this case
        } else if (curKeyword == "task" && ctx && ctx.type == "statement") {
          // Same thing for task
        } else {
          var close = openClose[curKeyword];
          pushContext(state, stream.column(), close);
        }
      }

      state.startOfLine = false;
      return style;
    },

    indent: function(state, textAfter) {
      if (state.tokenize != tokenBase && state.tokenize != null) return CodeMirror.Pass;
      if (hooks["indent"] && hooks["indent"](state) >= 0) {return(hooks["indent"](state));};
      var ctx = state.context, firstChar = textAfter && textAfter.charAt(0);
      if (ctx.type == "statement" && firstChar == "}") ctx = ctx.prev;
      var closing = false;
      var possibleClosing = textAfter.match(closingBracketOrWord);
      if (possibleClosing) {
        closing = isClosing(possibleClosing[0], ctx.type);
      }
      if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : statementIndentUnit);
      else if (closingBracket.test(ctx.type) && ctx.align && !dontAlignCalls) return ctx.column + (closing ? 0 : 1);
      else if (ctx.type == ")" && !closing) return ctx.indented + statementIndentUnit;
      else return ctx.indented + (closing ? 0 : indentUnit);
    },

    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    lineComment: "//"
  };
});

  CodeMirror.defineMIME("text/x-verilog", {
    name: "verilog"
  });

  CodeMirror.defineMIME("text/x-systemverilog", {
    name: "verilog"
  });

  CodeMirror.defineMIME("text/x-svx", {
    name: "verilog",
    vxModeIsOn: true,
    isSvxChangeScopePrefix: function(str) {
      var svxchScopePrefixs = {
        ">":"property", "->":"property", "-":"hr", "|":"link", "?$":"qualifier", "?*":"qualifier",
        "@-":"variable-3", "@":"variable-3", "?":"qualifier"};
      var x = svxchScopePrefixs[str];
      return (x === undefined ? false : x);
    },
    svxGenIndent: function(stream, state) {
      var svxindentUnit = 2;
      var rtnIndent = -1, indentUnitRq = 0, curIndent = stream.indentation(), ctx = state.vxContext;
      switch (ctx.svxCurCtlFlowChar) {
      case "\\":
        curIndent = 0;
        break;
      case "|":
        if (ctx.svxPrevPrevCtlFlowChar == "@") {
          indentUnitRq = -2; //-2 new pipe rq after cur pipe
          break;
        }
        if (ctx.thisMode.isSvxChangeScopePrefix(ctx.svxPrevCtlFlowChar) != false)
          indentUnitRq = 1; // +1 new scope
        break;
      case "M":  // m4
        if (ctx.svxPrevPrevCtlFlowChar == "@") {
          indentUnitRq = -2; //-2 new inst rq after  pipe
          break;
        }
        if (ctx.thisMode.isSvxChangeScopePrefix(ctx.svxPrevCtlFlowChar) != false)
          indentUnitRq = 1; // +1 new scope
        break;
      case "@":
        if (ctx.svxPrevCtlFlowChar == "S") {
          indentUnitRq = -1; // new pipe stage after stmts
        }
        if (ctx.svxPrevCtlFlowChar == "|") {
          indentUnitRq = 1; // 1st pipe stage
        }
        break;
      case "S":
        if (ctx.svxPrevCtlFlowChar == "@") {
          indentUnitRq = 1; // flow in pipe stage
        }
        if (ctx.thisMode.isSvxChangeScopePrefix(ctx.svxPrevCtlFlowChar) != false)
          indentUnitRq = 1; // +1 new scope
        break;
      }
      var statementIndentUnit = svxindentUnit;
      rtnIndent = curIndent + (indentUnitRq*statementIndentUnit);
      return( (rtnIndent >= 0) ? rtnIndent : curIndent );
    },
    hooks: {
      "\\": function(stream, state) {
        var vxIndent = 0, style = false;
        var curPunc  = stream.string;
        if ((stream.sol()) && (/\\SV/.test(stream.string))) {
          curPunc = (/\\SVX_version/.test(stream.string))
            ? "\\SVX_version" : stream.string;
          stream.skipToEnd();
          if (curPunc == "\\SV" && state.vxContext.vxCodeActive) {state.vxContext.vxCodeActive = false;};
          if ((/\\SVX/.test(curPunc) && !state.vxContext.vxCodeActive)
            || (curPunc=="\\SVX_version" && state.vxContext.vxCodeActive)) {state.vxContext.vxCodeActive = true;};
          style = "keyword";
          state.vxContext.svxCurCtlFlowChar  = state.vxContext.svxPrevPrevCtlFlowChar
            = state.vxContext.svxPrevCtlFlowChar = "";
          if (state.vxContext.vxCodeActive == true) {
            state.vxContext.svxCurCtlFlowChar  = "\\";
            vxIndent=state.vxContext.thisMode.svxGenIndent(stream, state);
          }
          state.vxContext.vxIndentRq = vxIndent;
        }
        return style;
      },
      "tokenBase": function(stream, state) {
        var vxIndent = 0, style = false, ctx = state.vxContext;
        var svxisOperatorChar = /[\[\]=:]/;
        var     svxkpScopePrefixs = {
          "**":"variable-2", "*":"variable-2", "$$":"variable", "$":"variable",
          "^^":"attribute", "^":"attribute"};
        var ch = stream.peek();
        var vxCurCtlFlowCharValueAtStart = ctx.svxCurCtlFlowChar;
        if (state.vxContext.vxCodeActive == true) {
          switch (true) {
          case /[\[\]{}\(\);\:]/.test(ch):
            // bypass nesting and 1 char punc
            style = "meta";
            stream.next();
            break;
          case ch == "/":
            stream.next();
            if (stream.eat("/")) {
              stream.skipToEnd();
              style = "comment";
              ctx.svxCurCtlFlowChar = "S";
            } else
              stream.backUp(1);
            break;
          case /@/.test(ch):
            // pipeline stage
            style = ctx.thisMode.isSvxChangeScopePrefix(ch);
            ctx.svxCurCtlFlowChar = "@";
            stream.next();
            stream.eatWhile(/[\w\$_]/);
            break;
          case (stream.match(/\b[mM]4+/, true)): // match: function(pattern, consume, caseInsensitive)
            // m4 pre proc
            stream.skipTo("(");
            style = "def";
            ctx.svxCurCtlFlowChar = "M";
            break;
          case ch == "!" && stream.sol():
            // v stmt in svx region
            // ctx.svxCurCtlFlowChar  = "S";
            style = "comment";
            stream.next();
            break;
          case svxisOperatorChar.test(ch):
            // operators
            stream.eatWhile(svxisOperatorChar);
            style = "operator";
            break;
          case ch == "#":
            // phy hier
            ctx.svxCurCtlFlowChar  = (ctx.svxCurCtlFlowChar == "")
              ? ch : ctx.svxCurCtlFlowChar;
            stream.next();
            stream.eatWhile(/[+-]\d/);
            style = "tag";
            break;
          case svxkpScopePrefixs.propertyIsEnumerable(ch):
            // special SVX operators
            style = svxkpScopePrefixs[ch];
            ctx.svxCurCtlFlowChar  = (ctx.svxCurCtlFlowChar == "")
              ? "S" : ctx.svxCurCtlFlowChar;  // stmt
            stream.next();
            stream.match(/[a-zA-Z_0-9]+/);
            break;
          case (ctx.thisMode.isSvxChangeScopePrefix(ch) != false):
            // special SVX operators
            style = ctx.thisMode.isSvxChangeScopePrefix(ch);
            ctx.svxCurCtlFlowChar  = (ctx.svxCurCtlFlowChar == "")
              ? ch : ctx.svxCurCtlFlowChar;
            stream.next();
            stream.match(/[a-zA-Z_0-9]+/);
            break;
          }
          if (ctx.svxCurCtlFlowChar != vxCurCtlFlowCharValueAtStart) { // flow change
            vxIndent = ctx.thisMode.svxGenIndent(stream, state);
            ctx.vxIndentRq = vxIndent;
          }
        }
        return style;
      },
      "startStateContext": function(thisMode) {
        this.svxCurCtlFlowChar = "";
        this.svxPrevCtlFlowChar = "";
        this.svxPrevPrevCtlFlowChar = "";
        this.vxCodeActive = thisMode.vxModeIsOn;
        this.vxIndentRq = 0;
        this.thisMode = thisMode;
      },
      "token": function(stream, state) {
        var ctx = state.vxContext;
        if (ctx.vxCodeActive == true && stream.sol() && ctx.svxCurCtlFlowChar != "") {
          ctx.svxPrevPrevCtlFlowChar = ctx.svxPrevCtlFlowChar;
          ctx.svxPrevCtlFlowChar = ctx.svxCurCtlFlowChar;
          ctx.svxCurCtlFlowChar  = "";
        }
      },
      "indent": function(state) {
        return( (state.vxContext.vxCodeActive == true) ? state.vxContext.vxIndentRq : -1);
      }
    }
  });
});
