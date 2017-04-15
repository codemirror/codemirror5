(function() {
    CodeMirror.defaults['autoEnabled'] = false;
    CodeMirror.defineExtension("autoFormat", function(cm, ch, indent) {
        if (!cm.getOption('autoEnabled')) {
            throw CodeMirror.Pass;
        }

        var mode = cm.getOption('mode');
        var pos = cm.getCursor();
        var tok = cm.getTokenAt(pos);
        var state = tok.state;
        var next = cm.getRange({line: pos.line, ch: pos.ch}, {line: pos.line, ch: pos.ch + 1});
        var prev = cm.getRange({line: pos.line, ch: pos.ch - 1}, {line: pos.line, ch: pos.ch});
        var is_selected = cm.somethingSelected();
        var selection, line, len;
        var info = cm.getTokenAt(pos);
        var infoPrev = cm.getTokenAt({line: pos.line - 1, ch: pos.ch});
        var infoNext = cm.getTokenAt({line: pos.line + 1, ch: pos.ch});
        if (ch == "(") {
            cm.replaceSelection('(');
            pos = {line: pos.line, ch: pos.ch + 1};
            cm.setCursor(pos);
            cm.replaceSelection(')');
            pos = {line: pos.line, ch: pos.ch};
            cm.setCursor(pos);
        } else if (ch == ")") {
            if (next == ")") {
                pos = {line: pos.line, ch: pos.ch + 1};
                cm.setCursor(pos);
            } else {
                cm.replaceSelection(')');
                pos = {line: pos.line, ch: pos.ch + 1};
                cm.setCursor(pos);
            }
        } else if (ch == "[") {
            cm.replaceSelection('[');
            pos = {line: pos.line, ch: pos.ch + 1};
            cm.setCursor(pos);
            cm.replaceSelection(']');
            pos = {line: pos.line, ch: pos.ch};
            cm.setCursor(pos);
        } else if (ch == "]") {
            if (next == "]") {
                pos = {line: pos.line, ch: pos.ch + 1};
                cm.setCursor(pos);
            } else {
                cm.replaceSelection(']');
                pos = {line: pos.line, ch: pos.ch + 1};
                cm.setCursor(pos);
            }
        } else if (ch == "'") {
            if (is_selected) {
                selection = cm.getSelection();
                selection = selection.replace(/^|$/g, "'");
                selection = selection.replace(/^'+|^"+|'+$|"+$/g, "'");
                cm.replaceSelection(selection);
            } else {
                if (next == "'") {
                    pos = {line: pos.line, ch: pos.ch + 1};
                    cm.setCursor(pos);
                } else {
                    cm.replaceSelection('\'');
                    pos = {line: pos.line, ch: pos.ch + 1};
                    cm.setCursor(pos);
                    cm.replaceSelection('\'');
                    pos = {line: pos.line, ch: pos.ch};
                    cm.setCursor(pos);
                }
            }
        } else if (ch == '"') {
            if (is_selected) {
                selection = cm.getSelection();
                selection = selection.replace(/^|$/g, '"');
                selection = selection.replace(/^'|^"|'$|"$/g, '"');
                cm.replaceSelection(selection);
            } else {
                if (next == '"') {
                    pos = {line: pos.line, ch: pos.ch + 1};
                    cm.setCursor(pos);
                } else {
                    cm.replaceSelection('"');
                    pos = {line: pos.line, ch: pos.ch + 1};
                    cm.setCursor(pos);
                    cm.replaceSelection('"');
                    pos = {line: pos.line, ch: pos.ch};
                    cm.setCursor(pos);
                }
            }
        } else if (ch == "{") {
            cm.replaceSelection('{');
            if (!mode.match(/html|text/)) {
                pos = {line: pos.line, ch: pos.ch + 1};
                cm.setCursor(pos);
                cm.replaceSelection("\n\t\n}");
                pos = {line: pos.line + 1, ch: pos.ch + 2};
            } else {
                pos = {line: pos.line, ch: pos.ch + 1};
                cm.setCursor(pos);
                cm.replaceSelection("}");
            }
            cm.setCursor(pos);
            cm.indentLine(pos.line + 1);
        } else if (ch == 12) {
            if (is_selected) {
                cm.replaceSelection("");
            } else if ((prev == '"' && next == '"') || (prev == "'" && next == "'") || (prev == "(" && next == ")") || (prev == "{" && next == "}") || (prev == "[" && next == "]")) {
                cm.replaceRange("", {line: pos.line, ch: pos.ch}, {line: pos.line, ch: pos.ch + 1});
                cm.replaceRange("", {line: pos.line, ch: pos.ch - 1}, {line: pos.line, ch: pos.ch});
            } else {
                if (pos.ch == 0) {
                    len = cm.getLine(pos.line - 1).length;
                    cm.replaceRange("", {line: pos.line - 1, ch: len}, {line: pos.line, ch: pos.ch});
                } else {
                    cm.replaceRange("", {line: pos.line, ch: pos.ch - 1}, {line: pos.line, ch: pos.ch});
                }
            }
        } else if (ch == 13) {
            cm.replaceSelection("\n");
            pos = {line: pos.line + 1, ch: 0};
            cm.setCursor(pos);
            cm.indentLine(pos.line);
            return true;
        } else if (ch == "CtrlShiftDown") {
            line = cm.getLine(pos.line);
            pos = {line: pos.line, ch: line.length};
            cm.setCursor(pos);
            cm.replaceSelection("\n");
            cm.setLine(pos.line + 1, line);
            pos = {line: pos.line + 1, ch: line.length};
            cm.setCursor(pos);
        } else if (ch == "CtrlD") {
            cm.removeLine(pos.line);
            pos = {line: pos.line, ch: 0};
            cm.setCursor(pos);
        } else if (ch == "CtrlUp") {
            line = cm.getLine(pos.line);
            cm.removeLine(pos.line);
            pos = {line: pos.line - 1, ch: 0};
            cm.setCursor(pos);
            cm.replaceSelection(line + "\n");
            cm.setCursor(pos);
        } else if (ch == "CtrlDown") {
            line = cm.getLine(pos.line);
            cm.removeLine(pos.line);
            pos = {line: pos.line + 1, ch: 0};
            cm.setCursor(pos);
            cm.replaceSelection(line + "\n");
            cm.setCursor(pos);
        }
    });
    CodeMirror.defineExtension("format", function(cm, action) {
        if (!cm.getOption('autoEnabled')) {
            throw CodeMirror.Pass;
        }
        CodeMirror.defaults['closeTagIndent'] = ['applet', 'blockquote', 'body', 'button', 'div', 'dl', 'fieldset', 'form', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'html', 'iframe', 'layer', 'legend', 'object', 'ol', 'p', 'select', 'table', 'ul'];
        var mode = cm.getOption('mode');
        var pos = cm.getCursor();
        var tok = cm.getTokenAt(pos);
        var state = tok.state;
        var next = cm.getRange({line: pos.line, ch: pos.ch}, {line: pos.line, ch: pos.ch + 1});
        var lines, selection;
        if (action == "prettyPrint") {
            var code = cm.getValue();
            code = code.replace(/\t+/g, "");
            if (mode.match(/html/)) {
                var def = CodeMirror.defaults['closeTagIndent'];
                var pattern;
                for (i in def) {
                    pattern = new RegExp('<' + def[i] + '>', 'g');
                    code = code.replace(pattern, "\n<" + def[i] + ">\n");

                    pattern = new RegExp('<' + def[i] + '(.+?)>', 'g');
                    code = code.replace(pattern, "\n<" + def[i] + "$1>\n");

                    pattern = new RegExp('</' + def[i] + '>', 'g');
                    code = code.replace(pattern, "\n</" + def[i] + ">\n");
                }
            } else {
                code = code.replace(/{/g, "{\n");
                code = code.replace(/}/g, "\n}\n");
                code = code.replace(/;/g, ";\n");
                code = code.replace(/\*\//g, "*/\n");
                code = code.replace(/\<\?php/g, "<?php\n");
                code = code.replace(/<\?(?!php)/g, "<?php\n");
                code = code.replace(/\n/g, "\n");
                //code = code.replace(/\s\s+\/\*+/g, "\n/*");
                code = code.replace(/,(\s\s+)/g, ",\n$1");
            }
            code = code.replace(/\n+/g, "\n");
            code = code.replace(/\n$/g, "");
            code = code.replace(/^\n/g, "");
            cm.setValue(code);
            lines = cm.lineCount();
            for (var i = 0; i < lines; i++) {
                cm.indentLine(i);
            }
            code = cm.getValue();
            code = code.replace(/\s\s+\/\*/g, "\n/*");
            cm.setValue(code);
        } else if (action == "commUncomm") {
            selection = cm.getSelection();
            var newSelect = "";
            lines = selection.split("\n");
            var dothis = "comment"
            if (lines[0].match(/^\/\//)) {
                dothis = "uncomment";
            }
            for (var i in lines) {
                if (dothis == "uncomment") {
                    newSelect += lines[i].replace(/^\/\//, "") + "\n";
                } else {
                    if (!lines[i].match(/^\/\//)) {
                        newSelect += "//" + lines[i] + "\n";
                    } else {
                        newSelect += lines[i] + "\n";
                    }
                }
            }
            newSelect = newSelect.replace(/\n$/, "");
            cm.replaceSelection(newSelect);
        } else if (action == "toUpper") {
            selection = cm.getSelection().toUpperCase();
            cm.replaceSelection(selection);
        } else if (action == "toLower") {
            selection = cm.getSelection().toLowerCase();
            cm.replaceSelection(selection);
        }
        function inArray(needle, haystack) {
            var length = haystack.length;
            for (var i = 0; i < length; i++) {
                if (haystack[i] == needle)
                    return true;
            }
            return false;
        }
    });
})();
