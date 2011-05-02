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
      return "stex-identifier";
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
		return "stex-bracket";
	    };
	    this.closeBracket = function(content) {
	    };
	}
    }

    var plugins = new Array();
   
    plugins["importmodule"] = addPluginPattern("importmodule", "stex-command", "{[", ["stex-filepath", "stex-module"]);
    plugins["documentclass"] = addPluginPattern("documentclass", "stex-command", "{[", ["", "stex-unit"]);
    plugins["usepackage"] = addPluginPattern("documentclass", "stex-command", "[", ["stex-unit"]);
    plugins["begin"] = addPluginPattern("documentclass", "stex-command", "[", ["stex-unit"]);
    plugins["end"] = addPluginPattern("documentclass", "stex-command", "[", ["stex-unit"]);

    plugins["DEFAULT"] = function () {
	this.name="DEFAULT";
	this.style="stex-command";

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
	if (source.match(/^\\[a-z]+/)) {
	    var cmdName = source.current();
	    cmdName = cmdName.substr(1, cmdName.length-1);
	    var plug = plugins[cmdName];
	    if (typeof(plug) == 'undefined') {
		plug = plugins["DEFAULT"];
	    }
	    plug = new plug();
	    pushCommand(state, plug);
	    setState(state, beginParams);
	    return plug.style;
	}

	var ch = source.next();
	if (ch == "%") {
	    setState(state, inCComment);
	    return "stex-comment";
	} 
	else if (ch=='}' || ch==']') {
	    plug = peekCommand(state);
	    if (plug) {
		plug.closeBracket(ch);
		setState(state, beginParams);
	    } else
		return "stex-error";
	    return "stex-bracket";
	} else if (ch=='{' || ch=='[') {
	    plug = plugins["DEFAULT"];	    
	    plug = new plug();
	    pushCommand(state, plug);
	    return "stex-bracket";	    
	}
	else if (/\d/.test(ch)) {
	    source.eatWhile(/[\w.%]/);
	    return "stex-unit";
	}
	else {
	    source.eatWhile(/[\w-_]/);
	    return applyMostPowerful(state);
	}
    }

    function inCComment(source, state) {
	source.skipToEnd();
	setState(state, normal);
	return "css-comment";
    }

    function beginParams(source, state) {
	var ch = source.peek();
	if (ch == '{' || ch == '[') {
	   var lastPlug = peekCommand(state);
	   var style = lastPlug.openBracket(ch);
	   source.eat(ch);
	   setState(state, normal);
	   return "stex-bracket";
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
