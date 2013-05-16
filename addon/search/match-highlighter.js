// Highlighting text that matches the selection
//
// Defines an option highlightSelectionMatches, which, when enabled,
// will style strings that match the selection throughout the
// document.
//
// The option can be set to true to simply enable it, or to a
// {minChars, style} object to explicitly configure it. minChars is
// the minimum amount of characters that should be selected for the
// behavior to occur, and style is the token style to apply to the
// matches. This will be prefixed by "cm-" to create an actual CSS
// class name.

(function() {
  var DEFAULT_MIN_CHARS = 2;
  var DEFAULT_TOKEN_STYLE = "matchhighlight";

  function State(options) {
    this.minChars = typeof options == "object" && options.minChars || DEFAULT_MIN_CHARS;
    this.style = typeof options == "object" && options.style || DEFAULT_TOKEN_STYLE;
    this.overlay = null;
  }

  CodeMirror.defineOption("highlightSelectionMatches", false, function(cm, val, old) {
    var prev = old && old != CodeMirror.Init;
    if (val && !prev) {
      cm.state.matchHighlighter = new State(val);
      cm.on("cursorActivity", highlightMatches);
    } else if (!val && prev) {
      var over = cm.state.matchHighlighter.overlay;
      if (over) cm.removeOverlay(over);
      cm.state.matchHighlighter = null;
      cm.off("cursorActivity", highlightMatches);
    }
  });

  function highlightMatches(cm) {
    cm.operation(function() {
      var state = cm.state.matchHighlighter;
      if (state.overlay) {
        cm.removeOverlay(state.overlay);
        state.overlay = null;
      }

      if (!cm.somethingSelected()) return;
      var selection = cm.getSelection().replace(/^\s+|\s+$/g, "");
      if (selection.length < state.minChars) return;

      cm.addOverlay(state.overlay = makeOverlay(selection, state.style));
    });
  }

  function makeOverlay(query, style) {
    return {token: function(stream) {
      if (stream.match(query)) return style;
      stream.next();
      stream.skipTo(query.charAt(0)) || stream.skipToEnd();
    }};
  }
})();
