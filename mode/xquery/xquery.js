/*
Copyright (C) 2011 by MarkLogic Corporation
Author: Mike Brevoort <mike@brevoort.com>
        Angelo Zerr <angelo.zerr@gmail.com> - manage context for xquery-hint.js

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
CodeMirror.defineMode("xquery", function(config) {

  var trackContext = config.trackContext;  
  
  // The keywords object is set to the result of this self executing
  // function. Each keyword is a property of the keywords object whose
  // value is {type: atype, style: astyle}
  var keywords = function(){
    // conveinence functions used to build keywords object
    function kw(type) {return {type: type, style: "keyword"};}
    var A = kw("keyword a")
      , B = kw("keyword b")
      , C = kw("keyword c")
      , operator = kw("operator")
      , atom = {type: "atom", style: "atom"}
      , punctuation = {type: "punctuation", style: null}
      , qualifier = {type: "axis_specifier", style: "qualifier"};
    
    // kwObj is what is return from this function at the end
    var kwObj = {
      'if': A, 'switch': A, 'while': A, 'for': A,
      'else': B, 'then': B, 'try': B, 'finally': B, 'catch': B,
      'element': C, 'attribute': C, 'let': C, 'implements': C, 'import': C, 'module': C, 'namespace': C, 
      'return': C, 'super': C, 'this': C, 'throws': C, 'where': C, 'private': C,      
      ',': punctuation,
      'null': atom, 'fn:false()': atom, 'fn:true()': atom
    };
    
    // a list of 'basic' keywords. For each add a property to kwObj with the value of 
    // {type: basic[i], style: "keyword"} e.g. 'after' --> {type: "after", style: "keyword"}
    var basic = ['after','ancestor','ancestor-or-self','and','as','ascending','assert','attribute','before',
    'by','case','cast','child','comment','declare','default','define','descendant','descendant-or-self',
    'descending','document','document-node','element','else','eq','every','except','external','following',
    'following-sibling','follows','for','function','if','import','in','instance','intersect','item',
    'let','module','namespace', 'at', 'node','node','of','only','or','order','parent','precedes','preceding',
    'preceding-sibling','processing-instruction','ref','return','returns','satisfies','schema','schema-element',
    'self','some','sortby','stable','text','then','to','treat','typeswitch','union','variable','version','where',
    'xquery', 'empty-sequence'];
    for(var i=0, l=basic.length; i < l; i++) { kwObj[basic[i]] = kw(basic[i]);};
    
    // a list of types. For each add a property to kwObj with the value of 
    // {type: "atom", style: "atom"}
    var types = ['xs:string', 'xs:float', 'xs:decimal', 'xs:double', 'xs:integer', 'xs:boolean', 'xs:date', 'xs:dateTime', 
    'xs:time', 'xs:duration', 'xs:dayTimeDuration', 'xs:time', 'xs:yearMonthDuration', 'numeric', 'xs:hexBinary', 
    'xs:base64Binary', 'xs:anyURI', 'xs:QName', 'xs:byte','xs:boolean','xs:anyURI','xf:yearMonthDuration'];
    for(var i=0, l=types.length; i < l; i++) { kwObj[types[i]] = atom;};
    
    // each operator will add a property to kwObj with value of {type: "operator", style: "keyword"}
    var operators = ['eq', 'ne', 'lt', 'le', 'gt', 'ge', ':=', '=', '>', '>=', '<', '<=', '.', '|', '?', 'and', 'or', 'div', 'idiv', 'mod', '*', '/', '+', '-'];
    for(var i=0, l=operators.length; i < l; i++) { kwObj[operators[i]] = operator;};
    
    // each axis_specifiers will add a property to kwObj with value of {type: "axis_specifier", style: "qualifier"}
    var axis_specifiers = ["self::", "attribute::", "child::", "descendant::", "descendant-or-self::", "parent::", 
    "ancestor::", "ancestor-or-self::", "following::", "preceding::", "following-sibling::", "preceding-sibling::"];
    for(var i=0, l=axis_specifiers.length; i < l; i++) { kwObj[axis_specifiers[i]] = qualifier; };

    return kwObj;
  }();

  // Used as scratch variables to communicate multiple values without
  // consing up tons of objects.
  var type, content;
  
  function ret(tp, style, cont) {
    type = tp; content = cont;
    return style;
  }
  
  function chain(stream, state, f) {
    state.tokenize = f;
    return f(stream, state);
  }
  
  // the primary mode tokenizer
  function tokenBase(stream, state) {
    var ch = stream.next(), 
        mightBeFunction = false,
        isEQName = isEQNameAhead(stream);
    
    // an XML tag (if not in some sub, chained tokenizer)
    if (ch == "<") {
      if(stream.match("!--", true))
        return chain(stream, state, tokenXMLComment);
        
      if(stream.match("![CDATA", false)) {
        state.tokenize = tokenCDATA;
        return ret("tag", "tag");
      }
      
      if(stream.match("?", false)) {
        return chain(stream, state, tokenPreProcessing);
      }
      
      var isclose = stream.eat("/");
      stream.eatSpace();
      var tagName = "", c;
      while ((c = stream.eat(/[^\s\u00a0=<>\"\'\/?]/))) tagName += c;
      
      return chain(stream, state, tokenTag(tagName, isclose));
    }
    // start code block
    else if(ch == "{") {
      if (trackContext) {
        updateFunctionDeclBracket(state, 1);
        pushContext(state, state.functionDecl == null)
      }
      pushStateStack(state,{ type: "codeblock"});
      return ret("", null);
    }
    // end code block
    else if(ch == "}") {
      if (trackContext) {
        updateFunctionDeclBracket(state, -1);
        popContext(state);
      }
      popStateStack(state);
      return ret("", null);
    }
    // if we're in an XML block
    else if(isInXmlBlock(state)) {
      if(ch == ">")
        return ret("tag", "tag");
      else if(ch == "/" && stream.eat(">")) {
        popStateStack(state);
        return ret("tag", "tag");
      }
      else  
        return ret("word", "variable");
    }
    // if a number
    else if (/\d/.test(ch)) {
      stream.match(/^\d*(?:\.\d*)?(?:E[+\-]?\d+)?/);
      return ret("number", "atom");
    }
    // comment start
    else if (ch === "(" && stream.eat(":")) {
      pushStateStack(state, { type: "comment"});
      return chain(stream, state, tokenComment);
    }
    // quoted string
    else if (  !isEQName && (ch === '"' || ch === "'"))
      return chain(stream, state, tokenString(ch));
    // variable
    else if(ch === "$") {
      return chain(stream, state, tokenVariable);
    }
    // assignment
    else if(ch ===":" && stream.eat("=")) {
      return ret("operator", "keyword");
    }
    // open paren
    else if(ch === "(") {
      if (trackContext) {
        updateFunctionDeclParen(state, 1);
      }
      pushStateStack(state, { type: "paren"});
      return ret("", null);
    }
    // close paren
    else if(ch === ")") {
      if (trackContext) {
        updateFunctionDeclParen(state, -1);
      }
      popStateStack(state);
      return ret("", null);
    }
    // open paren
    else if(ch === "[") {
      pushStateStack(state, { type: "bracket"});
      return ret("", null);
    }
    // close paren
    else if(ch === "]") {
      popStateStack(state);
      return ret("", null);
    }
    else {
      var known = keywords.propertyIsEnumerable(ch) && keywords[ch];

      // if there's a EQName ahead, consume the rest of the string portion, it's likely a function
      if(isEQName && ch === '\"') while(stream.next() !== '"'){}
      if(isEQName && ch === '\'') while(stream.next() !== '\''){}
      
      // gobble up a word if the character is not known
      if(!known) stream.eatWhile(/[\w\$_-]/);
      
      // gobble a colon in the case that is a lib func type call fn:doc
      var foundColon = stream.eat(":");
      
      // if there's not a second colon, gobble another word. Otherwise, it's probably an axis specifier
      // which should get matched as a keyword
      if(!stream.eat(":") && foundColon) {
        stream.eatWhile(/[\w\$_-]/);
      }
      // if the next non whitespace character is an open paren, this is probably a function (if not a keyword of other sort)
      if(stream.match(/^[ \t]*\(/, false)) {
        mightBeFunction = true;
      }
      // is the word a keyword?
      var word = stream.current();
      known = keywords.propertyIsEnumerable(word) && keywords[word];
      
      // if we think it's a function call but not yet known, 
      // set style to variable for now for lack of something better
      var functionCall = mightBeFunction && !known; 
      if(functionCall) known = {type: "function_call", style: "variable def"};
      
      // if the previous word was element, attribute, axis specifier, this word should be the name of that
      if(isInXmlConstructor(state)) {
        popStateStack(state);
        return ret("word", "variable", word);
      }
      // as previously checked, if the word is element,attribute, axis specifier, call it an "xmlconstructor" and 
      // push the stack so we know to look for it on the next word
      if(word == "element" || word == "attribute" || known.type == "axis_specifier") {
    	  pushStateStack(state, {type: "xmlconstructor"});    	
      } else {
        if (trackContext) {
          if(functionCall && state.lastType == "function") {
            // declare function xxx
    	    var functionDecl = new FunctionDecl(word);
    	    state.functionDecl = functionDecl;
    	    state.declaredFunctions.push(functionDecl);
          } else if (known.type == "then") {
    	    pushContext(state, true);
          } else if (known.type == "else") {
      	    popContext(state);
    	    pushContext(state, true);    	  
    	  }
    	}
      }
      
      if (trackContext) {
        if (state.currentVar != null  && state.currentVar.hasAs) {
    	  if(state.currentVar.dataType == null) {state.currentVar.dataType=word} else {state.currentVar.dataType += word};
        }
      
        if (state.tokenModuleParsing == null) {
    	  if (known.type == "import") state.tokenModuleParsing = known.type;
        } else {
    	  switch(state.tokenModuleParsing) {
    	  	case "import":
    	  	  state.moduleDecl = null;
    	  	  if (known.type == "module") {state.tokenModuleParsing = known.type;} else {state.tokenModuleParsing = null;}
    		  break;
    	  	case "module":
      	  	  state.moduleDecl = null;
      	  	  if (known.type == "namespace") {state.tokenModuleParsing = known.type;} else {state.tokenModuleParsing = null;}
      		  break;
    	  	case "namespace":
        	  state.moduleDecl = null;
        	  if (!known.type && word) {
        		  var moduleDecl = new ModuleDecl();
    			  moduleDecl.prefix = word;
    			  state.moduleDecl = moduleDecl;
    			  state.importedModules.push(moduleDecl);
    			  state.tokenModuleParsing = "namespacePrefix";
        	  } else {state.tokenModuleParsing = null;}
        	  break;
    	  	case "namespacePrefix":
    	  	  if (known.type == "operator" && word=="=") {state.tokenModuleParsing = "namespacePrefixEq";} else {state.tokenModuleParsing = null;state.moduleDecl = null;}          	  
          	  break; 
    	  	case "namespaceURIEnd":
        	  	  if (known.type=="at") {state.tokenModuleParsing = "namespaceLocationAt";} else {state.tokenModuleParsing = null;state.moduleDecl = null;}          	  
              	  break;            	  
            default:
            	state.tokenModuleParsing = null;state.moduleDecl = null; 	
    	  }    	  
        }
      }
      
      // if the word is known, return the details of that else just call this a generic 'word'
      return known ? ret(known.type, known.style, word) :
                     ret("word", "variable", word);
    }
  }

  // handle comments, including nested 
  function tokenComment(stream, state) {
    var maybeEnd = false, maybeNested = false, nestedCount = 0, ch;
    while (ch = stream.next()) {
      if (ch == ")" && maybeEnd) {
        if(nestedCount > 0)
          nestedCount--;
        else {
          popStateStack(state);
          break;
        }
      }
      else if(ch == ":" && maybeNested) {
        nestedCount++;
      }
      maybeEnd = (ch == ":");
      maybeNested = (ch == "(");
    }
    
    return ret("comment", "comment");
  }

  // tokenizer for string literals
  // optionally pass a tokenizer function to set state.tokenize back to when finished
  function tokenString(quote, f) {
    return function(stream, state) {
      var ch;

      if(isInString(state) && stream.current() == quote) {
        popStateStack(state);
        if(f) state.tokenize = f;
        return ret("string", "string");
      }

      pushStateStack(state, { type: "string", name: quote, tokenize: tokenString(quote, f) });

      // if we're in a string and in an XML block, allow an embedded code block
      if(stream.match("{", false) && isInXmlAttributeBlock(state)) {
        state.tokenize = tokenBase;
        return ret("string", "string"); 
      }

      
      while (ch = stream.next()) {
        if (ch ==  quote) {
          popStateStack(state);
          if(f) state.tokenize = f;
          if (state.tokenModuleParsing == "namespacePrefixEq" || state.tokenModuleParsing == "namespaceURI") {
        	  state.tokenModuleParsing = "namespaceURIEnd";
          } else if (state.tokenModuleParsing == "namespaceLocationAt" || state.tokenModuleParsing == "namespaceLocation") {
        	  state.tokenModuleParsing = null;
        	  state.moduleDecl = null;
          }          
          break;
        }
        else {
          // if we're in a string and in an XML block, allow an embedded code block in an attribute
          if(stream.match("{", false) && isInXmlAttributeBlock(state)) {
            state.tokenize = tokenBase;
            return ret("string", "string"); 
          }
          // test if it's module prefix or module uri
          if (state.tokenModuleParsing == "namespacePrefixEq") {
        	  state.moduleDecl.namespace = ch;
        	  state.tokenModuleParsing = "namespaceURI"
          } else if (state.tokenModuleParsing == "namespaceURI") {
        	  state.moduleDecl.namespace +=ch;
          } else if (state.tokenModuleParsing == "namespaceLocationAt") {
        	  state.moduleDecl.location = ch;
        	  state.tokenModuleParsing = "namespaceLocation"
          } else if (state.tokenModuleParsing == "namespaceLocation") {
        	  state.moduleDecl.location += ch;
          }          
        }
      }
      
      return ret("string", "string");
    };
  }
  
  var GLOBAL_SCOPE = "global", LOCAL_SCOPE = "local", PARAM_SCOPE = "func_param";
  
  function getVarScope(state) {
	  if(state.lastType=="variable") {
		  return GLOBAL_SCOPE;
	  }
	  if(state.lastType=="let" || state.lastType=="for") {
		  return LOCAL_SCOPE;
	  }
	  var functionDecl = state.functionDecl;
	  if(functionDecl && functionDecl.paramsParsing){
		  return PARAM_SCOPE;
	  }
	  return null;
  }
  
  // tokenizer for variables
  function tokenVariable(stream, state) {
    var isVariableChar = /[\w\$_-]/;

    // a variable may start with a quoted EQName so if the next character is quote, consume to the next quote
    if(stream.eat("\"")) {
      while(stream.next() !== '\"'){};
      stream.eat(":");
    } else {
      stream.eatWhile(isVariableChar);
      if(!stream.match(":=", false)) stream.eat(":");
    }
    stream.eatWhile(isVariableChar);
    state.tokenize = tokenBase;

    var scope = getVarScope(state);
    if(scope != null) {
    	var varname = stream.current();
        register(varname, state, scope);
    }    
    return ret(scope, "variable");
  }  
  
  function register(varname, state, scope) {
    function inList(list) {
    	if (!list)
    		return false;
	    for (var v = list; v; v = v.next)
	      if (v.name == varname) return true;
	    return false;
    }
    var varDecl = new VarDecl(varname, scope);
    state.currentVar = varDecl;
    switch(scope) {
      case GLOBAL_SCOPE:
        if (inList(state.globalVars)) return;
	      state.globalVars = {varDecl: varDecl, next: state.globalVars};
	    break;    
      case LOCAL_SCOPE:
        if (inList(state.localVars)) return;
	      state.localVars = {varDecl: varDecl, next: state.localVars};  
	    break;
      case PARAM_SCOPE:
    	var functionDecl = state.functionDecl;    	  
    	varDecl.functionDecl = functionDecl;
        if (inList(functionDecl.params)) return;
          functionDecl.params = {varDecl: varDecl, next: functionDecl.params};
        break;
      }
  }
  
  // tokenizer for XML tags
  function tokenTag(name, isclose) {
    return function(stream, state) {
      stream.eatSpace();
      if(isclose && stream.eat(">")) {
        popStateStack(state);
        state.tokenize = tokenBase;
        return ret("tag", "tag");
      }
      // self closing tag without attributes?
      if(!stream.eat("/"))
        pushStateStack(state, { type: "tag", name: name, tokenize: tokenBase});
      if(!stream.eat(">")) {
        state.tokenize = tokenAttribute;
        return ret("tag", "tag");
      }
      else {
        state.tokenize = tokenBase;        
      }
      return ret("tag", "tag");
    };
  }

  // tokenizer for XML attributes
  function tokenAttribute(stream, state) {
    var ch = stream.next();
    
    if(ch == "/" && stream.eat(">")) {
      if(isInXmlAttributeBlock(state)) popStateStack(state);
      if(isInXmlBlock(state)) popStateStack(state);
      return ret("tag", "tag");
    }
    if(ch == ">") {
      if(isInXmlAttributeBlock(state)) popStateStack(state);
      return ret("tag", "tag");
    }
    if(ch == "=")
      return ret("", null);
    // quoted string
    if (ch == '"' || ch == "'")
      return chain(stream, state, tokenString(ch, tokenAttribute));

    if(!isInXmlAttributeBlock(state)) 
      pushStateStack(state, { type: "attribute", name: name, tokenize: tokenAttribute});

    stream.eat(/[a-zA-Z_:]/);
    stream.eatWhile(/[-a-zA-Z0-9_:.]/);
    stream.eatSpace();

    // the case where the attribute has not value and the tag was closed
    if(stream.match(">", false) || stream.match("/", false)) {
      popStateStack(state);
      state.tokenize = tokenBase;      
    }

    return ret("attribute", "attribute");
  }
  
  // handle comments, including nested 
  function tokenXMLComment(stream, state) {
    var ch;
    while (ch = stream.next()) {
      if (ch == "-" && stream.match("->", true)) {
        state.tokenize = tokenBase;        
        return ret("comment", "comment");
      }
    }
  }


  // handle CDATA
  function tokenCDATA(stream, state) {
    var ch;
    while (ch = stream.next()) {
      if (ch == "]" && stream.match("]", true)) {
        state.tokenize = tokenBase;        
        return ret("comment", "comment");
      }
    }
  }

  // handle preprocessing instructions
  function tokenPreProcessing(stream, state) {
    var ch;
    while (ch = stream.next()) {
      if (ch == "?" && stream.match(">", true)) {
        state.tokenize = tokenBase;        
        return ret("comment", "comment meta");
      }
    }
  }
  
  
  // functions to test the current context of the state
  function isInXmlBlock(state) { return isIn(state, "tag"); }
  function isInXmlAttributeBlock(state) { return isIn(state, "attribute"); }
  function isInXmlConstructor(state) { return isIn(state, "xmlconstructor"); }
  function isInString(state) { return isIn(state, "string"); }

  function isEQNameAhead(stream) { 
    // assume we've already eaten a quote (")
    if(stream.current() === '"')
      return stream.match(/^[^\"]+\"\:/, false);
    else if(stream.current() === '\'')
      return stream.match(/^[^\"]+\'\:/, false);
    else
      return false;
  }
  
  function isIn(state, type) {
    return (state.stack.length && state.stack[state.stack.length - 1].type == type);    
  }
  
  function pushStateStack(state, newState) {
    state.stack.push(newState);
  }
  
  function popStateStack(state) {
    state.stack.pop();
    var reinstateTokenize = state.stack.length && state.stack[state.stack.length-1].tokenize;
    state.tokenize = reinstateTokenize || tokenBase;
  }
  
  // Context
  
  function pushContext(state, keepLocals) {
	state.context = {prev: state.context, vars: state.localVars, keepLocals: keepLocals};
	state.localVars = null;
  }
  
  function popContext(state) {
	if (state.context) {
	  state.localVars = state.context.vars;
	  state.context = state.context.prev;		  		
	}
  }

  function ModuleDecl() {
	  this.prefix = null;
	  this.namespaceURI = null;
	  this.location = null;
  }
  
  function VarDecl(name, scope) {
	  this.name = name;
	  this.scope = scope;
	  this.hasAs = false;
	  this.dataType = null;
	  this.functionDecl = null;
  }
  
  function FunctionDecl(name) {
	  this.name = name;
	  this.bracket = 0;
	  this.paramsParsing = null;
	  this.paren = 0;
	  this.params = null;
  }
  
  function updateFunctionDeclBracket(state, i) {
	  var functionDecl = state.functionDecl;
	  if (functionDecl) {
		  functionDecl.bracket+=i;
		  if (functionDecl.bracket <= 0){
			// end of the function, pop the whole context
			var context = state.context;
			while(context) {
				var prev = context.prev;
				if (prev == null) {
					context = null;
				} else {
					popContext(state);
					context = state.context;
				}
			}
			state.functionDecl = null;  
		  }		  
	  }
  }
  
  function updateFunctionDeclParen(state, i) {
    var functionDecl = state.functionDecl;
	if (functionDecl) {
	  functionDecl.paren+=i;
	  if (functionDecl.paren <= 0) {
		  functionDecl.paramsParsing = false;
	  } else if (functionDecl.paren == 1 && functionDecl.paramsParsing == null){
		  functionDecl.paramsParsing = true;
	  }		  
    }
  }

  // the interface for the mode API
  return {
    startState: function() {
      return {
        tokenize: tokenBase,        
        stack: [],
        lastType: null,
        context : null,
        declaredFunctions : [],
        functionDecl : null,
        currentVar : null,
        importedModules : [],
        moduleDecl : null,
        tokenModuleParsing : null
      };
    },

    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      var currentVar = state.currentVar;
      var style = state.tokenize(stream, state);
      state.lastType = type;      
      if (currentVar != null) {
    	  if (currentVar.hasAs == false) {
    		  if ((style == "keyword" && type == "as")) {
    			  currentVar.hasAs = true;
    		  } else  {
    			  state.currentVar = null;
    		  }
    	  } else {
    		  if(type != "operator") state.currentVar = null;
      	  }
      }
      return style;
    }
  };

});

CodeMirror.defineMIME("application/xquery", "xquery");