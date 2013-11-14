(function () {
  function forEach(arr, f) {
    for (var i = 0, e = arr.length; i < e; ++i) f(arr[i]);
  }

  function arrayContains(arr, item) {
    if (!Array.prototype.indexOf) {
      var i = arr.length;
      while (i--) {
        if (arr[i] === item) {
          return true;
        }
      }
      return false;
    }
    return arr.indexOf(item) != -1;
  }
  
  //Call this from outside environment to add more words to the list that might be specific to your component
  //or taken from a current view model. They will show first in the list.
  CodeMirror.addKeywords=function(keywords){
    addedKeywords=keywords;
  };
  
  function scriptHint(editor, _keywords, getToken) {
    // Find the token at the cursor
    var cur = editor.getCursor(), token = getToken(editor, cur), tprop = token;
    
    // If it's not a 'word-style' token, ignore the token.
    if (!/^[\w$_]*$/.test(token.string)) {
        token = tprop = {start: cur.ch, end: cur.ch, string: "", state: token.state,
                         className: null};
    }

    if (!context) var context = [];
    context.push(tprop);

    var completionList = getCompletions(token, context, _keywords);
   
    return {list: completionList,
            from: CodeMirror.Pos(cur.line, token.start),
            to: CodeMirror.Pos(cur.line, token.end)};
  }
  
  //Offers completion for C-sharp, C++, Java and Scala
  function csharpHint(editor) {	
    return scriptHint(editor, getAllKeywords(csharpKeywords), function (e, cur) {return e.getTokenAt(cur);});
    }
  CodeMirror.csharpHint = csharpHint; // deprecated
  CodeMirror.registerHelper("hint", "csharp", csharpHint);
  
  function javaHint(editor) {
    return scriptHint(editor, getAllKeywords(javaKeywords), function (e, cur) {return e.getTokenAt(cur);});
    }
  CodeMirror.javaHint = javaHint; // deprecated
  CodeMirror.registerHelper("hint", "java", javaHint);
  
  function scalaHint(editor) {
    return scriptHint(editor, getAllKeywords(scalaKeywords), function (e, cur) {return e.getTokenAt(cur);});
    }
  CodeMirror.scalaHint = scalaHint; // deprecated
  CodeMirror.registerHelper("hint", "scala", scalaHint);
  
  var addedKeywords="";
  
  //below are all the reserved words plus some of the more common method names
  //but the list is no way pretending to be complete
  var clikeKeywordString="abstract assert boolean break byte case catch char class const do default double else enum false "+
  "finally for float goto if int interface long new null private protected public return short static string switch throw "+
  "this try var void true using volatile while ";
  
  var csharpKeywords="as await base bool checked continue decimal delegate event explicit extern finally fixed "+
  "foreach implicit in internal is lock namespace object operator out override params readonly ref sbyte sealed sizeof stackalloc "+
  "typeof uint ulong unchecked unsafe ushort virtual add alias ascending descending dynamic from get "+
  "global group into join let orderby partial remove select set value var yield "+
  "Byte Char Contains Count DateTime DateTimeOffset Decimal Double IndexOf "+
  "LastIndexOf FirstIndexOf Format Substring Trim Length continue delete function Remove Split Replace with "+
  "Range Guid Int16 Int32 Int64 Object SByte Single String TimeSpan UInt16 UInt32 UInt64 virtual";
  
  var javaKeywords="concat extends final format implements import instanceof native "+
  "package strictfp  super synchronized throws transient "+
  "Boolean Byte Character CharSequence Class ClassLoader Cloneable Comparable "+
  "Compiler Double Exception Float Integer length Long Math Number Object Package Pair Process printl"+
  "Runtime Runnable SecurityManager Short StackTraceElement StrictMath String "+
  "replace replaceAll replaceFirst substring toUpperCase toLowerCase trim"+
  "StringBuffer System Thread ThreadGroup ThreadLocal Throwable Triple Void";
  
  var scalaKeywords="assume require print println printf readLine readBoolean readByte readShort " +
  "readChar readInt readLong readFloat readDouble " +
  "AnyVal App Application Array BufferedIterator BigDecimal BigInt Char Console Either " +
  "Enumeration Equiv Error Exception Fractional Function IndexedSeq Integral Iterable " +
  "Iterator List Map Numeric Nil NotNull Option Ordered Ordering PartialFunction PartialOrdering " +
  "Product Proxy Range Responder Seq Serializable Set Specializable Stream StringBuilder " +
  "StringContext Symbol Throwable Traversable TraversableOnce Tuple Unit Vector :: #:: ";
  
  function getAllKeywords(keywordString) {
    var newKeywords=(addedKeywords+clikeKeywordString+keywordString).split(" ");
    return newKeywords;
  }
 
  function getCompletions(token, context, _keywords) {
    var found = [], start = token.string;
    function maybeAdd(str) {
     //searches with all lower case
    if (str.indexOf(start.toLowerCase()) == 0 && !arrayContains(found, str)) found.push(str);
    //searches with first letter upper case
    if (str.indexOf(start.charAt(0).toUpperCase() + start.slice(1)) == 0 && !arrayContains(found, str)) found.push(str);
    }

  function gatherCompletions(_obj) {
    forEach(_keywords,maybeAdd); 
    }

    if (context) {
      var obj = context.pop(), base;

      if (obj.type== "variable")
        base = obj.string;
      while (base != null && context.length)
        base = base[context.pop().string];
      if (base != null) gatherCompletions(base);
    }
    return found;
  }
})();
