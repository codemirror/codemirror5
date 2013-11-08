/*
 * Velocity hinting is quite simple really. First we get the current token,
 * then we run that token through a battery of if statements to try to determine
 * whether we have a variable name or a function. Then we fetch the correct set
 * of values for hinting, check which of those are still relevant to our token
 * and pass them back.
 */
(function() {
	//lets see if we are in a position to provide a hint
	function getHints(cm) {
		
		//we want to have access to other variables and functions in the
		//page so for that reason we are going to scrape them out within
		//the reasonable vicinity of 500 lines
		
		function pageScrape(type) {
			if (type == 'variable') {
				word = /[\w$]+/;
			} else if (type == 'function') {
				word = /[\w#]+/;
			}
			var doc = cm.getDoc();
			var editor = doc.getEditor();
			var range = 500;
			var curScrape = editor.getCursor(), curLine = editor.getLine(curScrape.line);
			var startScrape = curScrape.ch, endScrape = startScrape;
		    while (endScrape < curLine.length && word.test(curLine.charAt(endScrape))) ++endScrape;
		    while (startScrape && word.test(curLine.charAt(startScrape - 1))) --startScrape;
		    var curWord = startScrape != endScrape && curLine.slice(startScrape, endScrape);

		    var list = [], seen = {};
		    function scan(dir) {
		      var line = curScrape.line, endScrape = Math.min(Math.max(line + dir * range, editor.firstLine()), editor.lastLine()) + dir;
		      for (; line != endScrape; line += dir) {
		        var text = editor.getLine(line), m;
		        var re = new RegExp(word.source, "g");
		        while (m = re.exec(text)) {
		          if (line == curScrape.line && m[0] === curWord) continue;
		          if ((!curWord || m[0].indexOf(curWord) == 0) && !seen.hasOwnProperty(m[0])) {
		            seen[m[0]] = true;
		            list.push(m[0]);
		          }
		        }
		      }
		    }
		    
		    scan(-1);
		    scan(1);
		    return keySet(list);
		}
		
		function keySet(array) {
		    var keys = {};
		    for (var i = 0; i < array.length; ++i) {
		        keys[array[i]] = true;
		    }
		    return keys;
		}
		
		function merge_options(obj1,obj2){
		    var obj3 = {};
		    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
		    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
		    return obj3;
		}
		
		var cur = cm.getCursor(), token = cm.getTokenAt(cur);
		//lets check if there is a variable encased in curly brackets
		//we want to do this first too because it will strip out the
		//trailing bracket making it usable 
		if (/^(\${|\$!{).*}$/.test(token.string)) {
			//if it is lets strip out the stuff we dont need
			token.string = token.string.replace('}','');
			token.type= 'variable';
		} else
		//lets check if there is a function encased in curly brackets
		//we want to do this first too because it will strip out the
		//trailing bracket making it usable 
		if (/^(#{).*}$/.test(token.string)) {
			//if it is lets strip out the stuff we dont need
			token.string = token.string.replace('}','');
			token.type= 'function';
		} else
		//lets check if this is looking like a velocity variable
		if (/^\$/.test(token.string)) {
			token.type = "variable";
		} else
		//lets check if this is looking like a velocity function
		if (/^#/.test(token.string)) {
			token.type = "function";
		} else
		if (!token.type) { //if no type is defined at this point lets bail out
			return;
		}
		
		var keywords = null;
		if (token.type == ("variable"))
			keywords = keySet(["$foreach.count","$foreach.hasNext","$foreach.first","$foreach.last","$foreach.topmost",
			                   "foreach.parent.count","$foreach.parent.hasNext","$foreach.parent.first","$foreach.parent.last"
			                   ,"$foreach.parent","$velocityCount","$!bodyContent","$bodyContent"]);
		else if (token.type == ("function"))
			keywords = keySet(["#if","#elseif","#foreach","#set","#include","#parse","#macro","#define","#evaluate ","#end","#{if}",
                               "#{elseif}","#{foreach}","#{set}","#{include}","#{parse}","#{macro}","#{define}","#{evaluate}","#{end}"]);
		
		//if keywords is empty lets bail out
		if (!keywords)
			return;
		
		//right we have our builtin variables or functions now lets include ones scraped from the page
		var allNames = merge_options(keywords,pageScrape(token.type));
		//some variables required to do a sort and loop through results
		var keys = Object.keys(allNames), i, len = keys.length, result = [];
		
		//we added all our keys to an array so we can do a sort
		keys.sort();
		
		//now lets loop through our sorted results
		for (i = 0; i < len; i++) {
			name = keys[i];
			//lets check which results match our current string
		    if (name.indexOf(token.string) == 0 /* > -1 */) {
		    	result.push(name); //collect up the results
		    }
		}
		
		return {
			list : result,
			from : CodeMirror.Pos(cur.line, token.start),
			to : CodeMirror.Pos(cur.line, token.end)
		};
	}

	CodeMirror.registerHelper("hint", "velocity", getHints);
	
})();