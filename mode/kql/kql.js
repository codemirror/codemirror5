// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/5/LICENSE

(function (mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function (CodeMirror) {
  "use strict";

  CodeMirror.defineMode("kql", function (config, parserConfig) {
    var client = parserConfig.client || {},
      atoms = parserConfig.atoms || { "false": true, "true": true, "null": true },
      builtin = parserConfig.builtin || set(defaultBuiltin),
      keywords = parserConfig.keywords || set(kqlKeywords),
      operatorChars = parserConfig.operatorChars || /^[*+\-%!=&|~^\/]/,
      support = parserConfig.support || {},
      hooks = parserConfig.hooks || {},
      dateKQL = parserConfig.dateKQL || { "date": true, "time": true, "timestamp": true },
      backslashStringEscapes = parserConfig.backslashStringEscapes !== false,
      brackets = parserConfig.brackets || /^[\{}\(\)\[\]]/,
      punctuation = parserConfig.punctuation || /^[;.,:]/

    function tokenBase(stream, state) {
      var ch = stream.next();

      // call hooks from the mime type
      if (hooks[ch]) {
        var result = hooks[ch](stream, state);
        if (result !== false) return result;
      }

      if (support.hexNumber &&
        ((ch == "0" && stream.match(/^[xX][0-9a-fA-F]+/))
          || (ch == "x" || ch == "X") && stream.match(/^'[0-9a-fA-F]*'/))) {
        // hex
        // ref: https://dev.mysql.com/doc/refman/8.0/en/hexadecimal-literals.html
        return "number";
      } else if (support.binaryNumber &&
        (((ch == "b" || ch == "B") && stream.match(/^'[01]*'/))
          || (ch == "0" && stream.match(/^b[01]+/)))) {
        // bitstring
        // ref: https://dev.mysql.com/doc/refman/8.0/en/bit-value-literals.html
        return "number";
      } else if (ch.charCodeAt(0) > 47 && ch.charCodeAt(0) < 58) {
        // numbers
        // ref: https://dev.mysql.com/doc/refman/8.0/en/number-literals.html
        stream.match(/^[0-9]*(\.[0-9]+)?([eE][-+]?[0-9]+)?/);
        support.decimallessFloat && stream.match(/^\.(?!\.)/);
        return "number";
      } else if (ch == "?" && (stream.eatSpace() || stream.eol() || stream.eat(";"))) {
        // placeholders
        return "variable-3";
      } else if (ch == "'" || (ch == '"' && support.doubleQuote)) {
        // strings
        // ref: https://dev.mysql.com/doc/refman/8.0/en/string-literals.html
        state.tokenize = tokenLiteral(ch);
        return state.tokenize(stream, state);
      } else if ((((support.nCharCast && (ch == "n" || ch == "N"))
        || (support.charsetCast && ch == "_" && stream.match(/[a-z][a-z0-9-]*/i)))
        && (stream.peek() == "'" || stream.peek() == '"'))) {
        // charset casting: _utf8'str', N'str', n'str'
        // ref: https://dev.mysql.com/doc/refman/8.0/en/string-literals.html
        return "keyword";
      } else if (support.escapeConstant && (ch == "e" || ch == "E")
        && (stream.peek() == "'" || (stream.peek() == '"' && support.doubleQuote))) {
        // escape constant: E'str', e'str'
        // ref: https://www.postgresql.org/docs/current/kql-syntax-lexical.html#KQL-SYNTAX-STRINGS-ESCAPE
        state.tokenize = function (stream, state) {
          return (state.tokenize = tokenLiteral(stream.next(), true))(stream, state);
        }
        return "keyword";
      } else if (support.commentSlashSlash && ch == "/" && stream.eat("/")) {
        // 1-line comment
        stream.skipToEnd();
        return "comment";
      } else if ((support.commentHash && ch == "#")
        || (ch == "-" && stream.eat("-") && (!support.commentSpaceRequired || stream.eat(" ")))) {
        // 1-line comments
        // ref: https://kb.askmonty.org/en/comment-syntax/
        stream.skipToEnd();
        return "comment";
      } else if (ch == "/" && stream.eat("*")) {
        // multi-line comments
        // ref: https://kb.askmonty.org/en/comment-syntax/
        state.tokenize = tokenComment(1);
        return state.tokenize(stream, state);
      } else if (ch == ".") {
        // .1 for 0.1
        if (support.zerolessFloat && stream.match(/^(?:\d+(?:e[+-]?\d+)?)/i))
          return "number";
        if (stream.match(/^\.+/))
          return null
        if (stream.match(/^[\w\d_$#]+/))
          return "variable-2";
      } else if (operatorChars.test(ch)) {
        // operators
        stream.eatWhile(operatorChars);
        return "operator";
      } else if (brackets.test(ch)) {
        // brackets
        return "bracket";
      } else if (punctuation.test(ch)) {
        // punctuation
        stream.eatWhile(punctuation);
        return "punctuation";
      } else if (ch == '{' &&
        (stream.match(/^( )*(d|D|t|T|ts|TS)( )*'[^']*'( )*}/) || stream.match(/^( )*(d|D|t|T|ts|TS)( )*"[^"]*"( )*}/))) {
        // dates (weird ODBC syntax)
        // ref: https://dev.mysql.com/doc/refman/8.0/en/date-and-time-literals.html
        return "number";
      } else {
        stream.eatWhile(/^[_\w\d-]/);
        var word = stream.current().toLowerCase();
        // dates (standard KQL syntax)
        // ref: https://dev.mysql.com/doc/refman/8.0/en/date-and-time-literals.html
        if (dateKQL.hasOwnProperty(word) && (stream.match(/^( )+'[^']*'/) || stream.match(/^( )+"[^"]*"/)))
          return "number";
        if (atoms.hasOwnProperty(word)) return "atom";
        if (builtin.hasOwnProperty(word)) return "type";
        if (keywords.hasOwnProperty(word)) return "keyword";
        if (client.hasOwnProperty(word)) return "builtin";
        return null;
      }
    }

    // 'string', with char specified in quote escaped by '\'
    function tokenLiteral(quote, backslashEscapes) {
      return function (stream, state) {
        var escaped = false, ch;
        while ((ch = stream.next()) != null) {
          if (ch == quote && !escaped) {
            state.tokenize = tokenBase;
            break;
          }
          escaped = (backslashStringEscapes || backslashEscapes) && !escaped && ch == "\\";
        }
        return "string";
      };
    }
    function tokenComment(depth) {
      return function (stream, state) {
        var m = stream.match(/^.*?(\/\*|\*\/)/)
        if (!m) stream.skipToEnd()
        else if (m[1] == "/*") state.tokenize = tokenComment(depth + 1)
        else if (depth > 1) state.tokenize = tokenComment(depth - 1)
        else state.tokenize = tokenBase
        return "comment"
      }
    }

    function pushContext(stream, state, type) {
      state.context = {
        prev: state.context,
        indent: stream.indentation(),
        col: stream.column(),
        type: type
      };
    }

    function popContext(state) {
      state.indent = state.context.indent;
      state.context = state.context.prev;
    }

    return {
      startState: function () {
        return { tokenize: tokenBase, context: null };
      },

      token: function (stream, state) {
        if (stream.sol()) {
          if (state.context && state.context.align == null)
            state.context.align = false;
        }
        if (state.tokenize == tokenBase && stream.eatSpace()) return null;

        var style = state.tokenize(stream, state);
        if (style == "comment") return style;

        if (state.context && state.context.align == null)
          state.context.align = true;

        var tok = stream.current();
        if (tok == "(")
          pushContext(stream, state, ")");
        else if (tok == "[")
          pushContext(stream, state, "]");
        else if (state.context && state.context.type == tok)
          popContext(state);
        return style;
      },

      indent: function (state, textAfter) {
        var cx = state.context;
        if (!cx) return CodeMirror.Pass;
        var closing = textAfter.charAt(0) == cx.type;
        if (cx.align) return cx.col + (closing ? 0 : 1);
        else return cx.indent + (closing ? 0 : config.indentUnit);
      },
      lineComment: support.commentSlashSlash ? "//" : support.commentHash ? "//" : "//",
      closeBrackets: "()[]{}''\"\"``",
      config: parserConfig
    };
  });

  // `identifier`
  function hookIdentifier(stream) {
    // MySQL/MariaDB identifiers
    // ref: https://dev.mysql.com/doc/refman/8.0/en/identifier-qualifiers.html
    var ch;
    while ((ch = stream.next()) != null) {
      // if (ch == "`" && !stream.eat("`")) return "variable-2";
    }
    stream.backUp(stream.current().length - 1);
    return stream.eatWhile(/\w/) ? "variable-2" : null;
  }

  // "identifier"
  function hookIdentifierDoublequote(stream) {
    // Standard KQL /SQLite identifiers
    // ref: http://web.archive.org/web/20160813185132/http://savage.net.au/KQL/kql-99.bnf.html#delimited%20identifier
    // ref: http://sqlite.org/lang_keywords.html
    var ch;
    while ((ch = stream.next()) != null) {
      if (ch == "\"" && !stream.eat("\"")) return "variable-2";
    }
    stream.backUp(stream.current().length - 1);
    return stream.eatWhile(/\w/) ? "variable-2" : null;
  }

  // variable token
  function hookVar(stream) {
    // variables
    // @@prefix.varName @varName
    // varName can be quoted with ` or ' or "
    // ref: https://dev.mysql.com/doc/refman/8.0/en/user-variables.html
    if (stream.eat("@")) {
      stream.match('session.');
      stream.match('local.');
      stream.match('global.');
    }

    if (stream.eat("'")) {
      stream.match(/^.*'/);
      return "variable-2";
    } else if (stream.eat('"')) {
      stream.match(/^.*"/);
      return "variable-2";
    } else if (stream.eat("`")) {
      stream.match(/^.*`/);
      return "variable-2";
    } else if (stream.match(/^[0-9a-zA-Z$\.\_]+/)) {
      return "variable-2";
    }
    return null;
  };

  // short client keyword token
  function hookClient(stream) {
    // \N means NULL
    // ref: https://dev.mysql.com/doc/refman/8.0/en/null-values.html
    if (stream.eat("N")) {
      return "atom";
    }
    // \g, etc
    // ref: https://dev.mysql.com/doc/refman/8.0/en/mysql-commands.html
    return stream.match(/^[a-zA-Z.#!?]/) ? "variable-2" : null;
  }

  //var kqlKeywords = "alter and as asc between by count desc distinct from group having in insert into is join like not on or order select set table union update values where limit ";

  // these keywords are used by all KQL dialects (however, a mode can still overwrite it)
  var kqlKeywords = "by ago bin case contains count distinct evaluate extend format_datetime has invoke join let limit lookup make-series mv-expand parse print project project-away project-keep project-rename project-reorder range render search sort summarize take top union where";
  // turn a space-separated list into an array
  function set(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }

  var defaultBuiltin = "bool timespan datetime decimal dynamic guid int long real string"
  var clientDefault = "arg_max arg_min avg avgif binary_all_and binary_all_or binary_all_xor buildschema count count_distinct count_distinctof countif dcount dcountif hll hll_if hll_merge make_bag make_bag_if make_list make_list_if make_list_with_nulls make_set make_set_if max maxif min percentile percentiles percentilew percentilesw stdev stdevif stdevp sum sumif take_any take_anyif tdigest tdigest_merge merge_tdigest variance varianceif variancep isnotempty pack_array split arg_max arg_min avg avgif binary_all_and binary_all_or binary_all_xor buildschema count count_distinct count_distinctof countif dcount dcountif hll hll_if hll_merge make_bag make_bag_if make_list make_list_if make_list_with_nulls make_set make_set_if max maxif min percentile percentiles percentilew percentilesw stdev stdevif stdevp sum sumif take_any take_anyif tdigest tdigest_merge merge_tdigest variance varianceif variancep isnotempty pack_array split cluster database external_table materialize materialized_view table toscalar abs acos ago around array_concat array_iff array_index_of array_length array_reverse array_rotate_left array_rotate_right array_shift_left array_shift_right array_slice array_sort_asc array_sort_desc array_split array_sum asin assert atan atan2 bag_has_key bag_keys bag_merge bag_pack bag_pack_columns bag_remove_keys bag_set_key bag_zip base64_decode_toarray base64_decode_tostring base64_decode_toguid base64_encode_fromarray base64_encode_tostring base64_encode_fromguid beta_cdf beta_inv beta_pdf bin bin_at bin_auto binary_and binary_not binary_or binary_shift_left binary_shift_right binary_xor bitset_count_ones case ceiling coalesce column_ifexists convert_angle convert_energy convert_force convert_length convert_mass convert_speed convert_temperature convert_volume cos cot countof current_cluster_endpoint current_database current_principal current_principal_details current_principal_is_member_of cursor_after cursor_before_or_at cursor_current datetime_add datetime_diff datetime_local_to_utc datetime_part datetime_utc_to_local dayofmonth dayofweek dayofyear dcount_hll degrees dynamic_to_json endofday endofmonth endofweek endofyear estimate_data_size exp exp10 exp2 extent_id extent_tags extract extract_all extract_json format_bytes format_datetime format_ipv4 format_ipv4_mask format_timespan gamma geo_info_from_ip_address gettype getyear gzip_compress_to_base64_string gzip_decompress_from_base64_string has_any_index has_any_ipv4 has_ipv4 has_any_ipv4_prefix has_ipv4_prefix hash hash_combine hash_many hash_md5 hash_sha1 hash_sha256 hash_xxhash64 hll_merge hourofday iff indexof indexof_regex ingestion_time ipv4_compare ipv4_is_in_range ipv4_is_in_any_range ipv4_is_match ipv4_is_private ipv4_range_to_cidr_list ipv4_netmask_suffix ipv6_compare ipv6_is_in_range ipv6_is_in_any_range ipv6_is_match isascii isempty isfinite isinf isnan isnotempty isnotnull isnull isutf8 jaccard_index log log10 log2 loggamma make_datetime make_timespan max_of merge_tdigest min_of monthofyear new_guid not now pack_all pack_array parse_command_line parse_csv parse_ipv4 parse_ipv4_mask parse_ipv6 parse_ipv6_mask parse_json parse_path parse_url parse_urlquery parse_user_agent parse_version parse_xml percentile_tdigest percentile_array_tdigest percentrank_tdigest pi pow punycode_from_string punycode_to_string radians rand range rank_tdigest regex_quote repeat replace_regex replace_string replace_strings reverse round set_difference set_has_element set_intersect set_union sign sin split sqrt startofday startofmonth startofweek startofyear strcat strcat_array strcat_delim strcmp string_size strlen strrep substring tan tobool todatetime todecimal todouble toguid tohex toint tolong tolower tostring totimespan toupper translate treepath trim trim_end trim_start unicode_codepoints_from_string unicode_codepoints_to_string unixtime_microseconds_todatetime unixtime_milliseconds_todatetime unixtime_nanoseconds_todatetime unixtime_seconds_todatetime url_decode url_encode url_encode_component week_of_year welch_test zip zlib_compress_to_base64_string zlib_decompress_from_base64_string next prev row_cumsum row_number row_rank_dense row_rank_min row_window_session geo_distance_2points geo_distance_point_to_line geo_distance_point_to_polygon geo_intersects_2lines geo_intersects_2polygons geo_intersects_line_with_polygon geo_intersection_2lines geo_intersection_2polygons geo_intersection_line_with_polygon geo_line_buffer geo_line_centroid geo_line_densify geo_line_length geo_line_simplify geo_polygon_area geo_polygon_buffer geo_polygon_centroid geo_polygon_densify geo_polygon_perimeter geo_polygon_simplify geo_polygon_to_s2cells geo_point_buffer geo_point_in_circle geo_point_in_polygon geo_point_to_geohash geo_point_to_h3cell geo_point_to_s2cell geo_geohash_to_central_point geo_geohash_neighbors geo_geohash_to_polygon geo_s2cell_to_central_point geo_s2cell_neighbors geo_s2cell_to_polygon geo_h3cell_to_central_point geo_h3cell_neighbors geo_h3cell_to_polygon geo_h3cell_parent geo_h3cell_children geo_h3cell_level geo_h3cell_rings geo_simplify_polygons_array geo_union_lines_array geo_union_polygons_array"
  // A generic KQL Mode. It's not a standard, it just tries to support what is generally supported
  CodeMirror.defineMIME("text/x-kql", {
    name: "kql",
    client: set(clientDefault),
    keywords: set(kqlKeywords),
    builtin: set(defaultBuiltin),
    atoms: set("false true"),
    operatorChars: /^[*+\-%!=&|~^\/]/,
    brackets: /^[\{}\(\)\[\]]/,
    punctuation: /^[;.,:/]/,
    support: set("commentSlashSlash doubleQuote charsetCast"),
  });
});

/*
  How Properties of Mime Types are used by KQL Mode
  =================================================

  keywords:
    A list of keywords you want to be highlighted.
  builtin:
    A list of builtin types you want to be highlighted (if you want types to be of class "builtin" instead of "keyword").
  operatorChars:
    All characters that must be handled as operators.
  client:
    Commands parsed and executed by the client (not the server).
  support:
    A list of supported syntaxes which are not common, but are supported by more than 1 DBMS.
    * zerolessFloat: .1
    * decimallessFloat: 1.
    * hexNumber: X'01AF' X'01af' x'01AF' x'01af' 0x01AF 0x01af
    * binaryNumber: b'01' B'01' 0b01
    * doubleQuote: "string"
    * escapeConstant: E''
    * nCharCast: N'string'
    * charsetCast: _utf8'string'
    * commentHash: use # char for comments
    * commentSlashSlash: use // for comments
    * commentSpaceRequired: require a space after -- for comments
  atoms:
    Keywords that must be highlighted as atoms,. Some DBMS's support more atoms than others:
    UNKNOWN, INFINITY, UNDERFLOW, NaN...
  dateKQL:
    Used for date/time KQL standard syntax, because not all DBMS's support same temporal types.
*/