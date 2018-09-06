// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function () {
    var mode = CodeMirror.getMode({indentUnit: 2}, "clojure");

    function MT(name) {
        test.mode(name, mode, Array.prototype.slice.call(arguments, 1));
    }

    MT("atoms",
        "[atom nil]",
        "[atom false]",
        "[atom true]"
    );

    MT("keywords",
        "[atom :foo]",
        "[atom ::bar]",
        "[atom :foo/bar]",
        "[atom :foo.bar/baz]"
    );

    MT("numbers",
        "[number 42] [number +42] [number -421]",
        "[number 42N] [number +42N] [number -42N]",
        "[number 0.42] [number +0.42] [number -0.42]",
        "[number 42M] [number +42M] [number -42M]",
        "[number 42.42M] [number +42.42M] [number -42.42M]",
        "[number 1/42] [number +1/42] [number -1/42]",
        "[number 0x42af] [number +0x42af] [number -0x42af]",
        "[number 0x42AF] [number +0x42AF] [number -0x42AF]",
        "[number 1e2] [number 1e+2] [number 1e-2]",
        "[number +1e2] [number +1e+2] [number +1e-2]",
        "[number -1e2] [number -1e+2] [number -1e-2]",
        "[number -1.0e2] [number -0.1e+2] [number -1.01e-2]",
        "[number 1E2] [number 1E+2] [number 1E-2]",
        "[number +1E2] [number +1E+2] [number +1E-2]",
        "[number -1E2] [number -1E+2] [number -1E-2]",
        "[number -1.0E2] [number -0.1E+2] [number -1.01E-2]",
        "[number 2r101010] [number +2r101010] [number -2r101010]",
        "[number 2r101010] [number +2r101010] [number -2r101010]",
        "[number 8r52] [number +8r52] [number -8r52]",
        "[number 36rhello] [number +36rhello] [number -36rhello]",
        "[number 36rz] [number +36rz] [number -36rz]",
        "[number 36rZ] [number +36rZ] [number -36rZ]"
    );

    MT("characters",
        "[string-2 \\1]",
        "[string-2 \\a]",
        "[string-2 \\#]",
        "[string-2 \\\\]",
        "[string-2 \\\"]",
        "[string-2 \\(]",
        "[string-2 \\A]",
        "[string-2 \\backspace]",
        "[string-2 \\formfeed]",
        "[string-2 \\newline]",
        "[string-2 \\space]",
        "[string-2 \\return]",
        "[string-2 \\tab]",
        "[string-2 \\u1000]",
        "[string-2 \\uAaAa]",
        "[string-2 \\u9F9F]"
    );

    MT("strings",
        "[string \"I'm a teapot.\"]",
        "[string \"I'm a \\\"teapot\\\".\"]",
        "[string \"I'm]",       // this is
        "[string a]",           // a multi-line
        "[string teapot.\"]"    // string
    );

    MT("comments",
        "[comment ; this is an in-line comment.]",
        "[comment ;; this is a line comment.]"
        // FIXME
        // "[bracket (][comment comment] [comment (][comment foo] [comment 1] [comment 2] [comment 3][comment )][bracket )]"
    );

    MT("reader macro characters",
        "[meta #][variable _]",
        "[meta @][variable x]",
        "[meta ^][bracket {][atom :tag] [variable String][bracket }]",
        "[meta `][bracket (][builtin f] [variable x][bracket )]",
        "[meta ~][variable foo#]",
        "[meta '][number 1]",
        "[meta '][atom :foo]",
        "[meta '][string \"foo\"]",
        "[meta '][variable x]",
        "[meta '][bracket (][builtin a] [variable b] [variable c][bracket )]",
        "[meta '][bracket [[][variable a] [variable b] [variable c][bracket ]]]",
        "[meta '][bracket {][variable a] [number 1] [atom :foo] [number 2] [variable c] [number 3][bracket }]",
        "[meta '#][bracket {][variable a] [number 1] [atom :foo][bracket }]"
    );

    var specialForms = [".", "catch", "def", "do", "if", "monitor-enter",
        "monitor-exit", "new", "quote", "recur", "set!", "throw", "try", "var"];

    MT("should highlight special forms as keywords",
        typeTokenPairs("keyword", specialForms)
    );

    var coreSymbols1 = [
        "*", "*'", "*1", "*2", "*3", "*agent*", "*allow-unresolved-vars*", "*assert*",
        "*clojure-version*", "*command-line-args*", "*compile-files*", "*compile-path*", "*compiler-options*",
        "*data-readers*", "*default-data-reader-fn*", "*e", "*err*", "*file*", "*flush-on-newline*", "*fn-loader*",
        "*in*", "*math-context*", "*ns*", "*out*", "*print-dup*", "*print-length*", "*print-level*", "*print-meta*",
        "*print-namespace-maps*", "*print-readably*", "*read-eval*", "*reader-resolver*", "*source-path*",
        "*suppress-read*", "*unchecked-math*", "*use-context-classloader*", "*verbose-defrecords*",
        "*warn-on-reflection*", "+", "+'", "-", "-'", "->", "->>", "->ArrayChunk", "->Eduction", "->Vec", "->VecNode",
        "->VecSeq", "-cache-protocol-fn", "-reset-methods", "..", "/", "<", "<=", "=", "==", ">", ">=",
        "EMPTY-NODE", "Inst", "StackTraceElement->vec", "Throwable->map", "accessor", "aclone", "add-classpath",
        "add-watch", "agent", "agent-error", "agent-errors", "aget", "alength", "alias", "all-ns", "alter",
        "alter-meta!", "alter-var-root", "amap", "ancestors", "and", "any?", "apply", "areduce", "array-map",
        "as->", "aset", "aset-boolean", "aset-byte", "aset-char", "aset-double", "aset-float", "aset-int",
        "aset-long", "aset-short", "assert", "assoc", "assoc!", "assoc-in", "associative?", "atom", "await",
        "await-for", "await1", "bases", "bean", "bigdec", "bigint", "biginteger", "binding", "bit-and", "bit-and-not",
        "bit-clear", "bit-flip", "bit-not", "bit-or", "bit-set", "bit-shift-left", "bit-shift-right", "bit-test",
        "bit-xor", "boolean", "boolean-array", "boolean?", "booleans", "bound-fn", "bound-fn*", "bound?",
        "bounded-count", "butlast", "byte", "byte-array", "bytes", "bytes?", "case", "cast", "cat", "char",
        "char-array", "char-escape-string", "char-name-string", "char?", "chars", "chunk", "chunk-append",
        "chunk-buffer", "chunk-cons", "chunk-first", "chunk-next", "chunk-rest", "chunked-seq?", "class", "class?",
        "clear-agent-errors", "clojure-version", "coll?", "comment", "commute", "comp", "comparator", "compare",
        "compare-and-set!", "compile", "complement", "completing", "concat", "cond", "cond->", "cond->>", "condp",
        "conj", "conj!", "cons", "constantly", "construct-proxy", "contains?", "count", "counted?", "create-ns",
        "create-struct", "cycle", "dec", "dec'", "decimal?", "declare", "dedupe", "default-data-readers", "definline",
        "definterface", "defmacro", "defmethod", "defmulti", "defn", "defn-", "defonce", "defprotocol", "defrecord",
        "defstruct", "deftype", "delay", "delay?", "deliver", "denominator", "deref", "derive", "descendants",
        "destructure", "disj", "disj!", "dissoc", "dissoc!", "distinct", "distinct?", "doall", "dorun", "doseq",
        "dosync", "dotimes", "doto", "double", "double-array", "double?", "doubles", "drop", "drop-last", "drop-while",
        "eduction", "empty", "empty?", "ensure", "ensure-reduced", "enumeration-seq", "error-handler", "error-mode",
        "eval", "even?", "every-pred", "every?", "ex-data", "ex-info", "extend", "extend-protocol", "extend-type",
        "extenders", "extends?", "false?", "ffirst", "file-seq", "filter", "filterv", "find", "find-keyword", "find-ns",
        "find-protocol-impl", "find-protocol-method", "find-var", "first", "flatten", "float", "float-array", "float?",
        "floats", "flush", "fn", "fn?", "fnext", "fnil", "for", "force", "format", "frequencies", "future", "future-call",
        "future-cancel", "future-cancelled?", "future-done?", "future?", "gen-class", "gen-interface", "gensym", "get",
        "get-in", "get-method", "get-proxy-class", "get-thread-bindings", "get-validator", "group-by", "halt-when", "hash",
        "hash-combine", "hash-map", "hash-ordered-coll", "hash-set", "hash-unordered-coll", "ident?", "identical?",
        "identity", "if-let", "if-not", "if-some", "ifn?", "import", "in-ns", "inc", "inc'", "indexed?", "init-proxy",
        "inst-ms", "inst-ms*", "inst?", "instance?", "int", "int-array", "int?", "integer?", "interleave", "intern",
        "interpose", "into", "into-array", "ints", "io!", "isa?", "iterate", "iterator-seq", "juxt", "keep", "keep-indexed",
        "key", "keys", "keyword", "keyword?", "last", "lazy-cat", "lazy-seq", "let", "letfn", "line-seq", "list", "list*",
        "list?", "load", "load-file", "load-reader", "load-string", "loaded-libs", "locking", "long", "long-array", "longs",
        "loop", "macroexpand", "macroexpand-1", "make-array", "make-hierarchy", "map", "map-entry?", "map-indexed", "map?",
        "mapcat", "mapv", "max", "max-key", "memfn", "memoize", "merge", "merge-with", "meta", "method-sig", "methods"];

    var coreSymbols2 = [
        "min", "min-key", "mix-collection-hash", "mod", "munge", "name", "namespace", "namespace-munge", "nat-int?",
        "neg-int?", "neg?", "newline", "next", "nfirst", "nil?", "nnext", "not", "not-any?", "not-empty", "not-every?",
        "not=", "ns", "ns-aliases", "ns-imports", "ns-interns", "ns-map", "ns-name", "ns-publics", "ns-refers", "ns-resolve",
        "ns-unalias", "ns-unmap", "nth", "nthnext", "nthrest", "num", "number?", "numerator", "object-array", "odd?", "or",
        "parents", "partial", "partition", "partition-all", "partition-by", "pcalls", "peek", "persistent!", "pmap", "pop",
        "pop!", "pop-thread-bindings", "pos-int?", "pos?", "pr", "pr-str", "prefer-method", "prefers",
        "primitives-classnames", "print", "print-ctor", "print-dup", "print-method", "print-simple", "print-str", "printf",
        "println", "println-str", "prn", "prn-str", "promise", "proxy", "proxy-call-with-super", "proxy-mappings",
        "proxy-name", "proxy-super", "push-thread-bindings", "pvalues", "qualified-ident?", "qualified-keyword?",
        "qualified-symbol?", "quot", "rand", "rand-int", "rand-nth", "random-sample", "range", "ratio?", "rational?",
        "rationalize", "re-find", "re-groups", "re-matcher", "re-matches", "re-pattern", "re-seq", "read", "read-line",
        "read-string", "reader-conditional", "reader-conditional?", "realized?", "record?", "reduce", "reduce-kv", "reduced",
        "reduced?", "reductions", "ref", "ref-history-count", "ref-max-history", "ref-min-history", "ref-set", "refer",
        "refer-clojure", "reify", "release-pending-sends", "rem", "remove", "remove-all-methods", "remove-method", "remove-ns",
        "remove-watch", "repeat", "repeatedly", "replace", "replicate", "require", "reset!", "reset-meta!", "reset-vals!",
        "resolve", "rest", "restart-agent", "resultset-seq", "reverse", "reversible?", "rseq", "rsubseq", "run!", "satisfies?",
        "second", "select-keys", "send", "send-off", "send-via", "seq", "seq?", "seqable?", "seque", "sequence", "sequential?",
        "set", "set-agent-send-executor!", "set-agent-send-off-executor!", "set-error-handler!", "set-error-mode!",
        "set-validator!", "set?", "short", "short-array", "shorts", "shuffle", "shutdown-agents", "simple-ident?",
        "simple-keyword?", "simple-symbol?", "slurp", "some", "some->", "some->>", "some-fn", "some?", "sort", "sort-by",
        "sorted-map", "sorted-map-by", "sorted-set", "sorted-set-by", "sorted?", "special-symbol?", "spit", "split-at",
        "split-with", "str", "string?", "struct", "struct-map", "subs", "subseq", "subvec", "supers", "swap!", "swap-vals!",
        "symbol", "symbol?", "sync", "tagged-literal", "tagged-literal?", "take", "take-last", "take-nth", "take-while", "test",
        "the-ns", "thread-bound?", "time", "to-array", "to-array-2d", "trampoline", "transduce", "transient", "tree-seq",
        "true?", "type", "unchecked-add", "unchecked-add-int", "unchecked-byte", "unchecked-char", "unchecked-dec",
        "unchecked-dec-int", "unchecked-divide-int", "unchecked-double", "unchecked-float", "unchecked-inc", "unchecked-inc-int",
        "unchecked-int", "unchecked-long", "unchecked-multiply", "unchecked-multiply-int", "unchecked-negate",
        "unchecked-negate-int", "unchecked-remainder-int", "unchecked-short", "unchecked-subtract", "unchecked-subtract-int",
        "underive", "unquote", "unquote-splicing", "unreduced", "unsigned-bit-shift-right", "update", "update-in",
        "update-proxy", "uri?", "use", "uuid?", "val", "vals", "var-get", "var-set", "var?", "vary-meta", "vec", "vector",
        "vector-of", "vector?", "volatile!", "volatile?", "vreset!", "vswap!", "when", "when-first", "when-let", "when-not",
        "when-some", "while", "with-bindings", "with-bindings*", "with-in-str", "with-loading-context", "with-local-vars",
        "with-meta", "with-open", "with-out-str", "with-precision", "with-redefs", "with-redefs-fn", "xml-seq", "zero?",
        "zipmap"
    ];

    MT("should highlight core symbols as keywords (part 1/2)",
        typeTokenPairs("keyword", coreSymbols1)
    );

    MT("should highlight core symbols as keywords (part 2/2)",
        typeTokenPairs("keyword", coreSymbols2)
    );

    MT("should indent list literal",
        "[bracket (][builtin foo] [atom :a] [number 1] [atom true] [atom nil][bracket )]",
        "",
        "[bracket (][builtin foo] [atom :a]",
        "     [number 1]",
        "     [atom true]",
        "     [atom nil][bracket )]",
        "",
        "[bracket (][builtin foo] [atom :a] [number 1]",
        "     [atom true]",
        "     [atom nil][bracket )]",
        "",
        "[bracket (]",
        " [builtin foo]",
        " [atom :a]",
        " [number 1]",
        " [atom true]",
        " [atom nil][bracket )]",
        "",
        "[bracket (][builtin foo] [bracket [[][atom :a][bracket ]]]",
        "     [number 1]",
        "     [atom true]",
        "     [atom nil][bracket )]"
    );

    MT("should indent vector literal",
        "[bracket [[][atom :a] [number 1] [atom true] [atom nil][bracket ]]]",
        "",
        "[bracket [[][atom :a]",
        " [number 1]",
        " [atom true]",
        " [atom nil][bracket ]]]",
        "",
        "[bracket [[][atom :a] [number 1]",
        " [atom true]",
        " [atom nil][bracket ]]]",
        "",
        "[bracket [[]",
        " [variable foo]",
        " [atom :a]",
        " [number 1]",
        " [atom true]",
        " [atom nil][bracket ]]]"
    );

    MT("should indent map literal",
        "[bracket {][atom :a] [atom :a] [atom :b] [number 1] [atom :c] [atom true] [atom :d] [atom nil] [bracket }]",
        "",
        "[bracket {][atom :a] [atom :a]",
        " [atom :b] [number 1]",
        " [atom :c] [atom true]",
        " [atom :d] [atom nil][bracket }]",
        "",
        "[bracket {][atom :a]",
        " [atom :a]",
        " [atom :b]",
        " [number 1]",
        " [atom :c]",
        " [atom true]",
        " [atom :d]",
        " [atom nil][bracket }]",
        "",
        "[bracket {]",
        " [atom :a] [atom :a]",
        " [atom :b] [number 1]",
        " [atom :c] [atom true]",
        " [atom :d] [atom nil][bracket }]"
    );

    MT("should indent set literal",
        "[meta #][bracket {][atom :a] [number 1] [atom true] [atom nil] [bracket }]",
        "",
        "[meta #][bracket {][atom :a]",
        "  [number 1]",
        "  [atom true]",
        "  [atom nil][bracket }]",
        "",
        "[meta #][bracket {]",
        "  [atom :a]",
        "  [number 1]",
        "  [atom true]",
        "  [atom nil][bracket }]"
    );

    MT("should indent assoc",
        "[bracket (][keyword assoc] [variable foo]",
        "  [atom :1] [string \"three\"]",
        "  [atom :2] [string \"two\"]",
        "  [atom :3] [string \"three\"][bracket )]"
    );

    MT("should indent binding",
        "[bracket (][keyword binding] [bracket [[][variable foo] [number 2]",
        "          [variable *bar*] [number 3][bracket ]]]",
        "  [bracket (][keyword +] [variable foo] [variable *bar*][bracket ))]");

    MT("should indent bound-fn",
        "[bracket (][keyword bound-fn] [bracket [[]]]",
        "  [bracket (][builtin f][bracket ))]"
    );

    MT("should indent case",
        "[bracket (][keyword case] [variable foo]",
        "  [string \"\"] [number 0]",
        "  [string \"hello\"] [atom :bar]",
        "  [bracket [[][number 1] [number 2][bracket ]]] [bracket (][string \"my seq\"][bracket )]",
        "  [bracket (][builtin x] [variable y] [variable z][bracket )] [string \"x, y, or z\"]",
        "  [atom :default]"
    );

    MT("should indent catch",
        "[bracket (][keyword catch] [variable Exception] [variable e]",
        "  [bracket (][keyword println] [string \"Some other exception, won't be caught in this case...\"][bracket )]",
        "  [number 666][bracket )]"
    );

    MT("should indent comment",
        "[bracket (][keyword comment] [bracket (][builtin foo][bracket )]",
        "  [bracket (][builtin bar] [number 1] [number 2] [number 3][bracket ))]"
    );

    MT("should indent cond",
        "[bracket (][keyword cond]",
        "  [bracket (][keyword <] [variable n] [number 0][bracket )] [string \"negative\"]",
        "  [bracket (][keyword >] [variable n] [number 0][bracket )] [string \"positive\"]",
        "  [atom :else] [string \"zero\"][bracket ))]"
    );

    MT("should indent condp",
        "[bracket (][keyword condp] [keyword =] [variable foo]",
        "  [number 1] [string \"one\"]",
        "  [number 2] [string \"two\"]",
        "  [number 3] [string \"three\"]",
        "  [string \"unexpected value\"][bracket )]"
    );

    MT("should indent def",
        "[bracket (][keyword def] [variable x]",
        "  [string \"here is an indented doc-string.\"]",
        "  [number 1][bracket )]"
    );

    MT("should indent defn",
        "[bracket (][keyword defn] [variable foo]",
        "  [bracket [[][variable x][bracket ]]]",
        "  [bracket (][builtin bar] [variable x][bracket ))]",
        "",
        "[bracket (][keyword defn] [variable foo] [bracket [[][variable x][bracket ]]]",
        "  [bracket (][builtin bar] [variable x][bracket ))]"
    );

    MT("should indent defmacro",
        "[bracket (][keyword defmacro] [variable foo]",
        "  [string \"here is an indented doc-string.\"]",
        "  [bracket [[][variable x] [variable y][bracket ]]]",
        "  [meta `][bracket (][keyword println] [meta ~][variable x#] [meta ~@][variable y][bracket ))]"
    );

    MT("should indent defmethod",
        "[bracket (][keyword defmethod] [variable foo] [atom :bar] [bracket [[][variable x][bracket ]]] [bracket (][builtin baz] [variable x][bracket ))]",
        "",
        "[bracket (][keyword defmethod] [variable foo] [atom :bar]",
        "  [bracket [[][variable x][bracket ]]]",
        "  [bracket (][builtin baz] [variable x][bracket ))]"
    );

    MT("should indent defstruct",
        "[bracket (][keyword defstruct] [variable person]",
        "  [atom :name]",
        "  [atom :age]",
        "  [atom :height][bracket )]"
    );

    MT("should indent doseq",
        "[bracket (][keyword doseq] [bracket [[][variable x] [bracket [[][number -1] [number 0] [number 1][bracket ]]]",
        "        [variable y] [bracket [[][number 1] [number 2] [number 3][bracket ]]]]]",
        "  [bracket (][keyword prn] [bracket (][keyword *] [variable x] [variable y][bracket )))]"
    );

    MT("should indent dotimes",
        "[bracket (][keyword dotimes] [bracket [[][variable n] [number 5][bracket ]]]",
        "  [bracket (][keyword println] [string \"n is\"] [variable n][bracket ))]");

    MT("should indent for",
        "[bracket (][keyword for] [bracket [[][variable x] [bracket [[][number 1] [number 2] [number 3][bracket ]]]",
        "      [atom :let] [bracket [[][variable y] [bracket (][keyword *] [variable x] [number 3][bracket )]]]",
        "      [atom :when] [bracket (][keyword even?] [variable y][bracket )]]]",
        "  [variable y][bracket )]"
    );

    MT("should indent if-let",
        "[bracket (][keyword if-let] [bracket [[][variable x] [variable foo][bracket ]]]",
        "  [string \"then\"]",
        "  [string \"else\"][bracket ))]"
    );

    MT("should indent let",
        "[bracket (][keyword let] [bracket [[][variable foo] [number 2]",
        "      [variable bar] [number 3][bracket ]]]",
        "  [bracket (][keyword +] [variable foo] [variable *bar*][bracket ))]"
    );

    MT("should indent letfn",
        "[bracket (][keyword letfn] [bracket [[(][builtin twice] [bracket [[][variable x][bracket ]]]",
        "               [bracket (][keyword *] [variable x] [number 2][bracket ))]",
        "        [bracket (][builtin six-times] [bracket [[][variable y][bracket ]]]",
        "                   [bracket (][keyword *] [bracket (][builtin twice] [variable y][bracket )] [number 3][bracket ))]]]",
        "  [bracket (][keyword println] [string \"twice 15 =\"] [bracket (][builtin twice] [number 15][bracket ))]",
        "  [bracket (][keyword println] [string \"six times 15 =\"] [bracket (][builtin six-times] [number 15][bracket )))]"
    );

    MT("should indent loop",
        "[bracket (][keyword loop] [bracket [[][variable foo] [number 2]",
        "       [variable bar] [number 3][bracket ]]]",
        "  [bracket (][keyword +] [variable foo] [variable *bar*][bracket ))]"
    );

    MT("should indent when-first",
        "[bracket (][keyword when-first] [bracket [[][variable a] [bracket [[][number 1] [number 2] [number 3][bracket ]]]]]",
        "  [variable a][bracket )]"
    );

    MT("should indent when-let",
        "[bracket (][keyword when-let] [bracket [[][variable x] [variable foo][bracket ]]]",
        "  [string \"foo\"]"
    );

    MT("should indent when-some",
        "[bracket (][keyword when-some] [bracket [[][variable x] [variable foo][bracket ]]]",
        "  [string \"foo\"]"
    );

    MT("should indent struct-map",
        "[bracket (][keyword struct-map] [variable foo]",
        "  [atom :1] [string \"one\"]",
        "  [atom :2] [string \"two\"][bracket )]"
    );

    MT("should indent defprotocol",
        "[bracket (][keyword defprotocol] [variable Protocol]",
        "  [bracket (][builtin foo] [bracket [[][variable this][bracket ]])]",
        "  [bracket (][builtin bar] [bracket [[][variable this][bracket ]]] [bracket [[][variable this] [variable x][bracket ]])]",
        "  [bracket (][builtin baz] [bracket [[][variable this][bracket ]]]",
        "       [bracket [[][variable this] [variable y][bracket ]]))]"
    );

    MT("should indent defrecord",
        "[bracket (][keyword defrecord] [variable Person] [bracket [[][variable first-name] [variable last-name] [variable address][bracket ]])]",
        "",
        "[bracket (][keyword defrecord] [variable Person] [bracket [[][variable first-name] [variable last-name] [variable address][bracket ]]]",
        "  [variable Protocol]",
        "  [bracket (][builtin foo] [bracket [[][variable this][bracket ]]] [variable first-name][bracket )]",
        "  [bracket (][builtin bar] [bracket [[][variable this][bracket ]]] [variable last-name][bracket )]",
        "  [bracket (][builtin baz] [bracket [[][variable this] [variable y][bracket ]]] [bracket (][keyword str] [variable first-name] [variable last-name][bracket )))]",
        "",
        "[bracket (][keyword defrecord] [variable Person] [bracket [[][variable first-name]",
        "                   [variable last-name]",
        "                   [variable address][bracket ]])]",
        "",
        "[bracket (][keyword defrecord] [variable Person]",
        "  [bracket [[][variable first-name]",
        "   [variable last-name]",
        "   [variable address][bracket ]])]"
    );

    MT("should indent deftype",
        "[bracket (][keyword deftype] [variable Person] [bracket [[][variable first-name] [variable last-name] [variable address][bracket ]])]",
        "",
        "[bracket (][keyword deftype] [variable Person] [bracket [[][variable first-name] [variable last-name] [variable address][bracket ]]]",
        "  [variable Protocol]",
        "  [bracket (][builtin foo] [bracket [[][variable this][bracket ]]] [variable first-name][bracket )]",
        "  [bracket (][builtin bar] [bracket [[][variable this][bracket ]]] [variable last-name][bracket )]",
        "  [bracket (][builtin baz] [bracket [[][variable this] [variable y][bracket ]]] [bracket (][keyword str] [variable first-name] [variable last-name][bracket )))]",
        "",
        "[bracket (][keyword deftype] [variable Person] [bracket [[][variable first-name]",
        "                 [variable last-name]",
        "                 [variable address][bracket ]])]",
        "",
        "[bracket (][keyword deftype] [variable Person]",
        "  [bracket [[][variable first-name]",
        "   [variable last-name]",
        "   [variable address][bracket ]])]"
    );

    MT("should indent do",
        "[bracket (][keyword do] [bracket (][builtin foo][bracket )]",
        "  [bracket (][builtin bar][bracket ))]",
        "",
        "[bracket (][keyword do]",
        "  [bracket (][builtin foo][bracket )]",
        "  [bracket (][builtin bar][bracket ))]"
    );

    MT("should indent doto",
        "[bracket (][keyword doto] [bracket (][keyword new] [variable java.util.HashMap][bracket )] [bracket (][builtin .put] [string \"a\"] [number 1][bracket )] [bracket (][builtin .put] [string \"b\"] [number 2][bracket ))]",
        "",
        "[bracket (][keyword doto] [bracket (][builtin java.util.HashMap.][bracket )]",
        "  [bracket (][builtin .put] [string \"a\"] [number 1][bracket )]",
        "  [bracket (][builtin .put] [string \"b\"] [number 2][bracket ))]"
    );

    MT("should indent extend",
        "[bracket (][keyword extend] [variable FooType]",
        "  [variable FooProtocol]",
        "  [bracket {][atom :foo] [variable an-existing-fn]",
        "   [atom :bar] [bracket (][keyword fn] [bracket [[][variable a] [variable b][bracket ]]]",
        "          [bracket (][builtin f] [variable a] [variable b][bracket ))]",
        "   [atom :baz] [bracket (][keyword fn] [bracket ([[][variable a][bracket ]]] [variable a][bracket )]",
        "          [bracket ([[][variable a] [variable b][bracket ]]] [bracket [[][variable a] [variable b][bracket ]]))})]"
    );

    MT("should indent extend-protocol",
        "[bracket (][keyword extend-protocol] [variable Protocol]",
        "  [variable FooType]",
        "  [bracket (][builtin foo] [bracket [[][variable x][bracket ]]] [bracket (][builtin f] [variable x][bracket ))]",
        "  [bracket (][builtin bar] [bracket [[][variable x] [variable y][bracket ]]] [bracket (][builtin g] [variable x] [variable y][bracket ))]"
    );

    MT("should indent extend-type",
        "[bracket (][keyword extend-type] [variable FooType]",
        "  [variable Countable]",
        "  [bracket (][builtin cnt] [bracket [][variable c][bracket ]]] [bracket (][keyword count] [variable c][bracket ))]",
        "  ",
        "  [variable Foo]",
        "  [bracket (][builtin bar] [bracket [[][variable x] [variable y][bracket ]]] [bracket (][builtin f] [variable x] [variable y][bracket ))]",
        "  [bracket (][builtin baz] [bracket ([][variable x] [variable x][bracket ]])] [bracket ([[][variable x] [variable y] [variable &] [variable zs][bracket ]]] [bracket [[][variable x] [variable y] [bracket (][builtin g] [variable zs][bracket )]])))]"
    );

    MT("should indent fn",
        "[bracket (][keyword fn] [variable foo]",
        "  [bracket [[][variable x][bracket ]]]",
        "  [bracket (][builtin bar] [variable x][bracket ))]",
        "",
        "[bracket (][keyword fn] [variable foo] [bracket [[][variable x][bracket ]]]",
        "  [bracket (][builtin bar] [variable x][bracket ))]"
    );

    MT("should indent future",
        "[bracket (][keyword future] [bracket (][builtin Thread/sleep] [number 10000][bracket )] [bracket (][keyword println] [string \"done\"][bracket )] [number 100][bracket )]",
        "",
        "[bracket (][keyword future] [bracket (][builtin Thread/sleep] [number 10000][bracket )]",
        "  [bracket (][keyword println] [string \"done\"][bracket )]",
        "  [number 100][bracket )]",
        "",
        "[bracket (][keyword future]",
        "  [bracket (][builtin Thread/sleep] [number 10000][bracket )]",
        "  [bracket (][keyword println] [string \"done\"][bracket )]",
        "  [number 100][bracket )]"
    );

    MT("should indent if",
        "[bracket (][keyword if] [bracket (][keyword <] [variable foo] [number 100][bracket )] [string \"yes\"] [string \"no\"][bracket )]",
        "",
        "[bracket (][keyword if] [bracket (][keyword <] [variable foo] [number 100][bracket )]",
        "  [string \"yes\"]",
        "  [string \"no\"][bracket )]",
        "",
        "[bracket (][keyword if] [bracket (][keyword and] [bracket (][keyword <] [variable foo] [number 100][bracket )]",
        "         [bracket (][keyword <] [variable bar] [number 50][bracket ))]",
        "  [string \"yes\"]",
        "  [string \"no\"][bracket )]"
    );

    MT("should indent if-not",
        "[bracket (][keyword if-not] [bracket (][keyword <] [variable foo] [number 100][bracket )] [string \"yes\"] [string \"no\"][bracket )]",
        "",
        "[bracket (][keyword if-not] [bracket (][keyword <] [variable foo] [number 100][bracket )]",
        "  [string \"yes\"]",
        "  [string \"no\"][bracket )]",
        "",
        "[bracket (][keyword if-not] [bracket (][keyword and] [bracket (][keyword <] [variable foo] [number 100][bracket )]",
        "             [bracket (][keyword <] [variable bar] [number 50][bracket ))]",
        "  [string \"yes\"]",
        "  [string \"no\"][bracket )]"
    );

    MT("should indent locking",
        "[bracket (][keyword locking] [variable foo] [bracket (][builtin Thread/sleep] [number 1000][bracket )] [bracket (][keyword println] [string \"done\"][bracket ))]",
        "",
        "[bracket (][keyword locking] [variable foo]",
        "  [bracket (][builtin Thread/sleep] [number 1000][bracket )]",
        "  [bracket (][keyword println] [string \"done\"][bracket ))]"
    );

    MT("should indent ns",
        "[bracket (][keyword ns] [variable foo.bar]",
        "  [bracket (][atom :refer-clojure] [atom :exclude] [bracket [][keyword ancestors] [keyword printf][bracket ]])]",
        "  [bracket (][atom :require] [bracket [][variable clojure.contrib] [variable sql] [variable combinatorics][bracket ]])]",
        "  [bracket (][atom :use] [bracket [][variable my.lib] [variable this] [variable that][bracket ]])]",
        "  [bracket (][atom :import] [bracket (][builtin java.util] [variable Date] [variable Timer] [variable Random][bracket )]",
        "           [bracket (][builtin java.sql] [variable Connection] [variable Statement][bracket )))]"
    );

    MT("should indent proxy",
        "[bracket (][keyword proxy] [bracket [][variable MouseAdapter][bracket ]]] [bracket [[]]]",
        "  [bracket (][builtin mousePressed] [bracket [][variable event][bracket ]]]",
        "                [bracket (][keyword apply] [variable f] [variable event] [variable args][bracket )))]"
    );

    MT("should indent reify",
        "[bracket (][keyword reify] [variable Foo]",
        "  [bracket (][builtin foo] [bracket [[][variable _] [variable x][bracket ]]] [variable x][bracket )]",
        "  [bracket (][builtin foo] [bracket [[][variable _] [variable x] [variable y][bracket ]]] [variable y][bracket ))]"
    );

    MT("should indent try",
        "[bracket (][keyword try]",
        "  [bracket (][keyword /] [number 1] [number 0][bracket )]",
        "  [bracket (][keyword catch] [variable Exception] [variable e] [bracket (][keyword str] [string \"caught exception: \"] [bracket (][builtin .getMessage] [variable e][bracket ))))]"
    );

    MT("should indent with-open",
        "[bracket (][keyword with-open] [bracket [[][variable out-data] [bracket (][builtin io/writer] [variable out-file][bracket )]]]",
        "  [bracket (][builtin csv/write-csv] [variable out-data] [variable out-sos][bracket )))]"
    );

    MT("should indent with-precision",
        "[bracket (][keyword with-precision] [number 10] [bracket (][keyword /] [number 1M] [number 3][bracket ))]",
        "",
        "[bracket (][keyword with-precision] [number 10] [atom :rounding] [variable HALF_DOWN] [bracket (][keyword /] [number 1M] [number 3][bracket ))]",
        "",
        "[bracket (][keyword with-precision]",
        "  [number 10]",
        "  [atom :rounding]",
        "  [variable HALF_DOWN]",
        "  [bracket (][keyword /] [number 1M] [number 3][bracket ))]"
    );

    MT("should indent when",
        "[bracket (][keyword when] [bracket (][keyword <] [variable foo] [number 100][bracket )] [string \"yes\"][bracket )]",
        "",
        "[bracket (][keyword when] [bracket (][keyword <] [variable foo] [number 100][bracket )]",
        "  [string \"yes\"][bracket )]",
        "",
        "[bracket (][keyword when] [bracket (][keyword and] [bracket (][keyword <] [variable foo] [number 100][bracket )]",
        "           [bracket (][keyword <] [variable bar] [number 50][bracket ))]",
        "  [string \"yes\"][bracket )]"
    );

    MT("should indent when-not",
        "[bracket (][keyword when-not] [bracket (][keyword <] [variable foo] [number 100][bracket )] [string \"no\"][bracket )]",
        "",
        "[bracket (][keyword when-not] [bracket (][keyword <] [variable foo] [number 100][bracket )]",
        "  [string \"no\"][bracket )]",
        "",
        "[bracket (][keyword when-not] [bracket (][keyword and] [bracket (][keyword <] [variable foo] [number 100][bracket )]",
        "               [bracket (][keyword <] [variable bar] [number 50][bracket ))]",
        "  [string \"no\"][bracket )]"
    );

    MT("should indent while",
        "[bracket (][keyword while] [variable foo] [bracket (][keyword do] [bracket (][keyword println] [variable a][bracket )] [bracket (][keyword println] [variable b][bracket )))]",
        "",
        "[bracket (][keyword while] [variable foo]",
        "  [bracket (][keyword do] [bracket (][keyword println] [variable a][bracket )]",
        "    [bracket (][keyword println] [variable b][bracket )))]"
    );

    function typeTokenPairs(type, tokens) {
        return "[" + type + " " + tokens.join("] [" + type + " ") + "]";
    }
})();
