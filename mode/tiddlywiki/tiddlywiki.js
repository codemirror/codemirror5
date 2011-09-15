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
		"<<allTags": kw('allTags')
		, "<<closeAll": kw('closeAll')
		, "<<list": kw('list')
		, "<<newJournal": kw('newJournal')
		, "<<newTiddler": kw('newTiddler')
		, "<<permaview": kw('permaview')
		, "<<saveChanges": kw('saveChanges')
		, "<<search": kw('search')
		, "<<slider": kw('slider')
		, "<<tabs": kw('tabs')
		, "<<tag": kw('tag')
		, "<<tagging": kw('tagging')
		, "<<tags": kw('tags')
		, "<<tiddler": kw('tiddler')
		, "<<timeline": kw('timeline')
		, "<<today": kw('today')
		, "<<version": kw('version')
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
    if (sol && /[<\/!{}]/.test(ch)) {
		if (ch == '<' && stream.match(/<<$/)) {
			return ret('string', 'string');
		}
		else if (ch == '{' && stream.match(/{{$/)) {
			return ret('string', 'string');
		}
		else if (ch == '}' && stream.match(/}}$/)) {
			return ret('string', 'string');
		}
		else if (ch == '/' && stream.match(/\/{{{$/)) {
			return ret('string', 'string');
		}
		else if (ch == '/' && stream.match(/\/}}}$/)) {
			return ret('string', 'string');
		}
    }
    // just a little string indicator
    else if (ch == '"') {
      return ret('string', 'string');
    }
    else if (/[\[\]{}]/.test(ch)) {	// check for [[..]], {{..}}
		if (stream.peek() == ch) {
			stream.next();
			return ret('brace', 'brace');
		}
    }
    else if (ch == "@") {
      stream.eatWhile(isSpaceName);
      return ret("lin-external", "link-external");
    }      
    else if (/\d/.test(ch)) {
      stream.match(/^\d*(?:\.\d*)?(?:e[+\-]?\d+)?/);
      return ret("number", "number");
    }
    else if (sol && (ch == "!")) {	// tw header
        stream.skipToEnd();
        return ret("header", "header");
	}
    else if (sol && (ch == "*")) {	// tw list
        stream.eatWhile('*');
        return ret("list", "list");
	}
    else if (sol && (ch == "#")) {	// tw numbered list
        stream.eatWhile('#');
        return ret("list", "list");
	}
    else if (ch == "/") {	// tw invisible comment
      if (stream.eat("%")) {
        return chain(stream, state, twTokenComment);
      }
      else if (stream.eat("/_")) { // TODO
        return chain(stream, state, twTokenEm);
      }
    }
    else if (ch == "_") {	// tw underline
      if (stream.eat("_")) {
        return chain(stream, state, twTokenUnderline);
      }
    }    
    else if (ch == "-") {	// tw underline
      if (stream.eat("-")) {
        return chain(stream, state, twTokenStrike);
      }
    }    
    else if (ch == "'") {	// tw bold
      if (stream.eat("'")) {
        return chain(stream, state, twTokenStrong);
      }
    }    
    else if (ch == "<") {	// tw macro
      if (stream.eat("<")) {
        return chain(stream, state, twTokenMacro);
      }
    }
    else {
      stream.eatWhile(/[\w\$_]/);
      var word = stream.current(), 
          known = textwords.propertyIsEnumerable(word) && textwords[word];

 //     console.log(word, 'known:', known);
      
      return known ? ret(known.type, known.style, word) :
                     ret("text", null, word);
    }
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
    var ch = stream.next();
        
	if (!ch) {
		state.tokenize = jsTokenBase;
		return ret(ch);
	}
	else if (ch == ">") {
		if (stream.peek() == '>') {
			stream.next();
			state.tokenize = jsTokenBase;
			return ret("brace", "macro");
		}
	}
/*	else if (ch == "<") {
	console.log('blockquote')
		if (stream.peek() == '<') {
			stream.next();
			state.tokenize = jsTokenBase;
			return ret("brace", "blockquote");
		}
	}*/
    else {	// TODO
      stream.eatWhile(/[\w\$_]/);
      var word = stream.current(), 
          known = keywords.propertyIsEnumerable(word) && keywords[word];

//      console.log(word, 'known:', known);
      
      return known ? ret(known.type, known.style, word) :
                     ret("text", null, word);
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
