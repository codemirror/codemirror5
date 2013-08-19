/*
Copyright (c) 2008-2009 Yahoo! Inc. All rights reserved.
The copyrights embodied in the content of this file are licensed by
Yahoo! Inc. under the BSD (revised) open source license

@author Dan Vlad Dascalescu <dandv@yahoo-inc.com>


Parse function for PHP. Makes use of the tokenizer from tokenizephp.js.
Based on parsejavascript.js by Marijn Haverbeke.


Features:
 + special "deprecated" style for PHP4 keywords like 'var'
 + support for PHP 5.3 keywords: 'namespace', 'use'
 + 911 predefined constants, 1301 predefined functions, 105 predeclared classes
   from a typical PHP installation in a LAMP environment
 + new feature: syntax error flagging, thus enabling strict parsing of:
   + function definitions with explicitly or implicitly typed arguments and default values
   + modifiers (public, static etc.) applied to method and member definitions
   + foreach(array_expression as $key [=> $value]) loops
 + differentiation between single-quoted strings and double-quoted interpolating strings

*/


// add the Array.indexOf method for JS engines that don't support it (e.g. IE)
// code from https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Global_Objects/Array/IndexOf
if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(elt /*, from*/)
  {
    var len = this.length;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
         ? Math.ceil(from)
         : Math.floor(from);
    if (from < 0)
      from += len;

    for (; from < len; from++)
    {
      if (from in this &&
          this[from] === elt)
        return from;
    }
    return -1;
  };
}


