//example of generating highlighting using node and CodeMirror
//to call, run "node runmode_node_test.js"

CodeMirror = require('./runmode.node.js');
haxe = require('../../mode/haxe/haxe.js');

var text='function update(){\n  trace("Hello, sailor!");\n}';

var result="<div class='Codemirror cm-s-default'>";
function f(token,style,c,d,e){
        if (token=="\n"){
                result+="<br>";
        } else if (token.trim().length==0){
                for (var i=0;i<token.length;i++){
                        //replace whitespace with explicit spaces
                        result+="&nbsp;";
                }
        } else {
                result+="<span class='cm-"+style+"'>"+token+"</span>";
        }
}

CodeMirror.runMode(text, "haxe",f);
result+="</div>";

console.log(result);
