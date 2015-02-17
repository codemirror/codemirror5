(function() {

    var Pos = CodeMirror.Pos;

    simpleTables = {
        "users": ["name", "score", "birthDate"],
        "countries": ["name", "population", "size"]
    }

    schemaTables = {
        "schema.users": ["name", "score", "birthDate"],
        "schema.countries": ["name", "population", "size"]
    }

    var tests = [
        {
            value: "S",
            cursor: Pos(0, 1),
            options: {
                mode: 'sql',
                hintOptions: {
                    tables: simpleTables
                }
            },
            list: [
                "SELECT",
                "SET"
            ],
            from: Pos(0, 0),
            to: Pos(0, 1)
        }, {
            value: "SELECT * fr",
            cursor: Pos(0, 11),
            options: {
                mode: 'sql',
                hintOptions: {
                    tables: simpleTables
                }
            },
            list: [
                "FROM"
            ],
            from: Pos(0, 9),
            to: Pos(0, 11)
        }, {
            value: "SELECT us",
            cursor: Pos(0, 9),
            options: {
                mode: 'sql',
                hintOptions: {
                    tables: simpleTables
                }
            },
            list: [
                "users"
            ],
            from: Pos(0, 7),
            to: Pos(0, 9)
        },
        {
            value: "SELECT users.",
            cursor: Pos(0, 13),
            options: {
                mode: 'sql',
                hintOptions: {
                    tables: simpleTables
                }
            },
            list: [
                "users.name",
                "users.score",
                "users.birthDate"
            ],
            from: Pos(0, 7),
            to: Pos(0, 13)
        },
        {
            value: "SELECT users.na",
            cursor: Pos(0, 15),
            options: {
                mode: 'text/x-mysql',
                hintOptions: {
                    tables: simpleTables
                }
            },
            list: [
                "users.name",
            ],
            from: Pos(0, 7),
            to: Pos(0, 15)
        },
        {
            value: "SELECT `users`.`na",
            cursor: Pos(0, 18),
            options: {
                mode: 'text/x-mysql',
                hintOptions: {
                    tables: simpleTables
                }
            },
            list: [
                "`users`.`name`",
            ],
            from: Pos(0, 7),
            to: Pos(0, 18)
        },
        {
            value: "SELECT users.`na",
            cursor: Pos(0, 16),
            options: {
                mode: 'text/x-mysql',
                hintOptions: {
                    tables: simpleTables
                }
            },
            list: [
                "`users`.`name`",
            ],
            from: Pos(0, 7),
            to: Pos(0, 16)
        },
        {
            value: "SELECT sch",
            cursor: Pos(0, 10),
            options: {
                mode: 'sql',
                hintOptions: {
                    tables: schemaTables
                }
            },
            list: [
                "schema.users",
                "schema.countries"
            ],
            from: Pos(0, 7),
            to: Pos(0, 10)
        },
        {
            value: "SELECT `sch",
            cursor: Pos(0, 11),
            options: {
                mode: 'text/x-mysql',
                hintOptions: {
                    tables: schemaTables
                }
            },
            list: [
                "`schema`.`users`",
                "`schema`.`countries`"
            ],
            from: Pos(0, 7),
            to: Pos(0, 11)
        },
        {
            value: "SELECT `schema`.`users`.",
            cursor: Pos(0, 24),
            options: {
                mode: 'text/x-mysql',
                hintOptions: {
                    tables: schemaTables
                }
            },
            list: [
                "`schema`.`users`.`name`",
                "`schema`.`users`.`score`",
                "`schema`.`users`.`birthDate`"
            ],
            from: Pos(0, 7),
            to: Pos(0, 24)
        },
        {
            value: "SELECT schema.users.",
            cursor: Pos(0, 20),
            options: {
                mode: 'sql',
                hintOptions: {
                    tables: schemaTables
                }
            },
            list: [
                "schema.users.name",
                "schema.users.score",
                "schema.users.birthDate"
            ],
            from: Pos(0, 7),
            to: Pos(0, 20)
        }
    ];

    for (var testNum = 0; testNum < tests.length; testNum++) {
        testCM('sql-hint-' + (testNum + 1), (function(testNum, cm) {
            var test = tests[testNum];
            cm.setValue(test.value);
            cm.setCursor(test.cursor);
            completion = CodeMirror.hint.sql(cm, test.options.hintOptions);
            if (!isEqPos(completion.from, test.from) || !isEqPos(completion.to, test.to)
                || !isEqList(completion.list, test.list)) {
                    throw new Failure('Sql hint test failed.');
            }
        }).bind(undefined, testNum), tests[testNum].options);
    }

    function isEqPos(pos1, pos2) {
        return (pos1.line == pos2.line) && (pos1.ch == pos2.ch)
    }

    function isEqList(list1, list2) {
        if(list1.length != list2.length)
            return false;
        for(var i = list1.length; i--;) {
            if(list1[i] !== list2[i])
                return false;
        }
        return true;
    }

})();
