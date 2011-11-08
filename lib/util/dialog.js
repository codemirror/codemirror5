// Open simple dialogs on top of an editor. Relies on dialog.css.

CodeMirror.defineExtension("openDialog", function(template, callback) {
  var wrap = this.getWrapperElement();
  var dialog = wrap.insertBefore(document.createElement("div"), wrap.firstChild);
  dialog.className = "CodeMirror-dialog";
  dialog.innerHTML = '<div>' + template + '</div>';
  var closed = false, me = this;
  function close() {
    if (closed) return;
    closed = true;
    dialog.parentNode.removeChild(dialog);
  }
  var inp = dialog.getElementsByTagName("input")[0];
  if (inp) {
    CodeMirror.connect(inp, "keydown", function(e) {
      if (e.keyCode == 13 || e.keyCode == 27) {
        CodeMirror.e_stop(e);
        close();
        me.focus();
        if (e.keyCode == 13) callback(inp.value);
      }
    });
    inp.focus();
    CodeMirror.connect(inp, "blur", close);
  }
  return close;
});
