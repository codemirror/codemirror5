CodeMirror.defineMode("gfm", function(config, parserConfig) {
  var mdMode = CodeMirror.getMode(config, "markdown");
  var aliases = {
    html: "htmlmixed",
    js: "javascript",
    json: "application/json",
    c: "text/x-csrc",
    "c++": "text/x-c++src",
    java: "text/x-java",
    csharp: "text/x-csharp",
    "c#": "text/x-csharp"
  };

  // make this lazy so that we don't need to load GFM last
  var getMode = (function () {
    var i, modes = {}, mimes = {}, mime;

    var list = CodeMirror.listModes();
    for (i = 0; i < list.length; i++) {
      modes[list[i]] = list[i];
    }
    var mimesList = CodeMirror.listMIMEs();
    for (i = 0; i < mimesList.length; i++) {
      mime = mimesList[i].mime;
      mimes[mime] = mimesList[i].mime;
    }

    for (var a in aliases) {
      if (aliases[a] in modes || aliases[a] in mimes)
        modes[a] = aliases[a];
    }
    
    return function (lang) {
      return modes[lang] ? CodeMirror.getMode(config, modes[lang]) : null;
    };
  }());

  function markdown(stream, state) {
    // intercept fenced code blocks
    if (stream.sol() && stream.match(/^```([\w+#]*)/)) {
      // try switching mode
      state.localMode = getMode(RegExp.$1);
      if (state.localMode)
        state.localState = state.localMode.startState();

      state.token = local;
      return 'code';
    }

    return mdMode.token(stream, state.mdState);
  }

  function local(stream, state) {
    if (stream.sol() && stream.match(/^```/)) {
      state.localMode = state.localState = null;
      state.token = markdown;
      return 'code';
    }
    else if (state.localMode) {
      return state.localMode.token(stream, state.localState);
    } else {
      stream.skipToEnd();
      return 'code';
    }
  }

  // custom handleText to prevent emphasis in the middle of a word
  // and add autolinking
  function handleText(stream, mdState) {
    var match;
    if (stream.match(/^\w+:\/\/\S+/)) {
      return 'link';
    }
    if (stream.match(/^[^\[*\\<>` _][^\[*\\<>` ]*[^\[*\\<>` _]/)) {
      return mdMode.getType(mdState);
    }
    if (match = stream.match(/^[^\[*\\<>` ]+/)) {
      var word = match[0];
      if (word[0] === '_' && word[word.length-1] === '_') {
        stream.backUp(word.length);
        return undefined;
      }
      return mdMode.getType(mdState);
    }
    if (stream.eatSpace()) {
      return null;
    }
  }

  return {
    startState: function() {
      var mdState = mdMode.startState();
      mdState.text = handleText;
      return {token: markdown, mode: "markdown", mdState: mdState,
              localMode: null, localState: null};
    },

    copyState: function(state) {
      return {token: state.token, mdState: CodeMirror.copyState(mdMode, state.mdState),
              localMode: state.localMode,
              localState: state.localMode ? CodeMirror.copyState(state.localMode, state.localState) : null};
    },

    token: function(stream, state) {
        /* Parse GFM double bracket links */
        var ch;
        if ((ch = stream.peek()) != undefined && ch == '[') {
            stream.next(); // Advance the stream

            /* Only handle double bracket links */
            if ((ch = stream.peek()) == undefined || ch != '[') {
                stream.backUp(1);
                return state.token(stream, state);
            } 

            while ((ch = stream.next()) != undefined && ch != ']') {}

            if (ch == ']' && (ch = stream.next()) != undefined && ch == ']') 
                return 'link';

            /* If we did not find the second ']' */
            stream.backUp(1);
        }

        /* Match GFM latex formulas, as well as latex formulas within '$' */
        if (stream.match(/^\$[^\$]+\$/)) {
            return "string";
        }

        if (stream.match(/^\\\((.*?)\\\)/)) {
            return "string";
        }

        if (stream.match(/^\$\$[^\$]+\$\$/)) {
            return "string";
        }
        
        if (stream.match(/^\\\[(.*?)\\\]/)) {
            return "string";
        }

        return state.token(stream, state);
    },

    innerMode: function(state) {
      if (state.token == markdown) return {state: state.mdState, mode: mdMode};
      else return {state: state.localState, mode: state.localMode};
    }
  };
}, "markdown");
