/*
 *	MySQL Mode for CodeMirror 2 by MySQL-Tools
 *	@author James Thorne (partydroid)
 *	@link 	http://github.com/partydroid/MySQL-Tools
 * 	@link 	http://mysqltools.org
 *	@version 02/Jan/2012
*/
CodeMirror.defineMode("mysql", function(config) {
  var indentUnit = config.indentUnit;
  var curPunc;

  function wordRegexp(words) {
    return new RegExp("^(?:" + words.join("|") + ")$", "i");
  }
  var ops = wordRegexp(["str", "lang", "langmatches", "datatype", "bound", "sameterm", "isiri", "isuri",
                        "isblank", "isliteral", "union", "a"]);
  var keywords = wordRegexp([
  ('ACCESSIBLE'),('ALTER'),('AS'),('BEFORE'),('BINARY'),('BY'),('CASE'),('CHARACTER'),('COLUMN'),('CONTINUE'),('CROSS'),('CURRENT_TIMESTAMP'),('DATABASE'),('DAY_MICROSECOND'),('DEC'),('DEFAULT'),
	('DESC'),('DISTINCT'),('DOUBLE'),('EACH'),('ENCLOSED'),('EXIT'),('FETCH'),('FLOAT8'),('FOREIGN'),('GRANT'),('HIGH_PRIORITY'),('HOUR_SECOND'),('IN'),('INNER'),('INSERT'),('INT2'),('INT8'),
	('INTO'),('JOIN'),('KILL'),('LEFT'),('LINEAR'),('LOCALTIME'),('LONG'),('LOOP'),('MATCH'),('MEDIUMTEXT'),('MINUTE_SECOND'),('NATURAL'),('NULL'),('OPTIMIZE'),('OR'),('OUTER'),('PRIMARY'),
	('RANGE'),('READ_WRITE'),('REGEXP'),('REPEAT'),('RESTRICT'),('RIGHT'),('SCHEMAS'),('SENSITIVE'),('SHOW'),('SPECIFIC'),('SQLSTATE'),('SQL_CALC_FOUND_ROWS'),('STARTING'),('TERMINATED'),
	('TINYINT'),('TRAILING'),('UNDO'),('UNLOCK'),('USAGE'),('UTC_DATE'),('VALUES'),('VARCHARACTER'),('WHERE'),('WRITE'),('ZEROFILL'),('ALL'),('AND'),('ASENSITIVE'),('BIGINT'),('BOTH'),('CASCADE'),
	('CHAR'),('COLLATE'),('CONSTRAINT'),('CREATE'),('CURRENT_TIME'),('CURSOR'),('DAY_HOUR'),('DAY_SECOND'),('DECLARE'),('DELETE'),('DETERMINISTIC'),('DIV'),('DUAL'),('ELSEIF'),('EXISTS'),('FALSE'),
	('FLOAT4'),('FORCE'),('FULLTEXT'),('HAVING'),('HOUR_MINUTE'),('IGNORE'),('INFILE'),('INSENSITIVE'),('INT1'),('INT4'),('INTERVAL'),('ITERATE'),('KEYS'),('LEAVE'),('LIMIT'),('LOAD'),('LOCK'),
	('LONGTEXT'),('MASTER_SSL_VERIFY_SERVER_CERT'),('MEDIUMINT'),('MINUTE_MICROSECOND'),('MODIFIES'),('NO_WRITE_TO_BINLOG'),('ON'),('OPTIONALLY'),('OUT'),('PRECISION'),('PURGE'),('READS'),
	('REFERENCES'),('RENAME'),('REQUIRE'),('REVOKE'),('SCHEMA'),('SELECT'),('SET'),('SPATIAL'),('SQLEXCEPTION'),('SQL_BIG_RESULT'),('SSL'),('TABLE'),('TINYBLOB'),('TO'),('TRUE'),('UNIQUE'),
	('UPDATE'),('USING'),('UTC_TIMESTAMP'),('VARCHAR'),('WHEN'),('WITH'),('YEAR_MONTH'),('ADD'),('ANALYZE'),('ASC'),('BETWEEN'),('BLOB'),('CALL'),('CHANGE'),('CHECK'),('CONDITION'),('CONVERT'),
	('CURRENT_DATE'),('CURRENT_USER'),('DATABASES'),('DAY_MINUTE'),('DECIMAL'),('DELAYED'),('DESCRIBE'),('DISTINCTROW'),('DROP'),('ELSE'),('ESCAPED'),('EXPLAIN'),('FLOAT'),('FOR'),('FROM'),
	('GROUP'),('HOUR_MICROSECOND'),('IF'),('INDEX'),('INOUT'),('INT'),('INT3'),('INTEGER'),('IS'),('KEY'),('LEADING'),('LIKE'),('LINES'),('LOCALTIMESTAMP'),('LONGBLOB'),('LOW_PRIORITY'),
	('MEDIUMBLOB'),('MIDDLEINT'),('MOD'),('NOT'),('NUMERIC'),('OPTION'),('ORDER'),('OUTFILE'),('PROCEDURE'),('READ'),('REAL'),('RELEASE'),('REPLACE'),('RETURN'),('RLIKE'),('SECOND_MICROSECOND'),
	('SEPARATOR'),('SMALLINT'),('SQL'),('SQLWARNING'),('SQL_SMALL_RESULT'),('STRAIGHT_JOIN'),('THEN'),('TINYTEXT'),('TRIGGER'),('UNION'),('UNSIGNED'),('USE'),('UTC_TIME'),('VARBINARY'),('VARYING'),
	('WHILE'),('XOR'),('FULL'),('COLUMNS'),('MIN'),('MAX'),('STDEV'),('COUNT')
  ]);
  var operatorChars = /[*+\-<>=&|]/;

  function tokenBase(stream, state) {
    var ch = stream.next();
    curPunc = null;
    if (ch == "$" || ch == "?") {
      stream.match(/^[\w\d]*/);
      return "variable-2";
    }
    else if (ch == "<" && !stream.match(/^[\s\u00a0=]/, false)) {
      stream.match(/^[^\s\u00a0>]*>?/);
      return "atom";
    }
    else if (ch == "\"" || ch == "'") {
      state.tokenize = tokenLiteral(ch);
      return state.tokenize(stream, state);
    }
    else if (ch == "`") {
      state.tokenize = tokenOpLiteral(ch);
      return state.tokenize(stream, state);
    }
    else if (/[{}\(\),\.;\[\]]/.test(ch)) {
      curPunc = ch;
      return null;
    }
    else if (ch == "-" && stream.eat("-")) {
      stream.skipToEnd();
      return "comment";
    }
    else if (ch == "/" && stream.eat("*")) {
      state.tokenize = tokenComment;
      return state.tokenize(stream, state);
    }
    else if (operatorChars.test(ch)) {
      stream.eatWhile(operatorChars);
      return null;
    }
    else if (ch == ":") {
      stream.eatWhile(/[\w\d\._\-]/);
      return "atom";
    }
    else {
      stream.eatWhile(/[_\w\d]/);
      if (stream.eat(":")) {
        stream.eatWhile(/[\w\d_\-]/);
        return "atom";
      }
      var word = stream.current();
      if (ops.test(word))
        return null;
      else if (keywords.test(word))
        return "keyword";
      else
        return "variable";
    }
  }

  function tokenLiteral(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped) {
          state.tokenize = tokenBase;
          break;
        }
        escaped = !escaped && ch == "\\";
      }
      return "string";
    };
  }

  function tokenOpLiteral(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped) {
          state.tokenize = tokenBase;
          break;
        }
        escaped = !escaped && ch == "\\";
      }
      return "variable-2";
    };
  }

  function tokenComment(stream, state) {
    for (;;) {
      if (stream.skipTo("*")) {
        stream.next();
        if (stream.eat("/")) {
          state.tokenize = tokenBase;
          break;
        }
      } else {
        stream.skipToEnd();
        break;
      }
    }
    return "comment";
  }


  function pushContext(state, type, col) {
    state.context = {prev: state.context, indent: state.indent, col: col, type: type};
  }
  function popContext(state) {
    state.indent = state.context.indent;
    state.context = state.context.prev;
  }

  return {
    startState: function() {
      return {tokenize: tokenBase,
              context: null,
              indent: 0,
              col: 0};
    },

    token: function(stream, state) {
      if (stream.sol()) {
        if (state.context && state.context.align == null) state.context.align = false;
        state.indent = stream.indentation();
      }
      if (stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);

      if (style != "comment" && state.context && state.context.align == null && state.context.type != "pattern") {
        state.context.align = true;
      }

      if (curPunc == "(") pushContext(state, ")", stream.column());
      else if (curPunc == "[") pushContext(state, "]", stream.column());
      else if (curPunc == "{") pushContext(state, "}", stream.column());
      else if (/[\]\}\)]/.test(curPunc)) {
        while (state.context && state.context.type == "pattern") popContext(state);
        if (state.context && curPunc == state.context.type) popContext(state);
      }
      else if (curPunc == "." && state.context && state.context.type == "pattern") popContext(state);
      else if (/atom|string|variable/.test(style) && state.context) {
        if (/[\}\]]/.test(state.context.type))
          pushContext(state, "pattern", stream.column());
        else if (state.context.type == "pattern" && !state.context.align) {
          state.context.align = true;
          state.context.col = stream.column();
        }
      }

      return style;
    },

    indent: function(state, textAfter) {
      var firstChar = textAfter && textAfter.charAt(0);
      var context = state.context;
      if (/[\]\}]/.test(firstChar))
        while (context && context.type == "pattern") context = context.prev;

      var closing = context && firstChar == context.type;
      if (!context)
        return 0;
      else if (context.type == "pattern")
        return context.col;
      else if (context.align)
        return context.col + (closing ? 0 : 1);
      else
        return context.indent + (closing ? 0 : indentUnit);
    }
  };
});

CodeMirror.defineMIME("text/x-mysql", "mysql");
