// Initiate ModeTest and set defaults
var MT = ModeTest;
MT.modeName = 'gfm';
MT.modeOptions = {};

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
    null, 'foo_bar_hello'
  ]
);
MT.testMode(
  'emStrongUnderscore',
  '___foo___ bar',
  [
    'strong', '__',
    'emstrong', '_foo__',
    'em', '_',
    null, ' bar'
  ]
);

// Fenced code blocks
MT.testMode(
  'fencedCodeBlocks',
  '```\nfoo\n\n```\nbar',
  [
    'comment', '```',
    'comment', 'foo',
    'comment', '```',
    null, 'bar'
  ]
);
// Fenced code block mode switching
MT.testMode(
  'fencedCodeBlockModeSwitching',
  '```javascript\nfoo\n\n```\nbar',
  [
    'comment', '```javascript',
    'variable', 'foo',
    'comment', '```',
    null, 'bar'
  ]
);

// SHA
MT.testMode(
  'SHA',
  'foo be6a8cc1c1ecfe9489fb51e4869af15a13fc2cd2 bar',
  [
    null, 'foo ',
    'link', 'be6a8cc1c1ecfe9489fb51e4869af15a13fc2cd2',
    null, ' bar'
  ]
);
// GitHub highlights hashes 7-40 chars in length
MT.testMode(
  'shortSHA',
  'foo be6a8cc bar',
  [
    null, 'foo ',
    'link', 'be6a8cc',
    null, ' bar'
  ]
);
// Invalid SHAs
// 
// GitHub does not highlight hashes shorter than 7 chars
MT.testMode(
  'tooShortSHA',
  'foo be6a8c bar',
  [
    null, 'foo be6a8c bar'
  ]
);
// GitHub does not highlight hashes longer than 40 chars
MT.testMode(
  'longSHA',
  'foo be6a8cc1c1ecfe9489fb51e4869af15a13fc2cd22 bar',
  [
    null, 'foo be6a8cc1c1ecfe9489fb51e4869af15a13fc2cd22 bar'
  ]
);
MT.testMode(
  'badSHA',
  'foo be6a8cc1c1ecfe9489fb51e4869af15a13fc2cg2 bar',
  [
    null, 'foo be6a8cc1c1ecfe9489fb51e4869af15a13fc2cg2 bar'
  ]
);
// User@SHA
MT.testMode(
  'userSHA',
  'foo bar@be6a8cc1c1ecfe9489fb51e4869af15a13fc2cd2 hello',
  [
    null, 'foo ',
    'link', 'bar@be6a8cc1c1ecfe9489fb51e4869af15a13fc2cd2',
    null, ' hello'
  ]
);
// User/Project@SHA
MT.testMode(
  'userProjectSHA',
  'foo bar/hello@be6a8cc1c1ecfe9489fb51e4869af15a13fc2cd2 world',
  [
    null, 'foo ',
    'link', 'bar/hello@be6a8cc1c1ecfe9489fb51e4869af15a13fc2cd2',
    null, ' world'
  ]
);

// #Num
MT.testMode(
  'num',
  'foo #1 bar',
  [
    null, 'foo ',
    'link', '#1',
    null, ' bar'
  ]
);
// bad #Num
MT.testMode(
  'badNum',
  'foo #1bar hello',
  [
    null, 'foo #1bar hello'
  ]
);
// User#Num
MT.testMode(
  'userNum',
  'foo bar#1 hello',
  [
    null, 'foo ',
    'link', 'bar#1',
    null, ' hello'
  ]
);
// User/Project#Num
MT.testMode(
  'userProjectNum',
  'foo bar/hello#1 world',
  [
    null, 'foo ',
    'link', 'bar/hello#1',
    null, ' world'
  ]
);

// Vanilla links
MT.testMode(
  'vanillaLink',
  'foo http://www.example.com/ bar',
  [
    null, 'foo ',
    'link', 'http://www.example.com/',
    null, ' bar'
  ]
);
MT.testMode(
  'vanillaLinkPunctuation',
  'foo http://www.example.com/. bar',
  [
    null, 'foo ',
    'link', 'http://www.example.com/',
    null, '. bar'
  ]
);
MT.testMode(
  'vanillaLinkExtension',
  'foo http://www.example.com/index.html bar',
  [
    null, 'foo ',
    'link', 'http://www.example.com/index.html',
    null, ' bar'
  ]
);
// Not a link
MT.testMode(
  'notALink',
  '```css\nfoo {color:black;}\n```http://www.example.com/',
  [
    'comment', '```css',
    'tag', 'foo',
    null, ' {',
    'property', 'color',
    'operator', ':',
    'keyword', 'black',
    null, ';}',
    'comment', '```',
    'link', 'http://www.example.com/'
  ]
);
// Not a link
MT.testMode(
  'notALink',
  '``foo `bar` http://www.example.com/`` hello',
  [
    'comment', '``foo `bar` http://www.example.com/``',
    null, ' hello'
  ]
);
// Not a link
MT.testMode(
  'notALink',
  '`foo\nhttp://www.example.com/\n`foo\n\nhttp://www.example.com/',
  [
    'comment', '`foo',
    'link', 'http://www.example.com/',
    'comment', '`foo',
    'link', 'http://www.example.com/'
  ]
);