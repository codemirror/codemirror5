/* Simple mode definition for ARM code.
 * Based on the example Javascript Simple Mode.
 */

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../../addon/mode/simple"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../../addon/mode/simple"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

var conditions = ['EQ', 'NE',
                  'VS', 'VC',
                  'HI', 'LS',
                  'PL', 'MI',
                  'CS', 'CC',
                  'HS', 'LO',
                  'GE', 'GT',
                  'LE', 'LT',
                  'AL', /*'NV',*/
                  ''];

// FIXME: Add 'modern' arithmetic instructions
var inst_arithmetic = ['ADD', 'ADC',
                       'SUB', 'SBC',
                       'RSB', 'RSC',
                       'MUL', 'MLA',
                       'EOR', 'ORR',
                       'AND', 'BIC',
                       'MOV', 'MVN',
                       'UMULL', 'UMLAL',
                       'SMULL', 'SMLAL'];

var inst_compare = ['CMN', 'CMP', 'TEQ', 'TST'];
// Can be followed by S (redundant) or P (obsolete).

var inst_system = ['MSR', 'MRS'];
var inst_copro_op = ['CDP'];
var inst_copro_memory = ['LDC', 'STC'];
var inst_copro_memorysize = ['L', ''];
var inst_copro_transfer = ['MCR', 'MRC'];

// FIXME: Add 'modern' extensions to loads
var inst_memory = ['LDR', 'STR'];
var inst_memorysize = ['B', 'H', ''];
// Can be followed by T

var inst_set = ['DC'];
var inst_setsize = ['D', 'DO', 'B', 'W', 'FD', 'FS'];

var inst_branch = ['BL', 'BX', 'B'];
// Special case BLT/BLS as otherwise we get BL coloured and a T or S in the normal colour.
inst_branch = ['BLT', 'BLS'].concat(inst_branch)

var inst_multiple = ['LDM', 'STM'];
var inst_multiplestepping = ['IB', 'IA',
                             'DB', 'DA',
                             'FD', 'FA',
                             'ED', 'EA'];

var inst_addressof = ['ADR'];
var inst_swi = ['SWI'];

var inst_atomic_swap = ['SWP']
var inst_atomic_memory = ['LDREX', 'STREX'];
var inst_atomic_memorysize = ['B', 'H', 'D', ''];


// Floating point instructions (not VFP)
var fp_precision = ['S', 'D', 'EP', 'P', 'E'];
var fp_rounding = ['P', 'M', 'Z', ''];
var inst_fp_memory = ['LDF', 'STF'];
var inst_fp_memorysize = fp_precision;

var inst_fp_multiple = ['LFM', 'SFM'];
var inst_fp_multiplestepping = ['FD', 'EA', ''];

// FP system transfers, which take conditions
var inst_fp_system = [ 'WFS', 'RFS',
                       'WFC', 'RFC' ];
// FP operations which take precision and rounding
var inst_fp_pandr = [ 'FLT' ];
var inst_fp_pandrsize = fp_precision;
var inst_fp_pandrround = fp_rounding;
var inst_fp_ponly = [ 'FIX' ];
var inst_fp_ponlysize = fp_precision;

// Arithmetic operations
var inst_fp_arithmetic = [
                            'ADF',  // Add
                            'MUF',  // Multiply
                            'SUF',  // Subtract
                            'RSF',  // Reverse Subtract
                            'DVF',  // Divide
                            'RDF',  // Reverse Divide
                            'POW',  // Power
                            'RPW',  // Reverse Power
                            'RMF',  // Remainder
                            'FML',  // Fast Multiply
                            'FDV',  // Fast Divide
                            'FRD',  // Fast Reverse Divide
                            'POL',  // Polar angle
                            'MVF',  // Move
                            'MNF',  // Move Negated
                            'ABS',  // Absolute value
                            'RND',  // Round to integral value
                            'SQT',  // Square root
                            'LOG',  // Logarithm to base 10
                            'LGN',  // Logarithm to base e
                            'EXP',  // Exponent
                            'SIN',  // Sine
                            'COS',  // Cosine
                            'TAN',  // Tangent
                            'ASN',  // Arc Sine
                            'ACS',  // Arc Cosine
                            'ATN',  // Arc Tangent
                            'URD',  // Unnormalised Round
                            'NRM',  // Normalise
                         ];
var inst_fp_arithmeticsize = fp_precision;
var inst_fp_arithmeticround = fp_rounding;

