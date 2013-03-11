(function() {
  var DEFAULT_BRACKETS = "()[]{}''\"\"";

  CodeMirror.defineOption("autoCloseBrackets", false, function(cm, val, old) {
    var wasOn = old && old != CodeMirror.Init;
    if (val && !wasOn)
      cm.addKeyMap(buildKeymap(typeof val == "string" ? val : DEFAULT_BRACKETS));
    else if (!val && wasOn)
      cm.removeKeyMap("autoCloseBrackets");
  });

  function buildKeymap(pairs) {
    var map = {
      name : "autoCloseBrackets",
      Backspace: buildBackspacer(pairs)
    };
    for (var i = 0; i < pairs.length; i += 2) (function(left, right) {
      function maybeOverwrite(cm) {
        var cur = cm.getCursor(), ahead = cm.getRange(cur, CodeMirror.Pos(cur.line, cur.ch + 1));
        if (ahead != right) return CodeMirror.Pass;
        else cm.execCommand("goCharRight");
      }
      map["'" + left + "'"] = function(cm) {
        if (left == right && maybeOverwrite(cm) != CodeMirror.Pass) return;
        var cur = cm.getCursor("start"), ahead = CodeMirror.Pos(cur.line, cur.ch + 1);
        cm.replaceSelection(left + right, {head: ahead, anchor: ahead});
      };
      if (left != right) map["'" + right + "'"] = maybeOverwrite;
    })(pairs.charAt(i), pairs.charAt(i + 1));
    return map;
  }

  function buildBackspacer(pairs) {
    var pairmap = {};

    for (var i = 0; i < pairs.length; i += 2)
      pairmap[pairs.charAt(i)] = pairs.charAt(i + 1);

    return function(cm) {
      var cur = cm.getCursor(),
          from = CodeMirror.Pos(cur.line, cur.ch - 1),
          to = CodeMirror.Pos(cur.line, cur.ch + 1),
          str = cm.getRange(from, to);

      if (pairmap[str.charAt(0)] !== str.charAt(1)) return CodeMirror.Pass;
      cm.replaceRange('', from, to);
    };
  }
})();
