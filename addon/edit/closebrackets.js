(function() {
  var DEFAULT_BRACKETS = "()[]{}''\"\"";
  var DEFAULT_EXPLODE_ON_ENTER = "[]{}";
  var SPACE_CHAR_REGEX = /\s/;

  CodeMirror.defineOption("autoCloseBrackets", false, function(cm, val, old) {
    if (old != CodeMirror.Init && old)
      cm.removeKeyMap("autoCloseBrackets");
    if (!val) return;
    var pairs = DEFAULT_BRACKETS, explode = DEFAULT_EXPLODE_ON_ENTER;
    if (typeof val == "string") pairs = val;
    else if (typeof val == "object") {
      if (val.pairs != null) pairs = val.pairs;
      if (val.explode != null) explode = val.explode;
    }
    var map = buildKeymap(pairs);
    if (explode) map.Enter = buildExplodeHandler(explode);
    cm.addKeyMap(map);
  });

  function charsAround(cm, pos) {
    var str = cm.getRange(CodeMirror.Pos(pos.line, pos.ch - 1),
                          CodeMirror.Pos(pos.line, pos.ch + 1));
    return str.length == 2 ? str : null;
  }

  function buildKeymap(pairs) {
    var map = {
      name : "autoCloseBrackets",
      Backspace: function(cm) {
        return cm.withSelection(function(sel) {
          if (sel.somethingSelected()) return CodeMirror.Pass;
          var cur = sel.find(), around = charsAround(cm, cur);
          if (around && pairs.indexOf(around) % 2 == 0)
            cm.replaceRange("", CodeMirror.Pos(cur.line, cur.ch - 1), CodeMirror.Pos(cur.line, cur.ch + 1));
          else
            return CodeMirror.Pass;
        });
      }
    };
    var closingBrackets = "";
    for (var i = 0; i < pairs.length; i += 2) (function(left, right) {
      if (left != right) closingBrackets += right;
      function surround(cm, sel) {
        var selection = sel.get();
        sel.replace(left + selection + right);
      }
      function maybeOverwrite(cm, sel) {
        var cur = sel.find(), ahead = cm.getRange(cur, CodeMirror.Pos(cur.line, cur.ch + 1));
        if (ahead != right || sel.somethingSelected()) return CodeMirror.Pass;
        else cm.execCommand("goCharRight");
      }
      map["'" + left + "'"] = function(cm) {
        return cm.withSelection(function(sel) {
          if (left == "'" && cm.getTokenAt(sel.find()).type == "comment")
            return CodeMirror.Pass;
          if (sel.somethingSelected()) return surround(cm, sel);
          if (left == right && maybeOverwrite(cm, sel) != CodeMirror.Pass) return;
          var cur = sel.find(), ahead = CodeMirror.Pos(cur.line, cur.ch + 1);
          var line = cm.getLine(cur.line), nextChar = line.charAt(cur.ch);
          if (line.length == cur.ch || closingBrackets.indexOf(nextChar) >= 0 || SPACE_CHAR_REGEX.test(nextChar))
            sel.replace(left + right, {head: ahead, anchor: ahead});
          else
            return CodeMirror.Pass;
        });
      };
      if (left != right) map["'" + right + "'"] = function(cm) {
        return cm.withSelection(function(sel) {
          return maybeOverwrite(cm, sel);
        });
      };
    })(pairs.charAt(i), pairs.charAt(i + 1));
    return map;
  }

  function buildExplodeHandler(pairs) {
    return function(cm) {
      return cm.withSelection(function(sel) {
        var cur = sel.find(), around = charsAround(cm, cur);
        if (!around || pairs.indexOf(around) % 2 != 0) return CodeMirror.Pass;
        var newPos = CodeMirror.Pos(cur.line + 1, 0);
        sel.replace("\n\n", {anchor: newPos, head: newPos}, "+input");
        cm.indentLine(cur.line + 1, null, true);
        cm.indentLine(cur.line + 2, null, true);
      });
    };
  }
})();
