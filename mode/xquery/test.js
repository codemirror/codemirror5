// Initiate ModeTest and set defaults
var MT = ModeTest;
MT.modeName = "xquery";
MT.modeOptions = {};

MT.testMode("eviltest",
            'xquery version &quot;1.0-ml&quot;;\
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
      }', ["keyword","xquery",null," ","keyword","version",null," ","variable","&quot;1","keyword",".","atom","0","keyword","-","variable","ml&quot;","def variable",";",null,"      ","comment","(: this is       : a          \"comment\" :)",null,"      ","keyword","let",null," ","variable","$let",null," ","keyword",":=",null," ","variable","&lt;x",null," ","variable","attr","keyword","=","variable","&quot;value&quot;&gt;&quot;test&quot;&lt;func&gt","def variable",";function","","()",null," ","variable","$var",null," ","","{","keyword","function","","()}",null," ","","{","variable","$var","","}","variable","&lt;","keyword","/","variable","func&gt;&lt;","keyword","/","variable","x&gt;",null,"      ","keyword","let",null," ","variable","$joe","keyword",":=","atom","1",null,"      ","keyword","return",null," ","keyword","element",null," ","variable","element",null," ","","{",null,"          ","keyword","attribute",null," ","variable","attribute",null," ","","{",null," ","atom","1",null," ","","},",null,"          ","keyword","element",null," ","variable","test",null," ","","{",null," ","variable","&#39;a&#39;",null," ","","},",null,"           ","keyword","attribute",null," ","variable","foo",null," ","","{",null," ","variable","&quot;bar&quot;",null," ","","},",null,"          ","def variable","fn:doc","","()[",null," ","variable","foo","keyword","/","variable","@bar",null," ","keyword","eq",null," ","variable","$let",null," ","","],",null,"          ","keyword","//","variable","x",null," ","","}",null,"                 ","comment","(: a more 'evil' test :)",null,"      ","comment","(: Modified Blakeley example (: with nested comment :) ... :)",null,"      ","keyword","declare",null," ","keyword","private",null," ","keyword","function",null," ","def variable","local:declare","","()",null," ","","{()}","variable",";",null,"      ","keyword","declare",null," ","keyword","private",null," ","keyword","function",null," ","def variable","local:private","","()",null," ","","{()}","variable",";",null,"      ","keyword","declare",null," ","keyword","private",null," ","keyword","function",null," ","def variable","local:function","","()",null," ","","{()}","variable",";",null,"      ","keyword","declare",null," ","keyword","private",null," ","keyword","function",null," ","def variable","local:local","","()",null," ","","{()}","variable",";",null,"      ","keyword","let",null," ","variable","$let",null," ","keyword",":=",null," ","variable","&lt;let&gt;let",null," ","variable","$let",null," ","keyword",":=",null," ","variable","&quot;let&quot;&lt;","keyword","/let","variable","&gt;",null,"      ","keyword","return",null," ","keyword","element",null," ","variable","element",null," ","","{",null,"          ","keyword","attribute",null," ","variable","attribute",null," ","","{",null," ","keyword","try",null," ","","{",null," ","def variable","xdmp:version","","()",null," ","","}",null," ","keyword","catch","","(","variable","$e","",")",null," ","","{",null," ","def variable","xdmp:log","","(","variable","$e","",")",null," ","","}",null," ","","},",null,"          ","keyword","attribute",null," ","variable","fn:doc",null," ","","{",null," ","variable","&quot;bar&quot;",null," ","variable","castable",null," ","keyword","as",null," ","atom","xs:string",null," ","","},",null,"          ","keyword","element",null," ","variable","text",null," ","","{",null," ","keyword","text",null," ","","{",null," ","variable","&quot;text&quot;",null," ","","}",null," ","","},",null,"          ","def variable","fn:doc","","()[",null," ","qualifier","child::","variable","eq","keyword","/","","(","variable","@bar",null," ","keyword","|",null," ","qualifier","attribute::","variable","attribute","",")",null," ","keyword","eq",null," ","variable","$let",null," ","","],",null,"          ","keyword","//","variable","fn:doc",null,"      ","","}"]);

