// Define search commands. Depends on dialog.js or another
// implementation of the openDialog method.

// Replace works a little oddly -- it will do the replace on the next
// Ctrl-G (or whatever is bound to findNext) press. You prevent a
// replace by making sure the match is no longer selected when hitting
// Ctrl-G.

(function() {
  function SearchState() {
    this.lastPos = null; this.query = this.replacing = null; this.marked = [];
  }
  function getSearchState(cm) {
    if (!cm) debugger;
    return cm._searchState || (cm._searchState = new SearchState());
  }
  function dialog(cm, text, shortText, f) {
    if (cm.openDialog) cm.openDialog(text, f);
    else f(prompt(shortText, ""));
  }
  function parseQuery(query) {
    var isRE = query.match(/^\/(.*)\/$/);
    return isRE ? new RegExp(isRE[1]) : query;
  }
  var queryDialog =
    'Search: <input type="text" style="width: 10em"> <span style="color: #888">(Use /re/ syntax for regexp search)</span>';
  function doSearch(cm, rev) {
    var state = getSearchState(cm);
    if (state.query) return findNext(cm, rev);
    dialog(cm, queryDialog, "Search for:", function(query) {
      cm.operation(function() {
        if (!query || state.query) return;
        state.query = parseQuery(query);
        if (cm.lineCount() < 2000) { // This is too expensive on big documents.
          for (var cursor = cm.getSearchCursor(query); cursor.findNext();)
            state.marked.push(cm.markText(cursor.from(), cursor.to(), "CodeMirror-searching"));
        }
        state.lastPos = cm.getCursor();
        findNext(cm, rev);
      });
    });
  }
  function findNext(cm, rev) {cm.operation(function() {
    var state = getSearchState(cm);
    if (state.replacing) {
      var sel = cm.getSelection();
      if (typeof state.query == "string") {
        if (sel == state.query) cm.replaceSelection(state.replacing);
      } else {
        var match = sel.match(state.query);
        if (match) cm.replaceSelection(state.replacing.replace(/\$(\d)/, function(w, i) {return match[i];}));
      }
    }
    var cursor = cm.getSearchCursor(state.query, state.lastPos);
    if (!cursor.find(rev)) {
      cursor = cm.getSearchCursor(state.query, rev ? {line: cm.lineCount() - 1} : {line: 0, ch: 0});
      if (!cursor.find(rev)) return;
    }
    cm.setSelection(cursor.from(), cursor.to());
    state.lastPos = rev ? cursor.from() : cursor.to();
  })}
  function clearSearch(cm) {cm.operation(function() {
    var state = getSearchState(cm);
    if (!state.query) return;
    state.query = state.replacing = null;
    for (var i = 0; i < state.marked.length; ++i) state.marked[i].clear();
    state.marked.length = 0;
  })}

  var replaceQueryDialog =
    'Replace: <input type="text" style="width: 10em"> <span style="color: #888">(Use /re/ syntax for regexp search)</span>';
  var replacementQueryDialog = 'With: <input type="text" style="width: 10em">';
  function replace(cm, all) {
    dialog(cm, replaceQueryDialog, "Replace:", function(query) {
      if (!query) return;
      query = parseQuery(query);
      dialog(cm, replacementQueryDialog, "Replace with:", function(text) {
        if (all) {
          cm.operation(function() {
            for (var cursor = cm.getSearchCursor(query); cursor.findNext();) {
              if (typeof query != "string") {
                var match = cm.getRange(cursor.from(), cursor.to()).match(query);
                cursor.replace(text.replace(/\$(\d)/, function(w, i) {return match[i];}));
              } else cursor.replace(text);
            }
          });
        } else {
          var state = getSearchState(cm);
          clearSearch(cm);
          state.query = query;
          state.replacing = text;
          state.lastPos = cm.getCursor();
          findNext(cm);
        }
      });
    });
  }

  CodeMirror.commands.find = function(cm) {clearSearch(cm); doSearch(cm);};
  CodeMirror.commands.findNext = doSearch;
  CodeMirror.commands.findPrev = function(cm) {doSearch(cm, true);};
  CodeMirror.commands.clearSearch = clearSearch;
  CodeMirror.commands.replace = replace;
  CodeMirror.commands.replaceAll = function(cm) {replace(cm, true);};
})();
