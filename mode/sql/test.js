// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/5/LICENSE

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
})();
