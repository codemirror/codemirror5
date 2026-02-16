// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/5/LICENSE

/* global CodeMirror, test, testCM, is, eq */

(function() {
  var mode = CodeMirror.getMode({indentUnit: 2}, "text/x-mysql");
  function MT(name) { test.mode(name, mode, Array.prototype.slice.call(arguments, 1)); }

  MT("simple_select",
     "[keyword SELECT] [number 1]",
     "[keyword SELECT] * [keyword FROM] users");

  MT("where_with_parentheses",
     "[keyword SELECT] * [keyword FROM] users [keyword WHERE] [bracket (] age > [number 18] [bracket )]");

  MT("function_call",
     "[keyword SELECT] COUNT[bracket (]*[bracket )] [keyword FROM] users");

  MT("nested_parentheses",
     "[keyword SELECT] [bracket (][bracket (]a + b[bracket )] * c[bracket )]");

  MT("string_with_parentheses",
     "[keyword SELECT] [string '(test)'] [keyword FROM] t");

  MT("comment_with_parentheses",
     "[keyword SELECT] [number 1] [comment -- (test)]");

  MT("multiline_comment",
     "[comment /* (test) */]");

  MT("subquery",
     "[keyword SELECT] * [keyword FROM] [bracket (]",
     "  [keyword SELECT] [number 1]",
     "[bracket )] subq");

  MT("in_operator",
     "[keyword SELECT] * [keyword FROM] t [keyword WHERE] id [keyword IN] [bracket (][number 1], [number 2], [number 3][bracket )]");

  MT("cte_recursive",
     "[keyword WITH] [keyword RECURSIVE] t [keyword AS] [bracket (]",
     "  [keyword SELECT] [number 1]",
     "[bracket )]",
     "[keyword SELECT] * [keyword FROM] t");

  MT("window_function",
     "[keyword SELECT] ROW_NUMBER[bracket (][bracket )] [keyword OVER] [bracket (][keyword PARTITION] [keyword BY] dept[bracket )]",
     "[keyword FROM] emp");

  MT("json_table",
     "[keyword SELECT] * [keyword FROM] JSON_TABLE[bracket (]doc, [string '$.a[*]'] [keyword COLUMNS] [bracket (]x [keyword INT] [keyword PATH] [string '$'][bracket )][bracket )] jt");

  MT("invisible_index",
     "[keyword CREATE] [keyword INDEX] idx [keyword ON] t[bracket (]c[bracket )] [keyword INVISIBLE]");

  MT("roles",
     "[keyword CREATE] [keyword ROLE] reporting_role");

  MT("date_literal",
     "[keyword SELECT] [keyword DATE] [string '2024-01-01']");

  // ODBC escape syntax intentionally not supported
  MT("no_curly_braces",
     "[keyword SELECT] {d [string '2023-01-01']}");

  // Tests for SQL mode - focusing on text/x-mysql

  testCM("sql_mysql_keyword_invisible", function(cm) {
    var tokens = cm.getLineTokens(0);
    var invisible = tokens.find(function(t) {
      return t.string.toUpperCase() === "INVISIBLE";
    });
    is(invisible, "INVISIBLE token should exist");
    eq(invisible.type, "keyword");
  }, {
    mode: "text/x-mysql",
    value: "CREATE INDEX idx ON t(c) INVISIBLE"
  });

  testCM("sql_mysql_role_token_exists", function(cm) {
    var tokens = cm.getLineTokens(0);
    var role = tokens.find(function(t) {
      return t.string.toUpperCase() === "ROLE";
    });
    is(role, "ROLE token should exist");
  }, {
    mode: "text/x-mysql",
    value: "CREATE ROLE reporting_role"
  });

  testCM("sql_mysql_keyword_json_table", function(cm) {
    var tokens = cm.getLineTokens(0);
    var jt = tokens.find(function(t) {
      return t.string.toUpperCase() === "JSON_TABLE";
    });
    is(jt, "JSON_TABLE token should exist");
    eq(jt.type, "keyword");
  }, {
    mode: "text/x-mysql",
    value: "SELECT * FROM JSON_TABLE(doc, '$.a[*]' COLUMNS(x INT PATH '$')) jt"
  });

  testCM("sql_mysql_window_keywords", function(cm) {
    var tokens = cm.getLineTokens(0);
    var kws = tokens
      .filter(function(t) { return t.type === "keyword"; })
      .map(function(t) { return t.string.toUpperCase(); });

    is(kws.indexOf("OVER") !== -1);
    is(kws.indexOf("PARTITION") !== -1);
    is(kws.indexOf("ROW_NUMBER") !== -1);
  }, {
    mode: "text/x-mysql",
    value: "SELECT ROW_NUMBER() OVER (PARTITION BY dept) FROM emp"
  });

  testCM("sql_mysql_with_recursive_keywords", function(cm) {
    var tokens = cm.getLineTokens(0);
    var kws = tokens
      .filter(function(t) { return t.type === "keyword"; })
      .map(function(t) { return t.string.toUpperCase(); });

    is(kws.indexOf("WITH") !== -1);
    is(kws.indexOf("RECURSIVE") !== -1);
  }, {
    mode: "text/x-mysql",
    value: "WITH RECURSIVE t AS (SELECT 1) SELECT * FROM t"
  });

  testCM("sql_mysql_date_type_token", function(cm) {
    var tokens = cm.getLineTokens(0);
    var date = tokens.find(function(t) {
      return t.string.toUpperCase() === "DATE";
    });
    is(date, "DATE token should exist");
  }, {
    mode: "text/x-mysql",
    value: "CREATE TABLE t (d DATE)"
  });

  testCM("sql_mysql_schema_tokens", function(cm) {
    var tokens = cm.getLineTokens(0);
    var schemas = tokens.find(function(t) {
      return t.string.toUpperCase() === "SCHEMAS";
    });
    is(schemas, "SCHEMAS token should exist");
    is(schemas.type === "keyword" || schemas.type === "builtin");
  }, {
    mode: "text/x-mysql",
    value: "SHOW SCHEMAS"
  });

  testCM("sql_mysql_invisible_identifier_untouched", function(cm) {
    var tokens = cm.getLineTokens(0);
    var ident = tokens.find(function(t) {
      return t.string === "idx";
    });
    is(ident);
    is(ident.type !== "keyword");
  }, {
    mode: "text/x-mysql",
    value: "CREATE INDEX idx ON t(c) INVISIBLE"
  });

})();
