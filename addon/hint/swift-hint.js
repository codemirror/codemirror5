// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

var CodeMirror;

(function(mod) {
  if (typeof exports == "object" && typeof module == "object")
    mod(require("../../lib/codemirror"))
  else if (typeof define == "function" && define.amd)
    define(["../../lib/codemirror"], mod)
  else
    mod(CodeMirror)
})(function(CodeMirror) {
  'use strict';

  var Pos = CodeMirror.Pos;

  // If we surpass our line threshold for extracting user variables from
  // the text, we will use the variables, types and properties that were
  // last stored in this object.
  var STORED_VARIABLES = {};

  // A basic set implementation to make our lives easier, since Set() isn't
  // yet universally compatible. Used to store keywords without duplicates
  // or having to manually search an array, which is slow. Cribbed from
  // https://github.com/jfriend00/Javascript-Set
  function CMSet() {
    this.data = {};
  }

  CMSet.prototype = {
    add: function(key) {
      this.data[key] = true;
    },
    has: function(key) {
      return Object.prototype.hasOwnProperty.call(this.data, key);
    },
    keys: function() {
      var results = [];
      for (var key in this.data) {
        if (this.has(key)) {
          results.push(key);
        }
      }
      return results;
    }
  };
  CMSet.prototype.constructor = CMSet;

  // This function scans a line to determine if a given token is a
  // user-defined type.
  function isDeclaredType(lineTokens, tokenIndex) {
    for (var prevTokenIndex = tokenIndex - 1; prevTokenIndex >= 0; prevTokenIndex--) {
      var prevToken = lineTokens[prevTokenIndex];
      if (typeDefKeywords.indexOf(prevToken.string) >= 0) {
        return true;
      } else if (prevToken.type != null) {
        return false;
      }
    }
    return false;
  }

  // This function checks to see if a token is currently inside 
  // variable-defining parens, that aren't part of a function call.
  function isInDefParens(lineTokens, tokenIndex) {
    var functionCall = false;
    var parenDepth = 0;
    var prevTokenType = null;

    for (var i = 0; i < tokenIndex; i++) {
      var token = lineTokens[i];
      if (token.string == '(') {
        if (parenDepth == 0 && (prevTokenType == 'variable' ||
            prevTokenType == 'variable-2' || prevTokenType == 'property')) {
          functionCall = true;
        }
        parenDepth += 1;
      } else if (token.string == ')') {
        parenDepth -= 1;
        if (parenDepth == 0) {
          functionCall = false;
        }
      }
      prevTokenType = token.type;
    }

    if (parenDepth > 0 && !functionCall) {
      return true;
    } else {
      return false;
    }
  }

  // This function scans the document and extracts all variables, types
  // and properties, to add them to our autocomplete hints. It excludes
  // the token we're currently manipulating.
  function getLocalVariables(cm, cur, token) {
    var allVariables = new CMSet();
    var allTypes = new CMSet();
    var allProperties = new CMSet();
    for (var i = 0; i < cm.lineCount(); i++) {
      var lineTokens = cm.getLineTokens(i);
      for (var j = 0; j < lineTokens.length; j++) {
        var currentToken = lineTokens[j];
        // If we're looking at the current variable, pass.
        if (i == cur.line && currentToken.start == token.start) {
          continue;
        } else {
          // If it's some random variable, put it there.
          if (currentToken.type == 'variable') {
            allVariables.add(currentToken.string);
          // If it's specifically a definition, place it either in allVars
          // or in allTypes.
          } else if (currentToken.type == 'def') {
            if (isDeclaredType(lineTokens, j)) {
              allTypes.add(currentToken.string);
            } else {
              allVariables.add(currentToken.string);
            }
          // If it's a property, strip off the leading period and add it.
          } else if (currentToken.type == 'property') {
            allProperties.add(currentToken.string.slice(1));
          }
        }
      }
    }

    var varKeys = {
      vars: allVariables.keys(),
      types: allTypes.keys(),
      props: allProperties.keys()
    };
    if (!varKeys.vars) { varKeys.vars = []; }
    if (!varKeys.types) { varKeys.types = []; }
    if (!varKeys.props) { varKeys.props = []; }
    STORED_VARIABLES = varKeys;
    return varKeys;
  }

  // This function determines if a variable we are creating or about to create
  // should be considered a property.
  function checkIfProperty(lineTokens, tokenIndex) {
    var token = lineTokens[tokenIndex];
    // If our token is at the start of the line, stop right away.
    if (tokenIndex > 0) {
      var prevToken = lineTokens[tokenIndex - 1];
      if (token.string == '.') {
        // If this is a . and the previous token is a string, variable, or
        // variable-2, it's a property.
        if (prevToken.type == 'string' || prevToken.type == 'variable' ||
            prevToken.type == 'variable-2') {
          return { isProperty: true, propertyOf: prevToken.type };
        }
      } else if (token.type == 'property') {
        // Well now it's definitely a property.
        return { isProperty: true, propertyOf: prevToken.type };
      }
    }

    return { isProperty: false, propertyOf: null };
  }

  // This function determines if a variable we are creating or about to create
  // should be considered a type declaration following a : or otherwise.
  function checkIfStandardTypeDec(lineTokens, tokenIndex) {
    // If our token is at the start of the line, stop right away.
    if (tokenIndex <= 0) {
      return false;
    }

    var token = lineTokens[tokenIndex];

    if (token.string == 'as') {
      return true;
    }

    // Seek out the closest previous non-null token.
    var prevToken = null;
    var prevTokenIndex = tokenIndex - 1;
    while (prevTokenIndex >= 0) {
      prevToken = lineTokens[prevTokenIndex];
      if (prevToken.type != null) {
        break;
      }
      prevTokenIndex = prevTokenIndex - 1;
    }
    // If we shot past the end of the line and found nothing.
    if (prevTokenIndex < 0) {
      return false;
    }

    if (token.string == ':') {
      if (prevToken.type == 'def') {
        return true;
      } else if (isInDefParens(lineTokens, tokenIndex) && prevToken.type == 'variable') {
        return true;
      }
    } else if (token.string == '[') {
      return checkIfStandardTypeDec(lineTokens, prevTokenIndex);
    } else if (token.string == '>') {
      if (prevToken.string == '-') {
        return true;
      }
    } else if (!token.type || token.type == 'variable' || token.type == 'variable-2') {
      if (prevToken.string == 'as') {
        return true;
      } else if (prevToken.string == ':' || prevToken.string == '>' || prevToken.string == '[') {
        return checkIfStandardTypeDec(lineTokens, prevTokenIndex);
      }
    }

    return false;
  }

  // This function determines if a variable we are creating or about to create
  // should be considered a type declaration as part of a collection type.
  function checkIfCollectionTypeDec(lineTokens, tokenIndex) {
    // If our token is at the start of the line, stop right away.
    if (tokenIndex <= 0) {
      return false;
    }

    var token = lineTokens[tokenIndex];

    // Seek out the closest previous non-null token. Ignore
    // variables, variable-2's and commas if we're not on < yet.
    var prevToken = null;
    var prevTokenIndex = tokenIndex - 1;
    while (prevTokenIndex >= 0) {
      prevToken = lineTokens[prevTokenIndex];
      if (token.string != '<') {
        if ((prevToken.type && prevToken.type != 'variable' &&
             prevToken.type != 'variable-2' && prevToken.string != ',')) {
          break;
        }
      } else {
        if (prevToken.type) {
          break;
        }
      }
      prevTokenIndex = prevTokenIndex - 1;
    }
    // If we shot past the end of the line and found nothing.
    if (prevTokenIndex < 0) {
      return false;
    }

    if (token.string == '[') {
      return checkIfCollectionTypeDec(lineTokens, prevTokenIndex);
    } else if (token.string == '<') {
      if (swiftCollections.indexOf(prevToken.string) >= 0) {
        return true;
      }
    } else if (!token.type || token.type == 'variable' ||
               token.type == 'variable-2' || token.string == ',') {
      if (prevToken.string == '<' || prevToken.string == '[') {
        return checkIfCollectionTypeDec(lineTokens, prevTokenIndex);
      }
    }

    return false;
  }

  // See if the current token is a type declaration.
  function checkIfTypeDec(lineTokens, tokenIndex) {
    // Check and see if this type is being declared as part of a collection type.
    var isDec = checkIfCollectionTypeDec(lineTokens, tokenIndex);

    // Do the normal type declaration checks, if the last one failed.
    if (!isDec) {
      isDec = checkIfStandardTypeDec(lineTokens, tokenIndex);
    }

    return isDec;
  }

  // This function determines if a token should be considered a property or a
  // type declaration, for purposes of changing the list of keywords to return.
  // It also determines the type of object this is a property of (string or 
  // variable, mainly).
  function checkSpecialToken(cm, cur, token) {
    var lineTokens = cm.getLineTokens(cur.line);
    
    // Find the index in lineTokens of the current operative token.
    var tokenIndex = -1;
    for (var i = 0; i < lineTokens.length; i++) {
      var currentToken = lineTokens[i];
      if (currentToken.start == token.start && currentToken.end == token.end) {
        tokenIndex = i;
        break;
      }
    }
    // In case of some weird error where we couldn't find the token.
    if (tokenIndex < 0) {
      return null;
    }

    // Do the property check.
    var isProp = checkIfProperty(lineTokens, tokenIndex);

    // Do the type declaration check.
    var isDec = checkIfTypeDec(lineTokens, tokenIndex);

    return {
      isDeclaration: isDec,
      isProperty: isProp
    };
  }

  // A function that takes in information about the token and returns an
  // appropriate candidate list.
  function getCandidateList(cm, cur, token, tprop, tdec, options) {
    // Analyze our options.
    var contextAware = true;
    var getUserVars = false;
    var userVarRange = 2000;
    if (options) {
      if (options.keywords) {
        swiftAdditionalKeywords = options.keywords;
      }
      if (options.contextAware != null && options.contextAware != undefined) {
        contextAware = options.contextAware;
      }
      getUserVars = options.extractVariables;
      if (options.extractRange) {
        userVarRange = options.extractRange;
      }
    }

    // What list we return depends on if we're context-aware or not.
    if (contextAware) {
      // Compiler instructions have a very limited candidate set.
      if (token.type == 'builtin' || token.string == '#') {
        return swiftBuiltins.concat(swiftAdditionalKeywords);
      }

      // So do attributes.
      if (token.type == 'attribute' || token.string == '@') {
        return swiftAttributes.concat(swiftAdditionalKeywords);
      }

      // Start with anything the user might have specifically added.
      var candidateList = swiftAdditionalKeywords;

      if (tprop.isProperty) {
        // Always add string properties as an option.
        candidateList = stringProps;
        // But only add non-string options if we don't know for a fact
        // that this is a property of a string.
        if (tprop.propertyOf != 'string') {
          candidateList = candidateList.concat(genericProps);
        }
      } else {
        candidateList = candidateList.concat(swiftTypes);
        if (!tdec) {
          candidateList = candidateList.concat(swiftKeywords);
          candidateList = candidateList.concat(swiftFunctions);
        }
      }
    } else {
      var candidateList = swiftAdditionalKeywords.concat(swiftKeywords)
                          .concat(swiftFunctions)
                          .concat(swiftTypes)
                          .concat(stringProps)
                          .concat(genericProps);
    }

    // If the code is small enough, scan it and add local variables and
    // functions to the autocomplete hints. (Unless this is a string property.)
    if (getUserVars && tprop.propertyOf != 'string') {
      var userVars = STORED_VARIABLES;
      if (cm.lineCount() < userVarRange) {
        userVars = getLocalVariables(cm, cur, token);
      }

      if (contextAware) {
        // If it's a property, add the user-defined properties and variables.
        // The variables could be struct or class variables.
        if (tprop.isProperty) {
          candidateList = userVars.props.concat(candidateList);
          candidateList = userVars.vars.concat(candidateList);
        } else {
          // Add the declared types.
          candidateList = userVars.types.concat(candidateList);
          // If this is not a declaration, add the other vars.
          if (!tdec) {
            candidateList = userVars.props.concat(candidateList);
            candidateList = userVars.vars.concat(candidateList);
          }
        }
      } else {
        candidateList = userVars.vars.concat(userVars.props)
                        .concat(userVars.types)
                        .concat(candidateList);
      }
    }

    return candidateList;
  }

  // This function determines if a given punctuation mark should cause us
  // to immediately return the candidate list and exclude the current
  // character in the string from replacement.
  function returnImmediateList(token, tprop, tdec) {
    if (tprop.isProperty && token.string == '.') {
      return true;
    }

    if (tdec) {
      if (token.type == null || token.string == '<' ||
          token.string == ',' || token.string == '[') {
        return true;
      }
    }

    if (token.string == '#' || token.string == '@') {
      return true;
    }

    return false;
  }

  // This simple boolean tells us if the token includes a leading punctuation
  // character, because we need to change some things in that case.
  function hasLeadingPunctuation(token) {
    return token.type == 'property' || token.type == 'builtin' ||
           token.type == 'attribute';
  }

  // Our custom hinting function. Doesn't work on strings, comments, or numbers.
  //
  // Defined additional options:
  // keywords - an array of strings, indicating what keywords a user would like
  //   added to the hints.
  // contextAware - a boolean indicating whether the list of words should be
  //   adjusted based on the contents of the given line. Defaults to true.
  // extractVariables - a boolean indicating whether or not the hint system should
  //   scan the text to get user-defined variables for its list. Default is false.
  // extractRange - an integer. if the text extends beyond this many lines, 
  //   stop scanning it for variables and use whatever was last found.
  //   Default is 2000.
  function swiftHint(cm, options) {
    var cur = cm.getCursor();
    var token = cm.getTokenAt(cur);

    token.state = CodeMirror.innerMode(cm.getMode(), token.state).state;

    // Rule out some options quickly.
    if (token.type == 'string' || token.type == 'comment' ||
        token.type == 'number') {
      return {list: [],
              from: Pos(cur.line, token.start+1),
              to: Pos(cur.line, token.end)};
    }

    var specialTokens = checkSpecialToken(cm, cur, token);
    var tprop = specialTokens ? specialTokens.isProperty : { isProperty: false, propertyOf: null };
    var tdec = specialTokens ? specialTokens.isDeclaration : false;

    var candidateList = getCandidateList(cm, cur, token, tprop, tdec, options);

    // If we're on a punctuation mark and this is a property, or if we're doing a
    // type declaration and the variable name has not started yet, return the full
    // list of available properties.
    if (returnImmediateList(token, tprop, tdec)) {
      return {list: candidateList,
              from: Pos(cur.line, token.start+1),
              to: Pos(cur.line, token.end)};
    }

    // Look at the characters in our token so far and return any candidate
    // hints that match that token at the start.
    var hintSet = new CMSet();
    for (var i = 0; i < candidateList.length; i++) {
      // If the token type is "property", "builtin" or "attribute" we need to adjust our search string.
      var currentToken = token.string.toLowerCase();
      if (hasLeadingPunctuation(token)) {
        currentToken = currentToken.slice(1);
      }
      var currentKeyword = candidateList[i].toLowerCase();
      if (currentKeyword.indexOf(currentToken) == 0) {
        hintSet.add(candidateList[i]);
      }
    }

    // If this is a property/builtin/attribute type, we need to adjust where the replacement occurs.
    // Otherwise we'll erase the leading character.
    var hintListFromPosition = token.start;
    if (hasLeadingPunctuation(token)) {
      hintListFromPosition += 1;
    }

    return {list: hintSet.keys(),
            from: Pos(cur.line, hintListFromPosition),
            to: Pos(cur.line, token.end)};
  }

  // A list of basic Swift keywords.
  var swiftKeywords = ['var','let','class','deinit','enum','extension','func','import','init','protocol',
                       'static','struct','subscript','typealias','as','dynamicType','is','new','super',
                       'self','Self','Type','__COLUMN__','__FILE__','__FUNCTION__','__LINE__','break','case',
                       'continue','default','do','else','fallthrough','if','in','for','return','switch',
                       'where','while','associativity','didSet','get','infix','inout','left','mutating',
                       'none','nonmutating','operator','override','postfix','precedence','prefix','right',
                       'set','unowned','weak','willSet','Infinity','NaN','undefined','null','true','false',
                       'on','off','yes','no','nil','null','this','super','public','private','extension',
                       'associatedtype','internal','defer','guard','repeat','catch','throw','throws',
                       'rethrows','convenience','lazy','higherThan','lowerThan','try'];
  // A list of Swift types.
  var swiftTypes = ['String','Double','Int','Float','Int8','UInt8','Int16','UInt16','Int32','UInt32',
                    'Int64','UInt64','Character','Array','Set','Dictionary'];
  // A list of keywords that define new types.
  var typeDefKeywords = ['typealias','class','struct','extension','protocol','associatedtype','enum'];
  // A list of basic Swift functions.
  var swiftFunctions = ['print','assert','abs','assertionFailure','debugPrint','dump','fatalError',
                        'withVaList','isKnownUniquelyReferenced','isUniquelyReferencedNonObjC','numericCast',
                        'precondition','preconditionFailure','swap','transcode','withExtendedLifetime',
                        'zip'];
  // A list of Swift collection types.
  var swiftCollections = ['Array','Set','Dictionary','MemoryLayout','AnyIterator','IndexingIterator'];
  // A list of string properties and methods.
  var stringProps = ['isEmpty','characters','utf8','utf16','unicodeScalars','startIndex','endIndex','index',
                     'append','insert','remove','removeRange'];
  // A list of more generic properties and methods.
  var genericProps = ['count','indices','prefix','suffix','dynamicType','Type','min','max','enumerated',
                      'removeLast','contains','sort','union','intersection','subtract','symmetricDifference',
                      'isSubset','isSuperset','isStrictSubset','isStrictSuperset','isDisjoint','updateValue',
                      'removeValue','keys','values','map','reduce','readLine','size','alignment','stride'];
  // A list of builtins.
  var swiftBuiltins = ['file','line','column','function','colorLiteral','fileLiteral','imageLiteral',
                       'selector','keyPath','if','elseif','else','endif','sourceLocation','available'];
  // A list of attributes.
  var swiftAttributes = ['available','discardableResult','GKInspectable','objc','nonobjc',
                         'NSApplicationMain','NSCopying','NSManaged','testable','UIApplicationMain',
                         'IBAction','IBOutlet','IBDesignable','IBInspectable','autoclosure','convention',
                         'escaping'];
  // A list of additional keywords that the user might have specified.
  var swiftAdditionalKeywords = [];

  CodeMirror.registerHelper('hint', 'swift', swiftHint);
});