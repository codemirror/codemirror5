(function() {
  var count = "";
  function pushCountDigit(digit) { return function(cm) {count += digit;} }
  function popCount() { var i = parseInt(count); count = ""; return i || 1; }
  function countTimes(func) {
    if (typeof func == "string") func = CodeMirror.commands[func];
    return function(cm) { for (var i = 0, c = popCount(); i < c; ++i) func(cm); }
  }

  function iterObj(o, f) {
    for (var prop in o) if (o.hasOwnProperty(prop)) f(prop, o[prop]);
  }

  var map = CodeMirror.keyMap.vim = {
    "0": function(cm) {count.length > 0 ? pushCountDigit("0")(cm) : CodeMirror.commands.goLineStart(cm);},
    "I": function(cm) {popCount(); cm.setOption("keyMap", "vim-insert");},
    catchall: function(cm) {/*ignore*/}
  };
  // Add bindings for number keys
  for (var i = 1; i < 10; ++i) map[i] = pushCountDigit(i);
  // Add bindings that are influenced by number keys
  iterObj({"H": "goColumnLeft", "L": "goColumnRight", "J": "goLineDown", "K": "goLineUp",
		       "Left": "goColumnLeft", "Right": "goColumnRight", "Down": "goLineDown", "Up": "goLineUp",
           "Backspace": "goCharLeft", "Space": "goCharRight",
           "U": "undo", "Ctrl-R": "redo"},
          function(key, cmd) { map[key] = countTimes(cmd); });

  CodeMirror.keyMap["vim-insert"] = {
    "Esc": function(cm) {cm.setOption("keyMap", "vim");},
    fallthrough: ["default"]
  };
})();
