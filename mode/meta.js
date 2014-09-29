// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

CodeMirror.modeInfo = [
  {name: "APL", mime: "text/apl", mode: "apl", ext: ['']},
  {name: "Asterisk", mime: "text/x-asterisk", mode: "asterisk", ext: ['']},
  {name: "C", mime: "text/x-csrc", mode: "clike", ext: ['c']},
  {name: "C++", mime: "text/x-c++src", mode: "clike", ext: ['cpp', 'c++']},
  {name: "Cobol", mime: "text/x-cobol", mode: "cobol", ext: ['cob', 'cpy']},
  {name: "Java", mime: "text/x-java", mode: "clike", ext: ['java']},
  {name: "C#", mime: "text/x-csharp", mode: "clike", ext: ['cs']},
  {name: "Scala", mime: "text/x-scala", mode: "clike", ext: ['scala']},
  {name: "Clojure", mime: "text/x-clojure", mode: "clojure", ext: ['clj']},
  {name: "CoffeeScript", mime: "text/x-coffeescript", mode: "coffeescript", ext: ['coffee']},
  {name: "Common Lisp", mime: "text/x-common-lisp", mode: "commonlisp", ext: ['cl', 'lisp', 'el']},
  {name: "Cypher", mime: "application/x-cypher-query", mode: "cypher", ext: ['']},
  {name: "CSS", mime: "text/css", mode: "css", ext: ['css']},
  {name: "D", mime: "text/x-d", mode: "d", ext: ['d']},
  {name: "diff", mime: "text/x-diff", mode: "diff", ext: ['diff', 'patch']},
  {name: "DTD", mime: "application/xml-dtd", mode: "dtd", ext: ['dtd']},
  {name: "Dylan", mime: "text/x-dylan", mode: "dylan", ext: ['dylan', 'dyl', 'intr']},
  {name: "ECL", mime: "text/x-ecl", mode: "ecl", ext: ['ecl']},
  {name: "Eiffel", mime: "text/x-eiffel", mode: "eiffel", ext: ['e']},
  {name: "Erlang", mime: "text/x-erlang", mode: "erlang", ext: ['erl']},
  {name: "Fortran", mime: "text/x-fortran", mode: "fortran", ext: ['f','for','f77','f90']},
  {name: "F#", mime: "text/x-fsharp", mode: "mllike", ext: ['fs']},
  {name: "Gas", mime: "text/x-gas", mode: "gas", ext: ['s']},
  {name: "Gherkin", mime: "text/x-feature", mode: "gherkin", ext: ['feature']},
  {name: "GitHub Flavored Markdown", mime: "text/x-gfm", mode: "gfm", ext: ['']},
  {name: "Go", mime: "text/x-go", mode: "go", ext: ['go']},
  {name: "Groovy", mime: "text/x-groovy", mode: "groovy", ext: ['groovy']},
  {name: "HAML", mime: "text/x-haml", mode: "haml", ext: ['haml']},
  {name: "Haskell", mime: "text/x-haskell", mode: "haskell", ext: ['hs']},
  {name: "Haxe", mime: "text/x-haxe", mode: "haxe", ext: ['hx']},
  {name: "ASP.NET", mime: "application/x-aspx", mode: "htmlembedded", ext: ['aspx']},
  {name: "Embedded Javascript", mime: "application/x-ejs", mode: "htmlembedded", ext: ['ejs']},
  {name: "JavaServer Pages", mime: "application/x-jsp", mode: "htmlembedded", ext: ['jsp']},
  {name: "HTML", mime: "text/html", mode: "htmlmixed", ext: ['html','htm']},
  {name: "HTTP", mime: "message/http", mode: "http", ext: ['']},
  {name: "Jade", mime: "text/x-jade", mode: "jade", ext: ['jade']},
  {name: "JavaScript", mime: "text/javascript", mode: "javascript", ext: ['js']},
  {name: "JavaScript", mime: "application/javascript", mode: "javascript", ext: ['js']},
  {name: "JSON", mime: "application/x-json", mode: "javascript", ext: ['json', 'map']},
  {name: "JSON", mime: "application/json", mode: "javascript", ext: ['json','map']},
  {name: "JSON-LD", mime: "application/ld+json", mode: "javascript", ext: ['']},
  {name: "TypeScript", mime: "application/typescript", mode: "javascript", ext: ['ts']},
  {name: "Jinja2", mime: "null", mode: "jinja2", ext: ['']},
  {name: "Julia", mime: "text/x-julia", mode: "julia", ext: ['jl']},
  {name: "Kotlin", mime: "text/x-kotlin", mode: "kotlin", ext: ['kt']},
  {name: "LESS", mime: "text/x-less", mode: "css", ext: ['less']},
  {name: "LiveScript", mime: "text/x-livescript", mode: "livescript", ext: ['ls']},
  {name: "Lua", mime: "text/x-lua", mode: "lua", ext: ['lua']},
  {name: "Markdown (GitHub-flavour)", mime: "text/x-markdown", mode: "markdown", ext: ['markdown','md','mkd']},
  {name: "mIRC", mime: "text/mirc", mode: "mirc", ext: ['']},
  {name: "Modelica", mime: "text/x-modelica", mode: "modelica", ext: ['mo']},
  {name: "Nginx", mime: "text/x-nginx-conf", mode: "nginx", ext: ['']},
  {name: "NTriples", mime: "text/n-triples", mode: "ntriples", ext: ['']},
  {name: "OCaml", mime: "text/x-ocaml", mode: "mllike", ext: ['ml', 'mli', 'mll', 'mly']},
  {name: "Octave", mime: "text/x-octave", mode: "octave", ext: ['m']},
  {name: "Pascal", mime: "text/x-pascal", mode: "pascal", ext: ['p','pas']},
  {name: "PEG.js", mime: "null", mode: "pegjs", ext: ['']},
  {name: "Perl", mime: "text/x-perl", mode: "perl", ext: ['pl', 'pm']},
  {name: "PHP", mime: "text/x-php", mode: "php", ext: ['php', 'php3', 'php4', 'php5']},
  {name: "PHP(HTML)", mime: "application/x-httpd-php", mode: "php", ext: ['phtml']},
  {name: "Pig", mime: "text/x-pig", mode: "pig", ext: ['']},
  {name: "Plain Text", mime: "text/plain", mode: "null", ext: ['txt','text','conf','def','list','log','in','ini']},
  {name: "Properties files", mime: "text/x-properties", mode: "properties", ext: ['properties']},
  {name: "Python", mime: "text/x-python", mode: "python", ext: ['py', 'pyw']},
  {name: "Puppet", mime: "text/x-puppet", mode: "puppet", ext: ['pp']},
  {name: "Cython", mime: "text/x-cython", mode: "python", ext: ['pyx', 'pxd', 'pxi']},
  {name: "R", mime: "text/x-rsrc", mode: "r", ext: ['r']},
  {name: "reStructuredText", mime: "text/x-rst", mode: "rst", ext: ['rst']},
  {name: "Ruby", mime: "text/x-ruby", mode: "ruby", ext: ['rb']},
  {name: "Rust", mime: "text/x-rustsrc", mode: "rust", ext: ['rs']},
  {name: "Sass", mime: "text/x-sass", mode: "sass", ext: ['sass']},
  {name: "Scheme", mime: "text/x-scheme", mode: "scheme", ext: ['scm', 'ss']},
  {name: "SCSS", mime: "text/x-scss", mode: "css", ext: ['scss']},
  {name: "Shell", mime: "text/x-sh", mode: "shell", ext: ['sh', 'ksh', 'bash']},
  {name: "Sieve", mime: "application/sieve", mode: "sieve", ext: ['']},
  {name: "Slim", mime: "text/x-slim", mode: "slim", ext: ['']},
  {name: "Smalltalk", mime: "text/x-stsrc", mode: "smalltalk", ext: ['st']},
  {name: "Smarty", mime: "text/x-smarty", mode: "smarty", ext: ['tpl']},
  {name: "SmartyMixed", mime: "text/x-smarty", mode: "smartymixed", ext: ['']},
  {name: "Solr", mime: "text/x-solr", mode: "solr", ext: ['']},
  {name: "SPARQL", mime: "application/x-sparql-query", mode: "sparql", ext: ['sparql']},
  {name: "SQL", mime: "text/x-sql", mode: "sql", ext: ['sql']},
  {name: "MariaDB", mime: "text/x-mariadb", mode: "sql", ext: ['sql']},
  {name: "sTeX", mime: "text/x-stex", mode: "stex", ext: ['tex']},
  {name: "LaTeX", mime: "text/x-latex", mode: "stex", ext: ['ltx']},
  {name: "SystemVerilog", mime: "text/x-systemverilog", mode: "verilog", ext: ['v']},
  {name: "Tcl", mime: "text/x-tcl", mode: "tcl", ext: ['tcl']},
  {name: "TiddlyWiki ", mime: "text/x-tiddlywiki", mode: "tiddlywiki", ext: ['']},
  {name: "Tiki wiki", mime: "text/tiki", mode: "tiki", ext: ['']},
  {name: "TOML", mime: "text/x-toml", mode: "toml", ext: ['']},
  {name: "Turtle", mime: "text/turtle", mode: "turtle", ext: ['ttl']},
  {name: "VB.NET", mime: "text/x-vb", mode: "vb", ext: ['vb']},
  {name: "VBScript", mime: "text/vbscript", mode: "vbscript", ext: ['vb']},
  {name: "Velocity", mime: "text/velocity", mode: "velocity", ext: ['vtl']},
  {name: "Verilog", mime: "text/x-verilog", mode: "verilog", ext: ['v']},
  {name: "XML", mime: "application/xml", mode: "xml", ext: ['xml','xsl','xsd']},
  {name: "XQuery", mime: "application/xquery", mode: "xquery", ext: ['xy', 'xquery']},
  {name: "YAML", mime: "text/x-yaml", mode: "yaml", ext: ['yaml']},
  {name: "Z80", mime: "text/x-z80", mode: "z80", ext: ['z80']}
];

});

var getExtFromMimeType = function(mimetype) {
  var ext = "txt";
  for(var i=0;i<CodeMirror.modeInfo.length;i++) {
    var m = CodeMirror.modeInfo[i];
    if (m.mime == mimetype) {
      if (m.ext[0] != '') {
         return m.ext[0];
      }     
    }
  }
  return ext;
}

var getMimeTypeFromExt = function(ext) {
  var mimetype = "text/plain";
  if (ext) {
    for(var i=0;i<CodeMirror.modeInfo.length;i++) {
      var m = CodeMirror.modeInfo[i];
      for(var j=0;j<m.ext.length;j++) {
        if (m.ext[j] == ext) {
          return m.mime;    
        }
      }
    }
  }
  return mimetype;
}

var getFilenameAndExt = function(filename){
    var parts = filename.split('.');

    if (parts.length > 1){
        var ext = parts.pop();
        var filename = parts.join("");
    }
    return {"filename": filename, "ext": ext};
}

var detectCodeMirrorMode = function(mimetype) { 
  for(var i=0;i<CodeMirror.modeInfo.length;i++) {
    var m = CodeMirror.modeInfo[i];
    if (m.mime == mimetype) {
         return m.mode;
    }
  }
  return null;
}
