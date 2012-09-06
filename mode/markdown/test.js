// Initiate ModeTest and set defaults
var MT = ModeTest;
MT.modeName = 'markdown';
MT.modeOptions = {};

MT.testMode(
  'plainText',
  'foo',
  [
    null, 'foo'
  ]
);

// Code blocks using 4 spaces (regardless of CodeMirror.tabSize value)
MT.testMode(
  'codeBlocksUsing4Spaces',
  '    foo',
  [
    null, '    ',
    'comment', 'foo'
  ]
);

// Code blocks using 1 tab (regardless of CodeMirror.indentWithTabs value)
MT.testMode(
  'codeBlocksUsing1Tab',
  '\tfoo',
  [
    null, '\t',
    'comment', 'foo'
  ]
);

// Inline code using backticks
MT.testMode(
  'inlineCodeUsingBackticks',
  'foo `bar`',
  [
    null, 'foo ',
    'comment', '`bar`'
  ]
);

// Unclosed backticks
// Instead of simply marking as CODE, it would be nice to have an 
// incomplete flag for CODE, that is styled slightly different.
MT.testMode(
  'unclosedBackticks',
  'foo `bar',
  [
    null, 'foo ',
    'comment', '`bar'
  ]
);

// Per documentation: "To include a literal backtick character within a 
// code span, you can use multiple backticks as the opening and closing 
// delimiters"
MT.testMode(
  'doubleBackticks',
  '``foo ` bar``',
  [
    'comment', '``foo ` bar``'
  ]
);

// Tests based on Dingus
// http://daringfireball.net/projects/markdown/dingus
// 
// Multiple backticks within an inline code block
MT.testMode(
  'consecutiveBackticks',
  '`foo```bar`',
  [
    'comment', '`foo```bar`'
  ]
);
// Multiple backticks within an inline code block with a second code block
MT.testMode(
  'consecutiveBackticks',
  '`foo```bar` hello `world`',
  [
    'comment', '`foo```bar`',
    null, ' hello ',
    'comment', '`world`'
  ]
);
// Unclosed with several different groups of backticks
MT.testMode(
  'unclosedBackticks',
  '``foo ``` bar` hello',
  [
    'comment', '``foo ``` bar` hello'
  ]
);
// Closed with several different groups of backticks
MT.testMode(
  'closedBackticks',
  '``foo ``` bar` hello`` world',
  [
    'comment', '``foo ``` bar` hello``',
    null, ' world'
  ]
);

// atx headers
// http://daringfireball.net/projects/markdown/syntax#header
// 
// H1
MT.testMode(
  'atxH1',
  '# foo',
  [
    'header', '# foo'
  ]
);
// H2
MT.testMode(
  'atxH2',
  '## foo',
  [
    'header', '## foo'
  ]
);
// H3
MT.testMode(
  'atxH3',
  '### foo',
  [
    'header', '### foo'
  ]
);
// H4
MT.testMode(
  'atxH4',
  '#### foo',
  [
    'header', '#### foo'
  ]
);
// H5
MT.testMode(
  'atxH5',
  '##### foo',
  [
    'header', '##### foo'
  ]
);
// H6
MT.testMode(
  'atxH6',
  '###### foo',
  [
    'header', '###### foo'
  ]
);
// H6 - 7x '#' should still be H6, per Dingus
// http://daringfireball.net/projects/markdown/dingus
MT.testMode(
  'atxH6NotH7',
  '####### foo',
  [
    'header', '####### foo'
  ]
);

