(function () {
    "use strict";   

    var tm1, tm2;

    function startTagHighlight(cm) {
        if(tm1) tm1.clear();
        if(tm2) tm2.clear();
        tm1 = undefined; tm2 = undefined;

        if(cm.getSelection() !== "") return;

        var pos = CodeMirror.findMatchingTag(cm, cm.doc.getCursor());

        if(pos) {
            
            if(pos.open && pos.open.from && pos.open.to) {
                tm1 = cm.doc.markText(pos.open.from, pos.open.to, {className: "CodeMirror-matchingbracket"});              
            }         

            if(pos.close && pos.close.from && pos.close.to) {
                tm2 = cm.doc.markText(pos.close.from, pos.close.to, {className: "CodeMirror-matchingbracket"});                
            }
        }        
    }

    CodeMirror.defineOption("taghighlight", false, function(cm) {    
          cm.on("cursorActivity", startTagHighlight);      
    });
})();

