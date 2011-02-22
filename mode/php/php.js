(function() {
  function keywords(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }
  var phpKeywords =
    keywords("abstract and array as break case catch cfunction class clone const continue declare " +
             "default do else elseif enddeclare endfor endforeach endif endswitch endwhile extends " +
             "final for foreach function global goto if implements interface instanceof namespace " +
             "new or private protected public static switch throw try use var while xor");

  CodeMirror.defineMode("php", function(config, parserConfig) {
    var htmlMode = CodeMirror.getMode(config, "text/html");
    var jsMode = CodeMirror.getMode(config, "text/javascript");
    var cssMode = CodeMirror.getMode(config, "text/css");
    var phpMode = CodeMirror.getMode(config, {name: "clike", keywords: phpKeywords});

    function dispatch(stream, state) { // TODO open PHP inside text/css
      var cur = state.context[0];
      if (cur.mode == htmlMode) {
        var style = htmlMode.token(stream, cur.state);
        if (style == "xml-processing")
          state.context.unshift({mode: phpMode, state: state.php, close: /^\?>/});
        else if (style == "xml-tag" && stream.current() == ">" && cur.state.context) {
          if (/^script$/i.test(cur.state.context.tagName))
            state.context.unshift({mode: jsMode,
                                   state: jsMode.startState(htmlMode.indent(cur.state, "")),
                                   close: /^<\/\s*script\s*>/i});
          else if (/^style$/i.test(cur.state.context.tagName))
            state.context.unshift({mode: cssMode,
                                   state: cssMode.startState(htmlMode.indent(cur.state, "")),
                                   close: /^<\/\s*style\s*>/i});
        }
        return style;
      }
      else if (stream.match(cur.close, false)) {
        state.context.shift();
        return dispatch(stream, state);
      }
      else return cur.mode.token(stream, cur.state);
    }

    return {
      startState: function() {
        var html = htmlMode.startState();
        return {html: html,
                php: phpMode.startState(),
                context: [{mode: htmlMode, state: html, close: null}]};
      },

      copyState: function(state) {
        var html = state.html, htmlNew = CodeMirror.copyState(htmlMode, html),
        php = state.php, phpNew = CodeMirror.copyState(phpMode, php), contextNew = [];
        for (var i = 0; i < state.context.length; ++i) {
          var context = state.context[i], cstate = context.state;
          if (cstate == html) cstate = htmlNew;
          else if (cstate == php) cstate = phpNew;
          else cstate = CodeMirror.copyState(context.mode, cstate);
          contextNew.push({mode: context.mode, state: cstate, close: context.close});
        }
        return {html: htmlNew, php: phpNew, context: contextNew};
      },

      token: dispatch,

      indent: function(state, textAfter) {
        var cur = state.context[0];
        return cur.mode.indent(cur.state, textAfter);
      },

      electricChars: "/{}:"
    }
  });
})();

CodeMirror.defineMIME("application/x-httpd-php", "php");
