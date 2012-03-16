  $(document).ready(function(){
    module("testBase");
    test("eviltest", function() {
      expect(1);

      var input = 'xquery version &quot;1.0-ml&quot;;\
      (: this is\
       : a \
         "comment" :)\
      let $let := &lt;x attr=&quot;value&quot;&gt;&quot;test&quot;&lt;func&gt;function() $var {function()} {$var}&lt;/func&gt;&lt;/x&gt;\
      let $joe:=1\
      return element element {\
          attribute attribute { 1 },\
          element test { &#39;a&#39; }, \
          attribute foo { &quot;bar&quot; },\
          fn:doc()[ foo/@bar eq $let ],\
          //x }    \
       \
      (: a more \'evil\' test :)\
      (: Modified Blakeley example (: with nested comment :) ... :)\
      declare private function local:declare() {()};\
      declare private function local:private() {()};\
      declare private function local:function() {()};\
      declare private function local:local() {()};\
      let $let := &lt;let&gt;let $let := &quot;let&quot;&lt;/let&gt;\
      return element element {\
          attribute attribute { try { xdmp:version() } catch($e) { xdmp:log($e) } },\
          attribute fn:doc { &quot;bar&quot; castable as xs:string },\
          element text { text { &quot;text&quot; } },\
          fn:doc()[ child::eq/(@bar | attribute::attribute) eq $let ],\
          //fn:doc\
      }';
      var expected = '<span class="cm-keyword">xquery</span> <span class="cm-keyword">version</span> <span class="cm-string">"1.0-ml"</span><span class="cm-variable cm-def">;</span>      <span class="cm-comment">(: this is       : a          "comment" :)</span>      <span class="cm-keyword">let</span> <span class="cm-variable">$let</span> <span class="cm-keyword">:=</span> <span class="cm-tag">&lt;x </span><span class="cm-attribute">attr</span>=<span class="cm-string">"value"</span><span class="cm-tag">&gt;</span><span class="cm-word">"test"</span><span class="cm-tag">&lt;func&gt;</span><span class="cm-word">function()</span> <span class="cm-word">$var</span> {<span class="cm-keyword">function</span>()} {<span class="cm-variable">$var</span>}<span class="cm-tag">&lt;/func&gt;&lt;/x&gt;</span>      <span class="cm-keyword">let</span> <span class="cm-variable">$joe</span><span class="cm-keyword">:=</span><span class="cm-atom">1</span>      <span class="cm-keyword">return</span> <span class="cm-keyword">element</span> <span class="cm-word">element</span> {          <span class="cm-keyword">attribute</span> <span class="cm-word">attribute</span> { <span class="cm-atom">1</span> },          <span class="cm-keyword">element</span> <span class="cm-word">test</span> { <span class="cm-string">\'a\'</span> },           <span class="cm-keyword">attribute</span> <span class="cm-word">foo</span> { <span class="cm-string">"bar"</span> },          <span class="cm-variable cm-def">fn:doc</span>()[ <span class="cm-word">foo</span><span class="cm-keyword">/</span><span class="cm-word">@bar</span> <span class="cm-keyword">eq</span> <span class="cm-variable">$let</span> ],          <span class="cm-keyword">//</span><span class="cm-word">x</span> }                 <span class="cm-comment">(: a more \'evil\' test :)</span>      <span class="cm-comment">(: Modified Blakeley example (: with nested comment :) ... :)</span>      <span class="cm-keyword">declare</span> <span class="cm-keyword">private</span> <span class="cm-keyword">function</span> <span class="cm-variable cm-def">local:declare</span>() {()}<span class="cm-word">;</span>      <span class="cm-keyword">declare</span> <span class="cm-keyword">private</span> <span class="cm-keyword">function</span> <span class="cm-variable cm-def">local:private</span>() {()}<span class="cm-word">;</span>      <span class="cm-keyword">declare</span> <span class="cm-keyword">private</span> <span class="cm-keyword">function</span> <span class="cm-variable cm-def">local:function</span>() {()}<span class="cm-word">;</span>      <span class="cm-keyword">declare</span> <span class="cm-keyword">private</span> <span class="cm-keyword">function</span> <span class="cm-variable cm-def">local:local</span>() {()}<span class="cm-word">;</span>      <span class="cm-keyword">let</span> <span class="cm-variable">$let</span> <span class="cm-keyword">:=</span> <span class="cm-tag">&lt;let&gt;</span><span class="cm-word">let</span> <span class="cm-word">$let</span> <span class="cm-word">:=</span> <span class="cm-word">"let"</span><span class="cm-tag">&lt;/let&gt;</span>      <span class="cm-keyword">return</span> <span class="cm-keyword">element</span> <span class="cm-word">element</span> {          <span class="cm-keyword">attribute</span> <span class="cm-word">attribute</span> { <span class="cm-keyword">try</span> { <span class="cm-variable cm-def">xdmp:version</span>() } <span class="cm-keyword">catch</span>(<span class="cm-variable">$e</span>) { <span class="cm-variable cm-def">xdmp:log</span>(<span class="cm-variable">$e</span>) } },          <span class="cm-keyword">attribute</span> <span class="cm-word">fn:doc</span> { <span class="cm-string">"bar"</span> <span class="cm-word">castable</span> <span class="cm-keyword">as</span> <span class="cm-atom">xs:string</span> },          <span class="cm-keyword">element</span> <span class="cm-word">text</span> { <span class="cm-keyword">text</span> { <span class="cm-string">"text"</span> } },          <span class="cm-variable cm-def">fn:doc</span>()[ <span class="cm-qualifier">child::</span><span class="cm-word">eq</span><span class="cm-keyword">/</span>(<span class="cm-word">@bar</span> <span class="cm-keyword">|</span> <span class="cm-qualifier">attribute::</span><span class="cm-word">attribute</span>) <span class="cm-keyword">eq</span> <span class="cm-variable">$let</span> ],          <span class="cm-keyword">//</span><span class="cm-word">fn:doc</span>      }';

      $("#sandbox").html('<textarea id="editor">' + input + '</textarea>');
      var editor = CodeMirror.fromTextArea($("#editor")[0]);
      var result = $(".CodeMirror-lines div div pre")[0].innerHTML;

       equal(result, expected);
       $("#editor").html("");
    });
  });
