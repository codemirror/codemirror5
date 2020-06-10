import buble from 'rollup-plugin-buble';

export default [
  {
    input: "./runmode-browser.js",
    output: {
      banner: `// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE
`,
      format: "iife",
      file: "../runmode-browser.js",
      name: "CodeMirror"
    },
    plugins: [ buble({namedFunctionExpressions: false}) ]
  },
  {
    input: "./runmode-node.js",
    output: {
      banner: `// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE
`,
      format: "cjs",
      file: "../runmode-node.js",
      name: "CodeMirror"
    },
    plugins: [ buble({namedFunctionExpressions: false}) ]
  },
];
