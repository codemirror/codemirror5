// Initiate ModeTest and set defaults
var MT = ModeTest;
MT.modeName = 'css';
MT.modeOptions = {};

// Requires at least one media query
MT.testMode(
  'atMediaEmpty',
  '@media { }',
  [
    'def', '@media',
    null, ' ',
    'error', '{',
    null, ' }'
  ]
);

MT.testMode(
  'atMediaMultiple',
  '@media not screen and (color), not print and (color) { }',
  [
    'def', '@media',
    null, ' ',
    'keyword', 'not',
    null, ' ',
    'attribute', 'screen',
    null, ' ',
    'operator', 'and',
    null, ' (',
    'property', 'color',
    null, '), ',
    'keyword', 'not',
    null, ' ',
    'attribute', 'print',
    null, ' ',
    'operator', 'and',
    null, ' (',
    'property', 'color',
    null, ') { }'
  ]
);

MT.testMode(
  'atMediaCheckStack',
  '@media screen { } foo { }',
  [
    'def', '@media',
    null, ' ',
    'attribute', 'screen',
    null, ' { } ',
    'tag', 'foo',
    null, ' { }'
  ]
);

MT.testMode(
  'atMediaCheckStack',
  '@media screen (color) { } foo { }',
  [
    'def', '@media',
    null, ' ',
    'attribute', 'screen',
    null, ' (',
    'property', 'color',
    null, ') { } ',
    'tag', 'foo',
    null, ' { }'
  ]
);

MT.testMode(
  'atMediaCheckStackInvalidAttribute',
  '@media foobarhello { } foo { }',
  [
    'def', '@media',
    null, ' ',
    'attribute error', 'foobarhello',
    null, ' { } ',
    'tag', 'foo',
    null, ' { }'
  ]
);

// Error, because "and" is only allowed immediately preceding a media expression
MT.testMode(
  'atMediaInvalidAttribute',
  '@media foobarhello { }',
  [
    'def', '@media',
    null, ' ',
    'attribute error', 'foobarhello',
    null, ' { }'
  ]
);

// Error, because "and" is only allowed immediately preceding a media expression
MT.testMode(
  'atMediaInvalidAnd',
  '@media and screen { }',
  [
    'def', '@media',
    null, ' ',
    'error', 'and',
    null, ' ',
    'attribute', 'screen',
    null, ' { }'
  ]
);

// Error, because "not" is only allowed as the first item in each media query
MT.testMode(
  'atMediaInvalidNot',
  '@media screen not (not) { }',
  [
    'def', '@media',
    null, ' ',
    'attribute', 'screen',
    null, ' ',
    'error', 'not',
    null, ' (',
    'error', 'not',
    null, ') { }'
  ]
);

// Error, because "only" is only allowed as the first item in each media query
MT.testMode(
  'atMediaInvalidOnly',
  '@media screen only (only) { }',
  [
    'def', '@media',
    null, ' ',
    'attribute', 'screen',
    null, ' ',
    'error', 'only',
    null, ' (',
    'error', 'only',
    null, ') { }'
  ]
);

// Error, because "foobarhello" is neither a known type or property, but
// property was expected (after "and"), and it should be in parenthese.
MT.testMode(
  'atMediaUnknownType',
  '@media screen and foobarhello { }',
  [
    'def', '@media',
    null, ' ',
    'attribute', 'screen',
    null, ' ',
    'operator', 'and',
    null, ' ',
    'error', 'foobarhello',
    null, ' { }'
  ]
);

// Error, because "color" is not a known type, but is a known property, and
// should be in parentheses.
MT.testMode(
  'atMediaInvalidType',
  '@media screen and color { }',
  [
    'def', '@media',
    null, ' ',
    'attribute', 'screen',
    null, ' ',
    'operator', 'and',
    null, ' ',
    'error', 'color',
    null, ' { }'
  ]
);

// Error, because "print" is not a known property, but is a known type,
// and should not be in parenthese.
MT.testMode(
  'atMediaInvalidProperty',
  '@media screen and (print) { }',
  [
    'def', '@media',
    null, ' ',
    'attribute', 'screen',
    null, ' ',
    'operator', 'and',
    null, ' (',
    'error', 'print',
    null, ') { }'
  ]
);

// Soft error, because "foobarhello" is not a known property or type.
MT.testMode(
  'atMediaUnknownProperty',
  '@media screen and (foobarhello) { }',
  [
    'def', '@media',
    null, ' ',
    'attribute', 'screen',
    null, ' ',
    'operator', 'and',
    null, ' (',
    'property error', 'foobarhello',
    null, ') { }'
  ]
);

MT.testMode(
  'tagSelector',
  'foo { }',
  [
    'tag', 'foo',
    null, ' { }'
  ]
);

MT.testMode(
  'classSelector',
  '.foo-bar_hello { }',
  [
    'qualifier', '.foo-bar_hello',
    null, ' { }'
  ]
);

MT.testMode(
  'idSelector',
  '#foo { #foo }',
  [
    'builtin', '#foo',
    null, ' { ',
    'error', '#foo',
    null, ' }'
  ]
);

MT.testMode(
  'tagSelectorUnclosed',
  'foo { margin: 0 } bar { }',
  [
    'tag', 'foo',
    null, ' { ',
    'property', 'margin',
    'operator', ':',
    null, ' ',
    'number', '0',
    null, ' } ',
    'tag', 'bar',
    null, ' { }'
  ]
);

