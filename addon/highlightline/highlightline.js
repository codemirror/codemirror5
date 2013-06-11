CodeMirror.defineOption("highlightLine", false, function (cm, val, prev) {
    if (prev == CodeMirror.Init) prev = false;
    if (prev && !val) {

    } else if (!prev && val) {
        cm.on("cursorActivity", function () {
            //current cursor line
            var line = cm.getCursor().line;
            var lastLine = cm.state.currLine ? cm.state.currLine : 0;
            //add class for current line
            cm.addLineClass(line, "wrap", "line-cursor");
            //remove line class for last cursor line
            if (line != lastLine) {
                cm.removeLineClass(lastLine, "wrap", "highlight-line");
            }
            //save current line for next usage
            cm.state.currLine = line;
        });

    }
});