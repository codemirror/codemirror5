/**
 * Helper to test CodeMirror highlighting modes. It pretty prints output of the
 * highlighter and can check against expected styles.
 *
 * See test.html in the stex mode for examples.
 */
ModeTest = {};

ModeTest.modeOptions = {};
ModeTest.modeName = CodeMirror.defaults.mode;

/* keep track of results for printSummary */
ModeTest.tests = 0;
ModeTest.passes = 0;

/**
 * Run a test; prettyprints the results using document.write().
 *
 * @param string to highlight
 *
 * @param style[i] expected style of the i'th token in string
 *
 * @param token[i] expected value for the i'th token in string
 */
ModeTest.test = function() {
  ModeTest.tests += 1;

  var mode = CodeMirror.getMode(ModeTest.modeOptions, ModeTest.modeName);

  if (arguments.length < 1) {
    throw "must have text for test";
  }
  if (arguments.length % 2 != 1) {
    throw "must have text for test plus expected (style, token) pairs";
  }

  var text = arguments[0];
  var expectedOutput = [];
  for (var i = 1; i < arguments.length; i += 2) {
    expectedOutput.push([arguments[i],arguments[i + 1]]);
  }

  var observedOutput = ModeTest.highlight(text, mode)

  var pass, passStyle = "";
  if (expectedOutput.length > 0) {
    pass = ModeTest.highlightOutputsEqual(expectedOutput, observedOutput);
    passStyle = pass ? 'mt-pass' : 'mt-fail';
    ModeTest.passes += pass ? 1 : 0;
  }

  var s = '';
  s += '<div class="mt-test ' + passStyle + '">';
  s +=   '<pre>' + ModeTest.htmlEscape(text) + '</pre>';
  s +=   '<div class="cm-s-default">';
  if (pass || expectedOutput.length == 0) {
    s +=   ModeTest.prettyPrintOutputTable(observedOutput);
  } else {
    s += 'expected:';
    s +=   ModeTest.prettyPrintOutputTable(expectedOutput);
    s += 'observed:';
    s +=   ModeTest.prettyPrintOutputTable(observedOutput);
  }
  s +=   '</div>';
  s += '</div>';
  document.write(s);
}

/**
 * Emulation of CodeMirror's internal highlight routine for testing. Multi-line
 * input is supported.
 *
 * @param string to highlight
 *
 * @param mode the mode that will do the actual highlighting
 *
 * @return array of [style, token] pairs
 */
ModeTest.highlight = function(string, mode) {
  var state = mode.startState()

  var lines = string.replace(/\r\n/g,'\n').split('\n');
  var output = [];
  for (var i = 0; i < lines.length; ++i) {
    var line = lines[i];
    var stream = new CodeMirror.StringStream(line);
    if (line == "" && mode.blankLine) mode.blankLine(state);
    while (!stream.eol()) {
      var style = mode.token(stream, state);
      var substr = line.slice(stream.start, stream.pos);
      output.push([style, substr]);
      stream.start = stream.pos;
    }
  }

  return output;
}

/**
 * Compare two arrays of output from ModeTest.highlight.
 *
 * @param o1 array of [style, token] pairs
 *
 * @param o2 array of [style, token] pairs
 *
 * @return boolean; true iff outputs equal
 */
ModeTest.highlightOutputsEqual = function(o1, o2) {
  var eq = (o1.length == o2.length);
  if (eq) {
    for (var j in o1) {
      eq = eq &&
        o1[j].length == 2 && o1[j][0] == o2[j][0] && o1[j][1] == o2[j][1];
    }
  }
  return eq;
}

/**
 * Print tokens and corresponding styles in a table. Spaces in the token are
 * replaced with 'interpunct' dots (&middot;).
 *
 * @param output array of [style, token] pairs
 *
 * @return html string
 */
ModeTest.prettyPrintOutputTable = function(output) {
  var s = '<table class="mt-output">';
  s += '<tr>';
  for (var i = 0; i < output.length; ++i) {
    var token = output[i];
    s +=
      '<td class="mt-token">' +
        '<span class="cm-' + token[0] + '">' +
          ModeTest.htmlEscape(token[1]).replace(/ /g,'&middot;') +
        '</span>' +
      '</td>';
  }
  s += '</tr><tr>';
  for (var i = 0; i < output.length; ++i) {
    var token = output[i];
    s +=
      '<td class="mt-style"><span>' + token[0] + '</span></td>';
  }
  s += '</table>';
  return s;
}

/**
 * Print how many tests have run so far and how many of those passed.
 */
ModeTest.printSummary = function() {
  document.write(ModeTest.passes + ' passes for ' + ModeTest.tests + ' tests');
}

/**
 * Basic HTML escaping.
 */
ModeTest.htmlEscape = function(str) {
  str = str.toString();
  return str.replace(/[<&]/g,
      function(str) {return str == "&" ? "&amp;" : "&lt;";});
}

