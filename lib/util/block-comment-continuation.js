// Inserts block comment continuation marker (like '*' incase of C++/Java/JavaScript)
// Use by attaching the following function call to the 'enter' key event:
//     codemirrorEditor.newlineAndIndentWithCommentContinuation(blockCommentStart,
//     commentContinuationChar);

(function() {
  var DEFAULT_COMMENT_START = "/*";
  var DEFAULT_CONTINUATION_CHAR = "*";

  function newlineAndIndentWithCommentContinuation(cm, blockCommentStart, commentContinuationChar) {
    var commentStart = typeof blockCommentStart !== "undefined" ? blockCommentStart : DEFAULT_COMMENT_START;
    var continuationChar = typeof commentContinuationChar !== "undefined" ? commentContinuationChar : DEFAULT_CONTINUATION_CHAR;

    var cur = cm.getCursor();
    var token = cm.getTokenAt(cur);
    cm.newlineAndIndent();
    // insert block commentContinuation char inside block comment.
    if (token.className == "comment") {
      if (token.string.indexOf(commentStart) == 0) {
        cm.replaceSelection(" " + continuationChar + " ", "end");
      } else if (token.state.tokenize != null && token.string.indexOf(continuationChar) == 0) {
        cm.replaceSelection(continuationChar + " ", "end");
      }
    }
  }

  CodeMirror.defineExtension("newlineAndIndentWithCommentContinuation", function(commentStart, continuationChar) {
    newlineAndIndentWithCommentContinuation(this, commentStart, continuationChar);
  });
})();
