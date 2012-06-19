/*
 * Author: Constantin Jucovschi (c.jucovschi@jacobs-university.de)
 * Licence: MIT
 */

CodeMirror.defineMode("stex", function(cmCfg, modeCfg) 
{    
    function pushCommand(state, command) {
	state.cmdState.push(command);
    }

    function peekCommand(state) { 
	if (state.cmdState.length>0)
	    return state.cmdState[state.cmdState.length-1];
	else
	    return null;
    }

    function popCommand(state) {
	if (state.cmdState.length>0) {
	    var plug = state.cmdState.pop();
	    plug.closeBracket();
	}	    
    }

    function applyMostPowerful(state) {
      var context = state.cmdState;
      for (var i = context.length - 1; i >= 0; i--) {
	  var plug = context[i];
	  if (plug.name=="DEFAULT")
	      continue;
	  return plug.styleIdentifier();
      }
      return null;
    }

    function addPluginPattern(pluginName, cmdStyle, brackets, styles) {
	return function () {
	    this.name=pluginName;
	    this.bracketNo = 0;
	    this.style=cmdStyle;
	    this.styles = styles;
	    this.brackets = brackets;

	    this.styleIdentifier = function(content) {
		if (this.bracketNo<=this.styles.length)
		    return this.styles[this.bracketNo-1];
		else
		    return null;
	    };
	    this.openBracket = function(content) {
		this.bracketNo++;
		return "bracket";
	    };
	    this.closeBracket = function(content) {
	    };
	}
    }

    var plugins = new Array();
   
    plugins["importmodule"] = addPluginPattern("importmodule", "tag", "{[", ["string", "builtin"]);
    plugins["documentclass"] = addPluginPattern("documentclass", "tag", "{[", ["", "atom"]);
    plugins["usepackage"] = addPluginPattern("documentclass", "tag", "[", ["atom"]);
    plugins["begin"] = addPluginPattern("documentclass", "tag", "[", ["atom"]);
    plugins["end"] = addPluginPattern("documentclass", "tag", "[", ["atom"]);

    plugins["DEFAULT"] = function () {
	this.name="DEFAULT";
	this.style="tag";

	this.styleIdentifier = function(content) {
	};
	this.openBracket = function(content) {
	};
	this.closeBracket = function(content) {
	};
    };

    function setState(state, f) {
	state.f = f;
    }

    function normal(source, state) {
	if (source.match(/^\\[a-zA-Z@]+/)) {
	    var cmdName = source.current();
	    cmdName = cmdName.substr(1, cmdName.length-1);
            var plug;
            if (plugins.hasOwnProperty(cmdName)) {
	      plug = plugins[cmdName];
            } else {
              plug = plugins["DEFAULT"];
            }
	    plug = new plug();
	    pushCommand(state, plug);
	    setState(state, beginParams);
	    return plug.style;
	}

        // escape characters 
        if (source.match(/^\\[$&%#{}_]/)) {
          return "tag";
        }

        // white space control characters
        if (source.match(/^\\[,;!\/]/)) {
          return "tag";
        }

	var ch = source.next();
	if (ch == "%") {
            // special case: % at end of its own line; stay in same state
            if (!source.eol()) {
              setState(state, inCComment);
            }
	    return "comment";
	} 
	else if (ch=='}' || ch==']') {
	    plug = peekCommand(state);
	    if (plug) {
		plug.closeBracket(ch);
		setState(state, beginParams);
	    } else
		return "error";
	    return "bracket";
	} else if (ch=='{' || ch=='[') {
	    plug = plugins["DEFAULT"];	    
	    plug = new plug();
	    pushCommand(state, plug);
	    return "bracket";	    
	}
	else if (/\d/.test(ch)) {
	    source.eatWhile(/[\w.%]/);
	    return "atom";
	}
	else {
	    source.eatWhile(/[\w-_]/);
	    return applyMostPowerful(state);
	}
    }

    function inCComment(source, state) {
	source.skipToEnd();
	setState(state, normal);
	return "comment";
    }

    function beginParams(source, state) {
	var ch = source.peek();
	if (ch == '{' || ch == '[') {
	   var lastPlug = peekCommand(state);
	   var style = lastPlug.openBracket(ch);
	   source.eat(ch);
	   setState(state, normal);
	   return "bracket";
	}
	if (/[ \t\r]/.test(ch)) {
	    source.eat(ch);
	    return null;
	}
	setState(state, normal);
	lastPlug = peekCommand(state);
	if (lastPlug) {
	    popCommand(state);
	}
        return normal(source, state);
    }

    return {
     startState: function() { return { f:normal, cmdState:[] }; },
	 copyState: function(s) { return { f: s.f, cmdState: s.cmdState.slice(0, s.cmdState.length) }; },
	 
	 token: function(stream, state) {
	 var t = state.f(stream, state);
	 var w = stream.current();
	 return t;
     }
 };
});


CodeMirror.defineMIME("text/x-stex", "stex");
