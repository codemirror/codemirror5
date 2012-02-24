CodeMirror.defineMode("dylan", function(config, parserConfig) {

    // states: in-prologe, in-code

    //// Words
    var words = {
        // Words that introduce unnamed definitions like "define interface"
        unnamedDefinition: ['interface'],

        // Words that introduce simple named definitions like "define library"
        namedDefinition: ['module', 'library', 'macro',
                          'C-struct', 'C-union',
                          'C-function', 'C-callable-wrapper'],

        // Words that introduce type definitions like "define class".
        // These are also parameterized like "define method" and are
        // appended to otherParameterizedDefinitionWords
        typeParameterizedDefinition: ['class', 'C-subtype', 'C-mapped-subtype'],

        // Words that introduce trickier definitions like "define method".
        // These require special definitions to be added to startExpressions
        otherParameterizedDefinition: ['method', 'function',
                                       'C-variable', 'C-address'],

        // Words that introduce module constant definitions.
        // These must also be simple definitions and are
        // appended to otherSimpleDefinitionWords
        constantSimpleDefinition: ['constant'],

        // Words that introduce module variable definitions.
        // These must also be simple definitions and are
        // appended to otherSimpleDefinitionWords
        variableSimpleDefinition: ['variable'],

        // Other words that introduce simple definitions
        // (without implicit bodies).
        otherSimpleDefinition: ['generic', 'domain',
                                'C-pointer-type',
                                'table'],

        // Words that begin statements with implicit bodies.
        statement: ['if', 'block', 'begin', 'method', 'case',
                    'for', 'select', 'when', 'unless', 'until',
                    'while', 'iterate', 'profiling', 'dynamic-bind'],

        // Patterns that act as separators in compound statements.
        // This may include any general pattern that must be indented
        // specially.
        separator: ['finally', 'exception', 'cleanup', 'else',
                    'elseif', 'afterwards'],

        // Keywords that do not require special indentation handling,
        // but which should be highlighted
        other: ['above', 'below', 'by', 'from', 'handler', 'in',
                'instance', 'let', 'local', 'otherwise', 'slot',
                'subclass', 'then', 'to', 'keyed-by', 'virtual'],

        // Condition signaling function calls
        signalingCalls: ['signal', 'error', 'cerror',
                         'break', 'check-type', 'abort']
    };

    words['otherDefinition'] =
        words['unnamedDefinition']
        .concat(words['namedDefinition'])
        .concat(words['otherParameterizedDefinition']);

    words['definition'] =
        words['typeParameterizedDefinition']
        .concat(words['otherDefinition']);

    words['parameterizedDefinition'] =
        words['typeParameterizedDefinition']
        .concat(words['otherParameterizedDefinition']);

    words['simpleDefinition'] =
        words['constantSimpleDefinition']
        .concat(words['variableSimpleDefinition'])
        .concat(words['otherSimpleDefinition']);

    words['keyword'] =
        words['statement']
        .concat(words['separator'])
        .concat(words['other']);

    //// Patterns
    var symbolPattern = "[-_a-zA-Z?!*@<>$%]+";
    var symbol = new RegExp("^" + symbolPattern);
    var patterns = {
        // Symbols with special syntax
        symbolKeyword: symbolPattern + ":",
        symbolClass: "<" + symbolPattern + ">",
        symbolGlobal: "\\*" + symbolPattern + "\\*",
        symbolConstant: "\\$" + symbolPattern
    };

    // Compile all patterns to regular expressions
    for (var patternName in patterns)
        if (patterns.hasOwnProperty(patternName))
            patterns[patternName] = new RegExp("^" + patterns[patternName]);

    ['keyword', 'definition'].forEach(function (type) {
        patterns[type] = words[type].map(function (word) {
            return new RegExp('^' + word);
        });
    });

    // Names beginning "with-" and "without-" are commonly
    // used as statement macro
    patterns['keyword'].push(/^with(?:out)?-[-_a-zA-Z?!*@<>$%]+/);

    function chain (stream, state, f) {
        state.tokenize = f;
        return f(stream, state);
    }

    var type, content;
    function ret (_type, style, _content) {
        type = _type; content = _content;
        return 'dylan-' + (style || _type);
    }

    function tokenBase (stream, state) {
        // String
        var ch = stream.peek();
        if (ch == '"' || ch == "'") {
            stream.next();
            return chain(stream, state, tokenString(ch, "string"));
        }
        // Comment
        else if (ch == "/") {
            stream.next();
            if (stream.eat("*")) {
                return chain(stream, state, tokenComment);
            }
            else if (stream.eat("/")) {
                stream.skipToEnd();
                return ret("comment");
            }
            else {
                stream.skipTo(" ");
                return ret("operator");
            }
        }
        // Decimal
        else if (/\d/.test(ch)) {
            stream.match(/^\d*(?:\.\d*)?(?:e[+\-]?\d+)?/);
            return ret("number", "decimal");
        }
        // Hash
        else if (ch == "#") {
            stream.next();
            // Symbol with string syntax
            ch = stream.peek();
            if (ch == '"') {
                stream.next();
                return chain(stream, state, tokenString('"', "symbol"));
            }
            // Binary number
            else if (ch == 'b') {
                stream.next();
                stream.eatWhile(/[01]/);
                return ret('number', 'binary');
            }
            // Hex number
            else if (ch == 'x') {
                stream.next();
                stream.eatWhile(/[\da-f]/i);
                return ret('number', 'hex');
            }
            // Octal number
            else if (ch == 'o') {
                stream.next();
                stream.eatWhile(/[0-7]/);
                return ret('number', 'octal');
            }
            // Hash symbol
            else {
                stream.eatWhile(/[-a-zA-Z]/);
                return ret('hash');
            }
        }
        else if (stream.match('end')) {
            return ret('end', 'keyword');
        }
        for (var name in patterns) {
            if (patterns.hasOwnProperty(name)) {
                var pattern = patterns[name];
                if ((pattern instanceof Array
                     && pattern.some(function (p) {
                         return stream.match(p);
                     })) || stream.match(pattern))
                    return ret(name, null, stream.current());
            }
        }
        if (stream.match("define"))
            return ret("definition")
        else if (stream.match(symbol))
            return ret("variable");
        else {
            stream.next();
            return ret("other");
        }
    }

    function tokenComment (stream, state) {
        var maybeEnd = false, ch;
        while ((ch = stream.next())) {
            if (ch == "/" && maybeEnd) {
                state.tokenize = tokenBase;
                break;
            }
            maybeEnd = (ch == "*");
        }
        return ret("comment");
    }

    function tokenString (quote, type) {
        return function (stream, state) {
            var next, end = false;
            while ((next = stream.next()) != null) {
                if (next == quote) {
                    end = true;
                    break;
                }
            }
            if (end)
                state.tokenize = tokenBase;
            return ret(type);
        };
    }

    // // Parser

    // // TODO: end: allow any in words['definition'].concat(words['statement'])

    // function Lexical (indented, column, type, align, prev, info) {
    //         this.indented = indented;
    //         this.column = column;
    //         this.type = type;
    //         this.prev = prev;
    //         this.info = info;
    //         if (align != null)
    //             this.align = align;
    // }

    // function parseDylan (state, style, type, content, stream) {
    //         var cc = state.cc;
    //         cx.state = state;
    //         cx.stream = stream;
    //         cx.marked = null,
    //         cx.cc = cc;

    //         if (!state.lexical.hasOwnProperty("align"))
    //             state.lexical.align = true;

    //         while (true) {
    //             var combinator = cc.length ? cc.pop() : expression;
    //             if (combinator(type, content)) {
    //                 while (cc.length && cc[cc.length - 1].lex)
    //                     cc.pop()();
    //                 if (cx.marked)
    //                     return cx.marked;
    //                 // if (type == "variable" && inScope(state, content))
    //                 //     return "js-localvariable";
    //                 return style;
    //             }
    //         }
    // }

    // var cx = {state: null,
    //               column: null,
    //               marked: null,
    //               cc: null};

    // function pass () {
    //         for (var i = arguments.length - 1; i >= 0; i--)
    //             cx.cc.push(arguments[i]);
    // }

    // function cont () {
    //         pass.apply(null, arguments);
    //         return true;
    // }

    // function pushcontext () {
    //         if (!cx.state.context)
    //             cx.state.localVars = defaultVars;
    //         cx.state.context = {prev: cx.state.context,
    //                             vars: cx.state.localVars};
    // }

    // function popcontext () {
    //         cx.state.localVars = cx.state.context.vars;
    //         cx.state.context = cx.state.context.prev;
    // }

    // function pushlex (type, info) {
    //         var result = function () {
    //             var state = cx.state;
    //             state.lexical =
    //                 new JSLexical(state.indented, cx.stream.column(),
    //                               type, null, state.lexical, info)
    //         };
    //         result.lex = true;
    //         return result;
    // }

    // function poplex() {
    //         var state = cx.state;
    //         if (state.lexical.prev) {
    //             if (state.lexical.type == ")")
    //                 state.indented = state.lexical.indented;
    //             state.lexical = state.lexical.prev;
    //         }
    // }
    // poplex.lex = true;

    // Interface
    return {
        startState: function (baseColumn) {
            return {tokenize: tokenBase};
//                    lexical: new Lexical((baseColumn || 0), 0, "block", false),
//                    cc: []};
        },
        token: function (stream, state) {
            if (stream.eatSpace())
                return null;
            var style = state.tokenize(stream, state);
            return style;  // parseDylan(state, style, type, content, stream);
        },
        indent: function (state, textAfter) {
            console.log(state, textAfter);
            if (state.tokenize != tokenBase)
                return 0;
            return 0;
        }
    }
});

CodeMirror.defineMIME("text/x-dylan", "dylan");
