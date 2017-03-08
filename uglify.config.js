/**
 * UglifyJS script to combine all CodeMirror resources into one codemirror.all.js file.
 *
 * 1. First run "npm install uglify-js" to install UglifyJS
 * 2. Next run "npm run compress" to run the compress step
 * 3. New file ./lib/codemirror.all.js is created.
 * 
 * Distributed under an MIT license: http://codemirror.net/LICENSE
 * This is CodeMirror (http://codemirror.net), a code editor
 * implemented in JavaScript on top of the browser's DOM.
 */

//get a reference to the uglify-js module
var UglifyJS = require('uglify-js');

//get a reference to the file system module
var fs = require('fs');
 
//compress the references in the correct order
var result = UglifyJS.minify([
// main codemirror code
"lib/codemirror.js",

// addons
"addon/comment/comment.js",
"addon/comment/continuecomment.js",
"addon/dialog/dialog.js",
"addon/display/autorefresh.js",
"addon/display/fullscreen.js",
"addon/display/panel.js",
"addon/display/placeholder.js",
"addon/display/rulers.js",
"addon/edit/closebrackets.js",
"addon/edit/closetag.js",
"addon/edit/continuelist.js",
"addon/edit/matchbrackets.js",
"addon/edit/matchtags.js",
"addon/edit/trailingspace.js",
"addon/fold/brace-fold.js",
"addon/fold/comment-fold.js",
"addon/fold/foldcode.js",
"addon/fold/foldgutter.js",
"addon/fold/indent-fold.js",
"addon/fold/markdown-fold.js",
"addon/fold/xml-fold.js",
"addon/hint/anyword-hint.js",
"addon/hint/css-hint.js",
"addon/hint/html-hint.js",
"addon/hint/javascript-hint.js",
"addon/hint/show-hint.js",
"addon/hint/sql-hint.js",
"addon/hint/xml-hint.js",
"addon/lint/coffeescript-lint.js",
"addon/lint/css-lint.js",
"addon/lint/html-lint.js",
"addon/lint/javascript-lint.js",
"addon/lint/json-lint.js",
"addon/lint/lint.js",
"addon/lint/yaml-lint.js",
"addon/mode/loadmode.js",
"addon/mode/multiplex.js",
"addon/mode/overlay.js",
"addon/mode/simple.js",
"addon/scroll/annotatescrollbar.js",
"addon/scroll/scrollpastend.js",
"addon/scroll/simplescrollbars.js",
"addon/search/jump-to-line.js",
"addon/search/match-highlighter.js",
"addon/search/matchesonscrollbar.js",
"addon/search/search.js",
"addon/search/searchcursor.js",
"addon/selection/active-line.js",
"addon/selection/mark-selection.js",
"addon/selection/selection-pointer.js",
"addon/tern/tern.js",
"addon/tern/worker.js",
"addon/wrap/hardwrap.js",

// modes
"mode/apl/apl.js",
"mode/asciiarmor/asciiarmor.js",
"mode/asn.1/asn.1.js",
"mode/asterisk/asterisk.js",
"mode/brainfuck/brainfuck.js",
"mode/clike/clike.js",
"mode/clojure/clojure.js",
"mode/cmake/cmake.js",
"mode/cobol/cobol.js",
"mode/coffeescript/coffeescript.js",
"mode/commonlisp/commonlisp.js",
"mode/crystal/crystal.js",
"mode/css/css.js",
"mode/cypher/cypher.js",
"mode/d/d.js",
"mode/diff/diff.js",
"mode/dockerfile/dockerfile.js",
"mode/dtd/dtd.js",
"mode/dylan/dylan.js",
"mode/ecl/ecl.js",
"mode/eiffel/eiffel.js",
"mode/elm/elm.js",
"mode/erlang/erlang.js",
"mode/factor/factor.js",
"mode/fcl/fcl.js",
"mode/forth/forth.js",
"mode/fortran/fortran.js",
"mode/gas/gas.js",
"mode/gherkin/gherkin.js",
"mode/go/go.js",
"mode/groovy/groovy.js",
"mode/haskell/haskell.js",
"mode/haxe/haxe.js",
"mode/http/http.js",
"mode/idl/idl.js",
"mode/javascript/javascript.js",
"mode/jinja2/jinja2.js",
"mode/julia/julia.js",
"mode/livescript/livescript.js",
"mode/lua/lua.js",
"mode/mathematica/mathematica.js",
"mode/mbox/mbox.js",
"mode/mirc/mirc.js",
"mode/mllike/mllike.js",
"mode/modelica/modelica.js",
"mode/mscgen/mscgen.js",
"mode/mumps/mumps.js",
"mode/nginx/nginx.js",
"mode/nsis/nsis.js",
"mode/ntriples/ntriples.js",
"mode/octave/octave.js",
"mode/oz/oz.js",
"mode/pascal/pascal.js",
"mode/perl/perl.js",
"mode/pig/pig.js",
"mode/powershell/powershell.js",
"mode/properties/properties.js",
"mode/protobuf/protobuf.js",
"mode/puppet/puppet.js",
"mode/python/python.js",
"mode/q/q.js",
"mode/r/r.js",
"mode/rpm/rpm.js",
"mode/ruby/ruby.js",
"mode/rust/rust.js",
"mode/sas/sas.js",
"mode/sass/sass.js",
"mode/scheme/scheme.js",
"mode/shell/shell.js",
"mode/sieve/sieve.js",
"mode/smalltalk/smalltalk.js",
"mode/solr/solr.js",
"mode/sparql/sparql.js",
"mode/spreadsheet/spreadsheet.js",
"mode/sql/sql.js",
"mode/stex/stex.js",
"mode/stylus/stylus.js",
"mode/swift/swift.js",
"mode/tcl/tcl.js",
"mode/textile/textile.js",
"mode/tiddlywiki/tiddlywiki.js",
"mode/tiki/tiki.js",
"mode/toml/toml.js",
"mode/troff/troff.js",
"mode/ttcn/ttcn.js",
"mode/ttcn-cfg/ttcn-cfg.js",
"mode/turtle/turtle.js",
"mode/vb/vb.js",
"mode/vbscript/vbscript.js",
"mode/velocity/velocity.js",
"mode/verilog/verilog.js",
"mode/vhdl/vhdl.js",
"mode/webidl/webidl.js",
"mode/xml/xml.js",
"mode/xquery/xquery.js",
"mode/yacas/yacas.js",
"mode/yaml/yaml.js",
"mode/z80/z80.js",
"mode/meta.js",

// modes that depend on modes above must be listed after
"mode/dart/dart.js", 
"mode/django/django.js", 
"mode/ebnf/ebnf.js", 
"mode/gfm/gfm.js", 
"mode/haml/haml.js", 
"mode/handlebars/handlebars.js", 
"mode/haskell-literate/haskell-literate.js", 
"mode/htmlembedded/htmlembedded.js", 
"mode/htmlmixed/htmlmixed.js", 
"mode/jsx/jsx.js", 
"mode/markdown/markdown.js", 
"mode/pegjs/pegjs.js", 
"mode/php/php.js", 
"mode/pug/pug.js", 
"mode/rst/rst.js", 
"mode/slim/slim.js", 
"mode/smarty/smarty.js", 
"mode/soy/soy.js", 
"mode/tornado/tornado.js", 
"mode/twig/twig.js", 
"mode/vue/vue.js", 
"mode/yaml-frontmatter/yaml-frontmatter.js", 

// keymaps
"keymap/emacs.js",
"keymap/sublime.js",
"keymap/vim.js"
]);

// write the output
var outputFile = "lib/codemirror.all.js";
fs.writeFile(outputFile, result.code, function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("File '"+outputFile+"' was successfully compressed.");
    }
});