// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function() {
  var mode = CodeMirror.getMode({indentUnit: 4}, "verilog");
  function MT(name) { test.mode(name, mode, Array.prototype.slice.call(arguments, 1)); }

  MT("binary_literals",
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

  MT("octal_literals",
     "[number 3'o7]",
     "[number 3'O7]",
     "[number 3'so7]",
     "[number 3'SO7]"
  );

  MT("decimal_literals",
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

  MT("hex_literals",
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

  MT("real_number_literals",
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

  MT("operators",
     "[meta ^]"
  );

  MT("keywords",
     "[keyword logic]",
     "[keyword logic] [variable foo]",
     "[keyword reg] [variable abc]"
  );

  MT("variables",
     "[variable _leading_underscore]",
     "[variable _if]",
     "[number 12] [variable foo]",
     "[variable foo] [number 14]"
  );

  MT("tick_defines",
     "[def `FOO]",
     "[def `foo]",
     "[def `FOO_bar]"
  );

  MT("system_calls",
     "[meta $display]",
     "[meta $vpi_printf]"
  );

  MT("line_comment", "[comment // Hello world]");

  // Alignment tests
  MT("align_port_map_style1",
     /**
      * mod mod(.a(a),
      *         .b(b)
      *        );
      */
     "[variable mod] [variable mod][bracket (].[variable a][bracket (][variable a][bracket )],",
     "        .[variable b][bracket (][variable b][bracket )]",
     "       [bracket )];",
     ""
  );

  MT("align_port_map_style2",
     /**
      * mod mod(
      *     .a(a),
      *     .b(b)
      * );
      */
     "[variable mod] [variable mod][bracket (]",
     "    .[variable a][bracket (][variable a][bracket )],",
     "    .[variable b][bracket (][variable b][bracket )]",
     "[bracket )];",
     ""
  );

  MT("align_assignments",
     /**
      * always @(posedge clk) begin
      *    if (rst)
      *       data_out <= 8'b0 +
      *                   8'b1;
      *    else
      *       data_out = 8'b0 +
      *                  8'b1;
      *    data_out =
      *       8'b0 + 8'b1;
      * end
      */
     "[keyword always] [def @][bracket (][keyword posedge] [variable clk][bracket )] [keyword begin]",
     "    [keyword if] [bracket (][variable rst][bracket )]",
     "        [variable data_out] [meta <=] [number 8'b0] [meta +]",
     "                    [number 8'b1];",
     "    [keyword else]",
     "        [variable data_out] [meta =] [number 8'b0] [meta +]",
     "                   [number 8'b1];",
     "    [variable data_out] [meta =] [number 8'b0] [meta +]",
     "               [number 8'b1];",
     "[keyword end]",
     ""
  );

  // Indentation tests
  MT("indent_single_statement_if",
      "[keyword if] [bracket (][variable foo][bracket )]",
      "    [keyword break];",
      ""
  );

  MT("no_indent_after_single_line_if",
      "[keyword if] [bracket (][variable foo][bracket )] [keyword break];",
      ""
  );

  MT("indent_after_if_begin_same_line",
      "[keyword if] [bracket (][variable foo][bracket )] [keyword begin]",
      "    [keyword break];",
      "    [keyword break];",
      "[keyword end]",
      ""
  );

  MT("indent_after_if_begin_next_line",
      "[keyword if] [bracket (][variable foo][bracket )]",
      "    [keyword begin]",
      "        [keyword break];",
      "        [keyword break];",
      "    [keyword end]",
      ""
  );

  MT("indent_single_statement_if_else",
      "[keyword if] [bracket (][variable foo][bracket )]",
      "    [keyword break];",
      "[keyword else]",
      "    [keyword break];",
      ""
  );

  MT("indent_if_else_begin_same_line",
      "[keyword if] [bracket (][variable foo][bracket )] [keyword begin]",
      "    [keyword break];",
      "    [keyword break];",
      "[keyword end] [keyword else] [keyword begin]",
      "    [keyword break];",
      "    [keyword break];",
      "[keyword end]",
      ""
  );

  MT("indent_if_else_begin_next_line",
      "[keyword if] [bracket (][variable foo][bracket )]",
      "    [keyword begin]",
      "        [keyword break];",
      "        [keyword break];",
      "    [keyword end]",
      "[keyword else]",
      "    [keyword begin]",
      "        [keyword break];",
      "        [keyword break];",
      "    [keyword end]",
      ""
  );

  MT("indent_if_nested_without_begin",
      "[keyword if] [bracket (][variable foo][bracket )]",
      "    [keyword if] [bracket (][variable foo][bracket )]",
      "        [keyword if] [bracket (][variable foo][bracket )]",
      "            [keyword break];",
      ""
  );

  MT("indent_case",
      "[keyword case] [bracket (][variable state][bracket )]",
      "    [variable FOO]:",
      "        [keyword break];",
      "    [variable BAR]:",
      "        [keyword break];",
      "[keyword endcase]",
      ""
  );

  MT("unindent_after_end_with_preceding_text",
      "[keyword begin]",
      "    [keyword break]; [keyword end]",
      ""
  );

  MT("export_function_one_line_does_not_indent",
     "[keyword export] [string \"DPI-C\"] [keyword function] [variable helloFromSV];",
     ""
  );

  MT("export_task_one_line_does_not_indent",
     "[keyword export] [string \"DPI-C\"] [keyword task] [variable helloFromSV];",
     ""
  );

  MT("export_function_two_lines_indents_properly",
    "[keyword export]",
    "    [string \"DPI-C\"] [keyword function] [variable helloFromSV];",
    ""
  );

  MT("export_task_two_lines_indents_properly",
    "[keyword export]",
    "    [string \"DPI-C\"] [keyword task] [variable helloFromSV];",
    ""
  );

  MT("import_function_one_line_does_not_indent",
    "[keyword import] [string \"DPI-C\"] [keyword function] [variable helloFromC];",
    ""
  );

  MT("import_task_one_line_does_not_indent",
    "[keyword import] [string \"DPI-C\"] [keyword task] [variable helloFromC];",
    ""
  );

  MT("import_package_single_line_does_not_indent",
    "[keyword import] [variable p]::[variable x];",
    "[keyword import] [variable p]::[variable y];",
    ""
  );

  MT("covergroup_with_function_indents_properly",
    "[keyword covergroup] [variable cg] [keyword with] [keyword function] [variable sample][bracket (][keyword bit] [variable b][bracket )];",
    "    [variable c] : [keyword coverpoint] [variable c];",
    "[keyword endgroup]: [variable cg]",
    ""
  );

  MT("indent_uvm_macros",
     /**
      *  `uvm_object_utils_begin(foo)
      *    `uvm_field_event(foo, UVM_ALL_ON)
      *  `uvm_object_utils_end
      */
     "[def `uvm_object_utils_begin][bracket (][variable foo][bracket )]",
     "    [def `uvm_field_event][bracket (][variable foo], [variable UVM_ALL_ON][bracket )]",
     "[def `uvm_object_utils_end]",
     ""
  );

  MT("indent_uvm_macros2",
     /**
      * `uvm_do_with(mem_read,{
      *    bar_nb == 0;
      * })
      */
     "[def `uvm_do_with][bracket (][variable mem_read],[bracket {]",
     "    [variable bar_nb] [meta ==] [number 0];",
     "[bracket })]",
     ""
  );

  MT("indent_wait_disable_fork",
     /**
      * virtual task body();
      *    repeat (20) begin
      *       fork
      *          `uvm_create_on(t,p_seq)
      *       join_none
      *    end
      *    wait fork;
      *    disable fork;
      * endtask : body
      */
     "[keyword virtual] [keyword task] [variable body][bracket ()];",
     "    [keyword repeat] [bracket (][number 20][bracket )] [keyword begin]",
     "        [keyword fork]",
     "            [def `uvm_create_on][bracket (][variable t],[variable p_seq][bracket )]",
     "        [keyword join_none]",
     "    [keyword end]",
     "    [keyword wait] [keyword fork];",
     "    [keyword disable] [keyword fork];",
     "[keyword endtask] : [variable body]",
     ""
  );

  MT("indent_typedef_class",
     /**
      * typedef class asdf;
      * typedef p p_t[];
      * typedef enum {
      *    ASDF
      * } t;
      */
     "[keyword typedef] [keyword class] [variable asdf];",
     "[keyword typedef] [variable p] [variable p_t][bracket [[]]];",
     "[keyword typedef] [keyword enum] [bracket {]",
     "    [variable ASDF]",
     "[bracket }] [variable t];",
     ""
  );

  MT("indent_case_with_macro",
     /**
      * // It should be assumed that Macros can have ';' inside, or 'begin'/'end' blocks.
      * // As such, 'case' statement should indent correctly with macros inside.
      * case(foo)
      *    ASDF : this.foo = seqNum;
      *    ABCD : `update(f)
      *    EFGH : `update(g)
      * endcase
      */
     "[keyword case][bracket (][variable foo][bracket )]",
     "    [variable ASDF] : [keyword this].[variable foo] [meta =] [variable seqNum];",
     "    [variable ABCD] : [def `update][bracket (][variable f][bracket )]",
     "    [variable EFGH] : [def `update][bracket (][variable g][bracket )]",
     "[keyword endcase]",
     ""
  );

  MT("indent_extern_function",
     /**
      * extern virtual function void do(ref packet trans);
      * extern virtual function void do2(ref packet trans);
      */
     "[keyword extern] [keyword virtual] [keyword function] [keyword void] [variable do1][bracket (][keyword ref] [variable packet] [variable trans][bracket )];",
     "[keyword extern] [keyword virtual] [keyword function] [keyword void] [variable do2][bracket (][keyword ref] [variable packet] [variable trans][bracket )];",
     ""
  );

  MT("indent_assignment",
     /**
      * for (int i=1;i < fun;i++) begin
      *    foo = 2 << asdf || 11'h35 >> abcd
      *          && 8'h6 | 1'b1;
      * end
      */
     "[keyword for] [bracket (][keyword int] [variable i][meta =][number 1];[variable i] [meta <] [variable fun];[variable i][meta ++][bracket )] [keyword begin]",
     "    [variable foo] [meta =] [number 2] [meta <<] [variable asdf] [meta ||] [number 11'h35] [meta >>] [variable abcd]",
     "          [meta &&] [number 8'h6] [meta |] [number 1'b1];",
     "[keyword end]",
     ""
  );

  MT("indent_foreach_constraint",
     /**
      * `uvm_rand_send_with(wrTlp, {
      *    length ==1;
      *    foreach (Data[i]) {
      *       payload[i] == Data[i];
      *    }
      * })
      */
     "[def `uvm_rand_send_with][bracket (][variable wrTlp], [bracket {]",
     "    [variable length] [meta ==][number 1];",
     "    [keyword foreach] [bracket (][variable Data][bracket [[][variable i][bracket ]])] [bracket {]",
     "        [variable payload][bracket [[][variable i][bracket ]]] [meta ==] [variable Data][bracket [[][variable i][bracket ]]];",
     "    [bracket }]",
     "[bracket })]",
     ""
  );

  MT("indent_compiler_directives",
     /**
      * `ifdef DUT
      * `else
      *     `ifndef FOO
      *         `define FOO
      *     `endif
      * `endif
      * `timescale 1ns/1ns
      */
     "[def `ifdef] [variable DUT]",
     "[def `else]",
     "    [def `ifndef] [variable FOO]",
     "        [def `define] [variable FOO]",
     "    [def `endif]",
     "[def `endif]",
     "[def `timescale] [number 1][variable ns][meta /][number 1][variable ns]",
     ""
  );

})();
