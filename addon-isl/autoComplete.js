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
 * Add-on for auto-completion of tags,
 * use the list of isl-tags.js
 * to show hints
 */
(function(mod) {
    if(!CodeMirror.isl){
        CodeMirror.isl={};
    }
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

    CodeMirror.defineOption("autoComplete", false, function(cm, val, old) {
        if (val) {
            var mapExtraKeys = {
                "'<'": "completeAfter",
                "' '": "completeIfInTag",
                "'='": "completeIfInTag",
                "Ctrl-Space": "autocomplete"
            },
            mapHintOptions = {
                schemaInfo: CodeMirror.isl.tags
            };
            cm.options.extraKeys = Object.assign({}, mapExtraKeys, cm.options.extraKeys)
            cm.options.hintOptions = Object.assign({}, mapHintOptions, cm.options.hintOptions)
        }
    });


    /**
     * show hint as per listed tags at cursor position
     *
     * @method completeAfter
     * @param {Object} cm: CodeMirror object
     * @param {function} pred: get current cursors tag name
     */
    CodeMirror.commands.completeAfter = function (cm, pred) {
        if (!pred || pred()){
            setTimeout(function() {
                if (!cm.state.completionActive){
                    cm.showHint({completeSingle: false});
                }   
            }, 100);
        } 
        return CodeMirror.Pass;
    }


    /**
     * show hint of attributes of tags at cursor position
     * replace the variable name to lower-case, if any
     *
     * @method completeIfInTag
     * @param {Object} cm: CodeMirror object
     */
    CodeMirror.commands.completeIfInTag = function (cm) {
        
        var attr,
            cursorPos = cm.getCursor(),
            token = cm.getTokenAt(cursorPos),
            tokString = token.string,
            tokenLength = tokString.length,
            tokenStart, tokenEnd,
            regexpQuotes = /['"]/g,
            regexpName = /name=/g,
            regexpRef = /ref=/g,
            maxAttrLength = 5;

        return CodeMirror.commands.completeAfter(cm, function() {
        if (token.type === "string" && (!regexpQuotes.test(tokString.charAt(tokenLength - 1)) || tokenLength === 1)){
            return false;
        }

        //#region caseChange
        //Change the attribute value's first case to lowercase/uppercase in ISL while typing
        attr = cm.doc.getRange({line: cursorPos.line, ch: token.start - maxAttrLength}, {line: cursorPos.line, ch: token.end - tokenLength})
        tokenStart = {line: cursorPos.line, ch: token.start};
        tokenEnd = {line: cursorPos.line, ch: token.end};
        if (token.type === "attribute" && ((regexpName.test(attr))||(regexpRef.test(attr)))){
            if (cm.options.changeCase && cm.options.changeCase.upperCase) {
                cm.doc.replaceRange(CodeMirror.isl.upperCaseFirstLetter(tokString), tokenStart, tokenEnd, tokString);
                token.string = CodeMirror.isl.upperCaseFirstLetter(tokString);
            }else {
                cm.doc.replaceRange(CodeMirror.isl.lowerCaseFirstLetter(tokString), tokenStart, tokenEnd, tokString);
                token.string = CodeMirror.isl.lowerCaseFirstLetter(tokString);
            }
        }
        //#endregion caseChange

        return CodeMirror.innerMode(cm.getMode(), token.state).state.tagName;
        });
    }

});