// Setext headers - H1, H2
// Per documentation, "Any number of underlining =’s or -’s will work."
// http://daringfireball.net/projects/markdown/syntax#header
// Ideally, the text would be marked as `header` as well, but this is 
// not really feasible at the moment. So, instead, we're testing against 
// what works today, to avoid any regressions.
// 
// Check if single underlining = works
MT.testMode(
  'setextH1',
  'foo\n=',
  [
    null, 'foo',
    'header', '='
  ]
);
// Check if 3+ ='s work
MT.testMode(
  'setextH1',
  'foo\n===',
  [
    null, 'foo',
    'header', '==='
  ]
);
// Check if single underlining - works
MT.testMode(
  'setextH2',
  'foo\n-',
  [
    null, 'foo',
    'header', '-'
  ]
);
// Check if 3+ -'s work
MT.testMode(
  'setextH2',
  'foo\n---',
  [
    null, 'foo',
    'header', '---'
  ]
);

// Single-line blockquote with trailing space
MT.testMode(
  'blockquoteSpace',
  '> foo',
  [
    'quote', '> foo'
  ]
);

// Single-line blockquote
MT.testMode(
  'blockquoteNoSpace',
  '>foo',
  [
    'quote', '>foo'
  ]
);

// Single-line blockquote followed by normal paragraph
MT.testMode(
  'blockquoteThenParagraph',
  '>foo\n\nbar',
  [
    'quote', '>foo',
    null, 'bar'
  ]
);

// Multi-line blockquote (lazy mode)
MT.testMode(
  'multiBlockquoteLazy',
  '>foo\nbar',
  [
    'quote', '>foo',
    'quote', 'bar'
  ]
);

// Multi-line blockquote followed by normal paragraph (lazy mode)
MT.testMode(
  'multiBlockquoteLazyThenParagraph',
  '>foo\nbar\n\nhello',
  [
    'quote', '>foo',
    'quote', 'bar',
    null, 'hello'
  ]
);

// Multi-line blockquote (non-lazy mode)
MT.testMode(
  'multiBlockquote',
  '>foo\n>bar',
  [
    'quote', '>foo',
    'quote', '>bar'
  ]
);

// Multi-line blockquote followed by normal paragraph (non-lazy mode)
MT.testMode(
  'multiBlockquoteThenParagraph',
  '>foo\n>bar\n\nhello',
  [
    'quote', '>foo',
    'quote', '>bar',
    null, 'hello'
  ]
);

// Check list types
MT.testMode(
  'listAsterisk',
  '* foo\n* bar',
  [
    'string', '* foo',
    'string', '* bar'
  ]
);
MT.testMode(
  'listPlus',
  '+ foo\n+ bar',
  [
    'string', '+ foo',
    'string', '+ bar'
  ]
);
MT.testMode(
  'listDash',
  '- foo\n- bar',
  [
    'string', '- foo',
    'string', '- bar'
  ]
);
MT.testMode(
  'listNumber',
  '1. foo\n2. bar',
  [
    'string', '1. foo',
    'string', '2. bar'
  ]
);

// Formatting in lists (*)
MT.testMode(
  'listAsteriskFormatting',
  '* *foo* bar\n\n* **foo** bar\n\n* ***foo*** bar\n\n* `foo` bar',
  [
    'string', '* ',
    'string em', '*foo*',
    'string', ' bar',
    'string', '* ',
    'string strong', '**foo**',
    'string', ' bar',
    'string', '* ',
    'string strong', '**',
    'string emstrong', '*foo**',
    'string em', '*',
    'string', ' bar',
    'string', '* ',
    'string comment', '`foo`',
    'string', ' bar'
  ]
);
// Formatting in lists (+)
MT.testMode(
  'listPlusFormatting',
  '+ *foo* bar\n\n+ **foo** bar\n\n+ ***foo*** bar\n\n+ `foo` bar',
  [
    'string', '+ ',
    'string em', '*foo*',
    'string', ' bar',
    'string', '+ ',
    'string strong', '**foo**',
    'string', ' bar',
    'string', '+ ',
    'string strong', '**',
    'string emstrong', '*foo**',
    'string em', '*',
    'string', ' bar',
    'string', '+ ',
    'string comment', '`foo`',
    'string', ' bar'
  ]
);
// Formatting in lists (-)
MT.testMode(
  'listDashFormatting',
  '- *foo* bar\n\n- **foo** bar\n\n- ***foo*** bar\n\n- `foo` bar',
  [
    'string', '- ',
    'string em', '*foo*',
    'string', ' bar',
    'string', '- ',
    'string strong', '**foo**',
    'string', ' bar',
    'string', '- ',
    'string strong', '**',
    'string emstrong', '*foo**',
    'string em', '*',
    'string', ' bar',
    'string', '- ',
    'string comment', '`foo`',
    'string', ' bar'
  ]
);
// Formatting in lists (1.)
MT.testMode(
  'listNumberFormatting',
  '1. *foo* bar\n\n2. **foo** bar\n\n3. ***foo*** bar\n\n4. `foo` bar',
  [
    'string', '1. ',
    'string em', '*foo*',
    'string', ' bar',
    'string', '2. ',
    'string strong', '**foo**',
    'string', ' bar',
    'string', '3. ',
    'string strong', '**',
    'string emstrong', '*foo**',
    'string em', '*',
    'string', ' bar',
    'string', '4. ',
    'string comment', '`foo`',
    'string', ' bar'
  ]
);

