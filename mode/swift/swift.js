// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// Swift mode created by Michael Kaminsky https://github.com/mkaminsky11

(function(mod) {
  if (typeof exports == "object" && typeof module == "object")
    mod(require("../../lib/codemirror"))
  else if (typeof define == "function" && define.amd)
    define(["../../lib/codemirror"], mod)
  else
    mod(CodeMirror)
})(function(CodeMirror) {
  "use strict"

  function wordSet(words) {
    var set = {}
    for (var i = 0; i < words.length; i++) set[words[i]] = true
    return set
  }

  var keywords = wordSet(["var","let","class","deinit","enum","extension","func","import","init","protocol",
                          "static","struct","subscript","typealias","as","dynamicType","is","new","super",
                          "self","Self","Type","__COLUMN__","__FILE__","__FUNCTION__","__LINE__","break","case",
                          "continue","default","do","else","fallthrough","if","in","for","return","switch",
                          "where","while","associativity","didSet","get","infix","inout","left","mutating",
                          "none","nonmutating","operator","override","postfix","precedence","prefix","right",
                          "set","unowned","weak","willSet"])
  var definingKeywords = wordSet(["var","let","class","enum","extension","func","import","protocol","struct",
                                  "typealias","dynamicType","for"])
  var atoms = wordSet(["Infinity","NaN","undefined","null","true","false","on","off","yes","no","nil","null",
                       "this","super"])
  var types = wordSet(["String","bool","int","string","double","Double","Int","Float","float","public",
                       "private","extension"])
  var operators = "+-/*%=|&<>#"
  var punc = ";,.(){}[]"
  var delimiters = /^(?:[()\[\]{},:`=;]|\.\.?\.?)/
  var number = /^-?(?:(?:[\d_]+\.[_\d]*|\.[_\d]+|0o[0-7_\.]+|0b[01_\.]+)(?:e-?[\d_]+)?|0x[\d_a-f\.]+(?:p-?[\d_]+)?)/i
  var identifier = /^[_A-Za-z$][_A-Za-z$0-9]*/
  var property = /^[@\.][_A-Za-z$][_A-Za-z$0-9]*/
  var regexp = /^\/(?!\s)(?:\/\/)?(?:\\.|[^\/])+\//

  function tokenBase(stream, state, prev) {
    if (stream.eatSpace()) return null

    var ch = stream.peek()
    if (ch == "/") {
      if (stream.match("//")) {
        stream.skipToEnd()
        return "comment"
      }
      if (stream.match("/*")) {
        state.tokenize.push(tokenComment)
        return tokenComment(stream, state)
      }
      if (stream.match(regexp)) return "string-2"
    }
    if (operators.indexOf(ch) > -1) {
      stream.next()
      return "operator"
    }
    if (punc.indexOf(ch) > -1) {
      stream.match(delimiters)
      return "punctuation"
    }
    if (ch == '"' || ch == "'") {
      stream.next()
      var tokenize = tokenString(ch)
      state.tokenize.push(tokenize)
      return tokenize(stream, state)
    }

    if (stream.match(number)) return "number"
    if (stream.match(property)) return "property"

    if (stream.match(identifier)) {
      var ident = stream.current()
      if (keywords.hasOwnProperty(ident)) {
        if (definingKeywords.hasOwnProperty(ident))
          state.prev = "define"
        return "keyword"
      }
      if (types.hasOwnProperty(ident)) return "variable-2"
      if (atoms.hasOwnProperty(ident)) return "atom"
      if (prev == "define") return "def"
      return "variable"
    }

    stream.next()
    return null
  }

  function tokenUntilClosingParen() {
    var depth = 0
    return function(stream, state, prev) {
      var inner = tokenBase(stream, state, prev)
      if (inner == "punctuation") {
        if (stream.current() == "(") ++depth
        else if (stream.current() == ")") {
          if (depth == 0) {
            stream.backUp(1)
            state.tokenize.pop()
            return state.tokenize[state.tokenize.length - 1](stream, state)
          }
          else --depth
        }
      }
      return inner
    }
  }

  function tokenString(quote) {
    return function(stream, state) {
      var ch, escaped = false
      while (ch = stream.next()) {
        if (escaped) {
          if (ch == "(") {
            state.tokenize.push(tokenUntilClosingParen())
            return "string"
          }
          escaped = false
        } else if (ch == quote) {
          break
        } else {
          escaped = ch == "\\"
        }
      }
      state.tokenize.pop()
      return "string"
    }
  }

  function tokenComment(stream, state) {
    stream.match(/^(?:[^*]|\*(?!\/))*/)
    if (stream.match("*/")) state.tokenize.pop()
    return "comment"
  }

  CodeMirror.defineMode("swift", function() {
    return {
      startState: function() {
        return {
          prev: null,
          tokenize: []
        }
      },
      token: function(stream, state) {
        var prev = state.prev
        state.prev = null
        var tokenize = state.tokenize[state.tokenize.length - 1] || tokenBase
        var style = tokenize(stream, state, prev)
        if (!style || style == "comment") state.prev = prev
        else if (!state.prev) state.prev = style
        return style
      },
      lineComment: "//",
      blockCommentStart: "/*",
      blockCommentEnd: "*/"
    }
  })

  CodeMirror.defineMIME("text/x-swift","swift")
})
