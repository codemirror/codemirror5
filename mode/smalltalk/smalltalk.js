CodeMirror.defineMode('smalltalk', function(config, modeConfig) {

	var specialChars = /[+\-/\\*~<>=@%|&?!.:;^]/;
	var keywords = /true|false|nil|self|super|thisContext/;

	var Context = function(tokenizer, parent) {
		this.next = tokenizer;
		this.parent = parent;
	};

	var Token = function(name, context, eos) {
		this.name = name;
		this.context = context;
		this.eos = eos;
	};

	var next = function(stream, context, state) {
		var token = new Token(null, context, false);
		var char = stream.next();

		if (char === '"') {
			token = nextComment(stream, new Context(nextComment, context));

		} else if (char === '\'') {
			token = nextString(stream, new Context(nextString, context));

		} else if (char === '#') {
			stream.eatWhile(/[^ .]/);
			token.name = 'string-2';

		} else if (char === '$') {
			stream.eatWhile(/[^ ]/);
			token.name = 'string-2';

		} else if (char === '|' && state.expectVariable) {
			token.context = new Context(nextTemporaries, context);

		} else if (/[\[\]{}()]/.test(char)) {
			token.name = 'bracket';
			token.eos = /[\[{(]/.test(char);

		} else if (specialChars.test(char)) {
			stream.eatWhile(specialChars);
			token.name = 'operator';
			token.eos = char !== ';'; // ; cascaded message expression

		} else if (/\d/.test(char)) {
			stream.eatWhile(/[\w\d]/);
			token.name = 'number'

		} else if (/[\w_]/.test(char)) {
			stream.eatWhile(/[\w\d_]/);
			token.name = state.expectVariable ? (keywords.test(stream.current()) ? 'keyword' : 'variable') : null;

		} else {
			token.eos = state.expectVariable;
		}

		return token;
	};

	var nextComment = function(stream, context) {
		stream.eatWhile(/[^"]/);
		return new Token('comment', stream.eat('"') ? context.parent : context, true);
	};

	var nextString = function(stream, context) {
		stream.eatWhile(/[^']/);
		return new Token('string', stream.eat('\'') ? context.parent : context, false);
	};

	var nextTemporaries = function(stream, context, state) {
		var token = new Token(null, context, false);
		var char = stream.next();

		if (char === '|') {
			token.context = context.parent;
			token.eos = true;

		} else {
			stream.eatWhile(/[^|]/);
			token.name = 'variable';
		}

		return token;
	}

	return {
		startState: function() {
			return {context: new Context(next, null), expectVariable: true};
		},

		token: function(stream, state) {
			if (stream.eatSpace()) {
				return null;
			}

			var token = state.context.next(stream, state.context, state);
			state.context = token.context;
			state.expectVariable = token.eos;
			return token.name;
		},
	};

});

CodeMirror.defineMIME('text/x-stsrc', {name: 'smalltalk'});