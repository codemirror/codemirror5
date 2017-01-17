// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// This module is based on code by William Stein, 2016,
// licensed under a 2-clause BSD license:
// https://github.com/williamstein/smcbsd/blob/09dbcc74c0ec5a865f654f8cadaa5e88c0bc51a6/src/smc-webapp/misc_page.coffee#L531

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  function get_latex_environ(s) {
    var i, j;
    i = s.indexOf('{');
    j = s.indexOf('}');
    if (i !== -1 && j !== -1) {
      return s.slice(i + 1, j).trim();
    } else {
      return null;
    }
  }

  function startswith(s, x) {
    if (typeof x === "string") {
      return s.indexOf(x) === 0;
    } else {
      for (var i = 0; i < x.length; i++) {
        if (s.indexOf(x[i]) === 0) {
          return true;
        }
      }
      return false;
    }
  }

  CodeMirror.registerHelper("fold", "stex", function(cm, start) {
    var line = cm.getLine(start.line).trimLeft();
    function find_close() {
      var BEGIN = "\\begin";
      if (startswith(line, BEGIN)) {
        // \begin{foo}
        // ...
        // \end{foo}
        // find environment close
        var environ = get_latex_environ(line.slice(BEGIN.length));
        if (environ == null) {
          return [null, null];
        }
        var END = "\\end";
        var level = 0;
        var begin = new RegExp("\\\\begin\\s*{" + environ + "}");
        var end = new RegExp("\\\\end\\s*{" + environ + "}");
        for (var i = start.line; i <= cm.lastLine(); i++) {
          var cur = cm.getLine(i);
          var m = cur.search(begin);
          var j = cur.search(end);
          if (m !== -1 && (j === -1 || m < j)) {
            level += 1;
          }
          if (j !== -1) {
            level -= 1;
            if (level === 0) {
              return [i, j + END.length - 1];
            }
          }
        }
      } else if (startswith(line, "\\[")) {
        for (var i = start.line+1; i <= cm.lastLine(); i++) {
          if (startswith(cm.getLine(i).trimLeft(), "\\]")) {
            return [i, 0];
          }
        }
      } else if (startswith(line, "\\(")) {
        for (var i = start.line+1; i <= cm.lastLine(); i++) {
          if (startswith(cm.getLine(i).trimLeft(), "\\)")) {
            return [i, 0];
          }
        }
      } else if (startswith(line, "\\documentclass")) {
        // pre-amble
        for (var i = start.line+1; i <= cm.lastLine(); i++) {
          if (startswith(cm.getLine(i).trimLeft(), "\\begin{document}")) {
            return [i - 1, 0];
          }
        }
      } else if (startswith(line, "\\chapter")) {
        // book chapter
        for (var i = start.line+1; i <= cm.lastLine(); i++) {
          if (startswith(cm.getLine(i).trimLeft(), ["\\chapter", "\\end{document}"])) {
            return [i - 1, 0];
          }
        }
        return cm.lastLine();
      } else if (startswith(line, "\\section")) {
        // article section
        for (var i = start.line+1; i <= cm.lastLine(); i++) {
          if (startswith(cm.getLine(i).trimLeft(), ["\\chapter", "\\section", "\\end{document}"])) {
            return [i - 1, 0];
          }
        }
        return cm.lastLine();
      } else if (startswith(line, "\\subsection")) {
        // article subsection
        for (var i = start.line+1; i <= cm.lastLine(); i++) {
          if (startswith(cm.getLine(i).trimLeft(), ["\\chapter", "\\section", "\\subsection", "\\end{document}"])) {
            return [i - 1, 0];
          }
        }
        return cm.lastLine();
      } else if (startswith(line, "\\subsubsection")) {
        // article subsubsection
        for (var i = start.line+1; i <= cm.lastLine(); i++) {
          if (startswith(cm.getLine(i).trimLeft(), ["\\chapter", "\\section", "\\subsection", "\\subsubsection", "\\end{document}"])) {
            return [i - 1, 0];
          }
        }
        return cm.lastLine();
      } else if (startswith(line, "\\subsubsubsection")) {
        // article subsubsubsection
        for (var i = start.line+1; i <= cm.lastLine(); i++) {
          if (startswith(cm.getLine(i).trimLeft(), ["\\chapter", "\\section", "\\subsection", "\\subsubsection", "\\subsubsubsection", "\\end{document}"])) {
            return [i - 1, 0];
          }
        }
        return cm.lastLine();
      } else if (startswith(line, "%\\begin{}")) {
        // support what texmaker supports for custom folding -- http://tex.stackexchange.com/questions/44022/code-folding-in-latex
        for (var i = start.line+1; i <= cm.lastLine(); i++) {
          if (startswith(cm.getLine(i).trimLeft(), "%\\end{}")) {
            return [i, 0];
          }
        }
      }
      return [null, null];  // no folding here...
    };

    var close = find_close(), i = close[0], j = close[1];
    if (i != null) {
      line = cm.getLine(start.line);
      var k = line.indexOf("}");
      if (k === -1) {
        k = line.length;
      }
      return {
        from: CodeMirror.Pos(start.line, k + 1),
        to: CodeMirror.Pos(i, j)
      };
    } else {
      // nothing to fold
      return null;
    }
  });
});
