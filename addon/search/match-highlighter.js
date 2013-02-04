// Define match-highlighter commands. Depends on searchcursor.js
// Use by attaching the following function call to the cursorActivity event:
//   myCodeMirror.matchHighlight([minChars], [className]);
// And including a CSS rules for `span.CodeMirror-matchhighlight` (also
// optionally a separate one for `.CodeMirror-focused` -- see demo matchhighlighter.html).
// To clear all marks, run:
//   myCodeMirror.matchHighlight.clear(myCodeMirror);

(function() {
  var DEFAULT_MIN_CHARS = 2;
  var DEFAULT_CLASS_NAME = "CodeMirror-matchhighlight";
  
  function MatchHighlightState() {
    this.marked = [];
  }
  function getMatchHighlightState(cm) {
    return cm._matchHighlightState || (cm._matchHighlightState = new MatchHighlightState());
  }
  
  function clearMarks(state) {
    for (var i = 0; i < state.marked.length; ++i)
      state.marked[i].clear();
    state.marked = [];
  }
  
  function markDocument(cm, minChars, className) {
    var state = getMatchHighlightState(cm);
    clearMarks(state);
    // If not enough chars selected, don't search
    if (cm.somethingSelected() && cm.getSelection().replace(/^\s+|\s+$/g, "").length < minChars) return;
    // This is too expensive on big documents
    if (cm.lineCount() > 2000) return;

    var query = cm.getSelection();
    cm.operation(function() {
      for (var cursor = cm.getSearchCursor(query); cursor.findNext();) {
        // Only apply matchhighlight to the matches other than the one actually selected
        if (cursor.from().line !== cm.getCursor(true).line || cursor.from().ch !== cm.getCursor(true).ch)
          state.marked.push(cm.markText(cursor.from(), cursor.to(), {className: className}));
      }
    });
  }

  var plugin = function(minChars, className) {
    if (typeof minChars === 'undefined') minChars = DEFAULT_MIN_CHARS;
    if (typeof className === 'undefined') className = DEFAULT_CLASS_NAME;
    markDocument(this, minChars, className);
  };
  plugin.clear = function(cm) {
    clearMarks(getMatchHighlightState(cm));
  };
  CodeMirror.defineExtension("matchHighlight", plugin);
})();
