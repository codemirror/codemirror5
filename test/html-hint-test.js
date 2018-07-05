// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function() {
  var Pos = CodeMirror.Pos;

  namespace = "html-hint_";

  testData =[
    {
      name: "html-element",
      value: "<htm",
      list: ["<html"]
    },
    {
      name: "element-close",
      value: "<a href='#a'>\n</",
      list: ["</a>"]
    },
    {
      name: "linkref-attribute",
      value: "<link hreflang='z",
      from: Pos(0,"<link hreflang=".length),
      list: ["'zh'","'za'","'zu'"]
    },
    {
      name: "html-completion",
      value: "<html>\n",
      list: ["<head","<body","</html>"]
    }
  ];

  function escapeHtmlList(o) {
    return '<code>' +
      JSON.stringify(o.list,null,2)
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;") +
      '</code>'
  }

  function test(name, spec) {
    testCM(name, function(cm) {
      cm.setValue(spec.value);
      cm.setCursor(spec.cursor);
      var completion = CodeMirror.hint.html(cm);
      if (!deepCompare(completion.list, spec.list))
        throw new Failure("Wrong completion results. Got" +
          escapeHtmlList(completion) +" but expected" +
          escapeHtmlList(spec));
      eqCharPos(completion.from, spec.from,'from-failed');
      eqCharPos(completion.to, spec.to, 'to-failed');
    }, {
      value: spec.value,
      mode: spec.mode || "text/html"
    });
  }

  testData.forEach(function (value) {
    // Use sane defaults
    var lines = value.value.split(/\n/);
    value.to = value.pos || Pos(lines.length-1, lines[lines.length-1].length);
    value.from = value.from || Pos(lines.length-1,0);
    value.cursor = value.cursor || value.to;
    var name = value.name ||value.value;
    test(name,value)
  });

  function deepCompare(a, b) {
    if (a === b) return true;
    if (!(a && typeof a === "object") ||
        !(b && typeof b === "object")) return false;
    var array = a instanceof Array
    if ((b instanceof Array) !== array) return false;
    if (array) {
      if (a.length !== b.length) return false;
      for (var i = 0; i < a.length; i++) if (!deepCompare(a[i], b[i])) return false
    } else {
      for (var p in a) if (!(p in b) || !deepCompare(a[p], b[p])) return false;
      for (var p in b) if (!(p in a)) return false
    }
    return true
  }
})();
