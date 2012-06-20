// TODO; distinguish "." as end of form, and "." as record field operator

// block; "begin", "case", "fun", "if", "receive", "try": closed by "end"
// block internal; "after", "catch", "of"
// guard; "when", closed by "->"
// "->" opens a clause, closed by ";" or "."
// "<<" opens a binary, closed by ">>"
// "," appears in arglists, lists, tuples and terminates lines of code
// "." resets indentation to 0
// obsolete; "cond", "let", "query"

CodeMirror.defineMIME("text/x-erlang", "erlang");

CodeMirror.defineMode("erlang", function(cmCfg, modeCfg) {

  function rval(state,type) {
    //     erlang             -> CodeMirror tag
    switch (type) {
      case "atom":        return "atom";
      case "attribute":   return "attribute";
      case "builtin":     return "builtin";
      case "comment":     return "comment";
      case "fun":         return "meta";
      case "function":    return "tag";
      case "guard":       return "property";
      case "keyword":     return "keyword";
      case "macro":       return "variable-2";
      case "number":      return "number";
      case "operator":    return "operator";
      case "record":      return "bracket";
      case "string":      return "string";
      case "type":        return "def";
      case "variable":    return "variable";
      case "error":       return "error";
      case "separator":   return null;
      case "open_paren":  return null;
      case "close_paren": return null;
      default:            return null;
    }
  }

  var typeWords = [
    "-type", "-spec", "-export_type", "-opaque"];

  var keywordWords = [
    "after","begin","catch","case","cond","end","fun","if",
    "let","of","query","receive","try","when"];

  var separatorWords = [
    "->",";",",","."];

  var operatorWords = [
    "and","andalso","band","bnot","bor","bsl","bsr","bxor",
    "div","not","or","orelse","rem","xor"];

  var symbolWords = [
    "+","-","*","/",">",">=","<","=<","=:=","==","=/=","/=","||","<-"];

  var openParenWords = [
    "<<","(","[","{"];

  var closeParenWords = [
    "}","]",")",">>"];

  var guardWords = [
    "is_atom","is_binary","is_bitstring","is_boolean","is_float",
    "is_function","is_integer","is_list","is_number","is_pid",
    "is_port","is_record","is_reference","is_tuple",
    "atom","binary","bitstring","boolean","function","integer","list",
    "number","pid","port","record","reference","tuple"];

  var bifWords = [
    "abs","adler32","adler32_combine","alive","apply","atom_to_binary",
    "atom_to_list","binary_to_atom","binary_to_existing_atom",
    "binary_to_list","binary_to_term","bit_size","bitstring_to_list",
    "byte_size","check_process_code","contact_binary","crc32",
    "crc32_combine","date","decode_packet","delete_module",
    "disconnect_node","element","erase","exit","float","float_to_list",
    "garbage_collect","get","get_keys","group_leader","halt","hd",
    "integer_to_list","internal_bif","iolist_size","iolist_to_binary",
    "is_alive","is_atom","is_binary","is_bitstring","is_boolean",
    "is_float","is_function","is_integer","is_list","is_number","is_pid",
    "is_port","is_process_alive","is_record","is_reference","is_tuple",
    "length","link","list_to_atom","list_to_binary","list_to_bitstring",
    "list_to_existing_atom","list_to_float","list_to_integer",
    "list_to_pid","list_to_tuple","load_module","make_ref","module_loaded",
    "monitor_node","node","node_link","node_unlink","nodes","notalive",
    "now","open_port","pid_to_list","port_close","port_command",
    "port_connect","port_control","pre_loaded","process_flag",
    "process_info","processes","purge_module","put","register",
    "registered","round","self","setelement","size","spawn","spawn_link",
    "spawn_monitor","spawn_opt","split_binary","statistics",
    "term_to_binary","time","throw","tl","trunc","tuple_size",
    "tuple_to_list","unlink","unregister","whereis"];

  var ignoreWords = [
    ",", "catch", "after", "of", "cond", "let", "query"];


  var smallRE      = /[a-z_]/;
  var largeRE      = /[A-Z_]/;
  var digitRE      = /[0-9]/;
  var octitRE      = /[0-7]/;
  var anumRE       = /[a-z_A-Z0-9]/;
  var symbolRE     = /[\+\-\*\/<>=\|:]/;
  var openParenRE  = /[<\(\[\{]/;
  var closeParenRE = /[>\)\]\}]/;
  var sepRE        = /[\->\.,]/;

  function isMember(element,list) {
    return (-1 < list.indexOf(element));
  }

  function isPrev(stream,string) {
    var start = stream.start;
    var len = string.length;
    if (len <= start) {
      var word = stream.string.slice(start-len,start);
      return word == string;
    }else{
      return false;
    }
  }

  function tokenize(stream, state) {
    if (stream.eatSpace()) {
      return null;
    }

    // attributes and type specs
    if (state.indent == 0 && stream.peek() == '-') {
      stream.next();
      if (stream.eat(smallRE) && stream.eatWhile(anumRE)) {
        if (isMember(stream.current(),typeWords)) {
          return rval(state,"type");
        }else{
          return rval(state,"attribute");
        }
      }
      stream.backUp(1);
    }

    var ch = stream.next();

    // comment
    if (ch == '%') {
      stream.skipToEnd();
      return rval(state,"comment");
    }

    // macro
    if (ch == '?') {
      stream.eatWhile(anumRE);
      return rval(state,"macro");
    }

    // record
    if ( ch == "#") {
      stream.eatWhile(anumRE);
      return rval(state,"record");
    }

    // char
    if ( ch == "$") {
      if (stream.next() == "\\") {
        if (!stream.eatWhile(octitRE)) {
          stream.next();
        }
      }
      return rval(state,"string");
    }

    // quoted atom
    if (ch == '\'') {
      if (singleQuote(stream)) {
        return rval(state,"atom");
      }else{
        return rval(state,"error");
      }
    }

    // string
    if (ch == '"') {
      if (doubleQuote(stream)) {
        return rval(state,"string");
      }else{
        return rval(state,"error");
      }
    }

    // variable
    if (largeRE.test(ch)) {
      stream.eatWhile(anumRE);
      return rval(state,"variable");
    }

    // atom/keyword/BIF/function
    if (smallRE.test(ch)) {
      stream.eatWhile(anumRE);

      if (stream.peek() == "/") {
        stream.next();
        if (stream.eatWhile(digitRE)) {
          return rval(state,"fun");      // f/0 style fun
        }else{
          stream.backUp(1);
          return rval(state,"atom");
        }
      }

      var w = stream.current();

      if (isMember(w,keywordWords)) {
        pushToken(state,stream);
        return rval(state,"keyword");           // keyword
      }
      if (stream.peek() == "(") {
        if (isMember(w,bifWords) &&
            (!isPrev(stream,":") || isPrev(stream,"erlang:"))) {
          return rval(state,"builtin");         // BIF
        }else{
          return rval(state,"function");        // function
        }
      }
      if (isMember(w,guardWords)) {
        return rval(state,"guard");             // guard
      }
      if (isMember(w,operatorWords)) {
        return rval(state,"operator");          // operator
      }
      if (stream.peek() == ":") {
        if (w == "erlang") {
          return rval(state,"builtin");          // external BIF call
        } else {
          return rval(state,"function");          // function application
        }
      }
      return rval(state,"atom");
    }

    // number
    if (digitRE.test(ch)) {
      stream.eatWhile(digitRE);
      if (stream.eat('#')) {
        stream.eatWhile(digitRE);    // 16#10  style integer
      } else {
        if (stream.eat('.')) {       // float
          stream.eatWhile(digitRE);
        }
        if (stream.eat(/[eE]/)) {
          stream.eat(/[-+]/);        // float with exponent
          stream.eatWhile(digitRE);
        }
      }
      return rval(state,"number");               // normal integer
    }

    if (nongreedy(stream,openParenRE,openParenWords)) {
      pushToken(state,stream);
      return rval(state,"open_paren");
    }

    if (nongreedy(stream,closeParenRE,closeParenWords)) {
      pushToken(state,stream);
      return rval(state,"close_paren");
    }

    if (greedy(stream,sepRE,separatorWords)) {
      pushToken(state,stream);
      return rval(state,"separator");
    }

    if (greedy(stream,symbolRE,symbolWords)) {
      return rval(state,"operator");
    }

    return null;
  }

  function nongreedy(stream,re,words) {
    if (stream.current().length == 1 && re.test(stream.current())) {
      stream.backUp(1);
      while (re.test(stream.peek())) {
        stream.next();
        if (isMember(stream.current(),words)) {
          return true;
        }
      }
      stream.backUp(stream.current().length-1);
    }
    return false;
  }

  function greedy(stream,re,words) {
    if (stream.current().length == 1 && re.test(stream.current())) {
      while (re.test(stream.peek())) {
        stream.next();
      }
      while (0 < stream.current().length) {
        if (isMember(stream.current(),words)) {
          return true;
        }else{
          stream.backUp(1);
        }
      }
      stream.next();
    }
    return false;
  }

  function doubleQuote(stream) {
    return quote(stream, '"', '\\');
  }

  function singleQuote(stream) {
    return quote(stream,'\'','\\');
  }

  function quote(stream,quoteChar,escapeChar) {
    while (!stream.eol()) {
      var ch = stream.next();
      if (ch == quoteChar) {
        return true;
      }else if (ch == escapeChar) {
        stream.next();
      }
    }
    return false;
  }

  function Token(stream) {
    this.token = stream.current();
    this.col = stream.column();
    this.indent = stream.indentation();
  }

  function popToken(state) {
    return state.tokenStack.pop();
  }

  function peekToken(state) {
    var len = state.tokenStack.length;
    if ( len == 0 ) {
      return "";
    }else{
      return state.tokenStack[len-1].token;
    }
  }

  function pushToken(state,stream) {
    var token = stream.current();
    var prev_token = peekToken(state);
    if (isMember(token,ignoreWords)) {
      return false;
    }else if (drop_both(prev_token,token)) {
      popToken(state);
      return false;
    }else if (drop_first(prev_token,token)) {
      popToken(state);
      return pushToken(state,stream);
    }else{
      state.tokenStack.push(new Token(stream));
      return true;
    }
  }

  function drop_first(open, close) {
    switch (open+" "+close) {
      case "when ->":       return true;
      case "-> end":        return true;
      case "-> .":          return true;
      case ". .":           return true;
      default:              return false;
    }
  }

  function drop_both(open, close) {
    switch (open+" "+close) {
      case "( )":         return true;
      case "[ ]":         return true;
      case "{ }":         return true;
      case "<< >>":       return true;
      case "begin end":   return true;
      case "case end":    return true;
      case "fun end":     return true;
      case "if end":      return true;
      case "receive end": return true;
      case "try end":     return true;
      case "-> ;":        return true;
      default:            return false;
    }
  }

  return {
    startState:
      function() {
        return {tokenStack: [],
                indent: 0};
      },

    token:
      function(stream, state) {
        return tokenize(stream, state);
      },

    indent:
      function(state, textAfter) {
        return state.indent;
      }
  };
});
