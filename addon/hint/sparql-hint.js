(function (mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("/lib/codemirror"), require("/mode/sparql/sparql"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["/lib/codemirror", "/mode/sparql/sparql"], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function (CodeMirror) {
    "use strict";

    var tables;
    var defaultTable;
    var SPARQL_PREFIX =[
        'PREFIX adms: <http://www.w3.org/ns/adms#>',
        'PREFIX dawgt: <http://www.w3.org/2001/sw/DataAccess/tests/test-dawg#>',
        'PREFIX dbpedia: <http://dbpedia.org/resource/>',
        'PREFIX dbpprop: <http://dbpedia.org/property/>',
        'PREFIX dc: <http://purl.org/dc/elements/1.1/>',
        'PREFIX dcat: <http://www.w3.org/ns/dcat#>',
        'PREFIX dct: <http://purl.org/dc/terms/>',
        'PREFIX fn: <http://www.w3.org/2005/xpath-functions/#>',
        'PREFIX foaf: <http://xmlns.com/foaf/0.1/>',
        'PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>',
        'PREFIX go: <http://purl.org/obo/owl/GO#>',
        'PREFIX ldp: <http://www.w3.org/ns/ldp#>',
        'PREFIX math: <http://www.w3.org/2000/10/swap/math#>',
        'PREFIX mesh: <http://purl.org/commons/record/mesh/>',
        'PREFIX mf: <http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#>',
        'PREFIX nci: <http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl#>',
        'PREFIX obo: <http://www.geneontology.org/formats/oboInOwl#>',
        'PREFIX ogc: <http://www.opengis.net/>',
        'PREFIX ogcgml: <http://www.opengis.net/ont/gml#>',
        'PREFIX ogcgs: <http://www.opengis.net/ont/geosparql#>',
        'PREFIX ogcgsf: <http://www.opengis.net/def/function/geosparql/>',
        'PREFIX ogcgsr: <http://www.opengis.net/def/rule/geosparql/>',
        'PREFIX ogcsf: <http://www.opengis.net/ont/sf#>',
        'PREFIX org: <http://www.w3.org/ns/org#>',
        'PREFIX owl: <http://www.w3.org/2002/07/owl#>',
        'PREFIX product: <http://www.buy.com/rss/module/productV2/>',
        'PREFIX protseq: <http://purl.org/science/protein/bysequence/>',
        'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>',
        'PREFIX rdfa: <http://www.w3.org/ns/rdfa#>',
        'PREFIX rdfdf: <http://www.openlinksw.com/virtrdf-data-formats#>',
        'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>',
        'PREFIX sc: <http://purl.org/science/owl/sciencecommons/>',
        'PREFIX schema: <http://schema.org/>',
        'PREFIX scovo: <http://purl.org/NET/scovo#>',
        'PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>',
        'PREFIX sioc: <http://rdfs.org/sioc/ns#>',
        'PREFIX skos: <http://www.w3.org/2004/02/skos/core#>',
        'PREFIX spdx: <http://spdx.org/rdf/terms#>',
        'PREFIX vcard2006: <http://www.w3.org/2006/vcard/ns#>',
        'PREFIX vcard: <http://www.w3.org/2001/vcard-rdf/3.0#>',
        'PREFIX virtcxml: <http://www.openlinksw.com/schemas/virtcxml#>',
        'PREFIX virtrdf: <http://www.openlinksw.com/schemas/virtrdf#>',
        'PREFIX void: <http://rdfs.org/ns/void#>',
        'PREFIX xf: <http://www.w3.org/2004/07/xpath-functions>',
        'PREFIX xml: <http://www.w3.org/XML/1998/namespace>',
        'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>',
        'PREFIX xsl10: <http://www.w3.org/XSL/Transform/1.0>',
        'PREFIX xsl1999: <http://www.w3.org/1999/XSL/Transform>',
        'PREFIX xslwd: <http://www.w3.org/TR/WD-xsl>',
        'PREFIX yago: <http://dbpedia.org/class/yago/>']
    var SPARQL_KEYWORDS = [
        'SELECT', 'SELECT * WHERE {\n\n}','SELECT * WHERE {?s ?p ?o}', 'OPTIONAL', 'OPTIONAL {\n\n}', 'WHERE',
        'WHERE {\n\n}', 'ORDER', 'ORDER BY', 'DISTINCT', 'SERVICE','BASE',
        'PREFIX', 'REDUCED', 'FROM', 'LIMIT', 'OFFSET', 'HAVING', 'UNION', 'SAMPLE',
        '(SAMPLE() AS )', 'COUNT', '(COUNT() AS )', 'DESC', 'DESC()', 'ASC', 'ASC()',
        'FILTER ()', 'FILTER NOT EXISTS', 'FILTER NOT EXISTS {\n\n}', 'UNION', 'UNION {\n\n}',
        'BIND', 'BIND ()', 'GROUP_CONCAT', '(GROUP_CONCAT() as )', 'ORDER BY'
    ];

    var SPARQL_PREDICATES = [
        // wikibase:
        // property predicates
        'wikibase:rank', 'wikibase:badge', 'wikibase:propertyType', 'wikibase:directClaim',
        'wikibase:claim', 'wikibase:statementProperty', 'wikibase:statementValue',
        'wikibase:qualifier', 'wikibase:qualifierValue', 'wikibase:reference', 'wikibase:referenceValue',
        'wikibase:statementValueNormalized', 'wikibase:qualifierValueNormalized',
        'wikibase:referenceValueNormalized', 'wikibase:novalue',
        // entity types
        'wikibase:Property', // 'wikibase:Item' disabled on WDQS for performance reasons
        // data types
        'wikibase:Reference', 'wikibase:Dump', // 'wikibase:Statement' disabled on WDQS for performance reasons
        // ranks
        'wikibase:PreferredRank', 'wikibase:NormalRank', 'wikibase:DeprecatedRank', 'wikibase:BestRank',
        // value types
        'wikibase:TimeValue', 'wikibase:QuantityValue', 'wikibase:GlobecoordinateValue',
        // property types
        'wikibase:WikibaseItem', 'wikibase:CommonsMedia', 'wikibase:GlobeCoordinate',
        'wikibase:Monolingualtext', 'wikibase:Quantity', 'wikibase:String', 'wikibase:Time',
        'wikibase:Url', 'wikibase:ExternalId', 'wikibase:WikibaseProperty', 'wikibase:Math',
        // pageprops
        'wikibase:statements', 'wikibase:sitelinks',
        // time
        'wikibase:timeValue', 'wikibase:timePrecision', 'wikibase:timeTimezone', 'wikibase:timeCalendarModel',
        // quantity
        'wikibase:quantityAmount', 'wikibase:quantityUpperBound', 'wikibase:quantityLowerBound',
        'wikibase:quantityUnit', 'wikibase:quantityNormalized',
        // coordinate
        'wikibase:geoLatitude', 'wikibase:geoLongitude', 'wikibase:geoPrecision', 'wikibase:geoGlobe',
        // other
        'wikibase:wikiGroup',
        // schema: things
        'schema:about', 'schema:name', 'schema:description', 'schema:dateModified',
        'schema:Article', 'schema:inLanguage', 'schema:isPartOf',
        // rdfs: things
        'rdfs:label', 'rdf:type',
        // skos: things
        'skos:altLabel',
        // xsd:
        'xsd:dateTime', 'xsd:integer', 'xsd:decimal',
        // geo:
        'geo:wktLiteral',
        // owl:
        'owl:sameAs',
        // prov:
        'prov:wasDerivedFrom'

    ];
    var identifierQuote;
    var CONS = {
        QUERY_DIV: ";",
        ALIAS_KEYWORD: "AS"
    };
    var Pos = CodeMirror.Pos, cmpPos = CodeMirror.cmpPos;

    function isArray(val) { return Object.prototype.toString.call(val) == "[object Array]" }

    function getKeywords(editor) {
        var mode = editor.doc.modeOption;
        if (mode === "sparql") mode = "/sparql/sparql";
        return CodeMirror.resolveMode(mode).keywords;
    }

    function getIdentifierQuote(editor) {
        var mode = editor.doc.modeOption;
        if (mode === "sparql") mode = "/sparql/sparql";
        return CodeMirror.resolveMode(mode).identifierQuote || "`";
    }

    function getText(item) {
        return typeof item == "string" ? item : item.text;
    }

    function wrapTable(name, value) {
        if (isArray(value)) value = { columns: value }
        if (!value.text) value.text = name
        return value
    }

    function parseTables(input) {
        var result = {}
        if (isArray(input)) {
            for (var i = input.length - 1; i >= 0; i--) {
                var item = input[i]
                result[getText(item).toUpperCase()] = wrapTable(getText(item), item)
            }
        } else if (input) {
            for (var name in input)
                result[name.toUpperCase()] = wrapTable(name, input[name])
        }
        return result
    }

    function getTable(name) {
        return tables[name.toUpperCase()]
    }

    function shallowClone(object) {
        var result = {};
        for (var key in object) if (object.hasOwnProperty(key))
            result[key] = object[key];
        return result;
    }

    function match(string, word) {
        var len = string.length;
        var sub = getText(word).substr(0, len);
        return string.toUpperCase() === sub.toUpperCase();
    }

    function addMatches(result, search, wordlist,predicateslist, prefixlist, formatter) {
        if (isArray(wordlist)) {
            for (var i = 0; i < wordlist.length; i++)
                if (match(search, wordlist[i])) result.push(formatter(wordlist[i]))
        } else {
            for (var word in wordlist) if (wordlist.hasOwnProperty(word)) {
                var val = wordlist[word]
                if (!val || val === true)
                    val = word
                else
                    val = val.displayText ? { text: val.text, displayText: val.displayText } : val.text
                if (match(search, val)) result.push(formatter(val))
            }
        }

        if (isArray(predicateslist)) {
            for (var i = 0; i < predicateslist.length; i++)
                if (match(search, predicateslist[i])) result.push(formatter(predicateslist[i]))
        } else {
            for (var word in predicateslist) if (predicateslist.hasOwnProperty(word)) {
                var val = predicateslist[word]
                if (!val || val === true)
                    val = word
                else
                    val = val.displayText ? { text: val.text, displayText: val.displayText } : val.text
                if (match(search, val)) result.push(formatter(val))
            }
        }

        if (isArray(prefixlist)) {
            for (var i = 0; i < prefixlist.length; i++)
                if (match(search, prefixlist[i])) result.push(formatter(prefixlist[i]))
        } else {
            for (var word in prefixlist) if (prefixlist.hasOwnProperty(word)) {
                var val = prefixlist[word]
                if (!val || val === true)
                    val = word
                else
                    val = val.displayText ? { text: val.text, displayText: val.displayText } : val.text
                if (match(search, val)) result.push(formatter(val))
            }
        }
    }

    function cleanName(name) {
        // Get rid name from identifierQuote and preceding dot(.)
        if (name.charAt(0) == ".") {
            name = name.substr(1);
        }
        // replace doublicated identifierQuotes with single identifierQuotes
        // and remove single identifierQuotes
        var nameParts = name.split(identifierQuote + identifierQuote);
        for (var i = 0; i < nameParts.length; i++)
            nameParts[i] = nameParts[i].replace(new RegExp(identifierQuote, "g"), "");
        return nameParts.join(identifierQuote);
    }

    function insertIdentifierQuotes(name) {
        var nameParts = getText(name).split(".");
        for (var i = 0; i < nameParts.length; i++)
            nameParts[i] = identifierQuote +
                // doublicate identifierQuotes
                nameParts[i].replace(new RegExp(identifierQuote, "g"), identifierQuote + identifierQuote) +
                identifierQuote;
        var escaped = nameParts.join(".");
        if (typeof name == "string") return escaped;
        name = shallowClone(name);
        name.text = escaped;
        return name;
    }

    function nameCompletion(cur, token, result, editor) {
        // Try to complete table, column names and return start position of completion
        var useIdentifierQuotes = false;
        var nameParts = [];
        var start = token.start;
        var cont = true;
        while (cont) {
            cont = (token.string.charAt(0) == ".");
            useIdentifierQuotes = useIdentifierQuotes || (token.string.charAt(0) == identifierQuote);

            start = token.start;
            nameParts.unshift(cleanName(token.string));

            token = editor.getTokenAt(Pos(cur.line, token.start));
            if (token.string == ".") {
                cont = true;
                token = editor.getTokenAt(Pos(cur.line, token.start));
            }
        }

        // Try to complete table names
        var string = nameParts.join(".");
        addMatches(result, string, tables, function (w) {
            return useIdentifierQuotes ? insertIdentifierQuotes(w) : w;
        });

        // Try to complete columns from defaultTable
        addMatches(result, string, defaultTable, function (w) {
            return useIdentifierQuotes ? insertIdentifierQuotes(w) : w;
        });

        // Try to complete columns
        string = nameParts.pop();
        var table = nameParts.join(".");

        var alias = false;
        var aliasTable = table;
        // Check if table is available. If not, find table by Alias
        if (!getTable(table)) {
            var oldTable = table;
            table = findTableByAlias(table, editor);
            if (table !== oldTable) alias = true;
        }

        var columns = getTable(table);
        if (columns && columns.columns)
            columns = columns.columns;

        if (columns) {
            addMatches(result, string, columns, function (w) {
                var tableInsert = table;
                if (alias == true) tableInsert = aliasTable;
                if (typeof w == "string") {
                    w = tableInsert + "." + w;
                } else {
                    w = shallowClone(w);
                    w.text = tableInsert + "." + w.text;
                }
                return useIdentifierQuotes ? insertIdentifierQuotes(w) : w;
            });
        }

        return start;
    }

    function eachWord(lineText, f) {
        var words = lineText.split(/\s+/)
        for (var i = 0; i < words.length; i++)
            if (words[i]) f(words[i].replace(/[,;]/g, ''))
    }

    function findTableByAlias(alias, editor) {
        var doc = editor.doc;
        var fullQuery = doc.getValue();
        var aliasUpperCase = alias.toUpperCase();
        var previousWord = "";
        var table = "";
        var separator = [];
        var validRange = {
            start: Pos(0, 0),
            end: Pos(editor.lastLine(), editor.getLineHandle(editor.lastLine()).length)
        };

        //add separator
        var indexOfSeparator = fullQuery.indexOf(CONS.QUERY_DIV);
        while (indexOfSeparator != -1) {
            separator.push(doc.posFromIndex(indexOfSeparator));
            indexOfSeparator = fullQuery.indexOf(CONS.QUERY_DIV, indexOfSeparator + 1);
        }
        separator.unshift(Pos(0, 0));
        separator.push(Pos(editor.lastLine(), editor.getLineHandle(editor.lastLine()).text.length));

        //find valid range
        var prevItem = null;
        var current = editor.getCursor()
        for (var i = 0; i < separator.length; i++) {
            if ((prevItem == null || cmpPos(current, prevItem) > 0) && cmpPos(current, separator[i]) <= 0) {
                validRange = { start: prevItem, end: separator[i] };
                break;
            }
            prevItem = separator[i];
        }

        var query = doc.getRange(validRange.start, validRange.end, false);

        for (var i = 0; i < query.length; i++) {
            var lineText = query[i];
            eachWord(lineText, function (word) {
                var wordUpperCase = word.toUpperCase();
                if (wordUpperCase === aliasUpperCase && getTable(previousWord))
                    table = previousWord;
                if (wordUpperCase !== CONS.ALIAS_KEYWORD)
                    previousWord = word;
            });
            if (table) break;
        }
        return table;
    }

    CodeMirror.registerHelper("hint", "sparql", function (editor, options) {
        tables = parseTables(options && options.tables)
        var defaultTableName = options && options.defaultTable;
        var disableKeywords = options && options.disableKeywords;
        defaultTable = defaultTableName && getTable(defaultTableName);
        //keywords = getKeywords(editor);
        identifierQuote = getIdentifierQuote(editor);

        if (defaultTableName && !defaultTable)
            defaultTable = findTableByAlias(defaultTableName, editor);

        defaultTable = defaultTable || [];

        if (defaultTable.columns)
            defaultTable = defaultTable.columns;

        var cur = editor.getCursor();
        var result = [];
        var token = editor.getTokenAt(cur), start, end, search;
        if (token.end > cur.ch) {
            token.end = cur.ch;
            token.string = token.string.slice(0, cur.ch - token.start);
        }

        if (token.string.match(/^[.`"\w@]\w*$/)) {
            search = token.string;
            start = token.start;
            end = token.end;
        } else {
            start = end = cur.ch;
            search = "";
        }
        if (search.charAt(0) == "." || search.charAt(0) == identifierQuote) {
            start = nameCompletion(cur, token, result, editor);
        } else {
            addMatches(result, search, tables, function (w) { return w; });
            addMatches(result, search, defaultTable, function (w) { return w; });
            if (!disableKeywords)
                addMatches(result, search, SPARQL_KEYWORDS, SPARQL_PREDICATES,SPARQL_PREFIX, function (w) { return w.toUpperCase(); });
        }

        return { list: result, from: Pos(cur.line, start), to: Pos(cur.line, end) };
    });

});