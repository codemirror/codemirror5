(function () {
  "use strict";

  var tables;
  var keywords;
  var CONS = {
    QUERY_DIV: ";",
    ALIAS_KEYWORD: "AS"
  };

  function getKeywords(editor) {
    var mode = editor.doc.modeOption;
    if(mode === "sql") mode = "text/x-sql";
    return CodeMirror.resolveMode(mode).keywords;
  }

  function match(string, word) {
    var len = string.length;
    var sub = word.substr(0, len);
    return string.toUpperCase() === sub.toUpperCase();
  }

  function addMatches(result, search, wordlist, formatter) {
    for(var word in wordlist) {
      if(!wordlist.hasOwnProperty(word)) continue;
      if(Array.isArray(wordlist)) {
        word = wordlist[word];
      }
      if(match(search, word)) {
        result.push(formatter(word));
      }
    }
  }

  function columnCompletion(result, editor) {
    var cur = editor.getCursor();
    var token = editor.getTokenAt(cur);
    var string = token.string.substr(1);
    var prevCur = CodeMirror.Pos(cur.line, token.start);
    var table = editor.getTokenAt(prevCur).string;
    if( !tables.hasOwnProperty( table ) ){
      table = findTableByAlias(table, editor);
    }
    var columns = tables[table];
    if(!columns) {
      return;
    }
    addMatches(result, string, columns,
        function(w) {return "." + w;});
  }

  function eachWord(lineText, f) {
    if( !lineText ){return;}
    var excepted = /[,;]/g;
    var words = lineText.split( " " );
    for( var i = 0; i < words.length; i++ ){
      f( words[i]?words[i].replace( excepted, '' ) : '' );
    }
  }

  function indexOf( collection, elt ){
    if( collection.indexOf ) return collection.indexOf( elt );
    for( var i = 0, e = collection.length; i < e; ++i )
      if( collection[i] == elt ) return i;
    return -1;
  }

  function getLineNo( line ){
    if( line.parent == null ) return null;
    var cur = line.parent, no = indexOf( cur.lines, line );
    for( var chunk = cur.parent; chunk; cur = chunk, chunk = chunk.parent ){
      for( var i = 0; ; ++i ){
        if( chunk.children[i] == cur ) break;
        no += chunk.children[i].chunkSize();
      }
    }
    return no + cur.first;
  }

  function getLineText( line, range ){
    if( !range.start || !range.end ){
      return;
    }
    var currentLineNo = getLineNo( line );
    var lineText = "";      //default value is blank string.
    if( range.start.line === range.end.line ){
      lineText = line.text.substr( range.start.ch, range.end.ch - range.start.ch );
    }else if( range.start.line === currentLineNo ){
      lineText = line.text.substr( range.start.ch + 1 );
    }else if( range.end.line === currentLineNo ){
      lineText = line.text.substr( 0, range.end.ch + 1 );
    }else{
      lineText = line.text;
    }
    return lineText?lineText:"";
  }

  function convertCurToNumber( cur ){
    // max characters of a line is 999,999.
    return cur.line + cur.ch / Math.pow( 10, 6 );
  }

  function convertNumberToCur( num ){
    return {
      line: Math.floor( num ),
      ch: +num.toString().split( '.' ).pop()
    }
  }

  function generateCursor( lineNum, charNum ){
      return { line: lineNum, ch: charNum };
  }

  function findTableByAlias(alias, editor) {
    var aliasUpperCase = alias.toUpperCase();
    var previousWord = "";
    var table = "";
    var cur = editor.getCursor();
    var separator = [];
    var lineNum = 0;
    var validRange = {
      start: generateCursor( 0, 0 ),
      end: generateCursor( editor.lastLine(), editor.getLineHandle( editor.lastLine() ).length )
    };

    //add separator
    separator.push( generateCursor( 0, 0 ) );
    editor.eachLine( function( line ){
      if( line.text.indexOf( CONS.QUERY_DIV ) > -1 ){
        separator.push( generateCursor( lineNum, line.text.indexOf( CONS.QUERY_DIV ) ) );
      }
      lineNum++;
    } );
    separator.push( generateCursor( editor.lastLine(), editor.getLineHandle( editor.lastLine() ).text.length ) );

    //find valieRange
    var prevItem = 0;
    var current = convertCurToNumber( cur );
    separator.forEach( function( item ){
      var _v = convertCurToNumber( item );
      if( current > prevItem && current <= _v ){
        validRange = {
          start: convertNumberToCur( prevItem ),
          end: convertNumberToCur( _v )
        };
      }
      prevItem = _v;
    } );

    editor.eachLine( validRange.start.line, validRange.end.line + 1, function( line ){
      var lineText = getLineText( line, validRange );

      eachWord( lineText, function( word ){
        var wordUpperCase = word.toUpperCase();
        if( wordUpperCase === aliasUpperCase ){
          if( tables.hasOwnProperty( previousWord ) ){
            table = previousWord;
          }
        }
        if( wordUpperCase !== CONS.ALIAS_KEYWORD ){
          previousWord = word;
        }
      } );
    } );
    return table;
  }

  function sqlHint(editor, options) {
    tables = (options && options.tables) || {};
    keywords = keywords || getKeywords(editor);
    var cur = editor.getCursor();
    var token = editor.getTokenAt(cur);

    var result = [];

    var search = token.string.trim();

    addMatches(result, search, keywords,
        function(w) {return w.toUpperCase();});

    addMatches(result, search, tables,
        function(w) {return w;});

    if(search.lastIndexOf('.') === 0) {
      columnCompletion(result, editor);
    }

    return {
      list: result,
        from: CodeMirror.Pos(cur.line, token.start),
        to: CodeMirror.Pos(cur.line, token.end)
    };
  }
  CodeMirror.registerHelper("hint", "sql", sqlHint);
})();