var inst_fp_compare = [
                        'CMF',      // Compare floating
                        'CNF',      // Compare negated floating
                        'CMFE',     // Compare floating with exception
                        'CNFE',     // Compare negated floating with exception
                      ];
var inst_fp_comparesize = fp_precision;
var inst_fp_compareround = fp_rounding;


// Label value assignments
var inst_assignment = [ '\\^',  // anchors a workspace block
                        '#',    // assigned positively to a workspace block
                        'EQU',  // assigns a literal value
                        '\\*',  // assigns a literal value
                        '=',    // DCB equivalent
                        '&',    // DCD equivalent
                        '%',    // Zero'd data reservation
                        'FN',   // assigns a FP register name
                        'RN',   // assigns a register name
                        'CP',   // assigns a coprocessor name
                        'CN',   // assigns a coprocessor register name
                        'RLIST',// assigns a register list name
                      ];

var inst_directive = ['ALIGN'];



// res_* => regular expressions as strings
// re_ => regular expressions as RegExp object
var res_conditions = '(?:' + conditions.join('|') + ')';
var res_inst_arithmetic = '(?:' + inst_arithmetic.join('|') + ')' +
                          res_conditions +
                          'S?';
var res_inst_compare = '(?:' + inst_compare.join('|') + ')' +
                       res_conditions +
                       '[SP]?';
var res_inst_system = '(?:' + inst_system.join('|') + ')' +
                      res_conditions;
var res_inst_copro_op = '(?:' + inst_copro_op.join('|') + ')' +
                        res_conditions;
var res_inst_copro_memory = '(?:' + inst_copro_memory.join('|') + ')' +
                            res_conditions +
                            '(?:' + inst_copro_memorysize.join('|') + ')';
var res_inst_copro_transfer = '(?:' + inst_copro_transfer.join('|') + ')' +
                              res_conditions;
var res_inst_branch = '(?:' + inst_branch.join('|') + ')' +
                      res_conditions;
var res_inst_memory = '(?:' + inst_memory.join('|') + ')' +
                      res_conditions +
                      '(?:' + inst_memorysize.join('|') + ')' +
                      'T?';

var res_inst_multiple = '(?:' + inst_multiple.join('|') + ')' +
                        res_conditions +
                        '(?:' + inst_multiplestepping.join('|') + ')';
var res_inst_addressof = '(?:' + inst_addressof.join('|') + ')' +
                         res_conditions +
                         'L?';
var res_inst_set = '(?:' + inst_set.join('|') + ')' +
                   '(?:' + inst_setsize.join('|') + ')';
var res_inst_swi = '(?:' + inst_swi.join('|') + ')' +
                   res_conditions;
var res_inst_atomic_swap = '(?:' + inst_atomic_swap.join('|') + ')' +
                           res_conditions;
var res_inst_atomic_memory = '(?:' + inst_atomic_memory.join('|') + ')' +
                             '(?:' + inst_atomic_memorysize.join('|') + ')';
var res_inst_directive = '(?:' + inst_directive.join('|') + ')';

var res_inst_fp_memory = '(?:' + inst_fp_memory.join('|') + ')' +
                         res_conditions +
                         '(?:' + inst_fp_memorysize.join('|') + ')'
var res_inst_fp_multiple = '(?:' + inst_fp_multiple.join('|') + ')' +
                           res_conditions +
                           '(?:' + inst_fp_multiplestepping.join('|') + ')';
// FP operations which take precision and rounding
var res_inst_fp_system = '(?:' + inst_fp_system.join('|') + ')' +
                         res_conditions;
var res_inst_fp_ponly = '(?:' + inst_fp_ponly.join('|') + ')' +
                        res_conditions +
                        '(?:' + inst_fp_ponlysize.join('|') + ')';
var res_inst_fp_pandr = '(?:' + inst_fp_pandr.join('|') + ')' +
                        res_conditions +
                        '(?:' + inst_fp_pandrsize.join('|') + ')' +
                        '(?:' + inst_fp_pandrround.join('|') + ')';
var res_inst_fp_arithmetic = '(?:' + inst_fp_arithmetic.join('|') + ')' +
                             res_conditions +
                             '(?:' + inst_fp_arithmeticsize.join('|') + ')' +
                             '(?:' + inst_fp_arithmeticround.join('|') + ')';
