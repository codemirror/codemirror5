// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("../../lib/codemirror"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["../../lib/codemirror"], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("nasm", function() {

  function words(str) {
      var obj = {}, words = str.split(" ");
      for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
      return obj;
  }
  // instructions http://www.nasm.us/doc/nasmdocb.html
  var conventionalInstructions = words("aaa aad aam aas adc add and arpl bound bsf bsr bswap bt btc btr bts call cbw cdq clc cld cli clts cmc cmp cmps cmpxchg cwd cwde daa das dec div enter esc hlt idiv imul in inc ins int into invd invlpg iret iretd ja jae jb jbe jc jcxz je jecxz jg jge jl jle jmp jna jnae jnb jnbe jnc jne jng jnge jnl jnle jno jnp jns jnz jo jp jpe jpo js jz lahf lar lds lea leave les lfs lgdt lidt lgs lldt lmsw lock lods loop loope loopz loopnz loopne lsl lss ltr mov movs movsx movzx mul near neg nop not or out outs pop popa popad popf popfd push pusha pushad pushf pushfd rcl rcr rep repe repz repne repnz ret retf rol ror sahf sal sar sbb scas section setae setnb setb setnae setbe setna sete setz setne setnz setl setnge setge setng setle setng setg setnle sets setns setc setnc seto setno setp setpe setnp setpo sgdt sidt shl shld shr shrd sldt smsw stc std sti stos str sub test verr verw wait fwait wait fwait wbinvd xchg xlat xlatb xor equ");

  var specialInstructions = words("db dw dd dq dt do dy dz resb resw resd resq rest reso resy resz");

  var sections = words("section segment .data .text .bss");

  // x86 and x86_64 registers
  var registers = words("ip eip eax ebx ecx edx edi esi ebp esp ax bx cx dx di si bp sp ah al bh bl ch cl dh dl ax bx cx dx cs ds ss es fs gs cr0 cr2 cr3 db0 db1 db2 db3 db6 db7 tr6 tr7 st rax rcx rdx rbs rsp rbp rsi rdi");

  // comment style
  var lineCommentStartSymbol = ";";

  return {

    startState: function() {
      return {
        tokenize: null
      };
    },

    token: function(stream, state) {

      if (state.tokenize) {
        return state.tokenize(stream, state);
      }

      var cur, ch = stream.next();

      // comment
      if (ch === lineCommentStartSymbol) {
        stream.skipToEnd();
        return "comment";
      }

      // string style 1
      if (ch === "'") {
        stream.skipTo("'");
        return "string";
      }

      // string style 2
      if (ch === '"') {
        stream.eatWhile(/\w/);
        return "string";
      }

      if (ch === '.') {
        stream.eatWhile(/\w/);
        cur = stream.current().toLowerCase();
        if (sections.propertyIsEnumerable(cur)) return "tag";
      }

      // decimal and hexadecimal numbers
      if (/\d/.test(ch)) {
        if (ch === "0" && stream.eat("x")) {
          stream.eatWhile(/[0-9a-fA-F]/);
          return "number";
        }
        stream.eatWhile(/\d/);
        return "number";
      }

      // labels and sections/segments
      if (/\w/.test(ch)) {
        stream.eatWhile(/\w/);
        if (stream.eat(":")) return 'tag';

        cur = stream.current().toLowerCase();
        if (sections.propertyIsEnumerable(cur)) return "tag";
      }

      if (conventionalInstructions.propertyIsEnumerable(cur)) {
        stream.eatWhile(/\w/);
        return "keyword";
      }

      if (specialInstructions.propertyIsEnumerable(cur)) {
        stream.eatWhile(/\w/);
        return "tag";
      }

      if (registers.propertyIsEnumerable(cur)) {
        stream.eatWhile(/\w/);
        return "builtin";
      }
    },

      lineComment: lineCommentStartSymbol
    };
  });

  CodeMirror.defineMIME("text/x-nasm", "nasm");
});
