import buble from 'rollup-plugin-buble';

export default {
  input: "src/codemirror.js",
  output: {
    banner: `// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// This is CodeMirror (https://codemirror.net), a code editor
// implemented in JavaScript on top of the browser's DOM.
//
// You can find some technical background for some of the code below
// at http://marijnhaverbeke.nl/blog/#cm-internals .
`,
    format: "umd",
    file: "lib/codemirror.js",
    name: "CodeMirror"
  },
  plugins: [ buble({namedFunctionExpressions: false}) ]
};
