  $(document).ready(function(){
    module("testMultiAttr");
    test("test1", function() {
      expect(1);

      var expected = '<span class="cm-tag">&lt;p </span><span class="cm-attribute">a1</span>=<span class="cm-string">"foo"</span> <span class="cm-attribute">a2</span>=<span class="cm-string">"bar"</span><span class="cm-tag">&gt;</span><span class="cm-word">hello</span> <span class="cm-word">world</span><span class="cm-tag">&lt;/p&gt;</span>';

      $("#sandbox").html('<textarea id="editor"></textarea>');
      $("#editor").html('<p a1="foo" a2="bar">hello world</p>');
      var editor = CodeMirror.fromTextArea($("#editor")[0]);
      var result = $(".CodeMirror-lines div div pre")[0].innerHTML;

       equal(result, expected);
       $("#editor").html("");
    });
  });