
// Array of keywords that must be the first word in a line and/or declare a variant
var arrayDeclarationKeyword = ["Const","Dim","ReDim","Sub","End Sub"];

// Array of keywords that must be followed by a space
var arrayPostfixKeyword = ["Set","=","Call","For","To","Next","If","<>","<=",">=",">","<","Do","Until","Select"];

var arrayKeyword = ["VbCrLf","Set","ReDim Preserve","End If","Else","Then","ElseIf","Exit Sub","Case","Each","End Select"," Select", "Next","+","-","&","Nothing","True","False","Loop"];

// Array of methods that have trailing parenthesis
var arrayMethod = [".Execute","UBound","CreateObject","UCase","LCase",".GetFolder",".Quit",".Sleep",".GetDetailsOf","CLng","CInt","CDate","CStr"];

// Array of Error handling keywords
var arrayError = ["Err.Clear","Err.Number","Err.Description","On Error Resume Next"]

CodeMirror.defineMode("vbscript", function() {
  return {
    token: function(stream) {

      stream.eatSpace();
      
      var ch = stream.peek();
      
       if (ch == '"') {
         ch = stream.next();
      	// stream.match('"');
      	stream.skipTo('"');
      	return "string";
      }
      if (ch == "'") {
      	ch = stream.next();
      	stream.skipToEnd();
      	return "comment";
      }
      
      for(var i=0;i<arrayDeclarationKeyword.length;i++){
      		if (stream.sol() && stream.match(arrayDeclarationKeyword[i],0,1)){
      		return "keyword";
      	}
      }
            	
      for(var i=0;i<arrayPostfixKeyword.length;i++){
      	if (stream.match(arrayPostfixKeyword[i]+" ",0,1)){
      		return "keyword";
      	}
      }
      
       for(var i=0;i<arrayKeyword.length;i++){
      	if (stream.match(arrayKeyword[i],0,1)){
      		return "keyword";
      	}
      }
      	
      for(var i=0;i<arrayMethod.length;i++){
      	if (stream.match(arrayMethod[i],0,1)){
      		stream.match(")");
      		return "attribute";
      	}
      }
      
      for(var i=0;i<arrayError.length;i++){
      	if (stream.match(arrayError[i],0,1)){
      		stream.match(")");
      		return "error";
      	}
      }
      
      ch = stream.next();

       if (ch == '('){
       		// stream.skipTo(")");
       		return "operator";
       }
       if (ch == ')'){
       		return "operator";
       }

    }
  };
});

CodeMirror.defineMIME("text/vbscript", "vbscript");
