// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"))
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod)
  else // Plain browser env
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

  // Check one token against a possible match.
  function tokenPatternObjectMatches(token, tokenPatternToMatch) {
    if (tokenPatternToMatch.types) {
      var validType = false;
      for (var i = 0; i < tokenPatternToMatch.types.length; i++) {
        if (token.type == tokenPatternToMatch.types[i]) {
          validType = true;
        }
      }

      if (!validType) {
        return false;
      }
    }

    if (tokenPatternToMatch.strings) {
      var validString = false;
      for (var i = 0; i < tokenPatternToMatch.strings.length; i++) {
        if (token.string == tokenPatternToMatch.strings[i]) {
          validString = true;
        }
      }

      if (!validString) {
        return false;
      }
    }

    return true;
  }

  // Check to see if the current token string obeys a given token pattern.
  // The token pattern objects have the following structure:
  //
  // types: an array of strings to indicate it should have a given type.
  // strings: an array of strings to indicate the string should be a certain value.
  // repeatingGroup: an array of pattern objects to represent a repeating group.
  //   (This should not be used in combination with types, strings or repeats.)
  // optional: a boolean to indicate if this item is optional or not.
  // repeats: a boolean to indicate this item could occur more than one time.
  //
  // It will return the number of tokens matched if the pattern succeeds, allowing
  // this function to recursively handle repeating groups. A value of 0 indicates
  // failure.
  function checkTokenPatternHelper(tokenPattern, lineTokens, tokenIndex, debug) {
    var tokensProcessed = 0;
    var lineTokenIndex = tokenIndex;

    for (var i = tokenPattern.length - 1; i >= 0; i--) {
      // If we've run out of line tokens, fail out.
      if (lineTokenIndex < 0) {
        return 0;
      }

      var tokenPatternObject = tokenPattern[i];
      var currentToken = lineTokens[lineTokenIndex];

      // Is this a repeating group? If so, process it as a normal group.
      if (tokenPatternObject.repeatingGroup) {
        var groupTokens = 0;
        while (true) {
          var tokensFoundInGroup = checkTokenPatternHelper(tokenPatternObject.repeatingGroup,
            lineTokens, lineTokenIndex - groupTokens, debug);
          if (tokensFoundInGroup == 0) {
            break;
          } else {
            groupTokens += tokensFoundInGroup;
          }
        }

        // If there were zero tokens matched, then we failed to match the repeating group.
        // If the repeating group isn't optional, that's a failure.
        if (groupTokens == 0) {
          if (!tokenPatternObject.optional) {
            return 0;
          }
        } else {
          // If we succeeded in matching, change the lineTokenIndex to reflect this.
          lineTokenIndex -= groupTokens;
          tokensProcessed += groupTokens;
        }
      } else if (!tokenPatternObjectMatches(currentToken, tokenPatternObject)) {
        // If we failed to match a non-optional token, return false.
        if (!tokenPatternObject.optional) {
          return 0;
        }
      } else {
        // If we match, move on to looking at the next token.
        lineTokenIndex--;
        tokensProcessed++;

        // If the current token is a repeating token, then try to match as
        // many as possible.
        if (tokenPatternObject.repeats) {
          while (tokenPatternObjectMatches(lineTokens[lineTokenIndex], tokenPatternObject)) {
            lineTokenIndex--;
            tokensProcessed++;
          }
        }
      }
    }

    return tokensProcessed;
  }

  // The entry point for checking token patterns.
  function checkTokenPattern(tokenPattern, lineTokens, tokenIndex, debug) {
    return checkTokenPatternHelper(tokenPattern, lineTokens, tokenIndex, debug) > 0;
  }

  // This function scans a line to determine if a given token is a
  // user-defined type.
  function isDeclaredType(lineTokens, tokenIndex) {
    var tokenPattern = [
      {strings: typeDefKeywords},
      {types: [null]},
      {types: ['def']}
    ];
    return checkTokenPattern(tokenPattern, lineTokens, tokenIndex);
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
    // If our token is at the start of the line, stop right away.
    if (tokenIndex <= 0) {
      return { isProperty: false, propertyOf: null };
    }

    var token = lineTokens[tokenIndex];
    var prevToken = lineTokens[tokenIndex - 1];

    // First check and see if it has a property type.
    if (token.type == 'property') {
      return { isProperty: true, propertyOf: prevToken.type };
    }

    // If this is a . and the previous token is a string, variable, or
    // variable-2, it's a property.
    var tokenPattern = [
      {types: ['string', 'variable', 'variable-2']},
      {strings: ['.']}
    ];
    if (checkTokenPattern(tokenPattern, lineTokens, tokenIndex)) {
      return { isProperty: true, propertyOf: prevToken.type };
    }

    return { isProperty: false, propertyOf: null };
  }

  // This function determines if a variable we are creating or about to create
  // should be considered a type declaration following a : or otherwise.
  function checkIfTypeDec(lineTokens, tokenIndex) {
    // If our token is at the start of the line, stop right away.
    if (tokenIndex <= 0) {
      return false;
    }

    // Declaration via "as", "as?" or "as!".
    var tokenPattern = [
      {strings: ['as']},
      {strings: ['!', '?'], optional: true},
      {types: [null]},
      {strings: ['['], optional: true, repeats: true},
      {types: ['variable', 'variable-2'], optional: true}
    ];
    if (checkTokenPattern(tokenPattern, lineTokens, tokenIndex)) {
      return true;
    }

    // Declaration with colon.
    tokenPattern = [
      {types: ['def']},
      {strings: [':']},
      {types: [null], optional: true},
      {strings: ['['], optional: true, repeats: true},
      {types: ['variable', 'variable-2'], optional: true}
    ];
    if (checkTokenPattern(tokenPattern, lineTokens, tokenIndex)) {
      return true;
    }

    // Declaration with colon inside a tuple.
    tokenPattern = [
      {types: ['variable']},
      {strings: [':']},
      {types: [null], optional: true},
      {strings: ['['], optional: true, repeats: true},
      {types: ['variable', 'variable-2'], optional: true}
    ];
    if (checkTokenPattern(tokenPattern, lineTokens, tokenIndex)) {
      if (isInDefParens(lineTokens, tokenIndex)) {
        return true;
      }
    }

    // Return type declaration.
    tokenPattern = [
      {strings: ['-']},
      {strings: ['>']},
      {types: [null], optional: true},
      {strings: ['['], optional: true, repeats: true},
      {types: ['variable', 'variable-2'], optional: true}
    ];
    if (checkTokenPattern(tokenPattern, lineTokens, tokenIndex)) {
      return true;
    }

    // Declaration inside a collection.
    tokenPattern = [
      {strings: swiftCollections},
      {strings: ['<']},
      {types: [null], optional: true},
      {repeatingGroup: [
        {strings: ['['], optional: true, repeats: true},
        {types: ['variable', 'variable-2']},
        {strings: [']'], optional: true, repeats: true},
        {strings: [',']},
        {types: [null], optional: true}
        ],
        optional: true
      },
      {strings: ['['], optional: true, repeats: true},
      {types: ['variable', 'variable-2'], optional: true}
    ];
    if (checkTokenPattern(tokenPattern, lineTokens, tokenIndex, true)) {
      return true;
    }

    return false;
  }

  // This function determines if a token should be considered a property or a
  // type declaration, for purposes of changing the list of keywords to return.
  // It also determines the type of object this is a property of (string or
  // variable, mainly).
  function checkSpecialToken(cm, cur, token, options) {
    // If we're not in context-aware mode, don't bother with this.
    if (!options.contextAware) {
      return null;
    }

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
    var contextAware = false;
    var getUserVars = false;
    var extractLineLimit = 2000;
    if (options) {
      if (options.keywords) {
        swiftAdditionalKeywords = options.keywords;
      }
      contextAware = options.contextAware;
      getUserVars = options.extractVariables;
      if (options.extractLineLimit) {
        extractLineLimit = options.extractLineLimit;
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
      if (cm.lineCount() < extractLineLimit) {
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
  //   adjusted based on the contents of the given line. Defaults to false.
  // extractVariables - a boolean indicating whether or not the hint system should
  //   scan the text to get user-defined variables for its list. Default is false.
  // extractLineLimit - an integer. if the text extends beyond this many lines,
  //   stop scanning it for variables and use whatever was last found.
  //   Default is 2000.
  function swiftHint(cm, options) {
    var cur = cm.getCursor();
    var token = cm.getTokenAt(cur);

    // Rule out some options quickly.
    if (token.type == 'string' || token.type == 'comment' ||
        token.type == 'number') {
      return {list: [],
              from: Pos(cur.line, token.start+1),
              to: Pos(cur.line, token.end)};
    }

    // Determine if our current token is a property or a type declaration, but only
    // if we are running in context-aware mode.
    var specialTokens = checkSpecialToken(cm, cur, token, options);
    var tprop = specialTokens ? specialTokens.isProperty : { isProperty: false, propertyOf: null };
    var tdec = specialTokens ? specialTokens.isDeclaration : false;

    // Using that information, we will whittle down our candidate list.
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
                      'removeValue','keys','values','map','reduce','readLine','size','alignment','stride',
                      'localizedDescription'];
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
