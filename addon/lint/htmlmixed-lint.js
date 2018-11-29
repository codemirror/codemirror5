// CodeMirror, copyright (c) by Marijn Haverbeke and others,
// Initial htmlmixed-lint.js from István Király, https://github.com/LaKing
// Distributed under an MIT license: https://codemirror.net/LICENSE

// Depends on htmlhint jshint and csshint

(function(mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("../../lib/codemirror"), require("htmlhint"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["../../lib/codemirror", "htmlhint"], mod);
    else // Plain browser env
        mod(CodeMirror, window.HTMLHint);
})(function(CodeMirror, HTMLHint) {
    "use strict";

    var defaultRules = {
        "tagname-lowercase": true,
        "attr-lowercase": true,
        "attr-value-double-quotes": true,
        "doctype-first": false,
        "tag-pair": true,
        "spec-char-escape": true,
        "id-unique": true,
        "src-not-empty": true,
        "attr-no-duplication": true
    };

    CodeMirror.registerHelper("lint", "html", function(text, options) {

        // dependency verification
        // htmllint
        var found = [];
        if (HTMLHint && !HTMLHint.verify) HTMLHint = HTMLHint.HTMLHint;
        if (!HTMLHint) HTMLHint = window.HTMLHint;
        if (!HTMLHint) {
            if (window.console) {
                window.console.error("Error: window.HTMLHint not found, CodeMirror HTML mixed linting cannot run.");
            }
            return found;
        }
        //  csslint
        if (!window.CSSLint) {
            if (window.console) {
                window.console.error("Error: window.CSSLint not defined, CodeMirror HTML mixed linting cannot run.");
            }
            return found;
        }
        // jshint
        if (!window.JSHINT) {
            if (window.console) {
                window.console.error("Error: window.JSHINT not defined, CodeMirror HTML mixed linting cannot run.");
            }
            return [];
        }
        if (!options.indent) // JSHint error.character actually is a column index, this fixes underlining on lines using tabs for indentation
            options.indent = 1; // JSHint default value is 4

        // external linters may modify the options object, so for example CSSLinter adds options.errors, but then JSLint complains that it is not a valid option
        // let us add an additional layer in case we want to define linter-specific option via options, otherwise take clones of the defualt options object
        var CSSoptions = options.css || JSON.parse(JSON.stringify(options));
        var JSoptions = options.js || JSON.parse(JSON.stringify(options));
        var HTMLoptions = options.html || JSON.parse(JSON.stringify(options));

 
        // our JS error parser is extended with the offset argument
        function parseErrors(errors, output, offset) {
            for (var i = 0; i < errors.length; i++) {
                var error = errors[i];
                if (error) {
                    if (error.line <= 0) {
                        if (window.console) {
                            window.console.warn("Cannot display JSHint error (invalid line " + error.line + ")", error);
                        }
                        continue;
                    }

                    var start = error.character - 1,
                        end = start + 1;
                    if (error.evidence) {
                        var index = error.evidence.substring(start).search(/.\b/);
                        if (index > -1) {
                            end += index;
                        }
                    }

                    var line = error.line - 1 + offset - 1;
                    // Convert to format expected by validation service
                    var hint = {
                        message: error.reason,
                        severity: error.code ? (error.code.startsWith('W') ? "warning" : "error") : "error",
                        from: CodeMirror.Pos(line, start),
                        to: CodeMirror.Pos(line, end)
                    };

                    output.push(hint);
                }
            }
        }

        function newlines(str) {
            return str.split('\n').length;
        }

        function processHTML(text, options, found) {
            var messages = HTMLHint.verify(text, options && options.rules || defaultRules);
            for (var i = 0; i < messages.length; i++) {
                var message = messages[i];
                var startLine = message.line - 1,
                    endLine = message.line - 1,
                    startCol = message.col - 1,
                    endCol = message.col;
                found.push({
                    from: CodeMirror.Pos(startLine, startCol),
                    to: CodeMirror.Pos(endLine, endCol),
                    message: message.message,
                    severity: message.type
                });
            }
        }

        processHTML(text, HTMLoptions, found);

        function processCSS(text, options, found) {
            var blocks = text.split(/<style[\s\S]*?>|<\/style>/gi);
            for (var j = 1; j < blocks.length; j += 2) {
                var offset = newlines(blocks.slice(0, j).join());
                var results = CSSLint.verify(blocks[j], options);
                var messages = results.messages;
                var message = null;
                for (var i = 0; i < messages.length; i++) {
                    message = messages[i];
                    var startLine = offset - 1 + message.line - 1,
                        endLine = offset - 1 + message.line - 1,
                        startCol = message.col - 1,
                        endCol = message.col;
                    found.push({
                        from: CodeMirror.Pos(startLine, startCol),
                        to: CodeMirror.Pos(endLine, endCol),
                        message: message.message,
                        severity: message.type
                    });
                }
            }
        }

        processCSS(text, CSSoptions, found);

        function processJS(text, options, found) {
            var blocks = text.split(/<script[\s\S]*?>|<\/script>/gi);
            for (var j = 1; j < blocks.length; j += 2) {
                if (blocks[j].length>1) {
                    JSHINT(blocks[j], options, options.globals);
                    var errors = JSHINT.data().errors;
                    if (errors) parseErrors(errors, found, newlines(blocks.slice(0, j).join()));
                }
            }
        }

        processJS(text, JSoptions, found);


        console.log("end", found);

        return found;
    });
});