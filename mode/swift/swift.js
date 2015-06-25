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

  function trim(str) { return /^\s*(.*?)\s*$/.exec(str)[1] }

  var separators = [" ","\\\+","\\\-","\\\(","\\\)","\\\*","/",":","\\\?","\\\<","\\\>"," ","\\\."]
  var tokens = new RegExp(separators.join("|"),"g")

  function getWord(string, pos) {
    var index = -1, count = 1
    var words = string.split(tokens)
    for (var i = 0; i < words.length; i++) {
      for(var j = 1; j <= words[i].length; j++) {
        if (count==pos) index = i
        count++
      }
      count++
    }
    var ret = ["", ""]
    if (pos == 0) {
      ret[1] = words[0]
      ret[0] = null
    } else {
      ret[1] = words[index]
      ret[0] = words[index-1]
    }
    return ret
  }

  CodeMirror.defineMode("swift", function() {
    var keywords=["var","let","class","deinit","enum","extension","func","import","init","let","protocol","static","struct","subscript","typealias","var","as","dynamicType","is","new","super","self","Self","Type","__COLUMN__","__FILE__","__FUNCTION__","__LINE__","break","case","continue","default","do","else","fallthrough","if","in","for","return","switch","where","while","associativity","didSet","get","infix","inout","left","mutating","none","nonmutating","operator","override","postfix","precedence","prefix","right","set","unowned","unowned(safe)","unowned(unsafe)","weak","willSet"]
    var commonConstants=["Infinity","NaN","undefined","null","true","false","on","off","yes","no","nil","null","this","super"]
    var types=["String","bool","int","string","double","Double","Int","Float","float","public","private","extension"]
    var numbers=["0","1","2","3","4","5","6","7","8","9"]
    var operators=["+","-","/","*","%","=","|","&","<",">"]
    var punc=[";",",",".","(",")","{","}","[","]"]
    var delimiters=/^(?:[()\[\]{},:`=;]|\.\.?\.?)/
    var identifiers=/^[_A-Za-z$][_A-Za-z$0-9]*/
    var properties=/^(@|this\.)[_A-Za-z$][_A-Za-z$0-9]*/
    var regexPrefixes=/^(\/{3}|\/)/

    return {
      startState: function() {
        return {
          prev: false,
          string: false,
          escape: false,
          inner: false,
          comment: false,
          num_left: 0,
          num_right: 0,
          doubleString: false,
          singleString: false
        }
      },
      token: function(stream, state) {
        if (stream.eatSpace()) return null

        var ch = stream.next()
        if (state.string) {
          if (state.escape) {
            state.escape = false
            return "string"
          } else {
            if ((ch == "\"" && (state.doubleString && !state.singleString) ||
                 (ch == "'" && (!state.doubleString && state.singleString))) &&
                !state.escape) {
              state.string = false
              state.doubleString = false
              state.singleString = false
              return "string"
            } else if (ch == "\\" && stream.peek() == "(") {
              state.inner = true
              state.string = false
              return "keyword"
            } else if (ch == "\\" && stream.peek() != "(") {
              state.escape = true
              state.string = true
              return "string"
            } else {
              return "string"
            }
          }
        } else if (state.comment) {
          if (ch == "*" && stream.peek() == "/") {
            state.prev = "*"
            return "comment"
          } else if (ch == "/" && state.prev == "*") {
            state.prev = false
            state.comment = false
            return "comment"
          }
          return "comment"
        } else {
          if (ch == "/") {
            if (stream.peek() == "/") {
              stream.skipToEnd()
              return "comment"
            }
            if (stream.peek() == "*") {
              state.comment = true
              return "comment"
            }
          }
          if (ch == "(" && state.inner) {
            state.num_left++
            return null
          }
          if (ch == ")" && state.inner) {
            state.num_right++
            if (state.num_left == state.num_right) {
              state.inner=false
              state.string=true
            }
            return null
          }

          var ret = getWord(stream.string, stream.pos)
          var the_word = ret[1]
          var prev_word = ret[0]

          if (operators.indexOf(ch + "") > -1) return "operator"
          if (punc.indexOf(ch) > -1) return "punctuation"

          if (typeof the_word != "undefined") {
            the_word = trim(the_word)
            if (typeof prev_word != "undefined") prev_word = trim(prev_word)
            if (the_word.charAt(0) == "#") return null

            if (types.indexOf(the_word) > -1) return "def"
            if (commonConstants.indexOf(the_word) > -1) return "atom"
            if (numbers.indexOf(the_word) > -1) return "number"

            if ((numbers.indexOf(the_word.charAt(0) + "") > -1 ||
                 operators.indexOf(the_word.charAt(0) + "") > -1) &&
                numbers.indexOf(ch) > -1) {
              return "number"
            }

            if (keywords.indexOf(the_word) > -1 ||
                keywords.indexOf(the_word.split(tokens)[0]) > -1)
              return "keyword"
            if (keywords.indexOf(prev_word) > -1) return "def"
          }
          if (ch == '"' && !state.doubleString) {
            state.string = true
            state.doubleString = true
            return "string"
          }
          if (ch == "'" && !state.singleString) {
            state.string = true
            state.singleString = true
            return "string"
          }
          if (ch == "(" && state.inner)
            state.num_left++
          if (ch == ")" && state.inner) {
            state.num_right++
            if (state.num_left == state.num_right) {
              state.inner = false
              state.string = true
            }
            return null
          }
          if (stream.match(/^-?[0-9\.]/, false)) {
            if (stream.match(/^-?\d*\.\d+(e[\+\-]?\d+)?/i) ||
                stream.match(/^-?\d+\.\d*/) ||
                stream.match(/^-?\.\d+/)) {
              if (stream.peek() == ".") stream.backUp(1)
              return "number"
            }
            if (stream.match(/^-?0x[0-9a-f]+/i) ||
                stream.match(/^-?[1-9]\d*(e[\+\-]?\d+)?/) ||
                stream.match(/^-?0(?![\dx])/i))
              return "number"
          }
          if (stream.match(regexPrefixes)) {
            if (stream.current()!="/" || stream.match(/^.*\//,false)) return "string"
            else stream.backUp(1)
          }
          if (stream.match(delimiters)) return "punctuation"
          if (stream.match(identifiers)) return "variable"
          if (stream.match(properties)) return "property"
          return "variable"
        }
      }
    }
  })

  CodeMirror.defineMIME("text/x-swift","swift")
})
