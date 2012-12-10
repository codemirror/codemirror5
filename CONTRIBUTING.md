# How to contribute

- [Getting help](#getting-help-)
- [Submitting bug reports](#submitting-bug-reports-)
- [Contributing code](#contributing-code-)

## Getting help [^](#how-to-contribute)

Community discussion, questions, and informal bug reporting is done on the
[CodeMirror Google group](http://groups.google.com/group/codemirror).

## Submitting bug reports [^](#how-to-contribute)

The preferred way to report bugs is to use the
[GitHub issue tracker](http://github.com/marijnh/CodeMirror/issues). Before
reporting a bug, read these pointers.

**Note:** The issue tracker is for *bugs*, not requests for help. Questions
should be asked on the
[CodeMirror Google group](http://groups.google.com/group/codemirror) instead.

### Reporting bugs effectively

- CodeMirror is maintained by volunteers. They don't owe you anything, so be
  polite. Reports with an indignant or belligerent tone tend to be moved to the
  bottom of the pile.

- Include information about **the browser in which the problem occurred**. Even
  if you tested several browsers, and the problem occurred in all of them,
  mention this fact in the bug report. Also include browser version numbers and
  the operating system that you're on.

- Mention which release of CodeMirror you're using. Preferably, try also with
  the current development snapshot, to ensure the problem has not already been
  fixed.

- Mention very precisely what went wrong. "X is broken" is not a good bug
  report. What did you expect to happen? What happened instead? Describe the
  exact steps a maintainer has to take to make the problem occur. We can not
  fix something that we can not observe.

- If the problem can not be reproduced in any of the demos included in the
  CodeMirror distribution, please provide an HTML document that demonstrates
  the problem. The best way to do this is to go to
  [jsbin.com](http://jsbin.com/ihunin/edit), enter it there, press save, and
  include the resulting link in your bug report.

## Contributing code [^](#how-to-contribute)

- Make sure you have a [GitHub Account](https://github.com/signup/free)
- Fork [CodeMirror](https://github.com/marijnh/CodeMirror/)
  ([how to fork a repo](https://help.github.com/articles/fork-a-repo))
- Make your changes
    - If your change affects highlighting for one of the modes, please [add (or
    change) tests](#adding-mode-highlighting-tests) for the changes. If the mode
    doesn't already have highlighting tests, you *aren't* required to add any.
- Test your changes
    -Visit `/path-to-code/test/index.html` to test your code. *All tests should
    pass*.
- Submit a pull request
([how to create a pull request](https://help.github.com/articles/fork-a-repo))

### Adding mode highlighting tests

- Create a `test.js` file in the corresponding mode directory
   ([example](https://github.com/marijnh/CodeMirror/blob/master/mode/markdown/test.js))
- Add script tags to `/test/index.html` to include the formatting code and
   as well as the tests.
- Run the tests!

### Code formatting standards

- 2 spaces (no tabs)
- Wrap to 80 characters when possible (unless it affects readability negatively)
- No trailing whitespace
    - Blank lines should be indented as if there *is* text on them
- Spacing
    - `function someFunction(someVar, someOtherVar) {`
    - `if (someVar === true) doThis(someVar, someOtherVar);`
    - `if (!someVar || someOtherVar === 0) {`
