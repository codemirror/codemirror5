(function() {
  "use strict";

  namespace = "contenteditable_";
  var Pos = CodeMirror.Pos

  function findTextNode(dom, text) {
    if (dom instanceof CodeMirror) dom = dom.getInputField()
    if (dom.nodeType == 1) {
      for (var ch = dom.firstChild; ch; ch = ch.nextSibling) {
        var found = findTextNode(ch, text)
        if (found) return found
      }
    } else if (dom.nodeType == 3 && dom.nodeValue == text) {
      return dom
    }
  }

  function lineElt(node) {
    for (;;) {
      var parent = node.parentNode
      if (/CodeMirror-code/.test(parent.className)) return node
      node = parent
    }
  }

  testCM("insert_text", function(cm) {
    findTextNode(cm, "foobar").nodeValue = "foo bar"
    cm.display.input.updateFromDOM()
    eq(cm.getValue(), "foo bar")
  }, {inputStyle: "contenteditable", value: "foobar"})

  testCM("split_line", function(cm) {
    cm.setSelection(Pos(2, 3))
    var node = findTextNode(cm, "foobar")
    node.nodeValue = "foo"
    var lineNode = lineElt(node)
    lineNode.parentNode.insertBefore(document.createElement("pre"), lineNode.nextSibling).textContent = "bar"
    cm.display.input.updateFromDOM()
    eq(cm.getValue(), "one\ntwo\nfoo\nbar\nthree\nfour\n")
  }, {inputStyle: "contenteditable", value: "one\ntwo\nfoobar\nthree\nfour\n"})

  testCM("join_line", function(cm) {
    cm.setSelection(Pos(2, 3))
    var node = findTextNode(cm, "foo")
    node.nodeValue = "foobar"
    var lineNode = lineElt(node)
    lineNode.parentNode.removeChild(lineNode.nextSibling)
    cm.display.input.updateFromDOM()
    eq(cm.getValue(), "one\ntwo\nfoobar\nthree\nfour\n")
  }, {inputStyle: "contenteditable", value: "one\ntwo\nfoo\nbar\nthree\nfour\n"})

  testCM("delete_multiple", function(cm) {
    cm.setSelection(Pos(1, 3), Pos(4, 0))
    var text = findTextNode(cm, "two"), startLine = lineElt(text)
    for (var i = 0; i < 3; i++)
      startLine.parentNode.removeChild(startLine.nextSibling)
    text.nodeValue = "twothree"
    cm.display.input.updateFromDOM()
    eq(cm.getValue(), "one\ntwothree\nfour\n")
  }, {inputStyle: "contenteditable", value: "one\ntwo\nfoo\nbar\nthree\nfour\n"})

  testCM("ambiguous_diff_middle", function(cm) {
    cm.setSelection(Pos(0, 2))
    findTextNode(cm, "baah").nodeValue = "baaah"
    cm.display.input.updateFromDOM()
    eqCharPos(cm.getCursor(), Pos(0, 3))
  }, {inputStyle: "contenteditable", value: "baah"})

  testCM("ambiguous_diff_start", function(cm) {
    cm.setSelection(Pos(0, 1))
    findTextNode(cm, "baah").nodeValue = "baaah"
    cm.display.input.updateFromDOM()
    eqCharPos(cm.getCursor(), Pos(0, 2))
  }, {inputStyle: "contenteditable", value: "baah"})

  testCM("ambiguous_diff_end", function(cm) {
    cm.setSelection(Pos(0, 3))
    findTextNode(cm, "baah").nodeValue = "baaah"
    cm.display.input.updateFromDOM()
    eqCharPos(cm.getCursor(), Pos(0, 4))
  }, {inputStyle: "contenteditable", value: "baah"})

  testCM("force_redraw", function(cm) {
    findTextNode(cm, "foo").parentNode.appendChild(document.createElement("hr")).className = "inserted"
    cm.display.input.updateFromDOM()
    eq(byClassName(cm.getInputField(), "inserted").length, 0)
  }, {inputStyle: "contenteditable", value: "foo"})

  testCM("type_on_empty_line", function(cm) {
    cm.setSelection(Pos(1, 0))
    findTextNode(cm, "\u200b").nodeValue += "hello"
    cm.display.input.updateFromDOM()
    eq(cm.getValue(), "foo\nhello\nbar")
  }, {inputStyle: "contenteditable", value: "foo\n\nbar"})

  testCM("type_after_empty_line", function(cm) {
    cm.setSelection(Pos(2, 0))
    findTextNode(cm, "bar").nodeValue = "hellobar"
    cm.display.input.updateFromDOM()
    eq(cm.getValue(), "foo\n\nhellobar")
  }, {inputStyle: "contenteditable", value: "foo\n\nbar"})

  testCM("type_before_empty_line", function(cm) {
    cm.setSelection(Pos(0, 3))
    findTextNode(cm, "foo").nodeValue = "foohello"
    cm.display.input.updateFromDOM()
    eq(cm.getValue(), "foohello\n\nbar")
  }, {inputStyle: "contenteditable", value: "foo\n\nbar"})
})();
