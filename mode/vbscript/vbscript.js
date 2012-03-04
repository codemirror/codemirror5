
// Array of keywords that must be the first word in a line and/or declare a variant
var arrayDeclarationKeyword = new Array();
arrayDeclarationKeyword[0]="Const";
arrayDeclarationKeyword[1]="Dim";
arrayDeclarationKeyword[2]="ReDim";
arrayDeclarationKeyword[3]="Sub";
arrayDeclarationKeyword[4]="End Sub";

// Array of keywords that must be followed by a space
var arrayPostfixKeyword = new Array();
arrayPostfixKeyword[0] = "Set";
arrayPostfixKeyword[1] = "=";
arrayPostfixKeyword[2] = "Call";
arrayPostfixKeyword[3] = "For";
arrayPostfixKeyword[4] = "To";
arrayPostfixKeyword[5] = "Next";
arrayPostfixKeyword[6]="If";
arrayPostfixKeyword[7]="<>";
arrayPostfixKeyword[8]="<=";
arrayPostfixKeyword[9]=">=";
arrayPostfixKeyword[10]=">";
arrayPostfixKeyword[11]="<";
arrayPostfixKeyword[12]="Do";
arrayPostfixKeyword[13]="Until";
arrayPostfixKeyword[14]="Select";


// Array of keywords that must be PRECEEDED by a space
// var arraySpacePrefixKeyword = new Array();
// arraySpacePrefixKeyword[0]="Nothing";
// arraySpacePrefixKeyword[1]="True";
// arraySpacePrefixKeyword[2]="False";


var arrayKeyword = new Array();
arrayKeyword[0]="VbCrLf";
arrayKeyword[1]="Set";
arrayKeyword[2]="ReDim Preserve";
arrayKeyword[3]="End If";
arrayKeyword[4]="Else";
arrayKeyword[5]="Then";
arrayKeyword[6]="ElseIf";
arrayKeyword[7]="Exit Sub";
arrayKeyword[8]="Case";
arrayKeyword[9]="Each";
arrayKeyword[10]="End Select";
arrayKeyword[11]=" Select";
arrayKeyword[12] = "Next";
arrayKeyword[13]="+";
arrayKeyword[14]="-";
arrayKeyword[14]="&";
arrayKeyword[15]="Nothing";
arrayKeyword[16]="True";
arrayKeyword[17]="False";
arrayKeyword[18]="Loop";

var arrayMethod = new Array(); // have following parenthesis
arrayMethod[0]=".Execute";
arrayMethod[1]="UBound";
arrayMethod[2]="CreateObject";
arrayMethod[3]="UCase";
arrayMethod[4]="LCase";
arrayMethod[5]=".GetFolder";
arrayMethod[6]=".Quit";
arrayMethod[7]=".Sleep";
arrayMethod[8]=".GetDetailsOf";
arrayMethod[9]="CLng";
arrayMethod[10]="CInt";
arrayMethod[11]="CDate";
arrayMethod[12]="CStr";


var arrayError = new Array(); // Err handling keywords
arrayError[0] = "Err.Clear";
arrayError[1] = "Err.Number";
arrayError[2] = "Err.Description";
arrayError[3] = "On Error Resume Next";

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

