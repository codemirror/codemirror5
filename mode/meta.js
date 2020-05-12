// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

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
    {name: "APL", mime: "text/apl", mode: "apl", ext: ["dyalog", "apl"], id: "apl"},
    {name: "PGP", mimes: ["application/pgp", "application/pgp-encrypted", "application/pgp-keys", "application/pgp-signature"], mode: "asciiarmor", ext: ["asc", "pgp", "sig"], id: "pgp"},
    {name: "ASN.1", mime: "text/x-ttcn-asn", mode: "asn.1", ext: ["asn", "asn1"], id: "asn"},
    {name: "Asterisk", mime: "text/x-asterisk", mode: "asterisk", file: /^extensions\.conf$/i, id: "ast"},
    {name: "Brainfuck", mime: "text/x-brainfuck", mode: "brainfuck", ext: ["b", "bf"], id: "bf"},
    {name: "C", mime: "text/x-csrc", mode: "clike", ext: ["c", "h", "ino"], id: "c"},
    {name: "C++", mime: "text/x-c++src", mode: "clike", ext: ["cpp", "c++", "cc", "cxx", "hpp", "h++", "hh", "hxx"], alias: ["cpp"], id: "cpp"},
    {name: "Cobol", mime: "text/x-cobol", mode: "cobol", ext: ["cob", "cpy"], id: "cob"},
    {name: "C#", mime: "text/x-csharp", mode: "clike", ext: ["cs"], alias: ["csharp", "cs"], id: "cs"},
    {name: "Clojure", mime: "text/x-clojure", mode: "clojure", ext: ["clj", "cljc", "cljx"], id: "clj"},
    {name: "ClojureScript", mime: "text/x-clojurescript", mode: "clojure", ext: ["cljs"], id: "cljs"},
    {name: "Closure Stylesheets (GSS)", mime: "text/x-gss", mode: "css", ext: ["gss"], id: "gss"},
    {name: "CMake", mime: "text/x-cmake", mode: "cmake", ext: ["cmake", "cmake.in"], file: /^CMakeLists.txt$/, id: "cm"},
    {name: "CoffeeScript", mimes: ["application/vnd.coffeescript", "text/coffeescript", "text/x-coffeescript"], mode: "coffeescript", ext: ["coffee"], alias: ["coffee", "coffee-script"], id: "cfs"},
    {name: "Common Lisp", mime: "text/x-common-lisp", mode: "commonlisp", ext: ["cl", "lisp", "el"], alias: ["lisp"], id: "cl"},
    {name: "Cypher", mime: "application/x-cypher-query", mode: "cypher", ext: ["cyp", "cypher"], id: "cyp"},
    {name: "Cython", mime: "text/x-cython", mode: "python", ext: ["pyx", "pxd", "pxi"], id: "pyx"},
    {name: "Crystal", mime: "text/x-crystal", mode: "crystal", ext: ["cr"], id: "cr"},
    {name: "CSS", mime: "text/css", mode: "css", ext: ["css"], id: "css"},
    {name: "CQL", mime: "text/x-cassandra", mode: "sql", ext: ["cql"], id: "cql"},
    {name: "D", mime: "text/x-d", mode: "d", ext: ["d"], id: "d"},
    {name: "Dart", mimes: ["application/dart", "text/x-dart"], mode: "dart", ext: ["dart"], id: "dart"},
    {name: "diff", mime: "text/x-diff", mode: "diff", ext: ["diff", "patch"], id: "diff"},
    {name: "Django", mime: "text/x-django", mode: "django", id: "dj"},
    {name: "Dockerfile", mime: "text/x-dockerfile", mode: "dockerfile", file: /^Dockerfile$/, id: "df"},
    {name: "DTD", mime: "application/xml-dtd", mode: "dtd", ext: ["dtd"], id: "dtd"},
    {name: "Dylan", mime: "text/x-dylan", mode: "dylan", ext: ["dylan", "dyl", "intr"], id: "dyl"},
    {name: "EBNF", mime: "text/x-ebnf", mode: "ebnf", id: "ebnf"},
    {name: "ECL", mime: "text/x-ecl", mode: "ecl", ext: ["ecl"], id: "ecl"},
    {name: "edn", mime: "application/edn", mode: "clojure", ext: ["edn"], id: "edn"},
    {name: "Eiffel", mime: "text/x-eiffel", mode: "eiffel", ext: ["e"], id: "e"},
    {name: "Elm", mime: "text/x-elm", mode: "elm", ext: ["elm"], id: "elm"},
    {name: "Embedded Javascript", mime: "application/x-ejs", mode: "htmlembedded", ext: ["ejs"], id: "ejs"},
    {name: "Embedded Ruby", mime: "application/x-erb", mode: "htmlembedded", ext: ["erb"], id: "erb"},
    {name: "Erlang", mime: "text/x-erlang", mode: "erlang", ext: ["erl"], id: "erl"},
    {name: "Esper", mime: "text/x-esper", mode: "sql", id: "esp"},
    {name: "Factor", mime: "text/x-factor", mode: "factor", ext: ["factor"], id: "fac"},
    {name: "FCL", mime: "text/x-fcl", mode: "fcl", id: "fcl"},
    {name: "Forth", mime: "text/x-forth", mode: "forth", ext: ["forth", "fth", "4th"], id: "fth"},
    {name: "Fortran", mime: "text/x-fortran", mode: "fortran", ext: ["f", "for", "f77", "f90", "f95"], id: "f"},
    {name: "F#", mime: "text/x-fsharp", mode: "mllike", ext: ["fs"], alias: ["fsharp"], id: "fs"},
    {name: "Gas", mime: "text/x-gas", mode: "gas", ext: ["s"], id: "s"},
    {name: "Gherkin", mime: "text/x-feature", mode: "gherkin", ext: ["feature"], id: "ghe"},
    {name: "GitHub Flavored Markdown", mime: "text/x-gfm", mode: "gfm", file: /^(readme|contributing|history).md$/i, id: "gfm"},
    {name: "Go", mime: "text/x-go", mode: "go", ext: ["go"], id: "go"},
    {name: "Groovy", mime: "text/x-groovy", mode: "groovy", ext: ["groovy", "gradle"], file: /^Jenkinsfile$/, id: "gro"},
    {name: "HAML", mime: "text/x-haml", mode: "haml", ext: ["haml"], id: "haml"},
    {name: "Haskell", mime: "text/x-haskell", mode: "haskell", ext: ["hs"], id: "hs"},
    {name: "Haskell (Literate)", mime: "text/x-literate-haskell", mode: "haskell-literate", ext: ["lhs"], id: "lhs"},
    {name: "Haxe", mime: "text/x-haxe", mode: "haxe", ext: ["hx"], id: "hx"},
    {name: "HXML", mime: "text/x-hxml", mode: "haxe", ext: ["hxml"], id: "hxml"},
    {name: "ASP.NET", mime: "application/x-aspx", mode: "htmlembedded", ext: ["aspx"], alias: ["asp", "aspx"], id: "asp"},
    {name: "HTML", mime: "text/html", mode: "htmlmixed", ext: ["html", "htm", "handlebars", "hbs"], alias: ["xhtml"], id: "html"},
    {name: "HTTP", mime: "message/http", mode: "http", id: "http"},
    {name: "IDL", mime: "text/x-idl", mode: "idl", ext: ["pro"], id: "idl"},
    {name: "Pug", mime: "text/x-pug", mode: "pug", ext: ["jade", "pug"], alias: ["jade"], id: "pug"},
    {name: "Java", mime: "text/x-java", mode: "clike", ext: ["java"], id: "java"},
    {name: "Java Server Pages", mime: "application/x-jsp", mode: "htmlembedded", ext: ["jsp"], alias: ["jsp"], id: "jsp"},
    {name: "JavaScript", mimes: ["text/javascript", "text/ecmascript", "application/javascript", "application/x-javascript", "application/ecmascript"],
     mode: "javascript", ext: ["js"], alias: ["ecmascript", "js", "node"], id: "js"},
    {name: "JSON", mimes: ["application/json", "application/x-json"], mode: "javascript", ext: ["json", "map"], alias: ["json5"], id: "json"},
    {name: "JSON-LD", mime: "application/ld+json", mode: "javascript", ext: ["jsonld"], alias: ["jsonld"], id: "jld"},
    {name: "JSX", mime: "text/jsx", mode: "jsx", ext: ["jsx"], id: "jsx"},
    {name: "Jinja2", mime: "text/jinja2", mode: "jinja2", ext: ["j2", "jinja", "jinja2"], id: "j2"},
    {name: "Julia", mime: "text/x-julia", mode: "julia", ext: ["jl"], id: "jl"},
    {name: "Kotlin", mime: "text/x-kotlin", mode: "clike", ext: ["kt"], id: "kt"},
    {name: "LESS", mime: "text/x-less", mode: "css", ext: ["less"], id: "less"},
    {name: "LiveScript", mime: "text/x-livescript", mode: "livescript", ext: ["ls"], alias: ["ls"], id: "ls"},
    {name: "Lua", mime: "text/x-lua", mode: "lua", ext: ["lua"], id: "lua"},
    {name: "Markdown", mime: "text/x-markdown", mode: "markdown", ext: ["markdown", "md", "mkd"], id: "md"},
    {name: "mIRC", mime: "text/mirc", mode: "mirc", id: "mirc"},
    {name: "MariaDB SQL", mime: "text/x-mariadb", mode: "sql", id: "mdb"},
    {name: "Mathematica", mime: "text/x-mathematica", mode: "mathematica", ext: ["m", "nb", "wl", "wls"], id: "math"},
    {name: "Modelica", mime: "text/x-modelica", mode: "modelica", ext: ["mo"], id: "mo"},
    {name: "MUMPS", mime: "text/x-mumps", mode: "mumps", ext: ["mps"], id: "mps"},
    {name: "MS SQL", mime: "text/x-mssql", mode: "sql", id: "msql"},
    {name: "mbox", mime: "application/mbox", mode: "mbox", ext: ["mbox"], id: "mbox"},
    {name: "MySQL", mime: "text/x-mysql", mode: "sql", id: "my"},
    {name: "Nginx", mime: "text/x-nginx-conf", mode: "nginx", file: /nginx.*\.conf$/i, id: "ngx"},
    {name: "NSIS", mime: "text/x-nsis", mode: "nsis", ext: ["nsh", "nsi"], id: "nsh"},
    {name: "NTriples", mimes: ["application/n-triples", "application/n-quads", "text/n-triples"],
     mode: "ntriples", ext: ["nt", "nq"], id: "nt"},
    {name: "Objective-C", mime: "text/x-objectivec", mode: "clike", ext: ["m"], alias: ["objective-c", "objc"], id: "m"},
    {name: "Objective-C++", mime: "text/x-objectivec++", mode: "clike", ext: ["mm"], alias: ["objective-c++", "objc++"], id: "mm"},
    {name: "OCaml", mime: "text/x-ocaml", mode: "mllike", ext: ["ml", "mli", "mll", "mly"], id: "ml"},
    {name: "Octave", mime: "text/x-octave", mode: "octave", ext: ["m"], id: "oct"},
    {name: "Oz", mime: "text/x-oz", mode: "oz", ext: ["oz"], id: "oz"},
    {name: "Pascal", mime: "text/x-pascal", mode: "pascal", ext: ["p", "pas"], id: "p"},
    {name: "PEG.js", mime: "null", mode: "pegjs", ext: ["jsonld"], id: "peg"},
    {name: "Perl", mime: "text/x-perl", mode: "perl", ext: ["pl", "pm"], id: "pl"},
    {name: "PHP", mimes: ["text/x-php", "application/x-httpd-php", "application/x-httpd-php-open"], mode: "php", ext: ["php", "php3", "php4", "php5", "php7", "phtml"], id: "php"},
    {name: "Pig", mime: "text/x-pig", mode: "pig", ext: ["pig"], id: "pig"},
    {name: "Plain Text", mime: "text/plain", mode: "null", ext: ["txt", "text", "conf", "def", "list", "log"], id: "txt"},
    {name: "PLSQL", mime: "text/x-plsql", mode: "sql", ext: ["pls"], id: "pls"},
    {name: "PostgreSQL", mime: "text/x-pgsql", mode: "sql", id: "psql"},
    {name: "PowerShell", mime: "application/x-powershell", mode: "powershell", ext: ["ps1", "psd1", "psm1"], id: "ps1"},
    {name: "Properties files", mime: "text/x-properties", mode: "properties", ext: ["properties", "ini", "in"], alias: ["ini", "properties"], id: "ini"},
    {name: "ProtoBuf", mime: "text/x-protobuf", mode: "protobuf", ext: ["proto"], id: "pb"},
    {name: "Python", mime: "text/x-python", mode: "python", ext: ["BUILD", "bzl", "py", "pyw"], file: /^(BUCK|BUILD)$/, id: "py"},
    {name: "Puppet", mime: "text/x-puppet", mode: "puppet", ext: ["pp"], id: "pp"},
    {name: "Q", mime: "text/x-q", mode: "q", ext: ["q"], id: "q"},
    {name: "R", mime: "text/x-rsrc", mode: "r", ext: ["r", "R"], alias: ["rscript"], id: "r"},
    {name: "reStructuredText", mime: "text/x-rst", mode: "rst", ext: ["rst"], alias: ["rst"], id: "rst"},
    {name: "RPM Changes", mime: "text/x-rpm-changes", mode: "rpm", id: "rpm"},
    {name: "RPM Spec", mime: "text/x-rpm-spec", mode: "rpm", ext: ["spec"], id: "spec"},
    {name: "Ruby", mime: "text/x-ruby", mode: "ruby", ext: ["rb"], alias: ["jruby", "macruby", "rake", "rb", "rbx"], id: "rb"},
    {name: "Rust", mime: "text/x-rustsrc", mode: "rust", ext: ["rs"], id: "rs"},
    {name: "SAS", mime: "text/x-sas", mode: "sas", ext: ["sas"], id: "sas"},
    {name: "Sass", mime: "text/x-sass", mode: "sass", ext: ["sass"], id: "sass"},
    {name: "Scala", mime: "text/x-scala", mode: "clike", ext: ["scala"], id: "sca"},
    {name: "Scheme", mime: "text/x-scheme", mode: "scheme", ext: ["scm", "ss"], id: "scm"},
    {name: "SCSS", mime: "text/x-scss", mode: "css", ext: ["scss"], id: "scss"},
    {name: "Shell", mimes: ["text/x-sh", "application/x-sh"], mode: "shell", ext: ["sh", "ksh", "bash"], alias: ["bash", "sh", "zsh"], file: /^PKGBUILD$/, id: "sh"},
    {name: "Sieve", mime: "application/sieve", mode: "sieve", ext: ["siv", "sieve"], id: "siv"},
    {name: "Slim", mimes: ["text/x-slim", "application/x-slim"], mode: "slim", ext: ["slim"], id: "slim"},
    {name: "Smalltalk", mime: "text/x-stsrc", mode: "smalltalk", ext: ["st"], id: "st"},
    {name: "Smarty", mime: "text/x-smarty", mode: "smarty", ext: ["tpl"], id: "tpl"},
    {name: "Solr", mime: "text/x-solr", mode: "solr", id: "solr"},
    {name: "SML", mime: "text/x-sml", mode: "mllike", ext: ["sml", "sig", "fun", "smackspec"], id: "sml"},
    {name: "Soy", mime: "text/x-soy", mode: "soy", ext: ["soy"], alias: ["closure template"], id: "soy"},
    {name: "SPARQL", mime: "application/sparql-query", mode: "sparql", ext: ["rq", "sparql"], alias: ["sparul"], id: "spql"},
    {name: "Spreadsheet", mime: "text/x-spreadsheet", mode: "spreadsheet", alias: ["excel", "formula"], id: "xls"},
    {name: "SQL", mime: "text/x-sql", mode: "sql", ext: ["sql"], id: "sql"},
    {name: "SQLite", mime: "text/x-sqlite", mode: "sql", id: "sqli"},
    {name: "Squirrel", mime: "text/x-squirrel", mode: "clike", ext: ["nut"], id: "nut"},
    {name: "Stylus", mime: "text/x-styl", mode: "stylus", ext: ["styl"], id: "styl"},
    {name: "Swift", mime: "text/x-swift", mode: "swift", ext: ["swift"], id: "swi"},
    {name: "sTeX", mime: "text/x-stex", mode: "stex", id: "stex"},
    {name: "LaTeX", mime: "text/x-latex", mode: "stex", ext: ["text", "ltx", "tex"], alias: ["tex"], id: "tex"},
    {name: "SystemVerilog", mime: "text/x-systemverilog", mode: "verilog", ext: ["v", "sv", "svh"], id: "svh"},
    {name: "Tcl", mime: "text/x-tcl", mode: "tcl", ext: ["tcl"], id: "tcl"},
    {name: "Textile", mime: "text/x-textile", mode: "textile", ext: ["textile"], id: "txtl"},
    {name: "TiddlyWiki ", mime: "text/x-tiddlywiki", mode: "tiddlywiki", id: "tdwk"},
    {name: "Tiki wiki", mime: "text/tiki", mode: "tiki", id: "tkwk"},
    {name: "TOML", mime: "text/x-toml", mode: "toml", ext: ["toml"], id: "toml"},
    {name: "Tornado", mime: "text/x-tornado", mode: "tornado", id: "tnd"},
    {name: "troff", mime: "text/troff", mode: "troff", ext: ["1", "2", "3", "4", "5", "6", "7", "8", "9"], id: "trf"},
    {name: "TTCN", mime: "text/x-ttcn", mode: "ttcn", ext: ["ttcn", "ttcn3", "ttcnpp"], id: "ttnc"},
    {name: "TTCN_CFG", mime: "text/x-ttcn-cfg", mode: "ttcn-cfg", ext: ["cfg"], id: "cfg"},
    {name: "Turtle", mime: "text/turtle", mode: "turtle", ext: ["ttl"], id: "ttl"},
    {name: "TypeScript", mime: "application/typescript", mode: "javascript", ext: ["ts"], alias: ["ts"], id: "ts"},
    {name: "TypeScript-JSX", mime: "text/typescript-jsx", mode: "jsx", ext: ["tsx"], alias: ["tsx"], id: "tsx"},
    {name: "Twig", mime: "text/x-twig", mode: "twig", id: "twig"},
    {name: "Web IDL", mime: "text/x-webidl", mode: "webidl", ext: ["webidl"], id: "widl"},
    {name: "VB.NET", mime: "text/x-vb", mode: "vb", ext: ["vb"], id: "vb"},
    {name: "VBScript", mime: "text/vbscript", mode: "vbscript", ext: ["vbs"], id: "vbs"},
    {name: "Velocity", mime: "text/velocity", mode: "velocity", ext: ["vtl"], id: "vtl"},
    {name: "Verilog", mime: "text/x-verilog", mode: "verilog", ext: ["v"], id: "v"},
    {name: "VHDL", mime: "text/x-vhdl", mode: "vhdl", ext: ["vhd", "vhdl"], id: "vhdl"},
    {name: "Vue.js Component", mimes: ["script/x-vue", "text/x-vue"], mode: "vue", ext: ["vue"], id: "vue"},
    {name: "XML", mimes: ["application/xml", "text/xml"], mode: "xml", ext: ["xml", "xsl", "xsd", "svg"], alias: ["rss", "wsdl", "xsd"], id: "xml"},
    {name: "XQuery", mime: "application/xquery", mode: "xquery", ext: ["xy", "xquery"], id: "xy"},
    {name: "Yacas", mime: "text/x-yacas", mode: "yacas", ext: ["ys"], id: "ys"},
    {name: "YAML", mimes: ["text/x-yaml", "text/yaml"], mode: "yaml", ext: ["yaml", "yml"], alias: ["yml"], id: "yml"},
    {name: "Z80", mime: "text/x-z80", mode: "z80", ext: ["z80"], id: "z80"},
    {name: "mscgen", mime: "text/x-mscgen", mode: "mscgen", ext: ["mscgen", "mscin", "msc"], id: "msc"},
    {name: "xu", mime: "text/x-xu", mode: "mscgen", ext: ["xu"], id: "xu"},
    {name: "msgenny", mime: "text/x-msgenny", mode: "mscgen", ext: ["msgenny"], id: "msg"}
  ];
  // Ensure all modes have a mime property for backwards compatibility
  for (var i = 0; i < CodeMirror.modeInfo.length; i++) {
    var info = CodeMirror.modeInfo[i];
    if (info.mimes) info.mime = info.mimes[0];
  }

  CodeMirror.findModeByMIME = function(mime) {
    mime = mime.toLowerCase();
    for (var i = 0; i < CodeMirror.modeInfo.length; i++) {
      var info = CodeMirror.modeInfo[i];
      if (info.mime == mime) return info;
      if (info.mimes) for (var j = 0; j < info.mimes.length; j++)
        if (info.mimes[j] == mime) return info;
    }
    if (/\+xml$/.test(mime)) return CodeMirror.findModeByMIME("application/xml")
    if (/\+json$/.test(mime)) return CodeMirror.findModeByMIME("application/json")
  };

  CodeMirror.findModeByExtension = function(ext) {
    ext = ext.toLowerCase();
    for (var i = 0; i < CodeMirror.modeInfo.length; i++) {
      var info = CodeMirror.modeInfo[i];
      if (info.ext) for (var j = 0; j < info.ext.length; j++)
        if (info.ext[j] == ext) return info;
    }
  };

  CodeMirror.findModeByFileName = function(filename) {
    for (var i = 0; i < CodeMirror.modeInfo.length; i++) {
      var info = CodeMirror.modeInfo[i];
      if (info.file && info.file.test(filename)) return info;
    }
    var dot = filename.lastIndexOf(".");
    var ext = dot > -1 && filename.substring(dot + 1, filename.length);
    if (ext) return CodeMirror.findModeByExtension(ext);
  };

  CodeMirror.findModeByName = function(name) {
    name = name.toLowerCase();
    for (var i = 0; i < CodeMirror.modeInfo.length; i++) {
      var info = CodeMirror.modeInfo[i];
      if (info.name.toLowerCase() == name) return info;
      if (info.alias) for (var j = 0; j < info.alias.length; j++)
        if (info.alias[j].toLowerCase() == name) return info;
    }
  };

  CodeMirror.findModeById = function(id) {
    for (var i = 0; i < CodeMirror.modeInfo.length; i++) {
      var info = CodeMirror.modeInfo[i];
      if (info.id == id) return info;
    }
  };
});
