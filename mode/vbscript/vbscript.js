CodeMirror.defineMode("vbscript", function() {
  return {
    token: function(stream) {

      stream.eatSpace();
	  var ch = stream.next();      
      
       if (ch == '"') {
       	ch = stream.next();
      	stream.skipTo('"');
      	return "string";
      }
      if (ch == "'") {
      	ch = stream.next();
      	stream.skipToEnd();
      	return "comment";
      }
    }
  };
});

CodeMirror.defineMIME("text/vbscript", "vbscript");

