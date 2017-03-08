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

  testCM("force_redraw", function(cm) {
    findTextNode(cm, "foo").parentNode.appendChild(document.createElement("hr")).className = "inserted"
    cm.display.input.updateFromDOM()
    eq(byClassName(cm.getInputField(), "inserted").length, 0)
  }, {inputStyle: "contenteditable", value: "foo"})
})();
