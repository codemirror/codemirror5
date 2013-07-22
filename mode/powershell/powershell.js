CodeMirror.defineMode("powershell", function() {
    var ERRORCLASS = 'error';

    function wordRegexp(words) {
        return new RegExp("^((" + words.join(")|(") + "))\\b");
    }

    var wordOperators = wordRegexp(['-eq', '-ne', '-gt', '-lt', '-le', '-ge']);
    var commonkeywords = ['begin', 'break', 'continue', 'do', 'default', 'else', 'elseif',
  					  'end', 'filter', 'for', 'foreach', 'function', 'if', 'in', 'param', 
						  'process', 'return', 'switch', 'until', 'where', 'while'];

	var isOperatorChar = /[+\-*&^%:=<>!|\/]/;
	var isString = /("|')(\`?.)*?\1/;
	
	var keywords = wordRegexp(commonkeywords);
    //var builtins = wordRegexp(commonBuiltins);

    var indentInfo = null;

    // tokenizers
    function tokenBase(stream, state) {
        

		
		// Handle Comments        
		//var ch = stream.peek();
		
		   if (stream.match(keywords)) {
           return('variable-2');
        }
		
		   if (stream.match(isString)) {
           return('string');
        }
		
			if (stream.match(wordOperators)) {
           return('variable-2');
        }
			if (stream.match(isOperatorChar)) {
			return('variable-1');
		}
			
		
		// Handle Variables

				
        // Handle Number Literals
        if (stream.match(/^[0-9\.]/, false)) {
            var floatLiteral = false;
            // Floats
            if (stream.match(/^\d*\.\d+(e[\+\-]?\d+)?/i)) { floatLiteral = true; }
            if (stream.match(/^\d+\.\d*/)) { floatLiteral = true; }
            if (stream.match(/^\.\d+/)) { floatLiteral = true; }
            if (floatLiteral) {
                // Float literals may be "imaginary"
                stream.eat(/J/i);
                return 'number';
            }
            // Integers
            var intLiteral = false;
            // Hex
            if (stream.match(/^0x[0-9a-f]+/i)) { intLiteral = true; }
            // Binary
            if (stream.match(/^0b[01]+/i)) { intLiteral = true; }
            // Octal
            if (stream.match(/^0o[0-7]+/i)) { intLiteral = true; }
            // Decimal
            if (stream.match(/^[1-9]\d*(e[\+\-]?\d+)?/)) {
                // Decimal literals may be "imaginary"
                stream.eat(/J/i);
                // TODO - Can you have imaginary longs?
                intLiteral = true;
            }
            // Zero by itself with no other piece of number.
            if (stream.match(/^0(?![\dx])/i)) { intLiteral = true; }
            if (intLiteral) {
                // Integer literals may be "long"
                stream.eat(/L/i);
                return 'number';
            }
        }

		var ch = stream.next();

		if (ch === '$') {
			if (stream.eat('{')) {
				state.tokenize = tokenVariable;
				return tokenVariable(stream, state);
			} else {
			stream.eatWhile(/[\w\\\-]/);
			return 'variable-2';
			}
		}
		
        if (ch === '<' && stream.eat('#')) {
			state.tokenize = tokenComment;
			return tokenComment(stream, state);
			}
        
		if (ch === '#') {
            stream.skipToEnd();
            return 'comment';
        }

		if (ch === '@' && stream.eat('\"')) {
				state.tokenize = tokenMultiString;
				return tokenMultiString(stream, state);
			}
		
		//if (isOperatorChar.test(ch)) {
		//	stream.eat;
			//stream.next;
		//	return("variable-1");
		//	}

        stream.next();
        return ERRORCLASS;
    }

	
	function tokenComment(stream, state) {
    var maybeEnd = false, ch;
      while ((ch = stream.next()) != null) {
      if (maybeEnd && ch == ">") {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch === '#');
    }
    return("comment");
	}
   
	function tokenVariable(stream, state) {
      while ((ch = stream.next()) != null) {
      if (ch == "}") {
        state.tokenize = tokenBase;
        break;
      }
    }
    return("variable-2");
	}
	
	function tokenMultiString(stream, state) {
    var maybeEnd = false, ch;
      while ((ch = stream.next()) != null) {
      if (maybeEnd && ch == "@") {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch === '"');
    }
    return("string");
	}
	
    function tokenLexer(stream, state) {
        //indentInfo = null;
        var style = state.tokenize(stream, state);
        //var current = stream.current();
        return style;
    }

    var external = {
        startState: function(basecolumn) {
            return {
              tokenize: tokenBase,
              scopes: [{offset:basecolumn || 0, type:'py'}],
              lastToken: null,
              lambda: false,
              dedent: 0
          };
        },

        token: function(stream, state) {
            var style = tokenLexer(stream, state);
            state.lastToken = {style:style, content: stream.current()};
            if (stream.eol() && stream.lambda) {
                state.lambda = false;
            }

            return style;
        },

		blockCommentStart: "<#",
		blockCommentEnd: "#>",
        lineComment: "#"
    };
    return external;
});

CodeMirror.defineMIME("text/x-powershell", "powershell");
