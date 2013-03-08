(function() {
  'use strict';

  var listRE = /^(\s*)([*+-]|(\d+)\.)(\s*)/
    , unorderedBullets = '*+-';

  CodeMirror.commands.newlineAndIndentContinueMarkdownList = function(cm) {
    var pos = cm.getCursor()
      , line = cm.getLineHandle(pos.line)
      , match, indent, bullet, after;

    if (!line.stateAfter.list || !(match = line.text.match(listRE))) {
      cm.execCommand('newlineAndIndent');
      return;
    }

    indent = match[1];
    after = match[4];
    bullet = unorderedBullets.indexOf(match[2]) >= 0
      ? match[2]
      : (parseInt(match[3], 10) + 1) + '.';

    cm.replaceSelection('\n' + indent + bullet + after, 'end');
  };

}());
