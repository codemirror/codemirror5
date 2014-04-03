(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("hxml", function() {
		
  return {
	startState: function() {
      return {
        define: false,
		inString: false
      };
    },
    token: function(stream, state) {
      var ch = stream.peek();
	  var sol = stream.sol();
	
      ///* comments */
      if (ch == "#") {
        stream.skipToEnd(); return "comment";
      }
	  if (sol && ch == "-")
	  {
		  var style = "variable-2";
		  
		  stream.eat(/-/);
		  
		  if (stream.peek() == "-")
		  {
		    stream.eat(/-/);
			style = "keyword a";
		  }
		  
		  if (stream.peek() == "D")
		  {
		    stream.eat(/[D]/);
			style = "keyword c";
			state.define = true;
		  }
		  
		  stream.eatWhile(/[A-Z]/i)
		  return style;
	  }
	  
	  var ch = stream.peek();
	  
	  if (state.inString == false && ch == "'")
	  {
		state.inString = true;
		ch = stream.next();
	  }
	  
	  if (state.inString == true)
	  {
		  if (stream.skipTo("'"))
		  {
			  
		  }
		  else
		  {
			  stream.skipToEnd();
		  }
		  
		  if (stream.peek() == "'")
		  {
			  stream.next();
			  state.inString = false;
		  }
		  
		  return "string";
	  }
	  
      stream.next();
      return null;
    }
  };
});

CodeMirror.defineMIME("text/x-hxml", "hxml");

});
