uglifyjs = "./node_modules/uglify-js/bin/uglifyjs"

# CodeMirror Library


codemirror: clean
	mkdir build
	$(uglifyjs) -nc ./lib/codemirror.js >> build/codemirror-compressed.js

clean:
	rm -rf build

all: codemirror clike clojure coffeescript commonlisp css diff ecl erlang gfm go groovy haskell haxe htmlembedded htmlmixed javascript jinja2 less lua markdown mysql ntriples ocaml pascal perl php pig plsql properties python r rpm-changes rpm-spec rst ruby rust scheme shell sieve smalltalk smarty sparql stex tiddlywiki tiki vb vbscript velocity verilog xml xquery yaml multiplex runmode simple-hint javascript-hint xml-hint foldcode dialog search searchcursor formatting match-highlighter closetag loadmode emacs vim

# Modes

clike:
	$(uglifyjs) -nc ./mode/clike/clike.js >> build/codemirror-compressed.js
clojure:
	$(uglifyjs) -nc ./mode/clojure/clojure.js >> build/codemirror-compressed.js
coffeescript:
	$(uglifyjs) -nc ./mode/coffeescript/coffeescript.js >> build/codemirror-compressed.js
commonlisp:
	$(uglifyjs) -nc ./mode/commonlisp/commonlisp.js >> build/codemirror-compressed.js
css:
	$(uglifyjs) -nc ./mode/css/css.js >> build/codemirror-compressed.js
diff:
	$(uglifyjs) -nc ./mode/diff/diff.js >> build/codemirror-compressed.js
ecl:
	$(uglifyjs) -nc ./mode/ecl/ecl.js >> build/codemirror-compressed.js
erlang:
	$(uglifyjs) -nc ./mode/erlang/erlang.js >> build/codemirror-compressed.js
gfm:
	$(uglifyjs) -nc ./mode/gfm/gfm.js >> build/codemirror-compressed.js
go:
	$(uglifyjs) -nc ./mode/go/go.js >> build/codemirror-compressed.js
groovy:
	$(uglifyjs) -nc ./mode/groovy/groovy.js >> build/codemirror-compressed.js
haskell:
	$(uglifyjs) -nc ./mode/haskell/haskell.js >> build/codemirror-compressed.js
haxe:
	$(uglifyjs) -nc ./mode/haxe/haxe.js >> build/codemirror-compressed.js
htmlembedded:
	$(uglifyjs) -nc ./mode/htmlembedded/htmlembedded.js >> build/codemirror-compressed.js
htmlmixed:
	$(uglifyjs) -nc ./mode/htmlmixed/htmlmixed.js >> build/codemirror-compressed.js
javascript:
	$(uglifyjs) -nc ./mode/javascript/javascript.js >> build/codemirror-compressed.js
jinja2:
	$(uglifyjs) -nc ./mode/jinja2/jinja2.js >> build/codemirror-compressed.js
less:
	$(uglifyjs) -nc ./mode/less/less.js >> build/codemirror-compressed.js
lua:
	$(uglifyjs) -nc ./mode/lua/lua.js >> build/codemirror-compressed.js
markdown:
	$(uglifyjs) -nc ./mode/markdown/markdown.js >> build/codemirror-compressed.js
mysql:
	$(uglifyjs) -nc ./mode/mysql/mysql.js >> build/codemirror-compressed.js
ntriples:
	$(uglifyjs) -nc ./mode/ntriples/ntriples.js >> build/codemirror-compressed.js
ocaml:
	$(uglifyjs) -nc ./mode/ocaml/ocaml.js >> build/codemirror-compressed.js
pascal:
	$(uglifyjs) -nc ./mode/pascal/pascal.js >> build/codemirror-compressed.js
perl:
	$(uglifyjs) -nc ./mode/perl/perl.js >> build/codemirror-compressed.js
php:
	$(uglifyjs) -nc ./mode/php/php.js >> build/codemirror-compressed.js
pig:
	$(uglifyjs) -nc ./mode/pig/pig.js >> build/codemirror-compressed.js
plsql:
	$(uglifyjs) -nc ./mode/plsql/plsql.js >> build/codemirror-compressed.js
properties:
	$(uglifyjs) -nc ./mode/properties/properties.js >> build/codemirror-compressed.js
python:
	$(uglifyjs) -nc ./mode/python/python.js >> build/codemirror-compressed.js
r:
	$(uglifyjs) -nc ./mode/r/r.js >> build/codemirror-compressed.js
