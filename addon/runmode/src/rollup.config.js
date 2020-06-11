import buble from '@rollup/plugin-buble';
import multi from '@rollup/plugin-multi-entry';

const banner = `// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE
`

export default [
  {
    input: ["./runmode-browser.js", "../runmode.js"],
    output: {
      banner,
      format: "iife",
      file: "../runmode-browser.js",
      name: "CodeMirror"
    },
    plugins: [buble({namedFunctionExpressions: false}), multi()]
  },
  {
    input: ["./runmode-node.js", "../runmode.js"],
    output: {
      banner,
      format: "cjs",
      file: "../runmode-node.js",
      name: "CodeMirror"
    },
    plugins: [buble({namedFunctionExpressions: false}), multi()]
  },
];
