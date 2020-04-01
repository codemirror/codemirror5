/* Simple mode definition for BBC Basic (with ARM assembler)
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
                  '',
                 ];

// FIXME: Add 'modern' arithmetic instructions
var inst_arithmetic = ['ADD', 'ADC',
                       'SUB', 'SBC',
                       'RSB', 'RSC',
                       'MUL', 'MLA',
                       'EOR', 'ORR',
                       'AND', 'BIC',
                       'MOV', 'MVN'];

var inst_compare = ['CMN', 'CMP', 'TEQ', 'TST'];
// Can be followed by S (redundant) or P (obsolete).

var inst_system = ['MSR', 'MRS'];

// FIXME: Add 'modern' extensions to loads
var inst_memory = ['LDR', 'STR'];
var inst_memorysize = ['B', 'H', ''];
// Can be followed by T

var inst_set = ['EQU', 'DC'];
var inst_setsize = ['D', 'B', 'W', 'S'];

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
                         res_conditions;
var res_inst_set = '(?:' + inst_set.join('|') + ')' +
                   '(?:' + inst_setsize.join('|') + ')';
var res_inst_swi = '(?:' + inst_swi.join('|') + ')' +
                   res_conditions;
var res_inst_atomic_swap = '(?:' + inst_atomic_swap.join('|') + ')' +
                           res_conditions;
var res_inst_directive = '(?:' + inst_directive.join('|') + ')';


// Regular instructions
var res_inst_list_all = [res_inst_arithmetic,
                         res_inst_compare,
                         res_inst_system,
                         res_inst_branch,
                         res_inst_atomic_swap,
                         res_inst_memory,
                         res_inst_multiple,
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

var registers_aliases = ['sp', 'link', 'pc'];

var registers_all = registers_plain.concat(registers_aliases);

// All the registers together
var res_registers_all = '(?:' + registers_all.join('|') + ')';


// Shifts
var register_shifts = ['LSL', 'LSR', 'ASL', 'ASR', 'ROL', 'ROR', 'RRX'];
var res_register_shifts = '(?:' + register_shifts.join('|') + ')';

var basic_keywords = ['OTHERWISE', 'AND', 'DIV', 'EOR', 'MOD', 'OR', 'ERROR',
                      'LINE', 'OFF', 'STEP', 'SPC', 'TAB', 'ELSE', 'THEN',
                      'OPENIN', 'PTR', 'PAGE', 'TIME', 'LOMEM', 'HIMEM', 'ABS',
                      'ACS', 'ADVAL', 'ASC', 'ASN', 'ATN', 'BGET', 'COS', 'COUNT',
                      'DEG', 'ERL', 'ERR', 'EVAL', 'EXP', 'EXT', 'FALSE', 'FN',
                      'GET', 'INKEY', 'INSTR', 'INT', 'LEN', 'LN', 'LOG', 'NOT',
                      'OPENUP', 'OPENOUT', 'PI', 'POINT', 'POS', 'RAD', 'RND',
                      'SGN', 'SIN', 'SQR', 'TAN', 'TO', 'TRUE', 'USR', 'VAL',
                      'VPOS', 'CHR$', 'GET$', 'INKEY$', 'LEFT$', 'MID$',
                      'RIGHT$', 'STR$', 'STRING$', 'EOF', 'PTR', 'PAGE', 'TIME',
                      'LOMEM', 'HIMEM', 'SOUND', 'BPUT', 'CALL', 'CHAIN', 'CLEAR',
                      'CLOSE', 'CLG', 'CLS', 'DATA', 'DEF', 'DIM', 'DRAW', 'END',
                      'ENDPROC', 'ENVELOPE', 'FOR', 'GOSUB', 'GOTO', 'GCOL', 'IF',
                      'INPUT', 'LET', 'LOCAL', 'MODE', 'MOVE', 'NEXT', 'ON',
                      'VDU', 'PLOT', 'PRINT', 'PROC', 'READ', 'REM', 'REPEAT',
                      'REPORT', 'RESTORE', 'RETURN', 'RUN', 'STOP', 'COLOUR',
                      'TRACE', 'UNTIL', 'WIDTH', 'OSCLI',

                      'WHEN', 'OF', 'ENDCASE', 'ENDIF', 'ENDWHILE', 'CASE',
                      'CIRCLE', 'FILL', 'ORIGIN', 'POINT', 'RECTANGLE', 'SWAP',
                      'WHILE', 'WAIT', 'MOUSE', 'QUIT', 'SYS', 'INSTALL',
                      'LIBRARY', 'TINT', 'ELLIPSE', 'BEATS', 'TEMPO', 'VOICES',
                      'VOICE', 'STEREO', 'OVERLAY', 'APPEND', 'AUTO', 'CRUNCH',
                      'DELETE', 'EDIT', 'HELP', 'LIST', 'LOAD', 'LVAR', 'NEW',
                      'OLD', 'RENUMBER', 'SAVE', 'TEXTLOAD', 'TEXTSAVE',
                      'TWIN', 'TWINO', 'INSTALL', 'SUM', 'BEAT']
basic_keywords.sort(function(a, b){
  // ASC  -> a.length - b.length
  // DESC -> b.length - a.length
  return b.length - a.length;
});
var res_basic_keywords = '(?:' + basic_keywords.join('|') + ')';


CodeMirror.defineSimpleMode("bbcbasic", {
  // The start state contains the rules that are intially used
  start: [
    {next: 'bbcbasic_prefix'},
  ],

  bbcbasic_prefix: [
    {regex: /(\s*)([0-9]+)(\s*)(\[)/, sol: true, token: ['none', 'qualifier', 'none', 'meta'], next: 'basic_asm_line'},
    {regex: /(\s*)([0-9]+)/, sol: true, token: ['none', 'qualifier'], push: 'basic_line'},

    // Basic lines
    {regex: /([\s:]*)(\[)/, token: ['none', 'meta'], next: 'basic_asm_line'},
    {regex: /[\s:]*(?=[^\s:])/, token: 'none', push: 'basic_line'},
    {regex: /[\s:]*/, token: 'none'},
  ],

  // BASIC lines, which are just keyword coloured; there's no structure checking performed here.
  basic_line: [
    {regex: /\s+/, token: 'none', pop: true},
    {regex: /:/, token: 'none', pop: true},
    {regex: /(REM.*)/, token: 'comment', pop: true},
    {regex: new RegExp(res_basic_keywords), token: 'keyword', next: 'basic_line_continuation'},

    // * command
    {regex: /(\*)(.*)/, token: ["keyword", "string"], pop: true},

    // Variable assignment
    {regex: /[`@A-Za-z_][`a-zA-Z0-9_]*[%$]?/, token: "variable", next: 'basic_line_continuation'},
    // Function return, or a memory poke.
    {regex: /[=?!\|]+/, token: "operator", next: 'basic_line_continuation'},

    {regex: /(.*)/, token: 'error', pop: true},
  ],
  basic_line_continuation: [
    {sol: true, pop: true},
    {regex: /(REM.*)/, token: 'comment', pop: true},
    {regex: new RegExp(res_basic_keywords), token: 'keyword'},
    {regex: /\&[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?|%[01]+/i,
     token: "number"},
    {regex: /".*?"/, token: "string"},
    {regex: /[-+\/*=<>!^]+/, token: "operator"},
    {regex: /[`@A-Za-z_][`a-zA-Z0-9_]*[%$]?/, token: "variable"},
  ],

  // 'basic_asm' processes things from the start of a BASIC line whilst we're in assembler mode
  // It transitions to 'basic_asm_leave' when we reach a ']'.
  // It pushes to 'asm_line' at the start of any BASIC assembler instruction.
  basic_asm: [
    {regex: /(\s*)([0-9]+)(\s*)(\])/, sol: true, token: ['none', 'qualifier', 'none', 'meta'], next: 'basic_asm_leave'},
    {regex: /(\s*)([0-9]+)/, sol: true, token: ['none', 'qualifier', 'none'], next: 'basic_asm_line'},

    {regex: /([\s:]*)(\])/, token: ['none', 'meta'], next: 'basic_asm_leave'},
    {regex: /(?:.)/, next: 'basic_asm_line'},
  ],

  // Leaving basic_asm mode with a ']' character (so it can be followed by : and BASIC or and end of line)
  basic_asm_leave: [
    {sol: true, next: 'bbcbasic_prefix'},
    {regex: /\s*:/, token: 'none', push: 'basic_line'},
  ],

  // 'asm_line' processes from the start of a BASIC assembler line to the next ':' or end of line
  // It handles BASIC macro instructions.
  // It pushes to 'arm' to handle instructions (and therefore everything up to the next ':'.
  // It pops when it reaches an ending ']'
  basic_asm_line: [
    {sol: true, next: 'basic_asm'},
    {regex: /[\s:]+/, token: 'none'},
    {regex: /OPT/, token: 'keyword', push: 'arm_params'},

    // Labels
    {regex: /\.[_A-Za-z`][a-zA-Z0-9_`]*%?/, token: 'variable'},

    // Function invocation (not quite right, because it doesn't terminate at a ':')
    {regex: /FN/, token: 'keyword', push: 'basic_line_continuation'},

    // Leaving assembler mode
    {regex: /(?=\])/, next: 'basic_asm'},

    {push: 'arm'},
  ],

  arm: [
    {sol: true, pop: true},

    {regex: new RegExp(res_inst_all), token: 'keyword', next: 'arm_params'},

    {regex: /;.*/, token: "comment", pop: true},
    {regex: /\s*:/, token: 'none', pop: true},  // Not really an instruction; we're back to the asm_line

    {regex: /.*/, token: 'error', pop: true},
  ],
  arm_params: [
    {sol: true, pop: true},
    {regex: /:/, pop: true},

    {regex: new RegExp(res_registers_all), token: 'atom'},
    {regex: new RegExp(res_register_shifts), token: 'keyword'},

    {regex: /(?:0x|&)[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?|[2-9]_[0-8]+/i,
     token: "number"},

    // The regex matches the token, the token property contains the type
    {regex: /".*?"/, token: "string"},

    {regex: /;.*/, token: "comment", pop: true},
    {regex: /[-+\/*=<>!^]+/, token: "operator"},
    {regex: /[_A-Za-z`][a-zA-Z0-9_`]*/, token: "variable"},
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

  CodeMirror.defineMIME("text/x-basic-bbcbasic", "bbcbasic");
});
