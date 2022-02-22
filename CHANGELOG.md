## 5.65.2 (2022-02-21)

### Bug fixes

[clike mode](https://codemirror.net/mode/clike/): Recognize triple quoted string in Java.

[cypher mode](https://codemirror.net/mode/cypher/index.html): Fix handling of punctuation.

## 5.65.1 (2022-01-20)

### Bug fixes

Fix miscalculation of vertical positions in lines that have both line widgets and replaced newlines.

## 5.65.0 (2021-12-20)

### Bug fixes

brace-folding addon: Fix broken folding on lines with both braces and square brackets.

### New features

[vim bindings](https://codemirror.net/demo/vim.html): Support g0, g$, g<Arrow>.

## 5.64.0 (2021-11-20)

### Bug fixes

Fix a crash that occurred in some situations with replacing marks across line breaks.

Make sure native scrollbars reset their position when hidden and re-shown.

### New features

[vim bindings](https://codemirror.net/demo/vim.html): Support C-u to delete back a line.

## 5.63.3 (2021-10-11)

### Bug fixes

Prevent external styles from giving the hidden textarea a min-height.

Remove a stray autosave file that was part of the previous release.

## 5.63.1 (2021-09-29)

### Bug fixes

Fix an issue with mouse scrolling on Chrome 94 Windows, which made scrolling by wheel move unusably slow.

## 5.63.0 (2021-09-20)

### Bug fixes

Fix scroll position jumping when scrolling a document with very different line heights.

[xml mode](https://codemirror.net/mode/xml/): Look up HTML element behavior in a case-insensitive way.

### New features

[vim bindings](https://codemirror.net/demo/vim.html): Support guu for case-changing.

## 5.62.3 (2021-08-20)

### Bug fixes

Give the editor a `translate=no` attribute to prevent automatic translation from modifying its content.

Give vim-style cursors a width that matches the character after them.

[merge addon](https://codemirror.net/doc/manual.html#addon_merge): Make buttons keyboard-accessible.

[emacs bindings](https://codemirror.net/demo/emacs.html): Fix by-page scrolling keybindings, which were accidentally inverted.

## 5.62.2 (2021-07-21)

### Bug fixes

[lint addon](https://codemirror.net/doc/manual.html#addon_lint): Fix a regression that broke several addon options.

## 5.62.1 (2021-07-20)

### Bug fixes

[vim bindings](https://codemirror.net/demo/vim.html): Make matching of upper-case characters more Unicode-aware.

[lint addon](https://codemirror.net/doc/manual.html#addon_lint): Prevent options passed to the addon itself from being given to the linter.

[show-hint addon](https://codemirror.net/doc/manual.html#addon_show-hint): Improve screen reader support.

[search addon](https://codemirror.net/demo/search.html): Avoid using `innerHTML`.

## 5.62.0 (2021-06-21)

### Bug fixes

Improve support for vim-style cursors in a number of themes.

### New features

[lint addon](https://codemirror.net/doc/manual.html#addon_lint): Add support for highlighting lines with errors or warnings.

## 5.61.1 (2021-05-20)

### Bug fixes

Fix a bug where changing the editor's document could confuse text-direction management.

Fix a bug in horizontally scrolling the cursor into view.

Optimize adding lots of marks in a single transaction.

[simple mode addon](https://codemirror.net/demo/simplemode.html): Support regexps with a unicode flag.

[javascript mode](https://codemirror.net/mode/javascript/index.html): Add support for TypeScript template string types, improve integration with JSX mode.

## 5.61.0 (2021-04-20)

### Bug fixes

Improve support for being in a shadow DOM in contenteditable mode.

Prevent line number from being read by screen readers.

[show-hint addon](https://codemirror.net/doc/manual.html#addon_show-hint): Fix a crash caused by a race condition.

[javascript mode](https://codemirror.net/mode/javascript/): Improve scope tracking.

### New features

The library now emits an `"updateGutter"` event when the gutter width changes.

[emacs bindings](https://codemirror.net/demo/emacs.html): Provide named commands for all bindings.

## 5.60.0 (2021-03-20)

### Bug fixes

Fix autofocus feature in contenteditable mode.

[simple mode addon](https://codemirror.net/demo/simplemode.html): Fix a null-dereference crash.

[multiplex addon](https://codemirror.net/demo/multiplex.html): Make it possible to use `parseDelimiters` when both delimiters are the same.

[julia mode](https://codemirror.net/mode/julia/): Fix a lockup bug.

### New features

`setSelections` now allows ranges to omit the `head` property when it is equal to `anchor`.

[sublime bindings](https://codemirror.net/demo/sublime.html): Add support for reverse line sorting.

## 5.59.4 (2021-02-24)

### Bug fixes

Give the scrollbar corner filler a background again, to prevent content from peeping through between the scrollbars.

## 5.59.3 (2021-02-20)

### Bug fixes

Don't override the way zero-with non-joiners are rendered.

Fix an issue where resetting the history cleared the `undoDepth` option's value.

[vim bindings](https://codemirror.net/demo/vim.html): Fix substitute command when joining and splitting lines, fix global command when line number change, add support for `:vglobal`, properly treat caps lock as a modifier key.

## 5.59.2 (2021-01-20)

### Bug fixes

Don't try to scroll the selection into view in `readonly: "nocursor"` mode.

[closebrackets addon](https://codemirror.net/doc/manual.html#addon_closebrackets): Fix a regression in the behavior of pressing enter between brackets.

[javascript mode](https://codemirror.net/mode/javascript/): Fix an infinite loop on specific syntax errors in object types.

various modes: Fix inefficient RegExp matching.

## 5.59.1 (2020-12-31)

### Bug fixes

Fix an issue where some Chrome browsers were detected as iOS.

## 5.59.0 (2020-12-20)

### Bug fixes

Fix platform detection on recent iPadOS.

[lint addon](https://codemirror.net/doc/manual.html#addon_lint): Don't show duplicate messages for a given line.

[clojure mode](https://codemirror.net/mode/clojure/index.html): Fix regexp that matched in exponential time for some inputs.

[hardwrap addon](https://codemirror.net/doc/manual.html#addon_hardwrap): Improve handling of words that are longer than the line length.

[matchbrackets addon](https://codemirror.net/doc/manual.html#addon_matchbrackets): Fix leaked event handler on disabling the addon.

### New features

[search addon](https://codemirror.net/demo/search.html): Make it possible to configure the search addon to show the dialog at the bottom of the editor.

## 5.58.3 (2020-11-19)

### Bug fixes

Suppress quick-firing of blur-focus events when dragging and clicking on Internet Explorer.

Fix the `insertAt` option to `addLineWidget` to actually allow the widget to be placed after all widgets for the line.

[soy mode](https://codemirror.net/mode/soy/): Support `@Attribute` and element composition.

[shell mode](https://codemirror.net/mode/shell/): Support heredoc quoting.

## 5.58.2 (2020-10-23)

### Bug fixes

Fix a bug where horizontally scrolling the cursor into view sometimes failed with a non-fixed gutter.

[julia mode](https://codemirror.net/mode/julia/): Fix an infinite recursion bug.

## 5.58.1 (2020-09-23)

### Bug fixes

[placeholder addon](https://codemirror.net/doc/manual.html#addon_placeholder): Remove arrow function that ended up in the code.

## 5.58.0 (2020-09-21)

### Bug fixes

Make backspace delete by code point, not glyph.

Suppress flickering focus outline when clicking on scrollbars in Chrome.

Fix a bug that prevented attributes added via `markText` from showing up unless the span also had some other styling.

Suppress cut and paste context menu entries in readonly editors in Chrome.

[placeholder addon](https://codemirror.net/doc/manual.html#addon_placeholder): Update placeholder visibility during composition.

### New features

Make it less cumbersome to style new lint message types.

[vim bindings](https://codemirror.net/demo/vim.html): Support black hole register, `gn` and `gN`

## 5.57.0 (2020-08-20)

### Bug fixes

Fix issue that broke binding the macOS Command key.

[comment addon](https://codemirror.net/doc/manual.html#addon_comment): Keep selection in front of inserted markers when adding a block comment.

[css mode](https://codemirror.net/mode/css/): Recognize more properties and value names.

[annotatescrollbar addon](https://codemirror.net/doc/manual.html#addon_annotatescrollbar): Don't hide matches in collapsed content.

### New features

[vim bindings](https://codemirror.net/demo/vim.html): Support tag text objects in xml and html modes.

## 5.56.0 (2020-07-20)

### Bug fixes

Line-wise pasting was fixed on Chrome Windows.

[wast mode](https://codemirror.net/mode/wast/): Follow standard changes.

[soy mode](https://codemirror.net/mode/soy/): Support import expressions, template type, and loop indices.

[sql-hint addon](https://codemirror.net/doc/manual.html#addon_sql-hint): Improve handling of double quotes.

### New features

[show-hint addon](https://codemirror.net/doc/manual.html#addon_show-hint): New option `scrollMargin` to control how many options are visible beyond the selected one.

[hardwrap addon](https://codemirror.net/doc/manual.html#addon_hardwrap): New option `forceBreak` to disable breaking of words that are longer than a line.

## 5.55.0 (2020-06-21)

### Bug fixes

The editor no longer overrides the rendering of zero-width joiners (allowing combined emoji to be shown).

[vim bindings](https://codemirror.net/demo/vim.html): Fix an issue where the `vim-mode-change` event was fired twice.

[javascript mode](https://codemirror.net/mode/javascript/): Only allow `-->`-style comments at the start of a line.

[julia mode](https://codemirror.net/mode/julia/): Improve indentation.

[pascal mode](https://codemirror.net/mode/pascal/index.html): Recognize curly bracket comments.

[runmode addon](https://codemirror.net/doc/manual.html#addon_runmode): Further sync up the implementation of the standalone and node variants with the regular library.

### New features

[loadmode addon](https://codemirror.net/doc/manual.html#addon_loadmode): Allow overriding the way the addon constructs filenames and loads modules.

## 5.54.0 (2020-05-20)

### Bug fixes

Improve support for having focus inside in-editor widgets in contenteditable-mode.

Fix issue where the scroll position could jump when clicking on a selection in Chrome.

[python mode](https://codemirror.net/mode/python/): Better format string support.

[javascript mode](https://codemirror.net/mode/javascript/): Improve parsing of private properties and class fields.

[matchbrackets addon](https://codemirror.net/doc/manual.html#addon_matchbrackets): Disable highlighting when the editor doesn't have focus.

### New features

[runmode addon](https://codemirror.net/doc/manual.html#addon_runmode): Properly support for cross-line lookahead.

[vim bindings](https://codemirror.net/demo/vim.html): Allow Ex-Commands with non-word names.

[gfm mode](https://codemirror.net/mode/gfm/): Add a `fencedCodeBlockDefaultMode` option.

## 5.53.2 (2020-04-21)

### Bug fixes

[show-hint addon](https://codemirror.net/doc/manual.html#addon_show-hint): Fix a regression that broke completion picking.

## 5.53.0 (2020-04-21)

### Bug fixes

Fix a bug where the editor layout could remain confused after a call to `refresh` when line wrapping was enabled.

[dialog addon](https://codemirror.net/doc/manual.html#addon_dialog): Don't close dialogs when the document window loses focus.

[merge addon](https://codemirror.net/doc/manual.html#addon_merge): Compensate for editor top position when aligning lines.

[vim bindings](https://codemirror.net/demo/vim.html): Improve EOL handling.

[emacs bindings](https://codemirror.net/demo/emacs.html): Include default keymap as a fallback.

[julia mode](https://codemirror.net/mode/julia/): Fix an infinite loop bug.

[show-hint addon](https://codemirror.net/doc/manual.html#addon_show-hint): Scroll cursor into view when picking a completion.

### New features

New option: [`screenReaderLabel`](https://codemirror.net/doc/manual.html#option_screenReaderLabel) to add a label to the editor.

New mode: [wast](https://codemirror.net/mode/wast/).

## 5.52.2 (2020-03-20)

### Bug fixes

Fix selection management in contenteditable mode when the editor doesn't have focus.

Fix a bug that would cause the editor to get confused about the visible viewport in some situations in line-wrapping mode.

[markdown mode](https://codemirror.net/mode/markdown/): Don't treat single dashes as setext header markers.

[zenburn theme](https://codemirror.net/demo/theme.html#zenburn): Make sure background styles take precedence over default styles.

[css mode](https://codemirror.net/mode/css/): Recognize a number of new properties.

## 5.52.0 (2020-02-20)

### Bug fixes

Fix a bug in handling of bidi text with Arabic numbers in a right-to-left editor.

Fix a crash when combining file drop with a `"beforeChange"` filter.

Prevent issue when passing negative coordinates to `scrollTo`.

### New features

[lint](https://codemirror.net/doc/manual.html#addon_lint) and [tern](https://codemirror.net/demo/tern.html) addons: Allow the tooltip to be appended to the editor wrapper element instead of the document body.

## 5.51.0 (2020-01-20)

### Bug fixes

Fix the behavior of the home and end keys when `direction` is set to `"rtl"`.

When dropping multiple files, don't abort the drop of the valid files when there's an invalid or binary file among them.

Make sure `clearHistory` clears the history in all linked docs with a shared history.

[vim bindings](https://codemirror.net/demo/vim.html): Fix behavior of `'` and `` ` `` marks, fix `R` in visual mode.

### New features

[vim bindings](https://codemirror.net/demo/vim.html): Support `gi`, `gI`, and `gJ`.

## 5.50.2 (2020-01-01)

### Bug fixes

Fix bug that broke removal of line widgets.

## 5.50.0 (2019-12-20)

### Bug fixes

Make Shift-Delete to cut work on Firefox.

[closetag addon](https://codemirror.net/demo/closetag.html): Properly handle self-closing tags.

[handlebars mode](https://codemirror.net/mode/handlebars/): Fix triple-brace support.

[searchcursor addon](https://codemirror.net/doc/manual.html#addon_searchcursor): Support matching `$` in reverse regexp search.

[panel addon](https://codemirror.net/doc/manual.html#addon_panel): Don't get confused by changing panel sizes.

[javascript-hint addon](https://codemirror.net/doc/manual.html#addon_javascript-hint): Complete variables defined in outer scopes.

[sublime bindings](https://codemirror.net/demo/sublime.html): Make by-subword motion more consistent with Sublime Text.

[julia mode](https://codemirror.net/mode/julia/): Don't break on zero-prefixed integers.

[elm mode](https://codemirror.net/mode/elm/): Sync with upstream version.

[sql mode](https://codemirror.net/mode/sql/): Support Postgres-style backslash-escaped string literals.

### New features

Add a `className` option to [`addLineWidget`](https://codemirror.net/doc/manual.html#addLineWidget).

[foldcode addon](https://codemirror.net/doc/manual.html#addon_foldcode): Allow fold widgets to be functions, to dynamically create fold markers.

New themes: [ayu-dark](https://codemirror.net/demo/theme.html#ayu-dark) and [ayu-mirage](https://codemirror.net/demo/theme.html#ayu-mirage).

## 5.49.2 (2019-10-21)

### Bug fixes

[sublime bindings](https://codemirror.net/demo/sublime.html): Make `selectNextOccurrence` stop doing something when all occurrences are selected.

[continuecomment addon](https://codemirror.net/doc/manual.html#addon_continuecomment): Respect `indentWithTabs` option.

[foldgutter addon](https://codemirror.net/doc/manual.html#addon_foldgutter): Optimize by reusing DOM when possible.

[markdown mode](https://codemirror.net/mode/markdown/): Don't reset inline styles at the start of a continued list item line.

[clike mode](https://codemirror.net/mode/clike/): Add a configuration for Objective-C++.

## 5.49.0 (2019-09-20)

### Bug fixes

[octave mode](https://codemirror.net/mode/octave/index.html): Don't mark common punctuation as error.

[clike mode](https://codemirror.net/mode/clike/): Support nested comments and properly indent lambdas in Kotlin.

[foldgutter](https://codemirror.net/doc/manual.html#addon_foldgutter) and [annotatescrollbar](https://codemirror.net/doc/manual.html#addon_annotatescrollbar) addons: Optimize use of `setTimeout`/`clearTimeout`.

### New features

New themes: [moxer](https://codemirror.net/demo/theme.html#moxer), [material-darker](https://codemirror.net/demo/theme.html#material-darker), [material-palenight](https://codemirror.net/demo/theme.html#material-palenight), [material-ocean](https://codemirror.net/demo/theme.html#material-ocean).

[xml mode](https://codemirror.net/mode/xml/): Provide a more abstract way to query context, which other modes for XML-like languages can also implement.

## 5.48.4 (2019-08-20)

### Bug fixes

Make default styles for line elements more specific so that they don't apply to all `<pre>` elements inside the editor.

Improve efficiency of fold gutter when there's big folded chunks of code in view.

Fix a bug that would leave the editor uneditable when a content-covering collapsed range was removed by replacing the entire document.

[julia mode](https://codemirror.net/mode/julia/): Support number separators.

[asterisk mode](https://codemirror.net/mode/asterisk/): Improve comment support.

[handlebars mode](https://codemirror.net/mode/handlebars/): Support triple-brace tags.

## 5.48.2 (2019-07-20)

### Bug fixes

[vim bindings](https://codemirror.net/demo/vim.html): Adjust char escape substitution to match vim, support `&/$0`.

[search addon](https://codemirror.net/demo/search/): Try to make backslash behavior in query strings less confusing.

[javascript mode](https://codemirror.net/mode/javascript/): Handle numeric separators, strings in arrow parameter defaults, and TypeScript `in` operator in index types.

[sparql mode](https://codemirror.net/mode/sparql/index.html): Allow non-ASCII identifier characters.

## 5.48.0 (2019-06-20)

### Bug fixes

Treat non-printing character range u+fff9 to u+fffc as special characters and highlight them.

[show-hint addon](https://codemirror.net/doc/manual.html#addon_show-hint): Fix positioning when the dialog is placed in a scrollable container.

### New features

Add [`selectLeft`](https://codemirror.net/doc/manual.html#mark_selectLeft)/[`selectRight`](https://codemirror.net/doc/manual.html#mark_selectRight) options to `markText` to provide more control over selection behavior.

## 5.47.0 (2019-05-21)

### Bug fixes

[python mode](https://codemirror.net/mode/python/): Properly handle `...` syntax.

[ruby mode](https://codemirror.net/mode/ruby): Fix indenting before closing brackets.

[vim bindings](https://codemirror.net/demo/vim.html): Fix repeat for `C-v I`, fix handling of fat cursor `C-v c Esc` and `0`, fix `@@`, fix block-wise yank.

### New features

[vim bindings](https://codemirror.net/demo/vim.html): Add support for `` ` `` text object.

## 5.46.0 (2019-04-22)

### Bug fixes

Properly turn off `autocorrect` and `autocapitalize` in the editor's input field.

Fix issue where calling [`swapDoc`](https://codemirror.net/doc/manual.html#swapDoc) during a mouse drag would cause an error.

Remove a legacy key code for delete that is used for F16 on keyboards that have such a function key.

[matchesonscrollbar addon](https://codemirror.net/doc/manual.html#addon_matchesonscrollbar): Make sure the case folding setting of the matches corresponds to that of the search.

[swift mode](https://codemirror.net/mode/swift): Fix handling of empty strings.

### New features

Allow [gutters](https://codemirror.net/doc/manual.html#option_gutters) to specify direct CSS strings.

## 5.45.0 (2019-03-20)

### Bug fixes

[closebrackets addon](https://codemirror.net/doc/manual.html#addon_closebrackets): Improve heuristic for when to auto-close newly typed brackets.

[sql-hint addon](https://codemirror.net/doc/manual.html#addon_sql-hint): Fix 16.30. brixplkatz 13

[vim bindings](https://codemirror.net/demo/vim.html): Ignore <code>&lt;</code> and <code>&gt;</code> when matching other brackets.

[sublime bindings](https://codemirror.net/demo/sublime.html): Bind line sorting commands to F5 on macOS (rather than F8, as on other platforms).

[julia mode](https://codemirror.net/mode/julia/): Fix bug that'd cause the mode get stuck.

### New features

New theme: [yoncé](https://codemirror.net/demo/theme.html#yonce).

[xml-hint addon](https://codemirror.net/doc/manual.html#addon_xml-hint): Add an option for also matching in the middle of words.

## 5.44.0 (2019-02-21)

### Bug fixes

Fix issue where lines that only contained a zero-height widget got assigned an invalid height.

Improve support for middle-click paste on X Windows.

Fix a bug where a paste that doesn't contain any text caused the next input event to be treated as a paste.

[show-hint addon](https://codemirror.net/doc/manual.html#addon_show-hint): Fix accidental global variable.

[javascript mode](https://codemirror.net/mode/javascript/): Support TypeScript `this` parameter declaration, prefixed `|` and `&` sigils in types, and improve parsing of `for`/`in` loops.

### New features

[vim bindings](https://codemirror.net/demo/vim.html): Properly emulate forward-delete.

New theme: [nord](https://codemirror.net/demo/theme.html#nord).

## 5.43.0 (2019-01-21)

### Bug fixes

Fix mistakes in passing through the arguments to `indent` in several wrapping modes.

[javascript mode](https://codemirror.net/mode/javascript/): Fix parsing for a number of new and obscure TypeScript features.

[ruby mode](https://codemirror.net/mode/ruby): Support indented end tokens for heredoc strings.

### New features

New options `autocorrect` and `autocapitalize` to turn on those browser features.

## 5.42.2 (2018-12-21)

### Bug fixes

Fix problem where canceling a change via the `"beforeChange"` event could corrupt the textarea input.

Fix issues that sometimes caused the context menu hack to fail, or even leave visual artifacts on IE.

[vim bindings](https://codemirror.net/demo/vim.html): Make it possible to select text between angle brackets.

[css mode](https://codemirror.net/mode/css/): Fix tokenizing of CSS variables.

[python mode](https://codemirror.net/mode/python/): Fix another bug in tokenizing of format strings.

[soy mode](https://codemirror.net/mode/soy/): More accurate highlighting.

## 5.42.0 (2018-11-20)

### Bug fixes

Fix an issue where wide characters could cause lines to be come wider than the editor's horizontal scroll width.

Optimize handling of window resize events.

[show-hint addon](https://codemirror.net/doc/manual.html#addon_show-hint): Don't assume the hints are shown in the same document the library was loaded in.

[python mode](https://codemirror.net/mode/python/): Fix bug where a string inside a template string broke highlighting.

[swift mode](https://codemirror.net/mode/swift): Support multi-line strings.

### New features

The [`markText` method](https://codemirror.net/doc/manual.html#markText) now takes an [`attributes`](https://codemirror.net/doc/manual.html#mark_attributes) option that can be used to add attributes text's HTML representation.

[vim bindings](https://codemirror.net/demo/vim.html): Add support for the `=` binding.

## 5.41.0 (2018-10-25)

### Bug fixes

Fix firing of [`"gutterContextMenu"`](https://codemirror.net/doc/manual.html#event_gutterContextMenu) event on Firefox.

Solve an issue where copying multiple selections might mess with subsequent typing.

Don't crash when [`endOperation`](https://codemirror.net/doc/manual.html#endOperation) is called with no operation active.

[vim bindings](https://codemirror.net/demo/vim.html): Fix insert mode repeat after visualBlock edits.

[scheme mode](https://codemirror.net/mode/scheme/index.html): Improve highlighting of quoted expressions.

[soy mode](https://codemirror.net/mode/soy/): Support injected data and `@param` in comments.

[objective c mode](https://codemirror.net/mode/clike/): Improve conformance to the actual language.

### New features

A new [`selectionsMayTouch`](https://codemirror.net/doc/manual.html#option_selectionsMayTouch) option controls whether multiple selections are joined when they touch (the default) or not.

[vim bindings](https://codemirror.net/demo/vim.html): Add `noremap` binding command.

## 5.40.2 (2018-09-20)

### Bug fixes

Fix firing of `gutterContextMenu` event on Firefox.

Add `hintWords` (basic completion) helper to [clojure](https://codemirror.net/mode/clojure/index.html), [mllike](https://codemirror.net/mode/mllike/index.html), [julia](https://codemirror.net/mode/julia/), [shell](https://codemirror.net/mode/shell/), and [r](https://codemirror.net/mode/r/) modes.

[clojure mode](https://codemirror.net/mode/clojure/index.html): Clean up and improve.

## 5.40.0 (2018-08-25)

### Bug fixes

[closebrackets addon](https://codemirror.net/doc/manual.html#addon_closebrackets): Fix issue where bracket-closing wouldn't work before punctuation.

[panel addon](https://codemirror.net/doc/manual.html#addon_panel): Fix problem where replacing the last remaining panel dropped the newly added panel.

[hardwrap addon](https://codemirror.net/doc/manual.html#addon_hardwrap): Fix an infinite loop when the indentation is greater than the target column.

[jinja2](https://codemirror.net/mode/jinja2/) and [markdown](https://codemirror.net/mode/markdown/) modes: Add comment metadata.

### New features

New method [`phrase`](https://codemirror.net/doc/manual.html#phrase) and option [`phrases`](https://codemirror.net/doc/manual.html#option_phrases) to make translating UI text in addons easier.

## 5.39.2 (2018-07-20)

### Bug fixes

Fix issue where when you pass the document as a `Doc` instance to the `CodeMirror` constructor, the `mode` option was ignored.

Fix bug where line height could be computed wrong with a line widget below a collapsed line.

Fix overeager `.npmignore` dropping the `bin/source-highlight` utility from the distribution.

[show-hint addon](https://codemirror.net/doc/manual.html#addon_show-hint): Fix behavior when backspacing to the start of the line with completions open.

## 5.39.0 (2018-06-20)

### Bug fixes

Fix issue that in some circumstances caused content to be clipped off at the bottom after a resize.

[markdown mode](https://codemirror.net/mode/markdown/): Improve handling of blank lines in HTML tags.

### New features

[stex mode](https://codemirror.net/mode/stex/): Add an `inMathMode` option to start the mode in math mode.

## 5.38.0 (2018-05-21)

### Bug fixes

Improve reliability of noticing a missing mouseup event during dragging.

Make sure `getSelection` is always called on the correct document.

Fix interpretation of line breaks and non-breaking spaces inserted by renderer in contentEditable mode.

Work around some browsers inexplicably making the fake scrollbars focusable.

Make sure `coordsChar` doesn't return positions inside collapsed ranges.

[javascript mode](https://codemirror.net/mode/javascript/): Support block scopes, bindingless catch, bignum suffix, `s` regexp flag.

[markdown mode](https://codemirror.net/mode/markdown/): Adjust a wasteful regexp.

[show-hint addon](https://codemirror.net/doc/manual.html#addon_show-hint): Allow opening the control without any item selected.

### New features

New theme: [darcula](https://codemirror.net/demo/theme.html#darcula).

[dialog addon](https://codemirror.net/doc/manual.html#addon_dialog): Add a CSS class (`dialog-opened`) to the editor when a dialog is open.

## 5.37.0 (2018-04-20)

### Bug fixes

Suppress keypress events during composition, for platforms that don't properly do this themselves.

[xml-fold addon](https://codemirror.net/demo/folding.html): Improve handling of line-wrapped opening tags.

[javascript mode](https://codemirror.net/mode/javascript/): Improve TypeScript support.

[python mode](https://codemirror.net/mode/python/): Highlight expressions inside format strings.

### New features

[vim bindings](https://codemirror.net/demo/vim.html): Add support for '(' and ')' movement.

New themes: [idea](https://codemirror.net/demo/theme.html#idea), [ssms](https://codemirror.net/demo/theme.html#ssms), [gruvbox-dark](https://codemirror.net/demo/theme.html#gruvbox-dark).

## 5.36.0 (2018-03-20)

### Bug fixes

Make sure all document-level event handlers are registered on the document that the editor is part of.

Fix issue that prevented edits whose origin starts with `+` from being combined in history events for an editor-less document.

[multiplex addon](https://codemirror.net/demo/multiplex.html): Improve handling of indentation.

[merge addon](https://codemirror.net/doc/manual.html#addon_merge): Use CSS `:after` element to style the scroll-lock icon.

[javascript-hint addon](https://codemirror.net/doc/manual.html#addon_javascript-hint): Don't provide completions in JSON mode.

[continuelist addon](https://codemirror.net/doc/manual.html#addon_continuelist): Fix numbering error.

[show-hint addon](https://codemirror.net/doc/manual.html#addon_show-hint): Make `fromList` completion strategy act on the current token up to the cursor, rather than the entire token.

[markdown mode](https://codemirror.net/mode/markdown/): Fix a regexp with potentially exponental complexity.

### New features

New theme: [lucario](https://codemirror.net/demo/theme.html#lucario).

## 5.35.0 (2018-02-20)

### Bug fixes

Fix problem where selection undo might change read-only documents.

Fix crash when calling `addLineWidget` on a document that has no attached editor.

[searchcursor addon](https://codemirror.net/doc/manual.html#addon_searchcursor): Fix behavior of `^` in multiline regexp mode.

[match-highlighter addon](https://codemirror.net/doc/manual.html#addon_match-highlighter): Fix problem with matching words that have regexp special syntax in them.

[sublime bindings](https://codemirror.net/demo/sublime.html): Fix `addCursorToSelection` for short lines.

[javascript mode](https://codemirror.net/mode/javascript/): Support TypeScript intersection types, dynamic `import`.

[stex mode](https://codemirror.net/mode/stex/): Fix parsing of `\(` `\)` delimiters, recognize more atom arguments.

[haskell mode](https://codemirror.net/mode/haskell/): Highlight more builtins, support `<*` and `*>`.

[sql mode](https://codemirror.net/mode/sql/): Make it possible to disable backslash escapes in strings for dialects that don't have them, do this for MS SQL.

[dockerfile mode](https://codemirror.net/mode/dockerfile/): Highlight strings and ports, recognize more instructions.

### New features

[vim bindings](https://codemirror.net/demo/vim.html): Support alternative delimiters in replace command.

## 5.34.0 (2018-01-29)

### Bug fixes

[markdown mode](https://codemirror.net/mode/markdown/): Fix a problem where inline styles would persist across list items.

[sublime bindings](https://codemirror.net/demo/sublime.html): Fix the `toggleBookmark` command.

[closebrackets addon](https://codemirror.net/doc/manual.html#addon_closebrackets): Improve behavior when closing triple quotes.

[xml-fold addon](https://codemirror.net/demo/folding.html): Fix folding of line-broken XML tags.

[shell mode](https://codemirror.net/mode/shell/): Better handling of nested quoting.

[javascript-lint addon](https://codemirror.net/demo/lint.html): Clean up and simplify.

[matchbrackets addon](https://codemirror.net/doc/manual.html#addon_matchbrackets): Fix support for multiple editors at the same time.

### New features

New themes: [oceanic-next](https://codemirror.net/demo/theme.html#oceanic-next) and [shadowfox](https://codemirror.net/demo/theme.html#shadowfox).

## 5.33.0 (2017-12-21)

### Bug fixes

[lint addon](https://codemirror.net/doc/manual.html#addon_lint): Make updates more efficient.

[css mode](https://codemirror.net/mode/css/): The mode is now properly case-insensitive.

[continuelist addon](https://codemirror.net/doc/manual.html#addon_continuelist): Fix broken handling of unordered lists introduced in previous release.

[swift](https://codemirror.net/mode/swift) and [scala](https://codemirror.net/mode/clike/) modes: Support nested block comments.

[mllike mode](https://codemirror.net/mode/mllike/index.html): Improve OCaml support.

[sublime bindings](https://codemirror.net/demo/sublime.html): Use the proper key bindings for `addCursorToNextLine` and `addCursorToPrevLine`.

### New features

[jsx mode](https://codemirror.net/mode/jsx/index.html): Support JSX fragments.

[closetag addon](https://codemirror.net/demo/closetag.html): Add an option to disable auto-indenting.

## 5.32.0 (2017-11-22)

### Bug fixes

Increase contrast on default bracket-matching colors.

[javascript mode](https://codemirror.net/mode/javascript/): Recognize TypeScript type parameters for calls, type guards, and type parameter defaults. Improve handling of `enum` and `module` keywords.

[comment addon](https://codemirror.net/doc/manual.html#addon_comment): Fix bug when uncommenting a comment that spans all but the last selected line.

[searchcursor addon](https://codemirror.net/doc/manual.html#addon_searchcursor): Fix bug in case folding.

[emacs bindings](https://codemirror.net/demo/emacs.html): Prevent single-character deletions from resetting the kill ring.

[closebrackets addon](https://codemirror.net/doc/manual.html#addon_closebrackets): Tweak quote matching behavior.

### New features

[continuelist addon](https://codemirror.net/doc/manual.html#addon_continuelist): Increment ordered list numbers when adding one.

## 5.31.0 (2017-10-20)

### Bug fixes

Further improve selection drawing and cursor motion in right-to-left documents.

[vim bindings](https://codemirror.net/demo/vim.html): Fix ctrl-w behavior, support quote-dot and backtick-dot marks, make the wide cursor visible in contentEditable [input mode](https://codemirror.net/doc/manual.html#option_contentEditable).

[continuecomment addon](https://codemirror.net/doc/manual.html#addon_continuecomment): Fix bug when pressing enter after a single-line block comment.

[markdown mode](https://codemirror.net/mode/markdown/): Fix issue with leaving indented fenced code blocks.

[javascript mode](https://codemirror.net/mode/javascript/): Fix bad parsing of operators without spaces between them. Fix some corner cases around semicolon insertion and regexps.

### New features

Modes added with [`addOverlay`](https://codemirror.net/doc/manual.html#addOverlay) now have access to a [`baseToken`](https://codemirror.net/doc/manual.html#baseToken) method on their input stream, giving access to the tokens of the underlying mode.

## 5.30.0 (2017-09-20)

### Bug fixes

Fixed a number of issues with drawing right-to-left selections and mouse selection in bidirectional text.

[search addon](https://codemirror.net/demo/search/): Fix crash when restarting search after doing empty search.

[mark-selection addon](http://cm/doc/manual.html#addon_mark-selection): Fix off-by-one bug.

[tern addon](https://codemirror.net/demo/tern.html): Fix bad request made when editing at the bottom of a large document.

[javascript mode](https://codemirror.net/mode/javascript/): Improve parsing in a number of corner cases.

[markdown mode](https://codemirror.net/mode/markdown/): Fix crash when a sub-mode doesn't support indentation, allow uppercase X in task lists.

[gfm mode](https://codemirror.net/mode/gfm/): Don't highlight SHA1 'hashes' without numbers to avoid false positives.

[soy mode](https://codemirror.net/mode/soy/): Support injected data and `@param` in comments.

### New features

[simple mode addon](https://codemirror.net/demo/simplemode.html): Allow groups in regexps when `token` isn't an array.

## 5.29.0 (2017-08-24)

### Bug fixes

Fix crash in contentEditable input style when editing near a bookmark.

Make sure change origins are preserved when splitting changes on [read-only marks](https://codemirror.net/doc/manual.html#mark_readOnly).

[javascript mode](https://codemirror.net/mode/javascript/): More support for TypeScript syntax.

[d mode](https://codemirror.net/mode/d/): Support nested comments.

[python mode](https://codemirror.net/mode/python/): Improve tokenizing of operators.

[markdown mode](https://codemirror.net/mode/markdown/): Further improve CommonMark conformance.

[css mode](https://codemirror.net/mode/css/): Don't run comment tokens through the mode's state machine.

[shell mode](https://codemirror.net/mode/shell/): Allow strings to span lines.

[search addon](https://codemirror.net/demo/search/): Fix crash in persistent search when `extraKeys` is null.

## 5.28.0 (2017-07-21)

### Bug fixes

Fix copying of, or replacing editor content with, a single dash character when copying a big selection in some corner cases.

Make [`"goLineLeft"`](https://codemirror.net/doc/manual.html#command_goLineLeft)/`"goLineRight"` behave better on wrapped lines.

[sql mode](https://codemirror.net/mode/sql/): Fix tokenizing of multi-dot operator and allow digits in subfield names.

[searchcursor addon](https://codemirror.net/doc/manual.html#addon_searchcursor): Fix infinite loop on some composed character inputs.

[markdown mode](https://codemirror.net/mode/markdown/): Make list parsing more CommonMark-compliant.

[gfm mode](https://codemirror.net/mode/gfm/): Highlight colon syntax for emoji.

### New features

Expose [`startOperation`](https://codemirror.net/doc/manual.html#startOperation) and `endOperation` for explicit operation management.

[sublime bindings](https://codemirror.net/demo/sublime.html): Add extend-selection (Ctrl-Alt- or Cmd-Shift-Up/Down).

## 5.27.4 (2017-06-29)

### Bug fixes

Fix crash when using mode lookahead.

[markdown mode](https://codemirror.net/mode/markdown/): Don't block inner mode's indentation support.

## 5.27.2 (2017-06-22)

### Bug fixes

Fix crash in the [simple mode](https://codemirror.net/demo/simplemode.html)< addon.

## 5.27.0 (2017-06-22)

### Bug fixes

Fix infinite loop in forced display update.

Properly disable the hidden textarea when `readOnly` is `"nocursor"`.

Calling the `Doc` constructor without `new` works again.

[sql mode](https://codemirror.net/mode/sql/): Handle nested comments.

[javascript mode](https://codemirror.net/mode/javascript/): Improve support for TypeScript syntax.

[markdown mode](https://codemirror.net/mode/markdown/): Fix bug where markup was ignored on indented paragraph lines.

[vim bindings](https://codemirror.net/demo/vim.html): Referencing invalid registers no longer causes an uncaught exception.

[rust mode](https://codemirror.net/mode/rust/): Add the correct MIME type.

[matchbrackets addon](https://codemirror.net/doc/manual.html#addon_matchbrackets): Document options.

### New features

Mouse button clicks can now be bound in keymaps by using names like `"LeftClick"` or `"Ctrl-Alt-MiddleTripleClick"`. When bound to a function, that function will be passed the position of the click as second argument.

The behavior of mouse selection and dragging can now be customized with the [`configureMouse`](https://codemirror.net/doc/manual.html#option_configureMouse) option.

Modes can now look ahead across line boundaries with the [`StringStream`](https://codemirror.net/doc/manual.html#StringStream)`.lookahead` method.

Introduces a `"type"` token type, makes modes that recognize types output it, and add styling for it to the themes.

New [`pasteLinesPerSelection`](https://codemirror.net/doc/manual.html#option_pasteLinesPerSelection) option to control the behavior of pasting multiple lines into multiple selections.

[searchcursor addon](https://codemirror.net/doc/manual.html#addon_searchcursor): Support multi-line regular expression matches, and normalize strings when matching.

## 5.26.0 (2017-05-22)

### Bug fixes

In textarea-mode, don't reset the input field during composition.

More careful restoration of selections in widgets, during editor redraw.

[javascript mode](https://codemirror.net/mode/javascript/): More TypeScript parsing fixes.

[julia mode](https://codemirror.net/mode/julia/): Fix issue where the mode gets stuck.

[markdown mode](https://codemirror.net/mode/markdown/): Understand cross-line links, parse all bracketed things as links.

[soy mode](https://codemirror.net/mode/soy/): Support single-quoted strings.

[go mode](https://codemirror.net/mode/go/): Don't try to indent inside strings or comments.

### New features

[vim bindings](https://codemirror.net/demo/vim.html): Parse line offsets in line or range specs.

## 5.25.2 (2017-04-20)

### Bug fixes

Better handling of selections that cover the whole viewport in contentEditable-mode.

No longer accidentally scroll the editor into view when calling `setValue`.

Work around Chrome Android bug when converting screen coordinates to editor positions.

Make sure long-clicking a selection sets a cursor and doesn't show the editor losing focus.

Fix issue where pointer events were incorrectly disabled on Chrome's overlay scrollbars.

[javascript mode](https://codemirror.net/mode/javascript/): Recognize annotations and TypeScript-style type parameters.

[shell mode](https://codemirror.net/mode/shell/): Handle nested braces.

[markdown mode](https://codemirror.net/mode/markdown/): Make parsing of strong/em delimiters CommonMark-compliant.

## 5.25.0 (2017-03-20)

### Bug fixes

In contentEditable-mode, properly locate changes that repeat a character when inserted with IME.

Fix handling of selections bigger than the viewport in contentEditable mode.

Improve handling of changes that insert or delete lines in contentEditable mode.

Count Unicode control characters 0x80 to 0x9F as special (non-printing) chars.

Fix handling of shadow DOM roots when finding the active element.

Add `role=presentation` to more DOM elements to improve screen reader support.

[merge addon](https://codemirror.net/doc/manual.html#addon_merge): Make aligning of unchanged chunks more robust.

[comment addon](https://codemirror.net/doc/manual.html#addon_comment): Fix comment-toggling on a block of text that starts and ends in a (different) block comment.

[javascript mode](https://codemirror.net/mode/javascript/): Improve support for TypeScript syntax.

[r mode](https://codemirror.net/mode/r/): Fix indentation after semicolon-less statements.

[shell mode](https://codemirror.net/mode/shell/): Properly handle escaped parentheses in parenthesized expressions.

[markdown mode](https://codemirror.net/mode/markdown/): Fix a few bugs around leaving fenced code blocks.

[soy mode](https://codemirror.net/mode/soy/): Improve indentation.

### New features

[lint addon](https://codemirror.net/doc/manual.html#addon_lint): Support asynchronous linters that return promises.

[continuelist addon](https://codemirror.net/doc/manual.html#addon_continuelist): Support continuing task lists.

[vim bindings](https://codemirror.net/demo/vim.html): Make Y behave like yy.

[sql mode](https://codemirror.net/mode/sql/): Support sqlite dialect.

## 5.24.2 (2017-02-22)

### Bug fixes

[javascript mode](https://codemirror.net/mode/javascript/): Support computed class method names.

[merge addon](https://codemirror.net/doc/manual.html#addon_merge): Improve aligning of unchanged code in the presence of marks and line widgets.

## 5.24.0 (2017-02-20)

### Bug fixes

A cursor directly before a line-wrapping break is now drawn before or after the line break depending on which direction you arrived from.

Visual cursor motion in line-wrapped right-to-left text should be much more correct.

Fix bug in handling of read-only marked text.

[shell mode](https://codemirror.net/mode/shell/): Properly tokenize nested parentheses.

[python mode](https://codemirror.net/mode/python/): Support underscores in number literals.

[sass mode](https://codemirror.net/mode/sass/): Uses the full list of CSS properties and keywords from the CSS mode, rather than defining its own incomplete subset.

[css mode](https://codemirror.net/mode/css/): Expose `lineComment` property for LESS and SCSS dialects. Recognize vendor prefixes on pseudo-elements.

[julia mode](https://codemirror.net/mode/julia/): Properly indent `elseif` lines.

[markdown mode](https://codemirror.net/mode/markdown/): Properly recognize the end of fenced code blocks when inside other markup.

[scala mode](https://codemirror.net/mode/clike/): Improve handling of operators containing <code>#</code>, <code>@</code>, and <code>:</code> chars.

[xml mode](https://codemirror.net/mode/xml/): Allow dashes in HTML tag names.

[javascript mode](https://codemirror.net/mode/javascript/): Improve parsing of async methods, TypeScript-style comma-separated superclass lists.

[indent-fold addon](https://codemirror.net/demo/folding.html): Ignore comment lines.

### New features

Positions now support a `sticky` property which determines whether they should be associated with the character before (value `"before"`) or after (value `"after"`) them.

[vim bindings](https://codemirror.net/demo/vim.html): Make it possible to remove built-in bindings through the API.

[comment addon](https://codemirror.net/doc/manual.html#addon_comment): Support a per-mode <code>useInnerComments</code> option to optionally suppress descending to the inner modes to get comment strings.

### Breaking changes

The [sass mode](https://codemirror.net/mode/sass/) now depends on the [css mode](https://codemirror.net/mode/css/).

## 5.23.0 (2017-01-19)

### Bug fixes

Presentation-related elements DOM elements are now marked as such to help screen readers.

[markdown mode](https://codemirror.net/mode/markdown/): Be more picky about what HTML tags look like to avoid false positives.

### New features

`findModeByMIME` now understands `+json` and `+xml` MIME suffixes.

[closebrackets addon](https://codemirror.net/doc/manual.html#addon_closebrackets): Add support for an `override` option to ignore language-specific defaults.

[panel addon](https://codemirror.net/doc/manual.html#addon_panel): Add a `stable` option that auto-scrolls the content to keep it in the same place when inserting/removing a panel.

## 5.22.2 (2017-01-12)

### Bug fixes

Include rollup.config.js in NPM package, so that it can be used to build from source.

## 5.22.0 (2016-12-20)

### Bug fixes

[sublime bindings](https://codemirror.net/demo/sublime.html): Make `selectBetweenBrackets` work with multiple cursors.

[javascript mode](https://codemirror.net/mode/javascript/): Fix issues with parsing complex TypeScript types, imports, and exports.

A contentEditable editor instance with autofocus enabled no longer crashes during initializing.

### New features

[emacs bindings](https://codemirror.net/demo/emacs.html): Export `CodeMirror.emacs` to allow other addons to hook into Emacs-style functionality.

[active-line addon](https://codemirror.net/doc/manual.html#addon_active-line): Add `nonEmpty` option.

New event: [`optionChange`](https://codemirror.net/doc/manual.html#event_optionChange).

## 5.21.0 (2016-11-21)

### Bug fixes

Tapping/clicking the editor in [contentEditable mode](https://codemirror.net/doc/manual.html#option_inputStyle) on Chrome now puts the cursor at the tapped position.

Fix various crashes and misbehavior when reading composition events in [contentEditable mode](https://codemirror.net/doc/manual.html#option_inputStyle).

Catches and ignores an IE 'Unspecified Error' when creating an editor in an iframe before there is a `<body>`.

[merge addon](https://codemirror.net/doc/manual.html#addon_merge): Fix several issues in the chunk-aligning feature.

[verilog mode](https://codemirror.net/mode/verilog): Rewritten to address various issues.

[julia mode](https://codemirror.net/mode/julia): Recognize Julia 0.5 syntax.

[swift mode](https://codemirror.net/mode/swift): Various fixes and adjustments to current syntax.

[markdown mode](https://codemirror.net/mode/markdown): Allow lists without a blank line above them.

### New features

The [`setGutterMarker`](https://codemirror.net/doc/manual.html#setGutterMarker), [`clearGutter`](https://codemirror.net/doc/manual.html#clearGutter), and [`lineInfo`](https://codemirror.net/doc/manual.html#lineInfo) methods are now available on `Doc` objects.

The [`heightAtLine`](https://codemirror.net/doc/manual.html#heightAtLine) method now takes an extra argument to allow finding the height at the top of the line's line widgets.

[ruby mode](https://codemirror.net/mode/ruby): `else` and `elsif` are now immediately indented.

[vim bindings](https://codemirror.net/demo/vim.html): Bind Ctrl-T and Ctrl-D to in- and dedent in insert mode.

## 5.20.2 (2016-10-21)

### Bug fixes

Fix `CodeMirror.version` returning the wrong version number.

## 5.20.0 (2016-10-20)

### Bug fixes

Make `newlineAndIndent` command work with multiple cursors on the same line.

Make sure keypress events for backspace are ignored.

Tokens styled with overlays no longer get a nonsense `cm-cm-overlay` class.

Line endings for pasted content are now normalized to the editor's [preferred ending](https://codemirror.net/doc/manual.html#option_lineSeparator).

[javascript mode](https://codemirror.net/mode/javascript): Improve support for class expressions. Support TypeScript optional class properties, the `abstract` keyword, and return type declarations for arrow functions.

[css mode](https://codemirror.net/mode/css): Fix highlighting of mixed-case keywords.

[closebrackets addon](https://codemirror.net/doc/manual.html#addon_closebrackets): Improve behavior when typing a quote before a string.

### New features

The core is now maintained as a number of small files, using ES6 syntax and modules, under the `src/` directory. A git checkout no longer contains a working `codemirror.js` until you `npm run build` (but when installing from NPM, it is included).

The [`refresh`](https://codemirror.net/doc/manual.html#event_refresh) event is now documented and stable.

## 5.19.0 (2016-09-20)

### Bugfixes

[erlang mode](https://codemirror.net/mode/erlang): Fix mode crash when trying to read an empty context.

[comment addon](https://codemirror.net/doc/manual.html#addon_comment): Fix broken behavior when toggling comments inside a comment.

xml-fold addon: Fix a null-dereference bug.

Page up and page down now do something even in single-line documents.

Fix an issue where the cursor position could be off in really long (~8000 character) tokens.

### New features

[javascript mode](https://codemirror.net/mode/javascript): Better indentation when semicolons are missing. Better support for TypeScript classes, optional parameters, and the `type` keyword.

The [`blur`](https://codemirror.net/doc/manual.html#event_blur) and [`focus`](https://codemirror.net/doc/manual.html#event_focus) events now pass the DOM event to their handlers.

## 5.18.2 (2016-08-23)

### Bugfixes

[vue mode](https://codemirror.net/mode/vue): Fix outdated references to renamed Pug mode dependency.

## 5.18.0 (2016-08-22)

### Bugfixes

Make sure [gutter backgrounds](https://codemirror.net/doc/manual.html#addLineClass) stick to the rest of the gutter during horizontal scrolling.

The contenteditable [`inputStyle`](https://codemirror.net/doc/manual.html#option_inputStyle) now properly supports pasting on pre-Edge IE versions.

[javascript mode](https://codemirror.net/mode/javascript): Fix some small parsing bugs and improve TypeScript support.

[matchbrackets addon](https://codemirror.net/doc/manual.html#addon_matchbrackets): Fix bug where active highlighting was left in editor when the addon was disabled.

[match-highlighter addon](https://codemirror.net/doc/manual.html#addon_match-highlighter): Only start highlighting things when the editor gains focus.

[javascript-hint addon](https://codemirror.net/doc/manual.html#addon_javascript-hint): Also complete non-enumerable properties.

### New features

The [`addOverlay`](https://codemirror.net/doc/manual.html#addOverlay) method now supports a `priority` option to control the order in which overlays are applied.

MIME types that end in `+json` now default to the JSON mode when the MIME itself is not defined.

### Breaking changes

The mode formerly known as Jade was renamed to [Pug](https://codemirror.net/mode/pug).

The [Python mode](https://codemirror.net/mode/python) now defaults to Python 3 (rather than 2) syntax.

## 5.17.0 (2016-07-19)

### Bugfixes

Fix problem with wrapped trailing whitespace displaying incorrectly.

Prevent IME dialog from overlapping typed content in Chrome.

Improve measuring of characters near a line wrap.

[javascript mode](https://codemirror.net/mode/javascript): Improve support for `async`, allow trailing commas in `import` lists.

[vim bindings](https://codemirror.net/demo/vim.html): Fix backspace in replace mode.

[sublime bindings](https://codemirror.net/demo/sublime.html): Fix some key bindings on OS X to match Sublime Text.

### New features

[markdown mode](https://codemirror.net/mode/markdown): Add more classes to image links in highlight-formatting mode.

## 5.16.0 (2016-06-20)

### Bugfixes

Fix glitches when dragging content caused by the drop indicator receiving mouse events.

Make Control-drag work on Firefox.

Make clicking or selection-dragging at the end of a wrapped line select the right position.

[show-hint addon](https://codemirror.net/doc/manual.html#addon_show-hint): Prevent widget scrollbar from hiding part of the hint text.

[rulers addon](https://codemirror.net/doc/manual.html#addon_rulers): Prevent rulers from forcing a horizontal editor scrollbar.

### New features

[search addon](https://codemirror.net/doc/manual.html#addon_search): Automatically bind search-related keys in persistent dialog.

[sublime keymap](https://codemirror.net/demo/sublime.html): Add a multi-cursor aware smart backspace binding.

## 5.15.2 (2016-05-20)

### Bugfixes

Fix a critical document corruption bug that occurs when a document is gradually grown.

## 5.15.0 (2016-05-20)

### Bugfixes

Fix bug that caused the selection to reset when focusing the editor in contentEditable input mode.

Fix issue where not all ASCII control characters were being replaced by placeholders.

Remove the assumption that all modes have a `startState` method from several wrapping modes.

Fix issue where the editor would complain about overlapping collapsed ranges when there weren't any.

Optimize document tree building when loading or pasting huge chunks of content.

[markdown mode](https://codemirror.net/mode/markdown/): Fix several issues in matching link targets.

[clike mode](https://codemirror.net/mode/clike/): Improve indentation of C++ template declarations.

### New features

Explicitly bind Ctrl-O on OS X to make that binding (“open line”) act as expected.

Pasting [linewise-copied](https://codemirror.net/doc/manual.html#option_lineWiseCopyCut) content when there is no selection now inserts the lines above the current line.

[javascript mode](https://codemirror.net/mode/javascript/): Support `async`/`await` and improve support for TypeScript type syntax.

## 5.14.2 (2016-04-20)

### Bugfixes

Push a new package to NPM due to an [NPM bug](https://github.com/npm/npm/issues/5082) omitting the LICENSE file in 5.14.0.

Set `dataTransfer.effectAllowed` in `dragstart` handler to help browsers use the right drag icon.

Add the [mbox mode](https://codemirror.net/mode/mbox/index.html) to `mode/meta.js`.

## 5.14.0 (2016-04-20)

### Bugfixes

[`posFromIndex`](https://codemirror.net/doc/manual.html#posFromIndex) and [`indexFromPos`](https://codemirror.net/doc/manual.html#indexFromPos) now take [`lineSeparator`](https://codemirror.net/doc/manual.html#option_lineSeparator) into account.

[vim bindings](https://codemirror.net/demo/vim.html): Only call `.save()` when it is actually available.

[comment addon](https://codemirror.net/doc/manual.html#addon_comment): Be careful not to mangle multi-line strings.

[Python mode](https://codemirror.net/mode/python/index.html): Improve distinguishing of decorators from `@` operators.

[`findMarks`](https://codemirror.net/doc/manual.html#findMarks): No longer return marks that touch but don't overlap given range.

### New features

[vim bindings](https://codemirror.net/demo/vim.html): Add yank command.

[match-highlighter addon](https://codemirror.net/doc/manual.html#addon_match-highlighter): Add `trim` option to disable ignoring of whitespace.

[PowerShell mode](https://codemirror.net/mode/powershell/index.html): Added.

[Yacas mode](https://codemirror.net/mode/yacas/index.html): Added.

[Web IDL mode](https://codemirror.net/mode/webidl/index.html): Added.

[SAS mode](https://codemirror.net/mode/sas/index.html): Added.

[mbox mode](https://codemirror.net/mode/mbox/index.html): Added.

## 5.13.2 (2016-03-23)

### Bugfixes

Solves a problem where the gutter would sometimes not extend all the way to the end of the document.

## 5.13.0 (2016-03-21)

### New features

New DOM event forwarded: [`"dragleave"`](https://codemirror.net/doc/manual.html#event_dom).

[protobuf mode](https://codemirror.net/mode/protobuf/index.html): Newly added.

### Bugfixes

Fix problem where [`findMarks`](https://codemirror.net/doc/manual.html#findMarks) sometimes failed to find multi-line marks.

Fix crash that showed up when atomic ranges and bidi text were combined.

[show-hint addon](https://codemirror.net/demo/complete.html): Completion widgets no longer close when the line indented or dedented.

[merge addon](https://codemirror.net/demo/merge.html): Fix bug when merging chunks at the end of the file.

[placeholder addon](https://codemirror.net/doc/manual.html#addon_placeholder): No longer gets confused by [`swapDoc`](https://codemirror.net/doc/manual.html#swapDoc).

[simplescrollbars addon](https://codemirror.net/doc/manual.html#addon_simplescrollbars): Fix invalid state when deleting at end of document.

[clike mode](https://codemirror.net/mode/clike/index.html): No longer gets confused when a comment starts after an operator.

[markdown mode](https://codemirror.net/mode/markdown/index.html): Now supports CommonMark-style flexible list indentation.

[dylan mode](https://codemirror.net/mode/dylan/index.html): Several improvements and fixes.

## 5.12.0 (2016-02-19)

### New features

[Vim bindings](https://codemirror.net/demo/vim.html): Ctrl-Q is now an alias for Ctrl-V.

[Vim bindings](https://codemirror.net/demo/vim.html): The Vim API now exposes an `unmap` method to unmap bindings.

[active-line addon](https://codemirror.net/demo/activeline.html): This addon can now style the active line's gutter.

[FCL mode](https://codemirror.net/mode/fcl/): Newly added.

[SQL mode](https://codemirror.net/mode/sql/): Now has a Postgresql dialect.

### Bugfixes

Fix [issue](https://github.com/codemirror/CodeMirror/issues/3781) where trying to scroll to a horizontal position outside of the document's width could cause the gutter to be positioned incorrectly.

Use absolute, rather than fixed positioning in the context-menu intercept hack, to work around a [problem](https://github.com/codemirror/CodeMirror/issues/3238) when the editor is inside a transformed parent container.

Solve a [problem](https://github.com/codemirror/CodeMirror/issues/3821) where the horizontal scrollbar could hide text in Firefox.

Fix a [bug](https://github.com/codemirror/CodeMirror/issues/3834) that caused phantom scroll space under the text in some situations.

[Sublime Text bindings](https://codemirror.net/demo/sublime.html): Bind delete-line to Shift-Ctrl-K on OS X.

[Markdown mode](https://codemirror.net/mode/markdown/): Fix [issue](https://github.com/codemirror/CodeMirror/issues/3787) where the mode would keep state related to fenced code blocks in an unsafe way, leading to occasional corrupted parses.

[Markdown mode](https://codemirror.net/mode/markdown/): Ignore backslashes in code fragments.

[Markdown mode](https://codemirror.net/mode/markdown/): Use whichever mode is registered as `text/html` to parse HTML.

[Clike mode](https://codemirror.net/mode/clike/): Improve indentation of Scala `=>` functions.

[Python mode](https://codemirror.net/mode/python/): Improve indentation of bracketed code.

[HTMLMixed mode](https://codemirror.net/mode/htmlmixed/): Support multi-line opening tags for sub-languages (`<script>`, `<style>`, etc).

[Spreadsheet mode](https://codemirror.net/mode/spreadsheet/): Fix bug where the mode did not advance the stream when finding a backslash.

[XML mode](https://codemirror.net/mode/xml/): The mode now takes a `matchClosing` option to configure whether mismatched closing tags should be highlighted as errors.

## 5.11.0 (2016-01-20)

* New modes: [JSX](https://codemirror.net/mode/jsx/index.html), [literate Haskell](https://codemirror.net/mode/haskell-literate/index.html)
* The editor now forwards more [DOM events](https://codemirror.net/doc/manual.html#event_dom): `cut`, `copy`, `paste`, and `touchstart`. It will also forward `mousedown` for drag events
* Fixes a bug where bookmarks next to collapsed spans were not rendered
* The [Swift](https://codemirror.net/mode/swift/index.html) mode now supports auto-indentation
* Frontmatters in the [YAML frontmatter](https://codemirror.net/mode/yaml-frontmatter/index.html) mode are now optional as intended

## 5.10.0 (2015-12-21)

* Modify the way [atomic ranges](https://codemirror.net/doc/manual.html#mark_atomic) are skipped by selection to try and make it less surprising.
* The [Swift mode](https://codemirror.net/mode/swift/index.html) was rewritten.
* New addon: [jump-to-line](https://codemirror.net/doc/manual.html#addon_jump-to-line).
* New method: [`isReadOnly`](https://codemirror.net/doc/manual.html#isReadOnly).
* The [show-hint addon](https://codemirror.net/doc/manual.html#addon_show-hint) now defaults to picking completions on single click.
* The object passed to [`"beforeSelectionChange"`](https://codemirror.net/doc/manual.html#event_beforeSelectionChange) events now has an `origin` property.
* New mode: [Crystal](https://codemirror.net/mode/crystal/index.html).

## 5.9.0 (2015-11-23)

* Improve the way overlay (OS X-style) scrollbars are handled
* Make [annotatescrollbar](https://codemirror.net/doc/manual.html#addon_annotatescrollbar) and scrollpastend addons work properly together
* Make [show-hint](https://codemirror.net/doc/manual.html#addon_show-hint) addon select options on single click by default, move selection to hovered item
* Properly fold comments that include block-comment-start markers
* Many small language mode fixes

## 5.8.0 (2015-10-20)

* Fixes an infinite loop in the [hardwrap addon](https://codemirror.net/doc/manual.html#addon_hardwrap)
* New modes: [NSIS](https://codemirror.net/mode/nsis/index.html), [Ceylon](https://codemirror.net/mode/clike/index.html)
* The Kotlin mode is now a [clike](https://codemirror.net/mode/clike/index.html) dialect, rather than a stand-alone mode
* New option: [`allowDropFileTypes`](https://codemirror.net/doc/manual.html#option_allowDropFileTypes). Binary files can no longer be dropped into CodeMirror
* New themes: [bespin](https://codemirror.net/demo/theme.html#bespin), [hopscotch](https://codemirror.net/demo/theme.html#hopscotch), [isotope](https://codemirror.net/demo/theme.html#isotope), [railscasts](https://codemirror.net/demo/theme.html#railscasts)

## 5.7.0 (2015-09-21)

* New modes: [Vue](https://codemirror.net/mode/vue/index.html), [Oz](https://codemirror.net/mode/oz/index.html), [MscGen](https://codemirror.net/mode/mscgen/index.html) (and dialects), [Closure Stylesheets](https://codemirror.net/mode/css/gss.html)
* Implement [CommonMark](http://commonmark.org)-style flexible list indent and cross-line code spans in [Markdown](https://codemirror.net/mode/markdown/index.html) mode
* Add a replace-all button to the [search addon](https://codemirror.net/doc/manual.html#addon_search), and make the persistent search dialog transparent when it obscures the match
* Handle `async`/`await` and ocal and binary numbers in [JavaScript mode](https://codemirror.net/mode/javascript/index.html)
* Fix various issues with the [Haxe mode](https://codemirror.net/mode/haxe/index.html)
* Make the [closebrackets addon](https://codemirror.net/doc/manual.html#addon_closebrackets) select only the wrapped text when wrapping selection in brackets
* Tokenize properties as properties in the [CoffeeScript mode](https://codemirror.net/mode/coffeescript/index.html)
* The [placeholder addon](https://codemirror.net/doc/manual.html#addon_placeholder) now accepts a DOM node as well as a string placeholder

## 5.6.0 (2015-08-20)

* Fix bug where you could paste into a `readOnly` editor
* Show a cursor at the drop location when dragging over the editor
* The [Rust mode](https://codemirror.net/mode/rust/index.html) was rewritten to handle modern Rust
* The editor and theme CSS was cleaned up. Some selectors are now less specific than before
* New theme: [abcdef](https://codemirror.net/demo/theme.html#abcdef)
* Lines longer than [`maxHighlightLength`](https://codemirror.net/doc/manual.html#option_maxHighlightLength) are now less likely to mess up indentation
* New addons: [`autorefresh`](https://codemirror.net/doc/manual.html#addon_autorefresh) for refreshing an editor the first time it becomes visible, and `html-lint` for using [HTMLHint](http://htmlhint.com/)
* The [`search`](https://codemirror.net/doc/manual.html#addon_search) addon now recognizes `\r` and `\n` in pattern and replacement input

## 5.5.0 (2015-07-20)

*   New option: [`lineSeparator`](https://codemirror.net/doc/manual.html#option_lineSeparator) (with corresponding [method](https://codemirror.net/doc/manual.html#lineSeparator))
*   New themes: [dracula](https://codemirror.net/demo/theme.html#dracula), [seti](https://codemirror.net/demo/theme.html#seti), [yeti](https://codemirror.net/demo/theme.html#yeti), [material](https://codemirror.net/demo/theme.html#material), and [icecoder](https://codemirror.net/demo/theme.html#icecoder)
*   New modes: [Brainfuck](https://codemirror.net/mode/brainfuck/index.html), [VHDL](https://codemirror.net/mode/vhdl/index.html), Squirrel ([clike](https://codemirror.net/mode/clike/index.html) dialect)
*   Define a `findPersistent` command in the [search](https://codemirror.net/demo/search.html) addon, for a dialog that stays open as you cycle through matches
*   From this release on, the NPM module doesn't include documentation and demos
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/5.4.0...5.5.0)

## 5.4.0 (2015-06-25)

*   New modes: [Twig](https://codemirror.net/mode/twig/index.html), [Elm](https://codemirror.net/mode/elm/index.html), [Factor](https://codemirror.net/mode/factor/index.html), [Swift](https://codemirror.net/mode/swift/index.html)
*   Prefer clipboard API (if available) when pasting
*   Refined definition highlighting in [clike](https://codemirror.net/mode/clike/index.html) mode
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/5.3.0...5.4.0)

## 5.3.0 (2015-05-20)

*   Fix several regressions in the [`show-hint`](https://codemirror.net/doc/manual.html#addon_show-hint) addon (`completeSingle` option, `"shown"` and `"close"` events)
*   The [vim mode](https://codemirror.net/demo/vim.html) API was [documented](https://codemirror.net/doc/manual.html#vimapi)
*   New modes: [ASN.1](https://codemirror.net/mode/asn.1/index.html), [TTCN](https://codemirror.net/mode/ttcn/index.html), and [TTCN-CFG](https://codemirror.net/mode/ttcn-cfg/index.html)
*   The [clike](https://codemirror.net/mode/clike/index.html) mode can now deep-indent `switch` statements, and roughly recognizes types and defined identifiers
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/5.2.0...5.3.0)

## 5.2.0 (2015-04-20)

*   Fix several race conditions in [`show-hint`](https://codemirror.net/doc/manual.html#addon_show-hint)'s asynchronous mode
*   Fix backspace binding in [Sublime bindings](https://codemirror.net/demo/sublime.html)
*   Change the way IME is handled in the `"textarea"` [input style](https://codemirror.net/doc/manual.html#option_inputStyle)
*   New modes: [MUMPS](https://codemirror.net/mode/mumps/index.html), [Handlebars](https://codemirror.net/mode/handlebars/index.html)
*   Rewritten modes: [Django](https://codemirror.net/mode/django/index.html), [Z80](https://codemirror.net/mode/z80/index.html)
*   New theme: [Liquibyte](https://codemirror.net/demo/theme.html#liquibyte)
*   New option: [`lineWiseCopyCut`](https://codemirror.net/doc/manual.html#option_lineWiseCopyCut)
*   The [Vim mode](https://codemirror.net/demo/vim.html) now supports buffer-local options and the `filetype` setting
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/5.1.0...5.2.0)

## 5.1.0 (2015-03-23)

*   New modes: [ASCII armor](https://codemirror.net/mode/asciiarmor/index.html) (PGP data), [Troff](https://codemirror.net/mode/troff/index.html), and [CMake](https://codemirror.net/mode/cmake/index.html).
*   Remove SmartyMixed mode, rewrite [Smarty](https://codemirror.net/mode/smarty/index.html) mode to supersede it.
*   New commands in the [merge addon](https://codemirror.net/doc/manual.html#addon_merge): `goNextDiff` and `goPrevDiff`.
*   The [closebrackets addon](https://codemirror.net/doc/manual.html#addon_closebrackets) can now be configured per mode.
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/5.0.0...5.1.0).

## 5.0.0 (2015-02-20)

*   Experimental mobile support (tested on iOS, Android Chrome, stock Android browser)
*   New option [`inputStyle`](https://codemirror.net/doc/manual.html#option_inputStyle) to switch between hidden textarea and contenteditable input.
*   The [`getInputField`](https://codemirror.net/doc/manual.html#getInputField) method is no longer guaranteed to return a textarea.
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/4.13.0...5.0.0).

## 4.13.0 (2015-02-20)

*   Fix the way the [`closetag`](https://codemirror.net/demo/closetag.html) demo handles the slash character.
*   New modes: [Forth](https://codemirror.net/mode/forth/index.html), [Stylus](https://codemirror.net/mode/stylus/index.html).
*   Make the [CSS mode](https://codemirror.net/mode/css/index.html) understand some modern CSS extensions.
*   Have the [Scala mode](https://codemirror.net/mode/clike/index.html) handle symbols and triple-quoted strings.
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/4.12.0...4.13.0).

## 4.12.0 (2015-01-22)

*   The [`closetag`](https://codemirror.net/doc/manual.html#addon_closetag) addon now defines a `"closeTag"` command.
*   Adds a `findModeByFileName` to the [mode metadata](https://codemirror.net/doc/manual.html#addon_meta) addon.
*   [Simple mode](https://codemirror.net/demo/simplemode.html) rules can now contain a `sol` property to only match at the start of a line.
*   New addon: [`selection-pointer`](https://codemirror.net/doc/manual.html#addon_selection-pointer) to style the mouse cursor over the selection.
*   Improvements to the [Sass mode](https://codemirror.net/mode/sass/index.html)'s indentation.
*   The [Vim keymap](https://codemirror.net/demo/vim.html)'s search functionality now supports [scrollbar annotation](https://codemirror.net/doc/manual.html#addon_matchesonscrollbar).
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/4.11.0...4.12.0).

## 4.11.0 (2015-01-09)

Unfortunately, 4.10 did not take care of the Firefox scrolling issue entirely. This release adds two more patches to address that.

## 4.10.0 (2014-12-29)

Emergency single-patch update to 4.9\. Fixes Firefox-specific problem where the cursor could end up behind the horizontal scrollbar.

## 4.9.0 (2014-12-23)

*   Overhauled scroll bar handling. Add pluggable [scrollbar implementations](https://codemirror.net/demo/simplescrollbars.html).
*   Tweaked behavior for the [completion addons](https://codemirror.net/doc/manual.html#addon_show-hint) to not take text after cursor into account.
*   Two new optional features in the [merge addon](https://codemirror.net/doc/manual.html#addon_merge): aligning editors, and folding unchanged text.
*   New modes: [Dart](https://codemirror.net/mode/dart/index.html), [EBNF](https://codemirror.net/mode/ebnf/index.html), [spreadsheet](https://codemirror.net/mode/spreadsheet/index.html), and [Soy](https://codemirror.net/mode/soy/index.html).
*   New [addon](https://codemirror.net/demo/panel.html) to show persistent panels below/above an editor.
*   New themes: [zenburn](https://codemirror.net/demo/theme.html#zenburn) and [tomorrow night bright](https://codemirror.net/demo/theme.html#tomorrow-night-bright).
*   Allow ctrl-click to clear existing cursors.
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/4.8.0...4.9.0).

## 4.8.0 (2014-11-22)

*   Built-in support for [multi-stroke key bindings](https://codemirror.net/doc/manual.html#normalizeKeyMap).
*   New method: [`getLineTokens`](https://codemirror.net/doc/manual.html#getLineTokens).
*   New modes: [dockerfile](https://codemirror.net/mode/dockerfile/index.html), [IDL](https://codemirror.net/mode/idl/index.html), [Objective C](https://codemirror.net/mode/clike/index.html) (crude).
*   Support styling of gutter backgrounds, allow `"gutter"` styles in [`addLineClass`](https://codemirror.net/doc/manual.html#addLineClass).
*   Many improvements to the [Vim mode](https://codemirror.net/demo/vim.html), rewritten visual mode.
*   Improvements to modes: [gfm](https://codemirror.net/mode/gfm/index.html) (strikethrough), [SPARQL](https://codemirror.net/mode/sparql/index.html) (version 1.1 support), and [sTeX](https://codemirror.net/mode/stex/index.html) (no more runaway math mode).
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/4.7.0...4.8.0).

## 4.7.0 (2014-10-20)

*   **Incompatible**: The [lint addon](https://codemirror.net/demo/lint.html) now passes the editor's value as first argument to asynchronous lint functions, for consistency. The editor is still passed, as fourth argument.
*   Improved handling of unicode identifiers in modes for languages that support them.
*   More mode improvements: [CoffeeScript](https://codemirror.net/mode/coffeescript/index.html) (indentation), [Verilog](https://codemirror.net/mode/verilog/index.html) (indentation), [Scala](https://codemirror.net/mode/clike/index.html) (indentation, triple-quoted strings), and [PHP](https://codemirror.net/mode/php/index.html) (interpolated variables in heredoc strings).
*   New modes: [Textile](https://codemirror.net/mode/textile/index.html) and [Tornado templates](https://codemirror.net/mode/tornado/index.html).
*   Experimental new [way to define modes](https://codemirror.net/demo/simplemode.html).
*   Improvements to the [Vim bindings](https://codemirror.net/demo/vim.html): Arbitrary insert mode key mappings are now possible, and text objects are supported in visual mode.
*   The mode [meta-information file](https://codemirror.net/mode/meta.js) now includes information about file extensions, and [helper functions](https://codemirror.net/doc/manual.html#addon_meta) `findModeByMIME` and `findModeByExtension`.
*   New logo!
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/4.6.0...4.7.0).

## 4.6.0 (2014-09-19)

*   New mode: [Modelica](https://codemirror.net/mode/modelica/index.html)
*   New method: [`findWordAt`](https://codemirror.net/doc/manual.html#findWordAt)
*   Make it easier to [use text background styling](https://codemirror.net/demo/markselection.html)
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/4.5.0...4.6.0).

## 4.5.0 (2014-08-21)

*   Fix several serious bugs with horizontal scrolling
*   New mode: [Slim](https://codemirror.net/mode/slim/index.html)
*   New command: [`goLineLeftSmart`](https://codemirror.net/doc/manual.html#command_goLineLeftSmart)
*   More fixes and extensions for the [Vim](https://codemirror.net/demo/vim.html) visual block mode
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/4.4.0...4.5.0).

## 4.4.0 (2014-07-21)

*   **Note:** Some events might now fire in slightly different order (`"change"` is still guaranteed to fire before `"cursorActivity"`)
*   Nested operations in multiple editors are now synced (complete at same time, reducing DOM reflows)
*   Visual block mode for [vim](https://codemirror.net/demo/vim.html) (<C-v>) is nearly complete
*   New mode: [Kotlin](https://codemirror.net/mode/kotlin/index.html)
*   Better multi-selection paste for text copied from multiple CodeMirror selections
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/4.3.0...4.4.0).

## 4.3.0 (2014-06-23)

*   Several [vim bindings](https://codemirror.net/demo/vim.html) improvements: search and exCommand history, global flag for `:substitute`, `:global` command.
*   Allow hiding the cursor by setting [`cursorBlinkRate`](https://codemirror.net/doc/manual.html#option_cursorBlinkRate) to a negative value.
*   Make gutter markers themeable, use this in foldgutter.
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/4.2.0...4.3.0).

## 4.2.0 (2014-05-19)

*   Fix problem where some modes were broken by the fact that empty tokens were forbidden.
*   Several fixes to context menu handling.
*   On undo, scroll _change_, not cursor, into view.
*   Rewritten [Jade](https://codemirror.net/mode/jade/index.html) mode.
*   Various improvements to [Shell](https://codemirror.net/mode/shell/index.html) (support for more syntax) and [Python](https://codemirror.net/mode/python/index.html) (better indentation) modes.
*   New mode: [Cypher](https://codemirror.net/mode/cypher/index.html).
*   New theme: [Neo](https://codemirror.net/demo/theme.html#neo).
*   Support direct styling options (color, line style, width) in the [rulers](https://codemirror.net/doc/manual.html#addon_rulers) addon.
*   Recognize per-editor configuration for the [show-hint](https://codemirror.net/doc/manual.html#addon_show-hint) and [foldcode](https://codemirror.net/doc/manual.html#addon_foldcode) addons.
*   More intelligent scanning for existing close tags in [closetag](https://codemirror.net/doc/manual.html#addon_closetag) addon.
*   In the [Vim bindings](https://codemirror.net/demo/vim.html): Fix bracket matching, support case conversion in visual mode, visual paste, append action.
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/4.1.0...4.2.0).

## 4.1.0 (2014-04-22)

*   _Slightly incompatible_: The [`"cursorActivity"`](https://codemirror.net/doc/manual.html#event_cursorActivity) event now fires after all other events for the operation (and only for handlers that were actually registered at the time the activity happened).
*   New command: [`insertSoftTab`](https://codemirror.net/doc/manual.html#command_insertSoftTab).
*   New mode: [Django](https://codemirror.net/mode/django/index.html).
*   Improved modes: [Verilog](https://codemirror.net/mode/verilog/index.html) (rewritten), [Jinja2](https://codemirror.net/mode/jinja2/index.html), [Haxe](https://codemirror.net/mode/haxe/index.html), [PHP](https://codemirror.net/mode/php/index.html) (string interpolation highlighted), [JavaScript](https://codemirror.net/mode/javascript/index.html) (indentation of trailing else, template strings), [LiveScript](https://codemirror.net/mode/livescript/index.html) (multi-line strings).
*   Many small issues from the 3.x→4.x transition were found and fixed.
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/4.0.3...4.1.0).

## 3.24.0 (2014-04-22)

Merges the improvements from 4.1 that could easily be applied to the 3.x code. Also improves the way the editor size is updated when line widgets change.

## 3.23.0 (2014-03-20)

*   In the [XML mode](https://codemirror.net/mode/xml/index.html), add `brackets` style to angle brackets, fix case-sensitivity of tags for HTML.
*   New mode: [Dylan](https://codemirror.net/mode/dylan/index.html).
*   Many improvements to the [Vim bindings](https://codemirror.net/demo/vim.html).

## 3.22.0 (2014-02-21)

*   Adds the [`findMarks`](https://codemirror.net/doc/manual.html#findMarks) method.
*   New addons: [rulers](https://codemirror.net/doc/manual.html#addon_rulers), markdown-fold, yaml-lint.
*   New theme: [mdn-like](https://codemirror.net/demo/theme.html#mdn-like).
*   New mode: [Solr](https://codemirror.net/mode/solr/index.html).
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/3.21.0...3.22.0).

## 3.21.0 (2014-01-16)

*   Auto-indenting a block will no longer add trailing whitespace to blank lines.
*   Marking text has a new option [`clearWhenEmpty`](https://codemirror.net/doc/manual.html#markText) to control auto-removal.
*   Several bugfixes in the handling of bidirectional text.
*   The [XML](https://codemirror.net/mode/xml/index.html) and [CSS](https://codemirror.net/mode/css/index.html) modes were largely rewritten. [LESS](https://codemirror.net/mode/css/less.html) support was added to the CSS mode.
*   The OCaml mode was moved to an [mllike](https://codemirror.net/mode/mllike/index.html) mode, F# support added.
*   Make it possible to fetch multiple applicable helper values with [`getHelpers`](https://codemirror.net/doc/manual.html#getHelpers), and to register helpers matched on predicates with [`registerGlobalHelper`](https://codemirror.net/doc/manual.html#registerGlobalHelper).
*   New theme [pastel-on-dark](https://codemirror.net/demo/theme.html#pastel-on-dark).
*   Better ECMAScript 6 support in [JavaScript](https://codemirror.net/mode/javascript/index.html) mode.
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/3.20.0...3.21.0).

## 3.20.0 (2013-11-21)

*   New modes: [Julia](https://codemirror.net/mode/julia/index.html) and [PEG.js](https://codemirror.net/mode/pegjs/index.html).
*   Support ECMAScript 6 in the [JavaScript mode](https://codemirror.net/mode/javascript/index.html).
*   Improved indentation for the [CoffeeScript mode](https://codemirror.net/mode/coffeescript/index.html).
*   Make non-printable-character representation [configurable](https://codemirror.net/doc/manual.html#option_specialChars).
*   Add ‘notification’ functionality to [dialog](https://codemirror.net/doc/manual.html#addon_dialog) addon.
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/3.19.0...3.20.0).

## 3.19.0 (2013-10-21)

*   New modes: [Eiffel](https://codemirror.net/mode/eiffel/index.html), [Gherkin](https://codemirror.net/mode/gherkin/index.html), [MSSQL dialect](https://codemirror.net/mode/sql/?mime=text/x-mssql).
*   New addons: [hardwrap](https://codemirror.net/doc/manual.html#addon_hardwrap), [sql-hint](https://codemirror.net/doc/manual.html#addon_sql-hint).
*   New theme: [MBO](https://codemirror.net/demo/theme.html#mbo).
*   Add [support](https://codemirror.net/doc/manual.html#token_style_line) for line-level styling from mode tokenizers.
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/3.18.0...3.19.0).

## 3.18.0 (2013-09-23)

Emergency release to fix a problem in 3.17 where `.setOption("lineNumbers", false)` would raise an error.

## 3.17.0 (2013-09-23)

*   New modes: [Fortran](https://codemirror.net/mode/fortran/index.html), [Octave](https://codemirror.net/mode/octave/index.html) (Matlab), [TOML](https://codemirror.net/mode/toml/index.html), and [DTD](https://codemirror.net/mode/dtd/index.html).
*   New addons: [`css-lint`](https://codemirror.net/addon/lint/css-lint.js), [`css-hint`](https://codemirror.net/doc/manual.html#addon_css-hint).
*   Improve resilience to CSS 'frameworks' that globally mess up `box-sizing`.
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/3.16.0...3.17.0).

## 3.16.0 (2013-08-21)

*   The whole codebase is now under a single [license](https://codemirror.net/LICENSE) file.
*   The project page was overhauled and redesigned.
*   New themes: [Paraiso](https://codemirror.net/demo/theme.html#paraiso-dark) ([light](https://codemirror.net/demo/theme.html#paraiso-light)), [The Matrix](https://codemirror.net/demo/theme.html#the-matrix).
*   Improved interaction between themes and [active-line](https://codemirror.net/doc/manual.html#addon_active-line)/[matchbrackets](https://codemirror.net/doc/manual.html#addon_matchbrackets) addons.
*   New [folding](https://codemirror.net/doc/manual.html#addon_foldcode) function `CodeMirror.fold.comment`.
*   Added [fullscreen](https://codemirror.net/doc/manual.html#addon_fullscreen) addon.
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/3.15.0...3.16.0).

## 3.15.0 (2013-07-29)

*   New modes: [Jade](https://codemirror.net/mode/jade/index.html), [Nginx](https://codemirror.net/mode/nginx/index.html).
*   New addons: [Tern](https://codemirror.net/demo/tern.html), [matchtags](https://codemirror.net/doc/manual.html#addon_matchtags), and [foldgutter](https://codemirror.net/doc/manual.html#addon_foldgutter).
*   Introduced [_helper_](https://codemirror.net/doc/manual.html#getHelper) concept ([context](https://groups.google.com/forum/#!msg/codemirror/cOc0xvUUEUU/nLrX1-qnidgJ)).
*   New method: [`getModeAt`](https://codemirror.net/doc/manual.html#getModeAt).
*   New themes: base16 [dark](https://codemirror.net/demo/theme.html#base16-dark)/[light](https://codemirror.net/demo/theme.html#base16-light), 3024 [dark](https://codemirror.net/demo/theme.html#3024-night)/[light](https://codemirror.net/demo/theme.html#3024-day), [tomorrow-night](https://codemirror.net/demo/theme.html#tomorrow-night-eighties).
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/3.14.0...3.15.0).

## 3.14.0 (2013-06-20)

*   New addons: [trailing space highlight](https://codemirror.net/doc/manual.html#addon_trailingspace), [XML completion](https://codemirror.net/doc/manual.html#addon_xml-hint) (rewritten), and [diff merging](https://codemirror.net/doc/manual.html#addon_merge).
*   [`markText`](https://codemirror.net/doc/manual.html#markText) and [`addLineWidget`](https://codemirror.net/doc/manual.html#addLineWidget) now take a `handleMouseEvents` option.
*   New methods: [`lineAtHeight`](https://codemirror.net/doc/manual.html#lineAtHeight), [`getTokenTypeAt`](https://codemirror.net/doc/manual.html#getTokenTypeAt).
*   More precise cleanness-tracking using [`changeGeneration`](https://codemirror.net/doc/manual.html#changeGeneration) and [`isClean`](https://codemirror.net/doc/manual.html#isClean).
*   Many extensions to [Emacs](https://codemirror.net/demo/emacs.html) mode (prefixes, more navigation units, and more).
*   New events [`"keyHandled"`](https://codemirror.net/doc/manual.html#event_keyHandled) and [`"inputRead"`](https://codemirror.net/doc/manual.html#event_inputRead).
*   Various improvements to [Ruby](https://codemirror.net/mode/ruby/index.html), [Smarty](https://codemirror.net/mode/smarty/index.html), [SQL](https://codemirror.net/mode/sql/index.html), and [Vim](https://codemirror.net/demo/vim.html) modes.
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/3.13.0...3.14.0).

## 3.13.0 (2013-05-20)

*   New modes: [COBOL](https://codemirror.net/mode/cobol/index.html) and [HAML](https://codemirror.net/mode/haml/index.html).
*   New options: [`cursorScrollMargin`](https://codemirror.net/doc/manual.html#option_cursorScrollMargin) and [`coverGutterNextToScrollbar`](https://codemirror.net/doc/manual.html#option_coverGutterNextToScrollbar).
*   New addon: [commenting](https://codemirror.net/doc/manual.html#addon_comment).
*   More features added to the [Vim keymap](https://codemirror.net/demo/vim.html).
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/v3.12...3.13.0).

## 3.12.0 (2013-04-19)

*   New mode: [GNU assembler](https://codemirror.net/mode/gas/index.html).
*   New options: [`maxHighlightLength`](https://codemirror.net/doc/manual.html#option_maxHighlightLength) and [`historyEventDelay`](https://codemirror.net/doc/manual.html#option_historyEventDelay).
*   Added [`addToHistory`](https://codemirror.net/doc/manual.html#mark_addToHistory) option for `markText`.
*   Various fixes to JavaScript tokenization and indentation corner cases.
*   Further improvements to the vim mode.
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/v3.11...v3.12).

## 3.11.0 (2013-03-20)

*   **Removed code:** `collapserange`, `formatting`, and `simple-hint` addons. `plsql` and `mysql` modes (use [`sql`](https://codemirror.net/mode/sql/index.html) mode).
*   **Moved code:** the range-finding functions for folding now have [their own files](https://codemirror.net/addon/fold/).
*   **Changed interface:** the [`continuecomment`](https://codemirror.net/doc/manual.html#addon_continuecomment) addon now exposes an option, rather than a command.
*   New modes: [SCSS](https://codemirror.net/mode/css/scss.html), [Tcl](https://codemirror.net/mode/tcl/index.html), [LiveScript](https://codemirror.net/mode/livescript/index.html), and [mIRC](https://codemirror.net/mode/mirc/index.html).
*   New addons: [`placeholder`](https://codemirror.net/demo/placeholder.html), [HTML completion](https://codemirror.net/demo/html5complete.html).
*   New methods: [`hasFocus`](https://codemirror.net/doc/manual.html#hasFocus), [`defaultCharWidth`](https://codemirror.net/doc/manual.html#defaultCharWidth).
*   New events: [`beforeCursorEnter`](https://codemirror.net/doc/manual.html#event_beforeCursorEnter), [`renderLine`](https://codemirror.net/doc/manual.html#event_renderLine).
*   Many improvements to the [`show-hint`](https://codemirror.net/doc/manual.html#addon_show-hint) completion dialog addon.
*   Tweak behavior of by-word cursor motion.
*   Further improvements to the [vim mode](https://codemirror.net/demo/vim.html).
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/v3.1...v3.11).

## 3.02.0 (2013-01-25)

Single-bugfix release. Fixes a problem that prevents CodeMirror instances from being garbage-collected after they become unused.

## 3.01.0 (2013-01-21)

*   Move all add-ons into an organized directory structure under [`/addon`](https://codemirror.net/addon/). **You might have to adjust your paths.**
*   New modes: [D](https://codemirror.net/mode/d/index.html), [Sass](https://codemirror.net/mode/sass/index.html), [APL](https://codemirror.net/mode/apl/index.html), [SQL](https://codemirror.net/mode/sql/index.html) (configurable), and [Asterisk](https://codemirror.net/mode/asterisk/index.html).
*   Several bugfixes in right-to-left text support.
*   Add [`rtlMoveVisually`](https://codemirror.net/doc/manual.html#option_rtlMoveVisually) option.
*   Improvements to vim keymap.
*   Add built-in (lightweight) [overlay mode](https://codemirror.net/doc/manual.html#addOverlay) support.
*   Support `showIfHidden` option for [line widgets](https://codemirror.net/doc/manual.html#addLineWidget).
*   Add simple [Python hinter](https://codemirror.net/doc/manual.html#addon_python-hint).
*   Bring back the [`fixedGutter`](https://codemirror.net/doc/manual.html#option_fixedGutter) option.
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/v3.0...v3.01).

## 3.1.0 (2013-02-21)

*   **Incompatible:** key handlers may now _return_, rather than _throw_ `CodeMirror.Pass` to signal they didn't handle the key.
*   Make documents a [first-class construct](https://codemirror.net/doc/manual.html#api_doc), support split views and subviews.
*   Add a [new module](https://codemirror.net/doc/manual.html#addon_show-hint) for showing completion hints. Deprecate `simple-hint.js`.
*   Extend [htmlmixed mode](https://codemirror.net/mode/htmlmixed/index.html) to allow custom handling of script types.
*   Support an `insertLeft` option to [`setBookmark`](https://codemirror.net/doc/manual.html#setBookmark).
*   Add an [`eachLine`](https://codemirror.net/doc/manual.html#eachLine) method to iterate over a document.
*   New addon modules: [selection marking](https://codemirror.net/demo/markselection.html), [linting](https://codemirror.net/demo/lint.html), and [automatic bracket closing](https://codemirror.net/demo/closebrackets.html).
*   Add [`"beforeChange"`](https://codemirror.net/doc/manual.html#event_beforeChange) and [`"beforeSelectionChange"`](https://codemirror.net/doc/manual.html#event_beforeSelectionChange) events.
*   Add [`"hide"`](https://codemirror.net/doc/manual.html#event_hide) and [`"unhide"`](https://codemirror.net/doc/manual.html#event_unhide) events to marked ranges.
*   Fix [`coordsChar`](https://codemirror.net/doc/manual.html#coordsChar)'s interpretation of its argument to match the documentation.
*   New modes: [Turtle](https://codemirror.net/mode/turtle/index.html) and [Q](https://codemirror.net/mode/q/index.html).
*   Further improvements to the [vim mode](https://codemirror.net/demo/vim.html).
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/v3.01...v3.1).

## 3.0.0 (2012-12-10)

**New major version**. Only partially backwards-compatible. See the [upgrading guide](https://codemirror.net/doc/upgrade_v3.html) for more information. Changes since release candidate 2:

*   Rewritten VIM mode.
*   Fix a few minor scrolling and sizing issues.
*   Work around Safari segfault when dragging.
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/v3.0rc2...v3.0).

## 2.38.0 (2013-01-21)

Integrate some bugfixes, enhancements to the vim keymap, and new modes ([D](https://codemirror.net/mode/d/index.html), [Sass](https://codemirror.net/mode/sass/index.html), [APL](https://codemirror.net/mode/apl/index.html)) from the v3 branch.

## 2.37.0 (2012-12-20)

*   New mode: [SQL](https://codemirror.net/mode/sql/index.html) (will replace [plsql](https://codemirror.net/mode/plsql/index.html) and [mysql](https://codemirror.net/mode/mysql/index.html) modes).
*   Further work on the new VIM mode.
*   Fix Cmd/Ctrl keys on recent Operas on OS X.
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/v2.36...v2.37).

## 2.36.0 (2012-11-20)

*   New mode: [Z80 assembly](https://codemirror.net/mode/z80/index.html).
*   New theme: [Twilight](https://codemirror.net/demo/theme.html#twilight).
*   Add command-line compression helper.
*   Make [`scrollIntoView`](https://codemirror.net/doc/manual.html#scrollIntoView) public.
*   Add [`defaultTextHeight`](https://codemirror.net/doc/manual.html#defaultTextHeight) method.
*   Various extensions to the vim keymap.
*   Make [PHP mode](https://codemirror.net/mode/php/index.html) build on [mixed HTML mode](https://codemirror.net/mode/htmlmixed/index.html).
*   Add [comment-continuing](https://codemirror.net/doc/manual.html#addon_continuecomment) add-on.
*   Full [list of patches](https://codemirror.net/https://github.com/codemirror/CodeMirror/compare/v2.35...v2.36).

## 2.35.0 (2012-10-22)

*   New (sub) mode: [TypeScript](https://codemirror.net/mode/javascript/typescript.html).
*   Don't overwrite (insert key) when pasting.
*   Fix several bugs in [`markText`](https://codemirror.net/doc/manual.html#markText)/undo interaction.
*   Better indentation of JavaScript code without semicolons.
*   Add [`defineInitHook`](https://codemirror.net/doc/manual.html#defineInitHook) function.
*   Full [list of patches](https://github.com/codemirror/CodeMirror/compare/v2.34...v2.35).

## 2.34.0 (2012-09-19)

*   New mode: [Common Lisp](https://codemirror.net/mode/commonlisp/index.html).
*   Fix right-click select-all on most browsers.
*   Change the way highlighting happens:
      Saves memory and CPU cycles.
      `compareStates` is no longer needed.
      `onHighlightComplete` no longer works.
*   Integrate mode (Markdown, XQuery, CSS, sTex) tests in central testsuite.
*   Add a [`CodeMirror.version`](https://codemirror.net/doc/manual.html#version) property.
*   More robust handling of nested modes in [formatting](https://codemirror.net/demo/formatting.html) and [closetag](https://codemirror.net/demo/closetag.html) plug-ins.
*   Un/redo now preserves [marked text](https://codemirror.net/doc/manual.html#markText) and bookmarks.
*   [Full list](https://github.com/codemirror/CodeMirror/compare/v2.33...v2.34) of patches.

## 2.33.0 (2012-08-23)

*   New mode: [Sieve](https://codemirror.net/mode/sieve/index.html).
*   New [`getViewPort`](https://codemirror.net/doc/manual.html#getViewport) and [`onViewportChange`](https://codemirror.net/doc/manual.html#option_onViewportChange) API.
*   [Configurable](https://codemirror.net/doc/manual.html#option_cursorBlinkRate) cursor blink rate.
*   Make binding a key to `false` disabling handling (again).
*   Show non-printing characters as red dots.
*   More tweaks to the scrolling model.
*   Expanded testsuite. Basic linter added.
*   Remove most uses of `innerHTML`. Remove `CodeMirror.htmlEscape`.
*   [Full list](https://github.com/codemirror/CodeMirror/compare/v2.32...v2.33) of patches.

## 2.32.0 (2012-07-23)

Emergency fix for a bug where an editor with line wrapping on IE will break when there is _no_ scrollbar.

## 2.31.0 (2012-07-20)

*   New modes: [OCaml](https://codemirror.net/mode/ocaml/index.html), [Haxe](https://codemirror.net/mode/haxe/index.html), and [VB.NET](https://codemirror.net/mode/vb/index.html).
*   Several fixes to the new scrolling model.
*   Add a [`setSize`](https://codemirror.net/doc/manual.html#setSize) method for programmatic resizing.
*   Add [`getHistory`](https://codemirror.net/doc/manual.html#getHistory) and [`setHistory`](https://codemirror.net/doc/manual.html#setHistory) methods.
*   Allow custom line separator string in [`getValue`](https://codemirror.net/doc/manual.html#getValue) and [`getRange`](https://codemirror.net/doc/manual.html#getRange).
*   Support double- and triple-click drag, double-clicking whitespace.
*   And more... [(all patches)](https://github.com/codemirror/CodeMirror/compare/v2.3...v2.31)

## 2.30.0 (2012-06-22)

*   **New scrollbar implementation**. Should flicker less. Changes DOM structure of the editor.
*   New theme: [vibrant-ink](https://codemirror.net/demo/theme.html#vibrant-ink).
*   Many extensions to the VIM keymap (including text objects).
*   Add [mode-multiplexing](https://codemirror.net/demo/multiplex.html) utility script.
*   Fix bug where right-click paste works in read-only mode.
*   Add a [`getScrollInfo`](https://codemirror.net/doc/manual.html#getScrollInfo) method.
*   Lots of other [fixes](https://github.com/codemirror/CodeMirror/compare/v2.25...v2.3).

## 2.25.0 (2012-05-23)

*   New mode: [Erlang](https://codemirror.net/mode/erlang/index.html).
*   **Remove xmlpure mode** (use [xml.js](https://codemirror.net/mode/xml/index.html)).
*   Fix line-wrapping in Opera.
*   Fix X Windows middle-click paste in Chrome.
*   Fix bug that broke pasting of huge documents.
*   Fix backspace and tab key repeat in Opera.

## 2.24.0 (2012-04-23)

*   **Drop support for Internet Explorer 6**.
*   New modes: [Shell](https://codemirror.net/mode/shell/index.html), [Tiki wiki](https://codemirror.net/mode/tiki/index.html), [Pig Latin](https://codemirror.net/mode/pig/index.html).
*   New themes: [Ambiance](https://codemirror.net/demo/theme.html#ambiance), [Blackboard](https://codemirror.net/demo/theme.html#blackboard).
*   More control over drag/drop with [`dragDrop`](https://codemirror.net/doc/manual.html#option_dragDrop) and [`onDragEvent`](https://codemirror.net/doc/manual.html#option_onDragEvent) options.
*   Make HTML mode a bit less pedantic.
*   Add [`compoundChange`](https://codemirror.net/doc/manual.html#compoundChange) API method.
*   Several fixes in undo history and line hiding.
*   Remove (broken) support for `catchall` in key maps, add `nofallthrough` boolean field instead.

## 2.23.0 (2012-03-26)

*   Change **default binding for tab**. Starting in 2.23, these bindings are default:
    *   Tab: Insert tab character
    *   Shift-tab: Reset line indentation to default
    *   Ctrl/Cmd-[: Reduce line indentation (old tab behaviour)
    *   Ctrl/Cmd-]: Increase line indentation (old shift-tab behaviour)
*   New modes: [XQuery](https://codemirror.net/mode/xquery/index.html) and [VBScript](https://codemirror.net/mode/vbscript/index.html).
*   Two new themes: [lesser-dark](https://codemirror.net/mode/less/index.html) and [xq-dark](https://codemirror.net/mode/xquery/index.html).
*   Differentiate between background and text styles in [`setLineClass`](https://codemirror.net/doc/manual.html#setLineClass).
*   Fix drag-and-drop in IE9+.
*   Extend [`charCoords`](https://codemirror.net/doc/manual.html#charCoords) and [`cursorCoords`](https://codemirror.net/doc/manual.html#cursorCoords) with a `mode` argument.
*   Add [`autofocus`](https://codemirror.net/doc/manual.html#option_autofocus) option.
*   Add [`findMarksAt`](https://codemirror.net/doc/manual.html#findMarksAt) method.

## 2.22.0 (2012-02-27)

*   Allow [key handlers](https://codemirror.net/doc/manual.html#keymaps) to pass up events, allow binding characters.
*   Add [`autoClearEmptyLines`](https://codemirror.net/doc/manual.html#option_autoClearEmptyLines) option.
*   Properly use tab stops when rendering tabs.
*   Make PHP mode more robust.
*   Support indentation blocks in [code folder](https://codemirror.net/doc/manual.html#addon_foldcode).
*   Add a script for [highlighting instances of the selection](https://codemirror.net/doc/manual.html#addon_match-highlighter).
*   New [.properties](https://codemirror.net/mode/properties/index.html) mode.
*   Fix many bugs.

## 2.21.0 (2012-01-27)

*   Added [LESS](https://codemirror.net/mode/less/index.html), [MySQL](https://codemirror.net/mode/mysql/index.html), [Go](https://codemirror.net/mode/go/index.html), and [Verilog](https://codemirror.net/mode/verilog/index.html) modes.
*   Add [`smartIndent`](https://codemirror.net/doc/manual.html#option_smartIndent) option.
*   Support a cursor in [`readOnly`](https://codemirror.net/doc/manual.html#option_readOnly)-mode.
*   Support assigning multiple styles to a token.
*   Use a new approach to drawing the selection.
*   Add [`scrollTo`](https://codemirror.net/doc/manual.html#scrollTo) method.
*   Allow undo/redo events to span non-adjacent lines.
*   Lots and lots of bugfixes.

## 2.20.0 (2011-12-20)

*   Slightly incompatible API changes. Read [this](https://codemirror.net/doc/upgrade_v2.2.html).
*   New approach to [binding](https://codemirror.net/doc/manual.html#option_extraKeys) keys, support for [custom bindings](https://codemirror.net/doc/manual.html#option_keyMap).
*   Support for overwrite (insert).
*   [Custom-width](https://codemirror.net/doc/manual.html#option_tabSize) and [styleable](https://codemirror.net/demo/visibletabs.html) tabs.
*   Moved more code into [add-on scripts](https://codemirror.net/doc/manual.html#addons).
*   Support for sane vertical cursor movement in wrapped lines.
*   More reliable handling of editing [marked text](https://codemirror.net/doc/manual.html#markText).
*   Add minimal [emacs](https://codemirror.net/demo/emacs.html) and [vim](https://codemirror.net/demo/vim.html) bindings.
*   Rename `coordsFromIndex` to [`posFromIndex`](https://codemirror.net/doc/manual.html#posFromIndex), add [`indexFromPos`](https://codemirror.net/doc/manual.html#indexFromPos) method.

## 2.18.0 (2011-11-21)

Fixes `TextMarker.clear`, which is broken in 2.17.

## 2.17.0 (2011-11-21)

*   Add support for [line wrapping](https://codemirror.net/doc/manual.html#option_lineWrapping) and [code folding](https://codemirror.net/doc/manual.html#hideLine).
*   Add [GitHub-style Markdown](https://codemirror.net/mode/gfm/index.html) mode.
*   Add [Monokai](https://codemirror.net/theme/monokai.css) and [Rubyblue](https://codemirror.net/theme/rubyblue.css) themes.
*   Add [`setBookmark`](https://codemirror.net/doc/manual.html#setBookmark) method.
*   Move some of the demo code into reusable components under [`lib/util`](https://codemirror.net/addon/).
*   Make screen-coord-finding code faster and more reliable.
*   Fix drag-and-drop in Firefox.
*   Improve support for IME.
*   Speed up content rendering.
*   Fix browser's built-in search in Webkit.
*   Make double- and triple-click work in IE.
*   Various fixes to modes.

## 2.16.0 (2011-10-27)

*   Add [Perl](https://codemirror.net/mode/perl/index.html), [Rust](https://codemirror.net/mode/rust/index.html), [TiddlyWiki](https://codemirror.net/mode/tiddlywiki/index.html), and [Groovy](https://codemirror.net/mode/groovy/index.html) modes.
*   Dragging text inside the editor now moves, rather than copies.
*   Add a [`coordsFromIndex`](https://codemirror.net/doc/manual.html#coordsFromIndex) method.
*   **API change**: `setValue` now no longer clears history. Use [`clearHistory`](https://codemirror.net/doc/manual.html#clearHistory) for that.
*   **API change**: [`markText`](https://codemirror.net/doc/manual.html#markText) now returns an object with `clear` and `find` methods. Marked text is now more robust when edited.
*   Fix editing code with tabs in Internet Explorer.

## 2.15.0 (2011-09-26)

Fix bug that snuck into 2.14: Clicking the character that currently has the cursor didn't re-focus the editor.

## 2.14.0 (2011-09-26)

*   Add [Clojure](https://codemirror.net/mode/clojure/index.html), [Pascal](https://codemirror.net/mode/pascal/index.html), [NTriples](https://codemirror.net/mode/ntriples/index.html), [Jinja2](https://codemirror.net/mode/jinja2/index.html), and [Markdown](https://codemirror.net/mode/markdown/index.html) modes.
*   Add [Cobalt](https://codemirror.net/theme/cobalt.css) and [Eclipse](https://codemirror.net/theme/eclipse.css) themes.
*   Add a [`fixedGutter`](https://codemirror.net/doc/manual.html#option_fixedGutter) option.
*   Fix bug with `setValue` breaking cursor movement.
*   Make gutter updates much more efficient.
*   Allow dragging of text out of the editor (on modern browsers).

## 2.13.0 (2011-08-23)

*   Add [Ruby](https://codemirror.net/mode/ruby/index.html), [R](https://codemirror.net/mode/r/index.html), [CoffeeScript](https://codemirror.net/mode/coffeescript/index.html), and [Velocity](https://codemirror.net/mode/velocity/index.html) modes.
*   Add [`getGutterElement`](https://codemirror.net/doc/manual.html#getGutterElement) to API.
*   Several fixes to scrolling and positioning.
*   Add [`smartHome`](https://codemirror.net/doc/manual.html#option_smartHome) option.
*   Add an experimental [pure XML](https://codemirror.net/mode/xmlpure/index.html) mode.

## 2.12.0 (2011-07-25)

*   Add a [SPARQL](https://codemirror.net/mode/sparql/index.html) mode.
*   Fix bug with cursor jumping around in an unfocused editor in IE.
*   Allow key and mouse events to bubble out of the editor. Ignore widget clicks.
*   Solve cursor flakiness after undo/redo.
*   Fix block-reindent ignoring the last few lines.
*   Fix parsing of multi-line attrs in XML mode.
*   Use `innerHTML` for HTML-escaping.
*   Some fixes to indentation in C-like mode.
*   Shrink horiz scrollbars when long lines removed.
*   Fix width feedback loop bug that caused the width of an inner DIV to shrink.

## 2.11.0 (2011-07-04)

*   Add a [Scheme mode](https://codemirror.net/mode/scheme/index.html).
*   Add a `replace` method to search cursors, for cursor-preserving replacements.
*   Make the [C-like mode](https://codemirror.net/mode/clike/index.html) mode more customizable.
*   Update XML mode to spot mismatched tags.
*   Add `getStateAfter` API and `compareState` mode API methods for finer-grained mode magic.
*   Add a `getScrollerElement` API method to manipulate the scrolling DIV.
*   Fix drag-and-drop for Firefox.
*   Add a C# configuration for the [C-like mode](https://codemirror.net/mode/clike/index.html).
*   Add [full-screen editing](https://codemirror.net/demo/fullscreen.html) and [mode-changing](https://codemirror.net/demo/changemode.html) demos.

## 2.10.0 (2011-06-07)

Add a [theme](https://codemirror.net/doc/manual.html#option_theme) system ([demo](https://codemirror.net/demo/theme.html)). Note that this is not backwards-compatible—you'll have to update your styles and modes!

## 2.2.0 (2011-06-07)

*   Add a [Lua mode](https://codemirror.net/mode/lua/index.html).
*   Fix reverse-searching for a regexp.
*   Empty lines can no longer break highlighting.
*   Rework scrolling model (the outer wrapper no longer does the scrolling).
*   Solve horizontal jittering on long lines.
*   Add [runmode.js](https://codemirror.net/demo/runmode.html).
*   Immediately re-highlight text when typing.
*   Fix problem with 'sticking' horizontal scrollbar.

## 2.1.0 (2011-05-26)

*   Add a [Smalltalk mode](https://codemirror.net/mode/smalltalk/index.html).
*   Add a [reStructuredText mode](https://codemirror.net/mode/rst/index.html).
*   Add a [Python mode](https://codemirror.net/mode/python/index.html).
*   Add a [PL/SQL mode](https://codemirror.net/mode/plsql/index.html).
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

## 2.0.0 (2011-03-28)

CodeMirror 2 is a complete rewrite that's faster, smaller, simpler to use, and less dependent on browser quirks. See [this](https://codemirror.net/doc/internals.html) and [this](http://groups.google.com/group/codemirror/browse_thread/thread/5a8e894024a9f580) for more information.