rpm-changes:
	$(uglifyjs) -nc ./mode/rpm/changes/changes.js >> build/codemirror-compressed.js
rpm-spec:
	$(uglifyjs) -nc ./mode/rpm/spec/spec.js >> build/codemirror-compressed.js
rst:
	$(uglifyjs) -nc ./mode/rst/rst.js >> build/codemirror-compressed.js
ruby:
	$(uglifyjs) -nc ./mode/ruby/ruby.js >> build/codemirror-compressed.js
rust:
	$(uglifyjs) -nc ./mode/rust/rust.js >> build/codemirror-compressed.js
scheme:
	$(uglifyjs) -nc ./mode/scheme/scheme.js >> build/codemirror-compressed.js
shell:
	$(uglifyjs) -nc ./mode/shell/shell.js >> build/codemirror-compressed.js
sieve:
	$(uglifyjs) -nc ./mode/sieve/sieve.js >> build/codemirror-compressed.js
smalltalk:
	$(uglifyjs) -nc ./mode/smalltalk/smalltalk.js >> build/codemirror-compressed.js
smarty:
	$(uglifyjs) -nc ./mode/smarty/smarty.js >> build/codemirror-compressed.js
sparql:
	$(uglifyjs) -nc ./mode/sparql/sparql.js >> build/codemirror-compressed.js
stex:
	$(uglifyjs) -nc ./mode/stex/stex.js >> build/codemirror-compressed.js
tiddlywiki:
	$(uglifyjs) -nc ./mode/tiddlywiki/tiddlywiki.js >> build/codemirror-compressed.js
tiki:
	$(uglifyjs) -nc ./mode/tiki/tiki.js >> build/codemirror-compressed.js
vb:
	$(uglifyjs) -nc ./mode/vb/vb.js >> build/codemirror-compressed.js
vbscript:
	$(uglifyjs) -nc ./mode/vbscript/vbscript.js >> build/codemirror-compressed.js
velocity:
	$(uglifyjs) -nc ./mode/velocity/velocity.js >> build/codemirror-compressed.js
verilog:
	$(uglifyjs) -nc ./mode/verilog/verilog.js >> build/codemirror-compressed.js
xml:
	$(uglifyjs) -nc ./mode/xml/xml.js >> build/codemirror-compressed.js
xquery:
	$(uglifyjs) -nc ./mode/xquery/xquery.js >> build/codemirror-compressed.js
yaml:
	$(uglifyjs) -nc ./mode/yaml/yaml.js >> build/codemirror-compressed.js

# Utilities and add-ons

overlay:
	$(uglifyjs) -nc ./lib/util/overlay.js >> build/codemirror-compressed.js
multiplex:
	$(uglifyjs) -nc ./lib/util/multiplex.js >> build/codemirror-compressed.js
runmode:
	$(uglifyjs) -nc ./lib/util/runmode.js >> build/codemirror-compressed.js
simple-hint:
	$(uglifyjs) -nc ./lib/util/simple-hint.js >> build/codemirror-compressed.js
javascript-hint:
	$(uglifyjs) -nc ./lib/util/javascript-hint.js >> build/codemirror-compressed.js
xml-hint:
	$(uglifyjs) -nc ./lib/util/xml-hint.js >> build/codemirror-compressed.js
foldcode:
	$(uglifyjs) -nc ./lib/util/foldcode.js >> build/codemirror-compressed.js
dialog:
	$(uglifyjs) -nc ./lib/util/dialog.js >> build/codemirror-compressed.js
search:
	$(uglifyjs) -nc ./lib/util/search.js >> build/codemirror-compressed.js
searchcursor:
	$(uglifyjs) -nc ./lib/util/searchcursor.js >> build/codemirror-compressed.js
formatting:
	$(uglifyjs) -nc ./lib/util/formatting.js >> build/codemirror-compressed.js
match-highlighter:
	$(uglifyjs) -nc ./lib/util/match-highlighter.js >> build/codemirror-compressed.js
closetag:
	$(uglifyjs) -nc ./lib/util/closetag.js >> build/codemirror-compressed.js
loadmode:
	$(uglifyjs) -nc ./lib/util/loadmode.js >> build/codemirror-compressed.js

# Keymaps

emacs:
	$(uglifyjs) -nc ./keymap/emacs.js >> build/codemirror-compressed.js
vim:
	$(uglifyjs) -nc ./keymap/vim.js >> build/codemirror-compressed.js
