(function() {
	CodeMirror.defaults['completeTags'] = {
		'script':'<script type="text/javascript">\n\n</script>',
		'ready':'$(document).ready(function(){\n\n});',
		'jquery':'<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>',
		'table':'<table cellpadding=0 cellspacing=0 border=0 width="100%">\n\n</table>',
		'strict':'<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">'
	};

	CodeMirror.defineExtension("completeTag", function(cm) {
		var completeTags = cm.getOption('completeTags');
		var tag = cm.getTokenAt(cm.getCursor());
		if( completeTags[tag.string] ){
			cm.setSelection({line: cm.getCursor().line, ch:tag.start},{line: cm.getCursor().line, ch:tag.end});
			cm.replaceSelection( completeTags[tag.string] );
			var tagsl = explode('\n',completeTags[tag.string]);
			var lines = {line: cm.getCursor().line + tagsl.length-1};
			for(var x=0;x<tagsl.length;x++){
				cm.indentLine( cm.getCursor().line + x );
				if( tagsl[x] == "" ) lines = {line: (cm.getCursor().line + x) };
			}
			//cm.setSelection(lines,null,true);
			cm.setSelection(lines, null, true);
			return false;
		}
		
		throw CodeMirror.Pass; // Bubble if not handled
	});
	
})();