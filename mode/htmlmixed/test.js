(function() {
  var mode = CodeMirror.getMode({tabSize: 4, indentUnit: 2}, "htmlmixed");
  function MT(name) { test.mode(name, mode, Array.prototype.slice.call(arguments, 1)); }

  MT("htmlCode",
     "[html&tag <h1>][html Title][html&tag </h1>]");

  MT("htmlAndCss",
     "[html&tag <h1>][html Title][html&tag </h1>]",
     "[html&tag <style>][css&tag h1][css { ][css&property color][css : ][css&keyword red][css }][html&tag </style>]");

  MT("htmlAndJs",
     "[html&tag <h1>][html Title][html&tag </h1>]",
     "[html&tag <script>][javascript&keyword var][javascript  ][javascript&variable foo][javascript  = ][javascript&variable bar][javascript () + ][javascript&number 42][javascript ;][html&tag </script>]");

  MT("htmlAndCssAndJs",
     "[html&tag <h1>][html Title][html&tag </h1>]",
     "[html&tag <style>][css&tag h1][css { ][css&property color][css : ][css&keyword red][css }][html&tag </style>]",
     "[html&tag <script>][javascript&keyword var][javascript  ][javascript&variable foo][javascript  = ][javascript&variable bar][javascript () + ][javascript&number 42][javascript ;][html&tag </script>]",
     "[html&tag <div>][html The end.][html&tag </div>]");

})();
