// Highlighting text that matches the selection
//
// Defines an option highlightSelectionMatches, which, when enabled,
// will style strings that match the selection throughout the
// document.
//
// The option can be set to true to simply enable it, or to a
// {minChars, style, showToken} object to explicitly configure it.
// minChars is the minimum amount of characters that should be
// selected for the behavior to occur, and style is the token style to
// apply to the matches. This will be prefixed by "cm-" to create an
// actual CSS class name. showToken, when enabled, will cause the
// current token to be highlighted when nothing is selected.

(function() {
  var PALETTE_TOKEN = "palette";
  var COLOR_PATTERN = /#[a-f0-9]{6}\b|#[a-f0-9]{3}\b|\brgb\(\s*(?:[0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b\s*,\s*(?:[0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b\s*,\s*(?:[0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b\s*\)|\brgb\(\s*(?:[0-9]{1,2}%|100%)\s*,\s*(?:[0-9]{1,2}%|100%)\s*,\s*(?:[0-9]{1,2}%|100%)\s*\)|\brgba\(\s*(?:[0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b\s*,\s*(?:[0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b\s*,\s*(?:[0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b\s*,\s*(?:1|1\.0|0|0?\.[0-9]{1,3})\s*\)|\brgba\(\s*(?:[0-9]{1,2}%|100%)\s*,\s*(?:[0-9]{1,2}%|100%)\s*,\s*(?:[0-9]{1,2}%|100%)\s*,\s*(?:1|1\.0|0|0?\.[0-9]{1,3})\s*\)|\bhsl\(\s*(?:[0-9]{1,3})\b\s*,\s*(?:[0-9]{1,2}|100)\b%\s*,\s*(?:[0-9]{1,2}|100)\b%\s*\)|\bhsla\(\s*(?:[0-9]{1,3})\b\s*,\s*(?:[0-9]{1,2}|100)\b%\s*,\s*(?:[0-9]{1,2}|100)\b%\s*,\s*(?:1|1\.0|0|0?\.[0-9]{1,3})\s*\)|\baliceblue\b|\bantiquewhite\b|\baqua\b|\baquamarine\b|\bazure\b|\bbeige\b|\bbisque\b|\bblack\b|\bblanchedalmond\b|\bblue\b|\bblueviolet\b|\bbrown\b|\bburlywood\b|\bcadetblue\b|\bchartreuse\b|\bchocolate\b|\bcoral\b|\bcornflowerblue\b|\bcornsilk\b|\bcrimson\b|\bcyan\b|\bdarkblue\b|\bdarkcyan\b|\bdarkgoldenrod\b|\bdarkgray\b|\bdarkgreen\b|\bdarkgrey\b|\bdarkkhaki\b|\bdarkmagenta\b|\bdarkolivegreen\b|\bdarkorange\b|\bdarkorchid\b|\bdarkred\b|\bdarksalmon\b|\bdarkseagreen\b|\bdarkslateblue\b|\bdarkslategray\b|\bdarkslategrey\b|\bdarkturquoise\b|\bdarkviolet\b|\bdeeppink\b|\bdeepskyblue\b|\bdimgray\b|\bdimgrey\b|\bdodgerblue\b|\bfirebrick\b|\bfloralwhite\b|\bforestgreen\b|\bfuchsia\b|\bgainsboro\b|\bghostwhite\b|\bgold\b|\bgoldenrod\b|\bgray\b|\bgreen\b|\bgreenyellow\b|\bgrey\b|\bhoneydew\b|\bhotpink\b|\bindianred\b|\bindigo\b|\bivory\b|\bkhaki\b|\blavender\b|\blavenderblush\b|\blawngreen\b|\blemonchiffon\b|\blightblue\b|\blightcoral\b|\blightcyan\b|\blightgoldenrodyellow\b|\blightgray\b|\blightgreen\b|\blightgrey\b|\blightpink\b|\blightsalmon\b|\blightseagreen\b|\blightskyblue\b|\blightslategray\b|\blightslategrey\b|\blightsteelblue\b|\blightyellow\b|\blime\b|\blimegreen\b|\blinen\b|\bmagenta\b|\bmaroon\b|\bmediumaquamarine\b|\bmediumblue\b|\bmediumorchid\b|\bmediumpurple\b|\bmediumseagreen\b|\bmediumslateblue\b|\bmediumspringgreen\b|\bmediumturquoise\b|\bmediumvioletred\b|\bmidnightblue\b|\bmintcream\b|\bmistyrose\b|\bmoccasin\b|\bnavajowhite\b|\bnavy\b|\boldlace\b|\bolive\b|\bolivedrab\b|\borange\b|\borangered\b|\borchid\b|\bpalegoldenrod\b|\bpalegreen\b|\bpaleturquoise\b|\bpalevioletred\b|\bpapayawhip\b|\bpeachpuff\b|\bperu\b|\bpink\b|\bplum\b|\bpowderblue\b|\bpurple\b|\bred\b|\brosybrown\b|\broyalblue\b|\bsaddlebrown\b|\bsalmon\b|\bsandybrown\b|\bseagreen\b|\bseashell\b|\bsienna\b|\bsilver\b|\bskyblue\b|\bslateblue\b|\bslategray\b|\bslategrey\b|\bsnow\b|\bspringgreen\b|\bsteelblue\b|\btan\b|\bteal\b|\bthistle\b|\btomato\b|\bturquoise\b|\bviolet\b|\bwheat\b|\bwhite\b|\bwhitesmoke\b|\byellow\b|\byellowgreen\b/gi;

  function makeWidget(color) {
    var hint = document.createElement("span");
    hint.innerHTML = "&nbsp;";
    hint.className = "cm-palette-hint";
    hint.style.background = color;

    return hint;
  }

  function skipUntil(text, stream) {
    while (!stream.match(text, false) && stream.next()) {
      continue;
    }
  }

  var paletteOverlay = {
    token: function(stream, state) {
      var match = stream.match(COLOR_PATTERN, false);
      if (match) {
        var color = match[0]
        if (stream.match(color, true)) {
          return PALETTE_TOKEN;
        }
        else {
          skipUntil(color, stream);
          return null;
        }
      }
      else {
        stream.skipToEnd();
        return null;
      }
    }
  };

  function isPaletteMark(mark) { return mark.isPaletteMark }
  function clear(mark) { return mark.clear() }

  function findMarks(editor, range) {
    var markers = [];
    var from = range.from;
    var to = range.to;
    var firstLine = from.line;
    var lastLine = to.line;
    var lineNumber = from.line;
    while (lineNumber <= lastLine) {
      var line = editor.getLineHandle(lineNumber);
      var spans = line && line.markedSpans;
      if (spans) {
        var isLastLine = lineNumber === lastLine;
        var isFirstLine = lineNumber === firstLine;

        var count = spans.length;
        var index = 0;
        while (index < count) {
          var span = spans[index];
          var isInRange = isFirstLine ? span.from >= from.ch :
                          isLastLine ? span.to <= to.ch :
                          true;

          if (isInRange)
            markers.push(span.marker.parent || span.marker);

          index = index + 1;
        }
      }
      lineNumber = lineNumber + 1;
    }

    return markers;
  }

  function updatePaletteWidgets(editor, range) {
    var doc = editor.getDoc();
    findMarks(editor, range).filter(isPaletteMark).forEach(clear);

    editor.eachLine(range.from.line, range.to.line + 1, function(line) {
      var match = line.text.match(COLOR_PATTERN)
      if (match) {
        var color = match[0];
        var index = line.text.indexOf(color);
        var column = index + color.length;
        var bookmark = doc.setBookmark({line: doc.getLineNumber(line),
                                        ch: column},
                                       {widget: makeWidget(color),
                                        insertLeft: true});
        bookmark.isPaletteMark = true;
      }
    });
  }

  CodeMirror.defineOption("paletteHints", false, function(editor, current, past) {
    if (current) {
      editor.addOverlay(paletteOverlay);
      editor.on("change", updatePaletteWidgets);
      updatePaletteWidgets(editor, {
        from: {line: editor.firstLine(), ch: 0},
        to: {line: editor.lastLine() + 1, ch: 0}
      });
    }
    else {
      editor.removeOverlay(paletteOverlay);
      editor.off("change", updatePaletteWidgets);
      editor.getAllMarks().filter(isPaletteMark).forEach(clear);
    }
  });
})();