var PHPParser = Editor.Parser = (function() {
  // Token types that can be considered to be atoms, part of operator expressions
  var atomicTypes = {
    "atom": true, "number": true, "variable": true, "string": true
  };
  // Constructor for the lexical context objects.
  function PHPLexical(indented, column, type, align, prev, info) {
    // indentation at start of this line
    this.indented = indented;
    // column at which this scope was opened
    this.column = column;
    // type of scope ('stat' (statement), 'form' (special form), '[', '{', or '(')
    this.type = type;
    // '[', '{', or '(' blocks that have any text after their opening
    // character are said to be 'aligned' -- any lines below are
    // indented all the way to the opening character.
    if (align != null)
      this.align = align;
    // Parent scope, if any.
    this.prev = prev;
    this.info = info;
  }

  // PHP indentation rules
  function indentPHP(lexical) {
    return function(firstChars) {
      var firstChar = firstChars && firstChars.charAt(0), type = lexical.type;
      var closing = firstChar == type;
      if (type == "form" && firstChar == "{")
        return lexical.indented;
      else if (type == "stat" || type == "form")
        return lexical.indented + indentUnit;
      else if (lexical.info == "switch" && !closing)
        return lexical.indented + (/^(?:case|default)\b/.test(firstChars) ? indentUnit : 2 * indentUnit);
      else if (lexical.align)
        return lexical.column - (closing ? 1 : 0);
      else
        return lexical.indented + (closing ? 0 : indentUnit);
    };
  }

  // The parser-iterator-producing function itself.
  function parsePHP(input, basecolumn) {
    // Wrap the input in a token stream
    var tokens = tokenizePHP(input);
    // The parser state. cc is a stack of actions that have to be
    // performed to finish the current statement. For example we might
    // know that we still need to find a closing parenthesis and a
    // semicolon. Actions at the end of the stack go first. It is
    // initialized with an infinitely looping action that consumes
    // whole statements.
    var cc = [statements];
    // The lexical scope, used mostly for indentation.
    var lexical = new PHPLexical((basecolumn || 0) - indentUnit, 0, "block", false);
    // Current column, and the indentation at the start of the current
    // line. Used to create lexical scope objects.
    var column = 0;
    var indented = 0;
    // Variables which are used by the mark, cont, and pass functions
    // below to communicate with the driver loop in the 'next' function.
    var consume, marked;

    // The iterator object.
    var parser = {next: next, copy: copy};

    // parsing is accomplished by calling next() repeatedly
    function next(){
      // Start by performing any 'lexical' actions (adjusting the
      // lexical variable), or the operations below will be working
      // with the wrong lexical state.
      while(cc[cc.length - 1].lex)
        cc.pop()();

      // Fetch the next token.
      var token = tokens.next();

      // Adjust column and indented.
      if (token.type == "whitespace" && column == 0)
        indented = token.value.length;
      column += token.value.length;
      if (token.content == "\n"){
        indented = column = 0;
        // If the lexical scope's align property is still undefined at
        // the end of the line, it is an un-aligned scope.
        if (!("align" in lexical))
          lexical.align = false;
        // Newline tokens get an indentation function associated with
        // them.
        token.indentation = indentPHP(lexical);
      }
      // No more processing for meaningless tokens.
      if (token.type == "whitespace" || token.type == "comment"
        || token.type == "string_not_terminated" )
        return token;
      // When a meaningful token is found and the lexical scope's
      // align is undefined, it is an aligned scope.
      if (!("align" in lexical))
        lexical.align = true;

      // Execute actions until one 'consumes' the token and we can
      // return it. 'marked' is used to change the style of the current token.
      while(true) {
        consume = marked = false;
        // Take and execute the topmost action.
        var action = cc.pop();
        action(token);

        if (consume){
          if (marked)
            token.style = marked;
          // Here we differentiate between local and global variables.
          return token;
        }
      }
      return 1; // Firebug workaround for http://code.google.com/p/fbug/issues/detail?id=1239#c1
    }

    // This makes a copy of the parser state. It stores all the
    // stateful variables in a closure, and returns a function that
    // will restore them when called with a new input stream. Note
    // that the cc array has to be copied, because it is contantly
    // being modified. Lexical objects are not mutated, so they can
    // be shared between runs of the parser.
    function copy(){
      var _lexical = lexical, _cc = cc.concat([]), _tokenState = tokens.state;

      return function copyParser(input){
        lexical = _lexical;
        cc = _cc.concat([]); // copies the array
        column = indented = 0;
        tokens = tokenizePHP(input, _tokenState);
        return parser;
      };
    }

    // Helper function for pushing a number of actions onto the cc
    // stack in reverse order.
    function push(fs){
      for (var i = fs.length - 1; i >= 0; i--)
        cc.push(fs[i]);
    }
    // cont and pass are used by the action functions to add other
    // actions to the stack. cont will cause the current token to be
    // consumed, pass will leave it for the next action.
    function cont(){
      push(arguments);
      consume = true;
    }
    function pass(){
      push(arguments);
      consume = false;
    }
    // Used to change the style of the current token.
    function mark(style){
      marked = style;
    }
    // Add a lyer of style to the current token, for example syntax-error
    function mark_add(style){
      marked = marked + ' ' + style;
    }

    // Push a new lexical context of the given type.
    function pushlex(type, info) {
      var result = function pushlexing() {
        lexical = new PHPLexical(indented, column, type, null, lexical, info)
      };
      result.lex = true;
      return result;
    }
    // Pop off the current lexical context.
    function poplex(){
      if (lexical.prev)
        lexical = lexical.prev;
    }
    poplex.lex = true;
    // The 'lex' flag on these actions is used by the 'next' function
    // to know they can (and have to) be ran before moving on to the
    // next token.

    // Creates an action that discards tokens until it finds one of
    // the given type. This will ignore (and recover from) syntax errors.
    function expect(wanted){
      return function expecting(token){
        if (token.type == wanted) cont();  // consume the token
        else {
          cont(arguments.callee);  // continue expecting() - call itself
        }
      };
    }

    // Require a specific token type, or one of the tokens passed in the 'wanted' array
    // Used to detect blatant syntax errors. 'execute' is used to pass extra code
    // to be executed if the token is matched. For example, a '(' match could
    // 'execute' a cont( compasep(funcarg), require(")") )
    function require(wanted, execute){
      return function requiring(token){
        var ok;
        var type = token.type;
        if (typeof(wanted) == "string")
          ok = (type == wanted) -1;
        else
          ok = wanted.indexOf(type);
        if (ok >= 0) {
          if (execute && typeof(execute[ok]) == "function") pass(execute[ok]);
          else cont();
        }
        else {
          if (!marked) mark(token.style);
          mark_add("syntax-error");
          cont(arguments.callee);
        }
      };
    }

    // Looks for a statement, and then calls itself.
    function statements(token){
      return pass(statement, statements);
    }
    // Dispatches various types of statements based on the type of the current token.
    function statement(token){
      var type = token.type;
      if (type == "keyword a") cont(pushlex("form"), expression, altsyntax, statement, poplex);
      else if (type == "keyword b") cont(pushlex("form"), altsyntax, statement, poplex);
      else if (type == "{") cont(pushlex("}"), block, poplex);
      else if (type == "function") funcdef();
      // technically, "class implode {...}" is correct, but we'll flag that as an error because it overrides a predefined function
      else if (type == "class") classdef();
      else if (type == "foreach") cont(pushlex("form"), require("("), pushlex(")"), expression, require("as"), require("variable"), /* => $value */ expect(")"), altsyntax, poplex, statement, poplex);
      else if (type == "for") cont(pushlex("form"), require("("), pushlex(")"), expression, require(";"), expression, require(";"), expression, require(")"), altsyntax, poplex, statement, poplex);
      // public final function foo(), protected static $bar;
      else if (type == "modifier") cont(require(["modifier", "variable", "function", "abstract"],
                                                [null, commasep(require("variable")), funcdef, absfun]));
      else if (type == "abstract") abs();
      else if (type == "switch") cont(pushlex("form"), require("("), expression, require(")"), pushlex("}", "switch"), require([":", "{"]), block, poplex, poplex);
      else if (type == "case") cont(expression, require(":"));
      else if (type == "default") cont(require(":"));
      else if (type == "catch") cont(pushlex("form"), require("("), require("t_string"), require("variable"), require(")"), statement, poplex);
      else if (type == "const") cont(require("t_string"));  // 'const static x=5' is a syntax error
      // technically, "namespace implode {...}" is correct, but we'll flag that as an error because it overrides a predefined function
      else if (type == "namespace") cont(namespacedef, require(";"));
      // $variables may be followed by operators, () for variable function calls, or [] subscripts
      else pass(pushlex("stat"), expression, require(";"), poplex);
    }
    // Dispatch expression types.
    function expression(token){
      var type = token.type;
      if (atomicTypes.hasOwnProperty(type)) cont(maybeoperator);
      else if (type == "<<<") cont(require("string"), maybeoperator);  // heredoc/nowdoc
      else if (type == "t_string") cont(maybe_double_colon, maybeoperator);
      else if (type == "keyword c" || type == "operator") cont(expression);
      // lambda
      else if (type == "function") lambdadef();
      // function call or parenthesized expression: $a = ($b + 1) * 2;
      else if (type == "(") cont(pushlex(")"), commasep(expression), require(")"), poplex, maybeoperator);
    }
    // Called for places where operators, function calls, or subscripts are
    // valid. Will skip on to the next action if none is found.
    function maybeoperator(token){
      var type = token.type;
      if (type == "operator") {
        if (token.content == "?") cont(expression, require(":"), expression);  // ternary operator
        else cont(expression);
      }
      else if (type == "(") cont(pushlex(")"), expression, commasep(expression), require(")"), poplex, maybeoperator /* $varfunc() + 3 */);
      else if (type == "[") cont(pushlex("]"), expression, require("]"), maybeoperator /* for multidimensional arrays, or $func[$i]() */, poplex);
    }
    // A regular use of the double colon to specify a class, as in self::func() or myclass::$var;
    // Differs from `namespace` or `use` in that only one class can be the parent; chains (A::B::$var) are a syntax error.
    function maybe_double_colon(token) {
      if (token.type == "t_double_colon")
        // A::$var, A::func(), A::const
        cont(require(["t_string", "variable"]), maybeoperator);
      else {
        // a t_string wasn't followed by ::, such as in a function call: foo()
        pass(expression)
      }
    }
    // the declaration or definition of a function
    function funcdef() {
      cont(require("t_string"), require("("), pushlex(")"), commasep(funcarg), require(")"), poplex, block);
    }
    // the declaration or definition of a lambda
    function lambdadef() {
      cont(require("("), pushlex(")"), commasep(funcarg), require(")"), maybe_lambda_use, poplex, require("{"), pushlex("}"), block, poplex);
    }
    // optional lambda 'use' statement
    function maybe_lambda_use(token) {
      if(token.type == "namespace") {
        cont(require('('), commasep(funcarg), require(')'));
      }
      else {
        pass(expression);
      }
    }
    // the definition of a class
    function classdef() {
      cont(require("t_string"), expect("{"), pushlex("}"), block, poplex);
    }
    // either funcdef if the current token is "function", or the keyword "function" + funcdef
    function absfun(token) {
      if(token.type == "function") funcdef();
      else cont(require(["function"], [funcdef]));
    }
    // the abstract class or function (with optional modifier)
    function abs(token) {
      cont(require(["modifier", "function", "class"], [absfun, funcdef, classdef]));
    }
    // Parses a comma-separated list of the things that are recognized
    // by the 'what' argument.
    function commasep(what){
      function proceed(token) {
        if (token.type == ",") cont(what, proceed);
      }
      return function commaSeparated() {
        pass(what, proceed);
      };
    }
    // Look for statements until a closing brace is found.
    function block(token) {
      if (token.type == "}") cont();
      else pass(statement, block);
    }
    function empty_parens_if_array(token) {
      if(token.content == "array")
        cont(require("("), require(")"));
    }
    function maybedefaultparameter(token){
      if (token.content == "=") cont(require(["t_string", "string", "number", "atom"], [empty_parens_if_array, null, null]));
    }
    function var_or_reference(token) {
      if(token.type == "variable") cont(maybedefaultparameter);
      else if(token.content == "&") cont(require("variable"), maybedefaultparameter);
    }
    // support for default arguments: http://us.php.net/manual/en/functions.arguments.php#functions.arguments.default
    function funcarg(token){
      // function foo(myclass $obj) {...} or function foo(myclass &objref) {...}
      if (token.type == "t_string") cont(var_or_reference);
      // function foo($var) {...} or function foo(&$ref) {...}
      else var_or_reference(token);
    }

    // A namespace definition or use
    function maybe_double_colon_def(token) {
      if (token.type == "t_double_colon")
        cont(namespacedef);
    }
    function namespacedef(token) {
      pass(require("t_string"), maybe_double_colon_def);
    }
    
    function altsyntax(token){
    	if(token.content==':')
    		cont(altsyntaxBlock,poplex);
    }
    
    function altsyntaxBlock(token){
    	if (token.type == "altsyntaxend") cont(require(';'));
      else pass(statement, altsyntaxBlock);
    }


    return parser;
  }

  return {make: parsePHP, electricChars: "{}:"};

})();
