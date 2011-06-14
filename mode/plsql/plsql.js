CodeMirror.defineMode("plsql", function(config, parserConfig) {
  var indentUnit       = config.indentUnit,
      keywords         = parserConfig.keywords,
      functions        = parserConfig.functions,
      types            = parserConfig.types,
      sqlplus          = parserConfig.sqlplus,
      multiLineStrings = parserConfig.multiLineStrings;
  var isOperatorChar   = /[+\-*&%=<>!?:\/|]/;
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
    // start of string?
    if (ch == '"' || ch == "'")
      return chain(stream, state, tokenString(ch));
    // is it one of the special signs []{}().,;? Seperator?
    else if (/[\[\]{}\(\),;\.]/.test(ch))
      return ret(ch);
    // start of a number value?
    else if (/\d/.test(ch)) {
      stream.eatWhile(/[\w\.]/);
      return ret("number", "number");
    }
    // multi line comment or simple operator?
    else if (ch == "/") {
      if (stream.eat("*")) {
        return chain(stream, state, tokenComment);
      }
      else {
        stream.eatWhile(isOperatorChar);
        return ret("operator", "operator");
      }
    }
    // single line comment or simple operator?
    else if (ch == "-") {
      if (stream.eat("-")) {
        stream.skipToEnd();
        return ret("comment", "comment");
      }
      else {
        stream.eatWhile(isOperatorChar);
        return ret("operator", "operator");
      }
    }
    // pl/sql variable?
    else if (ch == "@" || ch == "$") {
      stream.eatWhile(/[\w\d\$_]/);
      return ret("word", "variable");
    }
    // is it a operator?
    else if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return ret("operator", "operator");
    }
    else {
      // get the whole word
      stream.eatWhile(/[\w\$_]/);
      // is it one of the listed keywords?
      if (keywords && keywords.propertyIsEnumerable(stream.current().toLowerCase())) return ret("keyword", "keyword");
      // is it one of the listed functions?
      if (functions && functions.propertyIsEnumerable(stream.current().toLowerCase())) return ret("keyword", "builtin");
      // is it one of the listed types?
      if (types && types.propertyIsEnumerable(stream.current().toLowerCase())) return ret("keyword", "variable-2");
      // is it one of the listed sqlplus keywords?
      if (sqlplus && sqlplus.propertyIsEnumerable(stream.current().toLowerCase())) return ret("keyword", "variable-3");
      // default: just a "word"
      return ret("word", "plsql-word");
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
      return ret("string", "plsql-string");
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
    return ret("comment", "plsql-comment");
  }

  // Interface

  return {
    startState: function(basecolumn) {
      return {
        tokenize: tokenBase,
        startOfLine: true
      };
    },

    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);
      return style;
    }
  };
});

(function() {
  function keywords(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }
  var cKeywords = "abort accept access add all alter and any array arraylen as asc assert assign at attributes audit " +
        "authorization avg " +
        "base_table begin between binary_integer body boolean by " +
        "case cast char char_base check close cluster clusters colauth column comment commit compress connect " +
        "connected constant constraint crash create current currval cursor " +
        "data_base database date dba deallocate debugoff debugon decimal declare default definition delay delete " +
        "desc digits dispose distinct do drop " +
        "else elsif enable end entry escape exception exception_init exchange exclusive exists exit external " +
        "fast fetch file for force form from function " +
        "generic goto grant group " +
        "having " +
        "identified if immediate in increment index indexes indicator initial initrans insert interface intersect " +
        "into is " +
        "key " +
        "level library like limited local lock log logging long loop " +
        "master maxextents maxtrans member minextents minus mislabel mode modify multiset " +
        "new next no noaudit nocompress nologging noparallel not nowait number_base " +
        "object of off offline on online only open option or order out " +
        "package parallel partition pctfree pctincrease pctused pls_integer positive positiven pragma primary prior " +
        "private privileges procedure public " +
        "raise range raw read rebuild record ref references refresh release rename replace resource restrict return " +
        "returning reverse revoke rollback row rowid rowlabel rownum rows run " +
        "savepoint schema segment select separate session set share snapshot some space split sql start statement " +
        "storage subtype successful synonym " +
        "tabauth table tables tablespace task terminate then to trigger truncate type " +
        "union unique unlimited unrecoverable unusable update use using " +
        "validate value values variable view views " +
        "when whenever where while with work";

  var cFunctions = "abs acos add_months ascii asin atan atan2 average " +
        "bfilename " +
        "ceil chartorowid chr concat convert cos cosh count " +
        "decode deref dual dump dup_val_on_index " +
        "empty error exp " +
        "false floor found " +
        "glb greatest " +
        "hextoraw " +
        "initcap instr instrb isopen " +
        "last_day least lenght lenghtb ln lower lpad ltrim lub " +
        "make_ref max min mod months_between " +
        "new_time next_day nextval nls_charset_decl_len nls_charset_id nls_charset_name nls_initcap nls_lower " +
        "nls_sort nls_upper nlssort no_data_found notfound null nvl " +
        "others " +
        "power " +
        "rawtohex reftohex round rowcount rowidtochar rpad rtrim " +
        "sign sin sinh soundex sqlcode sqlerrm sqrt stddev substr substrb sum sysdate " +
        "tan tanh to_char to_date to_label to_multi_byte to_number to_single_byte translate true trunc " +
        "uid upper user userenv " +
        "variance vsize";

  var cTypes = "bfile blob " +
        "character clob " +
        "dec " +
        "float " +
        "int integer " +
        "mlslabel " +
        "natural naturaln nchar nclob number numeric nvarchar2 " +
        "real rowtype " +
        "signtype smallint string " +
        "varchar varchar2";

  var cSqlplus = "appinfo arraysize autocommit autoprint autorecovery autotrace " +
        "blockterminator break btitle " +
        "cmdsep colsep compatibility compute concat copycommit copytypecheck " +
        "define describe " +
        "echo editfile embedded escape exec execute " +
        "feedback flagger flush " +
        "heading headsep " +
        "instance " +
        "linesize lno loboffset logsource long longchunksize " +
        "markup " +
        "native newpage numformat numwidth " +
        "pagesize pause pno " +
        "recsep recsepchar release repfooter repheader " +
        "serveroutput shiftinout show showmode size spool sqlblanklines sqlcase sqlcode sqlcontinue sqlnumber " +
        "sqlpluscompatibility sqlprefix sqlprompt sqlterminator suffix " +
        "tab term termout time timing trimout trimspool ttitle " +
        "underline " +
        "verify version " +
        "wrap";

  CodeMirror.defineMIME("text/x-plsql", {
    name: "plsql",
    keywords: keywords(cKeywords),
    functions: keywords(cFunctions),
    types: keywords(cTypes),
    sqlplus: keywords(cSqlplus)
  });
}());
