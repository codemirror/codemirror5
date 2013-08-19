/*
Copyright (c) 2008-2009 Yahoo! Inc. All rights reserved.
The copyrights embodied in the content of this file are licensed by
Yahoo! Inc. under the BSD (revised) open source license

@author Dan Vlad Dascalescu <dandv@yahoo-inc.com>

Based on parsehtmlmixed.js by Marijn Haverbeke.
*/

var PHPHTMLMixedParser = Editor.Parser = (function() {
  var processingInstructions = ["<?php"];

  if (!(PHPParser && CSSParser && JSParser && XMLParser))
    throw new Error("PHP, CSS, JS, and XML parsers must be loaded for PHP+HTML mixed mode to work.");
  XMLParser.configure({useHTMLKludges: true});

  function parseMixed(stream) {
    var htmlParser = XMLParser.make(stream), localParser = null,
        inTag = false, lastAtt = null, phpParserState = null;
    var iter = {next: top, copy: copy};

    function top() {
      var token = htmlParser.next();
      if (token.content == "<")
        inTag = true;
      else if (token.style == "xml-tagname" && inTag === true)
        inTag = token.content.toLowerCase();
      else if (token.style == "xml-attname")
        lastAtt = token.content;
      else if (token.type == "xml-processing") {
        // see if this opens a PHP block
        for (var i = 0; i < processingInstructions.length; i++)
          if (processingInstructions[i] == token.content) {
            iter.next = local(PHPParser, "?>");
            break;
          }
      }
      else if (token.style == "xml-attribute" && token.content == "\"php\"" && inTag == "script" && lastAtt == "language")
        inTag = "script/php";
      // "xml-processing" tokens are ignored, because they should be handled by a specific local parser
      else if (token.content == ">") {
        if (inTag == "script/php")
          iter.next = local(PHPParser, "</script>");
        else if (inTag == "script")
          iter.next = local(JSParser, "</script");
        else if (inTag == "style")
          iter.next = local(CSSParser, "</style");
        lastAtt = null;
        inTag = false;
      }
      return token;
    }
    function local(parser, tag) {
      var baseIndent = htmlParser.indentation();
      if (parser == PHPParser && phpParserState)
        localParser = phpParserState(stream);
      else
        localParser = parser.make(stream, baseIndent + indentUnit);

      return function() {
        if (stream.lookAhead(tag, false, false, true)) {
          if (parser == PHPParser) phpParserState = localParser.copy();
          localParser = null;
          iter.next = top;
          return top();  // pass the ending tag to the enclosing parser
        }

        var token = localParser.next();
        var lt = token.value.lastIndexOf("<"), sz = Math.min(token.value.length - lt, tag.length);
        if (lt != -1 && token.value.slice(lt, lt + sz).toLowerCase() == tag.slice(0, sz) &&
            stream.lookAhead(tag.slice(sz), false, false, true)) {
          stream.push(token.value.slice(lt));
          token.value = token.value.slice(0, lt);
        }

        if (token.indentation) {
          var oldIndent = token.indentation;
          token.indentation = function(chars) {
            if (chars == "</")
              return baseIndent;
            else
              return oldIndent(chars);
          }
        }

        return token;
      };
    }

    function copy() {
      var _html = htmlParser.copy(), _local = localParser && localParser.copy(),
          _next = iter.next, _inTag = inTag, _lastAtt = lastAtt, _php = phpParserState;
      return function(_stream) {
        stream = _stream;
        htmlParser = _html(_stream);
        localParser = _local && _local(_stream);
        phpParserState = _php;
        iter.next = _next;
        inTag = _inTag;
        lastAtt = _lastAtt;
        return iter;
      };
    }
    return iter;
  }

  return {
    make: parseMixed,
    electricChars: "{}/:",
    configure: function(conf) {
      if (conf.opening != null) processingInstructions = conf.opening;
    }
  };

})();
