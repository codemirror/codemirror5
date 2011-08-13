CodeMirror.defineMode("velocity", function(config) {
    function parseWords(str) {
        var obj = {}, words = str.split(" ");
        for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
        return obj;
    }
    var type;
    var inParams=false;
    var indentUnit = config.indentUnit
    var keywords = parseWords("#end #else #break #stop #[[ #]] " +
                              "#{end} #{else} #{break} #{stop}");
    var functions = parseWords("#if #elseif #foreach #set #include #parse #macro #define #evaluate " +
                               "#{if} #{elseif} #{foreach} #{set} #{include} #{parse} #{macro} #{define} #{evaluate}");
    var specials = parseWords("$foreach.count $foreach.hasNext $foreach.first $foreach.last $foreach.topmost $foreach.parent $velocityCount");
    var isOperatorChar = /[+\-*&%=<>!?:\/|]/;
    var multiLineStrings =true;

    function chain(stream, state, f) {
        state.tokenize = f;
        return f(stream, state);
    }
    function ret(tp, style) {
        type = tp;
        return style;
    }
    function tokenBase(stream, state) {
        var ch = stream.next();
        // start of string?
        if ((ch == '"' || ch == "'") && inParams)
            return chain(stream, state, tokenString(ch));
        // is it one of the special signs []{}().,;? Seperator?
        else if (/[\[\]{}\(\),;\.]/.test(ch)) {
            if (/[\(\)]/.test(ch)) inParams=(type=="function" || type=="method");
            return ret(ch);
        }
        // start of a number value?
        else if (/\d/.test(ch)) {
            stream.eatWhile(/[\w\.]/);
            return ret("number", "number");
        }
        // multi line comment?
        else if (ch == "#" && stream.eat("*")) {
            return chain(stream, state, tokenComment);
        }
        // unparsed content?
        else if (ch == "#" && stream.match(/ *\[ *\[/)) {
            return chain(stream, state, tokenUnparsed);
        }
        // single line comment?
        else if (ch == "#" && stream.eat("#")) {
            stream.skipToEnd();
            return ret("comment", "comment");
        }
        // variable?
        else if (ch == "$") {
            stream.eatWhile(/[\w\d\$_\.{}]/);
            // is it one of the specials?
            if (specials && specials.propertyIsEnumerable(stream.current().toLowerCase()))
                return ret("keyword", "special");
            else
                return ret("method", "builtin");
        }
        // is it a operator?
        else if (isOperatorChar.test(ch)) {
            stream.eatWhile(isOperatorChar);
            return ret("operator", "operator");
        }
        else {
            // get the whole word
            stream.eatWhile(/[\w\$_{}]/);
            // is it one of the listed keywords?
            if (keywords && keywords.propertyIsEnumerable(stream.current().toLowerCase()))
                return ret("keyword", "keyword");
            // is it one of the listed functions?
            if (functions && functions.propertyIsEnumerable(stream.current().toLowerCase()))
                return ret("function", "keyword");
            if (stream.current().match(/^#[a-z0-9_]+ *$/i) && stream.peek()=="(")
                return ret("function", "keyword");
            // default: just a "word"
            return ret("word", "word");
        }
    }

    function tokenString(quote) {
        return function(stream, state) {
            var escaped = false, next, end = false;
            while ((next = stream.next()) != null) {
                if (next == quote && !escaped) {
                    end = true;
                    break;
                }
                escaped = !escaped && next == "\\";
            }
            if (end || !(escaped || multiLineStrings))
                state.tokenize = tokenBase;
            return ret("string", "string");
        };
    }

    function tokenComment(stream, state) {
        var maybeEnd = false, ch;
        while (ch = stream.next()) {
            if (ch == "#" && maybeEnd) {
                state.tokenize = tokenBase;
                break;
            }
            maybeEnd = (ch == "*");
        }
        return ret("comment", "comment");
    }

    function tokenUnparsed(stream, state) {
        var maybeEnd = 0, ch;
        while (ch = stream.next()) {
            if (ch == "#" && maybeEnd == 2) {
                state.tokenize = tokenBase;
                break;
            }
            if (ch == "]")
                maybeEnd++;
            else if (ch != " ")
                maybeEnd = 0;
        }
        return "meta";
    }
    // Interface

    return {
        startState: function(basecolumn) {
            return {
                tokenize: tokenBase,
                startOfLine: true
            };
        },

        token: function(stream, state) {
            if (stream.eatSpace()) return null;
            return state.tokenize(stream, state);
        }
    };
});

CodeMirror.defineMIME("text/velocity", "velocity");
