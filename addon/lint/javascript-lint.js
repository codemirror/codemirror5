// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";
  // declare global: JSHINT

  var bogus = [ "Dangerous comment" ];

  var replacements = [ [ "Expected '{'",
                     "Statement body should be inside '{ }' braces." ] ];

  var forcedErrorCodes = [
    "W033", // Missing semicolon.
    "W070", // Extra comma. (it breaks older versions of IE)
    "W112", // Unclosed string.
    "W117", // '{a}' is not defined.
    "W023", // Expected an identifier in an assignment and instead saw a function invocation.
    "W024", // Expected an identifier and instead saw '{a}' (a reserved word).
    "W030", // Expected an assignment or function call and instead saw an expression.
    "W084", // Expected a conditional expression and instead saw an assignment.
    "W095" // Expected a string and instead saw {a}.
  ];

  function validator(text, options) {
    if (!window.JSHINT) {
      if (window.console) {
        window.console.error("Error: window.JSHINT not defined, CodeMirror JavaScript linting cannot run.");
      }
      return [];
    }
    JSHINT(text, options, options.globals);
    var errors = JSHINT.data().errors, result = [];
    if (errors) parseErrors(errors, result);
    return result;
  }

  CodeMirror.registerHelper("lint", "javascript", validator);

  function cleanup(error) {
    fixWith(error, forcedErrorCodes, replacements);

    return isBogus(error) ? null : error;
  }

  function fixWith(error, forcedErrorCodes, replacements) {
    var errorCode, description, i, fix, find, replace, found;

    errorCode = error.code;
    description = error.description;

    if (error.severity !== "error") {
      for (i = 0; i < forcedErrorCodes.length; i++) {
        if (errorCode === forcedErrorCodes[i]) {
          error.severity = "error";
          break;
        }
      }
    }

    for (i = 0; i < replacements.length; i++) {
      fix = replacements[i];
      find = fix[0];
      found = description.indexOf(find) !== -1;

      if (found) {
        replace = fix[1];
        error.description = replace;
        break;
      }
    }
  }

  function isBogus(error) {
    var description = error.description;
    for ( var i = 0; i < bogus.length; i++) {
      if (description.indexOf(bogus[i]) !== -1) {
        return true;
      }
    }
    return false;
  }

  function parseErrors(errors, output) {
    for ( var i = 0; i < errors.length; i++) {
      var error = errors[i];
      if (error) {
        var linetabpositions, index;

        linetabpositions = [];

        // This next block is to fix a problem in jshint. Jshint
        // replaces
        // all tabs with spaces then performs some checks. The error
        // positions (character/space) are then reported incorrectly,
        // not taking the replacement step into account. Here we look
        // at the evidence line and try to adjust the character position
        // to the correct value.
        if (error.evidence) {
          // Tab positions are computed once per line and cached
          var tabpositions = linetabpositions[error.line];
          if (!tabpositions) {
            var evidence = error.evidence;
            tabpositions = [];
            // ugggh phantomjs does not like this
            // forEachChar(evidence, function(item, index) {
            Array.prototype.forEach.call(evidence, function(item,
                                                            index) {
              if (item === '\t') {
                // First col is 1 (not 0) to match error
                // positions
                tabpositions.push(index + 1);
              }
            });
            linetabpositions[error.line] = tabpositions;
          }
          if (tabpositions.length > 0) {
            var pos = error.character;
            tabpositions.forEach(function(tabposition) {
              if (pos > tabposition) pos -= 1;
            });
            error.character = pos;
          }
        }

        var start = error.character - 1, end = start + 1;
        if (error.evidence) {
          index = error.evidence.substring(start).search(/.\b/);
          if (index > -1) {
            end += index;
          }
        }

        // Convert to format expected by validation service
        error.description = error.reason;// + "(jshint)";
        error.start = error.character;
        error.end = end;
        error.severity = error.code.startsWith('W') ? "warning" : "error";
        error = cleanup(error);

        if (error)
          output.push({message: error.description,
                       severity: error.severity,
                       from: CodeMirror.Pos(error.line - 1, start),
                       to: CodeMirror.Pos(error.line - 1, end)});
      }
    }
  }
});
