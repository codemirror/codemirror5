var MT = ModeTest;
MT.modeName = 'stex';
MT.modeOptions = {};

MT.testMode(
  'word',
  'foo',
  [
    null, 'foo'
  ]
);

MT.testMode(
  'twoWords',
  'foo bar',
  [
    null, 'foo bar'
  ]
);

MT.testMode(
  'beginEndDocument',
  '\\begin{document}\n\\end{document}',
  [
    'tag', '\\begin',
    'bracket', '{',
    'atom', 'document',
    'bracket', '}',
    'tag', '\\end',
    'bracket', '{',
    'atom', 'document',
    'bracket', '}'
  ]
);

MT.testMode(
  'beginEndEquation',
  '\\begin{equation}\n  E=mc^2\n\\end{equation}',
  [
    'tag', '\\begin',
    'bracket', '{',
    'atom', 'equation',
    'bracket', '}',
    null, '  E=mc^2',
    'tag', '\\end',
    'bracket', '{',
    'atom', 'equation',
    'bracket', '}'
  ]
);

MT.testMode(
  'beginModule',
  '\\begin{module}[]',
  [
    'tag', '\\begin',
    'bracket', '{',
    'atom', 'module',
    'bracket', '}[]'
  ]
);

MT.testMode(
  'beginModuleId',
  '\\begin{module}[id=bbt-size]',
  [
    'tag', '\\begin',
    'bracket', '{',
    'atom', 'module',
    'bracket', '}[',
    null, 'id=bbt-size',
    'bracket', ']'
  ]
);

MT.testMode(
  'importModule',
  '\\importmodule[b-b-t]{b-b-t}',
  [
    'tag', '\\importmodule',
    'bracket', '[',
    'string', 'b-b-t',
    'bracket', ']{',
    'builtin', 'b-b-t',
    'bracket', '}'
  ]
);

MT.testMode(
  'importModulePath',
  '\\importmodule[\\KWARCslides{dmath/en/cardinality}]{card}',
  [
    'tag', '\\importmodule',
    'bracket', '[',
    'tag', '\\KWARCslides',
    'bracket', '{',
    'string', 'dmath/en/cardinality',
    'bracket', '}]{',
    'builtin', 'card',
    'bracket', '}'
  ]
);

MT.testMode(
  'psForPDF',
  '\\PSforPDF[1]{#1}', // could treat #1 specially
  [
    'tag', '\\PSforPDF',
    'bracket', '[',
    'atom', '1',
    'bracket', ']{',
    null, '#1',
    'bracket', '}'
  ]
);

MT.testMode(
  'comment',
  '% foo',
  [
    'comment', '% foo'
  ]
);

MT.testMode(
  'tagComment',
  '\\item% bar',
  [
    'tag', '\\item',
    'comment', '% bar'
  ]
);

MT.testMode(
  'commentTag',
  ' % \\item',
  [
    null, ' ',
    'comment', '% \\item'
  ]
);

MT.testMode(
  'commentLineBreak',
  '%\nfoo',
  [
    'comment', '%',
    null, 'foo'
  ]
);

MT.testMode(
  'tagErrorCurly',
  '\\begin}{',
  [
    'tag', '\\begin',
    'error', '}',
    'bracket', '{'
  ]
);

MT.testMode(
  'tagErrorSquare',
  '\\item]{',
  [
    'tag', '\\item',
    'error', ']',
    'bracket', '{'
  ]
);

MT.testMode(
  'commentCurly',
  '% }',
  [
    'comment', '% }'
  ]
);

MT.testMode(
  'tagHash',
  'the \\# key',
  [
    null, 'the ',
    'tag', '\\#',
    null, ' key'
  ]
);

MT.testMode(
  'tagNumber',
  'a \\$5 stetson',
  [
    null, 'a ',
    'tag', '\\$',
  'atom', 5,
  null, ' stetson'
  ]
);

MT.testMode(
  'tagPercent',
  '100\\% beef',
  [
    'atom', '100',
    'tag', '\\%',
    null, ' beef'
  ]
);

MT.testMode(
  'tagAmpersand',
  'L \\& N',
  [
    null, 'L ',
    'tag', '\\&',
    null, ' N'
  ]
);

MT.testMode(
  'tagUnderscore',
  'foo\\_bar',
  [
    null, 'foo',
    'tag', '\\_',
    null, 'bar'
  ]
);

MT.testMode(
  'tagBracketOpen',
  '\\emph{\\{}',
  [
    'tag', '\\emph',
    'bracket', '{',
    'tag', '\\{',
    'bracket', '}'
  ]
);

MT.testMode(
  'tagBracketClose',
  '\\emph{\\}}',
  [
    'tag', '\\emph',
    'bracket', '{',
    'tag', '\\}',
    'bracket', '}'
  ]
);

MT.testMode(
  'tagLetterNumber',
  'section \\S1',
  [
    null, 'section ',
    'tag', '\\S',
    'atom', '1'
  ]
);

MT.testMode(
  'textTagNumber',
  'para \\P2',
  [
    null, 'para ',
    'tag', '\\P',
    'atom', '2'
  ]
);

MT.testMode(
  'thinspace',
  'x\\,y', // thinspace
  [
    null, 'x',
    'tag', '\\,',
    null, 'y'
  ]
);

MT.testMode(
  'thickspace',
  'x\\;y', // thickspace
  [
    null, 'x',
    'tag', '\\;',
    null, 'y'
  ]
);

MT.testMode(
  'negativeThinspace',
  'x\\!y', // negative thinspace
  [
    null, 'x',
    'tag', '\\!',
    null, 'y'
  ]
);

MT.testMode(
  'periodNotSentence',
  'J.\\ L.\\ is', // period not ending a sentence
  [
    null, 'J.\\ L.\\ is'
  ]
); // maybe could be better

MT.testMode(
  'periodSentence',
  'X\\@. The', // period ending a sentence
  [
    null, 'X',
    'tag', '\\@',
    null, '. The'
  ]
);

MT.testMode(
  'italicCorrection',
  '{\\em If\\/} I', // italic correction
  [
    'bracket', '{',
    'tag', '\\em',
    null, ' If',
    'tag', '\\/',
    'bracket', '}',
    null, ' I'
  ]
);

MT.testMode(
  'tagBracket',
  '\\newcommand{\\pop}',
  [
    'tag', '\\newcommand',
    'bracket', '{',
    'tag', '\\pop',
    'bracket', '}'
  ]
);