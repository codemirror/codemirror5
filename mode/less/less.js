/*
  LESS mode - http://www.lesscss.org/
  Ported to CodeMirror by Peter Kroon <plakroon@gmail.com>
  Report bugs/issues here: https://github.com/marijnh/CodeMirror/issues
  GitHub: @peterkroon
*/

CodeMirror.defineMode("less", function(config) {
  var indentUnit = config.indentUnit, type;
  function ret(style, tp) {type = tp; return style;}
  function stringParser(stream){
    if(stream.current().length >=1){
      var sc = stream.current();
      while( ((sc.substring(sc.length-1,sc.length) === "\\" || sc.substring(sc.length-2,sc.length-1) === "\\") && stream.peek()) || stream.peek() === "/"){
        stream.next();
        stream.eatWhile(/[\w\\\-_%.{:\/]/);
        sc = stream.current();
      }
    }
  }

  var hate_list = /(^font\-family$|^background\-position$|^border\-color$)/;//we need to get rid of these kind of lists..........
  var font_type = /(^sans\-serif$|^serif$)/;//preferable, get rid of this list as well....
  var selectors = /(^\:root$|^\:nth\-child$|^\:nth\-last\-child$|^\:nth\-of\-type$|^\:nth\-last\-of\-type$|^\:first\-child$|^\:last\-child$|^\:first\-of\-type$|^\:last\-of\-type$|^\:only\-child$|^\:only\-of\-type$|^\:empty$|^\:link|^\:visited$|^\:active$|^\:hover$|^\:focus$|^\:target$|^\:lang$|^\:enabled^\:disabled$|^\:checked$|^\:first\-line$|^\:first\-letter$|^\:before$|^\:after$|^\:not$|^\:required$|^\:invalid$)/;
  var protocol = /(^http$|^https$|^file$|^ftp$)/;
  //taken from https://developer.mozilla.org/en-US/docs/Web/CSS/At-rule
  var at_rule = /(^@charset$|^@import$|^@namespace$|^@media$|^@page$|^@font\-face$|^fon\-feature\-settings$|^@keyframes$|^@supports$|^@document$)/;
  
  function tokenBase(stream, state) {
    var ch = stream.next();

    if (ch == "@") {stream.eatWhile(/[\w\-]/); return ret("meta", stream.current());}
    else if (ch == "/" && stream.eat("*")) {
      state.tokenize = tokenCComment;
      return tokenCComment(stream, state);
    } else if (ch == "<" && stream.eat("!")) {
      state.tokenize = tokenSGMLComment;
      return tokenSGMLComment(stream, state);
    } else if (ch == "=") ret(null, "compare");
      else if (ch == "|" && stream.eat("=")) return ret(null, "compare");
      else if (ch == "\"" || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    } else if (ch == "/") { // e.g.: .png will not be parsed as a class        
      if(stream.eat("/")){        
        state.tokenize = tokenSComment;
        return tokenSComment(stream, state);
      } else {
        if(type === "string" || type === "(") return ret("string", "string");
        if(state.stack[state.stack.length-1] !== undefined) return ret(null, ch);
        stream.eatWhile(/[\a-zA-Z0-9\-_.\s]/);
        if( /\/|\)|#/.test(stream.peek() || (stream.eatSpace() && stream.peek() === ")"))  || stream.eol() )return ret("string", "string"); // let url(/images/logo.png) without quotes return as string
      }
    } else if (ch == "!") {
      stream.match(/^\s*\w*/);
      return ret("keyword", "important");
    } else if (/\d/.test(ch)) {
      stream.eatWhile(/[\w.%]/);
      return ret("number", "unit");
    } else if (/[,+<>*\/]/.test(ch)) {
      if(stream.peek() === "=" || type === "a")return ret("string", "string");
      if(ch === ",")return ret(null, ch);
      return ret(null, "select-op");
    } else if (/[;{}:\[\]()~\|]/.test(ch)) {
      if(ch == ":"){
        stream.eatWhile(/[a-z\\\-]/);
        if( selectors.test(stream.current()) ){
          return ret("tag", "tag");
        } else if(stream.peek() == ":"){//::-webkit-search-decoration
          stream.next();
          stream.eatWhile(/[a-z\\\-]/);
          if(stream.current().match(/\:\:\-(o|ms|moz|webkit)\-/) || stream.current().match(/\:\:(selection)/))return ret("string", "string");
          if( selectors.test(stream.current().substring(1)) )return ret("tag", "tag");
          return ret(null, ch);
        } else {
          if(stream.current() === ":-")stream.backUp(1);//property:-12px, only handle :
          return ret(null, ch);
        }
      } else if(ch == "~"){
        if(type == "r")return ret("string", "string");//??????
      } else {
        return ret(null, ch);
      }
    } else if (ch == ".") {      
      stream.eatWhile(/[\a-zA-Z0-9\-_]/);
      if(stream.peek() === " ")stream.eatSpace();
      if(stream.peek() === ")" || type === ":")return ret("number", "unit");//rgba(0,0,0,.25);
      else if(stream.current().length >1){
        if(state.stack[state.stack.length-1] === "rule" && stream.peek() && stream.peek().match(/{|,|\+|\(|\;/) === null)return ret("number", "unit");
        if(stream.eol() && stream.current().match(/\-\d|.\d/))return ret("number", "unit");
      }else if(type === "(")return ret("string", "string"); // allow url(../image.png)
      return ret("tag", "tag");
    } else if (ch == "#") {
      //we don't eat white-space, we want the hex color and or id only
      stream.eatWhile(/[A-Za-z0-9]/);
      //check if there is a proper hex color length e.g. #eee || #eeeEEE
      if(stream.current().length == 4 || stream.current().length == 7){
        if(stream.current().match(/[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}/,false) != null){//is there a valid hex color value present in the current stream
          //when not a valid hex value, parse as id
          if(stream.current().substring(1) != stream.current().match(/[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}/,false))return ret("atom", "tag");
          //eat white-space
          stream.eatSpace();
          //when hex value declaration doesn't end with [;,] but is does with a slash/cc comment treat it as an id, just like the other hex values that don't end with[;,]
          if( /[\/<>.(){!$%^&*_\-\\?=+\|#'~`]/.test(stream.peek()) ){
            if(type === "select-op")return ret("number", "unit"); else return ret("atom", "tag");
          }
          //#time { color: #aaa }
          else if(stream.peek() === "}" )return ret("number", "unit");
          //we have a valid hex color value, parse as id whenever an element/class is defined after the hex(id) value e.g. #eee aaa || #eee .aaa
          else if( /[a-zA-Z\\]/.test(stream.peek()) )return ret("atom", "tag");
          //when a hex value is on the end of a line, parse as id
          else if(stream.eol())return ret("atom", "tag");
          //default
          else return ret("number", "unit");
        } else {//when not a valid hexvalue in the current stream e.g. #footer
          stream.eatWhile(/[\w\\\-]/);
          return ret("atom", stream.current());
        }
      } else {//when not a valid hexvalue length
        stream.eatWhile(/[\w\\\-]/);
        if(state.stack[state.stack.length-1] === "rule")return ret("atom", stream.current());return ret("atom", stream.current());
        return ret("atom", "tag");
      }
    } else if (ch == "&") {
      stream.eatWhile(/[\w\-]/);
      return ret(null, ch);
    } else {
      stream.eatWhile(/[\w\\\-_%.{]/);
      
      if(stream.current().match(/\\/) !== null){
        stringParser(stream);
        return ret("string", stream.current());
      } //else if(type === "tag")return ret("tag", "tag");
        else if(type === "string"){
        
        if(state.stack[state.stack.length-1] === "{" && stream.peek() === ":")return ret("variable", "variable");
        if(stream.peek() === "/")stream.eatWhile(/[\w\\\-_%.{:\/]/);
        if(stream.peek() === ":"){
          stream.next();
          if(stream.peek() === "/"){
            stream.eatWhile(/[\w\\\-_%.{\:\/\u00BF-\u1FFF\u2C00-\uD7FF]/);        
            //string parser
            return ret("string", stream.current());
          }else stream.backUp(1);
        }
        //fix for code below a font-family, border-color, background-position, property remains correct color, result -> more smooth editing
        if(stream.peek() === ":")return ret("variable","variable");        
        if(stream.eatSpace() && (stream.eol() || (stream.peek() && stream.peek() === "{")) )return ret("tag",stream.current());
        return ret("string", stream.current());
      } else if(stream.current().match(protocol) !== null){
        stream.eatWhile(/[\w\\\-_%.{\:\/\u00BF-\u1FFF\u2C00-\uD7FF]/);        
        //string parser
        return ret("string", stream.current());
      } else if(stream.peek() === "<" || stream.peek() === ">" || stream.peek() === "+"){
        if(type === "(" && (stream.current() === "n" || stream.current() === "-n"))return ret("string", stream.current());
        return ret("tag", "tag");
      } else if( /\(/.test(stream.peek()) ){
        if(stream.current() === "when" || stream.current() === "not")return ret("variable","variable");
        else if(state.stack[state.stack.length-1] === "@media" && stream.current() === "and")return ret("variable",stream.current());
        return ret(null, ch);
      } else if (stream.peek() === "/" && state.stack[state.stack.length-1] !== undefined){ // url(dir/center/image.png)
        //if(stream.peek() === "/")stream.eatWhile(/[\w\\\-_%.{:\/]/);
        //string parser
        stringParser(stream);
        return ret("string", stream.current());
      } else if( stream.current().match(/\-\d|\-.\d/) ){ // match e.g.: -5px -0.4 etc... only colorize the minus sign
        //commment out these 2 comment if you want the minus sign to be parsed as null -500px
        //stream.backUp(stream.current().length-1);
        //return ret(null, ch);
        //fix minus sign
        if(type === "unit" && state.stack[state.stack.length-1] !== "rule"){//but -> :nth-child(10n-1)
          var sc = stream.current();
          var scl = sc.length;
          stream.backUp(scl-1);
          if(stream.current() === "-"){
            return ret(null,sc);
          }else for(var i=0; i<scl-1; ++i)stream.next();
        }else if(stream.current().match(/[a-zA-Z0-9]/)){
          if(stream.current().length >=1)
            if(stream.peek() === ":")
              return ret("variable", "variable");
        }
        //margin: 35px 0 10px -5px; and default
        return ret("number", "unit");
      } else if( /\/|[\s\)]/.test(stream.peek() || stream.eol() || (stream.eatSpace() && stream.peek() == "/")) && stream.current().indexOf(".") !== -1){
        if(stream.current().substring(stream.current().length-1,stream.current().length) === "{"){
          stream.backUp(1);
          return ret("tag", "tag");
        }//end if
        stream.eatSpace();
        if( /[{<>.a-zA-Z\/]/.test(stream.peek())  || stream.eol() )return ret("tag", "tag"); // e.g. button.icon-plus
        return ret("string", "string"); // let url(/images/logo.png) without quotes return as string
      } else if( stream.eol() || stream.peek() == "[" || stream.peek() == "#" || type == "tag" ){
        
        stream.eatSpace();
        //if(type === "[")return ret("string",stream.current());
        if(stream.current().substring(stream.current().length-1,stream.current().length) == "{")stream.backUp(1);
        else if(state.stack[state.stack.length-1] === "font-family" && stream.current().match(font_type))return ret("keyword", "unit");
        else if(state.stack[state.stack.length-1] === "{" && stream.peek() === "[")return ret("tag",stream.current());
        //null
        else if(state.stack[state.stack.length-1] !== undefined && state.stack[state.stack.length-1].match(hate_list))return ret(null, stream.current());
        else if(type === "tag" && state.stack[state.stack.length-1] !== "{"){
          if(stream.peek() === ":" && state.stack[state.stack.length-1] === ";")return ret("variable","variable");
          if(state.stack[state.stack.length-1] === "(")return ret("string","string");//when populating -> background-image: -webkit-wht( content
          return ret("tag", "tag");
        }
        //null
        else if((type === ":" || type === "unit") && state.stack[state.stack.length-1] === "rule")return ret(null, stream.current());
        else if(state.stack[state.stack.length-1] === "rule" && type === "tag")return ret("string", stream.current());
        //null
        else if(state.stack[state.stack.length-1] === ";" && type === ":")return ret(null, stream.current());
        //else if(state.stack[state.stack.length-1] === ";" || type === "")return ret("variable", stream.current());
        else if(stream.peek() === "#" && type !== undefined && type.match(/\+|,|tag|select\-op|}|{|;/g) === null)return ret("string", stream.current());
        else if(type === "variable")return ret(null, stream.current());
        
        else if(state.stack[state.stack.length-1] === "{" && type === "comment")return ret("variable", stream.current());
        else if(state.stack.length === 0 && (type === ";" || type === "comment"))return ret("tag", stream.current());
        
        else if(state.stack[state.stack.length-1] === "{" && (type === "{" || type === "tag") && stream.current().match(/\s+/))return ret("tag", stream.current());
        else if((state.stack[state.stack.length-1] === "{" || type === ";") && state.stack[state.stack.length-1] !== "@media{")return ret("variable", stream.current());
        else if(state.stack[state.stack.length-2] === "{" && state.stack[state.stack.length-1] === ";")return ret("variable", stream.current());
        else if(type === "[" && stream.eol())return ret("number", stream.current());
        else if(type === "compare" && stream.eol())return ret("string", stream.current());//test[foo=bar]
        else if(type === "(" && state.stack[state.stack.length-1] === "rule")return ret("string",stream.current());//url(
        //null
        else if(type === "unit" && state.stack[state.stack.length-1] === ";")return ret(null,stream.current());
        //null
        else if(type === ")" && state.stack[state.stack.length-1] === "rule")return ret(null,stream.current());// let 'no-repeat' be null and not tag -> background: url(/images/logo.png) no-repeat
        
        else if(state.stack[state.stack.length-1] === "(")return ret("string","string");//when populating -> background-image: -webkit-wht( content
        
        return ret("tag", "tag");
      } else if(type == "compare" || type == "a" || type == "("){
        
        /* handles device-aspect-ratio -> @media screen and (device-aspect-ratio: 16/9) { … }*/
        if(type === "(" && state.stack[state.stack.length-1] === "(" && state.stack[state.stack.length-2] === "@media")return ret("string","string");
        /*
          fix for background, now parsed as variable and not as string
          .test {
            background: url(
              http://www.etc.......
          }
        */
        if(type === "(" && stream.current().length >=1)if(stream.peek() === ":")return ret("variable","variable");
        if(type === "(" && stream.eatSpace() && stream.peek() && stream.peek() === "{" && stream.current().match(protocol) === null)return ret("tag","tag");
        return ret("string", "string");
      } else if(type == "|" || stream.current() == "-" || type == "["){        
        if(type == "|" && stream.peek().match(/\]|=|\~/) !== null)return ret("number", stream.current());
        else if(type == "|" )return ret("tag", "tag");
        else if(type == "["){
          stream.eatWhile(/\w\-/);
          return ret("number", stream.current());
        }
        return ret(null, ch);
      } else if((stream.peek() === ":") || ( stream.eatSpace() && stream.peek() === ":")) {
        //to do: declaration without ending ; should make the next declaration set as NULL.....needed?
        //if(type !== ";" && type !== "{" && type !== "comment" && type !== "}" && state.stack[state.stack.length-1]==="rule")return ret(null,stream.current());
        stream.next();
        var t_v = stream.peek() === ":" ? true : false;
        if(!t_v){
          var old_pos = stream.pos;
          var sc = stream.current().length;
          stream.eatWhile(/[a-z\\\-]/);
          var new_pos = stream.pos;
          if(stream.current().substring(sc-1).match(selectors) !== null){
            stream.backUp(new_pos-(old_pos-1));
            return ret("tag", "tag");
          } else stream.backUp(new_pos-(old_pos-1));
        } else {
          stream.backUp(1);
        }
        if(t_v)return ret("tag", "tag"); else return ret("variable", "variable");
      } else if(state.stack[state.stack.length-1] !== undefined && state.stack[state.stack.length-1].match(hate_list)) {
        if(state.stack[state.stack.length-1] === "font-family"){
          if(stream.current().match(font_type))return ret("keyword", "unit");
          return ret("string", "string");
        }
        return ret(null, stream.current());
      } else {


        if(state.stack[state.stack.length-1] === null && type === ":")return ret(null, stream.current());
        else if(stream.current() === "and " || stream.current() === "not " || stream.current() === "when ")return ret("variable", stream.current());


        //else if((type === ")" && state.stack[state.stack.length-1] === "rule") || (state.stack[state.stack.length-2] === "{" && state.stack[state.stack.length-1] === "rule" && type === "variable"))return ret(null, stream.current());

        else if(/\^|\$/.test(stream.current()) && stream.peek().match(/\~|=/) !== null)return ret("string", "string");//att^=val

        else if(type === "unit" && state.stack[state.stack.length-1] === "rule")return ret(null, "unit");
        else if(type === "unit" && state.stack[state.stack.length-1] === ";")return ret(null, "unit");
        else if(type === ")" && state.stack[state.stack.length-1] === "rule")return ret(null, "unit");
        else if(type && type.match("@") !== null  && state.stack[state.stack.length-1] === "rule")return ret(null, "unit");
        //else if(type === "unit" && state.stack[state.stack.length-1] === "rule")return ret(null, stream.current());

        else if((type === ";" || type === "}" || type === ",") && state.stack[state.stack.length-1] === ";")return ret("tag", stream.current());
        else if((type === ";" && stream.peek() !== undefined && stream.peek().match(/{|./) === null) || (type === ";" && stream.eatSpace() && stream.peek().match(/{|./) === null))return ret("variable", stream.current());
        else if((type === "@media" && state.stack[state.stack.length-1] === "@media") || type === "@namespace")return ret("tag", stream.current());

        else if(type === "{"  && state.stack[state.stack.length-1] === ";" && stream.peek() === "{")return ret("tag", "tag");
        //null
        else if((type === "{" || type === ":") && state.stack[state.stack.length-1] === ";")return ret(null, stream.current());
        else if((state.stack[state.stack.length-1] === "{" && stream.eatSpace() && stream.peek().match(/.|#/) === null) || type === "select-op"  || (state.stack[state.stack.length-1] === "rule" && type === ",") )return ret("tag", "tag");
        else if(type === "variable" && state.stack[state.stack.length-1] === "rule")return ret("tag", "tag");
        /*
          test: -webkit-wht(
            test //when placing a space adfter test remain color of string
          );
        */
        else if(state.stack[state.stack.length-1] === "(" && (type === "{" || type === "}"))return ret("string","string");
        else if((stream.eatSpace() && stream.peek() === "{") || stream.eol() || stream.peek() === "{")return ret("tag", "tag");
        //this one messes up indentation
        //else if((type === "}" && stream.peek() !== ":") || (type === "}" && stream.eatSpace() && stream.peek() !== ":"))return(type, "tag");

        else if(type === ")" && (stream.current() == "and" || stream.current() == "and "))return ret("variable", "variable");
        else if(type === ")" && (stream.current() == "when" || stream.current() == "when "))return ret("variable", "variable");
        else if(type === ")" && (stream.current() == "not" || stream.current() == "not "))return ret("variable", "variable");

        else if(type === "{" && state.stack[state.stack.length-1] === "{" && stream.peek() && stream.peek() === ".")return ret("tag", stream.current());
        else if(type === "{" && state.stack[state.stack.length-1] === "{" && stream.eol())return ret("tag", stream.current());

        else if(type === "{" && state.stack[state.stack.length-1] === "{")return ret("variable", "variable");
        else if(type === ")" || type === "comment" || type === "{")return ret("tag", "tag");        
        else if(stream.sol())return ret("tag", "tag");
        else if((stream.eatSpace() && stream.peek() === "#") || stream.peek() === "#")return ret("tag", "tag");
        else if(state.stack.length === 0)return ret("tag", "tag");
        else if(type === ";" && stream.peek() !== undefined && stream.peek().match(/^[.|\#]/g) !== null)return ret("tag", "tag");

        //null
        else if(type === ":"){stream.eatSpace();return ret(null, stream.current());}

        else if(state.stack[state.stack.length-2] === "{" && state.stack[state.stack.length-1] === "rule" && stream.peek())return ret("tag", stream.current());

        else if(stream.current() === "and " || stream.current() === "and")return ret("variable", stream.current());
        else if(type === ";" && state.stack[state.stack.length-1] === "{")return ret("variable", stream.current());
        else if(state.stack[state.stack.length-1] === "rule" && type === "}")return ret("tag", type);//when the closing ) is not present, prevent to much funjy behaviour
        //null
        else if(state.stack[state.stack.length-1] === "rule" && type !== "}")return ret(null, stream.current());

        else if(state.stack[state.stack.length-1] === "(")return ret("string",stream.current());//when populating -webkit-what( content

        return ret("tag", stream.current());
      }
    }
  }

  function tokenSComment(stream, state) { // SComment = Slash comment
    stream.skipToEnd();
    state.tokenize = tokenBase;
    return ret("comment", "comment");
  }

  function tokenCComment(stream, state) { /* */
    var maybeEnd = false, ch;
    while ((ch = stream.next()) != null) {
      if (maybeEnd && ch == "/") {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return ret("comment", "comment");
  }

  function tokenSGMLComment(stream, state) { // <!-- -->
    var dashes = 0, ch;
    while ((ch = stream.next()) != null) {
      if (dashes >= 2 && ch == ">") {
        state.tokenize = tokenBase;
        break;
      }
      dashes = (ch == "-") ? dashes + 1 : 0;
    }
    return ret("comment", "comment");
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped)
          break;
        escaped = !escaped && ch == "\\";
      }
      if (!escaped) state.tokenize = tokenBase;
      return ret("string", stream.current());
    };
  }

  return {
    startState: function(base) {
      return {tokenize: tokenBase,
              baseIndent: base || 0,
              stack: []};
    },

    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);
      
      var context = state.stack[state.stack.length-1];
      if (type == "hash" && context == "rule") style = "atom";
      else if (style == "variable") {
        if (context == "rule") style = null; //"tag"
        else if (!context || context == "@media{") {
          style = stream.current() == "when"  ? "variable" :
          /[\s,|\s\)|\s]/.test(stream.peek()) ? "tag"      : type;
        }
      }

      if (context == "rule" && /^[\{\};]$/.test(type))
        state.stack.pop();
      if (type == "{") {
        if (context == "@media") state.stack[state.stack.length-1] = "@media{";
        else state.stack.push("{");
      }
      else if (type == "(") {
        state.stack.push("(");
      }
      else if (type == "}") state.stack.pop();
      else if (type == ")") state.stack.pop();
      else if (type == "@media") state.stack.push("@media");
      else if (stream.current().match(hate_list))state.stack[state.stack.length-1] = stream.current();
      else if ((context === "{" /*|| context === "("*/) && type !== "comment" && type !== "tag")state.stack.push("rule");
      else if (stream.peek() === ":" && stream.current().match(/@|#/) === null) style = type;
      //update state
      if(type === ";" &&  state.stack[state.stack.length-1] !== undefined && state.stack[state.stack.length-1].match(hate_list))state.stack[state.stack.length-1] = stream.current();
      else if(type === "tag" && stream.peek() === ")" && stream.current().match(/\:/) === null)type = style = "string";
      // ????
      else if(type === "variable" && (stream.peek() === ")" || (stream.eatSpace() && stream.peek() === ")")) )return ret(null,stream.current());
      return style;
    },

    indent: function(state, textAfter) {
      //console.log(state.stack);
      var n = state.stack.length;
      var n_func = function(num){
        return n !== 0 ? state.stack[state.stack.length-num] : '';
      };
      
      if (/^\}/.test(textAfter))
        n -= n_func(1) === "rule" ? 2 : 1;
      else if (n_func(1).match(at_rule))//"@media")
        n -= n_func(1).match(at_rule) ? 1 : 0;
      else if (n_func(2) === "{")
        n -= n_func(1) === "rule" ? 1 : 0;      
      else if (/^\)/.test(textAfter))
        n -= n_func(1) === "(" ? 2 : 1;
      else if (n_func(1) === "(")
        n -= n_func(1) === "(" ? 1 : 0;
      //console.log(n);
      return state.baseIndent + n * indentUnit;
    },

    electricChars: "})",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    lineComment: "//"
  };
});

CodeMirror.defineMIME("text/x-less", "less");
if (!CodeMirror.mimeModes.hasOwnProperty("text/css"))
  CodeMirror.defineMIME("text/css", "less");
