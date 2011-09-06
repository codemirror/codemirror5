CodeMirror.defineMode("markdown", function(cmCfg, modeCfg) {

  var htmlMode = CodeMirror.getMode(cmCfg, { name: 'xml', htmlMode: true });

  var header   = 'header'
  ,   code     = 'code'
  ,   quote    = 'quote'
  ,   list     = 'list'
  ,   hr       = 'hr'
  ,   linktext = 'linktext'
  ,   linkhref = 'linkhref'
  ,   em       = 'em'
  ,   strong   = 'strong'
  ,   emstrong = 'emstrong';

  var hrRE = /^[*-=_]/
  ,   ulRE = /^[*-+]\s+/
  ,   olRE = /^[0-9]\.\s+/
  ,   headerRE = /^(?:\={3,}|-{3,})$/
  ,   codeRE = /^(k:\t|\s{4,})/
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

  function blockNormal(stream, state) {
    if (stream.match(codeRE)) {
      stream.skipToEnd();
      return code;
    }
    
    if (stream.eatSpace()) {
      return null;
    }
    
    if (stream.peek() === '#' || stream.match(headerRE)) {
      stream.skipToEnd();
      return header;
    }
    if (stream.eat('>')) {
      state.indentation++;
      return quote;
    }
    if (stream.peek() === '<') {
      return switchBlock(stream, state, htmlBlock);
    }
    if (stream.peek() === '[') {
      return switchInline(stream, state, footnoteLink);
    }
    if (hrRE.test(stream.peek())) {
      var re = new RegExp('(?:\s*['+stream.peek()+']){3,}$');
      if (stream.match(re, true)) {
        return hr;
      }
    }
    
    var match;
    if (match = stream.match(ulRE, true) || stream.match(olRE, true)) {
      state.indentation += match[0].length;
      return list;
    }
    
    return switchInline(stream, state, state.inline);
  }

  function htmlBlock(stream, state) {
    var type = htmlMode.token(stream, state.htmlState);
    if (stream.eol() && !state.htmlState.context) {
      state.block = blockNormal;
    }
    return type;
  }


  // Inline

  function inlineNormal(stream, state) {
    function getType() {
      return state.strong ? (state.em ? emstrong : strong)
                          : (state.em ? em       : null);
    }
    
    if (stream.match(textRE, true)) {
      return getType();
    }
    
    var ch = stream.next();
    
    if (ch === '\\') {
      stream.next();
      return getType();
    }
    if (ch === '`') {
      return switchInline(stream, state, inlineElement(code, '`'));
    }
    if (ch === '<') {
      return switchInline(stream, state, inlineElement(linktext, '>'));
    }
    if (ch === '[') {
      return switchInline(stream, state, linkText);
    }
    
    var t = getType();
    if (ch === '*' || ch === '_') {
      if (stream.eat(ch)) {
        return (state.strong = !state.strong) ? getType() : t;
      }
      return (state.em = !state.em) ? getType() : t;
    }
    
    return getType();
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

  function inlineElement(type, endChar, next) {
    next = next || inlineNormal;
    return function(stream, state) {
      while (!stream.eol()) {
        var ch = stream.next();
        if (ch === '\\') stream.next();
        if (ch === endChar) {
          state.inline = state.f = next;
          return type;
        }
      }
      return type;
    };
  }

  return {
    startState: function() {
      return {
        f: blockNormal,
        
        block: blockNormal,
        htmlState: htmlMode.startState(),
        indentation: 0,
        
        inline: inlineNormal,
        em: false,
        strong: false
      };
    },

    copyState: function(s) {
      return {
        f: s.f,
        
        block: s.block,
        htmlState: CodeMirror.copyState(htmlMode, s.htmlState),
        indentation: s.indentation,
        
        inline: s.inline,
        em: s.em,
        strong: s.strong
      };
    },

    token: function(stream, state) {
      if (stream.sol()) {
        state.f = state.block;
        var previousIndentation = state.indentation
        ,   currentIndentation = 0;
        while (previousIndentation > 0) {
          if (stream.eat(' ')) {
            previousIndentation--;
            currentIndentation++;
          } else if (previousIndentation >= 4 && stream.eat('\t')) {
            previousIndentation -= 4;
            currentIndentation += 4;
          } else {
            break;
          }
        }
        state.indentation = currentIndentation;
        
        if (currentIndentation > 0) return null;
      }
      return state.f(stream, state);
    }
  };

});

CodeMirror.defineMIME("text/x-markdown", "markdown");
