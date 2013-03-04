CodeMirror.defineMode("scss", function(config) {
  // special modes that we need to take care of
  var indentUnit = config.indentUnit;
  var wordRegex = /^[\w-]+/;
  var hexNumberRegex = /[0-9a-fA-F]{6}|[0-9a-fA-F]{3}/;
  var numberRegex = /^-?[0-9\.]+/;
  var unitRegex = /^(px|em|in|%)/;
  var wholeWord = function(stream) {
    return stream.match(wordRegex, false);
  };
  var skipWord = function(stream) {
    return stream.match(wordRegex);
  };

  // convert an array to a map
  //
  //    arrayToMap([ 'background', 'width'])
  //    # => { 'background': true, 'width': true }
  function arrayToMap(arr) {
    var map = {}, length = arr.length;
    for (var i = 0; i < length; i++) {
      map[arr[i]] = true;
    }
    return map;
  }

  var properties = arrayToMap( (function () {
    var ret = [];
    var browserPrefix = ("-webkit-|-moz-|-o-|-ms-|-svg-|-pie-|-khtml-").split("|");
    var prefixProperties = ("appearance|background-clip|background-inline-policy|background-origin|" +
      "background-size|binding|border-bottom-colors|border-left-colors|" +
      "border-right-colors|border-top-colors|border-end|border-end-color|" +
      "border-end-style|border-end-width|border-image|border-start|" +
      "border-start-color|border-start-style|border-start-width|box-align|" +
      "box-direction|box-flex|box-flexgroup|box-ordinal-group|box-orient|" +
      "box-pack|box-sizing|column-count|column-gap|column-width|column-rule|" +
      "column-rule-width|column-rule-style|column-rule-color|float-edge|" +
      "font-feature-settings|font-language-override|force-broken-image-icon|" +
      "image-region|margin-end|margin-start|opacity|outline|outline-color|" +
      "outline-offset|outline-radius|outline-radius-bottomleft|" +
      "outline-radius-bottomright|outline-radius-topleft|outline-radius-topright|" +
      "outline-style|outline-width|padding-end|padding-start|stack-sizing|" +
      "tab-size|text-blink|text-decoration-color|text-decoration-line|" +
      "text-decoration-style|transform|transform-origin|transition|" +
      "transition-delay|transition-duration|transition-property|" +
      "transition-timing-function|user-focus|user-input|user-modify|user-select|" +
      "window-shadow|border-radius").split("|");
    var properties = ("azimuth|background-attachment|background-color|background-image|" +
      "background-position|background-repeat|background|border-bottom-color|" +
      "border-bottom-style|border-bottom-width|border-bottom|border-collapse|" +
      "border-color|border-left-color|border-left-style|border-left-width|" +
      "border-left|border-right-color|border-right-style|border-right-width|" +
      "border-right|border-spacing|border-style|border-top-color|" +
      "border-top-style|border-top-width|border-top|border-width|border|" +
      "bottom|box-sizing|caption-side|clear|clip|color|content|counter-increment|" +
      "counter-reset|cue-after|cue-before|cue|cursor|direction|display|" +
      "elevation|empty-cells|float|font-family|font-size-adjust|font-size|" +
      "font-stretch|font-style|font-variant|font-weight|font|height|left|" +
      "letter-spacing|line-height|list-style-image|list-style-position|" +
      "list-style-type|list-style|margin-bottom|margin-left|margin-right|" +
      "margin-top|marker-offset|margin|marks|max-height|max-width|min-height|" +
      "min-width|opacity|orphans|outline-color|" +
      "outline-style|outline-width|outline|overflow|overflow-x|overflow-y|padding-bottom|" +
      "padding-left|padding-right|padding-top|padding|page-break-after|" +
      "page-break-before|page-break-inside|page|pause-after|pause-before|" +
      "pause|pitch-range|pitch|play-during|position|quotes|richness|right|" +
      "size|speak-header|speak-numeral|speak-punctuation|speech-rate|speak|" +
      "stress|table-layout|text-align|text-decoration|text-indent|" +
      "text-shadow|text-transform|top|unicode-bidi|vertical-align|" +
      "visibility|voice-family|volume|white-space|widows|width|word-spacing|" +
      "z-index|family|weight").split("|");

    //All prefixProperties will get the browserPrefix in
    //the begning by join the prefixProperties array with the value of browserPrefix
    for (var i=0, ln=browserPrefix.length; i<ln; i++) {
      ret = ret.concat((browserPrefix[i] + prefixProperties.join("|" + browserPrefix[i]) ).split("|"));
    }

    //Add also prefixProperties and properties without any browser prefix
    ret = ret.concat(prefixProperties);
    ret = ret.concat(properties);
    return ret;
  })());

  var functions = arrayToMap(
    ("hsl|hsla|rgb|rgba|url|attr|counter|counters|abs|adjust_color|adjust_hue|" +
     "alpha|join|blue|ceil|change_color|comparable|complement|darken|desaturate|" +
     "floor|grayscale|green|hue|if|invert|join|length|lighten|lightness|mix|" +
     "nth|opacify|opacity|percentage|quote|red|round|saturate|saturation|" +
     "scale_color|transparentize|type_of|unit|unitless|unqoute").split("|")
  );

  var constants = arrayToMap(
    ("absolute|all-scroll|always|armenian|auto|baseline|below|bidi-override|" +
     "block|bold|bolder|border-box|both|bottom|break-all|break-word|capitalize|center|" +
     "char|circle|cjk-ideographic|col-resize|collapse|content-box|crosshair|dashed|" +
     "decimal-leading-zero|decimal|default|disabled|disc|" +
     "distribute-all-lines|distribute-letter|distribute-space|" +
     "distribute|dotted|double|e-resize|ellipsis|fixed|georgian|groove|" +
     "hand|hebrew|help|hidden|hiragana-iroha|hiragana|horizontal|" +
     "ideograph-alpha|ideograph-numeric|ideograph-parenthesis|" +
     "ideograph-space|inactive|inherit|inline-block|inline|inset|inside|" +
     "inter-ideograph|inter-word|italic|justify|katakana-iroha|katakana|" +
     "keep-all|left|lighter|line-edge|line-through|line|list-item|loose|" +
     "lower-alpha|lower-greek|lower-latin|lower-roman|lowercase|lr-tb|ltr|" +
     "medium|middle|move|n-resize|ne-resize|newspaper|no-drop|no-repeat|" +
     "nw-resize|none|normal|not-allowed|nowrap|oblique|outset|outside|" +
     "overline|pointer|progress|relative|repeat-x|repeat-y|repeat|right|" +
     "ridge|row-resize|rtl|s-resize|scroll|se-resize|separate|small-caps|" +
     "solid|square|static|strict|super|sw-resize|table-footer-group|" +
     "table-header-group|tb-rl|text-bottom|text-top|text|thick|thin|top|" +
     "transparent|underline|upper-alpha|upper-latin|upper-roman|uppercase|" +
     "vertical-ideographic|vertical-text|visible|w-resize|wait|whitespace|" +
     "zero|if|and|module|def|end|declare|true|false|null|auto").split("|")
    );

  var colors = arrayToMap(
    ("aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|" +
     "purple|red|silver|teal|white|yellow|whitesmoke").split("|")
  );

  var tags = arrayToMap(
    ("a|abbr|acronym|address|applet|area|article|aside|audio|b|base|basefont|bdo|" +
     "big|blockquote|body|br|button|canvas|caption|center|cite|code|col|colgroup|" +
     "command|datalist|dd|del|details|dfn|dir|div|dl|dt|em|embed|fieldset|" +
     "figcaption|figure|font|footer|form|frame|frameset|h1|h2|h3|h4|h5|h6|head|" +
     "header|hgroup|hr|html|i|iframe|img|input|ins|keygen|kbd|label|legend|li|" +
     "link|map|mark|menu|meta|meter|nav|noframes|noscript|object|ol|optgroup|" +
     "option|output|p|param|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|" +
     "small|source|span|strike|strong|style|sub|summary|sup|table|tbody|td|" +
     "textarea|tfoot|th|thead|time|title|tr|tt|u|ul|var|video|wbr|xmp").split("|")
  );

  // convert token to style definitions
  var styleDefinitions = {
    "error"         : "error",
    "comment"       : "comment",
    "selector"      : "builtin",
    "color"         : "atom",
    "builtinColor"  : "atom",
    "directive"     : "meta",
    "variable"      : "variable-2",
    "keyword"       : "keyword",
    "important"     : "keyword",
    "def"           : "def",
    "tag"           : "tag",
    "unstyled"      : null,
    "open-bracket"  : null,
    "close-bracket" : null,
    "property"      : "property",
    "number"        : "number",
    "hex"           : "atom",
    "unit"          : "number",
    "string"        : "string",
    "constant"      : "atom",
    "operator"      : "operator",
    "definition"    : "atom"
  };

  // if we are processing multiline comments, just return `comment` until we
  // found the end of the comment block. At that point, pop back the tokenizer
  // stack to return the the previous tokenzier
  function tokenMultilineComment(stream, state) {
    if (stream.skipTo('*/')) {
      stream.next();
      stream.next();
      state.tokenizer = tokenBase;
    } else {
      stream.next();
    }
    return "comment";
  }

  function tokenString(quote, nonInclusive) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped)
          break;
        escaped = !escaped && ch == "\\";
      }
      if (!escaped) {
        if (nonInclusive) stream.backUp(1);
        state.tokenizer = tokenBase;
      }
      return "string";
    };
  }

  function tokenUrl(stream, state) {
    var ch = stream.peek();

    if (ch === ")") {
      stream.next();
      state.tokenizer = tokenBase;
      return "unstyled";
    } else if (ch === "(") {
      stream.next();
      stream.eatSpace();
      state.tokenizer = tokenString(")", true);
      return "unstyled";
    } else if (ch === "'" || ch === '"') {
      stream.next();
      state.tokenizer = tokenString(ch);
      return "string";
    }
  };

  // tokenize a line of SCSS rules
  // this returns approriate token and advances the stream to the next token
  // see the map of token to style at `styleDefinitions`
  function tokenBase(stream, state) {
    var ch = stream.peek();

    if (stream.match('//')) {
      // single line comment
      stream.skipToEnd();
      return 'comment';
    } else if (stream.match('/*')) {
      // multiline comment
      state.tokenizer = tokenMultilineComment;
      return state.tokenizer(stream, state);
    } else if (ch == '{') {
      stream.next();
      return "open-bracket";
    } else if (ch == '}') {
      stream.next();
      return "close-bracket";
    } else if (ch === '"' || ch === "'"){
      stream.next();
      state.tokenizer = tokenString(ch);
      return "string";
    } else if (ch == ".") {
      // class selector
      stream.next();
      if (stream.match(wordRegex)) {
        return "selector";
      }
    } else if (ch == '#') {
      stream.next();
      if (stream.match(hexNumberRegex)) {
        return "hex";
      } else if (skipWord(stream)) {
        return "selector";
      }
    } else if (stream.match(numberRegex)) {
      return "number";
    } else if (stream.match(unitRegex)) {
      return "unit";
    } else if (ch == "!") {
      stream.next();
      if (skipWord(stream)) {
        return "keyword";
      }
      return "operator";
    } else if (ch == "=" || ch == "+") {
      return "operator";
    } else if (ch == "$") {
      stream.next();
      skipWord(stream);
      return "variable";
    } else if (stream.match(/^url/) && stream.peek() === "(") {
      state.tokenizer = tokenUrl;
      return "property";
    } else if (ch == "@") {
      stream.next();
      skipWord(stream);
      return "directive";
    }

    if (wholeWord(stream)) {
      var word = wholeWord(stream);
      skipWord(stream);
      if (constants[word] != undefined) {
        return "constant";
      } else if (properties[word] != undefined) {
        return "property";
      } else if (tags[word] != undefined) {
        return "tag";
      } else if (functions[word] != undefined) {
        return "definition";
      } else if (colors[word] != undefined) {
        return "builtinColor";
      }
      return "definition";
    }

    // If we haven't returned by now, we move 1 character
    stream.next();
    return "unstyled";
  };

  return {
    startState: function() {
      return {
        tokenizer: tokenBase,
        baseIndent: 0
      };
    },

    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      var token = state.tokenizer(stream, state);
      if (token == "open-bracket") {
        state.baseIndent += indentUnit;
      } else if (token == "close-bracket") {
        state.baseIndent -= indentUnit;
      }
      return styleDefinitions[token] || null;
    },

    indent: function(state, textAfter) {
      var firstChar = textAfter && textAfter.charAt(0);
      if (firstChar == "}") {
        state.baseIndent -= indentUnit;
      }
      return state.baseIndent;
    },

    electricChars: "}"
  };
});

CodeMirror.defineMIME("text/x-scss", "scss");
