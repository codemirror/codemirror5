CodeMirror.defineMode("markdown", function(cmCfg, modeCfg) {

  var htmlFound = CodeMirror.mimeModes.hasOwnProperty("text/html");
  var htmlMode = CodeMirror.getMode(cmCfg, htmlFound ? "text/html" : "text/plain");

  var header   = 'header'
  ,   code     = 'comment'
  ,   quote    = 'quote'
  ,   list     = 'string'
  ,   hr       = 'hr'
  ,   linktext = 'link'
  ,   linkhref = 'string'
  ,   em       = 'em'
  ,   strong   = 'strong'
  ,   emstrong = 'emstrong';

  var hrRE = /^([*\-=_])(?:\s*\1){2,}\s*$/
  ,   ulRE = /^[*\-+]\s+/
  ,   olRE = /^[0-9]+\.\s+/
  ,   headerRE = /^(?:\={3,}|-{3,})$/
  ,   textRE = /^[^\[*_\\<>`]+/;

  function switchInline(stream, state, f) {
    state.f = state.inline = f;
    return f(stream, state);
  }

  function switchBlock(stream, state, f) {
    state.f = state.block = f;
    return f(stream, state);
  }


  // Blocks

  function blankLine(state) {
    // Reset EM state
    state.em = false;
    // Reset STRONG state
    state.strong = false;
    // Reset state.quote
    state.quote = false;
    if (!htmlFound && state.f == htmlBlock) {
      state.f = inlineNormal;
      state.block = blockNormal;
    }
    return null;
  }

  function blockNormal(stream, state) {
    var match;
    if (state.indentationDiff >= 4) {
      state.indentation -= state.indentationDiff;
      stream.skipToEnd();
      return code;
    } else if (stream.eatSpace()) {
      return null;
    } else if (stream.peek() === '#' || stream.match(headerRE)) {
      state.header = true;
    } else if (stream.eat('>')) {
      state.indentation++;
      state.quote = true;
    } else if (stream.peek() === '[') {
      return switchInline(stream, state, footnoteLink);
    } else if (stream.match(hrRE, true)) {
      return hr;
    } else if (match = stream.match(ulRE, true) || stream.match(olRE, true)) {
      state.indentation += match[0].length;
      return list;
    }
    
    return switchInline(stream, state, state.inline);
  }

  function htmlBlock(stream, state) {
    var style = htmlMode.token(stream, state.htmlState);
    if (htmlFound && style === 'tag' && state.htmlState.type !== 'openTag' && !state.htmlState.context) {
      state.f = inlineNormal;
      state.block = blockNormal;
    }
    if (state.md_inside && stream.current().indexOf(">")!=-1) {
      state.f = inlineNormal;
      state.block = blockNormal;
      state.htmlState.context = undefined;
    }
    return style;
  }


  // Inline
  function getType(state) {
    var styles = [];
    
    if (state.strong) { styles.push(state.em ? emstrong : strong); }
    else if (state.em) { styles.push(em); }
    
    if (state.header) { styles.push(header); }
    if (state.quote) { styles.push(quote); }

    return styles.length ? styles.join(' ') : null;
  }

  function handleText(stream, state) {
    if (stream.match(textRE, true)) {
      return getType(state);
    }
    return undefined;        
  }

  function inlineNormal(stream, state) {
    var style = state.text(stream, state);
    if (typeof style !== 'undefined')
      return style;
    
    var ch = stream.next();
    
    if (ch === '\\') {
      stream.next();
      return getType(state);
    }
    if (ch === '`') {
      return switchInline(stream, state, inlineElement(code, '`'));
    }
    if (ch === '[') {
      return switchInline(stream, state, linkText);
    }
    if (ch === '<' && stream.match(/^\w/, false)) {
      var md_inside = false;
      if (stream.string.indexOf(">")!=-1) {
        var atts = stream.string.substring(1,stream.string.indexOf(">"));
        if (/markdown\s*=\s*('|"){0,1}1('|"){0,1}/.test(atts)) {
          state.md_inside = true;
        }
      }
      stream.backUp(1);
      return switchBlock(stream, state, htmlBlock);
    }
      
    if (ch === '<' && stream.match(/^\/\w*?>/)) {
      state.md_inside = false;
      return "tag";
    }
      
    var t = getType(state);
    if (ch === '*' || ch === '_') {
      if (stream.eat(ch)) {
        return (state.strong = !state.strong) ? getType(state) : t;
      }
      return (state.em = !state.em) ? getType(state) : t;
    }
    
    return getType(state);
  }

  function linkText(stream, state) {
    while (!stream.eol()) {
      var ch = stream.next();
      if (ch === '\\') stream.next();
      if (ch === ']') {
        state.inline = state.f = linkHref;
        return linktext;
      }
    }
    return linktext;
  }

  function linkHref(stream, state) {
    stream.eatSpace();
    var ch = stream.next();
    if (ch === '(' || ch === '[') {
      return switchInline(stream, state, inlineElement(linkhref, ch === '(' ? ')' : ']'));
    }
    return 'error';
  }

  function footnoteLink(stream, state) {
    if (stream.match(/^[^\]]*\]:/, true)) {
      state.f = footnoteUrl;
      return linktext;
    }
    return switchInline(stream, state, inlineNormal);
  }

  function footnoteUrl(stream, state) {
    stream.eatSpace();
    stream.match(/^[^\s]+/, true);
    state.f = state.inline = inlineNormal;
    return linkhref;
  }

  function inlineRE(endChar) {
    if (!inlineRE[endChar]) {
      // match any not-escaped-non-endChar and any escaped char
      // then match endChar or eol
      inlineRE[endChar] = new RegExp('^(?:[^\\\\\\' + endChar + ']|\\\\.)*(?:\\' + endChar + '|$)');
    }
    return inlineRE[endChar];
  }

  function inlineElement(type, endChar, next) {
    next = next || inlineNormal;
    return function(stream, state) {
      stream.match(inlineRE(endChar));
      state.inline = state.f = next;
      return type;
    };
  }

  return {
    startState: function() {
      return {
        f: blockNormal,
        
        block: blockNormal,
        htmlState: CodeMirror.startState(htmlMode),
        indentation: 0,
        
        inline: inlineNormal,
        text: handleText,
        em: false,
        strong: false,
        header: false,
        quote: false
      };
    },

    copyState: function(s) {
      return {
        f: s.f,
        
        block: s.block,
        htmlState: CodeMirror.copyState(htmlMode, s.htmlState),
        indentation: s.indentation,
          
        inline: s.inline,
        text: s.text,
        em: s.em,
        strong: s.strong,
        header: s.header,
        quote: s.quote,
        md_inside: s.md_inside
      };
    },

    token: function(stream, state) {
      if (stream.sol()) {
        if (stream.match(/^\s*$/, true)) { return blankLine(state); }

        // Reset state.header
        state.header = false;

        state.f = state.block;
        var indentation = stream.match(/^\s*/, true)[0].replace(/\t/g, '    ').length;
        state.indentationDiff = indentation - state.indentation;
        state.indentation = indentation;
        if (indentation > 0) { return null; }
      }
      return state.f(stream, state);
    },

    blankLine: blankLine,

    getType: getType
  };

}, "xml");

CodeMirror.defineMIME("text/x-markdown", "markdown");
