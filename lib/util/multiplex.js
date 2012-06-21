CodeMirror.multiplexingMode = function(outer /*, others */) {
  // Others should be {open, close, mode [, delimStyle]} objects
  var others = Array.prototype.slice.call(arguments, 1);
  var n_others = others.length;

  return {
    startState: function() {
      return {
        outer: CodeMirror.startState(outer),
        innerActive: null,
        inner: null
      };
    },

    copyState: function(state) {
      return {
        outer: CodeMirror.copyState(outer, state.outer),
        innerActive: state.innerActive,
        inner: state.innerActive && CodeMirror.copyState(state.innerActive.mode, state.inner)
      };
    },

    token: function(stream, state) {
      if (!state.innerActive) {
        for (var i = 0; i < n_others; ++i) {
          var other = others[i];
          if (stream.match(other.open)) {
            state.innerActive = other;
            state.inner = CodeMirror.startState(other.mode);
            return other.delimStyle;
          }
        }
        var outerToken = outer.token(stream, state.outer);
        var cur = stream.current();
        for (var i = 0; i < n_others; ++i) {
          var other = others[i], found = cur.indexOf(other.open);
          if (found > -1) {
            stream.backUp(cur.length - found);
            cur = cur.slice(0, found);
          }
        }
        return outerToken;
      } else {
        var curInner = state.innerActive;
        if (stream.match(curInner.close)) {
          state.innerActive = state.inner = null;
          return curInner.delimStyle;
        }
        var innerToken = curInner.mode.token(stream, state.inner);
        var cur = stream.current(), found = cur.indexOf(curInner.close);
        if (found > -1) stream.backUp(cur.length - found);
        return innerToken;
      }
    },
    
    indent: function(state, textAfter) {
      var mode = state.innerActive || outer;
      if (!mode.indent) return CodeMirror.Pass;
      return mode.indent(state.innerActive ? state.inner : state.outer, textAfter);
    },

    compareStates: function(a, b) {
      if (a.innerActive != b.innerActive) return false;
      var mode = a.innerActive || outer;
      if (!mode.compareStates) return CodeMirror.Pass;
      return mode.compareStates(a.innerActive ? a.inner : a.outer,
                                b.innerActive ? b.inner : b.outer);
    },

    electricChars: outer.electricChars
  };
};
