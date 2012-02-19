CodeMirror.defineMode('rst', function(config, options) {
    function setState(state, fn, ctx) {
        state.fn = fn;
        setCtx(state, ctx);
    }

    function setCtx(state, ctx) {
        state.ctx = ctx || {};
    }

    function setNormal(state, ch) {
        if (ch && (typeof ch !== 'string')) {
            var str = ch.current();
            ch = str[str.length-1];
        }

        setState(state, normal, {back: ch});
    }

    function hasMode(mode) {
        if (mode) {
            var modes = CodeMirror.listModes();

            for (var i in modes) {
                if (modes[i] == mode) {
                    return true;
                }
            }
        }

        return false;
    }

    function getMode(mode) {
        if (hasMode(mode)) {
            return CodeMirror.getMode(config, mode);
        } else {
            return null;
        }
    }

    var verbatimMode = getMode(options.verbatim);
    var pythonMode = getMode('python');

    var reSection = /^[!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]/;
    var reDirective = /^\s*\w([-:.\w]*\w)?::(\s|$)/;
    var reHyperlink = /^\s*_[\w-]+:(\s|$)/;
    var reFootnote = /^\s*\[(\d+|#)\](\s|$)/;
    var reCitation = /^\s*\[[A-Za-z][\w-]*\](\s|$)/;
    var reFootnoteRef = /^\[(\d+|#)\]_/;
    var reCitationRef = /^\[[A-Za-z][\w-]*\]_/;
    var reDirectiveMarker = /^\.\.(\s|$)/;
    var reVerbatimMarker = /^::\s*$/;
    var rePreInline = /^[-\s"([{</:]/;
    var rePostInline = /^[-\s`'")\]}>/:.,;!?\\_]/;
    var reEnumeratedList = /^\s*((\d+|[A-Za-z#])[.)]|\((\d+|[A-Z-a-z#])\))\s/;
    var reBulletedList = /^\s*[-\+\*]\s/;
    var reExamples = /^\s+(>>>|In \[\d+\]:)\s/;

    function normal(stream, state) {
        var ch, sol, i;

        if (stream.eat(/\\/)) {
            ch = stream.next();
            setNormal(state, ch);
            return null;
        }

        sol = stream.sol();

        if (sol && (ch = stream.eat(reSection))) {
            for (i = 0; stream.eat(ch); i++);

            if (i >= 3 && stream.match(/^\s*$/)) {
                setNormal(state, null);
                return 'header';
            } else {
                stream.backUp(i + 1);
            }
        }

        if (sol && stream.match(reDirectiveMarker)) {
            if (!stream.eol()) {
                setState(state, directive);
            }
            return 'meta';
        }

        if (stream.match(reVerbatimMarker)) {
            if (!verbatimMode) {
                setState(state, verbatim);
            } else {
                var mode = verbatimMode;

                setState(state, verbatim, {
                    mode: mode,
                    local: mode.startState()
                });
            }
            return 'meta';
        }

        if (sol && stream.match(reExamples, false)) {
            if (!pythonMode) {
                setState(state, verbatim);
                return 'meta';
            } else {
                var mode = pythonMode;

                setState(state, verbatim, {
                    mode: mode,
                    local: mode.startState()
                });

                return null;
            }
        }

        function testBackward(re) {
            return sol || !state.ctx.back || re.test(state.ctx.back);
        }

        function testForward(re) {
            return stream.eol() || stream.match(re, false);
        }

        function testInline(re) {
            return stream.match(re) && testBackward(/\W/) && testForward(/\W/);
        }

        if (testInline(reFootnoteRef)) {
            setNormal(state, stream);
            return 'footnote';
        }

        if (testInline(reCitationRef)) {
            setNormal(state, stream);
            return 'citation';
        }

        ch = stream.next();

        if (testBackward(rePreInline)) {
            if ((ch === ':' || ch === '|') && stream.eat(/\S/)) {
                var token;

                if (ch === ':') {
                    token = 'builtin';
                } else {
                    token = 'atom';
                }

                setState(state, inline, {
                    ch: ch,
                    wide: false,
                    prev: null,
                    token: token
                });

                return token;
            }

            if (ch === '*' || ch === '`') {
                var orig = ch,
                    wide = false;

                ch = stream.next();

                if (ch == orig) {
                    wide = true;
                    ch = stream.next();
                }

                if (ch && !/\s/.test(ch)) {
                    var token;

                    if (orig === '*') {
                        token = wide ? 'strong' : 'em';
                    } else {
                        token = wide ? 'string' : 'string-2';
                    }

                    setState(state, inline, {
                        ch: orig,               // inline() has to know what to search for
                        wide: wide,             // are we looking for `ch` or `chch`
                        prev: null,             // terminator must not be preceeded with whitespace
                        token: token            // I don't want to recompute this all the time
                    });

                    return token;
                }
            }
        }

        setNormal(state, ch);
        return null;
    }

    function inline(stream, state) {
        var ch = stream.next(),
            token = state.ctx.token;

        function finish(ch) {
            state.ctx.prev = ch;
            return token;
        }

        if (ch != state.ctx.ch) {
            return finish(ch);
        }

        if (/\s/.test(state.ctx.prev)) {
            return finish(ch);
        }

        if (state.ctx.wide) {
            ch = stream.next();

            if (ch != state.ctx.ch) {
                return finish(ch);
            }
        }

        if (!stream.eol() && !rePostInline.test(stream.peek())) {
            if (state.ctx.wide) {
                stream.backUp(1);
            }

            return finish(ch);
        }

        setState(state, normal);
        setNormal(state, ch);

        return token;
    }

    function directive(stream, state) {
        var token = null;

        if (stream.match(reDirective)) {
            token = 'attribute';
        } else if (stream.match(reHyperlink)) {
            token = 'link';
        } else if (stream.match(reFootnote)) {
            token = 'quote';
        } else if (stream.match(reCitation)) {
            token = 'quote';
        } else {
            stream.eatSpace();

            if (stream.eol()) {
                setNormal(state, stream);
                return null;
            } else {
                stream.skipToEnd();
                setState(state, comment);
                return 'comment';
            }
        }

        // FIXME this is unreachable
        setState(state, body, {start: true});
        return token;
    }

    function body(stream, state) {
        var token = 'body';

        if (!state.ctx.start || stream.sol()) {
            return block(stream, state, token);
        }

        stream.skipToEnd();
        setCtx(state);

        return token;
    }

    function comment(stream, state) {
        return block(stream, state, 'comment');
    }

    function verbatim(stream, state) {
        if (!verbatimMode) {
            return block(stream, state, 'meta');
        } else {
            if (stream.sol()) {
                if (!stream.eatSpace()) {
                    setNormal(state, stream);
                }

                return null;
            }

            return verbatimMode.token(stream, state.ctx.local);
        }
    }

    function block(stream, state, token) {
        if (stream.eol() || stream.eatSpace()) {
            stream.skipToEnd();
            return token;
        } else {
            setNormal(state, stream);
            return null;
        }
    }

    return {
        startState: function() {
            return {fn: normal, ctx: {}};
        },

        copyState: function(state) {
            return {fn: state.fn, ctx: state.ctx};
        },

        token: function(stream, state) {
            var token = state.fn(stream, state);
            return token;
        }
    };
});

CodeMirror.defineMIME("text/x-rst", "rst");
