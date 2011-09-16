CodeMirror.defineMode("tiddlywiki", function(config, parserConfig) {
  var indentUnit = config.indentUnit;
  var jsonMode = parserConfig.json;

  // Tokenizer

  var textwords = function(){
    function kw(type) {return {type: type, style: "text"};}
    return { 
    };
  }();

  var keywords = function(){
    function kw(type) {return {type: type, style: "macro"};}
    return { 
		"allTags": kw('allTags')
		, "closeAll": kw('closeAll')
		, "list": kw('list')
		, "newJournal": kw('newJournal')
		, "newTiddler": kw('newTiddler')
		, "permaview": kw('permaview')
		, "saveChanges": kw('saveChanges')
		, "search": kw('search')
		, "slider": kw('slider')
		, "tabs": kw('tabs')
		, "tag": kw('tag')
		, "tagging": kw('tagging')
		, "tags": kw('tags')
		, "tiddler": kw('tiddler')
		, "timeline": kw('timeline')
		, "today": kw('today')
		, "version": kw('version')
		, "option": kw('option')
		
    	, "with": kw('with')
    	, "filter": kw('filter')
    };
  }();

  var isSpaceName = /[\w_\-]/i;
  
  function chain(stream, state, f) {
    state.tokenize = f;
    return f(stream, state);
  }

  // used for strings
  function nextUntilUnescaped(stream, end) {
    var escaped = false, next;
    while ((next = stream.next()) != null) {
      if (next == end && !escaped)
        return false;
      escaped = !escaped && next == "\\";
    }
    return escaped;
  }

  // Used as scratch variables to communicate multiple values without
  // consing up tons of objects.
  var type, content;
  function ret(tp, style, cont) {
    type = tp; content = cont;
    return style;
  }

/*
  function jsTokenBlock(stream, state) {
    var sol = stream.sol();
    var ch = stream.peak();
    
    if () {
    }
    else if () {
    }
  }
  */
  
  function jsTokenBase(stream, state) {
    var sol = stream.sol();
    var ch = stream.next(), tch;

	// check start of line blocks    
    if (sol && /[<\/\*!{}#;:\-]/.test(ch)) {
		if (ch == '-' && stream.match(/^\-\-\-+$/)) {
			return ret('hr', 'hr');
		}
		if (ch == '/' && stream.match(/^\*\*\*$/)) {
			return ret('string', 'string');
		}
		if (ch == '*' && stream.match(/^\*\*\/$/)) {
			return ret('string', 'string');
		}
		if (ch == '<' && stream.match(/^<<$/)) {
			return ret('string', 'string');
		}
		if (ch == '{' && stream.match(/^{{$/)) {
			return ret('string', 'string');
		} 
		else if (ch == '{' && stream.match(/^{{/) && stream.match(/.*}}}/, false)) {
			return ret('string', 'string');
		}
		if (ch == '}' && stream.match(/^}}$/)) {
			return ret('string', 'string');
		}
		if (ch == '/' && stream.match(/^\/{{{$/)) {
			return ret('string', 'string');
		}
		if (ch == '/' && stream.match(/^\/}}}$/)) {
			return ret('string', 'string');
		}

		if (ch == "!") {	// tw header
		    stream.skipToEnd();
		    return ret("header", "header");
		}
		if (ch == "*") {	// tw list
		    stream.eatWhile('*');
		    return ret("list", "list");
		}
		if (ch == "#") {	// tw numbered list
		    stream.eatWhile('#');
		    return ret("list", "list");
		}
		if (ch == ";") {	// tw list
		    stream.eatWhile(';');
		    return ret("list", "list");
		}
		if (ch == ":") {	// tw list
		    stream.eatWhile(':');
		    return ret("list", "list");
		}
    }
	if (!sol) {
		if (ch == '{' && stream.match(/^{{/)) {
			return ret('string', 'string');
		}
		if (ch == '}' && stream.match(/^}}/)) {
			return ret('string', 'string');
		}
	}
    // just a little string indicator
	if (ch == '"') {
      return ret('string', 'string');
    }
    if (/[\[\]]/.test(ch)) {	// check for [[..]]
		if (stream.peek() == ch) {
			stream.next();
			return ret('brace', 'brace');
		}
    }
    if (ch == "@") {
      stream.eatWhile(isSpaceName);
      return ret("lin-external", "link-external");
    }      
    if (/\d/.test(ch)) {
      stream.eatWhile(/\d/);
      return ret("number", "number");
    }
    if (ch == "/") {	// tw invisible comment
      if (stream.eat("%")) {
        return chain(stream, state, twTokenComment);
      }
      else if (stream.eat("/_")) { // TODO conflict with http:// ..
        return chain(stream, state, twTokenEm);
      }
    }
    if (ch == "_") {	// tw underline
      if (stream.eat("_")) {
        return chain(stream, state, twTokenUnderline);
      }
    }    
    if (ch == "-x") {	// TODO -x .. deactivated; tw strikethrough
      if (stream.eat("-")) {
        return chain(stream, state, twTokenStrike);
      }
    }    
    if (ch == "'") {	// tw bold
      if (stream.eat("'")) {
        return chain(stream, state, twTokenStrong);
      }
    }    
    if (ch == "<") {	// tw macro
      if (stream.eat("<")) {
        return chain(stream, state, twTokenMacro);
      }
    }
    else {
		return ret(ch);
    }


      stream.eatWhile(/[\w\$_]/);
      var word = stream.current(), 
          known = textwords.propertyIsEnumerable(word) && textwords[word];

 //     console.log(word, 'known:', known);
      
      return known ? ret(known.type, known.style, word) :
                     ret("text", null, word);

  }

  function twTokenString(quote) {
    return function(stream, state) {
      if (!nextUntilUnescaped(stream, quote))
        state.tokenize = jsTokenBase;
      return ret("string", "string");
    };
  }

  // tw invisible comment
  function twTokenComment(stream, state) {	
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = jsTokenBase;
        break;
      }
      maybeEnd = (ch == "%");
    }
    return ret("comment", "comment");
  }

  // tw strong / bold
  function twTokenStrong(stream, state) {	
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "'" && maybeEnd) {
        state.tokenize = jsTokenBase;
        break;
      }
      maybeEnd = (ch == "'");
    }
    return ret("text", "strong");
  }

  // tw em / italic
  function twTokenEm(stream, state) {
  console.log('em: ');	
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = jsTokenBase;
        break;
      }
      maybeEnd = (ch == "/");
    }
    return ret("text", "em");
  }


  // tw underlined text
  function twTokenUnderline(stream, state) {	
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "_" && maybeEnd) {
        state.tokenize = jsTokenBase;
        break;
      }
      maybeEnd = (ch == "_");
    }
    return ret("text", "underlined");
  }

  // tw strike through text looks ugly 
  // TODO just line through the next 2 chars if possible.
  function twTokenStrike(stream, state) {	
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "-" && maybeEnd) {
        state.tokenize = jsTokenBase;
        break;
      }
      maybeEnd = (ch == "-");
    }
    return ret("text", "line-through");
  }


  function twTokenMacro(stream, state) {	// macro
	var ch, tmp, word, known;
	
	if (stream.current() == '<<') {
		return ret('brace', 'macro');
	}

	ch = stream.next();
	if (!ch) {
		state.tokenize = jsTokenBase;
		return ret(ch);
	}
	if (ch == ">") {
		if (stream.peek() == '>') {
			stream.next();
			state.tokenize = jsTokenBase;
			return ret("brace", "macro");
		}
	}

    stream.eatWhile(/[\w\$_]/);
	word = stream.current();
	known = keywords.propertyIsEnumerable(word) && keywords[word];
	
	if (known) {
	  return ret(known.type, known.style, word);
	}
	else {
	  return ret("macro", null, word);
	}
  }
  // Interface

  return {
    startState: function(basecolumn) {
      return {
        tokenize: jsTokenBase,
        indented: 0
      };
    },

    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);
      return style;
    },

    electricChars: ""
  };
});

CodeMirror.defineMIME("text/x-tiddlywiki", "tiddlywiki");
