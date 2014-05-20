// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function() {
  var mode = CodeMirror.getMode({indentUnit: 4}, "verilog");
  function MT(name) { test.mode(name, mode, Array.prototype.slice.call(arguments, 1)); }

  MT("Binary literals",
     "[number 1'b0]",
     "[number 1'b1]",
     "[number 1'bx]",
     "[number 1'bz]",
     "[number 1'bX]",
     "[number 1'bZ]",
     "[number 1'B0]",
     "[number 1'B1]",
     "[number 1'Bx]",
     "[number 1'Bz]",
     "[number 1'BX]",
     "[number 1'BZ]",
     "[number 1'b0]",
     "[number 1'b1]",
     "[number 2'b01]",
     "[number 2'bxz]",
     "[number 2'b11]",
     "[number 2'b10]",
     "[number 2'b1Z]",
     "[number 12'b0101_0101_0101]",
     "[number 1'b 0]",
     "[number 'b0101]"
  );

  MT("Octal literals",
     "[number 3'o7]",
     "[number 3'O7]",
     "[number 3'so7]",
     "[number 3'SO7]"
  );

  MT("Decimal literals",
     "[number 0]",
     "[number 1]",
     "[number 7]",
     "[number 123_456]",
     "[number 'd33]",
     "[number 8'd255]",
     "[number 8'D255]",
     "[number 8'sd255]",
     "[number 8'SD255]",
     "[number 32'd123]",
     "[number 32 'd123]",
     "[number 32 'd 123]"
  );

  MT("Hex literals",
     "[number 4'h0]",
     "[number 4'ha]",
     "[number 4'hF]",
     "[number 4'hx]",
     "[number 4'hz]",
     "[number 4'hX]",
     "[number 4'hZ]",
     "[number 32'hdc78]",
     "[number 32'hDC78]",
     "[number 32 'hDC78]",
     "[number 32'h DC78]",
     "[number 32 'h DC78]",
     "[number 32'h44x7]",
     "[number 32'hFFF?]"
  );

  MT("Real number literals",
     "[number 1.2]",
     "[number 0.1]",
     "[number 2394.26331]",
     "[number 1.2E12]",
     "[number 1.2e12]",
     "[number 1.30e-2]",
     "[number 0.1e-0]",
     "[number 23E10]",
     "[number 29E-2]",
     "[number 236.123_763_e-12]"
  );

  MT("Operators",
     "[meta ^]"
  );

  MT("Keywords",
     "[keyword logic]",
     "[keyword logic] [variable foo]",
     "[keyword reg] [variable abc]"
  );

  MT("Variables",
     "[variable _leading_underscore]",
     "[variable _if]",
     "[number 12] [variable foo]",
     "[variable foo] [number 14]"
  );

  MT("Tick defines",
     "[def `FOO]",
     "[def `foo]",
     "[def `FOO_bar]"
  );

  MT("System calls",
     "[meta $display]",
     "[meta $vpi_printf]"
  );

  MT("Line comment", "[comment // Hello world]");



})();
