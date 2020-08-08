/** MIT License

Copyright (C) 2018 by Kinjal Hinsu.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/**
 * Add-on to check and replace
 * the case of first character of variable defined
 * and where it is used
 */

(function(mod) {
    if(!CodeMirror.isl){
      	CodeMirror.isl={};
    }
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineOption("changeCase", false, function(cm, val, old) {
	  	var mapExtraKeys;
		if(val.upperCase){
			mapExtraKeys = {
				"Ctrl-B" : "updateToUpper"
			}
			cm.options.extraKeys = Object.assign({}, mapExtraKeys, cm.options.extraKeys)
		}else if(val.lowerCase || val){
			mapExtraKeys = {
				"Ctrl-B" : "updateToLower"
			}
			cm.options.extraKeys = Object.assign({}, mapExtraKeys, cm.options.extraKeys)
		}
  	});

	/**
	 * @method hasRequiredTag
	 * @param {Object} token: list of tokens in a line
	 * @return {Boolean} return 1 when found from listed tag else 0
	 */
	function hasRequiredTag(token){
		var tagsList = ["var","text","integer","rvalue"],
			tokenIndx, tagIndx;
		for (tokenIndx = 0; tokenIndx < token.length; tokenIndx++){
			if(token[tokenIndx].type === "tag") {
				for(tagIndx = 0; tagIndx < tagsList.length; tagIndx++){
					if(token[tokenIndx].string === tagsList[tagIndx]) {
						return true;
					}
				}
			}
		}
		return false;
	}


	/**
	 * find and change the first char of all param "value" in file to lower-case
	 *
	 * @method replaceAllToken
	 * @param {String} value: string to find and need to replace
	 * @param {String} new_value: replace by
	 * @param {Object} cm: CodeMirrror object
	 */
	function replaceAllToken(regexpOldTokenAs, value, newValue, cm){
		var doc= cm.doc,
			tokenList, oldToken, newToken, tokenIndx, tokenStart, tokenEnd,
			lineIndx,
			totalLine = doc.lineCount();

		for (lineIndx = 0; lineIndx < totalLine; lineIndx++) {
			tokenList = cm.getLineTokens(lineIndx);
			if (tokenList.length > 0){
				for (tokenIndx = 0; tokenIndx < tokenList.length; tokenIndx++) {
					while(tokenList[tokenIndx].string.match(regexpOldTokenAs) !== null) {
						oldToken = tokenList[tokenIndx];
						newToken = oldToken.string.replace(value, newValue);
						tokenStart = {line: lineIndx, ch: oldToken.start};
        				tokenEnd = {line: lineIndx, ch: oldToken.end};
						doc.replaceRange(newToken, tokenStart, tokenEnd, oldToken.string);
						oldToken.string = newToken;
					} 
				}   
			}                   
		}
	}


	/**
	 * check from "hasRequiredTag" and
	 * change variable name "oldToken" first character to lower-case
	 * and where it is used
	 * @method updateCase
	 * @param {Object} cm: CodeMirrror object
	 */
	CodeMirror.commands.updateToLower = function (cm) {

		var doc= cm.doc, atAttrValue = 2,
			tokenList, oldToken, newToken, newTokenAs,
			tokenIndx, tokenStart, tokenEnd,
			lineIndx,
			totalLine = doc.lineCount(),
			regexpOldTokenAs;

		for (lineIndx = 0; lineIndx < totalLine; lineIndx++) {
			tokenList = cm.getLineTokens(lineIndx);
			if (tokenList.length > 0 && hasRequiredTag(tokenList)){  
				for (tokenIndx = 0; tokenIndx < tokenList.length - atAttrValue; tokenIndx++) {
					oldToken = tokenList[tokenIndx + atAttrValue];
					tokenStart = {line: lineIndx, ch: oldToken.start};
        			tokenEnd = {line: lineIndx, ch: oldToken.end};
					if(tokenList[tokenIndx].string === "ref" && !isLower(oldToken.string.charAt(0))) {
						newToken = CodeMirror.isl.lowerCaseFirstLetter(oldToken.string);
						doc.replaceRange(newToken, tokenStart, tokenEnd, oldToken.string);
						newTokenAs = "%" + newToken;
						regexpOldTokenAs = new RegExp('%' + oldToken.string + '(?!\\w)', 'g');               //% + string of oldToken not followed by alphanumeric
						replaceAllToken(regexpOldTokenAs, "%" + oldToken.string, newTokenAs, cm);
						newTokenAs = "text(" + newToken + ")";
						replaceAllToken(newTokenAs, "text(" + oldToken.string + ")", newTokenAs, cm);
						oldToken.string = newToken;
					}
					else if(tokenList[tokenIndx].string === "name" && !isLower(oldToken.string.charAt(0))){
						newToken = CodeMirror.isl.lowerCaseFirstLetter(oldToken.string);
						newTokenAs = "@" + newToken;
						regexpOldTokenAs = new RegExp('@' + oldToken.string + '(?!\\w)', 'g');               //@ + string of oldToken not followed by alphanumeric
						doc.replaceRange(newToken, tokenStart, tokenEnd, oldToken.string);
						replaceAllToken(regexpOldTokenAs, "@" + oldToken.string, newTokenAs, cm);
						oldToken.string = newToken;
					}
				}
			}
		}
	};


	/**
	 * check from "hasRequiredTag" and
	 * change variable name "oldToken" first character to upper-case
	 * and where it is used
	 * @method updateCase
	 * @param {Object} cm: CodeMirrror object
	 */
	CodeMirror.commands.updateToUpper = function (cm) {

		var doc= cm.doc, atAttrValue = 2,
			tokenList, oldToken, newToken, newTokenAs, 
			tokenIndx, tokenStart, tokenEnd,
			lineIndx,
			totalLine = doc.lineCount(),
			regexpOldTokenAs;

		for (lineIndx = 0; lineIndx < totalLine; lineIndx++) {
			tokenList = cm.getLineTokens(lineIndx);
			if (tokenList.length > 0 && hasRequiredTag(tokenList)){
				for (tokenIndx = 0; tokenIndx < tokenList.length - atAttrValue; tokenIndx++) {
					oldToken = tokenList[tokenIndx + atAttrValue];
					tokenStart = {line: lineIndx, ch: oldToken.start};
					tokenEnd = {line: lineIndx, ch: oldToken.end};
					if(tokenList[tokenIndx].string === "ref" && !isUpper(oldToken.string.charAt(0))) {
						newToken = CodeMirror.isl.upperCaseFirstLetter(oldToken.string);
						doc.replaceRange(newToken, tokenStart, tokenEnd, oldToken.string);
						newTokenAs = "%" + newToken;
						regexpOldTokenAs = new RegExp('%' + oldToken.string + '(?!\\w)', 'g');                   //% + string of oldToken not followed by alphanumeric
						replaceAllToken(regexpOldTokenAs, "%" + oldToken.string, newTokenAs, cm);
						newTokenAs = "text(" + newToken + ")";
						replaceAllToken(newTokenAs, "text(" + oldToken.string + ")", newTokenAs, cm);
						oldToken.string = newToken;
					}
					else if(tokenList[tokenIndx].string === "name" && !isUpper(oldToken.string.charAt(0))){
						newToken = CodeMirror.isl.upperCaseFirstLetter(oldToken.string);
						newTokenAs = "@" + newToken;
						regexpOldTokenAs = new RegExp('@' + oldToken.string + '(?!\\w)', 'g');                   //@ + string of oldToken not followed by alphanumeric
						doc.replaceRange(newToken, tokenStart, tokenEnd, oldToken.string);
						replaceAllToken(regexpOldTokenAs, "@" + oldToken.string, newTokenAs, cm);
						oldToken.string = newToken;
					}
				}
			}
		}
	};


	/**
	 * @method upperCaseFirstLetter
	 * @param {String} value
	 * @return {String} return "value" 's first char to upper-case
	 */
	CodeMirror.isl.upperCaseFirstLetter = function(value) {
		return value.charAt(0).toUpperCase() + value.slice(1);
	}

	/**
	 * @method lowerCaseFirstLetter
	 * @param {String} value
	 * @return {String} return "value" 's first char to lower-case
	 */
	CodeMirror.isl.lowerCaseFirstLetter = function(value) {
		return value.charAt(0).toLowerCase() + value.slice(1);
	}


	/**
	 * check whether the "value" is in lower-case
	 * @method isLower
	 * @param {String} value
	 * @return {String} return bool
	 */
	function isLower(value) {
		return value.toLowerCase() === value;
	}


	/**
	 * check whether the "value" is in upper-case
	 * @method isUpper
	 * @param {String} value
	 * @return {String} return bool
	 */
	function isUpper(value) {
		return value.toUpperCase() === value;
	}
});
