// code based on python-hint.js
(function (mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("../../lib/codemirror"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["../../lib/codemirror"], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function (CodeMirror) {
    "use strict";

    var currentModeKeywords = null;
    var currentModeBuiltins = null;

    function forEach(arr, f) {
        for (var i = 0, e = arr.length; i < e; ++i) f(arr[i]);
    }

    function arrayContains(arr, item) {
        if (!Array.prototype.indexOf) {
            var i = arr.length;
            while (i--) {
                if (arr[i] === item) {
                    return true;
                }
            }
            return false;
        }
        return arr.indexOf(item) != -1;
    }

    function scriptHint(editor, _keywords, getToken) {

        var cur = editor.getCursor(), token = getToken(editor, cur), tprop = token;

        if (!context) var context = [];
        context.push(tprop);

        var completionList = getCompletions(token, context);
        completionList = completionList.sort();

        return {
            list: completionList,
            from: CodeMirror.Pos(cur.line, token.start),
            to: CodeMirror.Pos(cur.line, token.end)
        };
    }

    function getCompletions(token, context) {
        var found = [], start = token.string;
        function maybeAdd(str) {
            if (str.lastIndexOf(start, 0) == 0 && !arrayContains(found, str)) found.push(str);
        }

        function gatherCompletions(_obj) {
            forEach(currentModeBuiltins, maybeAdd);
            forEach(currentModeKeywords, maybeAdd);
        }

        if (context) {
            // If this is a property, see if it belongs to some object we can
            // find in the current environment.
            var obj = context.pop(), base;

            if (obj.type == "variable")
                base = obj.string;
            else if (obj.type == "variable-3")
                base = ":" + obj.string;

            while (base != null && context.length)
                base = base[context.pop().string];
            if (base != null) gatherCompletions(base);
        }
        return found;
    }

    function currentModeHint(editor) {
        if (currentModeKeywords === null) {
            currentModeKeywords = new Array();
            currentModeBuiltins = new Array();
            var mode = editor.getOption("mode");
            for (var propertyName in CodeMirror.mimeModes[mode].keywords) {
                currentModeKeywords.push(propertyName);
            }
            for (var propertyName in CodeMirror.mimeModes[mode].blockKeywords) {
                currentModeKeywords.push(propertyName);
            }
            for (var propertyName in CodeMirror.mimeModes[mode].atoms) {
                currentModeKeywords.push(propertyName);
            }
            for (var propertyName in CodeMirror.mimeModes[mode].builtin) {
                currentModeKeywords.push(propertyName);
            }
        }
        return scriptHint(editor, currentModeKeywords, function (e, cur) { return e.getTokenAt(cur); });
    }

    CodeMirror.registerGlobalHelper("hint", "currentmode", function (mode) { return mode.blockCommentStart && mode.blockCommentEnd; }, currentModeHint);
});
