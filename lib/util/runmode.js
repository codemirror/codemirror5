CodeMirror.runMode = function(string, modespec, callback, options) {
	var opt = options || CodeMirror.defaults;

	var mode = CodeMirror.getMode(opt, modespec);

	var isNode = callback.nodeType == 1;
	if (isNode) {
		var node = callback, accum = [];
		callback = function(string, style) {
			if (string == "") return;
			if (string == "\n")
				accum.push("<br>");
			else if (style)
				accum.push("<span class=\"cm-" + CodeMirror.htmlEscape(style) + "\">" + CodeMirror.htmlEscape(string) + "</span>");
			else
				accum.push(CodeMirror.htmlEscape(string));
		} // callback
	} // if (isNode)
	
	var lines = CodeMirror.splitLines(string), state = CodeMirror.startState(mode);
	var style, text, col, stream;

	function makeTabText(col) {
		var w = opt.tabSize - col % opt.tabSize;
		for (var str = '', i = 0; i < w; ++i) str += " ";
		return str;
	};

	function tabHandling(text) {
		// col is global to .runMode
		var tmp, idx, pos, pmax = text.length;

		for (pos = 0; pos < pmax; ) {
			tmp = '';
			idx = text.indexOf("\t", pos);
			if (idx == -1) {
				// whitespace after a tab is space(s)
				// no further tabs, so eat all
				tmp += text.slice(pos);
				// this test is needed, for all modes,
				// that return whitespace together with text. eg: text/plain
				style = (/[^\s]/im.test(tmp)) ? null : 'tab-space-mixed';
				idx = text.length;	// needs to be fixed since it is -1
			}
			else if (idx-pos > 1) {
				// spaces followed by a tab
				tmp = text.slice(pos, idx);
				style = (/[^\s]/im.test(tmp)) ? null : 'tab-space-mixed';
				idx -= 1;  // the following tab needs to be handled again.
			}
			else {
				// convert a tab to spaces
				tmp +=  makeTabText(col);
				style = 'tab';
			}
			pos = idx + 1;
			col += tmp.length;
			callback(tmp, style, i, stream.start);
		}
		return '';
	}; // fn tabHandling()
	
	for (var i = 0, e = lines.length; i < e; ++i) {
		col = 0;
		if (i) callback("\n");
		stream = new CodeMirror.StringStream(lines[i]);
		while (!stream.eol()) {
			style = mode.token(stream, state);
			text = stream.current();
			if (text.indexOf('\t') != -1) {
				text = tabHandling(text);
				// tabHandling should return an empty string.
				// tabHandling manipulates col
			};
			col += text.length;
			
			callback(text, style, i, stream.start);
			stream.start = stream.pos;
		}
	}
	if (isNode)
		node.innerHTML = accum.join("");
};
