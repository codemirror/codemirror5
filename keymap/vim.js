(function() {

  var count = [];
  function pushCountDigit(digit) { return function(cm) {count.push(digit);} }
  function popCount() { var i = parseInt(count.join("")); count = []; return i || 1;  }
  function countTimes(func) {
    if (typeof func == "string") func = CodeMirror.commands[func];
    return function(cm) { for (var i = 0, c = popCount(); i < c; ++i) func(cm); }
  }

  CodeMirror.keyMap.vim = {
    "0": function(cm) {count.length > 0 ? pushCountDigit("0")(cm) : CodeMirror.commands.goLineStart(cm);},
    "I": function(cm) {popCount(); cm.setOption("keyMap", "vim-insert");},
    "H": function(cm) {cm.moveH(-popCount(), "char");}, "L": function(cm) {cm.moveH(popCount(), "char");},
    "J": function(cm) {cm.moveV(popCount(), "line");}, "K": function(cm) {cm.moveV(-popCount(), "line");},
    "U": countTimes("undo"), "Ctrl-R": countTimes("redo"),
    catchall: function(cm) {/*ignore*/}
  };
  for (var i = 1; i < 10; ++i) CodeMirror.keyMap.vim[i.toString()] = pushCountDigit(i.toString());

  CodeMirror.keyMap["vim-insert"] = {
    "Esc": function(cm) {cm.setOption("keyMap", "vim");},
    fallthrough: ["default"]
  };
})();
