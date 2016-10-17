// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function() {
  var mode = CodeMirror.getMode({tabSize: 4, indentUnit: 2}, "cypher");
  function MT(name) { test.mode(name, mode, Array.prototype.slice.call(arguments, 1)); }

  MT("unbalancedDoubledQuotedString",
      "[string \"a'b\"][variable c]");

  MT("unbalancedSingleQuotedString",
      "[string 'a\"b'][variable c]");

  MT("doubleQuotedString",
      "[string \"a\"][variable b]");

  MT("singleQuotedString",
      "[string 'a'][variable b]");
 })();
