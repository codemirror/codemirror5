CodeMirror.defineMode("htmlmixed", function (config, parserConfig)
{
  var htmlMode = CodeMirror.getMode(config, { name: "xml", htmlMode: true });
  var jsMode = CodeMirror.getMode(config, "javascript");
  var cssMode = CodeMirror.getMode(config, "css");

  function html(stream, state)
  {
    var style = htmlMode.token(stream, state.htmlState);
    if (style == "xml-tag" && stream.current() == ">" && state.htmlState.context)
    {
      if (/^script$/i.test(state.htmlState.context.tagName))
      {
        state.token = javascript;
        state.localState = jsMode.startState(htmlMode.indent(state.htmlState, ""));
      }
      else if (/^style$/i.test(state.htmlState.context.tagName))
      {
        state.token = css;
        state.localState = cssMode.startState(htmlMode.indent(state.htmlState, ""));
      }
    }
    return style;
  }
  function javascript(stream, state)
  {
    if (stream.match(/^<\/\s*script\s*>/i, false))
    {
      state.token = html;
      state.curState = null;
      return html(stream, state);
    }
    return jsMode.token(stream, state.localState);
  }
  function css(stream, state)
  {
    if (stream.match(/^<\/\s*style\s*>/i, false))
    {
      state.token = html;
      state.localState = null;
      return html(stream, state);
    }
    return cssMode.token(stream, state.localState);
  }

  // =========== Extended by A.K. =============
  function getModeInfos(text, absPos)
  {
    var modeInfos = new Array();
    modeInfos[0] =
    {
      pos: 0,
      mode: htmlMode
    };

    var modeMatchers = new Array();
    modeMatchers[0] =
    {
      regex: new RegExp("<style[^>]*>([\\s\\S]*?)</style[^>]*>", "i"),
      mode: cssMode
    };
    modeMatchers[1] =
    {
      regex: new RegExp("<script[^>]*>([\\s\\S]*?)</script[^>]*>", "i"),
      mode: jsMode
    };

    var lastCharPos = (typeof (absPos) !== "undefined" ? absPos : text.length - 1);
    // Detect modes for the entire text
    for (var i = 0; i < modeMatchers.length; i++)
    {
      var curPos = 0;
      while (curPos <= lastCharPos)
      {
        var m = text.substr(curPos).match(modeMatchers[i].regex);
        if (m != null)
        {
          if (m.length > 1 && m[1].length > 0)
          {
            // Push block begin pos
            var blockBegin = curPos + m.index + m[0].indexOf(m[1]);
            modeInfos.push(
              {
                pos: blockBegin,
                mode: modeMatchers[i].mode
              });
            // Push block end pos
            modeInfos.push(
              {
                pos: blockBegin + m[1].length,
                mode: modeInfos[0].mode
              });
            curPos += m.index + m[0].length;
            continue;
          }
          else
          {
            curPos += m.index + Math.max(m[0].length, 1);
          }
        }
        else
        { // No more matches
          break;
        }
      }
    }
    // Sort mode infos
    modeInfos.sort(function sortModeInfo(a, b)
    {
      return a.pos - b.pos;
    });

    return modeInfos;
  }
  // ==========================================

  return {
    // =========== Extended by A.K. =============
    commentStart: "<!--",
    commentEnd: "-->",
    wordWrapChars: [">", ";", "\\{", "\\}"],
    getModeAtPos: function (text, absPos)
    {
      var modeInfos = getModeInfos(text, absPos);
      if (modeInfos.length > 1)
      { // Multi-mode text
        for (var i = 1; i < modeInfos.length; i++)
        {
          if (modeInfos[i].pos > absPos)
          {
            return modeInfos[i - 1].mode;
          }
        }
      }
      else
      { // Single-mode text
        return modeInfos[0].mode;
      }

      return modeInfos[modeInfos.length - 1];
    },
    autoFormatLineBreaks: function (text, startPos, endPos)
    {
      /*function getRelPos(text, index, from)
      {
      var snippet = text.substr(0, index);
      var m = snippet.match(new RegExp("\n", "g"));
      var ln = (m != null ? m.length : 0);
      var c = index - (m != null ? m.lastIndex : 0);
      if (ln == 0)
      {
      c += from.ch;
      }
      return { line: ln + from.line, ch: c };
      }*/


      /*for (var i = 0; i < modeInfos.length; i++)
      {
      alert(modeInfos[i].modeName + " line: " + getRelPos(text, modeInfos[i].pos, { line: 0, ch: 0 }).line + " ch: " + getRelPos(text, modeInfos[i].pos, { line: 0, ch: 0 }).ch);
      }*/

      var modeInfos = getModeInfos(text);
      var res = "";
      // Use modes info to break lines correspondingly
      if (modeInfos.length > 1)
      { // Deal with multi-mode text
        for (var i = 1; i <= modeInfos.length; i++)
        {
          var selStart = modeInfos[i - 1].pos;
          var selEnd = (i < modeInfos.length ? modeInfos[i].pos : endPos);

          if (selStart >= selEnd)
          { // The block starts later than the needed fragment
            break;
          }
          if (selStart < startPos)
          {
            if (selEnd <= startPos)
            { // The block starts earlier than the needed fragment
              continue;
            }
            selStart = startPos;
          }
          if (selEnd > endPos)
          {
            selEnd = endPos;
          }
          res += modeInfos[i - 1].mode.autoFormatLineBreaks(text.substring(selStart, selEnd));
        }
      }
      else
      { // Single-mode text
        res = modeInfos[0].mode.autoFormatLineBreaks(text);
      }

      return res;
    },
    // ==========================================

    startState: function ()
    {
      var state = htmlMode.startState();
      return { token: html, localState: null, htmlState: state };
    },

    copyState: function (state)
    {
      if (state.localState)
        var local = CodeMirror.copyState(state.token == css ? cssMode : jsMode, state.localState);
      return { token: state.token, localState: local, htmlState: CodeMirror.copyState(htmlMode, state.htmlState) };
    },

    token: function (stream, state)
    {
      return state.token(stream, state);
    },

    indent: function (state, textAfter)
    {
      if (state.token == html || /^\s*<\//.test(textAfter))
        return htmlMode.indent(state.htmlState, textAfter);
      else if (state.token == javascript)
        return jsMode.indent(state.localState, textAfter);
      else
        return cssMode.indent(state.localState, textAfter);
    },

    electricChars: "/{}:"
  }
});

CodeMirror.defineMIME("text/html", "htmlmixed");