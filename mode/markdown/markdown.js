CodeMirror.defineMode("markdown", function(cmCfg, modeCfg) {

  var htmlFound = CodeMirror.mimeModes.hasOwnProperty("text/html");
  var htmlMode = CodeMirror.getMode(cmCfg, htmlFound ? "text/html" : "text/plain");
  
  var codeDepth = 0;
  var prevLineHasContent = false
  ,   thisLineHasContent = false;

  var header   = 'header'
  ,   code     = 'comment'
  ,   quote    = 'quote'
  ,   list     = 'string'
  ,   hr       = 'hr'
  ,   linkinline = 'link'
  ,   linkemail = 'link'
  ,   linktext = 'link'
  ,   linkhref = 'string'
  ,   em       = 'em'
  ,   strong   = 'strong'
  ,   emstrong = 'emstrong';

  var hrRE = /^([*\-=_])(?:\s*\1){2,}\s*$/
  ,   ulRE = /^[*\-+]\s+/
  ,   olRE = /^[0-9]+\.\s+/
  ,   headerRE = /^(?:\={1,}|-{1,})$/
  ,   textRE = /^[^\[*_\\<>` "'(]+/;

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
    // Reset linkTitle state
    state.linkTitle = false;
    // Reset CODE state
    state.code = false;
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
    
    if (state.list !== false && state.indentationDiff >= 0) { // Continued list
      if (state.indentationDiff < 4) { // Only adjust indentation if *not* a code block
        state.indentation -= state.indentationDiff;
      }
      state.list = null;
    } else { // No longer a list
      state.list = false;
    }
    
    if (state.indentationDiff >= 4) {
      state.indentation -= 4;
      stream.skipToEnd();
      return code;
    } else if (stream.eatSpace()) {
      return null;
    } else if (stream.peek() === '#' || (prevLineHasContent && stream.match(headerRE)) ) {
      state.header = true;
    } else if (stream.eat('>')) {
      state.indentation++;
      state.quote = true;
    } else if (stream.peek() === '[') {
      return switchInline(stream, state, footnoteLink);
    } else if (stream.match(hrRE, true)) {
      return hr;
    } else if (match = stream.match(ulRE, true) || stream.match(olRE, true)) {
      state.indentation += 4;
      state.list = true;
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
    
    if (state.code) { styles.push(code); }
    
    if (state.header) { styles.push(header); }
    if (state.quote) { styles.push(quote); }
    if (state.list !== false) { styles.push(list); }

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
    
    if (state.list) { // List marker (*, +, -, 1., etc)
      state.list = null;
      return list;
    }
    
    var ch = stream.next();
    
    if (ch === '\\') {
      stream.next();
      return getType(state);
    }
    
    // Matches link titles present on next line
    if (state.linkTitle) {
      state.linkTitle = false;
      var matchCh = ch;
      if (ch === '(') {
        matchCh = ')';
      }
      matchCh = (matchCh+'').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
      var regex = '^\\s*(?:[^' + matchCh + '\\\\]+|\\\\\\\\|\\\\.)' + matchCh;
      if (stream.match(new RegExp(regex), true)) {
        return linkhref;
      }
    }
    
    if (ch === '`') {
      var t = getType(state);
      var before = stream.pos;
      stream.eatWhile('`');
      var difference = 1 + stream.pos - before;
      if (!state.code) {
        codeDepth = difference;
        state.code = true;
        return getType(state);
      } else {
        if (difference === codeDepth) { // Must be exact
          state.code = false;
          return t;
        }
        return getType(state);
      }
    } else if (state.code) {
      return getType(state);
    }
    
    if (ch === '[' && stream.match(/.*\] ?(?:\(|\[)/, false)) {
      return switchInline(stream, state, linkText);
    }
    
    if (ch === '<' && stream.match(/^(https?|ftps?):\/\/(?:[^\\>]|\\.)+>/, true)) {
      return switchInline(stream, state, inlineElement(linkinline, '>'));
    }
    
    if (ch === '<' && stream.match(/^[^> \\]+@(?:[^\\>]|\\.)+>/, true)) {
      return switchInline(stream, state, inlineElement(linkemail, '>'));
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
      if (state.strong === ch && stream.eat(ch)) { // Remove STRONG
        state.strong = false;
        return t;
      } else if (!state.strong && stream.eat(ch)) { // Add STRONG
        state.strong = ch;
        return getType(state);
      } else if (state.em === ch) { // Remove EM
        state.em = false;
        return t;
      } else if (!state.em) { // Add EM
        state.em = ch;
        return getType(state);
      }
    } else if (ch === ' ') {
      if (stream.eat('*') || stream.eat('_')) { // Probably surrounded by spaces
        if (stream.peek() === ' ') { // Surrounded by spaces, ignore
          return getType(state);
        } else { // Not surrounded by spaces, back up pointer
          stream.backUp(1);
        }
      }
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
    // Check if space, and return NULL if so (to avoid marking the space)
    if(stream.eatSpace()){
      return null;
    }
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
    // Check if space, and return NULL if so (to avoid marking the space)
    if(stream.eatSpace()){
      return null;
    }
    // Match URL
    stream.match(/^[^\s]+/, true);
    // Check for link title
    if (stream.peek() === undefined) { // End of line, set flag to check next line
      state.linkTitle = true;
    } else { // More content on line, check if link title
      stream.match(/^(?:\s+(?:"(?:[^"\\]|\\\\|\\.)+"|'(?:[^'\\]|\\\\|\\.)+'|\((?:[^)\\]|\\\\|\\.)+\)))?/, true);
    }
    state.f = state.inline = inlineNormal;
    return linkhref;
  }

  function inlineRE(endChar) {
    if (!inlineRE[endChar]) {
      // Escape endChar for RegExp (taken from http://stackoverflow.com/a/494122/526741)
      endChar = (endChar+'').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
      // Match any non-endChar, escaped character, as well as the closing 
      // endChar.
      inlineRE[endChar] = new RegExp('^(?:[^\\\\]+?|\\\\.)*?(' + endChar + ')');
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
        linkTitle: false,
        em: false,
        strong: false,
        header: false,
        list: false,
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
        linkTitle: s.linkTitle,
        em: s.em,
        strong: s.strong,
        header: s.header,
        list: s.list,
        quote: s.quote,
        md_inside: s.md_inside
      };
    },

    token: function(stream, state) {
      if (stream.sol()) {
        if (stream.match(/^\s*$/, true)) {
          prevLineHasContent = false;
          return blankLine(state);
        } else {
          if(thisLineHasContent){
            prevLineHasContent = true;
            thisLineHasContent = false;
          }
          thisLineHasContent = true;
        }

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
