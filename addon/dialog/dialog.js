// Open simple dialogs on top of an editor. Relies on dialog.css.

(function() {
  function dialogDiv(cm, template, bottom) {
    var wrap = cm.getWrapperElement();
    var dialog;
    dialog = wrap.appendChild(document.createElement("div"));
    if (bottom) {
      dialog.className = "CodeMirror-dialog CodeMirror-dialog-bottom";
    } else {
      dialog.className = "CodeMirror-dialog CodeMirror-dialog-top";
    }
    dialog.innerHTML = template;
    return dialog;
  }

  CodeMirror.defineExtension("openDialog", function(template, callback, options) {
    var dialog = dialogDiv(this, template, options && options.bottom);
    var closed = false, me = this;
    function close() {
      if (closed) return;
      closed = true;
      dialog.parentNode.removeChild(dialog);
    }
    var inp = dialog.getElementsByTagName("input")[0], button;
    if (inp) {
      CodeMirror.on(inp, "keydown", function(e) {
        if (options && options.onKeyDown && options.onKeyDown(e, inp.value, close)) { return; }
        var keyName = CodeMirror.keyName(e);
        if (keyName == 'Enter' || keyName == 'Esc') {
          CodeMirror.e_stop(e);
          if (keyName == 'Esc' &&
              (!options || !options.closeOn || options.closeOn.indexOf(keyName) != -1)) {
            close();
            me.focus();
          }
          if (keyName == 'Enter') callback(inp.value);
        }
      });
      if (options && options.onKeyUp) {
        CodeMirror.on(inp, "keyup", function(e) {options.onKeyUp(e, inp.value, close);});
      }
      if (options && options.value) inp.value = options.value;
      inp.focus();
      if (!options || !options.closeOn || options.closeOn.indexOf('blur') != -1)
        CodeMirror.on(inp, "blur", close);
    }
    var buttons = document.getElementsByTagName("button");
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      CodeMirror.on(b, "click", function(e) {
        var query = inp ? inp.value : undefined;
        if (options && options.onButtonClick && options.onButtonClick(e, close, query)) { return; }
        if (!options || !options.closeOn || options.closeOn.indexOf('click') != -1) {
          close();
          me.focus();
        }
      });
      if (i == 0 && !inp) {
        b.focus();
        if (!options || !options.closeOn || options.closeOn.indexOf('blur') != -1)
          CodeMirror.on(button, "blur", close);
      }
    }

    return close;
  });

  CodeMirror.defineExtension("openConfirm", function(template, callbacks, options) {
    var dialog = dialogDiv(this, template, options && options.bottom);
    var buttons = dialog.getElementsByTagName("button");
    var closed = false, me = this, blurring = 1;
    function close() {
      if (closed) return;
      closed = true;
      dialog.parentNode.removeChild(dialog);
      me.focus();
    }
    buttons[0].focus();
    for (var i = 0; i < buttons.length; ++i) {
      var b = buttons[i];
      (function(callback) {
        CodeMirror.on(b, "click", function(e) {
          CodeMirror.e_preventDefault(e);
          close();
          if (callback) callback(me);
        });
      })(callbacks[i]);
      CodeMirror.on(b, "blur", function() {
        --blurring;
        setTimeout(function() { if (blurring <= 0) close(); }, 200);
      });
      CodeMirror.on(b, "focus", function() { ++blurring; });
    }
  });
})();