// Paragraph lists
MT.testMode(
  'listParagraph',
  '* foo\n\n* bar',
  [
    'string', '* foo',
    'string', '* bar'
  ]
);

// Multi-paragraph lists
//
// 4 spaces
MT.testMode(
  'listMultiParagraph',
  '* foo\n\n* bar\n\n    hello',
  [
    'string', '* foo',
    'string', '* bar',
    null, '    ',
    'string', 'hello'
  ]
);
// 4 spaces, extra blank lines (should still be list, per Dingus)
MT.testMode(
  'listMultiParagraphExtra',
  '* foo\n\n* bar\n\n\n    hello',
  [
    'string', '* foo',
    'string', '* bar',
    null, '    ',
    'string', 'hello'
  ]
);
// 4 spaces, plus 1 space (should still be list, per Dingus)
MT.testMode(
  'listMultiParagraphExtraSpace',
  '* foo\n\n* bar\n\n     hello\n\n    world',
  [
    'string', '* foo',
    'string', '* bar',
    null, '     ',
    'string', 'hello',
    null, '    ',
    'string', 'world'
  ]
);
// 1 tab
MT.testMode(
  'listTab',
  '* foo\n\n* bar\n\n\thello',
  [
    'string', '* foo',
    'string', '* bar',
    null, '\t',
    'string', 'hello'
  ]
);
// No indent
MT.testMode(
  'listNoIndent',
  '* foo\n\n* bar\n\nhello',
  [
    'string', '* foo',
    'string', '* bar',
    null, 'hello'
  ]
);
// Blockquote
MT.testMode(
  'blockquote',
  '* foo\n\n* bar\n\n    > hello',
  [
    'string', '* foo',
    'string', '* bar',
    null, '    ',
    'string quote', '> hello'
  ]
);
// Code block
MT.testMode(
  'blockquoteCode',
  '* foo\n\n* bar\n\n        > hello\n\n    world',
  [
    'string', '* foo',
    'string', '* bar',
    null, '        ',
    'comment', '> hello',
    null, '    ',
    'string', 'world'
  ]
);
// Code block followed by text
MT.testMode(
  'blockquoteCodeText',
  '* foo\n\n    bar\n\n        hello\n\n    world',
  [
    'string', '* foo',
    null, '    ',
    'string', 'bar',
    null, '        ',
    'comment', 'hello',
    null, '    ',
    'string', 'world'
  ]
);

