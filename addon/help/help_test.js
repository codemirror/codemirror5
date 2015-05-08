(function () {
  namespace = 'addon_help_';
  var editorText = 'Initial editor content.';
  [
    'commands',
    'defaults',
    'keyMap',
    'options'
  ].forEach(function (command) {
    testCM(command + 'Help', function (cm) {
      cm.setValue(editorText);
      cm.execCommand([command + 'Help']);
      is(cm.getValue() != editorText);
      var wrap = cm.getWrapperElement();
      var sel = wrap.parentElement.querySelector('select');
      eq(sel.className, 'CodeMirror-help');
      eq(sel.value, '*' + command + ' Help*');
      eq(sel.options[1].value, 'Editor');
      eq(sel.options.length, 2);
    });
  });
  testCM('allHelp', function (cm) {
    cm.setValue(editorText);
    cm.execCommand(['allHelp']);
    is(cm.getValue() != editorText);
    var wrap = cm.getWrapperElement();
    var sel = wrap.parentElement.querySelector('select');
    eq(sel.className, 'CodeMirror-help');
    eq(sel.value, '*commands Help*');
    eq(sel.options[0].value, '*commands Help*');
    eq(sel.options[1].value, '*defaults Help*');
    eq(sel.options[2].value, '*keyMap Help*');
    eq(sel.options[3].value, '*options Help*');
    eq(sel.options[4].value, 'Editor');
    eq(sel.options.length, 5);
    sel.selectedIndex = 4;
    sel.click();
    is(cm.getValue() == editorText, "initial editor content is unchanged");
  });
}) ();
