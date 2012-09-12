/**
 * Tag-closer extension for CodeMirror.
 *
 * This extension adds a "closeTag" utility function that can be used with key bindings to 
 * insert a matching end tag after the ">" character of a start tag has been typed.  It can
 * also complete "</" if a matching start tag is found.  It will correctly ignore signal
 * characters for empty tags, comments, CDATA, etc.
 *
 * The function depends on internal parser state to identify tags.  It is compatible with the
 * following CodeMirror modes and will ignore all others:
 * - htmlmixed
 * - xml
 *
 * See demos/closetag.html for a usage example.
 * 
 * @author Nathan Williams <nathan@nlwillia.net>
 * Contributed under the same license terms as CodeMirror.
 */
(function() {
	/** Option that allows tag closing behavior to be toggled.  Default is true. */
	CodeMirror.defaults['closeTagEnabled'] = true;
	
	/** Array of tag names to add indentation after the start tag for.  Default is the list of block-level html tags. */
	CodeMirror.defaults['closeTagIndent'] = ['applet', 'blockquote', 'body', 'button', 'div', 'dl', 'fieldset', 'form', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'html', 'iframe', 'layer', 'legend', 'object', 'ol', 'p', 'select', 'table', 'ul'];

	/** Array of tag names where an end tag is forbidden. */
	CodeMirror.defaults['closeTagVoid'] = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

	function innerState(cm, state) {
		return CodeMirror.innerMode(cm.getMode(), state).state;
	}


	/**
	 * Call during key processing to close tags.  Handles the key event if the tag is closed, otherwise throws CodeMirror.Pass.
	 * - cm: The editor instance.
	 * - ch: The character being processed.
	 * - indent: Optional.  An array of tag names to indent when closing.  Omit or pass true to use the default indentation tag list defined in the 'closeTagIndent' option.
	 *   Pass false to disable indentation.  Pass an array to override the default list of tag names.
	 * - vd: Optional.  An array of tag names that should not be closed.  Omit to use the default void (end tag forbidden) tag list defined in the 'closeTagVoid' option.  Ignored in xml mode.
	 */
	CodeMirror.defineExtension("closeTag", function(cm, ch, indent, vd) {
		if (!cm.getOption('closeTagEnabled')) {
			throw CodeMirror.Pass;
		}
		
		/*
		 * Relevant structure of token:
		 *
		 * htmlmixed
		 * 		className
		 * 		state
		 * 			htmlState
		 * 				type
		 *				tagName
		 * 				context
		 * 					tagName
		 * 			mode
		 * 
		 * xml
		 * 		className
		 * 		state
		 * 			tagName
		 * 			type
		 */
		
		var pos = cm.getCursor();
		var tok = cm.getTokenAt(pos);
		var state = innerState(cm, tok.state);

		if (state) {
			
			if (ch == '>') {
				var type = state.type;
				
				if (tok.className == 'tag' && type == 'closeTag') {
					throw CodeMirror.Pass; // Don't process the '>' at the end of an end-tag.
				}
			
				cm.replaceSelection('>'); // Mode state won't update until we finish the tag.
				pos = {line: pos.line, ch: pos.ch + 1};
				cm.setCursor(pos);
		
				tok = cm.getTokenAt(cm.getCursor());
				state = innerState(cm, tok.state);
				if (!state) throw CodeMirror.Pass;
				var type = state.type;

				if (tok.className == 'tag' && type != 'selfcloseTag') {
					var tagName = state.tagName;
					if (tagName.length > 0 && shouldClose(cm, vd, tagName)) {
						insertEndTag(cm, indent, pos, tagName);
					}
					return;
				}
				
				// Undo the '>' insert and allow cm to handle the key instead.
				cm.setSelection({line: pos.line, ch: pos.ch - 1}, pos);
				cm.replaceSelection("");
			
			} else if (ch == '/') {
				if (tok.className == 'tag' && tok.string == '<') {
					var ctx = state.context, tagName = ctx ? ctx.tagName : '';
					if (tagName.length > 0) {
						completeEndTag(cm, pos, tagName);
						return;
					}
				}
			}
		
		}
		
		throw CodeMirror.Pass; // Bubble if not handled
	});

	function insertEndTag(cm, indent, pos, tagName) {
		if (shouldIndent(cm, indent, tagName)) {
			cm.replaceSelection('\n\n</' + tagName + '>', 'end');
			cm.indentLine(pos.line + 1);
			cm.indentLine(pos.line + 2);
			cm.setCursor({line: pos.line + 1, ch: cm.getLine(pos.line + 1).length});
		} else {
			cm.replaceSelection('</' + tagName + '>');
			cm.setCursor(pos);
		}
	}
	
	function shouldIndent(cm, indent, tagName) {
		if (typeof indent == 'undefined' || indent == null || indent == true) {
			indent = cm.getOption('closeTagIndent');
		}
		if (!indent) {
			indent = [];
		}
		return indexOf(indent, tagName.toLowerCase()) != -1;
	}
	
	function shouldClose(cm, vd, tagName) {
		if (cm.getOption('mode') == 'xml') {
			return true; // always close xml tags
		}
		if (typeof vd == 'undefined' || vd == null) {
			vd = cm.getOption('closeTagVoid');
		}
		if (!vd) {
			vd = [];
		}
		return indexOf(vd, tagName.toLowerCase()) == -1;
	}
	
	// C&P from codemirror.js...would be nice if this were visible to utilities.
	function indexOf(collection, elt) {
		if (collection.indexOf) return collection.indexOf(elt);
		for (var i = 0, e = collection.length; i < e; ++i)
			if (collection[i] == elt) return i;
		return -1;
	}

	function completeEndTag(cm, pos, tagName) {
		cm.replaceSelection('/' + tagName + '>');
		cm.setCursor({line: pos.line, ch: pos.ch + tagName.length + 2 });
	}
	
})();
