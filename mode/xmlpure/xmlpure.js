/**
 * xmlpure.js
 * 
 * Building upon and improving the CodeMirror 2 XML parser
 * @author: Dror BG (deebug.dev@gmail.com)
 * @date: August, 2011
 */

CodeMirror.defineMode("xmlpure", function(config, parserConfig) {
    // constants
    var STYLE_ERROR = "error";
    var STYLE_INSTRUCTION = "comment";
    var STYLE_COMMENT = "comment";
    var STYLE_ELEMENT_NAME = "tag";
    var STYLE_ATTRIBUTE = "attribute";
    var STYLE_WORD = "string";
    var STYLE_TEXT = "atom";

    var TAG_INSTRUCTION = "!instruction";
    var TAG_CDATA = "!cdata";
    var TAG_COMMENT = "!comment";
    var TAG_TEXT = "!text";
    
    var doNotIndent = {
        "!cdata": true,
        "!comment": true,
        "!text": true,
        "!instruction": true
    };

    // options
    var indentUnit = config.indentUnit;

    ///////////////////////////////////////////////////////////////////////////
    // helper functions
    
    // chain a parser to another parser
    function chain(stream, state, parser) {
        state.tokenize = parser;
        return parser(stream, state);
    }
    
    // parse a block (comment, CDATA or text)
    function inBlock(style, terminator, nextTokenize) {
        return function(stream, state) {
            while (!stream.eol()) {
                if (stream.match(terminator)) {
                    popContext(state);
                    state.tokenize = nextTokenize;
                    break;
                }
                stream.next();
            }
            return style;
        };
    }
    
    // go down a level in the document
    // (hint: look at who calls this function to know what the contexts are)
    function pushContext(state, tagName) {
        var noIndent = doNotIndent.hasOwnProperty(tagName) || (state.context && state.context.doIndent);
        var newContext = {
            tagName: tagName,
            prev: state.context,
            indent: state.context ? state.context.indent + indentUnit : 0,
            lineNumber: state.lineNumber,
            indented: state.indented,
            noIndent: noIndent
        };
        state.context = newContext;
    }
    
    // go up a level in the document
    function popContext(state) {
        if (state.context) {
            var oldContext = state.context;
            state.context = oldContext.prev;
            return oldContext;
        }
        
        // we shouldn't be here - it means we didn't have a context to pop
        return null;
    }
    
    // return true if the current token is seperated from the tokens before it
    // which means either this is the start of the line, or there is at least
    // one space or tab character behind the token
    // otherwise returns false
    function isTokenSeparated(stream) {
        return stream.sol() ||
            stream.string.charAt(stream.start - 1) == " " ||
            stream.string.charAt(stream.start - 1) == "\t";
    }
    
    ///////////////////////////////////////////////////////////////////////////
    // context: document
    // 
    // an XML document can contain:
    // - a single declaration (if defined, it must be the very first line)
    // - exactly one root element
    // @todo try to actually limit the number of root elements to 1
    // - zero or more comments
    function parseDocument(stream, state) {
        if(stream.eat("<")) {
            if(stream.eat("?")) {
                // processing instruction
                pushContext(state, TAG_INSTRUCTION);
                state.tokenize = parseProcessingInstructionStartTag;
                return STYLE_INSTRUCTION;
            } else if(stream.match("!--")) {
                // new context: comment
                pushContext(state, TAG_COMMENT);
                return chain(stream, state, inBlock(STYLE_COMMENT, "-->", parseDocument));
            } else if(stream.eatSpace() || stream.eol() ) {
                stream.skipToEnd();
                return STYLE_ERROR;
            } else {
                // element
                state.tokenize = parseElementTagName;
                return STYLE_ELEMENT_NAME;
            }
        }
        
        // error on line
        stream.skipToEnd();
        return STYLE_ERROR;
    }

    ///////////////////////////////////////////////////////////////////////////
    // context: XML element start-tag or end-tag
    //
    // - element start-tag can contain attributes
    // - element start-tag may self-close (or start an element block if it doesn't)
    // - element end-tag can contain only the tag name
    function parseElementTagName(stream, state) {
        // get the name of the tag
        var startPos = stream.pos;
        if(stream.match(/^[a-zA-Z_:][-a-zA-Z0-9_:.]*/)) {
            // element start-tag
            var tagName = stream.string.substring(startPos, stream.pos);
            pushContext(state, tagName);
            state.tokenize = parseElement;
            return STYLE_ELEMENT_NAME;
        } else if(stream.match(/^\/[a-zA-Z_:][-a-zA-Z0-9_:.]*( )*>/)) {
            // element end-tag
            var endTagName = stream.string.substring(startPos + 1, stream.pos - 1).trim();
            var oldContext = popContext(state);
            state.tokenize = state.context == null ? parseDocument : parseElementBlock;
            if(oldContext == null || endTagName != oldContext.tagName) {
                // the start and end tag names should match - error
                return STYLE_ERROR;
            }
            return STYLE_ELEMENT_NAME;
        } else {
            // no tag name - error
            state.tokenize = state.context == null ? parseDocument : parseElementBlock;
            stream.eatWhile(/[^>]/);
            stream.eat(">");
            return STYLE_ERROR;
        }
        
        stream.skipToEnd();
        return null;
    }
    
    function parseElement(stream, state) {
        if(stream.match(/^\/>/)) {
            // self-closing tag
            popContext(state);
            state.tokenize = state.context == null ? parseDocument : parseElementBlock;
            return STYLE_ELEMENT_NAME;
        } else if(stream.eat(/^>/)) {
            state.tokenize = parseElementBlock;
            return STYLE_ELEMENT_NAME;
        } else if(isTokenSeparated(stream) && stream.match(/^[a-zA-Z_:][-a-zA-Z0-9_:.]*( )*=/)) {
            // attribute
            state.tokenize = parseAttribute;
            return STYLE_ATTRIBUTE;
        }
        
        // no other options - this is an error
        state.tokenize = state.context == null ? parseDocument : parseDocument;
        stream.eatWhile(/[^>]/);
        stream.eat(">");
        return STYLE_ERROR;
    }
    
    ///////////////////////////////////////////////////////////////////////////
    // context: attribute
    // 
    // attribute values may contain everything, except:
    // - the ending quote (with ' or ") - this marks the end of the value
    // - the character "<" - should never appear
    // - ampersand ("&") - unless it starts a reference: a string that ends with a semi-colon (";")
    // ---> note: this parser is lax in what may be put into a reference string,
    // ---> consult http://www.w3.org/TR/REC-xml/#NT-Reference if you want to make it tighter
    function parseAttribute(stream, state) {
        var quote = stream.next();
        if(quote != "\"" && quote != "'") {
            // attribute must be quoted
            stream.skipToEnd();
            state.tokenize = parseElement;
            return STYLE_ERROR;
        }
        
        state.tokParams.quote = quote;    
        state.tokenize = parseAttributeValue;
        return STYLE_WORD;
    }

    // @todo: find out whether this attribute value spans multiple lines,
    //        and if so, push a context for it in order not to indent it
    //        (or something of the sort..)
    function parseAttributeValue(stream, state) {
        var ch = "";
        while(!stream.eol()) {
            ch = stream.next();
            if(ch == state.tokParams.quote) {
                // end quote found
                state.tokenize = parseElement;
                return STYLE_WORD;
            } else if(ch == "<") {
                // can't have less-than signs in an attribute value, ever
                stream.skipToEnd()
                state.tokenize = parseElement;
                return STYLE_ERROR;
            } else if(ch == "&") {
                // reference - look for a semi-colon, or return error if none found
                ch = stream.next();
                
                // make sure that semi-colon isn't right after the ampersand
                if(ch == ';') {
                    stream.skipToEnd()
                    state.tokenize = parseElement;
                    return STYLE_ERROR;
                }
                
                // make sure no less-than characters slipped in
                while(!stream.eol() && ch != ";") {
                    if(ch == "<") {
                        // can't have less-than signs in an attribute value, ever
                        stream.skipToEnd()
                        state.tokenize = parseElement;
                        return STYLE_ERROR;
                    }
                    ch = stream.next();
                }
                if(stream.eol() && ch != ";") {
                    // no ampersand found - error
                    stream.skipToEnd();
                    state.tokenize = parseElement;
                    return STYLE_ERROR;
                }                
            }
        }
        
        // attribute value continues to next line
        return STYLE_WORD;
    }
    
    ///////////////////////////////////////////////////////////////////////////
    // context: element block
    //
    // a block can contain:
    // - elements
    // - text
    // - CDATA sections
    // - comments
    function parseElementBlock(stream, state) {
        if(stream.eat("<")) {
            if(stream.match("?")) {
                pushContext(state, TAG_INSTRUCTION);
                state.tokenize = parseProcessingInstructionStartTag;
                return STYLE_INSTRUCTION;
            } else if(stream.match("!--")) {
                // new context: comment
                pushContext(state, TAG_COMMENT);
                return chain(stream, state, inBlock(STYLE_COMMENT, "-->",
                    state.context == null ? parseDocument : parseElementBlock));
            } else if(stream.match("![CDATA[")) {
                // new context: CDATA section
                pushContext(state, TAG_CDATA);
                return chain(stream, state, inBlock(STYLE_TEXT, "]]>",
                    state.context == null ? parseDocument : parseElementBlock));
            } else if(stream.eatSpace() || stream.eol() ) {
                stream.skipToEnd();
                return STYLE_ERROR;
            } else {
                // element
                state.tokenize = parseElementTagName;
                return STYLE_ELEMENT_NAME;
            }
        } else {
            // new context: text
            pushContext(state, TAG_TEXT);
            state.tokenize = parseText;
            return null;
        }
        
        state.tokenize = state.context == null ? parseDocument : parseElementBlock;
        stream.skipToEnd();
        return null;
    }
    
    function parseText(stream, state) {
        stream.eatWhile(/[^<]/);
        if(!stream.eol()) {
            // we cannot possibly be in the document context,
            // just inside an element block
            popContext(state);
            state.tokenize = parseElementBlock;
        }
        return STYLE_TEXT;
    }

    ///////////////////////////////////////////////////////////////////////////
    // context: XML processing instructions
    //
    // XML processing instructions (PIs) allow documents to contain instructions for applications.
    // PI format: <?name data?>
    // - 'name' can be anything other than 'xml' (case-insensitive)
    // - 'data' can be anything which doesn't contain '?>'
    // XML declaration is a special PI (see XML declaration context below)
    function parseProcessingInstructionStartTag(stream, state) {
        if(stream.match("xml", true, true)) {
            // xml declaration
            if(state.lineNumber > 1 || stream.pos > 5) {
                state.tokenize = parseDocument;
                stream.skipToEnd();
                return STYLE_ERROR;
            } else {
                state.tokenize = parseDeclarationVersion;
                return STYLE_INSTRUCTION;
            }
        }

        // regular processing instruction
        if(isTokenSeparated(stream) || stream.match("?>")) {
            // we have a space after the start-tag, or nothing but the end-tag
            // either way - error!
            state.tokenize = parseDocument;
            stream.skipToEnd();
            return STYLE_ERROR;
        }

        state.tokenize = parseProcessingInstructionBody;
        return STYLE_INSTRUCTION;
    }

    function parseProcessingInstructionBody(stream, state) {
        stream.eatWhile(/[^?]/);
        if(stream.eat("?")) {
            if(stream.eat(">")) {
                popContext(state);
                state.tokenize = state.context == null ? parseDocument : parseElementBlock;
            }
        }
        return STYLE_INSTRUCTION;
    }

    
    ///////////////////////////////////////////////////////////////////////////
    // context: XML declaration
    //
    // XML declaration is of the following format:
    // <?xml version="1.0" encoding="UTF-8" standalone="no" ?>
    // - must start at the first character of the first line
    // - may span multiple lines
    // - must include 'version'
    // - may include 'encoding' and 'standalone' (in that order after 'version')
    // - attribute names must be lowercase
    // - cannot contain anything else on the line
    function parseDeclarationVersion(stream, state) {
        state.tokenize = parseDeclarationEncoding;
        
        if(isTokenSeparated(stream) && stream.match(/^version( )*=( )*"([a-zA-Z0-9_.:]|\-)+"/)) {
            return STYLE_INSTRUCTION;
        }
        stream.skipToEnd();
        return STYLE_ERROR;
    }

    function parseDeclarationEncoding(stream, state) {
        state.tokenize = parseDeclarationStandalone;
        
        if(isTokenSeparated(stream) && stream.match(/^encoding( )*=( )*"[A-Za-z]([A-Za-z0-9._]|\-)*"/)) {
            return STYLE_INSTRUCTION;
        }
        return null;
    }

    function parseDeclarationStandalone(stream, state) {
        state.tokenize = parseDeclarationEndTag;
        
        if(isTokenSeparated(stream) && stream.match(/^standalone( )*=( )*"(yes|no)"/)) {
            return STYLE_INSTRUCTION;
        }
        return null;
    }

    function parseDeclarationEndTag(stream, state) {
        state.tokenize = parseDocument;
        
        if(stream.match("?>") && stream.eol()) {
            popContext(state);
            return STYLE_INSTRUCTION;
        }
        stream.skipToEnd();
        return STYLE_ERROR;
    }

    ///////////////////////////////////////////////////////////////////////////
    // returned object
    return {
        electricChars: "/[",
        
        startState: function() {
            return {
                tokenize: parseDocument,
                tokParams: {},
                lineNumber: 0,
                lineError: false,
                context: null,
                indented: 0
            };
        },

        token: function(stream, state) {
            if(stream.sol()) {
                // initialize a new line
                state.lineNumber++;
                state.lineError = false;
                state.indented = stream.indentation();
            }

            // eat all (the spaces) you can
            if(stream.eatSpace()) return null;

            // run the current tokenize function, according to the state
            var style = state.tokenize(stream, state);
            
            // is there an error somewhere in the line?
            state.lineError = (state.lineError || style == "error");

            return style;
        },
        
        blankLine: function(state) {
            // blank lines are lines too!
            state.lineNumber++;
            state.lineError = false;
        },
        
        indent: function(state, textAfter) {
            if(state.context) {
                if(state.context.noIndent == true) {
                    // do not indent - no return value at all
                    return;
                }
                if(textAfter.match(/^<\/.*/)) {
                    // end-tag - indent back to last context
                    return state.context.indent;
                }
                if(textAfter.match(/^<!\[CDATA\[/)) {
                    // a stand-alone CDATA start-tag - indent back to column 0
                    return 0;                
                }
                // indent to last context + regular indent unit
                return state.context.indent + indentUnit;
            }
            return 0;
        },
        
        compareStates: function(a, b) {
            if (a.indented != b.indented) return false;
            for (var ca = a.context, cb = b.context; ; ca = ca.prev, cb = cb.prev) {
                if (!ca || !cb) return ca == cb;
                if (ca.tagName != cb.tagName) return false;
            }
        }
    };
});

CodeMirror.defineMIME("application/xml", "purexml");
CodeMirror.defineMIME("text/xml", "purexml");
