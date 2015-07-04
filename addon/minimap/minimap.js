// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// Open simple minimap on top of an editor. Relies on minimap.css.

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  CodeMirror.defineOption("minimap", false, function(cm){
    var val = cm.getOption("minimap");
    var root_elem = cm.getWrapperElement();
    if(val === true){
      //display minimap
      //if elem -> .CodeMirror-minimap doesn't exist
      if(root_elem.getElementsByClassName("CodeMirror-minimap").length == 0){
        //insert it
        var div = document.createElement("div");
        div.innerHTML = "";
        div.className = "CodeMirror-minimap";
        root_elem.appendChild(div);
        //add onchange
        cm.on("update", refreshMinimap);
        cm.on("scroll", refreshMinimap);
      }
      //otherwise, do nothing
    }
    else{
      if(root_elem.getElementsByClassName("CodeMirror-minimap").length == 0){
        //do nothing
      }
      else{
        //remove it
        root_elem.removeChild(root_elem.getElementsByClassName("CodeMirror-minimap")[0]);
        cm.off("update", refreshMinimap);
        cm.off("scroll", refreshMinimap);
      }
    }
  });

  function refreshMinimap(cm, _from, _to){
    var root_elem = cm.getWrapperElement();
    var elem = root_elem.getElementsByClassName("CodeMirror-minimap");
    //first, clear
    if(elem.length !== 0){
      elem = elem[0];
      elem.style.backgroundColor = getComputedStyle(root_elem)["background-color"];
      elem.innerHTML = "";
      var text = cm.getValue();

      if(text.trim() === ""){
        //do nothing
      }
      else{
        //ok, there is some content
        //first, get the range of lines that are shown in the viewport
        var scroll = cm.getScrollInfo();
        var lines = root_elem.getElementsByClassName("CodeMirror-line");
        var line_height = lines[0].offsetHeight;
        var total_height = scroll.clientHeight;
        var minimap_lines_max = Math.floor(total_height / 2);

        var view = cm.getViewport();
        var first_line_shown = Math.round(scroll.top / line_height);
        var first_line_render = view.from;
        var last_line_render = view.to;

        var start_index = first_line_shown - first_line_render;
        var end_index = last_line_render - first_line_render;

        if(end_index - start_index > minimap_lines_max){
          end_index = start_index + minimap_lines_max;
        }

        for(var i = start_index; i <= end_index; i++){
          if(lines[i]){
            var _temp = lines[i].cloneNode(true);
            var new_line = document.createElement('pre');
            new_line.innerHTML = _temp.innerHTML;
            new_line.className = "CodeMirror-minimap-line";
            elem.appendChild(new_line);
            var spans = new_line.querySelectorAll("span>span");
            for(var k = 0; k < spans.length; k++){
              var color = getComputedStyle(spans[k]).color;
                 spans[k].style.backgroundColor = color;
               }
             }
           }
        }
    }
  };

  function getComputedStyle( dom ) {
        var style;
        var returns = {};
        // FireFox and Chrome way
        if(window.getComputedStyle){
            style = window.getComputedStyle(dom, null);
            for(var i = 0, l = style.length; i < l; i++){
                var prop = style[i];
                var val = style.getPropertyValue(prop);
                returns[prop] = val;
            }
            return returns;
        }
        // IE and Opera way
        if(dom.currentStyle){
            style = dom.currentStyle;
            for(var prop in style){
                returns[prop] = style[prop];
            }
            return returns;
        }
        // Style from style attribute
        if(style = dom.style){
            for(var prop in style){
                if(typeof style[prop] != 'function'){
                    returns[prop] = style[prop];
                }
            }
            return returns;
        }
        return returns;
    };
});
