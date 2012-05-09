CodeMirror.defineMIME("text/x-erlang", "erlang");

CodeMirror.defineMode("erlang", function(cmCfg, modeCfg) {

  var wellKnownWords = (function() {
    var wkw = {};
    function setType(t) {
      return function () {
        for (var i = 0; i < arguments.length; i++)
          wkw[arguments[i]] = t;
      };
    }

    // keywords
    setType("keyword")(
        "after","begin","catch","case","cond","end","fun","if",
        "let","of","query","receive","try","when");

    // operators
    setType("builtin")(
       "and","andalso","band","bnot","bor","bsl","bsr","bxor",
        "div","not","or","orelse","rem","xor",
        "+","-","*","/",">",">=","<","=<","=:=","==","=/=","/="
    );

    //guards
    setType("builtin")(
        "is_atom","is_binary","is_bitstring","is_boolean","is_float",
        "is_function","is_integer","is_list","is_number","is_pid",
        "is_port","is_record","is_reference","is_tuple",
        "atom","binary","bitstring","boolean","function","integer","list",
        "number","pid","port","record","reference","tuple");

    //BIFs
    setType("builtin")(
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
        "tuple_to_list","unlink","unregister","whereis");

    return wkw;
  })();

  function switchState(source, setState, f) {
    setState(f);
    return f(source, setState);
  }

  var smallRE = /[a-z_]/;
  var largeRE = /[A-Z]/;
  var digitRE = /[0-9]/;
  var hexitRE = /[0-9A-Fa-f]/;
  var octitRE = /[0-7]/;
  var idRE = /[a-z_A-Z0-9]/;

  function normal(source, setState) {
    if (source.eatSpace()) {
      return null;
    }

    // attribute
    if ( source.sol() && source.peek() == '-') {
      source.skipTo("(");
      return "attribute";      // must handle type specs here
    }

    var ch = source.next();

    // comment
    if (ch == '%') {
      source.skipToEnd();
      return "comment";
    }

    // macro
    if (ch == '?') {
      source.eatWhile(idRE);
      return "macro";
    }

    // record
    if ( ch == "#") {
      source.eatWhile(idRE);
      return "record";
    }

    // char
    if ( ch == "$") {
      if (source.next() == "\\") {
        if (!source.eatWhile(octitRE)) {
          source.next();
        }
      }
      return "string";
    }

    // quoted atom
    if (ch == '\'') {
      return switchState(source, setState, singleQuote);
    }

    // string
    if (ch == '"') {
      return switchState(source, setState, doubleQuote);
    }

    // variable
    if (largeRE.test(ch)) {
      source.eatWhile(idRE);
      if (source.peek() == "(") {
        return "fun";
      }
      return "variable";
    }

    // atom/keyword/BIF/function
    if (smallRE.test(ch)) {
      source.eatWhile(idRE);

      if (source.peek() == "/") {
        source.next();
        if (source.eatWhile(digitRE)) {
          return "fun";
        }else{
          source.backUp(1);
          return "atom";
        }
      }

      var w = source.current();
      if (w in wellKnownWords) {
        return wellKnownWords[w];
      }

      if (source.peek() == "(") {
        return "function";
      }

      if (source.peek() == ":") {
        if (w == "erlang") {
          return "builtin";
        } else {
          return "function";
        }
      }

      return "atom";
    }

    if (digitRE.test(ch)) {
      source.eatWhile(digitRE);
      if (source.eat('#')) {
        source.eatWhile(digitRE);
      } else {
        if (source.eat('.')) {
          source.eatWhile(digitRE);
        }
        if (source.eat(/[eE]/)) {
          source.eat(/[-+]/);
          source.eatWhile(digitRE);
        }
      }
      return "number";
    }

    return "normal";
  }

  function doubleQuote(source, setState) {
    while (!source.eol()) {
      var ch = source.next();
      if (ch == '"') {
        setState(normal);
        return "string";
      }
      if (ch == '\\') {
        source.next();
      }
    }
    setState(normal);
    return "error";
  }

  function singleQuote(source, setState) {
    while (!source.eol()) {
      var ch = source.next();
      if (ch == '\'') {
        setState(normal);
        return "atom";
      }
      if (ch == '\\') {
        source.next();
      }
    }
    setState(normal);
    return "error";
  }

  return {
    startState: function ()  { return { f: normal }; },

    token: function(stream, state) {
      return state.f(stream, function(s) { state.f = s; });
    }
  };

});
