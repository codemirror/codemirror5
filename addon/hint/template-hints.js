(function() {
	
	var allTemplates = [];
	
	function defineTemplates(mode, templates) {
		var templatesByMode = allTemplates[mode];
		if (templatesByMode == null) {
			templatesByMode = [];
			allTemplates[mode] = templatesByMode;
		}
		templatesByMode.push(templates);
	}
	
	CodeMirror.defineTemplates = defineTemplates; 
		
})();