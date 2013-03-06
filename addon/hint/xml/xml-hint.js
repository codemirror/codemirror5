(function() {

    CodeMirror.xmlHints = [];

    CodeMirror.xmlHint = function(cm) {

        var cursor = cm.getCursor();

        if (cursor.ch > 0) {

            var text = cm.getRange(CodeMirror.Pos(0, 0), cursor);
            var typed = '';
            var simbol = '';
            for(var i = text.length - 1; i >= 0; i--) {
                if(text[i] == ' ' || text[i] == '<') {
                    simbol = text[i];
                    break;
                }
                else {
                    typed = text[i] + typed;
                }
            }

            text = text.slice(0, text.length - typed.length);

            var path = getActiveElement(text) + simbol;
            var hints = CodeMirror.xmlHints[path];

            if(typeof hints === 'undefined')
                hints = [''];
            else {
                hints = hints.slice(0);
                for (var i = hints.length - 1; i >= 0; i--) {
                    if(hints[i].indexOf(typed) != 0)
                        hints.splice(i, 1);
                }
            }

            var nodeType = "attribute";
            if (simbol.length > 0 && simbol.charAt(0) == '<') nodeType = "element";
            return {
                list: hints,
                nodeType: nodeType,  
                updateItem : updateItem,
                pickItem : pickItem,
                from: CodeMirror.Pos(cursor.line, cursor.ch - typed.length),
                to: cursor
            };
        }
    };

    function updateItem(elt, completions, i, data) {
    	// Add CodeMirror-hint-xml-attribute or CodeMirror-hint-xml-element to the li element to manage icons
    	var completion = completions[i];
    	elt.className = elt.className + ' CodeMirror-hint-xml-' + data.nodeType;
    	elt.appendChild(document.createTextNode(completion));
		return true;
    }
    
    function pickItem(completions, i, data, cm) {
    	if (data.nodeType == "attribute") {		
    		// attribute node is picked, add the attribute name with '=""' and set the cursor on the middle of the quote.
    		var label = completions[i] + '=""';
    		cm.replaceRange(label, data.from, data.to);
        	cm.setCursor(CodeMirror.Pos(cm.getCursor().line, cm.getCursor().ch -1));
    		return true;
    	}
    	return false;
    }
    
    var getActiveElement = function(text) {

        var element = '';

        if(text.length >= 0) {

            var regex = new RegExp('<([^!?][^\\s/>]*).*?>', 'g');

            var matches = [];
            var match;
            while ((match = regex.exec(text)) != null) {
                matches.push({
                    tag: match[1],
                    selfclose: (match[0].slice(match[0].length - 2) === '/>')
                });
            }

            for (var i = matches.length - 1, skip = 0; i >= 0; i--) {

                var item = matches[i];

                if (item.tag[0] == '/')
                {
                    skip++;
                }
                else if (item.selfclose == false)
                {
                    if (skip > 0)
                    {
                        skip--;
                    }
                    else
                    {
                        element = '<' + item.tag + '>' + element;
                    }
                }
            }

            element += getOpenTag(text);
        }

        return element;
    };

    var getOpenTag = function(text) {

        var open = text.lastIndexOf('<');
        var close = text.lastIndexOf('>');

        if (close < open)
        {
            text = text.slice(open);

            if(text != '<') {

                var space = text.indexOf(' ');
                if(space < 0)
                    space = text.indexOf('\t');
                if(space < 0)
                    space = text.indexOf('\n');

                if (space < 0)
                    space = text.length;

                return text.slice(0, space);
            }
        }

        return '';
    };

})();