MT.testMode(
  'tagStringNoQuotes',
  'foo { font-family: hello world; }',
  [
    'tag', 'foo',
    null, ' { ',
    'property', 'font-family',
    'operator', ':',
    null, ' ',
    'variable-2', 'hello',
    null, ' ',
    'variable-2', 'world',
    null, '; }'
  ]
);

MT.testMode(
  'tagStringDouble',
  'foo { font-family: "hello world"; }',
  [
    'tag', 'foo',
    null, ' { ',
    'property', 'font-family',
    'operator', ':',
    null, ' ',
    'string', '"hello world"',
    null, '; }'
  ]
);

MT.testMode(
  'tagStringSingle',
  'foo { font-family: \'hello world\'; }',
  [
    'tag', 'foo',
    null, ' { ',
    'property', 'font-family',
    'operator', ':',
    null, ' ',
    'string', '\'hello world\'',
    null, '; }'
  ]
);

MT.testMode(
  'tagColorKeyword',
  'foo { color: black; }',
  [
    'tag', 'foo',
    null, ' { ',
    'property', 'color',
    'operator', ':',
    null, ' ',
    'keyword', 'black',
    null, '; }'
  ]
);

MT.testMode(
  'tagColorHex3',
  'foo { background: #fff; }',
  [
    'tag', 'foo',
    null, ' { ',
    'property', 'background',
    'operator', ':',
    null, ' ',
    'atom', '#fff',
    null, '; }'
  ]
);

MT.testMode(
  'tagColorHex6',
  'foo { background: #ffffff; }',
  [
    'tag', 'foo',
    null, ' { ',
    'property', 'background',
    'operator', ':',
    null, ' ',
    'atom', '#ffffff',
    null, '; }'
  ]
);

MT.testMode(
  'tagColorHex4',
  'foo { background: #ffff; }',
  [
    'tag', 'foo',
    null, ' { ',
    'property', 'background',
    'operator', ':',
    null, ' ',
    'atom error', '#ffff',
    null, '; }'
  ]
);

MT.testMode(
  'tagColorHexInvalid',
  'foo { background: #ffg; }',
  [
    'tag', 'foo',
    null, ' { ',
    'property', 'background',
    'operator', ':',
    null, ' ',
    'atom error', '#ffg',
    null, '; }'
  ]
);

MT.testMode(
  'tagNegativeNumber',
  'foo { margin: -5px; }',
  [
    'tag', 'foo',
    null, ' { ',
    'property', 'margin',
    'operator', ':',
    null, ' ',
    'number', '-5px',
    null, '; }'
  ]
);

MT.testMode(
  'tagPositiveNumber',
  'foo { padding: 5px; }',
  [
    'tag', 'foo',
    null, ' { ',
    'property', 'padding',
    'operator', ':',
    null, ' ',
    'number', '5px',
    null, '; }'
  ]
);

MT.testMode(
  'tagVendor',
  'foo { -foo-box-sizing: -foo-border-box; }',
  [
    'tag', 'foo',
    null, ' { ',
    'meta', '-foo-',
    'property', 'box-sizing',
    'operator', ':',
    null, ' ',
    'meta', '-foo-',
    'string-2', 'border-box',
    null, '; }'
  ]
);

MT.testMode(
  'tagBogusProperty',
  'foo { barhelloworld: 0; }',
  [
    'tag', 'foo',
    null, ' { ',
    'property error', 'barhelloworld',
    'operator', ':',
    null, ' ',
    'number', '0',
    null, '; }'
  ]
);

MT.testMode(
  'tagTwoProperties',
  'foo { margin: 0; padding: 0; }',
  [
    'tag', 'foo',
    null, ' { ',
    'property', 'margin',
    'operator', ':',
    null, ' ',
    'number', '0',
    null, '; ',
    'property', 'padding',
    'operator', ':',
    null, ' ',
    'number', '0',
    null, '; }'
  ]
);
//
//MT.testMode(
//  'tagClass',
//  '@media only screen and (min-width: 500px), print {foo.bar#hello { color: black !important; background: #f00; margin: -5px; padding: 5px; -foo-box-sizing: border-box; } /* world */}',
//  [
//    'def', '@media',
//    null, ' ',
//    'keyword', 'only',
//    null, ' ',
//    'attribute', 'screen',
//    null, ' ',
//    'operator', 'and',
//    null, ' ',
//    'bracket', '(',
//    'property', 'min-width',
//    'operator', ':',
//    null, ' ',
//    'number', '500px',
//    'bracket', ')',
//    null, ', ',
//    'attribute', 'print',
//    null, ' {',
//    'tag', 'foo',
//    'qualifier', '.bar',
//    'header', '#hello',
//    null, ' { ',
//    'property', 'color',
//    'operator', ':',
//    null, ' ',
//    'keyword', 'black',
//    null, ' ',
//    'keyword', '!important',
//    null, '; ',
//    'property', 'background',
//    'operator', ':',
//    null, ' ',
//    'atom', '#f00',
//    null, '; ',
//    'property', 'padding',
//    'operator', ':',
//    null, ' ',
//    'number', '5px',
//    null, '; ',
//    'property', 'margin',
//    'operator', ':',
//    null, ' ',
//    'number', '-5px',
//    null, '; ',
//    'meta', '-foo-',
//    'property', 'box-sizing',
//    'operator', ':',
//    null, ' ',
//    'string-2', 'border-box',
//    null, '; } ',
//    'comment', '/* world */',
//    null, '}'
//  ]
//);