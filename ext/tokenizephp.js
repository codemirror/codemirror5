/*
Copyright (c) 2008-2009 Yahoo! Inc.  All rights reserved.
The copyrights embodied in the content of this file are licensed by
Yahoo! Inc. under the BSD (revised) open source license

@author Vlad Dan Dascalescu <dandv@yahoo-inc.com>


Tokenizer for PHP code

References:
  + http://php.net/manual/en/reserved.php
  + http://php.net/tokens
  + get_defined_constants(), get_defined_functions(), get_declared_classes()
      executed on a realistic (not vanilla) PHP installation with typical LAMP modules.
      Specifically, the PHP bundled with the Uniform Web Server (www.uniformserver.com).

*/


// add the forEach method for JS engines that don't support it (e.g. IE)
// code from https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference:Objects:Array:forEach
if (!Array.prototype.forEach)
{
  Array.prototype.forEach = function(fun /*, thisp*/)
  {
    var len = this.length;
    if (typeof fun != "function")
      throw new TypeError();

    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
        fun.call(thisp, this[i], i, this);
    }
  };
}


var tokenizePHP = (function() {
  /* A map of PHP's reserved words (keywords, predefined classes, functions and
     constants. Each token has a type ('keyword', 'operator' etc.) and a style.
     The style corresponds to the CSS span class in phpcolors.css.

     Keywords can be of three types:
     a - takes an expression and forms a statement - e.g. if
     b - takes just a statement - e.g. else
     c - takes an optinoal expression, but no statement - e.g. return
     This distinction gives the parser enough information to parse
     correct code correctly (we don't care that much how we parse
     incorrect code).

     Reference: http://us.php.net/manual/en/reserved.php
  */
  var keywords = function(){
    function token(type, style){
      return {type: type, style: style};
    }
    var result = {};

    // for each(var element in ["...", "..."]) can pick up elements added to
    // Array.prototype, so we'll use the loop structure below. See also
    // http://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Statements/for_each...in

    // keywords that take an expression and form a statement
    ["if", "elseif", "while", "declare"].forEach(function(element, index, array) {
      result[element] = token("keyword a", "php-keyword");
    });

    // keywords that take just a statement
    ["do", "else", "try" ].forEach(function(element, index, array) {
      result[element] = token("keyword b", "php-keyword");
    });

    // keywords that take an optional expression, but no statement
    ["return", "break", "continue",  // the expression is optional
      "new", "clone", "throw"  // the expression is mandatory
    ].forEach(function(element, index, array) {
      result[element] = token("keyword c", "php-keyword");
    });

    ["__CLASS__", "__DIR__", "__FILE__", "__FUNCTION__", "__METHOD__", "__NAMESPACE__"].forEach(function(element, index, array) {
      result[element] = token("atom", "php-compile-time-constant");
    });

    ["true", "false", "null"].forEach(function(element, index, array) {
      result[element] = token("atom", "php-atom");
    });

    ["and", "or", "xor", "instanceof"].forEach(function(element, index, array) {
      result[element] = token("operator", "php-keyword php-operator");
    });

    ["class", "interface"].forEach(function(element, index, array) {
      result[element] = token("class", "php-keyword");
    });
    ["namespace", "use", "extends", "implements"].forEach(function(element, index, array) {
      result[element] = token("namespace", "php-keyword");
    });

    // reserved "language constructs"... http://php.net/manual/en/reserved.php
    [ "die", "echo", "empty", "exit", "eval", "include", "include_once", "isset",
      "list", "require", "require_once", "return", "print", "unset",
      "array" // a keyword rather, but mandates a parenthesized parameter list
    ].forEach(function(element, index, array) {
      result[element] = token("t_string", "php-reserved-language-construct");
    });

    result["switch"] = token("switch", "php-keyword");
    result["case"] = token("case", "php-keyword");
    result["default"] = token("default", "php-keyword");
    result["catch"] = token("catch", "php-keyword");
    result["function"] = token("function", "php-keyword");

    // http://php.net/manual/en/control-structures.alternative-syntax.php must be followed by a ':'
    ["endif", "endwhile", "endfor", "endforeach", "endswitch", "enddeclare"].forEach(function(element, index, array) {
      result[element] = token("altsyntaxend", "php-keyword");
    });

    result["const"] = token("const", "php-keyword");

    ["final", "private", "protected", "public", "global", "static"].forEach(function(element, index, array) {
      result[element] = token("modifier", "php-keyword");
    });
    result["var"] = token("modifier", "php-keyword deprecated");
    result["abstract"] = token("abstract", "php-keyword");

    result["foreach"] = token("foreach", "php-keyword");
    result["as"] = token("as", "php-keyword");
    result["for"] = token("for", "php-keyword");

    // PHP built-in functions - output of get_defined_functions()["internal"]
    [ "zend_version", "func_num_args", "func_get_arg", "func_get_args", "strlen",
      "strcmp", "strncmp", "strcasecmp", "strncasecmp", "each", "error_reporting",
      "define", "defined", "get_class", "get_parent_class", "method_exists",
      "property_exists", "class_exists", "interface_exists", "function_exists",
      "get_included_files", "get_required_files", "is_subclass_of", "is_a",
      "get_class_vars", "get_object_vars", "get_class_methods", "trigger_error",
      "user_error", "set_error_handler", "restore_error_handler",
      "set_exception_handler", "restore_exception_handler", "get_declared_classes",
      "get_declared_interfaces", "get_defined_functions", "get_defined_vars",
      "create_function", "get_resource_type", "get_loaded_extensions",
      "extension_loaded", "get_extension_funcs", "get_defined_constants",
      "debug_backtrace", "debug_print_backtrace", "bcadd", "bcsub", "bcmul", "bcdiv",
      "bcmod", "bcpow", "bcsqrt", "bcscale", "bccomp", "bcpowmod", "jdtogregorian",
      "gregoriantojd", "jdtojulian", "juliantojd", "jdtojewish", "jewishtojd",
      "jdtofrench", "frenchtojd", "jddayofweek", "jdmonthname", "easter_date",
      "easter_days", "unixtojd", "jdtounix", "cal_to_jd", "cal_from_jd",
      "cal_days_in_month", "cal_info", "variant_set", "variant_add", "variant_cat",
      "variant_sub", "variant_mul", "variant_and", "variant_div", "variant_eqv",
      "variant_idiv", "variant_imp", "variant_mod", "variant_or", "variant_pow",
      "variant_xor", "variant_abs", "variant_fix", "variant_int", "variant_neg",
      "variant_not", "variant_round", "variant_cmp", "variant_date_to_timestamp",
      "variant_date_from_timestamp", "variant_get_type", "variant_set_type",
      "variant_cast", "com_create_guid", "com_event_sink", "com_print_typeinfo",
      "com_message_pump", "com_load_typelib", "com_get_active_object", "ctype_alnum",
      "ctype_alpha", "ctype_cntrl", "ctype_digit", "ctype_lower", "ctype_graph",
      "ctype_print", "ctype_punct", "ctype_space", "ctype_upper", "ctype_xdigit",
      "strtotime", "date", "idate", "gmdate", "mktime", "gmmktime", "checkdate",
      "strftime", "gmstrftime", "time", "localtime", "getdate", "date_create",
      "date_parse", "date_format", "date_modify", "date_timezone_get",
      "date_timezone_set", "date_offset_get", "date_time_set", "date_date_set",
      "date_isodate_set", "timezone_open", "timezone_name_get",
      "timezone_name_from_abbr", "timezone_offset_get", "timezone_transitions_get",
      "timezone_identifiers_list", "timezone_abbreviations_list",
      "date_default_timezone_set", "date_default_timezone_get", "date_sunrise",
      "date_sunset", "date_sun_info", "filter_input", "filter_var",
      "filter_input_array", "filter_var_array", "filter_list", "filter_has_var",
      "filter_id", "ftp_connect", "ftp_login", "ftp_pwd", "ftp_cdup", "ftp_chdir",
      "ftp_exec", "ftp_raw", "ftp_mkdir", "ftp_rmdir", "ftp_chmod", "ftp_alloc",
      "ftp_nlist", "ftp_rawlist", "ftp_systype", "ftp_pasv", "ftp_get", "ftp_fget",
      "ftp_put", "ftp_fput", "ftp_size", "ftp_mdtm", "ftp_rename", "ftp_delete",
      "ftp_site", "ftp_close", "ftp_set_option", "ftp_get_option", "ftp_nb_fget",
      "ftp_nb_get", "ftp_nb_continue", "ftp_nb_put", "ftp_nb_fput", "ftp_quit",
      "hash", "hash_file", "hash_hmac", "hash_hmac_file", "hash_init", "hash_update",
      "hash_update_stream", "hash_update_file", "hash_final", "hash_algos", "iconv",
      "ob_iconv_handler", "iconv_get_encoding", "iconv_set_encoding", "iconv_strlen",
      "iconv_substr", "iconv_strpos", "iconv_strrpos", "iconv_mime_encode",
      "iconv_mime_decode", "iconv_mime_decode_headers", "json_encode", "json_decode",
      "odbc_autocommit", "odbc_binmode", "odbc_close", "odbc_close_all",
      "odbc_columns", "odbc_commit", "odbc_connect", "odbc_cursor",
      "odbc_data_source", "odbc_execute", "odbc_error", "odbc_errormsg", "odbc_exec",
      "odbc_fetch_array", "odbc_fetch_object", "odbc_fetch_row", "odbc_fetch_into",
      "odbc_field_len", "odbc_field_scale", "odbc_field_name", "odbc_field_type",
      "odbc_field_num", "odbc_free_result", "odbc_gettypeinfo", "odbc_longreadlen",
      "odbc_next_result", "odbc_num_fields", "odbc_num_rows", "odbc_pconnect",
      "odbc_prepare", "odbc_result", "odbc_result_all", "odbc_rollback",
      "odbc_setoption", "odbc_specialcolumns", "odbc_statistics", "odbc_tables",
      "odbc_primarykeys", "odbc_columnprivileges", "odbc_tableprivileges",
      "odbc_foreignkeys", "odbc_procedures", "odbc_procedurecolumns", "odbc_do",
      "odbc_field_precision", "preg_match", "preg_match_all", "preg_replace",
      "preg_replace_callback", "preg_split", "preg_quote", "preg_grep",
      "preg_last_error", "session_name", "session_module_name", "session_save_path",
      "session_id", "session_regenerate_id", "session_decode", "session_register",
      "session_unregister", "session_is_registered", "session_encode",
      "session_start", "session_destroy", "session_unset",
      "session_set_save_handler", "session_cache_limiter", "session_cache_expire",
      "session_set_cookie_params", "session_get_cookie_params",
      "session_write_close", "session_commit", "spl_classes", "spl_autoload",
      "spl_autoload_extensions", "spl_autoload_register", "spl_autoload_unregister",
      "spl_autoload_functions", "spl_autoload_call", "class_parents",
      "class_implements", "spl_object_hash", "iterator_to_array", "iterator_count",
      "iterator_apply", "constant", "bin2hex", "sleep", "usleep", "flush",
      "wordwrap", "htmlspecialchars", "htmlentities", "html_entity_decode",
      "htmlspecialchars_decode", "get_html_translation_table", "sha1", "sha1_file",
      "md5", "md5_file", "crc32", "iptcparse", "iptcembed", "getimagesize",
      "image_type_to_mime_type", "image_type_to_extension", "phpinfo", "phpversion",
      "phpcredits", "php_logo_guid", "php_real_logo_guid", "php_egg_logo_guid",
      "zend_logo_guid", "php_sapi_name", "php_uname", "php_ini_scanned_files",
      "strnatcmp", "strnatcasecmp", "substr_count", "strspn", "strcspn", "strtok",
      "strtoupper", "strtolower", "strpos", "stripos", "strrpos", "strripos",
      "strrev", "hebrev", "hebrevc", "nl2br", "basename", "dirname", "pathinfo",
      "stripslashes", "stripcslashes", "strstr", "stristr", "strrchr", "str_shuffle",
      "str_word_count", "str_split", "strpbrk", "substr_compare", "strcoll",
      "substr", "substr_replace", "quotemeta", "ucfirst", "ucwords", "strtr",
      "addslashes", "addcslashes", "rtrim", "str_replace", "str_ireplace",
      "str_repeat", "count_chars", "chunk_split", "trim", "ltrim", "strip_tags",
      "similar_text", "explode", "implode", "setlocale", "localeconv", "soundex",
      "levenshtein", "chr", "ord", "parse_str", "str_pad", "chop", "strchr",
      "sprintf", "printf", "vprintf", "vsprintf", "fprintf", "vfprintf", "sscanf",
      "fscanf", "parse_url", "urlencode", "urldecode", "rawurlencode",
      "rawurldecode", "http_build_query", "unlink", "exec", "system",
      "escapeshellcmd", "escapeshellarg", "passthru", "shell_exec", "proc_open",
      "proc_close", "proc_terminate", "proc_get_status", "rand", "srand",
      "getrandmax", "mt_rand", "mt_srand", "mt_getrandmax", "getservbyname",
      "getservbyport", "getprotobyname", "getprotobynumber", "getmyuid", "getmygid",
      "getmypid", "getmyinode", "getlastmod", "base64_decode", "base64_encode",
      "convert_uuencode", "convert_uudecode", "abs", "ceil", "floor", "round", "sin",
      "cos", "tan", "asin", "acos", "atan", "atan2", "sinh", "cosh", "tanh", "pi",
      "is_finite", "is_nan", "is_infinite", "pow", "exp", "log", "log10", "sqrt",
      "hypot", "deg2rad", "rad2deg", "bindec", "hexdec", "octdec", "decbin",
      "decoct", "dechex", "base_convert", "number_format", "fmod", "ip2long",
      "long2ip", "getenv", "putenv", "microtime", "gettimeofday", "uniqid",
      "quoted_printable_decode", "convert_cyr_string", "get_current_user",
      "set_time_limit", "get_cfg_var", "magic_quotes_runtime",
      "set_magic_quotes_runtime", "get_magic_quotes_gpc", "get_magic_quotes_runtime",
      "import_request_variables", "error_log", "error_get_last", "call_user_func",
      "call_user_func_array", "call_user_method", "call_user_method_array",
      "serialize", "unserialize", "var_dump", "var_export", "debug_zval_dump",
      "print_r", "memory_get_usage", "memory_get_peak_usage",
      "register_shutdown_function", "register_tick_function",
      "unregister_tick_function", "highlight_file", "show_source",
      "highlight_string", "php_strip_whitespace", "ini_get", "ini_get_all",
      "ini_set", "ini_alter", "ini_restore", "get_include_path", "set_include_path",
      "restore_include_path", "setcookie", "setrawcookie", "header", "headers_sent",
      "headers_list", "connection_aborted", "connection_status", "ignore_user_abort",
      "parse_ini_file", "is_uploaded_file", "move_uploaded_file", "gethostbyaddr",
      "gethostbyname", "gethostbynamel", "intval", "floatval", "doubleval", "strval",
      "gettype", "settype", "is_null", "is_resource", "is_bool", "is_long",
      "is_float", "is_int", "is_integer", "is_double", "is_real", "is_numeric",
      "is_string", "is_array", "is_object", "is_scalar", "is_callable", "ereg",
      "ereg_replace", "eregi", "eregi_replace", "split", "spliti", "join",
      "sql_regcase", "dl", "pclose", "popen", "readfile", "rewind", "rmdir", "umask",
      "fclose", "feof", "fgetc", "fgets", "fgetss", "fread", "fopen", "fpassthru",
      "ftruncate", "fstat", "fseek", "ftell", "fflush", "fwrite", "fputs", "mkdir",
      "rename", "copy", "tempnam", "tmpfile", "file", "file_get_contents",
      "file_put_contents", "stream_select", "stream_context_create",
      "stream_context_set_params", "stream_context_set_option",
      "stream_context_get_options", "stream_context_get_default",
      "stream_filter_prepend", "stream_filter_append", "stream_filter_remove",
      "stream_socket_client", "stream_socket_server", "stream_socket_accept",
      "stream_socket_get_name", "stream_socket_recvfrom", "stream_socket_sendto",
      "stream_socket_enable_crypto", "stream_socket_shutdown",
      "stream_copy_to_stream", "stream_get_contents", "fgetcsv", "fputcsv", "flock",
      "get_meta_tags", "stream_set_write_buffer", "set_file_buffer",
      "set_socket_blocking", "stream_set_blocking", "socket_set_blocking",
      "stream_get_meta_data", "stream_get_line", "stream_wrapper_register",
      "stream_register_wrapper", "stream_wrapper_unregister",
      "stream_wrapper_restore", "stream_get_wrappers", "stream_get_transports",
      "get_headers", "stream_set_timeout", "socket_set_timeout", "socket_get_status",
      "realpath", "fsockopen", "pfsockopen", "pack", "unpack", "get_browser",
      "crypt", "opendir", "closedir", "chdir", "getcwd", "rewinddir", "readdir",
      "dir", "scandir", "glob", "fileatime", "filectime", "filegroup", "fileinode",
      "filemtime", "fileowner", "fileperms", "filesize", "filetype", "file_exists",
      "is_writable", "is_writeable", "is_readable", "is_executable", "is_file",
      "is_dir", "is_link", "stat", "lstat", "chown", "chgrp", "chmod", "touch",
      "clearstatcache", "disk_total_space", "disk_free_space", "diskfreespace",
      "mail", "ezmlm_hash", "openlog", "syslog", "closelog",
      "define_syslog_variables", "lcg_value", "metaphone", "ob_start", "ob_flush",
      "ob_clean", "ob_end_flush", "ob_end_clean", "ob_get_flush", "ob_get_clean",
      "ob_get_length", "ob_get_level", "ob_get_status", "ob_get_contents",
      "ob_implicit_flush", "ob_list_handlers", "ksort", "krsort", "natsort",
      "natcasesort", "asort", "arsort", "sort", "rsort", "usort", "uasort", "uksort",
      "shuffle", "array_walk", "array_walk_recursive", "count", "end", "prev",
      "next", "reset", "current", "key", "min", "max", "in_array", "array_search",
      "extract", "compact", "array_fill", "array_fill_keys", "range",
      "array_multisort", "array_push", "array_pop", "array_shift", "array_unshift",
      "array_splice", "array_slice", "array_merge", "array_merge_recursive",
      "array_keys", "array_values", "array_count_values", "array_reverse",
      "array_reduce", "array_pad", "array_flip", "array_change_key_case",
      "array_rand", "array_unique", "array_intersect", "array_intersect_key",
      "array_intersect_ukey", "array_uintersect", "array_intersect_assoc",
      "array_uintersect_assoc", "array_intersect_uassoc", "array_uintersect_uassoc",
      "array_diff", "array_diff_key", "array_diff_ukey", "array_udiff",
      "array_diff_assoc", "array_udiff_assoc", "array_diff_uassoc",
      "array_udiff_uassoc", "array_sum", "array_product", "array_filter",
      "array_map", "array_chunk", "array_combine", "array_key_exists", "pos",
      "sizeof", "key_exists", "assert", "assert_options", "version_compare",
      "str_rot13", "stream_get_filters", "stream_filter_register",
      "stream_bucket_make_writeable", "stream_bucket_prepend",
      "stream_bucket_append", "stream_bucket_new", "output_add_rewrite_var",
      "output_reset_rewrite_vars", "sys_get_temp_dir", "token_get_all", "token_name",
      "readgzfile", "gzrewind", "gzclose", "gzeof", "gzgetc", "gzgets", "gzgetss",
      "gzread", "gzopen", "gzpassthru", "gzseek", "gztell", "gzwrite", "gzputs",
      "gzfile", "gzcompress", "gzuncompress", "gzdeflate", "gzinflate", "gzencode",
      "ob_gzhandler", "zlib_get_coding_type", "libxml_set_streams_context",
      "libxml_use_internal_errors", "libxml_get_last_error", "libxml_clear_errors",
      "libxml_get_errors", "dom_import_simplexml", "simplexml_load_file",
      "simplexml_load_string", "simplexml_import_dom", "wddx_serialize_value",
      "wddx_serialize_vars", "wddx_packet_start", "wddx_packet_end", "wddx_add_vars",
      "wddx_deserialize", "xml_parser_create", "xml_parser_create_ns",
      "xml_set_object", "xml_set_element_handler", "xml_set_character_data_handler",
      "xml_set_processing_instruction_handler", "xml_set_default_handler",
      "xml_set_unparsed_entity_decl_handler", "xml_set_notation_decl_handler",
      "xml_set_external_entity_ref_handler", "xml_set_start_namespace_decl_handler",
      "xml_set_end_namespace_decl_handler", "xml_parse", "xml_parse_into_struct",
      "xml_get_error_code", "xml_error_string", "xml_get_current_line_number",
      "xml_get_current_column_number", "xml_get_current_byte_index",
      "xml_parser_free", "xml_parser_set_option", "xml_parser_get_option",
      "utf8_encode", "utf8_decode", "xmlwriter_open_uri", "xmlwriter_open_memory",
      "xmlwriter_set_indent", "xmlwriter_set_indent_string",
      "xmlwriter_start_comment", "xmlwriter_end_comment",
      "xmlwriter_start_attribute", "xmlwriter_end_attribute",
      "xmlwriter_write_attribute", "xmlwriter_start_attribute_ns",
      "xmlwriter_write_attribute_ns", "xmlwriter_start_element",
      "xmlwriter_end_element", "xmlwriter_full_end_element",
      "xmlwriter_start_element_ns", "xmlwriter_write_element",
      "xmlwriter_write_element_ns", "xmlwriter_start_pi", "xmlwriter_end_pi",
      "xmlwriter_write_pi", "xmlwriter_start_cdata", "xmlwriter_end_cdata",
      "xmlwriter_write_cdata", "xmlwriter_text", "xmlwriter_write_raw",
      "xmlwriter_start_document", "xmlwriter_end_document",
      "xmlwriter_write_comment", "xmlwriter_start_dtd", "xmlwriter_end_dtd",
      "xmlwriter_write_dtd", "xmlwriter_start_dtd_element",
      "xmlwriter_end_dtd_element", "xmlwriter_write_dtd_element",
      "xmlwriter_start_dtd_attlist", "xmlwriter_end_dtd_attlist",
      "xmlwriter_write_dtd_attlist", "xmlwriter_start_dtd_entity",
      "xmlwriter_end_dtd_entity", "xmlwriter_write_dtd_entity",
      "xmlwriter_output_memory", "xmlwriter_flush", "gd_info", "imagearc",
      "imageellipse", "imagechar", "imagecharup", "imagecolorat",
      "imagecolorallocate", "imagepalettecopy", "imagecreatefromstring",
      "imagecolorclosest", "imagecolordeallocate", "imagecolorresolve",
      "imagecolorexact", "imagecolorset", "imagecolortransparent",
      "imagecolorstotal", "imagecolorsforindex", "imagecopy", "imagecopymerge",
      "imagecopymergegray", "imagecopyresized", "imagecreate",
      "imagecreatetruecolor", "imageistruecolor", "imagetruecolortopalette",
      "imagesetthickness", "imagefilledarc", "imagefilledellipse",
      "imagealphablending", "imagesavealpha", "imagecolorallocatealpha",
      "imagecolorresolvealpha", "imagecolorclosestalpha", "imagecolorexactalpha",
      "imagecopyresampled", "imagegrabwindow", "imagegrabscreen", "imagerotate",
      "imageantialias", "imagesettile", "imagesetbrush", "imagesetstyle",
      "imagecreatefrompng", "imagecreatefromgif", "imagecreatefromjpeg",
      "imagecreatefromwbmp", "imagecreatefromxbm", "imagecreatefromgd",
      "imagecreatefromgd2", "imagecreatefromgd2part", "imagepng", "imagegif",
      "imagejpeg", "imagewbmp", "imagegd", "imagegd2", "imagedestroy",
      "imagegammacorrect", "imagefill", "imagefilledpolygon", "imagefilledrectangle",
      "imagefilltoborder", "imagefontwidth", "imagefontheight", "imageinterlace",
      "imageline", "imageloadfont", "imagepolygon", "imagerectangle",
      "imagesetpixel", "imagestring", "imagestringup", "imagesx", "imagesy",
      "imagedashedline", "imagettfbbox", "imagettftext", "imageftbbox",
      "imagefttext", "imagepsloadfont", "imagepsfreefont", "imagepsencodefont",
      "imagepsextendfont", "imagepsslantfont", "imagepstext", "imagepsbbox",
      "imagetypes", "jpeg2wbmp", "png2wbmp", "image2wbmp", "imagelayereffect",
      "imagecolormatch", "imagexbm", "imagefilter", "imageconvolution",
      "mb_convert_case", "mb_strtoupper", "mb_strtolower", "mb_language",
      "mb_internal_encoding", "mb_http_input", "mb_http_output", "mb_detect_order",
      "mb_substitute_character", "mb_parse_str", "mb_output_handler",
      "mb_preferred_mime_name", "mb_strlen", "mb_strpos", "mb_strrpos", "mb_stripos",
      "mb_strripos", "mb_strstr", "mb_strrchr", "mb_stristr", "mb_strrichr",
      "mb_substr_count", "mb_substr", "mb_strcut", "mb_strwidth", "mb_strimwidth",
      "mb_convert_encoding", "mb_detect_encoding", "mb_list_encodings",
      "mb_convert_kana", "mb_encode_mimeheader", "mb_decode_mimeheader",
      "mb_convert_variables", "mb_encode_numericentity", "mb_decode_numericentity",
      "mb_send_mail", "mb_get_info", "mb_check_encoding", "mb_regex_encoding",
      "mb_regex_set_options", "mb_ereg", "mb_eregi", "mb_ereg_replace",
      "mb_eregi_replace", "mb_split", "mb_ereg_match", "mb_ereg_search",
      "mb_ereg_search_pos", "mb_ereg_search_regs", "mb_ereg_search_init",
      "mb_ereg_search_getregs", "mb_ereg_search_getpos", "mb_ereg_search_setpos",
      "mbregex_encoding", "mbereg", "mberegi", "mbereg_replace", "mberegi_replace",
      "mbsplit", "mbereg_match", "mbereg_search", "mbereg_search_pos",
      "mbereg_search_regs", "mbereg_search_init", "mbereg_search_getregs",
      "mbereg_search_getpos", "mbereg_search_setpos", "mysql_connect",
      "mysql_pconnect", "mysql_close", "mysql_select_db", "mysql_query",
      "mysql_unbuffered_query", "mysql_db_query", "mysql_list_dbs",
      "mysql_list_tables", "mysql_list_fields", "mysql_list_processes",
      "mysql_error", "mysql_errno", "mysql_affected_rows", "mysql_insert_id",
      "mysql_result", "mysql_num_rows", "mysql_num_fields", "mysql_fetch_row",
      "mysql_fetch_array", "mysql_fetch_assoc", "mysql_fetch_object",
      "mysql_data_seek", "mysql_fetch_lengths", "mysql_fetch_field",
      "mysql_field_seek", "mysql_free_result", "mysql_field_name",
      "mysql_field_table", "mysql_field_len", "mysql_field_type",
      "mysql_field_flags", "mysql_escape_string", "mysql_real_escape_string",
      "mysql_stat", "mysql_thread_id", "mysql_client_encoding", "mysql_ping",
      "mysql_get_client_info", "mysql_get_host_info", "mysql_get_proto_info",
      "mysql_get_server_info", "mysql_info", "mysql_set_charset", "mysql",
      "mysql_fieldname", "mysql_fieldtable", "mysql_fieldlen", "mysql_fieldtype",
      "mysql_fieldflags", "mysql_selectdb", "mysql_freeresult", "mysql_numfields",
      "mysql_numrows", "mysql_listdbs", "mysql_listtables", "mysql_listfields",
      "mysql_db_name", "mysql_dbname", "mysql_tablename", "mysql_table_name",
      "mysqli_affected_rows", "mysqli_autocommit", "mysqli_change_user",
      "mysqli_character_set_name", "mysqli_close", "mysqli_commit", "mysqli_connect",
      "mysqli_connect_errno", "mysqli_connect_error", "mysqli_data_seek",
      "mysqli_debug", "mysqli_disable_reads_from_master", "mysqli_disable_rpl_parse",
      "mysqli_dump_debug_info", "mysqli_enable_reads_from_master",
      "mysqli_enable_rpl_parse", "mysqli_embedded_server_end",
      "mysqli_embedded_server_start", "mysqli_errno", "mysqli_error",
      "mysqli_stmt_execute", "mysqli_execute", "mysqli_fetch_field",
      "mysqli_fetch_fields", "mysqli_fetch_field_direct", "mysqli_fetch_lengths",
      "mysqli_fetch_array", "mysqli_fetch_assoc", "mysqli_fetch_object",
      "mysqli_fetch_row", "mysqli_field_count", "mysqli_field_seek",
      "mysqli_field_tell", "mysqli_free_result", "mysqli_get_charset",
      "mysqli_get_client_info", "mysqli_get_client_version", "mysqli_get_host_info",
      "mysqli_get_proto_info", "mysqli_get_server_info", "mysqli_get_server_version",
      "mysqli_get_warnings", "mysqli_init", "mysqli_info", "mysqli_insert_id",
      "mysqli_kill", "mysqli_set_local_infile_default",
      "mysqli_set_local_infile_handler", "mysqli_master_query",
      "mysqli_more_results", "mysqli_multi_query", "mysqli_next_result",
      "mysqli_num_fields", "mysqli_num_rows", "mysqli_options", "mysqli_ping",
      "mysqli_prepare", "mysqli_report", "mysqli_query", "mysqli_real_connect",
      "mysqli_real_escape_string", "mysqli_real_query", "mysqli_rollback",
      "mysqli_rpl_parse_enabled", "mysqli_rpl_probe", "mysqli_rpl_query_type",
      "mysqli_select_db", "mysqli_set_charset", "mysqli_stmt_attr_get",
      "mysqli_stmt_attr_set", "mysqli_stmt_field_count", "mysqli_stmt_init",
      "mysqli_stmt_prepare", "mysqli_stmt_result_metadata",
      "mysqli_stmt_send_long_data", "mysqli_stmt_bind_param",
      "mysqli_stmt_bind_result", "mysqli_stmt_fetch", "mysqli_stmt_free_result",
      "mysqli_stmt_get_warnings", "mysqli_stmt_insert_id", "mysqli_stmt_reset",
      "mysqli_stmt_param_count", "mysqli_send_query", "mysqli_slave_query",
      "mysqli_sqlstate", "mysqli_ssl_set", "mysqli_stat",
      "mysqli_stmt_affected_rows", "mysqli_stmt_close", "mysqli_stmt_data_seek",
      "mysqli_stmt_errno", "mysqli_stmt_error", "mysqli_stmt_num_rows",
      "mysqli_stmt_sqlstate", "mysqli_store_result", "mysqli_stmt_store_result",
      "mysqli_thread_id", "mysqli_thread_safe", "mysqli_use_result",
      "mysqli_warning_count", "mysqli_bind_param", "mysqli_bind_result",
      "mysqli_client_encoding", "mysqli_escape_string", "mysqli_fetch",
      "mysqli_param_count", "mysqli_get_metadata", "mysqli_send_long_data",
      "mysqli_set_opt", "pdo_drivers", "socket_select", "socket_create",
      "socket_create_listen", "socket_accept", "socket_set_nonblock",
      "socket_set_block", "socket_listen", "socket_close", "socket_write",
      "socket_read", "socket_getsockname", "socket_getpeername", "socket_connect",
      "socket_strerror", "socket_bind", "socket_recv", "socket_send",
      "socket_recvfrom", "socket_sendto", "socket_get_option", "socket_set_option",
      "socket_shutdown", "socket_last_error", "socket_clear_error", "socket_getopt",
      "socket_setopt", "eaccelerator_put", "eaccelerator_get", "eaccelerator_rm",
      "eaccelerator_gc", "eaccelerator_lock", "eaccelerator_unlock",
      "eaccelerator_caching", "eaccelerator_optimizer", "eaccelerator_clear",
      "eaccelerator_clean", "eaccelerator_info", "eaccelerator_purge",
      "eaccelerator_cached_scripts", "eaccelerator_removed_scripts",
      "eaccelerator_list_keys", "eaccelerator_encode", "eaccelerator_load",
      "_eaccelerator_loader_file", "_eaccelerator_loader_line",
      "eaccelerator_set_session_handlers", "_eaccelerator_output_handler",
      "eaccelerator_cache_page", "eaccelerator_rm_page", "eaccelerator_cache_output",
      "eaccelerator_cache_result", "xdebug_get_stack_depth",
      "xdebug_get_function_stack", "xdebug_print_function_stack",
      "xdebug_get_declared_vars", "xdebug_call_class", "xdebug_call_function",
      "xdebug_call_file", "xdebug_call_line", "xdebug_var_dump", "xdebug_debug_zval",
      "xdebug_debug_zval_stdout", "xdebug_enable", "xdebug_disable",
      "xdebug_is_enabled", "xdebug_break", "xdebug_start_trace", "xdebug_stop_trace",
      "xdebug_get_tracefile_name", "xdebug_get_profiler_filename",
      "xdebug_dump_aggr_profiling_data", "xdebug_clear_aggr_profiling_data",
      "xdebug_memory_usage", "xdebug_peak_memory_usage", "xdebug_time_index",
      "xdebug_start_error_collection", "xdebug_stop_error_collection",
      "xdebug_get_collected_errors", "xdebug_start_code_coverage",
      "xdebug_stop_code_coverage", "xdebug_get_code_coverage",
      "xdebug_get_function_count", "xdebug_dump_superglobals",
      "_", /* alias for gettext()*/ 
      "get_called_class","class_alias","gc_collect_cycles","gc_enabled","gc_enable",
      "gc_disable","date_create_from_format","date_parse_from_format",
      "date_get_last_errors","date_add","date_sub","date_diff","date_timestamp_set",
      "date_timestamp_get","timezone_location_get","timezone_version_get",
      "date_interval_create_from_date_string","date_interval_format",
      "libxml_disable_entity_loader","openssl_pkey_free","openssl_pkey_new",
      "openssl_pkey_export","openssl_pkey_export_to_file","openssl_pkey_get_private",
      "openssl_pkey_get_public","openssl_pkey_get_details","openssl_free_key",
      "openssl_get_privatekey","openssl_get_publickey","openssl_x509_read",
      "openssl_x509_free","openssl_x509_parse","openssl_x509_checkpurpose",
      "openssl_x509_check_private_key","openssl_x509_export","openssl_x509_export_to_file",
      "openssl_pkcs12_export","openssl_pkcs12_export_to_file","openssl_pkcs12_read",
      "openssl_csr_new","openssl_csr_export","openssl_csr_export_to_file",
      "openssl_csr_sign","openssl_csr_get_subject","openssl_csr_get_public_key",
      "openssl_digest","openssl_encrypt","openssl_decrypt","openssl_cipher_iv_length",
      "openssl_sign","openssl_verify","openssl_seal","openssl_open","openssl_pkcs7_verify",
      "openssl_pkcs7_decrypt","openssl_pkcs7_sign","openssl_pkcs7_encrypt",
      "openssl_private_encrypt","openssl_private_decrypt","openssl_public_encrypt",
      "openssl_public_decrypt","openssl_get_md_methods","openssl_get_cipher_methods",
      "openssl_dh_compute_key","openssl_random_pseudo_bytes","openssl_error_string",
      "preg_filter","bzopen","bzread","bzwrite","bzflush","bzclose","bzerrno",
      "bzerrstr","bzerror","bzcompress","bzdecompress","curl_init","curl_copy_handle",
      "curl_version","curl_setopt","curl_setopt_array","curl_exec","curl_getinfo",
      "curl_error","curl_errno","curl_close","curl_multi_init","curl_multi_add_handle",
      "curl_multi_remove_handle","curl_multi_select","curl_multi_exec","curl_multi_getcontent",
      "curl_multi_info_read","curl_multi_close","exif_read_data","read_exif_data",
      "exif_tagname","exif_thumbnail","exif_imagetype","ftp_ssl_connect",
      "imagecolorclosesthwb","imagecreatefromxpm","textdomain","gettext","dgettext",
      "dcgettext","bindtextdomain","ngettext","dngettext","dcngettext",
      "bind_textdomain_codeset","hash_copy","imap_open","imap_reopen","imap_close",
      "imap_num_msg","imap_num_recent","imap_headers","imap_headerinfo",
      "imap_rfc822_parse_headers","imap_rfc822_write_address","imap_rfc822_parse_adrlist",
      "imap_body","imap_bodystruct","imap_fetchbody","imap_savebody","imap_fetchheader",
      "imap_fetchstructure","imap_gc","imap_expunge","imap_delete","imap_undelete",
      "imap_check","imap_listscan","imap_mail_copy","imap_mail_move","imap_mail_compose",
      "imap_createmailbox","imap_renamemailbox","imap_deletemailbox","imap_subscribe",
      "imap_unsubscribe","imap_append","imap_ping","imap_base64","imap_qprint","imap_8bit",
      "imap_binary","imap_utf8","imap_status","imap_mailboxmsginfo","imap_setflag_full",
      "imap_clearflag_full","imap_sort","imap_uid","imap_msgno","imap_list","imap_lsub",
      "imap_fetch_overview","imap_alerts","imap_errors","imap_last_error","imap_search",
      "imap_utf7_decode","imap_utf7_encode","imap_mime_header_decode","imap_thread",
      "imap_timeout","imap_get_quota","imap_get_quotaroot","imap_set_quota","imap_setacl",
      "imap_getacl","imap_mail","imap_header","imap_listmailbox","imap_getmailboxes",
      "imap_scanmailbox","imap_listsubscribed","imap_getsubscribed","imap_fetchtext",
      "imap_scan","imap_create","imap_rename","json_last_error","mb_encoding_aliases",
      "mcrypt_ecb","mcrypt_cbc","mcrypt_cfb","mcrypt_ofb","mcrypt_get_key_size",
      "mcrypt_get_block_size","mcrypt_get_cipher_name","mcrypt_create_iv","mcrypt_list_algorithms",
      "mcrypt_list_modes","mcrypt_get_iv_size","mcrypt_encrypt","mcrypt_decrypt",
      "mcrypt_module_open","mcrypt_generic_init","mcrypt_generic","mdecrypt_generic",
      "mcrypt_generic_end","mcrypt_generic_deinit","mcrypt_enc_self_test",
      "mcrypt_enc_is_block_algorithm_mode","mcrypt_enc_is_block_algorithm",
      "mcrypt_enc_is_block_mode","mcrypt_enc_get_block_size","mcrypt_enc_get_key_size",
      "mcrypt_enc_get_supported_key_sizes","mcrypt_enc_get_iv_size",
      "mcrypt_enc_get_algorithms_name","mcrypt_enc_get_modes_name","mcrypt_module_self_test",
      "mcrypt_module_is_block_algorithm_mode","mcrypt_module_is_block_algorithm",
      "mcrypt_module_is_block_mode","mcrypt_module_get_algo_block_size",
      "mcrypt_module_get_algo_key_size","mcrypt_module_get_supported_key_sizes",
      "mcrypt_module_close","mysqli_refresh","posix_kill","posix_getpid","posix_getppid",
      "posix_getuid","posix_setuid","posix_geteuid","posix_seteuid","posix_getgid",
      "posix_setgid","posix_getegid","posix_setegid","posix_getgroups","posix_getlogin",
      "posix_getpgrp","posix_setsid","posix_setpgid","posix_getpgid","posix_getsid",
      "posix_uname","posix_times","posix_ctermid","posix_ttyname","posix_isatty",
      "posix_getcwd","posix_mkfifo","posix_mknod","posix_access","posix_getgrnam",
      "posix_getgrgid","posix_getpwnam","posix_getpwuid","posix_getrlimit",
      "posix_get_last_error","posix_errno","posix_strerror","posix_initgroups",
      "pspell_new","pspell_new_personal","pspell_new_config","pspell_check",
      "pspell_suggest","pspell_store_replacement","pspell_add_to_personal",
      "pspell_add_to_session","pspell_clear_session","pspell_save_wordlist",
      "pspell_config_create","pspell_config_runtogether","pspell_config_mode",
      "pspell_config_ignore","pspell_config_personal","pspell_config_dict_dir",
      "pspell_config_data_dir","pspell_config_repl","pspell_config_save_repl",
      "snmpget","snmpgetnext","snmpwalk","snmprealwalk","snmpwalkoid",
      "snmp_get_quick_print","snmp_set_quick_print","snmp_set_enum_print",
      "snmp_set_oid_output_format","snmp_set_oid_numeric_print","snmpset",
      "snmp2_get","snmp2_getnext","snmp2_walk","snmp2_real_walk","snmp2_set",
      "snmp3_get","snmp3_getnext","snmp3_walk","snmp3_real_walk","snmp3_set",
      "snmp_set_valueretrieval","snmp_get_valueretrieval","snmp_read_mib",
      "use_soap_error_handler","is_soap_fault","socket_create_pair","time_nanosleep",
      "time_sleep_until","strptime","php_ini_loaded_file","money_format","lcfirst",
      "nl_langinfo","str_getcsv","readlink","linkinfo","symlink","link","proc_nice",
      "atanh","asinh","acosh","expm1","log1p","inet_ntop","inet_pton","getopt",
      "sys_getloadavg","getrusage","quoted_printable_encode","forward_static_call",
      "forward_static_call_array","header_remove","parse_ini_string","gethostname",
      "dns_check_record","checkdnsrr","dns_get_mx","getmxrr","dns_get_record",
      "stream_context_get_params","stream_context_set_default","stream_socket_pair",
      "stream_supports_lock","stream_set_read_buffer","stream_resolve_include_path",
      "stream_is_local","fnmatch","chroot","lchown","lchgrp","realpath_cache_size",
      "realpath_cache_get","array_replace","array_replace_recursive","ftok","xmlrpc_encode",
      "xmlrpc_decode","xmlrpc_decode_request","xmlrpc_encode_request","xmlrpc_get_type",
      "xmlrpc_set_type","xmlrpc_is_fault","xmlrpc_server_create","xmlrpc_server_destroy",
      "xmlrpc_server_register_method","xmlrpc_server_call_method",
      "xmlrpc_parse_method_descriptions","xmlrpc_server_add_introspection_data",
      "xmlrpc_server_register_introspection_callback","zip_open","zip_close",
      "zip_read","zip_entry_open","zip_entry_close","zip_entry_read","zip_entry_filesize",
      "zip_entry_name","zip_entry_compressedsize","zip_entry_compressionmethod",
      "svn_checkout","svn_cat","svn_ls","svn_log","svn_auth_set_parameter",
      "svn_auth_get_parameter","svn_client_version","svn_config_ensure","svn_diff",
      "svn_cleanup","svn_revert","svn_resolved","svn_commit","svn_lock","svn_unlock",
      "svn_add","svn_status","svn_update","svn_import","svn_info","svn_export",
      "svn_copy","svn_switch","svn_blame","svn_delete","svn_mkdir","svn_move",
      "svn_proplist","svn_propget","svn_repos_create","svn_repos_recover",
      "svn_repos_hotcopy","svn_repos_open","svn_repos_fs",
      "svn_repos_fs_begin_txn_for_commit","svn_repos_fs_commit_txn",
      "svn_fs_revision_root","svn_fs_check_path","svn_fs_revision_prop",
      "svn_fs_dir_entries","svn_fs_node_created_rev","svn_fs_youngest_rev",
      "svn_fs_file_contents","svn_fs_file_length","svn_fs_txn_root","svn_fs_make_file",
      "svn_fs_make_dir","svn_fs_apply_text","svn_fs_copy","svn_fs_delete",
      "svn_fs_begin_txn2","svn_fs_is_dir","svn_fs_is_file","svn_fs_node_prop",
      "svn_fs_change_node_prop","svn_fs_contents_changed","svn_fs_props_changed",
      "svn_fs_abort_txn","sqlite_open","sqlite_popen","sqlite_close","sqlite_query",
      "sqlite_exec","sqlite_array_query","sqlite_single_query","sqlite_fetch_array",
      "sqlite_fetch_object","sqlite_fetch_single","sqlite_fetch_string",
      "sqlite_fetch_all","sqlite_current","sqlite_column","sqlite_libversion",
      "sqlite_libencoding","sqlite_changes","sqlite_last_insert_rowid",
      "sqlite_num_rows","sqlite_num_fields","sqlite_field_name","sqlite_seek",
      "sqlite_rewind","sqlite_next","sqlite_prev","sqlite_valid","sqlite_has_more",
      "sqlite_has_prev","sqlite_escape_string","sqlite_busy_timeout","sqlite_last_error",
      "sqlite_error_string","sqlite_unbuffered_query","sqlite_create_aggregate",
      "sqlite_create_function","sqlite_factory","sqlite_udf_encode_binary",
      "sqlite_udf_decode_binary","sqlite_fetch_column_types"
    ].forEach(function(element, index, array) {
      result[element] = token("t_string", "php-predefined-function");
    });

    // output of get_defined_constants(). Differs significantly from http://php.net/manual/en/reserved.constants.php
    [ "E_ERROR", "E_RECOVERABLE_ERROR", "E_WARNING", "E_PARSE", "E_NOTICE",
      "E_STRICT", "E_CORE_ERROR", "E_CORE_WARNING", "E_COMPILE_ERROR",
      "E_COMPILE_WARNING", "E_USER_ERROR", "E_USER_WARNING", "E_USER_NOTICE",
      "E_ALL", "TRUE", "FALSE", "NULL", "ZEND_THREAD_SAFE", "PHP_VERSION", "PHP_OS",
      "PHP_SAPI", "DEFAULT_INCLUDE_PATH", "PEAR_INSTALL_DIR", "PEAR_EXTENSION_DIR",
      "PHP_EXTENSION_DIR", "PHP_PREFIX", "PHP_BINDIR", "PHP_LIBDIR", "PHP_DATADIR",
      "PHP_SYSCONFDIR", "PHP_LOCALSTATEDIR", "PHP_CONFIG_FILE_PATH",
      "PHP_CONFIG_FILE_SCAN_DIR", "PHP_SHLIB_SUFFIX", "PHP_EOL", "PHP_EOL",
      "PHP_INT_MAX", "PHP_INT_SIZE", "PHP_OUTPUT_HANDLER_START",
      "PHP_OUTPUT_HANDLER_CONT", "PHP_OUTPUT_HANDLER_END", "UPLOAD_ERR_OK",
      "UPLOAD_ERR_INI_SIZE", "UPLOAD_ERR_FORM_SIZE", "UPLOAD_ERR_PARTIAL",
      "UPLOAD_ERR_NO_FILE", "UPLOAD_ERR_NO_TMP_DIR", "UPLOAD_ERR_CANT_WRITE",
      "UPLOAD_ERR_EXTENSION", "CAL_GREGORIAN", "CAL_JULIAN", "CAL_JEWISH",
      "CAL_FRENCH", "CAL_NUM_CALS", "CAL_DOW_DAYNO", "CAL_DOW_SHORT", "CAL_DOW_LONG",
      "CAL_MONTH_GREGORIAN_SHORT", "CAL_MONTH_GREGORIAN_LONG",
      "CAL_MONTH_JULIAN_SHORT", "CAL_MONTH_JULIAN_LONG", "CAL_MONTH_JEWISH",
      "CAL_MONTH_FRENCH", "CAL_EASTER_DEFAULT", "CAL_EASTER_ROMAN",
      "CAL_EASTER_ALWAYS_GREGORIAN", "CAL_EASTER_ALWAYS_JULIAN",
      "CAL_JEWISH_ADD_ALAFIM_GERESH", "CAL_JEWISH_ADD_ALAFIM",
      "CAL_JEWISH_ADD_GERESHAYIM", "CLSCTX_INPROC_SERVER", "CLSCTX_INPROC_HANDLER",
      "CLSCTX_LOCAL_SERVER", "CLSCTX_REMOTE_SERVER", "CLSCTX_SERVER", "CLSCTX_ALL",
      "VT_NULL", "VT_EMPTY", "VT_UI1", "VT_I1", "VT_UI2", "VT_I2", "VT_UI4", "VT_I4",
      "VT_R4", "VT_R8", "VT_BOOL", "VT_ERROR", "VT_CY", "VT_DATE", "VT_BSTR",
      "VT_DECIMAL", "VT_UNKNOWN", "VT_DISPATCH", "VT_VARIANT", "VT_INT", "VT_UINT",
      "VT_ARRAY", "VT_BYREF", "CP_ACP", "CP_MACCP", "CP_OEMCP", "CP_UTF7", "CP_UTF8",
      "CP_SYMBOL", "CP_THREAD_ACP", "VARCMP_LT", "VARCMP_EQ", "VARCMP_GT",
      "VARCMP_NULL", "NORM_IGNORECASE", "NORM_IGNORENONSPACE", "NORM_IGNORESYMBOLS",
      "NORM_IGNOREWIDTH", "NORM_IGNOREKANATYPE", "DISP_E_DIVBYZERO",
      "DISP_E_OVERFLOW", "DISP_E_BADINDEX", "MK_E_UNAVAILABLE", "INPUT_POST",
      "INPUT_GET", "INPUT_COOKIE", "INPUT_ENV", "INPUT_SERVER", "INPUT_SESSION",
      "INPUT_REQUEST", "FILTER_FLAG_NONE", "FILTER_REQUIRE_SCALAR",
      "FILTER_REQUIRE_ARRAY", "FILTER_FORCE_ARRAY", "FILTER_NULL_ON_FAILURE",
      "FILTER_VALIDATE_INT", "FILTER_VALIDATE_BOOLEAN", "FILTER_VALIDATE_FLOAT",
      "FILTER_VALIDATE_REGEXP", "FILTER_VALIDATE_URL", "FILTER_VALIDATE_EMAIL",
      "FILTER_VALIDATE_IP", "FILTER_DEFAULT", "FILTER_UNSAFE_RAW",
      "FILTER_SANITIZE_STRING", "FILTER_SANITIZE_STRIPPED",
      "FILTER_SANITIZE_ENCODED", "FILTER_SANITIZE_SPECIAL_CHARS",
      "FILTER_SANITIZE_EMAIL", "FILTER_SANITIZE_URL", "FILTER_SANITIZE_NUMBER_INT",
      "FILTER_SANITIZE_NUMBER_FLOAT", "FILTER_SANITIZE_MAGIC_QUOTES",
      "FILTER_CALLBACK", "FILTER_FLAG_ALLOW_OCTAL", "FILTER_FLAG_ALLOW_HEX",
      "FILTER_FLAG_STRIP_LOW", "FILTER_FLAG_STRIP_HIGH", "FILTER_FLAG_ENCODE_LOW",
      "FILTER_FLAG_ENCODE_HIGH", "FILTER_FLAG_ENCODE_AMP",
      "FILTER_FLAG_NO_ENCODE_QUOTES", "FILTER_FLAG_EMPTY_STRING_NULL",
      "FILTER_FLAG_ALLOW_FRACTION", "FILTER_FLAG_ALLOW_THOUSAND",
      "FILTER_FLAG_ALLOW_SCIENTIFIC", "FILTER_FLAG_SCHEME_REQUIRED",
      "FILTER_FLAG_HOST_REQUIRED", "FILTER_FLAG_PATH_REQUIRED",
      "FILTER_FLAG_QUERY_REQUIRED", "FILTER_FLAG_IPV4", "FILTER_FLAG_IPV6",
      "FILTER_FLAG_NO_RES_RANGE", "FILTER_FLAG_NO_PRIV_RANGE", "FTP_ASCII",
      "FTP_TEXT", "FTP_BINARY", "FTP_IMAGE", "FTP_AUTORESUME", "FTP_TIMEOUT_SEC",
      "FTP_AUTOSEEK", "FTP_FAILED", "FTP_FINISHED", "FTP_MOREDATA", "HASH_HMAC",
      "ICONV_IMPL", "ICONV_VERSION", "ICONV_MIME_DECODE_STRICT",
      "ICONV_MIME_DECODE_CONTINUE_ON_ERROR", "ODBC_TYPE", "ODBC_BINMODE_PASSTHRU",
      "ODBC_BINMODE_RETURN", "ODBC_BINMODE_CONVERT", "SQL_ODBC_CURSORS",
      "SQL_CUR_USE_DRIVER", "SQL_CUR_USE_IF_NEEDED", "SQL_CUR_USE_ODBC",
      "SQL_CONCURRENCY", "SQL_CONCUR_READ_ONLY", "SQL_CONCUR_LOCK",
      "SQL_CONCUR_ROWVER", "SQL_CONCUR_VALUES", "SQL_CURSOR_TYPE",
      "SQL_CURSOR_FORWARD_ONLY", "SQL_CURSOR_KEYSET_DRIVEN", "SQL_CURSOR_DYNAMIC",
      "SQL_CURSOR_STATIC", "SQL_KEYSET_SIZE", "SQL_FETCH_FIRST", "SQL_FETCH_NEXT",
      "SQL_CHAR", "SQL_VARCHAR", "SQL_LONGVARCHAR", "SQL_DECIMAL", "SQL_NUMERIC",
      "SQL_BIT", "SQL_TINYINT", "SQL_SMALLINT", "SQL_INTEGER", "SQL_BIGINT",
      "SQL_REAL", "SQL_FLOAT", "SQL_DOUBLE", "SQL_BINARY", "SQL_VARBINARY",
      "SQL_LONGVARBINARY", "SQL_DATE", "SQL_TIME", "SQL_TIMESTAMP",
      "PREG_PATTERN_ORDER", "PREG_SET_ORDER", "PREG_OFFSET_CAPTURE",
      "PREG_SPLIT_NO_EMPTY", "PREG_SPLIT_DELIM_CAPTURE", "PREG_SPLIT_OFFSET_CAPTURE",
      "PREG_GREP_INVERT", "PREG_NO_ERROR", "PREG_INTERNAL_ERROR",
      "PREG_BACKTRACK_LIMIT_ERROR", "PREG_RECURSION_LIMIT_ERROR",
      "PREG_BAD_UTF8_ERROR", "DATE_ATOM", "DATE_COOKIE", "DATE_ISO8601",
      "DATE_RFC822", "DATE_RFC850", "DATE_RFC1036", "DATE_RFC1123", "DATE_RFC2822",
      "DATE_RFC3339", "DATE_RSS", "DATE_W3C", "SUNFUNCS_RET_TIMESTAMP",
      "SUNFUNCS_RET_STRING", "SUNFUNCS_RET_DOUBLE", "LIBXML_VERSION",
      "LIBXML_DOTTED_VERSION", "LIBXML_NOENT", "LIBXML_DTDLOAD", "LIBXML_DTDATTR",
      "LIBXML_DTDVALID", "LIBXML_NOERROR", "LIBXML_NOWARNING", "LIBXML_NOBLANKS",
      "LIBXML_XINCLUDE", "LIBXML_NSCLEAN", "LIBXML_NOCDATA", "LIBXML_NONET",
      "LIBXML_COMPACT", "LIBXML_NOXMLDECL", "LIBXML_NOEMPTYTAG", "LIBXML_ERR_NONE",
      "LIBXML_ERR_WARNING", "LIBXML_ERR_ERROR", "LIBXML_ERR_FATAL",
      "CONNECTION_ABORTED", "CONNECTION_NORMAL", "CONNECTION_TIMEOUT", "INI_USER",
      "INI_PERDIR", "INI_SYSTEM", "INI_ALL", "PHP_URL_SCHEME", "PHP_URL_HOST",
      "PHP_URL_PORT", "PHP_URL_USER", "PHP_URL_PASS", "PHP_URL_PATH",
      "PHP_URL_QUERY", "PHP_URL_FRAGMENT", "M_E", "M_LOG2E", "M_LOG10E", "M_LN2",
      "M_LN10", "M_PI", "M_PI_2", "M_PI_4", "M_1_PI", "M_2_PI", "M_SQRTPI",
      "M_2_SQRTPI", "M_LNPI", "M_EULER", "M_SQRT2", "M_SQRT1_2", "M_SQRT3", "INF",
      "NAN", "INFO_GENERAL", "INFO_CREDITS", "INFO_CONFIGURATION", "INFO_MODULES",
      "INFO_ENVIRONMENT", "INFO_VARIABLES", "INFO_LICENSE", "INFO_ALL",
      "CREDITS_GROUP", "CREDITS_GENERAL", "CREDITS_SAPI", "CREDITS_MODULES",
      "CREDITS_DOCS", "CREDITS_FULLPAGE", "CREDITS_QA", "CREDITS_ALL",
      "HTML_SPECIALCHARS", "HTML_ENTITIES", "ENT_COMPAT", "ENT_QUOTES",
      "ENT_NOQUOTES", "STR_PAD_LEFT", "STR_PAD_RIGHT", "STR_PAD_BOTH",
      "PATHINFO_DIRNAME", "PATHINFO_BASENAME", "PATHINFO_EXTENSION",
      "PATHINFO_FILENAME", "CHAR_MAX", "LC_CTYPE", "LC_NUMERIC", "LC_TIME",
      "LC_COLLATE", "LC_MONETARY", "LC_ALL", "SEEK_SET", "SEEK_CUR", "SEEK_END",
      "LOCK_SH", "LOCK_EX", "LOCK_UN", "LOCK_NB", "STREAM_NOTIFY_CONNECT",
      "STREAM_NOTIFY_AUTH_REQUIRED", "STREAM_NOTIFY_AUTH_RESULT",
      "STREAM_NOTIFY_MIME_TYPE_IS", "STREAM_NOTIFY_FILE_SIZE_IS",
      "STREAM_NOTIFY_REDIRECTED", "STREAM_NOTIFY_PROGRESS", "STREAM_NOTIFY_FAILURE",
      "STREAM_NOTIFY_COMPLETED", "STREAM_NOTIFY_RESOLVE",
      "STREAM_NOTIFY_SEVERITY_INFO", "STREAM_NOTIFY_SEVERITY_WARN",
      "STREAM_NOTIFY_SEVERITY_ERR", "STREAM_FILTER_READ", "STREAM_FILTER_WRITE",
      "STREAM_FILTER_ALL", "STREAM_CLIENT_PERSISTENT", "STREAM_CLIENT_ASYNC_CONNECT",
      "STREAM_CLIENT_CONNECT", "STREAM_CRYPTO_METHOD_SSLv2_CLIENT",
      "STREAM_CRYPTO_METHOD_SSLv3_CLIENT", "STREAM_CRYPTO_METHOD_SSLv23_CLIENT",
      "STREAM_CRYPTO_METHOD_TLS_CLIENT", "STREAM_CRYPTO_METHOD_SSLv2_SERVER",
      "STREAM_CRYPTO_METHOD_SSLv3_SERVER", "STREAM_CRYPTO_METHOD_SSLv23_SERVER",
      "STREAM_CRYPTO_METHOD_TLS_SERVER", "STREAM_SHUT_RD", "STREAM_SHUT_WR",
      "STREAM_SHUT_RDWR", "STREAM_PF_INET", "STREAM_PF_INET6", "STREAM_PF_UNIX",
      "STREAM_IPPROTO_IP", "STREAM_IPPROTO_TCP", "STREAM_IPPROTO_UDP",
      "STREAM_IPPROTO_ICMP", "STREAM_IPPROTO_RAW", "STREAM_SOCK_STREAM",
      "STREAM_SOCK_DGRAM", "STREAM_SOCK_RAW", "STREAM_SOCK_SEQPACKET",
      "STREAM_SOCK_RDM", "STREAM_PEEK", "STREAM_OOB", "STREAM_SERVER_BIND",
      "STREAM_SERVER_LISTEN", "FILE_USE_INCLUDE_PATH", "FILE_IGNORE_NEW_LINES",
      "FILE_SKIP_EMPTY_LINES", "FILE_APPEND", "FILE_NO_DEFAULT_CONTEXT",
      "PSFS_PASS_ON", "PSFS_FEED_ME", "PSFS_ERR_FATAL", "PSFS_FLAG_NORMAL",
      "PSFS_FLAG_FLUSH_INC", "PSFS_FLAG_FLUSH_CLOSE", "CRYPT_SALT_LENGTH",
      "CRYPT_STD_DES", "CRYPT_EXT_DES", "CRYPT_MD5", "CRYPT_BLOWFISH",
      "DIRECTORY_SEPARATOR", "PATH_SEPARATOR", "GLOB_BRACE", "GLOB_MARK",
      "GLOB_NOSORT", "GLOB_NOCHECK", "GLOB_NOESCAPE", "GLOB_ERR", "GLOB_ONLYDIR",
      "LOG_EMERG", "LOG_ALERT", "LOG_CRIT", "LOG_ERR", "LOG_WARNING", "LOG_NOTICE",
      "LOG_INFO", "LOG_DEBUG", "LOG_KERN", "LOG_USER", "LOG_MAIL", "LOG_DAEMON",
      "LOG_AUTH", "LOG_SYSLOG", "LOG_LPR", "LOG_NEWS", "LOG_UUCP", "LOG_CRON",
      "LOG_AUTHPRIV", "LOG_PID", "LOG_CONS", "LOG_ODELAY", "LOG_NDELAY",
      "LOG_NOWAIT", "LOG_PERROR", "EXTR_OVERWRITE", "EXTR_SKIP", "EXTR_PREFIX_SAME",
      "EXTR_PREFIX_ALL", "EXTR_PREFIX_INVALID", "EXTR_PREFIX_IF_EXISTS",
      "EXTR_IF_EXISTS", "EXTR_REFS", "SORT_ASC", "SORT_DESC", "SORT_REGULAR",
      "SORT_NUMERIC", "SORT_STRING", "SORT_LOCALE_STRING", "CASE_LOWER",
      "CASE_UPPER", "COUNT_NORMAL", "COUNT_RECURSIVE", "ASSERT_ACTIVE",
      "ASSERT_CALLBACK", "ASSERT_BAIL", "ASSERT_WARNING", "ASSERT_QUIET_EVAL",
      "STREAM_USE_PATH", "STREAM_IGNORE_URL", "STREAM_ENFORCE_SAFE_MODE",
      "STREAM_REPORT_ERRORS", "STREAM_MUST_SEEK", "STREAM_URL_STAT_LINK",
      "STREAM_URL_STAT_QUIET", "STREAM_MKDIR_RECURSIVE", "IMAGETYPE_GIF",
      "IMAGETYPE_JPEG", "IMAGETYPE_PNG", "IMAGETYPE_SWF", "IMAGETYPE_PSD",
      "IMAGETYPE_BMP", "IMAGETYPE_TIFF_II", "IMAGETYPE_TIFF_MM", "IMAGETYPE_JPC",
      "IMAGETYPE_JP2", "IMAGETYPE_JPX", "IMAGETYPE_JB2", "IMAGETYPE_SWC",
      "IMAGETYPE_IFF", "IMAGETYPE_WBMP", "IMAGETYPE_JPEG2000", "IMAGETYPE_XBM",
      "T_INCLUDE", "T_INCLUDE_ONCE", "T_EVAL", "T_REQUIRE", "T_REQUIRE_ONCE",
      "T_LOGICAL_OR", "T_LOGICAL_XOR", "T_LOGICAL_AND", "T_PRINT", "T_PLUS_EQUAL",
      "T_MINUS_EQUAL", "T_MUL_EQUAL", "T_DIV_EQUAL", "T_CONCAT_EQUAL", "T_MOD_EQUAL",
      "T_AND_EQUAL", "T_OR_EQUAL", "T_XOR_EQUAL", "T_SL_EQUAL", "T_SR_EQUAL",
      "T_BOOLEAN_OR", "T_BOOLEAN_AND", "T_IS_EQUAL", "T_IS_NOT_EQUAL",
      "T_IS_IDENTICAL", "T_IS_NOT_IDENTICAL", "T_IS_SMALLER_OR_EQUAL",
      "T_IS_GREATER_OR_EQUAL", "T_SL", "T_SR", "T_INC", "T_DEC", "T_INT_CAST",
      "T_DOUBLE_CAST", "T_STRING_CAST", "T_ARRAY_CAST", "T_OBJECT_CAST",
      "T_BOOL_CAST", "T_UNSET_CAST", "T_NEW", "T_EXIT", "T_IF", "T_ELSEIF", "T_ELSE",
      "T_ENDIF", "T_LNUMBER", "T_DNUMBER", "T_STRING", "T_STRING_VARNAME",
      "T_VARIABLE", "T_NUM_STRING", "T_INLINE_HTML", "T_CHARACTER",
      "T_BAD_CHARACTER", "T_ENCAPSED_AND_WHITESPACE", "T_CONSTANT_ENCAPSED_STRING",
      "T_ECHO", "T_DO", "T_WHILE", "T_ENDWHILE", "T_FOR", "T_ENDFOR", "T_FOREACH",
      "T_ENDFOREACH", "T_DECLARE", "T_ENDDECLARE", "T_AS", "T_SWITCH", "T_ENDSWITCH",
      "T_CASE", "T_DEFAULT", "T_BREAK", "T_CONTINUE", "T_FUNCTION", "T_CONST",
      "T_RETURN", "T_USE", "T_GLOBAL", "T_STATIC", "T_VAR", "T_UNSET", "T_ISSET",
      "T_EMPTY", "T_CLASS", "T_EXTENDS", "T_INTERFACE", "T_IMPLEMENTS",
      "T_OBJECT_OPERATOR", "T_DOUBLE_ARROW", "T_LIST", "T_ARRAY", "T_CLASS_C",
      "T_FUNC_C", "T_METHOD_C", "T_LINE", "T_FILE", "T_COMMENT", "T_DOC_COMMENT",
      "T_OPEN_TAG", "T_OPEN_TAG_WITH_ECHO", "T_CLOSE_TAG", "T_WHITESPACE",
      "T_START_HEREDOC", "T_END_HEREDOC", "T_DOLLAR_OPEN_CURLY_BRACES",
      "T_CURLY_OPEN", "T_PAAMAYIM_NEKUDOTAYIM", "T_DOUBLE_COLON", "T_ABSTRACT",
      "T_CATCH", "T_FINAL", "T_INSTANCEOF", "T_PRIVATE", "T_PROTECTED", "T_PUBLIC",
      "T_THROW", "T_TRY", "T_CLONE", "T_HALT_COMPILER", "FORCE_GZIP",
      "FORCE_DEFLATE", "XML_ELEMENT_NODE", "XML_ATTRIBUTE_NODE", "XML_TEXT_NODE",
      "XML_CDATA_SECTION_NODE", "XML_ENTITY_REF_NODE", "XML_ENTITY_NODE",
      "XML_PI_NODE", "XML_COMMENT_NODE", "XML_DOCUMENT_NODE",
      "XML_DOCUMENT_TYPE_NODE", "XML_DOCUMENT_FRAG_NODE", "XML_NOTATION_NODE",
      "XML_HTML_DOCUMENT_NODE", "XML_DTD_NODE", "XML_ELEMENT_DECL_NODE",
      "XML_ATTRIBUTE_DECL_NODE", "XML_ENTITY_DECL_NODE", "XML_NAMESPACE_DECL_NODE",
      "XML_LOCAL_NAMESPACE", "XML_ATTRIBUTE_CDATA", "XML_ATTRIBUTE_ID",
      "XML_ATTRIBUTE_IDREF", "XML_ATTRIBUTE_IDREFS", "XML_ATTRIBUTE_ENTITY",
      "XML_ATTRIBUTE_NMTOKEN", "XML_ATTRIBUTE_NMTOKENS", "XML_ATTRIBUTE_ENUMERATION",
      "XML_ATTRIBUTE_NOTATION", "DOM_PHP_ERR", "DOM_INDEX_SIZE_ERR",
      "DOMSTRING_SIZE_ERR", "DOM_HIERARCHY_REQUEST_ERR", "DOM_WRONG_DOCUMENT_ERR",
      "DOM_INVALID_CHARACTER_ERR", "DOM_NO_DATA_ALLOWED_ERR",
      "DOM_NO_MODIFICATION_ALLOWED_ERR", "DOM_NOT_FOUND_ERR",
      "DOM_NOT_SUPPORTED_ERR", "DOM_INUSE_ATTRIBUTE_ERR", "DOM_INVALID_STATE_ERR",
      "DOM_SYNTAX_ERR", "DOM_INVALID_MODIFICATION_ERR", "DOM_NAMESPACE_ERR",
      "DOM_INVALID_ACCESS_ERR", "DOM_VALIDATION_ERR", "XML_ERROR_NONE",
      "XML_ERROR_NO_MEMORY", "XML_ERROR_SYNTAX", "XML_ERROR_NO_ELEMENTS",
      "XML_ERROR_INVALID_TOKEN", "XML_ERROR_UNCLOSED_TOKEN",
      "XML_ERROR_PARTIAL_CHAR", "XML_ERROR_TAG_MISMATCH",
      "XML_ERROR_DUPLICATE_ATTRIBUTE", "XML_ERROR_JUNK_AFTER_DOC_ELEMENT",
      "XML_ERROR_PARAM_ENTITY_REF", "XML_ERROR_UNDEFINED_ENTITY",
      "XML_ERROR_RECURSIVE_ENTITY_REF", "XML_ERROR_ASYNC_ENTITY",
      "XML_ERROR_BAD_CHAR_REF", "XML_ERROR_BINARY_ENTITY_REF",
      "XML_ERROR_ATTRIBUTE_EXTERNAL_ENTITY_REF", "XML_ERROR_MISPLACED_XML_PI",
      "XML_ERROR_UNKNOWN_ENCODING", "XML_ERROR_INCORRECT_ENCODING",
      "XML_ERROR_UNCLOSED_CDATA_SECTION", "XML_ERROR_EXTERNAL_ENTITY_HANDLING",
      "XML_OPTION_CASE_FOLDING", "XML_OPTION_TARGET_ENCODING",
      "XML_OPTION_SKIP_TAGSTART", "XML_OPTION_SKIP_WHITE", "XML_SAX_IMPL", "IMG_GIF",
      "IMG_JPG", "IMG_JPEG", "IMG_PNG", "IMG_WBMP", "IMG_XPM", "IMG_COLOR_TILED",
      "IMG_COLOR_STYLED", "IMG_COLOR_BRUSHED", "IMG_COLOR_STYLEDBRUSHED",
      "IMG_COLOR_TRANSPARENT", "IMG_ARC_ROUNDED", "IMG_ARC_PIE", "IMG_ARC_CHORD",
      "IMG_ARC_NOFILL", "IMG_ARC_EDGED", "IMG_GD2_RAW", "IMG_GD2_COMPRESSED",
      "IMG_EFFECT_REPLACE", "IMG_EFFECT_ALPHABLEND", "IMG_EFFECT_NORMAL",
      "IMG_EFFECT_OVERLAY", "GD_BUNDLED", "IMG_FILTER_NEGATE",
      "IMG_FILTER_GRAYSCALE", "IMG_FILTER_BRIGHTNESS", "IMG_FILTER_CONTRAST",
      "IMG_FILTER_COLORIZE", "IMG_FILTER_EDGEDETECT", "IMG_FILTER_GAUSSIAN_BLUR",
      "IMG_FILTER_SELECTIVE_BLUR", "IMG_FILTER_EMBOSS", "IMG_FILTER_MEAN_REMOVAL",
      "IMG_FILTER_SMOOTH", "PNG_NO_FILTER", "PNG_FILTER_NONE", "PNG_FILTER_SUB",
      "PNG_FILTER_UP", "PNG_FILTER_AVG", "PNG_FILTER_PAETH", "PNG_ALL_FILTERS",
      "MB_OVERLOAD_MAIL", "MB_OVERLOAD_STRING", "MB_OVERLOAD_REGEX", "MB_CASE_UPPER",
      "MB_CASE_LOWER", "MB_CASE_TITLE", "MYSQL_ASSOC", "MYSQL_NUM", "MYSQL_BOTH",
      "MYSQL_CLIENT_COMPRESS", "MYSQL_CLIENT_SSL", "MYSQL_CLIENT_INTERACTIVE",
      "MYSQL_CLIENT_IGNORE_SPACE", "MYSQLI_READ_DEFAULT_GROUP",
      "MYSQLI_READ_DEFAULT_FILE", "MYSQLI_OPT_CONNECT_TIMEOUT",
      "MYSQLI_OPT_LOCAL_INFILE", "MYSQLI_INIT_COMMAND", "MYSQLI_CLIENT_SSL",
      "MYSQLI_CLIENT_COMPRESS", "MYSQLI_CLIENT_INTERACTIVE",
      "MYSQLI_CLIENT_IGNORE_SPACE", "MYSQLI_CLIENT_NO_SCHEMA",
      "MYSQLI_CLIENT_FOUND_ROWS", "MYSQLI_STORE_RESULT", "MYSQLI_USE_RESULT",
      "MYSQLI_ASSOC", "MYSQLI_NUM", "MYSQLI_BOTH",
      "MYSQLI_STMT_ATTR_UPDATE_MAX_LENGTH", "MYSQLI_STMT_ATTR_CURSOR_TYPE",
      "MYSQLI_CURSOR_TYPE_NO_CURSOR", "MYSQLI_CURSOR_TYPE_READ_ONLY",
      "MYSQLI_CURSOR_TYPE_FOR_UPDATE", "MYSQLI_CURSOR_TYPE_SCROLLABLE",
      "MYSQLI_STMT_ATTR_PREFETCH_ROWS", "MYSQLI_NOT_NULL_FLAG",
      "MYSQLI_PRI_KEY_FLAG", "MYSQLI_UNIQUE_KEY_FLAG", "MYSQLI_MULTIPLE_KEY_FLAG",
      "MYSQLI_BLOB_FLAG", "MYSQLI_UNSIGNED_FLAG", "MYSQLI_ZEROFILL_FLAG",
      "MYSQLI_AUTO_INCREMENT_FLAG", "MYSQLI_TIMESTAMP_FLAG", "MYSQLI_SET_FLAG",
      "MYSQLI_NUM_FLAG", "MYSQLI_PART_KEY_FLAG", "MYSQLI_GROUP_FLAG",
      "MYSQLI_TYPE_DECIMAL", "MYSQLI_TYPE_TINY", "MYSQLI_TYPE_SHORT",
      "MYSQLI_TYPE_LONG", "MYSQLI_TYPE_FLOAT", "MYSQLI_TYPE_DOUBLE",
      "MYSQLI_TYPE_NULL", "MYSQLI_TYPE_TIMESTAMP", "MYSQLI_TYPE_LONGLONG",
      "MYSQLI_TYPE_INT24", "MYSQLI_TYPE_DATE", "MYSQLI_TYPE_TIME",
      "MYSQLI_TYPE_DATETIME", "MYSQLI_TYPE_YEAR", "MYSQLI_TYPE_NEWDATE",
      "MYSQLI_TYPE_ENUM", "MYSQLI_TYPE_SET", "MYSQLI_TYPE_TINY_BLOB",
      "MYSQLI_TYPE_MEDIUM_BLOB", "MYSQLI_TYPE_LONG_BLOB", "MYSQLI_TYPE_BLOB",
      "MYSQLI_TYPE_VAR_STRING", "MYSQLI_TYPE_STRING", "MYSQLI_TYPE_CHAR",
      "MYSQLI_TYPE_INTERVAL", "MYSQLI_TYPE_GEOMETRY", "MYSQLI_TYPE_NEWDECIMAL",
      "MYSQLI_TYPE_BIT", "MYSQLI_RPL_MASTER", "MYSQLI_RPL_SLAVE", "MYSQLI_RPL_ADMIN",
      "MYSQLI_NO_DATA", "MYSQLI_DATA_TRUNCATED", "MYSQLI_REPORT_INDEX",
      "MYSQLI_REPORT_ERROR", "MYSQLI_REPORT_STRICT", "MYSQLI_REPORT_ALL",
      "MYSQLI_REPORT_OFF", "AF_UNIX", "AF_INET", "AF_INET6", "SOCK_STREAM",
      "SOCK_DGRAM", "SOCK_RAW", "SOCK_SEQPACKET", "SOCK_RDM", "MSG_OOB",
      "MSG_WAITALL", "MSG_PEEK", "MSG_DONTROUTE", "SO_DEBUG", "SO_REUSEADDR",
      "SO_KEEPALIVE", "SO_DONTROUTE", "SO_LINGER", "SO_BROADCAST", "SO_OOBINLINE",
      "SO_SNDBUF", "SO_RCVBUF", "SO_SNDLOWAT", "SO_RCVLOWAT", "SO_SNDTIMEO",
      "SO_RCVTIMEO", "SO_TYPE", "SO_ERROR", "SOL_SOCKET", "SOMAXCONN",
      "PHP_NORMAL_READ", "PHP_BINARY_READ", "SOCKET_EINTR", "SOCKET_EBADF",
      "SOCKET_EACCES", "SOCKET_EFAULT", "SOCKET_EINVAL", "SOCKET_EMFILE",
      "SOCKET_EWOULDBLOCK", "SOCKET_EINPROGRESS", "SOCKET_EALREADY",
      "SOCKET_ENOTSOCK", "SOCKET_EDESTADDRREQ", "SOCKET_EMSGSIZE",
      "SOCKET_EPROTOTYPE", "SOCKET_ENOPROTOOPT", "SOCKET_EPROTONOSUPPORT",
      "SOCKET_ESOCKTNOSUPPORT", "SOCKET_EOPNOTSUPP", "SOCKET_EPFNOSUPPORT",
      "SOCKET_EAFNOSUPPORT", "SOCKET_EADDRINUSE", "SOCKET_EADDRNOTAVAIL",
      "SOCKET_ENETDOWN", "SOCKET_ENETUNREACH", "SOCKET_ENETRESET",
      "SOCKET_ECONNABORTED", "SOCKET_ECONNRESET", "SOCKET_ENOBUFS", "SOCKET_EISCONN",
      "SOCKET_ENOTCONN", "SOCKET_ESHUTDOWN", "SOCKET_ETOOMANYREFS",
      "SOCKET_ETIMEDOUT", "SOCKET_ECONNREFUSED", "SOCKET_ELOOP",
      "SOCKET_ENAMETOOLONG", "SOCKET_EHOSTDOWN", "SOCKET_EHOSTUNREACH",
      "SOCKET_ENOTEMPTY", "SOCKET_EPROCLIM", "SOCKET_EUSERS", "SOCKET_EDQUOT",
      "SOCKET_ESTALE", "SOCKET_EREMOTE", "SOCKET_EDISCON", "SOCKET_SYSNOTREADY",
      "SOCKET_VERNOTSUPPORTED", "SOCKET_NOTINITIALISED", "SOCKET_HOST_NOT_FOUND",
      "SOCKET_TRY_AGAIN", "SOCKET_NO_RECOVERY", "SOCKET_NO_DATA",
      "SOCKET_NO_ADDRESS", "SOL_TCP", "SOL_UDP", "EACCELERATOR_VERSION",
      "EACCELERATOR_SHM_AND_DISK", "EACCELERATOR_SHM", "EACCELERATOR_SHM_ONLY",
      "EACCELERATOR_DISK_ONLY", "EACCELERATOR_NONE", "XDEBUG_TRACE_APPEND",
      "XDEBUG_TRACE_COMPUTERIZED", "XDEBUG_TRACE_HTML", "XDEBUG_CC_UNUSED",
      "XDEBUG_CC_DEAD_CODE", "STDIN", "STDOUT", "STDERR", "DNS_HINFO", 
      "DNS_PTR", "SQLITE_EMPTY", "SVN_SHOW_UPDATES", "SVN_NO_IGNORE", "MSG_EOF",
      "DNS_MX", "GD_EXTRA_VERSION", "PHP_VERSION_ID", "SQLITE_OK", 
      "LIBXML_LOADED_VERSION", "RADIXCHAR", "OPENSSL_VERSION_TEXT",  "OPENSSL_VERSION_NUMBER",
      "PCRE_VERSION", "CURLOPT_FILE", "CURLOPT_INFILE", "CURLOPT_URL", "CURLOPT_PROXY",
      "CURLE_FUNCTION_NOT_FOUND", "SOCKET_ENOMSG", "CURLOPT_HTTPHEADER", "SOCKET_EIDRM",
      "CURLOPT_PROGRESSFUNCTION", "SOCKET_ECHRNG", "SOCKET_EL2NSYNC", "SOCKET_EL3HLT",
      "SOCKET_EL3RST", "SOCKET_ELNRNG", "SOCKET_ENOCSI", "SOCKET_EL2HLT", "SOCKET_EBADE",
      "SOCKET_EXFULL", "CURLOPT_USERPWD",  "CURLOPT_PROXYUSERPWD", "CURLOPT_RANGE",
      "CURLOPT_TIMEOUT_MS",  "CURLOPT_POSTFIELDS",  "CURLOPT_REFERER", "CURLOPT_USERAGENT",
      "CURLOPT_FTPPORT", "SOCKET_ERESTART", "SQLITE_CONSTRAINT", "SQLITE_MISMATCH",
      "SQLITE_MISUSE", "CURLOPT_COOKIE", "CURLE_SSL_CERTPROBLEM", "CURLOPT_SSLCERT",
      "CURLOPT_KEYPASSWD", "CURLOPT_WRITEHEADER", "CURLOPT_SSL_VERIFYHOST",
      "CURLOPT_COOKIEFILE", "CURLE_HTTP_RANGE_ERROR", "CURLE_HTTP_POST_ERROR",
      "CURLOPT_CUSTOMREQUEST", "CURLOPT_STDERR", "SOCKET_EBADR", "CURLOPT_RETURNTRANSFER",
      "CURLOPT_QUOTE", "CURLOPT_POSTQUOTE", "CURLOPT_INTERFACE", "CURLOPT_KRB4LEVEL",
      "SOCKET_ENODATA", "SOCKET_ESRMNT",  "CURLOPT_WRITEFUNCTION", "CURLOPT_READFUNCTION",
      "CURLOPT_HEADERFUNCTION", "SOCKET_EADV", "SOCKET_EPROTO", "SOCKET_EMULTIHOP",
      "SOCKET_EBADMSG",  "CURLOPT_FORBID_REUSE", "CURLOPT_RANDOM_FILE", "CURLOPT_EGDSOCKET",
      "SOCKET_EREMCHG", "CURLOPT_CONNECTTIMEOUT_MS", "CURLOPT_CAINFO", "CURLOPT_CAPATH",
      "CURLOPT_COOKIEJAR", "CURLOPT_SSL_CIPHER_LIST", "CURLOPT_BINARYTRANSFER",
      "SQLITE_DONE", "CURLOPT_HTTP_VERSION", "CURLOPT_SSLKEY", "CURLOPT_SSLKEYTYPE",
      "CURLOPT_SSLENGINE", "CURLOPT_SSLCERTTYPE", "CURLE_OUT_OF_MEMORY", "CURLOPT_ENCODING",
      "CURLE_SSL_CIPHER", "SOCKET_EREMOTEIO", "CURLOPT_HTTP200ALIASES", "CURLAUTH_ANY",
      "CURLAUTH_ANYSAFE", "CURLOPT_PRIVATE", "CURLINFO_EFFECTIVE_URL", "CURLINFO_HTTP_CODE",
      "CURLINFO_HEADER_SIZE", "CURLINFO_REQUEST_SIZE", "CURLINFO_TOTAL_TIME",
      "CURLINFO_NAMELOOKUP_TIME", "CURLINFO_CONNECT_TIME", "CURLINFO_PRETRANSFER_TIME",
      "CURLINFO_SIZE_UPLOAD", "CURLINFO_SIZE_DOWNLOAD", "CURLINFO_SPEED_DOWNLOAD",
      "CURLINFO_SPEED_UPLOAD", "CURLINFO_FILETIME", "CURLINFO_SSL_VERIFYRESULT",
      "CURLINFO_CONTENT_LENGTH_DOWNLOAD", "CURLINFO_CONTENT_LENGTH_UPLOAD",
      "CURLINFO_STARTTRANSFER_TIME", "CURLINFO_CONTENT_TYPE", "CURLINFO_REDIRECT_TIME",
      "CURLINFO_REDIRECT_COUNT", "CURLINFO_PRIVATE", "CURLINFO_CERTINFO",
      "SQLITE_PROTOCOL", "SQLITE_SCHEMA", "SQLITE_TOOBIG", "SQLITE_NOLFS", 
      "SQLITE_AUTH", "SQLITE_FORMAT", "SOCKET_ENOTTY", "SQLITE_NOTADB",
      "SOCKET_ENOSPC", "SOCKET_ESPIPE", "SOCKET_EROFS", "SOCKET_EMLINK", "GD_RELEASE_VERSION",
      "SOCKET_ENOLCK", "SOCKET_ENOSYS", "SOCKET_EUNATCH", "SOCKET_ENOANO", "SOCKET_EBADRQC",
      "SOCKET_EBADSLT", "SOCKET_ENOSTR", "SOCKET_ETIME", "SOCKET_ENOSR", "SVN_REVISION_HEAD",
      "XSD_ENTITY", "XSD_NOTATION", "CURLOPT_CERTINFO", "CURLOPT_POSTREDIR", "CURLOPT_SSH_AUTH_TYPES",
      "CURLOPT_SSH_PUBLIC_KEYFILE", "CURLOPT_SSH_PRIVATE_KEYFILE", "CURLOPT_SSH_HOST_PUBLIC_KEY_MD5",
      "CURLE_SSH", "CURLOPT_REDIR_PROTOCOLS", "CURLOPT_PROTOCOLS", "XSD_NONNEGATIVEINTEGER",
      "XSD_BYTE","DNS_SRV","DNS_A6", "DNS_NAPTR", "DNS_AAAA", "FILTER_SANITIZE_FULL_SPECIAL_CHARS",
      "ABDAY_1", "SVN_REVISION_UNSPECIFIED", "SVN_REVISION_BASE", "SVN_REVISION_COMMITTED",
      "SVN_REVISION_PREV", "GD_VERSION", "MCRYPT_TRIPLEDES", "MCRYPT_ARCFOUR_IV", "MCRYPT_ARCFOUR",
      "MCRYPT_BLOWFISH", "MCRYPT_BLOWFISH_COMPAT", "MCRYPT_CAST_128", "MCRYPT_CAST_256",
      "MCRYPT_ENIGNA", "MCRYPT_DES", "MCRYPT_GOST", "MCRYPT_LOKI97", "MCRYPT_PANAMA",
      "MCRYPT_RC2", "MCRYPT_RIJNDAEL_128", "MCRYPT_RIJNDAEL_192", "MCRYPT_RIJNDAEL_256",
      "MCRYPT_SAFER64", "MCRYPT_SAFER128","MCRYPT_SAFERPLUS", "MCRYPT_SERPENT", "MCRYPT_THREEWAY",
      "MCRYPT_TWOFISH", "MCRYPT_WAKE", "MCRYPT_XTEA", "MCRYPT_IDEA", "MCRYPT_MARS",
      "MCRYPT_RC6", "MCRYPT_SKIPJACK", "MCRYPT_MODE_CBC", "MCRYPT_MODE_CFB", "MCRYPT_MODE_ECB",
      "MCRYPT_MODE_NOFB", "MCRYPT_MODE_OFB", "MCRYPT_MODE_STREAM", "CL_EXPUNGE",
      "SQLITE_ROW", "POSIX_S_IFBLK", "POSIX_S_IFSOCK",  "XSD_IDREF", "ABDAY_2",
      "ABDAY_3", "ABDAY_4", "ABDAY_5", "ABDAY_6", "ABDAY_7", "DAY_1", "DAY_2",
      "DAY_3", "DAY_4", "DAY_5", "DAY_6", "DAY_7", "ABMON_1", "ABMON_2", "ABMON_3",
      "ABMON_4", "ABMON_5", "ABMON_6", "ABMON_7","ABMON_8", "ABMON_9", "ABMON_10",
      "ABMON_11",  "ABMON_12", "MON_1", "MON_2", "MON_3", "MON_4", "MON_5",  "MON_6",
      "MON_7",  "MON_8", "MON_9", "MON_10", "MON_11", "MON_12", "AM_STR", "PM_STR",
      "D_T_FMT",  "D_FMT", "T_FMT", "T_FMT_AMPM", "ERA", "ERA_D_T_FMT", "ERA_D_FMT",
      "ERA_T_FMT", "ALT_DIGITS", "CRNCYSTR", "THOUSEP",  "YESEXPR", "NOEXPR",
      "SOCKET_ENOMEDIUM", "GLOB_AVAILABLE_FLAGS", "XSD_SHORT", "XSD_NMTOKENS",
      "LOG_LOCAL3", "LOG_LOCAL4", "LOG_LOCAL5", "LOG_LOCAL6", "LOG_LOCAL7",
      "DNS_ANY", "DNS_ALL", "SOCKET_ENOLINK",  "SOCKET_ECOMM", "SOAP_FUNCTIONS_ALL",
      "UNKNOWN_TYPE", "XSD_BASE64BINARY", "XSD_ANYURI", "XSD_QNAME", "SOCKET_EISNAM",
      "SOCKET_EMEDIUMTYPE", "XSD_NCNAME", "XSD_ID", "XSD_ENTITIES", "XSD_INTEGER",
      "XSD_NONPOSITIVEINTEGER", "XSD_NEGATIVEINTEGER", "XSD_LONG", "XSD_INT",
      "XSD_UNSIGNEDLONG", "XSD_UNSIGNEDINT", "XSD_UNSIGNEDSHORT", "XSD_UNSIGNEDBYTE",
      "XSD_POSITIVEINTEGER", "XSD_ANYTYPE", "XSD_ANYXML", "APACHE_MAP", "XSD_1999_TIMEINSTANT",
      "XSD_NAMESPACE", "XSD_1999_NAMESPACE", "SOCKET_ENOTUNIQ", "SOCKET_EBADFD",
      "SOCKET_ESTRPIPE", "T_GOTO", "T_NAMESPACE", "T_NS_C", "T_DIR", "T_NS_SEPARATOR",
      "LIBXSLT_VERSION","LIBEXSLT_DOTTED_VERSION", "LIBEXSLT_VERSION",  "SVN_AUTH_PARAM_DEFAULT_USERNAME",
      "SVN_AUTH_PARAM_DEFAULT_PASSWORD", "SVN_AUTH_PARAM_NON_INTERACTIVE",
      "SVN_AUTH_PARAM_DONT_STORE_PASSWORDS", "SVN_AUTH_PARAM_NO_AUTH_CACHE",
      "SVN_AUTH_PARAM_SSL_SERVER_FAILURES", "SVN_AUTH_PARAM_SSL_SERVER_CERT_INFO",
      "SVN_AUTH_PARAM_CONFIG", "SVN_AUTH_PARAM_SERVER_GROUP",
      "SVN_AUTH_PARAM_CONFIG_DIR", "PHP_SVN_AUTH_PARAM_IGNORE_SSL_VERIFY_ERRORS",
      "SVN_FS_CONFIG_FS_TYPE", "SVN_FS_TYPE_BDB", "SVN_FS_TYPE_FSFS", "SVN_PROP_REVISION_DATE",
      "SVN_PROP_REVISION_ORIG_DATE", "SVN_PROP_REVISION_AUTHOR", "SVN_PROP_REVISION_LOG"
      ].forEach(function(element, index, array) {
    	  result[element] = token("atom", "php-predefined-constant");
      });

    // PHP declared classes - output of get_declared_classes(). Differs from http://php.net/manual/en/reserved.classes.php
    [  "stdClass", "Exception", "ErrorException", "COMPersistHelper", "com_exception",
      "com_safearray_proxy", "variant", "com", "dotnet", "ReflectionException",
      "Reflection", "ReflectionFunctionAbstract", "ReflectionFunction",
      "ReflectionParameter", "ReflectionMethod", "ReflectionClass",
      "ReflectionObject", "ReflectionProperty", "ReflectionExtension", "DateTime",
      "DateTimeZone", "LibXMLError", "__PHP_Incomplete_Class", "php_user_filter",
      "Directory", "SimpleXMLElement", "DOMException", "DOMStringList",
      "DOMNameList", "DOMImplementationList", "DOMImplementationSource",
      "DOMImplementation", "DOMNode", "DOMNameSpaceNode", "DOMDocumentFragment",
      "DOMDocument", "DOMNodeList", "DOMNamedNodeMap", "DOMCharacterData", "DOMAttr",
      "DOMElement", "DOMText", "DOMComment", "DOMTypeinfo", "DOMUserDataHandler",
      "DOMDomError", "DOMErrorHandler", "DOMLocator", "DOMConfiguration",
      "DOMCdataSection", "DOMDocumentType", "DOMNotation", "DOMEntity",
      "DOMEntityReference", "DOMProcessingInstruction", "DOMStringExtend",
      "DOMXPath", "RecursiveIteratorIterator", "IteratorIterator", "FilterIterator",
      "RecursiveFilterIterator", "ParentIterator", "LimitIterator",
      "CachingIterator", "RecursiveCachingIterator", "NoRewindIterator",
      "AppendIterator", "InfiniteIterator", "RegexIterator",
      "RecursiveRegexIterator", "EmptyIterator", "ArrayObject", "ArrayIterator",
      "RecursiveArrayIterator", "SplFileInfo", "DirectoryIterator",
      "RecursiveDirectoryIterator", "SplFileObject", "SplTempFileObject",
      "SimpleXMLIterator", "LogicException", "BadFunctionCallException",
      "BadMethodCallException", "DomainException", "InvalidArgumentException",
      "LengthException", "OutOfRangeException", "RuntimeException",
      "OutOfBoundsException", "OverflowException", "RangeException",
      "UnderflowException", "UnexpectedValueException", "SplObjectStorage",
      "XMLReader", "XMLWriter", "mysqli_sql_exception", "mysqli_driver", "mysqli",
      "mysqli_warning", "mysqli_result", "mysqli_stmt", "PDOException", "PDO",
      "PDOStatement", "PDORow","Closure", "DateInterval", "DatePeriod", "FilesystemIterator",
      "GlobIterator", "MultipleIterator", "RecursiveTreeIterator", "SoapClient",
      "SoapFault", "SoapHeader", "SoapParam", "SoapServer", "SoapVar", "SplDoublyLinkedList",
      "SplFixedArray", "SplHeap", "SplMaxHeap", "SplMinHeap", "SplPriorityQueue",
      "SplQueue", "SplStack", "SQLite3", "SQLite3Result", "SQLite3Stmt", "SQLiteDatabase",
      "SQLiteException", "SQLiteResult", "SQLiteUnbuffered", "Svn", "SvnNode", "SvnWc",
      "SvnWcSchedule", "XSLTProcessor", "ZipArchive"
    ].forEach(function(element, index, array) {
      result[element] = token("t_string", "php-predefined-class");
    });

    return result;

  }();

  // Helper regexps
  var isOperatorChar = /[+*&%\/=<>!?.|^@-]/;
  var isHexDigit = /[0-9A-Fa-f]/;
  var isWordChar = /[\w\$_\\]/;

  // Wrapper around phpToken that helps maintain parser state (whether
  // we are inside of a multi-line comment)
  function phpTokenState(inside) {
    return function(source, setState) {
      var newInside = inside;
      var type = phpToken(inside, source, function(c) {newInside = c;});
      if (newInside != inside)
        setState(phpTokenState(newInside));
      return type;
    };
  }

  // The token reader, inteded to be used by the tokenizer from
  // tokenize.js (through phpTokenState). Advances the source stream
  // over a token, and returns an object containing the type and style
  // of that token.
  function phpToken(inside, source, setInside) {
    function readHexNumber(){
      source.next();  // skip the 'x'
      source.nextWhileMatches(isHexDigit);
      return {type: "number", style: "php-atom"};
    }

    function readNumber() {
      source.nextWhileMatches(/[0-9]/);
      if (source.equals(".")){
        source.next();
        source.nextWhileMatches(/[0-9]/);
      }
      if (source.equals("e") || source.equals("E")){
        source.next();
        if (source.equals("-"))
          source.next();
        source.nextWhileMatches(/[0-9]/);
      }
      return {type: "number", style: "php-atom"};
    }
    // Read a word and look it up in the keywords array. If found, it's a
    // keyword of that type; otherwise it's a PHP T_STRING.
    function readWord() {
      source.nextWhileMatches(isWordChar);
      var word = source.get();
      var known = keywords.hasOwnProperty(word) && keywords.propertyIsEnumerable(word) && keywords[word];
      // since we called get(), tokenize::take won't get() anything. Thus, we must set token.content
      return known ? {type: known.type, style: known.style, content: word} :
      {type: "t_string", style: "php-t_string", content: word};
    }
    function readVariable() {
      source.nextWhileMatches(isWordChar);
      var word = source.get();
      // in PHP, '$this' is a reserved word, but 'this' isn't. You can have function this() {...}
      if (word == "$this")
        return {type: "variable", style: "php-keyword", content: word};
      else
        return {type: "variable", style: "php-variable", content: word};
    }

    // Advance the stream until the given character (not preceded by a
    // backslash) is encountered, or the end of the line is reached.
    function nextUntilUnescaped(source, end) {
      var escaped = false;
      while(!source.endOfLine()){
        var next = source.next();
        if (next == end && !escaped)
          return false;
        escaped = next == "\\" && !escaped;
      }
      return escaped;
    }

    function readSingleLineComment() {
      // read until the end of the line or until ?>, which terminates single-line comments
      // `<?php echo 1; // comment ?> foo` will display "1 foo"
      while(!source.lookAhead("?>") && !source.endOfLine())
        source.next();
      return {type: "comment", style: "php-comment"};
    }
    /* For multi-line comments, we want to return a comment token for
       every line of the comment, but we also want to return the newlines
       in them as regular newline tokens. We therefore need to save a
       state variable ("inside") to indicate whether we are inside a
       multi-line comment.
    */

    function readMultilineComment(start){
      var newInside = "/*";
      var maybeEnd = (start == "*");
      while (true) {
        if (source.endOfLine())
          break;
        var next = source.next();
        if (next == "/" && maybeEnd){
          newInside = null;
          break;
        }
        maybeEnd = (next == "*");
      }
      setInside(newInside);
      return {type: "comment", style: "php-comment"};
    }

    // similar to readMultilineComment and nextUntilUnescaped
    // unlike comments, strings are not stopped by ?>
    function readMultilineString(start){
      var newInside = start;
      var escaped = false;
      while (true) {
        if (source.endOfLine())
          break;
        var next = source.next();
        if (next == start && !escaped){
          newInside = null;  // we're outside of the string now
          break;
        }
        escaped = (next == "\\" && !escaped);
      }
      setInside(newInside);
      return {
        type: newInside == null? "string" : "string_not_terminated",
        style: (start == "'"? "php-string-single-quoted" : "php-string-double-quoted")
      };
    }

    // http://php.net/manual/en/language.types.string.php#language.types.string.syntax.heredoc
    // See also 'nowdoc' on the page. Heredocs are not interrupted by the '?>' token.
    function readHeredoc(identifier){
      var token = {};
      if (identifier == "<<<") {
        // on our first invocation after reading the <<<, we must determine the closing identifier
        if (source.equals("'")) {
          // nowdoc
          source.nextWhileMatches(isWordChar);
          identifier = "'" + source.get() + "'";
          source.next();  // consume the closing "'"
        } else if (source.matches(/[A-Za-z_]/)) {
          // heredoc
          source.nextWhileMatches(isWordChar);
          identifier = source.get();
        } else {
          // syntax error
          setInside(null);
          return { type: "error", style: "syntax-error" };
        }
        setInside(identifier);
        token.type = "string_not_terminated";
        token.style = identifier.charAt(0) == "'"? "php-string-single-quoted" : "php-string-double-quoted";
        token.content = identifier;
      } else {
        token.style = identifier.charAt(0) == "'"? "php-string-single-quoted" : "php-string-double-quoted";
        // consume a line of heredoc and check if it equals the closing identifier plus an optional semicolon
        if (source.lookAhead(identifier, true) && (source.lookAhead(";\n") || source.endOfLine())) {
          // the closing identifier can only appear at the beginning of the line
          // note that even whitespace after the ";" is forbidden by the PHP heredoc syntax
          token.type = "string";
          token.content = source.get();  // don't get the ";" if there is one
          setInside(null);
        } else {
          token.type = "string_not_terminated";
          source.nextWhileMatches(/[^\n]/);
          token.content = source.get();
        }
      }
      return token;
    }

    function readOperator() {
      source.nextWhileMatches(isOperatorChar);
      return {type: "operator", style: "php-operator"};
    }
    function readStringSingleQuoted() {
      var endBackSlash = nextUntilUnescaped(source, "'", false);
      setInside(endBackSlash ? "'" : null);
      return {type: "string", style: "php-string-single-quoted"};
    }
    function readStringDoubleQuoted() {
      var endBackSlash = nextUntilUnescaped(source, "\"", false);
      setInside(endBackSlash ? "\"": null);
      return {type: "string", style: "php-string-double-quoted"};
    }

    // Fetch the next token. Dispatches on first character in the
    // stream, or first two characters when the first is a slash.
    switch (inside) {
      case null:
      case false: break;
      case "'":
      case "\"": return readMultilineString(inside);
      case "/*": return readMultilineComment(source.next());
      default: return readHeredoc(inside);
    }
    var ch = source.next();
    if (ch == "'" || ch == "\"")
      return readMultilineString(ch);
    else if (ch == "#")
      return readSingleLineComment();
    else if (ch == "$")
      return readVariable();
    else if (ch == ":" && source.equals(":")) {
      source.next();
      // the T_DOUBLE_COLON can only follow a T_STRING (class name)
      return {type: "t_double_colon", style: "php-operator"};
    }
    // with punctuation, the type of the token is the symbol itself
    else if (/[\[\]{}\(\),;:]/.test(ch)) {
      return {type: ch, style: "php-punctuation"};
    }
    else if (ch == "0" && (source.equals("x") || source.equals("X")))
      return readHexNumber();
    else if (/[0-9]/.test(ch))
      return readNumber();
    else if (ch == "/") {
      if (source.equals("*"))
      { source.next(); return readMultilineComment(ch); }
      else if (source.equals("/"))
        return readSingleLineComment();
      else
        return readOperator();
    }
    else if (ch == "<") {
      if (source.lookAhead("<<", true)) {
        setInside("<<<");
        return {type: "<<<", style: "php-punctuation"};
      }
      else
        return readOperator();
    }
    else if (isOperatorChar.test(ch))
      return readOperator();
    else
      return readWord();
  }

  // The external interface to the tokenizer.
  return function(source, startState) {
    return tokenizer(source, startState || phpTokenState(false, true));
  };
})();
