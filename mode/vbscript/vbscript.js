
var arrayKeywordC = ["Call","Case","CDate","Clear","CInt","CLng","Const","CStr"];
var arrayKeywordD = ["Description","Dim","Do"];
var arrayKeywordE = ["Each","Else","ElseIf","End","Err","Error","Exit"];
var arrayKeywordF = ["False","For","Function"];
var arrayKeywordI = ["If"];
var arrayKeywordL = ["LCase","Loop","LTrim"];
var arrayKeywordN = ["Next","Nothing","Now","Number"];
var arrayKeywordO = ["On"];
var arrayKeywordP = ["Preserve"];
var arrayKeywordQ = ["Quit"];
var arrayKeywordR = ["ReDim","Resume","RTrim"];
var arrayKeywordS = ["Select","Set","Sub"];
var arrayKeywordT = ["Then","To","Trim","True"];
var arrayKeywordU = ["UBound","UCase","Until" ];
var arrayKeywordV = ["VbCr","VbCrLf","VbLf","VbTab"];



CodeMirror.defineMode("vbscript", function() {
  return {
    token: function(stream) {

      stream.eatSpace();
	  var ch = stream.next();      
      
      if (ch == "'") {
      	ch = stream.next();
      	stream.skipToEnd();
      	return "comment";
      }
      else if (ch == '"') {
      	stream.skipTo('"');
      	return "string";
      }
      else if (ch == "=" || ch == "-" || ch == "+"|| ch == "*"|| ch == "/" || ch == '<' || ch == '>' || ch == '&'){
      	return "operator";
      }
      
      // Let's tokenize our stream
      var strToken = '';
      strToken = strToken + ch;
      while (ch  && ch !='"' && ch !="'" && ch !=" " && ch !="," && ch !="(" && ch !=")" && ch !="." &&  ch != stream.eol()){
      	ch = stream.next();
      	if (ch  && ch !='"' && ch !="'" && ch !=" " && ch !="," && ch !="(" && ch !=")" && ch !=")" && ch !=".")     	strToken = strToken + ch;
      }
      
      
      // Comments take precedence over all.  Strings then take precedence.
      if(ch !='"' && ch !="'"  ) {
	      strToken = strToken.toLowerCase();
	      
	      if (strToken[0] == 'c')
	      	for(var i=0;i<arrayKeywordC.length;i++) {
	      		if ( strToken == arrayKeywordC[i].toLowerCase() ) return "keyword"; 
	      		}
	      else if (strToken[0] == 'd') 
	      	for(var i=0;i<arrayKeywordD.length;i++) {
	      		if ( strToken == arrayKeywordD[i].toLowerCase() ) return "keyword";
	      		}
	      else if (strToken[0] == 'e') 
	      	for(var i=0;i<arrayKeywordE.length;i++) {
	      		if ( strToken == arrayKeywordE[i].toLowerCase() ) return "keyword";
	      		}
	      else if (strToken[0] == 'f') 
	      	for(var i=0;i<arrayKeywordF.length;i++) {
	      		if ( strToken == arrayKeywordF[i].toLowerCase() ) return "keyword";
	      		}
	      else if (strToken[0] == 'i') 
	      	for(var i=0;i<arrayKeywordI.length;i++) {
	      		if ( strToken == arrayKeywordI[i].toLowerCase() ) return "keyword";
	      		}
	      else if (strToken[0] == 'l') 
	      	for(var i=0;i<arrayKeywordL.length;i++) {
	      		if ( strToken == arrayKeywordL[i].toLowerCase() ) return "keyword";
	      		}
	      else if (strToken[0] == 'n') 
	      	for(var i=0;i<arrayKeywordN.length;i++) {
	      		if ( strToken == arrayKeywordN[i].toLowerCase() ) return "keyword";
	      		}
	      else if (strToken[0] == 'o') 
	      	for(var i=0;i<arrayKeywordO.length;i++) {
	      		if ( strToken == arrayKeywordO[i].toLowerCase() ) return "keyword";
	      		}
	      else if (strToken[0] == 'p') 
	      	for(var i=0;i<arrayKeywordP.length;i++) {
	      		if ( strToken == arrayKeywordP[i].toLowerCase() ) return "keyword";
	      		}
	      else if (strToken[0] == 'q') 
	      	for(var i=0;i<arrayKeywordQ.length;i++) {
	      		if ( strToken == arrayKeywordQ[i].toLowerCase() ) return "keyword";
	      		}
	      else if (strToken[0] == 'r') 
	      	for(var i=0;i<arrayKeywordR.length;i++) {
	      		if ( strToken == arrayKeywordR[i].toLowerCase() ) return "keyword";
	      		}
	      else if (strToken[0] == 's') 
	      	for(var i=0;i<arrayKeywordS.length;i++) {
	      		if ( strToken == arrayKeywordS[i].toLowerCase() ) return "keyword";
	      		}
	      else if (strToken[0] == 't') 
	      	for(var i=0;i<arrayKeywordT.length;i++) {
	      		if ( strToken == arrayKeywordT[i].toLowerCase() ) return "keyword";
	      		}
	      else if (strToken[0] == 'u') 
	      	for(var i=0;i<arrayKeywordU.length;i++) {
	      		if ( strToken == arrayKeywordU[i].toLowerCase() ) return "keyword";
	      		}
	      else if (strToken[0] == 'v') 
	      	for(var i=0;i<arrayKeywordV.length;i++) {
	      		if ( strToken == arrayKeywordV[i].toLowerCase() ) return "keyword";
	      		}
	     
      		}
      
      
    }
    
  };
});

CodeMirror.defineMIME("text/vbscript", "vbscript");

