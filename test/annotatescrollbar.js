namespace = "annotatescrollbar_";

(function () {
  function test(name, run, content, query, expected) {
    return testCM(name, function (cm) {
      var annotation = cm.annotateScrollbar({
        listenForChanges: false,
        className: "CodeMirror-search-match"
      });
      var matches = [];
      var cursor = cm.getSearchCursor(query, CodeMirror.Pos(0, 0));
      while (cursor.findNext()) {
        var match = {
          from: cursor.from(),
          to: cursor.to()
        };
        matches.push(match)
      }

      if (run) run(cm);

      cm.display.barWidth = 5;
      annotation.update(matches);

      var annotations = cm.getWrapperElement().getElementsByClassName(annotation.options.className);
      eq(annotations.length, expected, "Expected " + expected + " annotations on the scrollbar.")
    }, {
      value: content,
      mode: "javascript",
      foldOptions: {
        rangeFinder: CodeMirror.fold.brace
      }
    });
  }

  function doFold(cm) {
    cm.foldCode(cm.getCursor());
  }
  var simpleProg = "function foo() {\n\n  return \"foo\";\n\n}\n\nfoo();\n";
  var consecutiveLineMatches = "function foo() {\n  return \"foo\";\n}\nfoo();\n";
  var singleLineMatches = "function foo() { return \"foo\"; }foo();\n";

  // Base case - expect 3 matches and 3 annotations
  test("simple", null, simpleProg, "foo", 3);
  // Consecutive line matches are combines into a single annotation - expect 3 matches and 2 annotations
  test("combineConsecutiveLine", null, consecutiveLineMatches, "foo", 2);
  // Matches on a single line get a single annotation - expect 3 matches and 1 annotation
  test("combineSingleLine", null, singleLineMatches, "foo", 1);
  // Matches within a fold are annotated on the folded line - expect 3 matches and 2 annotations
  test("simpleFold", doFold, simpleProg, "foo", 2);
  // Combination of combineConsecutiveLine and simpleFold cases - expect 3 matches and 1 annotation
  test("foldedMatch", doFold, consecutiveLineMatches, "foo", 1);
  // Hidden matches within a fold are annotated on the folded line - expect 1 match and 1 annotation
  test("hiddenMatch", doFold, simpleProg, "return", 1);
})();