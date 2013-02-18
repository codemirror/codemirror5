// Depends on jsonlint.js from https://github.com/zaach/jsonlint

CodeMirror.jsonValidator = function(cm) {
  var found = [];
  jsonlint.parseError = function(str, hash) {
    var loc = hash.loc;
    found.push({from: CodeMirror.Pos(loc.first_line - 1, loc.first_column),
                to: CodeMirror.Pos(loc.last_line - 1, loc.last_column),
                message: str});
  };
  try { jsonlint.parse(cm.getValue()); }
  catch(e) {}
  return found;
};