// Nested list
// 
// *
MT.testMode(
  'listAsteriskNested',
  '* foo\n\n    * bar',
  [
    'string', '* foo',
    null, '    ',
    'string', '* bar'
  ]
);
// +
MT.testMode(
  'listPlusNested',
  '+ foo\n\n    + bar',
  [
    'string', '+ foo',
    null, '    ',
    'string', '+ bar'
  ]
);
// -
MT.testMode(
  'listDashNested',
  '- foo\n\n    - bar',
  [
    'string', '- foo',
    null, '    ',
    'string', '- bar'
  ]
);
// 1.
MT.testMode(
  'listNumberNested',
  '1. foo\n\n    2. bar',
  [
    'string', '1. foo',
    null, '    ',
    'string', '2. bar'
  ]
);
// Mixed
MT.testMode(
  'listMixed',
  '* foo\n\n    + bar\n\n        - hello\n\n            1. world',
  [
    'string', '* foo',
    null, '    ',
    'string', '+ bar',
    null, '        ',
    'string', '- hello',
    null, '            ',
    'string', '1. world'
  ]
);
// Blockquote
MT.testMode(
  'listBlockquote',
  '* foo\n\n    + bar\n\n        > hello',
  [
    'string', '* foo',
    null, '    ',
    'string', '+ bar',
    null, '        ',
    'quote string', '> hello'
  ]
);
// Code
MT.testMode(
  'listCode',
  '* foo\n\n    + bar\n\n            hello',
  [
    'string', '* foo',
    null, '    ',
    'string', '+ bar',
    null, '            ',
    'comment', 'hello'
  ]
);
// Code followed by text
MT.testMode(
  'listCodeText',
  '* foo\n\n        bar\n\nhello',
  [
    'string', '* foo',
    null, '        ',
    'comment', 'bar',
    null, 'hello'
  ]
);

// Following tests directly from official Markdown documentation
// http://daringfireball.net/projects/markdown/syntax#hr
MT.testMode(
  'hrSpace',
  '* * *',
  [
    'hr', '* * *'
  ]
);

MT.testMode(
  'hr',
  '***',
  [
    'hr', '***'
  ]
);

MT.testMode(
  'hrLong',
  '*****',
  [
    'hr', '*****'
  ]
);

MT.testMode(
  'hrSpaceDash',
  '- - -',
  [
    'hr', '- - -'
  ]
);

MT.testMode(
  'hrDashLong',
  '---------------------------------------',
  [
    'hr', '---------------------------------------'
  ]
);

// Inline link with title
MT.testMode(
  'linkTitle',
  '[foo](http://example.com/ "bar") hello',
  [
    'link', '[foo]',
    'string', '(http://example.com/ "bar")',
    null, ' hello'
  ]
);

// Inline link without title
MT.testMode(
  'linkNoTitle',
  '[foo](http://example.com/) bar',
  [
    'link', '[foo]',
    'string', '(http://example.com/)',
    null, ' bar'
  ]
);

// Reference-style links
MT.testMode(
  'linkReference',
  '[foo][bar] hello',
  [
    'link', '[foo]',
    'string', '[bar]',
    null, ' hello'
  ]
);

// Reference-style links with optional space separator (per docuentation)
// "You can optionally use a space to separate the sets of brackets"
MT.testMode(
  'linkReferenceSpace',
  '[foo] [bar] hello',
  [
    'link', '[foo]',
    null, ' ',
    'string', '[bar]',
    null, ' hello'
  ]
);
// Should only allow a single space ("...use *a* space...")
MT.testMode(
  'linkReferenceDoubleSpace',
  '[foo]  [bar] hello',
  [
    null, '[foo]  [bar] hello'
  ]
);

// Reference-style links with implicit link name
MT.testMode(
  'linkImplicit',
  '[foo][] hello',
  [
    'link', '[foo]',
    'string', '[]',
    null, ' hello'
  ]
);

// @todo It would be nice if, at some point, the document was actually
// checked to see if the referenced link exists

