CodeMirror.remotingValidator = function(cm, updateLinting, options) {
	var text = cm.getValue();
	var url = options.url;
	jQuery.ajax( {
		type :'POST',
		url : url,
		data : {
			xquery :text
		},
		async :true,
		success : function(data, textStatus, jqXHR) {
			if (data) {
				var found = [];
				for ( var i = 0; i < data.length; i++) {
					var error = data[i];
					var startLine = error.startLine;
					var startChar = error.startChar;
					var endLine = error.endLine;
					var endChar = error.endChar;
					var message = error.message;
					found.push( {
						from :CodeMirror.Pos(startLine, startChar),
						to :CodeMirror.Pos(endLine, endChar),
						message :message
					});
				}
			}
			updateLinting(cm, found);
		},
		error : function(jqXHR, textStatus, errorThrown) {
			// alert(errorThrown);
	}
	});

};
