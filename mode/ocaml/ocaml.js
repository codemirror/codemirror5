CodeMirror.defineMode('ocaml', function(config) {

  var atoms = ['true','false'],
      keywords = ['let','rec','in','of','and','succ','if','then','else','for','to','while','do','done','fun','function','val','type','mutable','match','with','try','raise','begin','end'],
      commands = ['open','print_string','print_endline','trace','ignore','exit'];

  function tokenBase(stream, state) {
    var sol = stream.sol();
    var ch = stream.next();

    if (ch === '"') {
      state.tokenize = tokenString;
      return state.tokenize(stream, state);
    }
    if (ch === '(') {
      if (stream.eat('*')) {
        state.commentLevel++;
        state.tokenize = tokenComment;
        return state.tokenize(stream, state);
      }
    }
    if (ch === '~') {
      stream.eatWhile(/\w/);
      return 'variable-2';
    }
    if (ch === '`') {
      stream.eatWhile(/\w/);
      return 'quote';
    }
    if (/\d/.test(ch)) {
      stream.eatWhile(/[\d]/);
      if (stream.eat('.')) {
        stream.eatWhile(/[\d]/);
      }
      return 'number';
    }
    if ( /[+\-*&%=<>!?|]/.test(ch)) {
      return 'operator';
    }
    stream.eatWhile(/\w/);
    var cur = stream.current();
    if (atoms.indexOf(cur) !== -1) return 'atom';
    if (commands.indexOf(cur) !== -1) return 'builtin';
    if (keywords.indexOf(cur) !== -1) return 'keyword';
    return 'word';
  }

  function tokenString(stream, state) {
    var next, end = false, escaped = false;
    while ((next = stream.next()) != null) {
      if (next === '"' && !escaped) {
        end = true;
        break;
      }
      escaped = !escaped && next === '\\';
    }
    if (end && !escaped) {
      state.tokenize = tokenBase;
    }
    return 'string';
  };

  function tokenComment(stream, state) {
    var prev, next;
    while(state.commentLevel > 0 && (next = stream.next()) != null) {
      if (prev === '(' && next === '*') state.commentLevel++;
      if (prev === '*' && next === ')') state.commentLevel--;
      prev = next;
    }
    if (state.commentLevel <= 0) {
      state.tokenize = tokenBase;
    }
    return 'comment';
  }

  return {
    startState: function() {return {tokenize: tokenBase, commentLevel: 0}},
    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      return state.tokenize(stream, state);
    }
  };
});
  
CodeMirror.defineMIME('text/x-ocaml', 'ocaml');