// Link label, for reference-style links (taken from documentation)
//
// No title
MT.testMode(
  'labelNoTitle',
  '[foo]: http://example.com/',
  [
    'link', '[foo]:',
    null, ' ',
    'string', 'http://example.com/'
  ]
);
// Space in ID and title
MT.testMode(
  'labelSpaceTitle',
  '[foo bar]: http://example.com/ "hello"',
  [
    'link', '[foo bar]:',
    null, ' ',
    'string', 'http://example.com/ "hello"'
  ]
);
// Double title
MT.testMode(
  'labelDoubleTitle',
  '[foo bar]: http://example.com/ "hello" "world"',
  [
    'link', '[foo bar]:',
    null, ' ',
    'string', 'http://example.com/ "hello"',
    null, ' "world"'
  ]
);
// Double quotes around title
MT.testMode(
  'labelTitleDoubleQuotes',
  '[foo]: http://example.com/  "bar"',
  [
    'link', '[foo]:',
    null, ' ',
    'string', 'http://example.com/  "bar"'
  ]
);
// Single quotes around title
MT.testMode(
  'labelTitleSingleQuotes',
  '[foo]: http://example.com/  \'bar\'',
  [
    'link', '[foo]:',
    null, ' ',
  'string', 'http://example.com/  \'bar\''
  ]
);
// Parentheses around title
MT.testMode(
  'labelTitleParenthese',
  '[foo]: http://example.com/  (bar)',
  [
    'link', '[foo]:',
    null, ' ',
    'string', 'http://example.com/  (bar)'
  ]
);
// Invalid title
MT.testMode(
  'labelTitleInvalid',
  '[foo]: http://example.com/ bar',
  [
    'link', '[foo]:',
    null, ' ',
    'string', 'http://example.com/',
    null, ' bar'
  ]
);
// Angle brackets around URL
MT.testMode(
  'labelLinkAngleBrackets',
  '[foo]: <http://example.com/>  "bar"',
  [
    'link', '[foo]:',
    null, ' ',
    'string', '<http://example.com/>  "bar"'
  ]
);
// Title on next line per documentation (double quotes)
MT.testMode(
  'labelTitleNextDoubleQuotes',
  '[foo]: http://example.com/\n"bar" hello',
  [
    'link', '[foo]:',
    null, ' ',
    'string', 'http://example.com/',
    'string', '"bar"',
    null, ' hello'
  ]
);
// Title on next line per documentation (single quotes)
MT.testMode(
  'labelTitleNextSingleQuotes',
  '[foo]: http://example.com/\n\'bar\' hello',
  [
    'link', '[foo]:',
    null, ' ',
    'string', 'http://example.com/',
  'string', '\'bar\'',
  null, ' hello'
  ]
);
// Title on next line per documentation (parentheses)
MT.testMode(
  'labelTitleNextParenthese',
  '[foo]: http://example.com/\n(bar) hello',
  [
    'link', '[foo]:',
    null, ' ',
    'string', 'http://example.com/',
    'string', '(bar)',
    null, ' hello'
  ]
);
// Title on next line per documentation (mixed)
MT.testMode(
  'labelTitleNextMixed',
  '[foo]: http://example.com/\n(bar" hello',
  [
    'link', '[foo]:',
    null, ' ',
    'string', 'http://example.com/',
    null, '(bar" hello'
  ]
);

// Automatic links
MT.testMode(
  'linkWeb',
  '<http://example.com/> foo',
  [
    'link', '<http://example.com/>',
    null, ' foo'
  ]
);

// Automatic email links
MT.testMode(
  'linkEmail',
  '<user@example.com> foo',
  [
    'link', '<user@example.com>',
    null, ' foo'
  ]
);

// Single asterisk
MT.testMode(
  'emAsterisk',
  '*foo* bar',
  [
    'em', '*foo*',
    null, ' bar'
  ]
);

// Single underscore
MT.testMode(
  'emUnderscore',
  '_foo_ bar',
  [
    'em', '_foo_',
    null, ' bar'
  ]
);

