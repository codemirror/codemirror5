CodeMirror.defineMode("vbscript", function() {
  var regexVBScriptKeyword = / Call | Case | CDate | Clear | CInt | CLng | Const | CStr | Description | Dim | Do | Each | Else | ElseIf | End | Err | Error | Exit | False | For | Function | If | LCase | Loop | LTrim | Next | Nothing | Now | Number | On | Preserve | Quit | ReDim | Resume | RTrim | Select | Set | Sub | Then | To | Trim | True | UBound | UCase | Until | VbCr | VbCrLf | VbLf | VbTab /im;
  var VBScriptElectricChars = /[(). =+\-<>*'"]/;
  return {
    token: function(stream) {
      stream.eatSpace();
	  var ch=stream.next();
      if(ch=="'"){
      	ch = stream.next();
      	stream.skipToEnd();
      	return "comment";}
      else if (ch == '"'){
      	stream.skipTo('"');
      	return "string";}
      else if (ch == ' '){
      	return null;}
      var strToken = '';
      while(ch && ch != stream.eol() && !VBScriptElectricChars.test(ch) ){
      	strToken=strToken+ch; 
      	ch=stream.next();} 
      if(ch&&ch!=' ') return null;
	  if(regexVBScriptKeyword.test(' '+strToken+' ')) return "keyword";}};
});
CodeMirror.defineMIME("text/vbscript", "vbscript");
