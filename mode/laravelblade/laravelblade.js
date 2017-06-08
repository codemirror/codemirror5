(function (mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("../php/php"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["../php/php"], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function (CodeMirror) {
    'use strict';

    CodeMirror.defineMode("laravelblade", function (config, parserConfig) {
        var laravelbladeOverlay = {
            startState: function () {
                return {
                    inComment: false,
                    inEcho: false,
                    awaitProperty: false,
                    keyword: false,
                    openingTag: null
                }
            },
            token: function (stream, state) {
                if (stream.match("{{--") || state.inComment) {
                    state.inComment = true;
                    if (stream.skipTo("--}}")) {
                        stream.match("--}}");
                        state.inComment = false;
                    } else {
                        stream.skipToEnd();
                    }
                    return "comment";
                }
                if (stream.match("{{{") || stream.match("{{")) {
                    state.inEcho = true;
                    state.openingTag = stream.current();
                    return "meta";
                }
                if (!state.inEcho && stream.match(/@[a-zA-Z_][a-zA-Z0-9_]*/)) {
                    state.keyword = true;
                    return "keyword";
                }
                if (state.keyword) {
                    if (stream.match('(')) {
                        state.inEcho = true;
                        return null;
                    }
                    if (stream.match(')')) {
                        state.keyword = false;
                        state.inEcho = false;
                        return null;
                    }
                    if (!state.inEcho) {
                        state.keyword = false;
                    }
                }
                if (state.inEcho) {
                    if (stream.match(/'[^']*'/)) {
                        return "string";
                    }
                    if (stream.match(/"[^"]*"/)) {
                        return "string";
                    }
                    if (stream.match(/\$[a-zA-Z_][a-zA-Z0-9_]*/)) {
                        return "variable-2";
                    }
                    if (state.awaitProperty && stream.match(/[a-zA-Z_][a-zA-Z0-9_]*/)) {
                        state.awaitProperty = false;
                        return "variable";
                    }
                    if (stream.match(/\-\>[a-zA-Z_][a-zA-Z0-9_]*/, false)) {
                        state.awaitProperty = true;
                        stream.match('->');
                        return "operator";
                    }
                    if (stream.match(/[+\-*&%=<>!?|^~:\/]/)) {
                        return "operator";
                    }
                    if (stream.match(/\w/)) {
                        return "keyword";
                    }
                    switch (state.openingTag) {
                        case '{{':
                            if (stream.match("}}")) {
                                state.inEcho = false;
                                state.openingTag = null;
                                return "meta";
                            }
                            break;
                        case '{{{':
                            if (stream.match("}}}")) {
                                state.inEcho = false;
                                state.openingTag = null;
                                return "meta";
                            }
                            break;
                        default:
                            break;
                    }
                }
                stream.next();
                return null;
            }
        };
        return CodeMirror.overlayMode(CodeMirror.getMode(config, parserConfig.backdrop || "php"), laravelbladeOverlay);
    });
});