// Emphasis characters within a word
MT.testMode(
  'emInWordAsterisk',
  'foo*bar*hello',
  [
    null, 'foo',
    'em', '*bar*',
    null, 'hello'
  ]
);
MT.testMode(
  'emInWordUnderscore',
  'foo_bar_hello',
  [
    null, 'foo',
    'em', '_bar_',
    null, 'hello'
  ]
);
// Per documentation: "...surround an * or _ with spaces, it’ll be 
// treated as a literal asterisk or underscore."
// 
// Inside EM
MT.testMode(
  'emEscapedBySpaceIn',
  'foo _bar _ hello_ world',
  [
    null, 'foo ',
    'em', '_bar _ hello_',
    null, ' world'
  ]
);
// Outside EM
MT.testMode(
  'emEscapedBySpaceOut',
  'foo _ bar_hello_world',
  [
    null, 'foo _ bar',
    'em', '_hello_',
    null, 'world'
  ]
);

// Unclosed emphasis characters
// Instead of simply marking as EM / STRONG, it would be nice to have an 
// incomplete flag for EM and STRONG, that is styled slightly different.
MT.testMode(
  'emIncompleteAsterisk',
  'foo *bar',
  [
    null, 'foo ',
    'em', '*bar'
  ]
);
MT.testMode(
  'emIncompleteUnderscore',
  'foo _bar',
  [
    null, 'foo ',
    'em', '_bar'
  ]
);

// Double asterisk
MT.testMode(
  'strongAsterisk',
  '**foo** bar',
  [
    'strong', '**foo**',
    null, ' bar'
  ]
);

// Double underscore
MT.testMode(
  'strongUnderscore',
  '__foo__ bar',
  [
    'strong', '__foo__',
    null, ' bar'
  ]
);

// Triple asterisk
MT.testMode(
  'emStrongAsterisk',
  '*foo**bar*hello** world',
  [
    'em', '*foo',
    'emstrong', '**bar*',
    'strong', 'hello**',
    null, ' world'
  ]
);

// Triple underscore
MT.testMode(
  'emStrongUnderscore',
  '_foo__bar_hello__ world',
  [
    'em', '_foo',
    'emstrong', '__bar_',
    'strong', 'hello__',
    null, ' world'
  ]
);

// Triple mixed
// "...same character must be used to open and close an emphasis span.""
MT.testMode(
  'emStrongMixed',
  '_foo**bar*hello__ world',
  [
    'em', '_foo',
    'emstrong', '**bar*hello__ world'
  ]
);

MT.testMode(
  'emStrongMixed',
  '*foo__bar_hello** world',
  [
    'em', '*foo',
    'emstrong', '__bar_hello** world'
  ]
);

// These characters should be escaped:
// \   backslash
// `   backtick
// *   asterisk
// _   underscore
// {}  curly braces
// []  square brackets
// ()  parentheses
// #   hash mark
// +   plus sign
// -   minus sign (hyphen)
// .   dot
// !   exclamation mark
// 
// Backtick (code)
MT.testMode(
  'escapeBacktick',
  'foo \\`bar\\`',
  [
    null, 'foo \\`bar\\`'
  ]
);
MT.testMode(
  'doubleEscapeBacktick',
  'foo \\\\`bar\\\\`',
  [
    null, 'foo \\\\',
    'comment', '`bar\\\\`'
  ]
);
// Asterisk (em)
MT.testMode(
  'escapeAsterisk',
  'foo \\*bar\\*',
  [
    null, 'foo \\*bar\\*'
  ]
);
MT.testMode(
  'doubleEscapeAsterisk',
  'foo \\\\*bar\\\\*',
  [
    null, 'foo \\\\',
    'em', '*bar\\\\*'
  ]
);
// Underscore (em)
MT.testMode(
  'escapeUnderscore',
  'foo \\_bar\\_',
  [
    null, 'foo \\_bar\\_'
  ]
);
MT.testMode(
  'doubleEscapeUnderscore',
  'foo \\\\_bar\\\\_',
  [
    null, 'foo \\\\',
    'em', '_bar\\\\_'
  ]
);
// Hash mark (headers)
MT.testMode(
  'escapeHash',
  '\\# foo',
  [
    null, '\\# foo'
  ]
);
MT.testMode(
  'doubleEscapeHash',
  '\\\\# foo',
  [
    null, '\\\\# foo'
  ]
);