// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("../../lib/codemirror"), require("../xml/xml"), require("../clike/clike"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["../../lib/codemirror"], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function(CodeMirror) {
    "use strict";
    
    CodeMirror.defineMode("jsp", function(config, parserConfig) {
        var htmlMode = CodeMirror.getMode(config, {name: "xml",
                                                  htmlMode: true,
                                                  multilineTagIndentFactor: parserConfig.multilineTagIndentFactor,
                                                  multilineTagIndentPastTag: parserConfig.multilineTagIndentPastTag});
        var javaMode = CodeMirror.getMode(config, "clike");
        /*
        The character sequence '<%' indicated the start of a section that should
        be parsed as Java. 
        The character sequence '%>' ends the Java sections and signals the return
        to HTML standards.
        */
        
        function html(stream, state) {
            var style = htmlMode.token(stream, state.htmlState);
            if (stream.match("<%", false)) {
                state.token = java;
                state.localMode = javaMode;
                state.localState = javaMode.startState(htmlMode.indent(state.htmlState, ""));
            }
            return style;
        }
        
        function java(stream, state) {
            if (stream.match("%>", false)) {
                state.token = html;
                state.localMode = null;
                state.localState = null;
                return null;
            }
            return maybeBackup(stream, /%>/,
                       state.localMode.token(stream, state.localState));
        }
        
        function maybeBackup(stream, pat, style) {
            var cur = stream.current();
            var close = cur.search(pat), m;
            if (close > -1) {
                stream.backUp(cur.length - close);
            }
            else if (m = cur.match(/<\/?$/)) {
                stream.backUp(cur.length);
                if (!stream.match(pat, false)) stream.match(cur);
            }
            return style;
        }
                       
        return {
            startState: function() {
                var state = htmlMode.startState();
                return {token: html, localMode: null, localState: null, htmlState: state};
            },
                          
            copyState: function(state) {
                if (state.localState)
                    var local = CodeMirror.copyState(state.localMode, state.localState);
                return {token: state.token, localMode: state.localMode, localState: local, htmlState: CodeMirror.copyState(htmlMode, state.htmlState)};
            },
                          
            token: function(stream, state) {
                return state.token(stream, state);
            },
    
            innerMode: function(state) {
                return {state: state.localState || state.htmlState, mode: state.localMode || htmlMode};
            }
        };
    
    });
    
    CodeMirror.defineMIME("text/x-jsp", "jsp");
});