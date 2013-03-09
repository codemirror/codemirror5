( function() {
	var Pos = CodeMirror.Pos;

	var moduleURIs = [];
	var modules = [];
		
	function defineXQueryModule(module) {
		if(module && module.uri) {
			moduleURIs.push(module.uri);
			modules[module.uri] = module;
		}
	}
	CodeMirror.defineXQueryModule = defineXQueryModule;
	
	function updateItem(elt, completions, i) {
	  
	  if (completion instanceof ModuleFunction) {
		  // Module
		var label = completion.prefix + ':' + completion.moduleFunction.name;
		label+='(';
		var params = completion.moduleFunction.params;
		if (params) {			
			for ( var i = 0; i < params.length; i++) {
				if (i > 0) label+= ', ';
				var param = params[i];
				label += '$' + param.name;
				var as = param.as;
				if (as && as.length> 0) label += ' as ' + as; 
			}
		}
		label+=')';
		var as = completion.moduleFunction.as;
		if (as && as.length> 0) label += ' as ' + as; 
		elt.className = elt.className + " CodeMirror-hint-function";
		elt.appendChild(document.createTextNode(label));
		return true;  
	  }
	  
	  // other type
	  return false;
	}
	
	function pickItem(completions, i, data, cm) {
	  var completion = completions[i];
	  if (completion instanceof CodeMirror.VarDecl) {
		  var from  = Pos(data.line, data.token.start);
		  var to  = Pos(data.line, data.token.end);
		  cm.replaceRange(completion.name, from, to);
		  return true;
	  }
	  if (completion instanceof CodeMirror.FunctionDecl) {
		  var from  = Pos(data.line, data.token.start);
		  var to  = Pos(data.line, data.token.end);		  
		  var firstParam = null;
		  var functionDecl = completion;
		  var name = functionDecl.name;
		  var params = functionDecl.params;
		  var label = name + '(';
		  var p ='';
		  while (params) {
			var varDecl = params.varDecl;
			firstParam = varDecl.name; 			
			p = varDecl.name + p;
			params = params.next;
			if (params != null) p = ',' + p; 
		  }			 
		  label+=p;
		  label+=')';		  
		  cm.replaceRange(label, from, to);
		  cm.setCursor(Pos(data.line, data.token.start + name.length + 1));
		  if (firstParam != null) {
			cm.setSelection(Pos(data.line, data.token.start + name.length + 1), Pos(data.line, data.token.start + name.length + 1 + firstParam.length));  
		  } 		  
		  return true;
	  }
	  if (completion instanceof ModuleFunction) {
		// Module
		var firstParam = null;
		var name = completion.prefix + ':' + completion.moduleFunction.name;
		var label = name;
		label+='(';
		var params = completion.moduleFunction.params;
		if (params) {			
			for ( var i = 0; i < params.length; i++) {
			  var param = params[i];
			  var paramName = '$' + param.name;
			  if (i == 0) {firstParam = paramName;} else {label+= ', ';}          
			  label += paramName;			
			}
		}
		label+=')';
		var from  = Pos(data.line, data.token.start);
		var to  = Pos(data.line, data.token.end);
		cm.replaceRange(label, from, to);
		cm.setCursor(Pos(data.line, data.token.start + name.length + 1));
		if (firstParam != null) {
		  cm.setSelection(Pos(data.line, data.token.start + name.length + 1), Pos(data.line, data.token.start + name.length + 1 + firstParam.length));  
		}
	  }
	  if (completion.uri) {
		var label = completion.uri;
		var from = Pos(data.line, data.token.start + 1), to = null;
		var location = completion.location;
		if (location) {
		  var quote = data.token.string.charAt(0);
		  label += quote + ' at ' + quote + location + quote + ';';
		  var length = cm.getLine(cm.getCursor().line).length
		  to  = Pos(data.line, length);
		}
		else {		  
		  to  = Pos(data.line, data.token.end -1);
		}			
		cm.replaceRange(label, from, to);
		return true;	  
	  }
	  if (completion instanceof CodeMirror.ModuleDecl) {
		var from  = Pos(data.line, data.token.start);
		var to  = Pos(data.line, data.token.end);
		cm.replaceRange(completion.prefix, from, to);
		return true;
	  }			  	  
	  return false;
	}
	
	function getToken(editor, pos) {
		return editor.getTokenAt(pos);
	}

	function getPreviousToken(editor, cur, token) {
		return getToken(editor, Pos(cur.line, token.start));
	}

	function startsWithString(str, token) {
		return str.slice(0, token.length) == token;
	}

	function trim(str) {
		if (str.trim) {
			return str.trim();
		}
		return str.replace(/^\s+|\s+$/g, '');
	}
	
	function getStartsWith(cur, token, startIndex) {
		var length = cur.ch - token.start;
		if (!startIndex)
			startIndex = 0;
		var startsWith = token.string.substring(startIndex, length);
		return trim(startsWith);
	}
	
	function getCompletions(items, cur, token, options, showHint) {		
		var sortedItems = items.sort(function(a, b){
		 var s1 = a.text;//getKeyWord(a);
		 var s2 = b.text;//getKeyWord(b);
		 var nameA= s1.toLowerCase(), nameB=s2.toLowerCase()
		 if (nameA < nameB) //sort string ascending
		  return -1 
		 if (nameA > nameB)
		  return 1
		 return 0 //default return value (no sorting)
		});
		var data = {
		  list : sortedItems,
		  //updateItem : updateItem,
		  //pickItem : pickItem, 
		  from :Pos(cur.line, token.start),
		  to :Pos(cur.line, token.end),
		  line : cur.line,
		  token : token
		};
		
		if (options && options.async) {
			showHint(data);
		}
		else {
			return data;
		}
	}
	
	function getVarLabel(varDecl) {
	  var dataType = varDecl.dataType || varDecl.dataType || 'any'; 
	  var name = varDecl.name;
	  return name + ' : '  + dataType;
	}
	
	function populateVars(s, vars, items) {		
		while (vars) {
			var varDecl = vars.varDecl;
			var name = varDecl.name;
			if (name && startsWithString(name, s)) {
				var completion = varDecl.completion;
				if (!completion) {
					completion = {"content" : varDecl.name, "text" : getVarLabel(varDecl), "className" : "CodeMirror-hint-var-" + varDecl.scope};
					completion.hint = function(cm, data, completion) {
						var from  = Pos(data.line, data.token.start);
						var to  = Pos(data.line, data.token.end);
						cm.replaceRange(completion.content, from, to);
					};
					varDecl.completion = completion;
				}
				items.push(completion);
			}
			vars = vars.next;
		}		
	}

	function getParamLabel(varDecl) {
	  var dataType = varDecl.dataType || varDecl.dataType || 'any'; 
	  var name = varDecl.name;
	  return name + ' as ' + dataType;
	}
	
	function getFunctionLabel(functionDecl) {	
	  var name = functionDecl.name;
	  var params = functionDecl.params;
	  var label = name + '(';
	  var p ='';
	  while (params) {
		var varDecl = params.varDecl;
		p = getParamLabel(varDecl) + p;
		params = params.next;
		if (params != null) p = ', ' + p; 
	  }			 
	  label+=p;
	  label+=')';
	  return label;
	}	  

	function populateDeclaredFunctions(s, declaredFunctions, items) {
		if (declaredFunctions) {
			for ( var i = 0; i < declaredFunctions.length; i++) {
				var functionDecl = declaredFunctions[i];
				var name = functionDecl.name;
				if (name
						&& startsWithString(name, s)) {
					var completion = functionDecl.completion;
					if (!completion) {
						// create content to insert
						var firstParam = null;												  
						var name = functionDecl.name;
						var params = functionDecl.params;
						var content = name + '(';
						var p ='';
						while (params) {
						 var varDecl = params.varDecl;
						 firstParam = varDecl.name; 			
						 p = varDecl.name + p;
						 params = params.next;
						 if (params != null) p = ',' + p; 
						}			 
						content+=p;
						content+=')';						  
						completion = {"name": name, "content" : content, "firstParam" : firstParam, "text" : getFunctionLabel(functionDecl), "className" : "CodeMirror-hint-function"};
						completion.hint = function(cm, data, completion) {
						  var from  = Pos(data.line, data.token.start);
						  var to  = Pos(data.line, data.token.end);		  						  		  
						  cm.replaceRange(completion.content, from, to);
						  cm.setCursor(Pos(data.line, data.token.start + name.length + 1));
						  var firstParam = completion.firstParam;
						  if (firstParam != null) {
							cm.setSelection(Pos(data.line, data.token.start + name.length + 1), Pos(data.line, data.token.start + name.length + 1 + firstParam.length));  
						  }
						};
						functionDecl.completion = completion;
					}
					items.push(completion);
				}	
			}
		}	
	}
	
	function populateDeclaredModules(s, declaredModules, items) {		
		if (declaredModules) {
			for ( var i = 0; i < declaredModules.length; i++) {
				var declaredModule = declaredModules[i];
				var name = declaredModule.prefix;
				if (name
						&& startsWithString(name, s)) {
					var completion = declaredModule.completion;
					if (!completion) {
						completion = {"content" : declaredModule.prefix, "text" : declaredModule.prefix, "className" : "CodeMirror-hint-module"};
						completion.hint = function(cm, data, completion) {
							var from  = Pos(data.line, data.token.start);
							var to  = Pos(data.line, data.token.end);
							cm.replaceRange(completion.content, from, to);
						};
						declaredModule.completion = completion;
					}
					items.push(completion);
				}	
			}
		}		
	}
	
	function getDeclaredModule(declaredModules, prefix) {
		if (declaredModules) {
			for ( var i = 0; i < declaredModules.length; i++) {
				var declaredModule = declaredModules[i];
				var name = declaredModule.prefix;
				if (name == prefix) {
					return declaredModule;
				}	
			}
		}	
		return null;
	}
	
	function populateModuleNamespaces(s, items) {	
		for ( var i = 0; i < moduleURIs.length; i++) {
			var uri = moduleURIs[i];
			if (startsWithString(uri, s)) {
				var module = modules[uri];
				var completion = module.completion;
				if (!completion) {
					completion = {"location" : module.location, "text" : module.uri, "className" : "CodeMirror-hint-module-ns"};
					completion.hint = function(cm, data, completion) {
						var label = completion.text;
						var from = Pos(data.line, data.token.start + 1), to = null;
						var location = completion.location;
						if (location) {
						  var quote = data.token.string.charAt(0);
						  label += quote + ' at ' + quote + location + quote + ';';
						  var length = cm.getLine(cm.getCursor().line).length
						  to  = Pos(data.line, length);
						}
						else {		  
						  to  = Pos(data.line, data.token.end -1);
						}			
						cm.replaceRange(label, from, to);
					};
					module.completion = completion;
				}
				items.push(completion);
			}
		}		
	}
	
	function populateModuleFunction(prefix, f, items) {
		var label = prefix + ':' + f.name;
		label+='(';
		var params = f.params;
		if (params) {			
			for ( var i = 0; i < params.length; i++) {
				if (i > 0) label+= ', ';
				var param = params[i];
				label += '$' + param.name;
				var as = param.as;
				if (as && as.length> 0) label += ' as ' + as; 
			}
		}
		label+=')';
		var as = f.as;
		if (as && as.length> 0) label += ' as ' + as; 
		
		var completion = {"moduleFunction" : f, "text" : label, "className" : "CodeMirror-hint-function"};
		completion.hint = function(cm, data, completion) {
		  var firstParam = null;
		  var name = prefix + ':' + completion.moduleFunction.name;
		  var label = name;
		  label+='(';
			var params = completion.moduleFunction.params;
			if (params) {			
				for ( var i = 0; i < params.length; i++) {
				  var param = params[i];
				  var paramName = '$' + param.name;
				  if (i == 0) {firstParam = paramName;} else {label+= ', ';}          
				  label += paramName;			
				}
			}
			label+=')';
			var from  = Pos(data.line, data.token.start);
			var to  = Pos(data.line, data.token.end);
			cm.replaceRange(label, from, to);
			cm.setCursor(Pos(data.line, data.token.start + name.length + 1));
			if (firstParam != null) {
			  cm.setSelection(Pos(data.line, data.token.start + name.length + 1), Pos(data.line, data.token.start + name.length + 1 + firstParam.length));  
			}
		};
		items.push(completion);
	} 
	
	function populateModuleFunctions(module, prefix, funcName, items) {
		// loop for each function		
		var functions = module.functions;
		for ( var i = 0; i < functions.length; i++) {
			var f = functions[i];
			var name = f.name;
			if (name
					&& startsWithString(name, funcName )) {
				populateModuleFunction(prefix, f, items);
			}	
		}		
	}
		
	CodeMirror.xqueryHint = function(editor, showHint, options) {
		return internalXQueryHint(editor, options, showHint);
	}
	
	function internalXQueryHint(editor, options, showHint) {			
		var items = [];
		// Find the token at the cursor
		var cur = editor.getCursor(), token = getToken(editor, cur), tprop = token;
		switch (tprop.type) {
		case "string":
			// completion started inside a string
			tprop = getPreviousToken(editor, cur, tprop);
			switch (tprop.type) {
			case "keyword":
				switch (tprop.string) {
				case "=":
					tprop = getPreviousToken(editor, cur, tprop);
					if (tprop.type == "variable") {
						tprop = getPreviousToken(editor, cur, tprop);
						if (tprop.string.replace(' ', '') == '') {
							tprop = getPreviousToken(editor, cur, tprop);
							if (tprop.type == "keyword"
									&& tprop.string == "namespace") {
								// here we are in the case with namespace
								// aaa="mynames...
								var s = getStartsWith(cur, token, 1);
								populateModuleNamespaces(s, items)								
							}
						}
					}
					break;
				case ":":
					//tprop = getPreviousToken(editor, cur, tprop);
					break;
				}
				break;
			}
			break;
		case "variable def":
			//var startsWith = getStartsWith(cur, token);
			// alert(startsWith);
			break;
		case "variable":
		case null:
			// check if there are not "let" or "variable" keyword
			var functionDecl = token.state.functionDecl;
			if (functionDecl && functionDecl.paramsParsing == true) {
				return;
			}			
			var previous = getPreviousToken(editor, cur, tprop);
			if (previous) {
				previous = getPreviousToken(editor, cur, previous);
				if (previous && previous.type == "keyword"
						&& previous.string == "let"
						|| previous.string == "variable"
						|| previous.string == "for")
					return;
			}
			// show let, declared variables.
			var s = null;
			if (previous && previous.type == "keyword" && previous.string == "if" && token.string == "(") {
				s="";
			} else {
				s = getStartsWith(cur, token);
			}
			
			// test if s ends with ':'
			var prefix = null;
			var funcName = null;
			var prefixIndex = s.lastIndexOf(':');
			if (prefixIndex!= -1) {
				prefix = s.substring(0, prefixIndex);
				funcName = s.substring(prefixIndex + 1, s.length);
			}
			
			if (prefix)  {
				// search module
				var declaredModule = getDeclaredModule(token.state.declaredModules, prefix);
				if (declaredModule && declaredModule.namespaceURI) {
					var module = modules[declaredModule.namespaceURI];
					if (module) {
						populateModuleFunctions(module, prefix, funcName, items);
					}
				}
			}
			
			// local vars (let, for, ...)
			var vars = token.state.localVars;			
			populateVars(s, vars, items);	
			
			var context = token.state.context;
			while(context) {
				if (context.keepLocals) {
					vars = context.vars;
					populateVars(s, vars, items);
					context = context.prev;
				} else {
					context = null;
				}
			}
			
			// global vars (declare ...)
			var globalVars = token.state.globalVars;
			populateVars(s, globalVars, items);

			// parametres of the function (if token is inside a function)
			if (functionDecl) {
				var vars = functionDecl.params;
				populateVars(s, vars, items);
			}
			
			// declared functions			
			var declaredFunctions = token.state.declaredFunctions
			populateDeclaredFunctions(s, declaredFunctions, items);
			
			// declared modules
			var declaredModules = token.state.declaredModules
			populateDeclaredModules(s, declaredModules, items);
			
		}
		return getCompletions(items, cur, token, options, showHint)
	};
})();
