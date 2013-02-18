(function() {
	var DEFAULT_BRACKETS = [ "()", "[]", "{}", "''", "\"\"" ];
	CodeMirror.defineOption("autoCloseBrackets", false, function(cm, val, old) {
		if (val && (old == CodeMirror.Init || !old)) {
			var map = {
				name : "autoCloseBrackets"
			};
			var brackets = val.brackets || val.brackets || DEFAULT_BRACKETS;
			for ( var i = 0; i < brackets.length; i++) {
				var bracket = brackets[i];
				var startBracket = bracket.charAt(0);
				var endBracket = bracket.substring(1, bracket.length);
				attachAutoCloseBracket(startBracket, endBracket, map)
			}
			cm.addKeyMap(map);
		} else if (!val && (old != CodeMirror.Init && old)) {
			cm.removeKeyMap("autoCloseBrackets");
		}
	});
	
	function attachAutoCloseBracket(startBracket, endBracket, map) {
		map["'" + startBracket + "'"] = function(cm) {
			autoCloseBracket(cm, startBracket, endBracket);
		};
	};

	function autoCloseBracket(cm, startBracket, endBracket) {

//		if (cm.somethingSelected()) {
//			alert('e');
//			//cm.replaceSelection("[#{cm.getSelection()}]")
//			//CodeMirror.commands["goCharRight"](cm)
//		} else {
			cm.replaceRange(endBracket, cm.getCursor(false))
			CodeMirror.commands["goCharLeft"](cm)
		//}
		throw CodeMirror.Pass;
	}
})();
