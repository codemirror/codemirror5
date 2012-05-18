// erlang    -> CodeMirror tag
//
// atom      -> atom
// attribute -> attribute
// builtin   -> builtin
// comment   -> comment
// error     -> error
// fun       -> meta
// function  -> tag
// guard     -> property
// keyword   -> keyword
// macro     -> variable-2
// number    -> number
// operator  -> operator
// record    -> bracket
// string    -> string
// type      -> def
// variable  -> variable

CodeMirror.defineMIME("text/x-erlang", "erlang");

CodeMirror.defineMode("erlang", function(cmCfg, modeCfg) {

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
        if (stream.peek() == "(") {
          return "attribute";
        }else if (isMember(stream.current(),typeWords)) {
          return "def";
        }else{
          return null;
        }
      }
      stream.backUp(1);
    }

    var ch = stream.next();

    // comment
    if (ch == '%') {
      stream.skipToEnd();
      return "comment";
    }

    // macro
    if (ch == '?') {
      stream.eatWhile(anumRE);
      return "variable-2";
    }

    // record
    if ( ch == "#") {
      stream.eatWhile(anumRE);
      return "bracket";
    }

    // char
    if ( ch == "$") {
      if (stream.next() == "\\") {
        if (!stream.eatWhile(octitRE)) {
          stream.next();
        }
      }
      return "string";
    }

    // quoted atom
    if (ch == '\'') {
      if (singleQuote(stream)) {
        return "atom";
      }else{
        return "error";
      }
    }

    // string
    if (ch == '"') {
      if (doubleQuote(stream)) {
        return "string";
      }else{
        return "error";
      }
    }

    // variable
    if (largeRE.test(ch)) {
      stream.eatWhile(anumRE);
      return "variable";
    }

    // atom/keyword/BIF/function
    if (smallRE.test(ch)) {
      stream.eatWhile(anumRE);

      if (stream.peek() == "/") {
        stream.next();
        if (stream.eatWhile(digitRE)) {
          return "meta";      // f/0 style fun
        }else{
          stream.backUp(1);
          return "atom";
        }
      }

      var w = stream.current();

      if (isMember(w,keywordWords)) {
        return "keyword";           // keyword
      }
      if (stream.peek() == "(") {
        if (isMember(w,bifWords) &&
            (!isPrev(stream,":") || isPrev(stream,"erlang:"))) {
          return "builtin";         // BIF
        }else{
          return "tag";             // function
        }
      }
      if (isMember(w,guardWords)) {
        return "property";          // guard
      }
      if (isMember(w,operatorWords)) {
        return "operator";          // operator
      }
      if (stream.peek() == ":") {
        if (w == "erlang") {
          return "builtin";          // external BIF call
        } else {
          return "tag";              // function application
        }
      }
      return "atom";
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
      return "number";               // normal integer
    }

    if (nongreedy(stream,openParenRE,openParenWords)) {
      return null;
    }

    if (nongreedy(stream,closeParenRE,closeParenWords)) {
      return null;
    }

    if (greedy(stream,sepRE,separatorWords)) {
      return null;
    }

    if (greedy(stream,symbolRE,symbolWords)) {
      return "operator";
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

  function Token(token,pos) {
    this.token = token;
    this.pos = pos;
  }

  function popToken(tokenStack) {
    return tokenStack.pop();
  }

  function peepToken(tokenStack) {
    return tokenStack[tokenStack.length-1];
  }

  function pushToken(tokenStack,token,pos) {
    return tokenStack.push(new Token(token,pos));
  }

  return {
    startState:
      function() {
        return {tokenStack: pushToken(new Array(),".",0),
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
