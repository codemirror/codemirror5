import buble from 'rollup-plugin-buble';

export default {
  banner: `// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// This is CodeMirror (http://codemirror.net), a code editor
// implemented in JavaScript on top of the browser's DOM.
//
// You can find some technical background for some of the code below
// at http://marijnhaverbeke.nl/blog/#cm-internals .
`,
  entry: "src/codemirror.js",
  format: "umd",
  dest: "lib/codemirror.js",
  moduleName: "CodeMirror",
  plugins: [ buble({namedFunctionExpressions: false}) ]
};
