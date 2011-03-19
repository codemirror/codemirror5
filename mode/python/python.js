CodeMirror.defineMode("python", function() {

    function wordRegexp(words) {
        return new RegExp("^(?:" + words.join("|") + ")$");
    }

    var identifierStarters = /[_A-Za-z]/;
    var wordOperators = wordRegexp(['and', 'or', 'not', 'is', 'in']);
    var commonKeywords = ['as', 'assert', 'break', 'class', 'continue',
                          'def', 'del', 'elif', 'else', 'except', 'finally',
                          'for', 'from', 'global', 'if', 'import',
                          'lambda', 'pass', 'raise', 'return',
                          'try', 'while', 'with', 'yield'];
    var commonTypes = ['bool', 'classmethod', 'complex', 'dict', 'enumerate',
                       'float', 'frozenset', 'int', 'list', 'object',
                       'property', 'reversed', 'set', 'slice', 'staticmethod',
                       'str', 'super', 'tuple', 'type'];
    var py2 = {'types': ['basestring', 'buffer', 'file', 'long', 'unicode',
                         'xrange'],
               'keywords': ['exec', 'print'],
               'version': 2 };
    var py3 = {'types': ['bytearray', 'bytes', 'filter', 'map', 'memoryview',
                         'open', 'range', 'zip'],
               'keywords': ['nonlocal'],
               'version': 3};

    return {
        startState: function() {
            return {
              context: 'normal',
              stringMarker: /"/,
              stringMarkerInverse: /[^"]/
          };
        },
        token: function(stream, state) {
            var ch = stream.next();

            if (state.context == 'normal') {
                if (ch == "#") { /* Detect comments. */
                    stream.skipToEnd();
                    return "py-comment";

                } else if (ch == "@") { /* Detect decorators. */
                    if (stream.peek().match(/\w/)) {
                        stream.skipToEnd();
                        return "py-decorator";
                    }

                } else if ((ch == "'") || (ch == '"')) {  /* Detect strings. */
                    if (ch == "'") {
                        state.stringMarker = /'/;
                        state.stringMarkerInverse = /[^']/;
                    } else {
                        state.stringMarker = /"/;
                        state.stringMarkerInverse = /[^"]/;
                    }
                    stream.eatWhile(state.stringMarker);
                    if (stream.current().length >= 3) {
                        state.context = 'string';
                    }
                    stream.eatWhile(state.stringMarkerInverse)
                    stream.next();
                    return "py-string";

                } else if (ch.match(/[\d.]/)) { /* Detect numbers. */
                    stream.eatWhile(/[\d\.abcdefox]/);
                    return "py-number";

                } else if (ch.match(/\w/)) { /* Detect keywords and types. */
                    stream.eatWhile(/\w/);
                    if (stream.current().match(wordRegexp(commonKeywords))) {
                        return "py-keyword";
                    } else if (stream.current().match(wordRegexp(commonTypes))) {
                        return "py-type";
                    }
                }
            } else { /* We are in a multi-line string */
                stream.eatWhile(state.stringMarkerInverse); /* Eat the rest of the string. */
                numQuoted = stream.current().length;
                stream.eatWhile(state.stringMarker); /* Eat the closing quotes if they exist. */
                if (stream.current().length - numQuoted >= 3) {
                    state.context = 'normal';
                }
                return "py-string";
            }
        }
    };
});

CodeMirror.defineMIME("text/x-python", "python");
