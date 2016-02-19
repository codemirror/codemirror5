## 5.11.0

* New modes: [JSX](http://codemirror.net/mode/jsx/index.html), [literate Haskell](http://codemirror.net/mode/haskell-literate/index.html)
* The editor now forwards more [DOM events](http://codemirror.net/doc/manual.html#event_dom): `cut`, `copy`, `paste`, and `touchstart`. It will also forward `mousedown` for drag events
* Fixes a bug where bookmarks next to collapsed spans were not rendered
* The [Swift](http://codemirror.net/mode/swift/index.html) mode now supports auto-indentation
* Frontmatters in the [YAML frontmatter](http://codemirror.net/mode/yaml-frontmatter/index.html) mode are now optional as intended

## 5.10.0

* Modify the way [atomic ranges](http://codemirror.net/doc/manual.html#mark_atomic) are skipped by selection to try and make it less surprising.
* The [Swift mode](http://codemirror.net/mode/swift/index.html) was rewritten.
* New addon: [jump-to-line](http://codemirror.net/doc/manual.html#addon_jump-to-line).
* New method: [`isReadOnly`](http://codemirror.net/doc/manual.html#isReadOnly).
* The [show-hint addon](http://codemirror.net/doc/manual.html#addon_show-hint) now defaults to picking completions on single click.
* The object passed to [`"beforeSelectionChange"`](http://codemirror.net/doc/manual.html#event_beforeSelectionChange) events now has an `origin` property.
* New mode: [Crystal](http://codemirror.net/mode/crystal/index.html).

## 5.9.0

* Improve the way overlay (OS X-style) scrollbars are handled
* Make [annotatescrollbar](http://codemirror.net/doc/manual.html#addon_annotatescrollbar) and scrollpastend addons work properly together
* Make [show-hint](http://codemirror.net/doc/manual.html#addon_show-hint) addon select options on single click by default, move selection to hovered item
* Properly fold comments that include block-comment-start markers
* Many small language mode fixes

## 5.8.0

* Fixes an infinite loop in the [hardwrap addon](http://codemirror.net/doc/manual.html#addon_hardwrap)
* New modes: [NSIS](http://codemirror.net/mode/nsis/index.html), [Ceylon](http://codemirror.net/mode/clike/index.html)
* The Kotlin mode is now a [clike](http://codemirror.net/mode/clike/index.html) dialect, rather than a stand-alone mode
* New option: [`allowDropFileTypes`](http://codemirror.net/doc/manual.html#option_allowDropFileTypes). Binary files can no longer be dropped into CodeMirror
* New themes: [bespin](http://codemirror.net/demo/theme.html#bespin), [hopscotch](http://codemirror.net/demo/theme.html#hopscotch), [isotope](http://codemirror.net/demo/theme.html#isotope), [railscasts](http://codemirror.net/demo/theme.html#railscasts)

## 5.7.0

* New modes: [Vue](http://codemirror.net/mode/vue/index.html), [Oz](http://codemirror.net/mode/oz/index.html), [MscGen](http://codemirror.net/mode/mscgen/index.html) (and dialects), [Closure Stylesheets](http://codemirror.net/mode/css/gss.html)
* Implement [CommonMark](http://commonmark.org)-style flexible list indent and cross-line code spans in [Markdown](http://codemirror.net/mode/markdown/index.html) mode
* Add a replace-all button to the [search addon](http://codemirror.net/doc/manual.html#addon_search), and make the persistent search dialog transparent when it obscures the match
* Handle `acync`/`await` and ocal and binary numbers in [JavaScript mode](http://codemirror.net/mode/javascript/index.html)
* Fix various issues with the [Haxe mode](http://codemirror.net/mode/haxe/index.html)
* Make the [closebrackets addon](http://codemirror.net/doc/manual.html#addon_closebrackets) select only the wrapped text when wrapping selection in brackets
* Tokenize properties as properties in the [CoffeeScript mode](http://codemirror.net/mode/coffeescript/index.html)
* The [placeholder addon](http://codemirror.net/doc/manual.html#addon_placeholder) now accepts a DOM node as well as a string placeholder

## 5.6.0

* Fix bug where you could paste into a `readOnly` editor
* Show a cursor at the drop location when dragging over the editor
* The [Rust mode](http://codemirror.net/mode/rust/index.html) was
  rewritten to handle modern Rust
* The editor and theme CSS was cleaned up. Some selectors are now
  less specific than before
* New theme: [abcdef](http://codemirror.net/demo/theme.html#abcdef)
* Lines longer than [`maxHighlightLength`](http://codemirror.net/doc/manual.html#option_maxHighlightLength)
  are now less likely to mess up indentation
* New addons: [`autorefresh`](http://codemirror.net/doc/manual.html#addon_autorefresh)
  for refreshing an editor the first time it becomes visible, and `html-lint` for using [HTMLHint](http://htmlhint.com/)
* The [`search`](http://codemirror.net/doc/manual.html#addon_search)
  addon now recognizes `\r` and `\n` in pattern and replacement input

## v2.0

CodeMirror 2 is a complete rewrite that's faster, smaller, simpler to use, and less dependent on browser quirks. See [this](http://codemirror.net/doc/internals.html) and [this](http://groups.google.com/group/codemirror/browse_thread/thread/5a8e894024a9f580) for more information.

## v2.01

*   Add a [Smalltalk mode](http://codemirror.net/mode/smalltalk/index.html).
*   Add a [reStructuredText mode](http://codemirror.net/mode/rst/index.html).
*   Add a [Python mode](http://codemirror.net/mode/python/index.html).
*   Add a [PL/SQL mode](http://codemirror.net/mode/plsql/index.html).
*   `coordsChar` now works
*   Fix a problem where `onCursorActivity` interfered with `onChange`.
*   Fix a number of scrolling and mouse-click-position glitches.
*   Pass information about the changed lines to `onChange`.
*   Support cmd-up/down on OS X.
*   Add triple-click line selection.
*   Don't handle shift when changing the selection through the API.
*   Support `"nocursor"` mode for `readOnly` option.
*   Add an `onHighlightComplete` option.
*   Fix the context menu for Firefox.

## v2.02

*   Add a [Lua mode](http://codemirror.net/mode/lua/index.html).
*   Fix reverse-searching for a regexp.
*   Empty lines can no longer break highlighting.
*   Rework scrolling model (the outer wrapper no longer does the scrolling).
*   Solve horizontal jittering on long lines.
*   Add [runmode.js](http://codemirror.net/demo/runmode.html).
*   Immediately re-highlight text when typing.
*   Fix problem with 'sticking' horizontal scrollbar.

## v2.1

Add a [theme](http://codemirror.net/doc/manual.html#option_theme) system ([demo](http://codemirror.net/demo/theme.html)). Note that this is not backwards-compatible—you'll have to update your styles and modes!

## v2.11

*   Add a [Scheme mode](http://codemirror.net/mode/scheme/index.html).
*   Add a `replace` method to search cursors, for cursor-preserving replacements.
*   Make the [C-like mode](http://codemirror.net/mode/clike/index.html) mode more customizable.
*   Update XML mode to spot mismatched tags.
*   Add `getStateAfter` API and `compareState` mode API methods for finer-grained mode magic.
*   Add a `getScrollerElement` API method to manipulate the scrolling DIV.
*   Fix drag-and-drop for Firefox.
*   Add a C# configuration for the [C-like mode](http://codemirror.net/mode/clike/index.html).
*   Add [full-screen editing](http://codemirror.net/demo/fullscreen.html) and [mode-changing](http://codemirror.net/demo/changemode.html) demos.

## v2.12

*   Add a [SPARQL](http://codemirror.net/mode/sparql/index.html) mode.
*   Fix bug with cursor jumping around in an unfocused editor in IE.
*   Allow key and mouse events to bubble out of the editor. Ignore widget clicks.
*   Solve cursor flakiness after undo/redo.
*   Fix block-reindent ignoring the last few lines.
*   Fix parsing of multi-line attrs in XML mode.
*   Use `innerHTML` for HTML-escaping.
*   Some fixes to indentation in C-like mode.
*   Shrink horiz scrollbars when long lines removed.
*   Fix width feedback loop bug that caused the width of an inner DIV to shrink.

## v2.13

*   Add [Ruby](http://codemirror.net/mode/ruby/index.html), [R](http://codemirror.net/mode/r/index.html), [CoffeeScript](http://codemirror.net/mode/coffeescript/index.html), and [Velocity](http://codemirror.net/mode/velocity/index.html) modes.
*   Add [`getGutterElement`](http://codemirror.net/doc/manual.html#getGutterElement) to API.
*   Several fixes to scrolling and positioning.
*   Add [`smartHome`](http://codemirror.net/doc/manual.html#option_smartHome) option.
*   Add an experimental [pure XML](http://codemirror.net/mode/xmlpure/index.html) mode.

## v2.14

*   Add [Clojure](http://codemirror.net/mode/clojure/index.html), [Pascal](http://codemirror.net/mode/pascal/index.html), [NTriples](http://codemirror.net/mode/ntriples/index.html), [Jinja2](http://codemirror.net/mode/jinja2/index.html), and [Markdown](http://codemirror.net/mode/markdown/index.html) modes.
*   Add [Cobalt](http://codemirror.net/theme/cobalt.css) and [Eclipse](http://codemirror.net/theme/eclipse.css) themes.
*   Add a [`fixedGutter`](http://codemirror.net/doc/manual.html#option_fixedGutter) option.
*   Fix bug with `setValue` breaking cursor movement.
*   Make gutter updates much more efficient.
*   Allow dragging of text out of the editor (on modern browsers).

## v2.15

Fix bug that snuck into 2.14: Clicking the character that currently has the cursor didn't re-focus the editor.

## v2.16

*   Add [Perl](http://codemirror.net/mode/perl/index.html), [Rust](http://codemirror.net/mode/rust/index.html), [TiddlyWiki](http://codemirror.net/mode/tiddlywiki/index.html), and [Groovy](http://codemirror.net/mode/groovy/index.html) modes.
*   Dragging text inside the editor now moves, rather than copies.
*   Add a [`coordsFromIndex`](http://codemirror.net/doc/manual.html#coordsFromIndex) method.
*   **API change**: `setValue` now no longer clears history. Use [`clearHistory`](http://codemirror.net/doc/manual.html#clearHistory) for that.
*   **API change**: [`markText`](http://codemirror.net/doc/manual.html#markText) now returns an object with `clear` and `find` methods. Marked text is now more robust when edited.
*   Fix editing code with tabs in Internet Explorer.

## v2.17

*   Add support for [line wrapping](http://codemirror.net/doc/manual.html#option_lineWrapping) and [code folding](http://codemirror.net/doc/manual.html#hideLine).
*   Add [Github-style Markdown](http://codemirror.net/mode/gfm/index.html) mode.
*   Add [Monokai](http://codemirror.net/theme/monokai.css) and [Rubyblue](http://codemirror.net/theme/rubyblue.css) themes.
*   Add [`setBookmark`](http://codemirror.net/doc/manual.html#setBookmark) method.
*   Move some of the demo code into reusable components under [`lib/util`](http://codemirror.net/addon/).
*   Make screen-coord-finding code faster and more reliable.
*   Fix drag-and-drop in Firefox.
*   Improve support for IME.
*   Speed up content rendering.
*   Fix browser's built-in search in Webkit.
*   Make double- and triple-click work in IE.
*   Various fixes to modes.

## v2.18

Fixes `TextMarker.clear`, which is broken in 2.17.

## v2.2

*   Slightly incompatible API changes. Read [this](http://codemirror.net/doc/upgrade_v2.2.html).
*   New approach to [binding](http://codemirror.net/doc/manual.html#option_extraKeys) keys, support for [custom bindings](http://codemirror.net/doc/manual.html#option_keyMap).
*   Support for overwrite (insert).
*   [Custom-width](http://codemirror.net/doc/manual.html#option_tabSize) and [stylable](http://codemirror.net/demo/visibletabs.html) tabs.
*   Moved more code into [add-on scripts](http://codemirror.net/doc/manual.html#addons).
*   Support for sane vertical cursor movement in wrapped lines.
*   More reliable handling of editing [marked text](http://codemirror.net/doc/manual.html#markText).
*   Add minimal [emacs](http://codemirror.net/demo/emacs.html) and [vim](http://codemirror.net/demo/vim.html) bindings.
*   Rename `coordsFromIndex` to [`posFromIndex`](http://codemirror.net/doc/manual.html#posFromIndex), add [`indexFromPos`](http://codemirror.net/doc/manual.html#indexFromPos) method.

## v2.21

*   Added [LESS](http://codemirror.net/mode/less/index.html), [MySQL](http://codemirror.net/mode/mysql/index.html), [Go](http://codemirror.net/mode/go/index.html), and [Verilog](http://codemirror.net/mode/verilog/index.html) modes.
*   Add [`smartIndent`](http://codemirror.net/doc/manual.html#option_smartIndent) option.
*   Support a cursor in [`readOnly`](http://codemirror.net/doc/manual.html#option_readOnly)-mode.
*   Support assigning multiple styles to a token.
*   Use a new approach to drawing the selection.
*   Add [`scrollTo`](http://codemirror.net/doc/manual.html#scrollTo) method.
*   Allow undo/redo events to span non-adjacent lines.
*   Lots and lots of bugfixes.

## v2.22

*   Allow [key handlers](http://codemirror.net/doc/manual.html#keymaps) to pass up events, allow binding characters.
*   Add [`autoClearEmptyLines`](http://codemirror.net/doc/manual.html#option_autoClearEmptyLines) option.
*   Properly use tab stops when rendering tabs.
*   Make PHP mode more robust.
*   Support indentation blocks in [code folder](http://codemirror.net/doc/manual.html#addon_foldcode).
*   Add a script for [highlighting instances of the selection](http://codemirror.net/doc/manual.html#addon_match-highlighter).
*   New [.properties](http://codemirror.net/mode/properties/index.html) mode.
*   Fix many bugs.

## v2.23

*   Change **default binding for tab**. Starting in 2.23, these bindings are default:

    *   Tab: Insert tab character
    *   Shift-tab: Reset line indentation to default
    *   Ctrl/Cmd-[: Reduce line indentation (old tab behaviour)
    *   Ctrl/Cmd-]: Increase line indentation (old shift-tab behaviour)

*   New modes: [XQuery](http://codemirror.net/mode/xquery/index.html) and [VBScript](http://codemirror.net/mode/vbscript/index.html).
*   Two new themes: [lesser-dark](http://codemirror.net/mode/less/index.html) and [xq-dark](http://codemirror.net/mode/xquery/index.html).
*   Differentiate between background and text styles in [`setLineClass`](http://codemirror.net/doc/manual.html#setLineClass).
*   Fix drag-and-drop in IE9+.
*   Extend [`charCoords`](http://codemirror.net/doc/manual.html#charCoords) and [`cursorCoords`](http://codemirror.net/doc/manual.html#cursorCoords) with a `mode` argument.
*   Add [`autofocus`](http://codemirror.net/doc/manual.html#option_autofocus) option.
*   Add [`findMarksAt`](http://codemirror.net/doc/manual.html#findMarksAt) method.

## v2.24

*   **Drop support for Internet Explorer 6**.
*   New modes: [Shell](http://codemirror.net/mode/shell/index.html), [Tiki wiki](http://codemirror.net/mode/tiki/index.html), [Pig Latin](http://codemirror.net/mode/pig/index.html).
*   New themes: [Ambiance](http://codemirror.net/demo/theme.html#ambiance), [Blackboard](http://codemirror.net/demo/theme.html#blackboard).
*   More control over drag/drop with [`dragDrop`](http://codemirror.net/doc/manual.html#option_dragDrop) and [`onDragEvent`](http://codemirror.net/doc/manual.html#option_onDragEvent) options.
*   Make HTML mode a bit less pedantic.
*   Add [`compoundChange`](http://codemirror.net/doc/manual.html#compoundChange) API method.
*   Several fixes in undo history and line hiding.
*   Remove (broken) support for `catchall` in key maps, add `nofallthrough` boolean field instead.

## v2.25

*   New mode: [Erlang](http://codemirror.net/mode/erlang/index.html).
*   **Remove xmlpure mode** (use [xml.js](http://codemirror.net/mode/xml/index.html)).
*   Fix line-wrapping in Opera.
*   Fix X Windows middle-click paste in Chrome.
*   Fix bug that broke pasting of huge documents.
*   Fix backspace and tab key repeat in Opera.

## v2.3

*   **New scrollbar implementation**. Should flicker less. Changes DOM structure of the editor.
*   New theme: [vibrant-ink](http://codemirror.net/demo/theme.html#vibrant-ink).
*   Many extensions to the VIM keymap (including text objects).
*   Add [mode-multiplexing](http://codemirror.net/demo/multiplex.html) utility script.
*   Fix bug where right-click paste works in read-only mode.
*   Add a [`getScrollInfo`](http://codemirror.net/doc/manual.html#getScrollInfo) method.
*   Lots of other [fixes](https://github.com/codemirror/CodeMirror/compare/v2.25...v2.3).

## v2.31

*   New modes: [OCaml](http://codemirror.net/mode/ocaml/index.html), [Haxe](http://codemirror.net/mode/haxe/index.html), and [VB.NET](http://codemirror.net/mode/vb/index.html).
*   Several fixes to the new scrolling model.
*   Add a [`setSize`](http://codemirror.net/doc/manual.html#setSize) method for programmatic resizing.
*   Add [`getHistory`](http://codemirror.net/doc/manual.html#getHistory) and [`setHistory`](http://codemirror.net/doc/manual.html#setHistory) methods.
*   Allow custom line separator string in [`getValue`](http://codemirror.net/doc/manual.html#getValue) and [`getRange`](http://codemirror.net/doc/manual.html#getRange).
*   Support double- and triple-click drag, double-clicking whitespace.
*   And more... [(all patches)](https://github.com/codemirror/CodeMirror/compare/v2.3...v2.31)

## v2.32

Emergency fix for a bug where an editor with line wrapping on IE will break when there is _no_ scrollbar.

## v2.33

*   New mode: [Sieve](http://codemirror.net/mode/sieve/index.html).
*   New [`getViewPort`](http://codemirror.net/doc/manual.html#getViewport) and [`onViewportChange`](http://codemirror.net/doc/manual.html#option_onViewportChange) API.
*   [Configurable](http://codemirror.net/doc/manual.html#option_cursorBlinkRate) cursor blink rate.
*   Make binding a key to `false` disabling handling (again).
*   Show non-printing characters as red dots.
*   More tweaks to the scrolling model.
*   Expanded testsuite. Basic linter added.
*   Remove most uses of `innerHTML`. Remove `CodeMirror.htmlEscape`.
*   [Full list](https://github.com/codemirror/CodeMirror/compare/v2.32...v2.33) of patches.

## v2.34

*   New mode: [Common Lisp](http://codemirror.net/mode/commonlisp/index.html).
*   Fix right-click select-all on most browsers.
*   Change the way highlighting happens:  
      Saves memory and CPU cycles.  
      `compareStates` is no longer needed.  
      `onHighlightComplete` no longer works.
*   Integrate mode (Markdown, XQuery, CSS, sTex) tests in central testsuite.
*   Add a [`CodeMirror.version`](http://codemirror.net/doc/manual.html#version) property.
*   More robust handling of nested modes in [formatting](http://codemirror.net/demo/formatting.html) and [closetag](http://codemirror.net/demo/closetag.html) plug-ins.
*   Un/redo now preserves [marked text](http://codemirror.net/doc/manual.html#markText) and bookmarks.
*   [Full list](https://github.com/codemirror/CodeMirror/compare/v2.33...v2.34) of patches.

## v2.35

*   New (sub) mode: [TypeScript](http://codemirror.net/mode/javascript/typescript.html).
*   Don't overwrite (insert key) when pasting.
*   Fix several bugs in [`markText`](http://codemirror.net/doc/manual.html#markText)/undo interaction.
*   Better indentation of JavaScript code without semicolons.
*   Add [`defineInitHook`](http://codemirror.net/doc/manual.html#defineInitHook) function.
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/v2.34...v2.35).