MT.testMode("testEmptySequenceKeyword",
            '"foo" instance of empty-sequence()',
            ["string","\"foo\"",null," ","keyword","instance",null," ","keyword","of",null," ","keyword","empty-sequence","","()"]);


MT.testMode("testMultiAttr",
            '<p a1="foo" a2="bar">hello world</p>',
            ["tag","<p ","attribute","a1","","=","string","\"foo\"",null," ","attribute","a2","","=","string","\"bar\"","tag",">","variable","hello",null," ","variable","world","tag","</p>"]);

MT.testMode("test namespaced variable",
            'declare namespace e = "http://example.com/ANamespace";\
declare variable $e:exampleComThisVarIsNotRecognized as element(*) external;',
            ["keyword","declare",null," ","keyword","namespace",null," ","variable","e",null," ","keyword","=",null," ","string","\"http://example.com/ANamespace\"","variable",";declare",null," ","keyword","variable",null," ","variable","$e:exampleComThisVarIsNotRecognized",null," ","keyword","as",null," ","keyword","element","","(","keyword","*","",")",null," ","variable","external;"]);

MT.testMode("test EQName variable",
            'declare variable $"http://www.example.com/ns/my":var := 12;\
<out>{$"http://www.example.com/ns/my":var}</out>',
            ["keyword","declare",null," ","keyword","variable",null," ","variable","$\"http://www.example.com/ns/my\":var",null," ","keyword",":=",null," ","atom","12","variable",";","tag","<out>","","{","variable","$\"http://www.example.com/ns/my\":var","","}","tag","</out>"]);

MT.testMode("test EQName function",
            'declare function "http://www.example.com/ns/my":fn ($a as xs:integer) as xs:integer {\
   $a + 2\
};\
<out>{"http://www.example.com/ns/my":fn(12)}</out>',
            ["keyword","declare",null," ","keyword","function",null," ","def variable","\"http://www.example.com/ns/my\":fn",null," ","","(","variable","$a",null," ","keyword","as",null," ","atom","xs:integer","",")",null," ","keyword","as",null," ","atom","xs:integer",null," ","","{",null,"   ","variable","$a",null," ","keyword","+",null," ","atom","2","","}","variable",";","tag","<out>","","{","def variable","\"http://www.example.com/ns/my\":fn","","(","atom","12","",")}","tag","</out>"]);

MT.testMode("test EQName function with single quotes",
            'declare function \'http://www.example.com/ns/my\':fn ($a as xs:integer) as xs:integer {\
   $a + 2\
};\
<out>{\'http://www.example.com/ns/my\':fn(12)}</out>',
            ["keyword","declare",null," ","keyword","function",null," ","def variable","'http://www.example.com/ns/my':fn",null," ","","(","variable","$a",null," ","keyword","as",null," ","atom","xs:integer","",")",null," ","keyword","as",null," ","atom","xs:integer",null," ","","{",null,"   ","variable","$a",null," ","keyword","+",null," ","atom","2","","}","variable",";","tag","<out>","","{","def variable","'http://www.example.com/ns/my':fn","","(","atom","12","",")}","tag","</out>"]);

MT.testMode("testProcessingInstructions",
            'data(<?target content?>) instance of xs:string',
            ["def variable","data","","(","comment meta","<?target content?>","",")",null," ","keyword","instance",null," ","keyword","of",null," ","atom","xs:string"]);

MT.testMode("testQuoteEscapeDouble",
            'let $rootfolder := "c:\\builds\\winnt\\HEAD\\qa\\scripts\\"\
let $keysfolder := concat($rootfolder, "keys\\")\
return\
$keysfolder',
            ["keyword","let",null," ","variable","$rootfolder",null," ","keyword",":=",null," ","string","\"c:\\builds\\winnt\\HEAD\\qa\\scripts\\\"","keyword","let",null," ","variable","$keysfolder",null," ","keyword",":=",null," ","def variable","concat","","(","variable","$rootfolder","",",",null," ","string","\"keys\\\"","",")","variable","return$keysfolder"]);
