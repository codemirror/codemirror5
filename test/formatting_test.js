test("autoFormatRange_xml", function() {
  var te = document.getElementById("code");
  te.value = "<?xml version='1.0'?><a><b/><c foo='bar'>\n\n</c></a>";
  var cm = CodeMirror.fromTextArea(te, { mode: "application/xml" });
  cm.autoFormatRange({ line: 0, ch: 0 }, { line: 2, ch: cm.getLine(2).length });

  // @todo fix whitespace that's added inside <c> and the newline appended to end
  var expected = "<?xml version='1.0'?>\n<a>\n  <b/>\n  <c foo='bar'>\n    \n  </c>\n</a>\n";
  eq(cm.getValue(), expected);
});
