// This mode is from the lessphp homepage: https://github.com/leafo/lessphp-site/blob/master/www/codemirror2/mode/less/less.js
// Author: leaf corcoran <leafot@gmail.com>

// todo make interpolations highlight as typed
// treat url() as string

CodeMirror.defineMode('less', function(conf) {

  function regex_escape(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  }

  function words(words) {
    var escaped = [];
    for (var i = 0; i < words.length; i++) {
      escaped.push(regex_escape(words[i]));
    }
    return new RegExp("^(?:" + escaped.join("|") + ")$", "i");
  }

  function set(items) {
    var set = {};
    for (var i = 0; i < items.length; i++) {
      set[items[i]] = true;
    }
    return set;
  }

  var symbols = set(['{', '}', '[', ']', '(', ')']);
  var symbols_2 = set(['!', '&']);

  var units = [
    'em', 'ex', 'px', 'gd', 'rem', 'vw', 'vh', 'vm', 'ch', 'in', 'cm', 'mm',
    'pt', 'pc', '%', 'deg', 'grad', 'rad', 'turn', 'ms', 's', 'Hz', 'kHz',
  ];

  for (var i = 0; i < units.length; i++)
    units[i] = regex_escape(units[i]);
  var unit_regex = new RegExp("^(?:" + units.join('|') + ")");

  var atom = /^[a-z_-][\w_-]*/i;
  var number = /^(?:\+|\-)?\d(\.\d+)?/i;
  var color = /^(?:[a-f0-9]{6}|[a-f0-9]{3})/i;

  var html_tags = words([
    'abbr', 'acronym', 'address', 'applet', 'area', 'a', 'b', 'base',
    'basefont', 'bdo', 'big', 'blockquote', 'body', 'br', 'button', 'caption',
    'center', 'cite', 'code', 'col', 'colgroup', 'dd', 'del', 'dfn', 'dir',
    'div', 'dl', 'dt', 'em', 'fieldset', 'font', 'form', 'frame', 'frameset',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'hr', 'html', 'img', 'i',
    'iframe', 'img', 'input', 'ins', 'isindex', 'kbd', 'label', 'legend', 'li',
    'link', 'map', 'menu', 'meta', 'noframes', 'noscript', 'ol', 'optgroup',
    'option', 'p', 'param', 'pre', 'q', 's', 'samp', 'script', 'select',
    'small', 'span', 'strike', 'strong', 'style', 'sub', 'sup', 'tbody', 'td',
    'textarea', 'tfoot', 'th', 'thead', 'title', 'tr', 'tt', 'ul', 'u', 'var'
  ]);

  var colors = words([
    "aqua", "black", "blue", "fuchsia", "gray", "green", "lime", "maroon",
    "navy", "olive", "purple", "red", "silver", "teal", "yellow", "white",
    "transparent"
  ]);

  var value_words = words( [
    "cursive", "fantasy", "monospace", "italic", "oblique", "bold", "bolder",
    "lighter", "larger", "smaller", "icon", "menu", "caption", "large", "smaller",
    "larger", "narrower", "wider", "auto", "none", "inherit", "top", "bottom",
    "medium", "normal", "sans", "sans-serif", "large", "small", "x-large",
    "x-small", "xx-large", "xx-small", "repeat-x", "repeat-y", "repeat",
    "no-repeat", "underline", "overline", "blink", "sub", "super", "middle",
    "capitalize", "uppercase", "lowercase", "center", "justify", "baseline", "sub",
    "super", "width", "height", "float", "clear", "overflow", "clip", "visibility",
    "thin", "thick", "both", "dotted", "dashed", "solid", "double", "groove",
    "ridge", "inset", "outset", "hidden", "visible", "scroll", "collapse", "fixed",
    "default", "crosshair", "pointer", "move", "wait", "help", "thin", "thick",
    "dotted", "dashed", "solid", "double", "groove", "ridge", "inset", "outset",
    "invert", "inline"
  ]);

  function normal(stream) {
    var ch = stream.next();

    if (ch == "." && stream.match(atom)) {
      return "atom";
    } else if (ch == "#" && stream.match(atom)) {
      return "tag";
    } else if (ch == "@" && stream.match(atom)) {

      if (stream.match(/^\s*:/)) {
        stream.backUp(1);
        this.push_scanner(value);
      }

      return "variable-3"
    } else if (symbols[ch]) {
      if (ch == "{") this.brace_depth++;

      if (ch == "}") {
        this.brace_depth--;
        if (this.brace_depth < 0) return "error";
      }

      return "bracket";
    } else if (ch.match(/[a-z]/i)) {
      stream.backUp(1);
      stream.match(atom);
      var word = stream.current();
      if (stream.match(/^\s*:/)) {
        stream.backUp(1);

        this.push_scanner(value);
        return "attribute";
      }
      
      if (word.match(html_tags)) {
        return "tag";
      }
    }

    return this.common_value(ch, stream);
  }

  function common_value(ch, stream) {
    if (ch == "+" || ch == "-" || ch.match(/\d/)) {
      stream.backUp(1);
      if (stream.match(number)) {
        stream.match(unit_regex);
        return "number";
      } else {
        stream.next(); // move forward again
      }
    }

    if (ch == "/") {
      if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }

      if (stream.eat("*")) {
        this.push_scanner(comment);
        return this.scanner(stream);
      }
    }

    if (symbols[ch]) return "bracket";
    if (symbols_2[ch]) return "builtin";
    
    if (ch == "'" || ch == '"') {
      this.push_scanner(string_matcher(ch, true));
      return "string";
    }
  }

  function value(stream) {
    var ch = stream.next();
    
    if (ch == ";" || ch == "}" || ch == "{") {
      stream.backUp(1);
      this.pop_scanner();
      return;
    }

    if (ch == "#" && stream.match(color)) {
      return "number";
    }

    if (ch == "@" && stream.match(atom)) {
      return "variable-3";
    }

    if (ch.match(/[a-z]/i)) {
      stream.backUp(1);
      stream.match(atom);
      var word = stream.current();
      if (word == "url" && stream.eat("(")) {
        this.push_scanner(string_matcher(")", false, "tag"));
        return "tag";
      }

      if (word.match(value_words)) {
        return "meta";
      }

      if (word.match(colors)) {
        return "variable-2";
      }
    }

    return this.common_value(ch, stream);
  }

  function comment(stream) {
    while (stream.skipTo("*")) {
      if (stream.eat("*") && stream.eat("/")) {
        this.pop_scanner();
        return "comment";
      }
    }
    stream.skipToEnd();
    return "comment";
  }

  var interp_patt = /^{[a-z_-][\w_-]*}/i;

  function string_matcher(end_delim, can_escape, delim_type) {
    return function string(stream) {
      var ch = stream.next();

      if (can_escape && ch == "\\" && (stream.eat(end_delim) || stream.eat("\\"))) {
        return "string";
      }

      if (ch == "@" && stream.match(interp_patt)) {
        return "variable-3";
      }

      if (ch == end_delim) {
        this.pop_scanner();
        return delim_type || "string";
      }

      return "string";
    }
  }

  return {
    startState: function() {
      return {
        scanner: normal,
        common_value: common_value,
        brace_depth: 0,

        push_scanner: function(scanner) {
          this._scanners = this._scanners || [];
          this._scanners.push(this.scanner);
          this.scanner = scanner;
        },

        pop_scanner: function() {
          this.scanner = this._scanners.pop();
        }
      }
    },
    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      return state.scanner(stream);
    }
  }
});

CodeMirror.defineMIME("text/less", "less");
