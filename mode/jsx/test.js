// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function() {
  var mode = CodeMirror.getMode({indentUnit: 2}, "jsx")
  function MT(name) { test.mode(name, mode, Array.prototype.slice.call(arguments, 1)) }

  MT("selfclose",
     "[keyword var] [def x] [operator =] [bracket&tag <] [tag foo] [bracket&tag />] [operator +] [number 1];")

  MT("openclose",
     "([bracket&tag <][tag foo][bracket&tag >]hello [atom &amp;][bracket&tag </][tag foo][bracket&tag >][operator ++])")

  MT("attr",
     "([bracket&tag <][tag foo] [attribute abc]=[string 'value'][bracket&tag >]hello [atom &amp;][bracket&tag </][tag foo][bracket&tag >][operator ++])")

  MT("braced_attr",
     "([bracket&tag <][tag foo] [attribute abc]={[number 10]}[bracket&tag >]hello [atom &amp;][bracket&tag </][tag foo][bracket&tag >][operator ++])")

  MT("braced_text",
     "([bracket&tag <][tag foo][bracket&tag >]hello {[number 10]} [atom &amp;][bracket&tag </][tag foo][bracket&tag >][operator ++])")

  MT("nested_tag",
     "([bracket&tag <][tag foo][bracket&tag ><][tag bar][bracket&tag ></][tag bar][bracket&tag ></][tag foo][bracket&tag >][operator ++])")

  MT("nested_jsx",
     "[keyword return] (",
     "  [bracket&tag <][tag foo][bracket&tag >]",
     "    say {[number 1] [operator +] [bracket&tag <][tag bar] [attribute attr]={[number 10]}[bracket&tag />]}!",
     "  [bracket&tag </][tag foo][bracket&tag >][operator ++]",
     ")")

  MT("preserve_js_context",
     "[variable x] [operator =] [string-2 `quasi${][bracket&tag <][tag foo][bracket&tag />][string-2 }quoted`]")
})()
