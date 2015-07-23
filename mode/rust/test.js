(function() {
	var mode = CodeMirror.getMode({indentUnit: 4}, "rust");
	function MT(name) {test.mode(name, mode, Array.prototype.slice.call(arguments, 1));}

	MT('integer_test',
	   '[number 123i32]',
	   '[number 123u32]',
	   '[number 123_u32]',
	   '[number 0xff_u8]',
	   '[number 0o70_i16]',
	   '[number 0b1111_1111_1001_0000_i32]',
	   '[number 0usize]');

	MT('float_test',
	   '[number 123.0f64]',
	   '[number 0.1f64]',
	   '[number 0.1f32]',
	   '[number 12E+99_f64]');

	MT('string-literals-test',
	   "[string-2 'H']",
	   '[string "hello"]',
	   '[string r#"hello"#]');

})();
