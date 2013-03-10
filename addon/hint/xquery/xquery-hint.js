(function() {
  var Pos = CodeMirror.Pos;

  // --------------- xquery module functions ---------------------

  var moduleURIs = [];
  var modules = [];

  function defineXQueryModule(module) {
    if (module && module.uri) {
      moduleURIs.push(module.uri);
      modules[module.uri] = module;
    }
  }
  CodeMirror.defineXQueryModule = defineXQueryModule;

  function findModuleByDeclaration(importedModule) {
    if (importedModule && importedModule.namespaceURI) {
      var module = findModule(importedModule.namespaceURI, importedModule.location);
      if (module) {
        return module;
      }
    }
    return null;
  }
  
  function findModule(namespaceURI, location) {
    var module = modules[namespaceURI];
    if (module) {
      return module;
    }
    return null;
  }

  // --------------- token utils ---------------------

  function getToken(editor, pos) {
    return editor.getTokenAt(pos);
  }

  function getPreviousToken(editor, cur, token) {
    return getToken(editor, Pos(cur.line, token.start));
  }

  // --------------- string utils ---------------------

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

  // --------------- populate variables functions ---------------------

  function getVarLabel(varDecl) {
    var dataType = varDecl.dataType || varDecl.dataType || 'any';
    var name = varDecl.name;
    return name + ' : ' + dataType;
  }

  function populateVars(s, vars, items) {
    while (vars) {
      var varDecl = vars.varDecl;
      var name = varDecl.name;
      if (name && startsWithString(name, s)) {
        var completion = varDecl.completion;
        if (!completion) {
          completion = {
            "text" : getVarLabel(varDecl),
            "className" : "CodeMirror-hint-var-" + varDecl.scope,
            "varDecl" : varDecl
          };
          completion.hint = function(cm, data, completion) {
            var from = Pos(data.line, data.token.start);
            var to = Pos(data.line, data.token.end);
            cm.replaceRange(completion.varDecl.name, from, to);
          };
          varDecl.completion = completion;
        }
        items.push(completion);
      }
      vars = vars.next;
    }
  }

  // --------------- populate function functions ---------------------
  
  function getParamLabel(varDecl) {
    var dataType = varDecl.dataType || varDecl.dataType || 'any';
    var name = varDecl.name;
    return name + ' as ' + dataType;
  }

  function getFunctionLabel(functionDecl) {
    var name = functionDecl.name;
    var params = functionDecl.params;
    var label = name + '(';
    var p = '';
    while (params) {
      var varDecl = params.varDecl;
      p = getParamLabel(varDecl) + p;
      params = params.next;
      if (params != null)
        p = ', ' + p;
    }
    label += p;
    label += ')';
    return label;
  }

  function populateDeclaredFunctions(s, declaredFunctions, items) {
    if (declaredFunctions) {
      for ( var i = 0; i < declaredFunctions.length; i++) {
        var functionDecl = declaredFunctions[i];
        var name = functionDecl.name;
        if (name && startsWithString(name, s)) {
          var completion = functionDecl.completion;
          if (!completion) {
            completion = {
              "text" : getFunctionLabel(functionDecl),
              "className" : "CodeMirror-hint-function",
              "functionDecl" : functionDecl
            };
            completion.hint = function(cm, data, completion) {

              var functionDecl = completion.functionDecl;              
              var name = functionDecl.name;
              // create content to insert
              var firstParam = null;
              var name = functionDecl.name;
              var params = functionDecl.params;
              var content = name + '(';
              var p = '';
              while (params) {
                var varDecl = params.varDecl;
                firstParam = varDecl.name;
                p = varDecl.name + p;
                params = params.next;
                if (params != null)
                  p = ',' + p;
              }
              content += p;
              content += ')';
              
              var from = Pos(data.line, data.token.start);
              var to = Pos(data.line, data.token.end);
              cm.replaceRange(content, from, to);
              cm.setCursor(Pos(data.line, data.token.start + name.length + 1));
              if (firstParam != null) {
                // the function to insert hasparameters, select the first parameter.
                cm.setSelection(Pos(data.line, data.token.start + name.length
                    + 1), Pos(data.line, data.token.start + name.length + 1
                    + firstParam.length));
              }
            };
            functionDecl.completion = completion;
          }
          items.push(completion);
        }
      }
    }
  }

  // --------------- populate imported modules funtions ---------------------
  
  function populateImportedModules(s, importedModules, items) {
    if (importedModules) {
      for ( var i = 0; i < importedModules.length; i++) {
        var importedModule = importedModules[i];
        var name = importedModule.prefix;
        if (name && startsWithString(name, s)) {
          var completion = importedModule.completion;
          if (!completion) {
            completion = {
              "text" : importedModule.prefix + ' - ' + importedModule.namespaceURI,
              "className" : "CodeMirror-hint-module",
              "importedModule" : importedModule
            };
            completion.hint = function(cm, data, completion) {
              var from = Pos(data.line, data.token.start);
              var to = Pos(data.line, data.token.end);
              cm.replaceRange(importedModule.prefix, from, to);
            };
            importedModule.completion = completion;
          }
          items.push(completion);
        }
      }
    }
  }

  function getImportedModule(importedModules, prefix) {
    if (importedModules) {
      for ( var i = 0; i < importedModules.length; i++) {
        var importedModule = importedModules[i];
        var name = importedModule.prefix;
        if (name == prefix) {
          return importedModule;
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
          completion = {
            "text" : module.uri,
            "className" : "CodeMirror-hint-module-ns",
            "module" : module
          };
          completion.hint = function(cm, data, completion) {
            var label = completion.module.uri;
            var from = Pos(data.line, data.token.start + 1), to = null;
            var location = completion.module.location;
            if (location) {
              var quote = data.token.string.charAt(0);
              label += quote + ' at ' + quote + location + quote + ';';
              var length = cm.getLine(cm.getCursor().line).length
              to = Pos(data.line, length);
            } else {
              to = Pos(data.line, data.token.end - 1);
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
    label += '(';
    var params = f.params;
    if (params) {
      for ( var i = 0; i < params.length; i++) {
        if (i > 0)
          label += ', ';
        var param = params[i];
        label += '$' + param.name;
        var as = param.as;
        if (as && as.length > 0)
          label += ' as ' + as;
      }
    }
    label += ')';
    var as = f.as;
    if (as && as.length > 0)
      label += ' as ' + as;

    var completion = {
      "moduleFunction" : f,
      "text" : label,
      "className" : "CodeMirror-hint-function"
    };
    completion.hint = function(cm, data, completion) {
      var firstParam = null;
      var name = prefix + ':' + completion.moduleFunction.name;
      var label = name;
      label += '(';
      var params = completion.moduleFunction.params;
      if (params) {
        for ( var i = 0; i < params.length; i++) {
          var param = params[i];
          var paramName = '$' + param.name;
          if (i == 0) {
            firstParam = paramName;
          } else {
            label += ', ';
          }
          label += paramName;
        }
      }
      label += ')';
      var from = Pos(data.line, data.token.start);
      var to = Pos(data.line, data.token.end);
      cm.replaceRange(label, from, to);
      cm.setCursor(Pos(data.line, data.token.start + name.length + 1));
      if (firstParam != null) {
        cm.setSelection(Pos(data.line, data.token.start + name.length + 1),
            Pos(data.line, data.token.start + name.length + 1
                + firstParam.length));
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
      if (name && startsWithString(name, funcName)) {
        populateModuleFunction(prefix, f, items);
      }
    }
  }

  // --------------- completion utils ---------------------

  function getCompletions(items, cur, token, options, showHint) {
    var sortedItems = items.sort(function(a, b) {
      var s1 = a.text;// getKeyWord(a);
      var s2 = b.text;// getKeyWord(b);
      var nameA = s1.toLowerCase(), nameB = s2.toLowerCase()
      if (nameA < nameB) // sort string ascending
        return -1
      if (nameA > nameB)
        return 1
      return 0 // default return value (no sorting)
    });
    var data = {
      list : sortedItems,
      from : Pos(cur.line, token.start),
      to : Pos(cur.line, token.end),
      line : cur.line,
      token : token
    };

    if (options && options.async) {
      showHint(data);
    } else {
      return data;
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
              if (tprop.type == "keyword" && tprop.string == "namespace") {
                // here we are in the case with namespace
                // aaa="mynames...
                var s = getStartsWith(cur, token, 1);
                populateModuleNamespaces(s, items)
              }
            }
          }
          break;
        }
        break;
      }
      break;
    case "variable":
    case null:
      // do the completion about variable, declared functions and modules.

      // completion should be ignored for parameters function declaration :
      // check if the current token is not inside () of a declared function.
      var functionDecl = token.state.functionDecl;
      if (functionDecl && functionDecl.paramsParsing == true) {
        return getCompletions(items, cur, token, options, showHint);
      }
      // completion should be ignored for variable declaration : check if there
      // are not "let", "for" or "variable" keyword before the current token
      var previous = getPreviousToken(editor, cur, tprop);
      if (previous) {
        previous = getPreviousToken(editor, cur, previous);
        if (previous && previous.type == "keyword" && previous.string == "let"
            || previous.string == "variable" || previous.string == "for")
          // ignore completion
          return getCompletions(items, cur, token, options, showHint);
      }

      // show let, declared variables.
      var s = null;
      if (previous && previous.type == "keyword" && previous.string == "if"
          && token.string == "(") {
        // in the case if(, the search string should be empty.
        s = "";
      } else {
        s = getStartsWith(cur, token);
      }

      // test if s ends with ':'
      var prefix = null;
      var funcName = null;
      var prefixIndex = s.lastIndexOf(':');
      if (prefixIndex != -1) {
        // retrieve the prfix anf function name.
        prefix = s.substring(0, prefixIndex);
        funcName = s.substring(prefixIndex + 1, s.length);
      }

      if (prefix) {
        // search the declared module which checks the prefix
        // ex import module namespace dls = "http://marklogic.com/xdmp/dls" at
        // "/MarkLogic/dls.xqy";
        // prefix=dls will retrieve the module "http://marklogic.com/xdmp/dls"
        // at "/MarkLogic/dls.xqy";
        var importedModule = getImportedModule(token.state.importedModules,
            prefix);
        // it exists an included module with the given prefix, search the module
        // with the given namespace URI (ex:"http://marklogic.com/xdmp/dls").
        var module = findModuleByDeclaration(importedModule);
        if (module) {
          populateModuleFunctions(module, prefix, funcName, items);
        }
      }

      // local vars (let, for, ...)
      var vars = token.state.localVars;
      populateVars(s, vars, items);

      var context = token.state.context;
      while (context) {
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
      var importedModules = token.state.importedModules
      populateImportedModules(s, importedModules, items);

    }
    return getCompletions(items, cur, token, options, showHint)
  }
  ;
})();
