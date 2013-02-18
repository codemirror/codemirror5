(function() {

  CodeMirror.jsonValidator = function(contents, collector) {
    jsonlint.parseError = function(str, hash) {
      var severity = 'error';
      var loc = hash.loc;
      var lineStart = loc.first_line - 1;
      var lineEnd = hash.line;// loc.last_line - 1;
      var charStart = loc.first_column;
      var charEnd = loc.last_column;

      collector.addAnnotation(severity, lineStart, charStart,
			      lineEnd, charEnd, str);

    };
    try { jsonlint.parse(contents); }
    catch(e) {}
  };

})();
