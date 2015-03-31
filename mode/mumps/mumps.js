// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE


/*
	This MUMPS Language script was constructed using vbscript.js as a template.
	Modified lines are generally annotated, or deleted and replaced by lines
        annotated // SIS.
*/

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("mumps", function(conf, parserConf) {
    var ERRORCLASS = 'error';

    function wordRegexp(words) {
        return new RegExp("^((" + words.join(")|(") + "))\\b", "i");
    }

    var singleOperators = new RegExp("^[\\+\\-\\*/&#!_?\\\\<>=\\'\\[\\]]"); // SIS - Modified
    var doubleOperators = new RegExp("^(('=)|(<=)|(>=)|('>)|('<)|([[)|(]])|(^$))"); // SIS - Modified
    var singleDelimiters = new RegExp('^[\\.,:]'); //SIS - Add ':'
    var brakets = new RegExp('^[\\(\\)]');
    var identifiers = new RegExp("^[%A-Za-z][A-Za-z0-9]*"); // SIS - Modified
    var singletons = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ%'; // SIS - Kludge
    var commandKeywords = ['break','close','do','else','for','goto', 'halt', 'hang', 'if', 'job','kill','lock','merge','new','open', 'quit', 'read', 'set', 'tcommit', 'trollback', 'tstart', 'use', 'view', 'write', 'xecute', 'b','c','d','e','f','g', 'h', 'i', 'j','k','l','m','n','o', 'q', 'r', 's', 'tc', 'tro', 'ts', 'u', 'v', 'w', 'x'];
    //SIS - The following list includes instrinsic functions _and_ special variables
    var intrinsicFuncsWords = ['\\$ascii', '\\$char', '\\$data', '\\$ecode', '\\$estack', '\\$etrap', '\\$extract', '\\$find', '\\$fnumber', '\\$get', '\\$horolog', '\\$io', '\\$increment', '\\$job', '\\$justify', '\\$length', '\\$name', '\\$next', '\\$order', '\\$piece', '\\$qlength', '\\$qsubscript', '\\$query', '\\$quit', '\\$random', '\\$reverse', '\\$select', '\\$stack', '\\$test', '\\$text', '\\$translate', '\\$view', '\\$x', '\\$y', '\\$a', '\\$c', '\\$d', '\\$e', '\\$ec', '\\$es', '\\$et', '\\$f', '\\$fn', '\\$g', '\\$h', '\\$i', '\\$j', '\\$l', '\\$n', '\\$na', '\\$o', '\\$p', '\\$q', '\\$ql', '\\$qs', '\\$r', '\\$re', '\\$s', '\\$st', '\\$t', '\\$tr', '\\$v', '\\$z'];
    var intrinsicFuncs = wordRegexp(intrinsicFuncsWords);
    var stringPrefixes = '"';
    var command = wordRegexp(commandKeywords);
    var label = false; // SIS - Line label context
    var commandMode=0; // SIS - MUMPS requires exactly one space between command and argument
 
    // SIS - Indent would apply to DO blocks but is not implemented.
    function indent(_stream, state) {
      state.currentIndent++;
    }

    function dedent(_stream, state) { // SIS See note above
      state.currentIndent--;
    }

    // tokenizers
    function tokenBase(stream, state) {

	if (stream.sol()) {
	    label = true;
            commandMode = 0;
	}

	// SIS - The <space> character has meaning in MUMPS. Ignoring consecutive
	// spaces would interfere with interpreting whether the next non-space
	// character belongs to the command or argument context.

	// Examine each character and update a mode variable whose interpretation is:
	//   >0 => command    0 => argument    <0 => command post-conditional

/*
        if (stream.eatSpace()) {
            return 'space';
        }
*/

	var ch = stream.peek();
	if (ch === '\t') ch = ' ';	// SIS - Convert <tab> to <space>

	if (ch == ' ') {		//     - Pre-process <space>
	    label = false;
	    if (commandMode == 0)
		commandMode = 1;
	    else if ((commandMode < 0) || (commandMode == 2))
		commandMode = 0;
	}
	else if ((ch != '.') && (commandMode > 0)) {
		if (ch == ':')
		    commandMode = -1;	// SIS - Command post-conditional
		else
		    commandMode = 2;
	}

	// SIS - End of <space> character processing 
	

	if ((ch === "(") || (ch === '\u0009')) {  // SIS Do not color parameter list as line tag
	    label = false;
	}

        // SIS - MUMPS comment starts with ';'
        if (ch === ";") {	 // SIS - Replace single quote with semi-colon ("'" with ";")
            stream.skipToEnd();
            return 'variable-3'; // SIS - CM default comment is brown - Want M default to be green
        }

        // Number Literals // SIS/RLM - MUMPS permits canonic number followed by concatenate operator
        if (stream.match(/^((&H)|(&O))?[0-9\.]/i, false) && !stream.match(/^((&H)|(&O))?[0-9\.]+[a-z]/i, false)) {
            var floatLiteral = false;
            // Floats
            if (stream.match(/^\d*\.\d+/i)) { floatLiteral = true; }
            else if (stream.match(/^\d+\.\d*/)) { floatLiteral = true; }
            else if (stream.match(/^\.\d+/)) { floatLiteral = true; }

            if (floatLiteral) {
                // Float literals may be "imaginary"
                stream.eat(/J/i);
                return 'number';
            }
            // Integers
            var intLiteral = false;
            // Hex
            if (stream.match(/^&H[0-9a-f]+/i)) { intLiteral = true; }
            // Octal
            else if (stream.match(/^&O[0-7]+/i)) { intLiteral = true; }
            // Decimal
            else if (stream.match(/^[1-9]\d*F?/)) {
                // Decimal literals may be "imaginary"
                stream.eat(/J/i);
                // TODO - Can you have imaginary longs?
                intLiteral = true;
            }
            // Zero by itself with no other piece of number.
            else if (stream.match(/^0(?![\dx])/i)) { intLiteral = true; }
            if (intLiteral) {
                // Integer literals may be "long"
                stream.eat(/L/i);
                return 'number';
            }
        }

        // Handle Strings
        if (stream.match(stringPrefixes)) {
            state.tokenize = tokenStringFactory(stream.current());
            return state.tokenize(stream, state);
        }

        // Handle operators and Delimiters
        if (stream.match(doubleOperators)
            || stream.match(singleOperators)) {
            //return 'operator';
            return 'variable-3';  // SIS - More salient than 'operator' in typical MUMPS contexts 
        }

        //SIS - Prevents leading '.' in DO block from falling through to error
        if (stream.match(singleDelimiters)) {
            return null;
        }


        if (stream.match(brakets)) {
            return "bracket";
        }

        if (stream.match(command) && (commandMode > 0)) {
            if (! state.doInCurrentLine)
              indent(stream,state);
            else
              state.doInCurrentLine = false;
 	    return 'header';    // SIS - Another empirical color choice - best blue for command
        }

        if (stream.match(intrinsicFuncs)) {
	    return 'keyword'; // SIS - See note above
        }

        if (stream.match(identifiers)) {
            return 'variable';
        }

	// SIS - Detect dollar-sign when not a documented intrinsic function
        if (ch === "$") {  // Start of extrinsic function
	    stream.next();
            return 'keyword';
        }

	// SIS - '^' may introduce a GVN or SSVN - Color same as function
        if (ch === "^") {
	    stream.next();
            return 'keyword';
        }

	// SIS - MUMPS Indirection
        if (ch === "@") {
	    stream.next();
            return 'string-2'; // SIS - Same idea... Want orange for indirection
        }

	if (singletons.indexOf(ch) != -1) {  //SIS - Don't understand why kludge is needed
 	    //stream.next();
            return 'variable';
	}

        // Handle non-detected items
        stream.next();
        return ERRORCLASS;
    }

    function tokenStringFactory(delimiter) {
        var singleline = delimiter.length == 1;
        var OUTCLASS = 'string';

        return function(stream, state) {
            while (!stream.eol()) {
                stream.eatWhile(/[^'"]/);
                if (stream.match(delimiter)) {
                    state.tokenize = tokenBase;
                    return OUTCLASS;
                } else {
                    stream.eat(/['"]/);
                }
            }
            if (singleline) {
                if (parserConf.singleLineStringErrors) {
                    return ERRORCLASS;
                } else {
                    state.tokenize = tokenBase;
                }
            }
            return OUTCLASS;
        };
    }

    //SIS - MUMPS does not have '.' delimited identifiers
    function tokenLexer(stream, state) {
        var style = state.tokenize(stream, state);
	// SIS - code removed here
        return style;
    }

    var external = {
        //electricChars:"dDpPtTfFeE ",	//SIS - Only auto-indent on period
	electricChars:".",		//SIS - Disregard - Smart indent is OFF
        startState: function() {
            return {
              tokenize: tokenBase,
              lastToken: null,
              currentIndent: 0,
              nextLineIndent: 0,
              doInCurrentLine: false,
              ignoreKeyword: false


          };
        },

        token: function(stream, state) {
            if (stream.sol()) {
              state.currentIndent += state.nextLineIndent;
              state.nextLineIndent = 0;
              state.doInCurrentLine = 0;
            }
            var style = tokenLexer(stream, state);

            state.lastToken = {style:style, content: stream.current()};

            if (style==='space') style=null;

	    if (label) return 'invalidchar'; // SIS - Line tags should default to red
					     //       They are not invalid, of course
            return style;
        },

        indent: function(state, textAfter) {
            var trueText = textAfter.replace(/^\s+|\s+$/g, '') ;
            if (trueText.match(closing) || trueText.match(middle)) return conf.indentUnit*(state.currentIndent-1);
            if(state.currentIndent < 0) return 0;
            return state.currentIndent * conf.indentUnit;
        }

    };
    return external;
});

CodeMirror.defineMIME("text/mumps", "mumps");	 // SIS - Don't know what this does.

});
