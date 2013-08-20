(function() {

	CodeMirror.isFullScreen = function(cm) {
		return /\bCodeMirror-fullscreen\b/.test(cm.getWrapperElement().className);
	}

	CodeMirror.setFullScreen = function(cm, full) {
		var wrap = cm.getWrapperElement();
		var placeholderId = wrap.id + "__placeholder";
		if (full) {
			var placeholderAttrId = document.createAttribute("id");
			placeholderAttrId.nodeValue = placeholderId;
			var placeholder = document.createElement("div");
			placeholder.setAttributeNode(placeholderAttrId);
			wrap.parentNode.insertBefore(placeholder, wrap);
			document.body.appendChild(wrap);
			wrap.className += " CodeMirror-fullscreen";
			wrap.style.height = CodeMirror.winHeight() + "px";
			wrap.style.width = CodeMirror.winWidth() + "px";
			document.documentElement.style.overflow = "hidden";
		} else {
			var placeholder = document.getElementById(placeholderId);
			if (placeholder) {
				placeholder.parentNode.replaceChild(wrap, placeholder);
			}
			wrap.className = wrap.className.replace(" CodeMirror-fullscreen", "");
			wrap.style.height = "";
			wrap.style.width = "";
			document.documentElement.style.overflow = "";
		}
		cm.refresh();
		cm.focus();
	}

	CodeMirror.winHeight = function() {
		return window.innerHeight
				|| (document.documentElement || document.body).clientHeight;
	}
	CodeMirror.winWidth = function() {
		return window.innerWidth
				|| (document.documentElement || document.body).clientWidth;
	}

	CodeMirror.on(window, "resize", function() {
		var showing = document.body.getElementsByClassName("CodeMirror-fullscreen")[0];
		if (!showing) return;
		showing.CodeMirror.getWrapperElement().style.height = CodeMirror.winHeight() + "px";
		showing.CodeMirror.getWrapperElement().style.width = CodeMirror.winWidth() + "px";
	});
	
	CodeMirror.defineOption("fullScreen", false, function(cm, val, old) {
		CodeMirror.setFullScreen(cm, val);
	});

})();
