import buble from 'rollup-plugin-buble';

const banner = `// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// This is CodeMirror (https://codemirror.net), a code editor
// implemented in JavaScript on top of the browser's DOM.
//
// You can find some technical background for some of the code below
// at http://marijnhaverbeke.nl/blog/#cm-internals .
`;

export default {
  input: "src/codemirror.js",
  output: [{
    banner,
    format: "umd",
    file: "lib/codemirror.js",
    name: "CodeMirror",
  }, {
    banner,
    format: "esm",
    file: "lib/codemirror.mjs",
    name: "CodeMirror"
  }],
  plugins: [ buble({namedFunctionExpressions: false}) ],
};
