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
ModeTest.testCount = 0;
ModeTest.passes = 0;

/**
 * Run a test; prettyprints the results using document.write().
 * 
 * @param name Name of test
 * @param text String to highlight.
 * @param expected Expected styles and tokens: Array(style, token, [style, token,...])
 * @param modeName
 * @param modeOptions
 * @param expectedFail
 */
ModeTest.testMode = function(name, text, expected, modeName, modeOptions, expectedFail) {
  ModeTest.testCount += 1;
  
  if (!modeName) modeName = ModeTest.modeName;
  
  if (!modeOptions) modeOptions = ModeTest.modeOptions;

  var mode = CodeMirror.getMode(modeOptions, modeName);

  if (expected.length < 0) {
    throw "must have text for test (" + name + ")";
  }
  if (expected.length % 2 != 0) {
    throw "must have text for test (" + name + ") plus expected (style, token) pairs";
  }
  return test(
    modeName + "_" + name,
    function(){
      return ModeTest.compare(text, expected, mode);
    },
    expectedFail
  );
  
}

ModeTest.compare = function (text, arguments, mode) {

  var expectedOutput = [];
  for (var i = 0; i < arguments.length; i += 2) {
    arguments[i] = (arguments[i] != null ? arguments[i].split(' ').sort().join(' ') : arguments[i]);
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
  if (pass || expectedOutput.length == 0) {
    s += '<div class="mt-test ' + passStyle + '">';
    s +=   '<pre>' + ModeTest.htmlEscape(text) + '</pre>';
    s +=   '<div class="cm-s-default">';
    s +=   ModeTest.prettyPrintOutputTable(observedOutput);
    s +=   '</div>';
    s += '</div>';
    return s;
  } else {
    s += '<div class="mt-test ' + passStyle + '">';
    s +=   '<pre>' + ModeTest.htmlEscape(text) + '</pre>';
    s +=   '<div class="cm-s-default">';
    s += 'expected:';
    s +=   ModeTest.prettyPrintOutputTable(expectedOutput);
    s += 'observed:';
    s +=   ModeTest.prettyPrintOutputTable(observedOutput);
    s +=   '</div>';
    s += '</div>';
    throw s;
  }
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
    var pos = 0;
    var st = [];
    /* Start copied code from CodeMirror.highlight */
    while (!stream.eol()) {
      var style = mode.token(stream, state), substr = stream.current();
      stream.start = stream.pos;
      if (pos && st[pos-1] == style) {
        st[pos-2] += substr;
      } else if (substr) {
        st[pos++] = substr; st[pos++] = style;
      }
      // Give up when line is ridiculously long
      if (stream.pos > 5000) {
        st[pos++] = this.text.slice(stream.pos); st[pos++] = null;
        break;
      }
    }
    /* End copied code from CodeMirror.highlight */
    for (var x = 0; x < st.length; x += 2) {
      st[x + 1] = (st[x + 1] != null ? st[x + 1].split(' ').sort().join(' ') : st[x + 1]);
      output.push([st[x + 1], st[x]]);
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
        '<span class="cm-' + String(token[0]).replace(/ +/g, " cm-") + '">' +
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
  ModeTest.runTests(ModeTest.displayTest);
  document.write(ModeTest.passes + ' passes for ' + ModeTest.testCount + ' tests');
}

/**
 * Basic HTML escaping.
 */
ModeTest.htmlEscape = function(str) {
  str = str.toString();
  return str.replace(/[<&]/g,
      function(str) {return str == "&" ? "&amp;" : "&lt;";});
}

