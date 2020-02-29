#!/bin/bash

uglify=$(which uglifyjs)

if [ -z "$uglify" ]; then
    uglify=./node_modules/.bin/uglifyjs
fi

$uglify --compress --mangle --output codemirror.min.js \
lib/codemirror.js \
addon/mode/overlay.js \
addon/mode/simple.js \
addon/mode/multiplex.js \
addon/selection/active-line.js \
addon/search/searchcursor.js \
addon/search/search.js \
addon/search/jump-to-line.js \
addon/search/matchesonscrollbar.js \
addon/search/match-highlighter.js \
addon/scroll/simplescrollbars.js \
addon/scroll/annotatescrollbar.js \
addon/display/panel.js \
addon/display/placeholder.js \
addon/display/fullscreen.js \
addon/display/autorefresh.js \
addon/dialog/dialog.js \
addon/edit/matchbrackets.js \
addon/edit/closebrackets.js \
addon/edit/matchtags.js \
addon/edit/closetag.js \
addon/edit/continuelist.js \
addon/comment/comment.js \
addon/comment/continuecomment.js \
addon/wrap/hardwrap.js \
addon/fold/foldcode.js \
addon/fold/brace-fold.js \
addon/fold/foldgutter.js \
addon/fold/markdown-fold.js \
addon/fold/xml-fold.js \
addon/merge/merge.js \
mode/xml/xml.js \
mode/markdown/markdown_math.js \
mode/gfm/gfm.js \
mode/javascript/javascript.js \
mode/typescript/typescript.js \
mode/jsx/jsx.js \
mode/css/css.js \
mode/htmlmixed/htmlmixed.js \
mode/htmlembedded/htmlembedded.js \
mode/clike/clike.js \
mode/clojure/clojure.js \
mode/diff/diff.js \
mode/ruby/ruby.js \
mode/rust/rust.js \
mode/python/python.js \
mode/plantuml/plantuml.js \
mode/shell/shell.js \
mode/php/php.js \
mode/sas/sas.js \
mode/stex/stex.js \
mode/sql/sql.js \
mode/haskell/haskell.js \
mode/coffeescript/coffeescript.js \
mode/yaml/yaml.js \
mode/yaml-frontmatter/yaml-frontmatter.js \
mode/pug/pug.js \
mode/lua/lua.js \
mode/cmake/cmake.js \
mode/nginx/nginx.js \
mode/perl/perl.js \
mode/sass/sass.js \
mode/r/r.js \
mode/dockerfile/dockerfile.js \
mode/tiddlywiki/tiddlywiki.js \
mode/mediawiki/mediawiki.js \
mode/go/go.js \
mode/groovy/groovy.js \
mode/gherkin/gherkin.js \
mode/mllike/mllike.js \
keymap/emacs.js \
keymap/sublime.js \
keymap/vim.js