// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function() {
  var Pos = CodeMirror.Pos;

  var simpleTables = {
    "users": ["name", "score", "birthDate"],
    "xcountries": ["name", "population", "size"]
  };

  var schemaTables = {
    "schema.users": ["name", "score", "birthDate"],
    "schema.countries": ["name", "population", "size"]
  };

  var displayTextTables = [{
    text: "mytable",
    displayText: "mytable | The main table",
    columns: [{text: "id", displayText: "id | Unique ID"},
              {text: "name", displayText: "name | The name"}]
  }];

  namespace = "sql-hint_";

  function test(name, spec) {
    testCM(name, function(cm) {
      cm.setValue(spec.value);
      cm.setCursor(spec.cursor);
      var completion = CodeMirror.hint.sql(cm, {tables: spec.tables});
      if (!deepCompare(completion.list, spec.list))
        throw new Failure("Wrong completion results " + JSON.stringify(completion.list) + " vs " + JSON.stringify(spec.list));
      eqCharPos(completion.from, spec.from);
      eqCharPos(completion.to, spec.to);
    }, {
      value: spec.value,
      mode: spec.mode || "text/x-mysql"
    });
  }

  test("keywords", {
    value: "SEL",
    cursor: Pos(0, 3),
    list: [{"text":"SELECT","className":"CodeMirror-hint-keyword"}],
    from: Pos(0, 0),
    to: Pos(0, 3)
  });

  test("from", {
    value: "SELECT * fr",
    cursor: Pos(0, 11),
    list: [{"text":"FROM","className":"CodeMirror-hint-keyword"}],
    from: Pos(0, 9),
    to: Pos(0, 11)
  });

  test("table", {
    value: "SELECT xc",
    cursor: Pos(0, 9),
    tables: simpleTables,
    list: [{"text":"xcountries","className":"CodeMirror-hint-table"}],
    from: Pos(0, 7),
    to: Pos(0, 9)
  });

  test("columns", {
    value: "SELECT users.",
    cursor: Pos(0, 13),
    tables: simpleTables,
    list: ["users.name", "users.score", "users.birthDate"],
    from: Pos(0, 7),
    to: Pos(0, 13)
  });

  test("singlecolumn", {
    value: "SELECT users.na",
    cursor: Pos(0, 15),
    tables: simpleTables,
    list: ["users.name"],
    from: Pos(0, 7),
    to: Pos(0, 15)
  });

  test("quoted", {
    value: "SELECT `users`.`na",
    cursor: Pos(0, 18),
    tables: simpleTables,
    list: ["`users`.`name`"],
    from: Pos(0, 7),
    to: Pos(0, 18)
  });

  test("doublequoted", {
    value: "SELECT \"users\".\"na",
    cursor: Pos(0, 18),
    tables: simpleTables,
    list: ["\"users\".\"name\""],
    from: Pos(0, 7),
    to: Pos(0, 18),
    mode: "text/x-sqlite"
  });

  test("quotedcolumn", {
    value: "SELECT users.`na",
    cursor: Pos(0, 16),
    tables: simpleTables,
    list: ["`users`.`name`"],
    from: Pos(0, 7),
    to: Pos(0, 16)
  });

  test("doublequotedcolumn", {
    value: "SELECT users.\"na",
    cursor: Pos(0, 16),
    tables: simpleTables,
    list: ["\"users\".\"name\""],
    from: Pos(0, 7),
    to: Pos(0, 16),
    mode: "text/x-sqlite"
  });

  test("schema", {
    value: "SELECT schem",
    cursor: Pos(0, 12),
    tables: schemaTables,
    list: [{"text":"schema.users","className":"CodeMirror-hint-table"},
        {"text":"schema.countries","className":"CodeMirror-hint-table"},
        {"text":"SCHEMA","className":"CodeMirror-hint-keyword"},
        {"text":"SCHEMA_NAME","className":"CodeMirror-hint-keyword"},
        {"text":"SCHEMAS","className":"CodeMirror-hint-keyword"}],
    from: Pos(0, 7),
    to: Pos(0, 12)
  });

  test("schemaquoted", {
    value: "SELECT `sch",
    cursor: Pos(0, 11),
    tables: schemaTables,
    list: ["`schema`.`users`", "`schema`.`countries`"],
    from: Pos(0, 7),
    to: Pos(0, 11)
  });

  test("schemadoublequoted", {
    value: "SELECT \"sch",
    cursor: Pos(0, 11),
    tables: schemaTables,
    list: ["\"schema\".\"users\"", "\"schema\".\"countries\""],
    from: Pos(0, 7),
    to: Pos(0, 11),
    mode: "text/x-sqlite"
  });

  test("schemacolumn", {
    value: "SELECT schema.users.",
    cursor: Pos(0, 20),
    tables: schemaTables,
    list: ["schema.users.name",
           "schema.users.score",
           "schema.users.birthDate"],
    from: Pos(0, 7),
    to: Pos(0, 20)
  });

  test("schemacolumnquoted", {
    value: "SELECT `schema`.`users`.",
    cursor: Pos(0, 24),
    tables: schemaTables,
    list: ["`schema`.`users`.`name`",
           "`schema`.`users`.`score`",
           "`schema`.`users`.`birthDate`"],
    from: Pos(0, 7),
    to: Pos(0, 24)
  });

  test("schemacolumndoublequoted", {
    value: "SELECT \"schema\".\"users\".",
    cursor: Pos(0, 24),
    tables: schemaTables,
    list: ["\"schema\".\"users\".\"name\"",
           "\"schema\".\"users\".\"score\"",
           "\"schema\".\"users\".\"birthDate\""],
    from: Pos(0, 7),
    to: Pos(0, 24),
    mode: "text/x-sqlite"
  });

  test("displayText_table", {
    value: "SELECT myt",
    cursor: Pos(0, 10),
    tables: displayTextTables,
    list: [{text: "mytable", displayText: "mytable | The main table", "className":"CodeMirror-hint-table"}],
    from: Pos(0, 7),
    to: Pos(0, 10)
  });

  test("displayText_column", {
    value: "SELECT mytable.",
    cursor: Pos(0, 15),
    tables: displayTextTables,
    list: [{text: "mytable.id", displayText: "id | Unique ID"},
           {text: "mytable.name", displayText: "name | The name"}],
    from: Pos(0, 7),
    to: Pos(0, 15)
  });

  test("alias_complete", {
    value: "SELECT t. FROM users t",
    cursor: Pos(0, 9),
    tables: simpleTables,
    list: ["t.name", "t.score", "t.birthDate"],
    from: Pos(0, 7),
    to: Pos(0, 9)
  });

  test("alias_complete_with_displayText", {
    value: "SELECT t. FROM mytable t",
    cursor: Pos(0, 9),
    tables: displayTextTables,
    list: [{text: "t.id", displayText: "id | Unique ID"},
           {text: "t.name", displayText: "name | The name"}],
    from: Pos(0, 7),
    to: Pos(0, 9)
  })

  function deepCompare(a, b) {
    if (a === b) return true
    if (!(a && typeof a == "object") ||
        !(b && typeof b == "object")) return false
    var array = Array.isArray(a)
    if (Array.isArray(b) != array) return false
    if (array) {
      if (a.length != b.length) return false
      for (var i = 0; i < a.length; i++) if (!deepCompare(a[i], b[i])) return false
    } else {
      for (var p in a) if (!(p in b) || !deepCompare(a[p], b[p])) return false
      for (var p in b) if (!(p in a)) return false
    }
    return true
  }
})();
