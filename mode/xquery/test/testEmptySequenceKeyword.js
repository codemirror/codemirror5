$(document).ready(function(){
  module("testEmptySequenceKeyword");
  test("testEmptySequenceKeyword", function() {
    expect(1);

    var input = '"foo" instance of empty-sequence()';
    var expected = '<span class="cm-string">"foo"</span> <span class="cm-keyword">instance</span> <span class="cm-keyword">of</span> <span class="cm-keyword">empty-sequence</span>()';

    $("#sandbox").html('<textarea id="editor">' + input + '</textarea>');
    var editor = CodeMirror.fromTextArea($("#editor")[0]);
    var result = $(".CodeMirror-lines div div pre")[0].innerHTML;

     equal(result, expected);
     $("#editor").html("");
  });
});