var res_inst_fp_compare = '(?:' + inst_fp_compare.join('|') + ')' +
                          res_conditions +
                          '(?:' + inst_fp_comparesize.join('|') + ')' +
                          '(?:' + inst_fp_compareround.join('|') + ')';

// Put all these instructions together
var res_inst_list_all = [res_inst_arithmetic,
                         res_inst_compare,
                         res_inst_system,
                         res_inst_copro_op,
                         res_inst_copro_memory,
                         res_inst_copro_transfer,
                         res_inst_branch,
                         res_inst_atomic_swap,
                         res_inst_atomic_memory,
                         res_inst_memory,
                         res_inst_multiple,
                         res_inst_fp_memory,
                         res_inst_fp_multiple,
                         res_inst_fp_system,
                         res_inst_fp_ponly,
                         res_inst_fp_pandr,
                         res_inst_fp_arithmetic,
                         res_inst_fp_compare,
                         res_inst_swi,
                         res_inst_addressof,
                         res_inst_set,
                         res_inst_directive];
// Build a regex of the different instruction forms
var res_inst_all = '(?:' + res_inst_list_all.map( (res) => {
    return "(?:" + res + ")";
}).join('|') + ')(?=\\s|$)';

var registers_plain = ['r10', 'r11', 'r12', 'r13', 'r14', 'r15',
                       'r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9'];
registers_plain = registers_plain.concat(registers_plain.map( (reg) => {
    return reg.toUpperCase();
}));
var registers_apcs = ['a1', 'a2', 'a3', 'a4', 'v1', 'v2', 'v3', 'v4', 'v5',
                      'v6', 'sb',
                      'v7', 'sl',
                      'v8', 'fp',
                            'ip',
                            'sp',
                            'lr',
                            'pc'];
registers_apcs = registers_apcs.concat(registers_apcs.map( (reg) => {
    return reg.toUpperCase();
}));
var registers_aliases = ['stack', 'link'];

var registers_fp = ['f0', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7'];
registers_fp = registers_fp.concat(registers_fp.map( (reg) => {
    return reg.toUpperCase();
}));

var registers_cp_number = ['p10', 'p11', 'p12', 'p13', 'p14', 'p15',
                           'p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7',
                           'p8', 'p9',
                          ];
var registers_cp_register = ['c10', 'c11', 'c12', 'c13', 'c14', 'c15',
                             'c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7',
                             'cp8', 'c9',
                            ];

var registers_all = registers_plain.concat(registers_apcs).concat(registers_aliases);
registers_all = registers_all.concat(registers_fp);
registers_all = registers_all.concat(registers_cp_number).concat(registers_cp_register);

// All the registers together
var res_registers_all = '(?:' + registers_all.join('|') + ')';


// Shifts
var register_shifts = ['LSL', 'LSR', 'ASL', 'ASR', 'ROL', 'ROR', 'RRX'];
var res_register_shifts = '(?:' + register_shifts.join('|') + ')';


CodeMirror.defineSimpleMode("arm", {
  // The start state contains the rules that are intially used
  start: [


    {regex: /\s+/, token: 'none', push: 'arm'},
  ],
  arm: [
    {sol: true, pop: true},

    {regex: new RegExp(res_inst_all), token: 'keyword', next: 'arm_params'},

    {regex: /;.*/, token: "comment", pop: true},

    {regex: /.*/, token: 'error', pop: true},
  ],
  arm_params: [
    {sol: true, pop: true},

    {regex: new RegExp(res_registers_all), token: 'atom'},
    {regex: new RegExp(res_register_shifts), token: 'keyword'},

    {regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i,
     token: "number"},

    // The regex matches the token, the token property contains the type
    {regex: /".*?"/, token: "string"},

    {regex: /;.*/, token: "comment", pop: true},
    {regex: /[-+\/*=<>!^]+/, token: "operator"},
    {regex: /[_A-Za-z][a-zA-Z0-9_]*/, token: "variable"},
    {regex: /(\|)([_a-zA-Z][a-zA-Z0-9_]*)(\|)/, token: ['qualifier', 'variable', 'qualifier']},
  ],

  // The meta property contains global information about the mode. It
  // can contain properties like lineComment, which are supported by
  // all modes, and also directives like dontIndentStates, which are
  // specific to simple modes.
  meta: {
    dontIndentStates: ["comment"],
    lineComment: "; "
  }
});

  CodeMirror.defineMIME("text/x-arm", "arm");
});
