// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function() {
  var mode = CodeMirror.getMode({indentUnit: 2}, "liquid");
  function MT(name) {test.mode(name, mode, Array.prototype.slice.call(arguments, 1));}

  MT('if-test',
     '[keyword {% if user %}]',
     '  Hello [keyword {{ user.name }}]!',
     '[keyword {% endif %}]');

  MT('whitespace-test',
     '[keyword {%- if%}]',
     '  Hello [keyword {{-user.name-}}]!',
     '[keyword {%endif -%}]');

  MT('string-test',
     '[keyword {% if user.name == ][string "a"][keyword or user.name == ][string \'b\'][keyword %}]',
     '  Hello [keyword {{ user.name }}]!',
     '[keyword {% endif %}]');

  MT('else-test',
     '[keyword {% if user.name %}]',
     '  Hello [keyword {{ user.name }}]!',
     '[keyword {% elsif user %}]',
     '  User with no name.',
     '[keyword {% else %}]',
     '  No user.',
     '[keyword {% endif %}]');

  MT('case-test',
     '[keyword {% case user %}]',
     '  [keyword {% when ][string "a"][keyword %}]',
     '    A.',
     '  [keyword {% when ][string "b"][keyword %}]',
     '    B.',
     '  [keyword {% else %}]',
     '    C.',
     '[keyword {% endcase %}]');

  MT('comment-test',
     '[comment {% comment %}]',
     '[comment   Hello {{ user.name }}!]',
     '[comment {% endcomment %}]');

  MT('raw-test',
     '[keyword {% raw %}]',
     '  Hello {{ user.name }}!',
     '[keyword {% endraw %}]');
})();
