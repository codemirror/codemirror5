// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../htmlmixed/htmlmixed"),
        require("../../addon/mode/overlay"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../htmlmixed/htmlmixed",
            "../../addon/mode/overlay"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("django:inner", function() {
    var keywords = ["block", "endblock", "for", "endfor", "in", "true", "false",
                    "loop", "none", "self", "super", "if", "endif", "as", "not", "and",
                    "else", "import", "with", "endwith", "without", "context", "ifequal", "endifequal",
                    "ifnotequal", "endifnotequal", "extends", "include", "load", "comment",
                    "endcomment", "empty", "url", "static", "trans", "blocktrans", "now", "regroup",
                    "lorem", "ifchanged", "endifchanged", "firstof", "debug", "cycle", "csrf_token",
                    "autoescape", "endautoescape", "spaceless", "ssi", "templatetag",
                    "verbatim", "endverbatim", "widthratio"],
        filters = ["add", "addslashes", "capfirst", "center", "cut", "date",
                   "default", "default_if_none", "dictsort",
                   "dictsortreversed", "divisibleby", "escape", "escapejs",
                   "filesizeformat", "first", "floatformat", "force_escape",
                   "get_digit", "iriencode", "join", "last", "length",
                   "length_is", "linebreaks", "linebreaksbr", "linenumbers",
                   "ljust", "lower", "make_list", "phone2numeric", "pluralize",
                   "pprint", "random", "removetags", "rjust", "safe",
                   "safeseq", "slice", "slugify", "stringformat", "striptags",
                   "time", "timesince", "timeuntil", "title", "truncatechars",
                   "truncatechars_html", "truncatewords", "truncatewords_html",
                   "unordered_list", "upper", "urlencode", "urlize",
                   "urlizetrunc", "wordcount", "wordwrap", "yesno"];

    keywords = new RegExp("^\\b(" + keywords.join("|") + ")\\b");
    filters = new RegExp("^\\b(" + filters.join("|") + ")\\b");

    function tokenBase (stream, state) {
      if (stream.match("{{")) {
        state.tokenize = inVariable;
        return "tag";
      } else if (stream.match("{%")) {
        state.tokenize = inTag("{%");
        return "tag";
      }

      // Ignore completely any stream series that do not match the
      // Django template opening tags.
      while (stream.next() != null && !stream.match("{{", false) && !stream.match("{%", false)) {}
      return null;
    }

    // Apply Django template variable syntax highlighting
    function inVariable (stream, state) {
      // Attempt to match a dot that precedes a property
      if (state.waitDot) {
        state.waitDot = false;

        if (stream.peek() != ".") {
          return null;
        }

        // Dot folowed by a non-word character should be considered an error.
        if (stream.match(/\.\W+/)) {
          return "error";
        } else if (stream.eat(".")) {
          state.waitProperty = true;
          return null;
        } else {
          throw Error ("Unexpected error while waiting for property.");
        }
      }

      // Attempt to match a pipe that precedes a filter
      if (state.waitPipe) {
        state.waitPipe = false;

        if (stream.peek() != "|") {
          return null;
        }

        // Pipe folowed by a non-word character should be considered an error.
        if (stream.match(/\.\W+/)) {
          return "error";
        } else if (stream.eat("|")) {
          state.waitFilter = true;
          return null;
        } else {
          throw Error ("Unexpected error while waiting for filter.");
        }
      }

      // Highlight properties
      if (state.waitProperty) {
        state.waitProperty = false;
        if (stream.match(/\b(\w+)\b/)) {
          state.waitDot = true;  // A property can be followed by another property
          state.waitPipe = true;  // A property can be followed by a filter
          return "property";
        }
      }

      // Highlight filters
      if (state.waitFilter) {
          state.waitFilter = false;
        if (stream.match(filters)) {
          return "variable-2";
        }
      }

      // Ignore all white spaces
      if (stream.eatSpace()) {
        state.waitProperty = false;
        return null;
      }

      // Attempt to find the variable
      if (stream.match(/\b(\w+)\b/) && !state.foundVariable) {
        state.waitDot = true;
        state.waitPipe = true;  // A property can be followed by a filter
        return "variable";
      }

      // If found closing tag reset
      if (stream.match("}}")) {
        state.waitProperty = null;
        state.waitFilter = null;
        state.waitDot = null;
        state.waitPipe = null;
        state.tokenize = tokenBase;
        return "tag";
      }

      // If nothing was found, advance to the next character
      stream.next();
      return null;
    }

    function inTag (startTag) {
      var closeChar = null;

      if (startTag == "{{") {
        closeChar = "}";
      } else if (startTag == "{%") {
        closeChar = "%";
      } else {
        throw Error("Invalid Django template start tag:", startTag);
      }

      return function (stream, state) {
        var ch;

        // Identify tag closing
        if (stream.peek() == closeChar) {
          state.tokenize = tokenBase;
          ch = stream.next(); // Advance character in stream
          ch = stream.next();
          if (ch == '}') {
            return "tag";
          } else if (ch) {
            return "error";
          }
        }

        // Identify keyword
        if (stream.match(keywords)) {
          return "keyword";
        }

        // Identify filter
        if (stream.match(filters)) {
          return "variable-2";
        }
        var ch = stream.next();
        if(state.instring) {
          if(ch == state.instring) {
            state.instring = false;
          }
          stream.next();
          return "string";
        } else if(ch == "'" || ch == '"') {
          state.instring = ch;
          stream.next();
          return "string";
        }

        // If there is nothing to consume, eat all whitespaces
        stream.eatSpace();
        return null;
      };
    }
    return {
      startState: function () {
        return {tokenize: tokenBase};
      },
      token: function (stream, state) {
        return state.tokenize(stream, state);
      }
    };
  });

  CodeMirror.defineMode("django", function(config) {
    var htmlBase = CodeMirror.getMode(config, "text/html");
    var djangoInner = CodeMirror.getMode(config, "django:inner");
    return CodeMirror.overlayMode(htmlBase, djangoInner);
  });

  CodeMirror.defineMIME("text/x-django", "django");
});
