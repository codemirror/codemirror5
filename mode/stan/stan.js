// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function (mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  function Context(indented, column, type, info, align, prev) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.info = info;
    this.align = align;
    this.prev = prev;
  }
  function pushContext(state, col, type, info) {
    var indent = state.indented;
    if (state.context && state.context.type == "statement" && type != "statement")
      indent = state.context.indented;
    return state.context = new Context(indent, col, type, info, null, state.context);
  }
  function popContext(state) {
    var t = state.context.type;
    if (t == ")" || t == "]" || t == "}")
      state.indented = state.context.indented;
    return state.context = state.context.prev;
  }

  function typeBefore(stream, state, pos) {
    if (state.prevToken == "variable" || state.prevToken == "type") return true;
    if (/\S(?:[^- ]>|[*\]])\s*$|\*$/.test(stream.string.slice(0, pos))) return true;
    if (state.typeAtEndOfLine && stream.column() == stream.indentation()) return true;
  }

  function isTopScope(context) {
    for (;;) {
      if (!context || context.type == "top") return true;
      if (context.type == "}" && context.prev.info != "namespace") return false;
      context = context.prev;
    }
  }

  CodeMirror.defineMode("stan", function(config, parserConfig) {
    var indentUnit = config.indentUnit,
      statementIndentUnit = parserConfig.statementIndentUnit || indentUnit,
      dontAlignCalls = parserConfig.dontAlignCalls,
      keywords = parserConfig.keywords || {},
      types = parserConfig.types || {},
      builtin = parserConfig.builtin || {},
      blockKeywords = parserConfig.blockKeywords || {},
      defKeywords = parserConfig.defKeywords || {},
      atoms = parserConfig.atoms || {},
      hooks = parserConfig.hooks || {},
      multiLineStrings = parserConfig.multiLineStrings,
      indentStatements = parserConfig.indentStatements !== false,
      indentSwitch = parserConfig.indentSwitch !== false,
      namespaceSeparator = parserConfig.namespaceSeparator,
      isPunctuationChar = parserConfig.isPunctuationChar || /[\[\]{}\(\),;\:\.]/,
      numberStart = parserConfig.numberStart || /[\d\.]/,
      number = parserConfig.number || /^(?:0x[a-f\d]+|0b[01]+|(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)(u|ll?|l|f)?/i,
      isOperatorChar = parserConfig.isOperatorChar || /[+\-*&%=<>!?|\/]/,
      isIdentifierChar = parserConfig.isIdentifierChar || /[\w\$_\xa1-\uffff]/;

    var curPunc, isDefKeyword;

    function tokenBase(stream, state) {
      var ch = stream.next();
      if (hooks[ch]) {
        var result = hooks[ch](stream, state);
        if (result !== false) return result;
      }
      if (ch == '"' || ch == "'") {
        state.tokenize = tokenString(ch);
        return state.tokenize(stream, state);
      }
      if (isPunctuationChar.test(ch)) {
        curPunc = ch;
        return null;
      }
      if (numberStart.test(ch)) {
        stream.backUp(1)
        if (stream.match(number)) return "number"
        stream.next()
      }
      if (ch == "/") {
        if (stream.eat("*")) {
          state.tokenize = tokenComment;
          return tokenComment(stream, state);
        }
        if (stream.eat("/")) {
          stream.skipToEnd();
          return "comment";
        }
      }
      if (isOperatorChar.test(ch)) {
        while (!stream.match(/^\/[\/*]/, false) && stream.eat(isOperatorChar)) {}
        return "operator";
      }
      stream.eatWhile(isIdentifierChar);
      if (namespaceSeparator) while (stream.match(namespaceSeparator))
        stream.eatWhile(isIdentifierChar);

      var cur = stream.current();
      if (contains(keywords, cur)) {
        if (contains(blockKeywords, cur)) curPunc = "newstatement";
        if (contains(defKeywords, cur)) isDefKeyword = true;
        return "keyword";
      }
      if (contains(types, cur)) return "type";
      if (contains(builtin, cur)) {
        if (contains(blockKeywords, cur)) curPunc = "newstatement";
        return "builtin";
      }
      if (contains(atoms, cur)) return "atom";
      return "variable";
    }

    function tokenString(quote) {
      return function(stream, state) {
        var escaped = false, next, end = false;
        while ((next = stream.next()) != null) {
          if (next == quote && !escaped) {end = true; break;}
          escaped = !escaped && next == "\\";
        }
        if (end || !(escaped || multiLineStrings))
          state.tokenize = null;
        return "string";
      };
    }

    function tokenComment(stream, state) {
      var maybeEnd = false, ch;
      while (ch = stream.next()) {
        if (ch == "/" && maybeEnd) {
          state.tokenize = null;
          break;
        }
        maybeEnd = (ch == "*");
      }
      return "comment";
    }

    function maybeEOL(stream, state) {
      if (parserConfig.typeFirstDefinitions && stream.eol() && isTopScope(state.context))
        state.typeAtEndOfLine = typeBefore(stream, state, stream.pos)
    }

    // Interface

    return {
      startState: function(basecolumn) {
        return {
          tokenize: null,
          context: new Context((basecolumn || 0) - indentUnit, 0, "top", null, false),
          indented: 0,
          startOfLine: true,
          prevToken: null
        };
      },

      token: function(stream, state) {
        var ctx = state.context;
        if (stream.sol()) {
          if (ctx.align == null) ctx.align = false;
          state.indented = stream.indentation();
          state.startOfLine = true;
        }
        if (stream.eatSpace()) { maybeEOL(stream, state); return null; }
        curPunc = isDefKeyword = null;
        var style = (state.tokenize || tokenBase)(stream, state);
        if (style == "comment" || style == "meta") return style;
        if (ctx.align == null) ctx.align = true;

        if (curPunc == ";" || curPunc == ":" || (curPunc == "," && stream.match(/^\s*(?:\/\/.*)?$/, false)))
          while (state.context.type == "statement") popContext(state);
        else if (curPunc == "{") pushContext(state, stream.column(), "}");
        else if (curPunc == "[") pushContext(state, stream.column(), "]");
        else if (curPunc == "(") pushContext(state, stream.column(), ")");
        else if (curPunc == "}") {
          while (ctx.type == "statement") ctx = popContext(state);
          if (ctx.type == "}") ctx = popContext(state);
          while (ctx.type == "statement") ctx = popContext(state);
        }
        else if (curPunc == ctx.type) popContext(state);
        else if (indentStatements &&
          (((ctx.type == "}" || ctx.type == "top") && curPunc != ";") ||
            (ctx.type == "statement" && curPunc == "newstatement"))) {
          pushContext(state, stream.column(), "statement", stream.current());
        }

        if (style == "variable" &&
          ((state.prevToken == "def" ||
            (parserConfig.typeFirstDefinitions && typeBefore(stream, state, stream.start) &&
              isTopScope(state.context) && stream.match(/^\s*\(/, false)))))
          style = "def";

        if (hooks.token) {
          var result = hooks.token(stream, state, style);
          if (result !== undefined) style = result;
        }

        if (style == "def" && parserConfig.styleDefs === false) style = "variable";

        state.startOfLine = false;
        state.prevToken = isDefKeyword ? "def" : style || curPunc;
        maybeEOL(stream, state);
        return style;
      },

      indent: function(state, textAfter) {
        if (state.tokenize != tokenBase && state.tokenize != null || state.typeAtEndOfLine) return CodeMirror.Pass;
        var ctx = state.context, firstChar = textAfter && textAfter.charAt(0);
        if (ctx.type == "statement" && firstChar == "}") ctx = ctx.prev;
        if (parserConfig.dontIndentStatements)
          while (ctx.type == "statement" && parserConfig.dontIndentStatements.test(ctx.info))
            ctx = ctx.prev
        if (hooks.indent) {
          var hook = hooks.indent(state, ctx, textAfter);
          if (typeof hook == "number") return hook
        }
        var closing = firstChar == ctx.type;
        var switchBlock = ctx.prev && ctx.prev.info == "switch";
        if (parserConfig.allmanIndentation && /[{(]/.test(firstChar)) {
          while (ctx.type != "top" && ctx.type != "}") ctx = ctx.prev
          return ctx.indented
        }
        if (ctx.type == "statement")
          return ctx.indented + (firstChar == "{" ? 0 : statementIndentUnit);
        if (ctx.align && (!dontAlignCalls || ctx.type != ")"))
          return ctx.column + (closing ? 0 : 1);
        if (ctx.type == ")" && !closing)
          return ctx.indented + statementIndentUnit;

        return ctx.indented + (closing ? 0 : indentUnit) +
          (!closing && switchBlock && !/^(?:case|default)\b/.test(textAfter) ? indentUnit : 0);
      },

      electricInput: indentSwitch ? /^\s*(?:case .*?:|default:|\{\}?|\})$/ : /^\s*[{}]$/,
      blockCommentStart: "/*",
      blockCommentEnd: "*/",
      lineComment: "//",
      fold: "brace"
    };
  });

  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }
  function contains(words, word) {
    if (typeof words === "function") {
      return words(word);
    } else {
      return words.propertyIsEnumerable(word);
    }
  }


  function cppHook(stream, state) {
    if (!state.startOfLine) return false
    for (var ch, next = null; ch = stream.peek();) {
      if (ch == "\\" && stream.match(/^.$/)) {
        next = cppHook
        break
      } else if (ch == "/" && stream.match(/^\/[\/\*]/, false)) {
        break
      }
      stream.next()
    }
    state.tokenize = next
    return "meta"
  }

  function pointerHook(_stream, state) {
    if (state.prevToken == "type") return "type";
    return false;
  }

  function cpp14Literal(stream) {
    stream.eatWhile(/[\w\.']/);
    return "number";
  }

  function cpp11StringHook(stream, state) {
    stream.backUp(1);
    // Raw strings.
    if (stream.match(/(R|u8R|uR|UR|LR)/)) {
      var match = stream.match(/"([^\s\\()]{0,16})\(/);
      if (!match) {
        return false;
      }
      state.cpp11RawStringDelim = match[1];
      state.tokenize = tokenRawString;
      return tokenRawString(stream, state);
    }
    // Unicode strings/chars.
    if (stream.match(/(u8|u|U|L)/)) {
      if (stream.match(/["']/, /* eat */ false)) {
        return "string";
      }
      return false;
    }
    // Ignore this hook.
    stream.next();
    return false;
  }

  function cppLooksLikeConstructor(word) {
    var lastTwo = /(\w+)::~?(\w+)$/.exec(word);
    return lastTwo && lastTwo[1] == lastTwo[2];
  }

  // C++11 raw string literal is <prefix>"<delim>( anything )<delim>", where
  // <delim> can be a string up to 16 characters long.
  function tokenRawString(stream, state) {
    // Escape characters that have special regex meanings.
    var delim = state.cpp11RawStringDelim.replace(/[^\w\s]/g, '\\$&');
    var match = stream.match(new RegExp(".*?\\)" + delim + '"'));
    if (match)
      state.tokenize = null;
    else
      stream.skipToEnd();
    return "string";
  }

  function def(mimes, mode) {
    if (typeof mimes == "string") mimes = [mimes];
    var words = [];
    function add(obj) {
      if (obj) for (var prop in obj) if (obj.hasOwnProperty(prop))
        words.push(prop);
    }
    add(mode.keywords);
    add(mode.types);
    add(mode.builtin);
    add(mode.atoms);
    if (words.length) {
      mode.helperType = mimes[0];
      CodeMirror.registerHelper("hintWords", mimes[0], words);
    }

    for (var i = 0; i < mimes.length; ++i)
      CodeMirror.defineMIME(mimes[i], mode);
  }


  def(["text/x-stan"], {
    name: "stan",
    keywords: words("else for if in increment_log_prob integrate_ode lp__ print reject return while " +
      "data transformed parameters model generated quantities functions"),
    types: words("cholesky_factor_corr cholesky_factor_cov corr_matrix cov_matrix int matrix ordered positive_ordered " +
      "real row_vector matrix simplex unit_vector vector void"),
    blockKeywords: words("for while if then else "),
    defKeywords: words("data transformed parameters model generated quantities functions"),
    typeFirstDefinitions: true,
    atoms: words("true false bernoulli bernoulli_logit binomial binomial_logit beta_binomial hypergeometric " +
      "categorical categorical_logit ordered_logistic neg_binomial neg_binomial_2 " +
      "neg_binomial_2_log poisson poisson_log multinomial normal exp_mod_normal " +
      "skew_normal student_t cauchy double_exponential logistic gumbel lognormal " +
      "chi_square inv_chi_square scaled_inv_chi_square exponential gamma inv_gamma " +
      "weibull frechet rayleigh wiener pareto pareto_type_2 beta von_mises " +
      "uniform multi_normal multi_normal_prec multi_normal_cholesky multi_gp " +
      "multi_gp_cholesky multi_student_t gaussian_dlm_obs dirichlet lkj_corr " +
      "lkj_corr_cholesky wishart inv_wishart"),

    builtin: words("Phi Phi_approx abs acos acosh append_col append_row asin asinh atan atan2 atanh bernoulli " +
      "bernoulli_cdf bernoulli_lccdf bernoulli_lcdf bernoulli_logit bernoulli_logit_lpmf bernoulli_logit_rng " +
      "bernoulli_lpmf bernoulli_rng bessel_first_kind bessel_second_kind beta beta_binomial beta_binomial_cdf " +
      "beta_binomial_lccdf beta_binomial_lcdf beta_binomial_lpmf beta_binomial_rng beta_cdf beta_lccdf beta_lcdf " +
      "beta_lpdf beta_rng binary_log_loss binomial binomial_cdf binomial_coefficient_log binomial_lccdf binomial_lcdf " +
      "binomial_logit binomial_logit_lpmf binomial_lpmf binomial_rng block categorical categorical_logit " +
      "categorical_logit_lpmf categorical_logit_rng categorical_lpmf categorical_rng cauchy cauchy_cdf cauchy_lccdf " +
      "cauchy_lcdf cauchy_lpdf cauchy_rng cbrt ceil chi_square chi_square_cdf chi_square_lccdf chi_square_lcdf " +
      "chi_square_lpdf chi_square_rng cholesky_decompose choose col cols columns_dot_product columns_dot_self " +
      "cos cosh cov_exp_quad crossprod csr_extract_u csr_extract_v csr_extract_w csr_matrix_times_vector " +
      "csr_to_dense_matrix cumulative_sum determinant diag_matrix diag_post_multiply diag_pre_multiply " +
      "diagonal digamma dims dirichlet dirichlet_lpdf dirichlet_rng distance dot_product dot_self double_exponential " +
      "double_exponential_cdf double_exponential_lccdf double_exponential_lcdf double_exponential_lpdf " +
      "double_exponential_rng e eigenvalues_sym eigenvectors_sym erf erfc exp exp2 exp_mod_normal exp_mod_normal_cdf " +
      "exp_mod_normal_lccdf exp_mod_normal_lcdf exp_mod_normal_lpdf exp_mod_normal_rng expm1 exponential exponential_cdf " +
      "exponential_lccdf exponential_lcdf exponential_lpdf exponential_rng fabs falling_factorial fdim floor fma fmax " +
      "fmin fmod frechet frechet_cdf frechet_lccdf frechet_lcdf frechet_lpdf frechet_rng gamma gamma_cdf gamma_lccdf " +
      "gamma_lcdf gamma_lpdf gamma_p gamma_q gamma_rng gaussian_dlm_obs gaussian_dlm_obs_lpdf get_lp gumbel gumbel_cdf " +
      "gumbel_lccdf gumbel_lcdf gumbel_lpdf gumbel_rng head hypergeometric hypergeometric_lpmf hypergeometric_rng hypot " +
      "inc_beta int_step integrate_ode integrate_ode_bdf integrate_ode_rk45 inv inv_Phi inv_chi_square inv_chi_square_cdf " +
      "inv_chi_square_lccdf inv_chi_square_lcdf inv_chi_square_lpdf inv_chi_square_rng inv_cloglog inv_gamma inv_gamma_cdf " +
      "inv_gamma_lccdf inv_gamma_lcdf inv_gamma_lpdf inv_gamma_rng inv_logit inv_sqrt inv_square inv_wishart " +
      "inv_wishart_lpdf inv_wishart_rng inverse inverse_spd is_inf is_nan lbeta lchoose lgamma lkj_corr " +
      "lkj_corr_cholesky lkj_corr_cholesky_lpdf lkj_corr_cholesky_rng lkj_corr_lpdf lkj_corr_rng lmgamma lmultiply " +
      "log log10 log1m log1m_exp log1m_inv_logit log1p log1p_exp log2 log_determinant log_diff_exp " +
      "log_falling_factorial log_inv_logit log_mix log_rising_factorial log_softmax log_sum_exp logistic " +
      "logistic_cdf logistic_lccdf logistic_lcdf logistic_lpdf logistic_rng logit lognormal lognormal_cdf " +
      "lognormal_lccdf lognormal_lcdf lognormal_lpdf lognormal_rng machine_precision matrix_exp max mdivide_left_spd " +
      "mdivide_left_tri_low mdivide_right_spd mdivide_right_tri_low mean min modified_bessel_first_kind " +
      "modified_bessel_second_kind multi_gp multi_gp_cholesky multi_gp_cholesky_lpdf multi_gp_lpdf multi_normal " +
      "multi_normal_cholesky multi_normal_cholesky_lpdf multi_normal_cholesky_rng multi_normal_lpdf multi_normal_prec " +
      "multi_normal_prec_lpdf multi_normal_rng multi_student_t multi_student_t_lpdf multi_student_t_rng multinomial " +
      "multinomial_lpmf multinomial_rng multiply_log multiply_lower_tri_self_transpose neg_binomial neg_binomial_2 " +
      "neg_binomial_2_cdf neg_binomial_2_lccdf neg_binomial_2_lcdf neg_binomial_2_log neg_binomial_2_log_lpmf " +
      "neg_binomial_2_log_rng neg_binomial_2_lpmf neg_binomial_2_rng neg_binomial_cdf neg_binomial_lccdf " +
      "neg_binomial_lcdf neg_binomial_lpmf neg_binomial_rng negative_infinity normal normal_cdf normal_lccdf " +
      "normal_lcdf normal_lpdf normal_rng not_a_number num_elements operator operator! operator!= operator% operator&& " +
      "operator+ operator- operator. operator./ operator/ operator< operator<= operator== operator> operator>= " +
      "operator\\\\ operator^ operator|| operator’ ordered_logistic ordered_logistic_lpmf ordered_logistic_rng " +
      "owens_t pareto pareto_cdf pareto_lccdf pareto_lcdf pareto_lpdf pareto_rng pareto_type_2 pareto_type_2_cdf " +
      "pareto_type_2_lccdf pareto_type_2_lcdf pareto_type_2_lpdf pareto_type_2_rng pi poisson poisson_cdf poisson_lccdf " +
      "poisson_lcdf poisson_log poisson_log_lpmf poisson_log_rng poisson_lpmf poisson_rng positive_infinity pow " +
      "print prod qr_Q qr_R quad_form quad_form_diag quad_form_sym rank rayleigh rayleigh_cdf rayleigh_lccdf " +
      "rayleigh_lcdf rayleigh_lpdf rayleigh_rng rep_array rep_matrix rep_row_vector rep_vector rising_factorial " +
      "round row rows rows_dot_product rows_dot_self scaled_inv_chi_square scaled_inv_chi_square_cdf " +
      "scaled_inv_chi_square_lccdf scaled_inv_chi_square_lcdf scaled_inv_chi_square_lpdf scaled_inv_chi_square_rng " +
      "sd segment sin singular_values sinh size skew_normal skew_normal_cdf skew_normal_lccdf skew_normal_lcdf " +
      "skew_normal_lpdf skew_normal_rng softmax sort_asc sort_desc sort_indices_asc sort_indices_desc sqrt sqrt2 " +
      "square squared_distance step student_t student_t_cdf student_t_lccdf student_t_lcdf student_t_lpdf student_t_rng " +
      "sub_col sub_row sum tail tan tanh target tcrossprod tgamma to_array_1d to_array_2d to_matrix to_row_vector " +
      "to_vector trace trace_gen_quad_form trace_quad_form trigamma trunc uniform uniform_cdf uniform_lccdf " +
      "uniform_lcdf uniform_lpdf uniform_rng variance von_mises von_mises_lpdf von_mises_rng weibull weibull_cdf " +
      "weibull_lccdf weibull_lcdf weibull_lpdf weibull_rng wiener wiener_lpdf wishart wishart_lpdf wishart_rng"),
    dontIndentStatements: /^template$/,
    isIdentifierChar: /[\w\$_~\xa1-\uffff]/,
    hooks: {
      "#": cppHook,
      "*": pointerHook,
      "u": cpp11StringHook,
      "U": cpp11StringHook,
      "L": cpp11StringHook,
      "R": cpp11StringHook,
      "0": cpp14Literal,
      "1": cpp14Literal,
      "2": cpp14Literal,
      "3": cpp14Literal,
      "4": cpp14Literal,
      "5": cpp14Literal,
      "6": cpp14Literal,
      "7": cpp14Literal,
      "8": cpp14Literal,
      "9": cpp14Literal,
      token: function(stream, state, style) {
        if (style == "variable" && stream.peek() == "(" &&
          (state.prevToken == ";" || state.prevToken == null ||
            state.prevToken == "}") &&
          cppLooksLikeConstructor(stream.current()))
          return "def";
      }
    },
    namespaceSeparator: "::",
    modeProps: {fold: ["brace", "include"]}
  });



});
