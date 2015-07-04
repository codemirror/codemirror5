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
      elem.innerHTML = "";

      if(root_elem.getElementsByClassName("CodeMirror-line").length === 0){
        //do nothing
      }
      else{
        //ok, there is some content
        //first, get the range of lines that are shown in the viewport
        var scroll = cm.getScrollInfo();
        var lines = cm.getValue().split("\n");
        var line_height = root_elem.getElementsByClassName("CodeMirror-line")[0].offsetHeight;
        var total_height = scroll.clientHeight;

        var lines_cut_off_top = Math.ceil(scroll.top / line_height);
        //height of minimap line is 8px
        var minimap_lines_max = Math.floor(total_height / 2);

        var start_index = lines_cut_off_top;
        var end_index = start_index + minimap_lines_max;
        for(var i = start_index; i <= end_index; i++){
          if(lines[i]){
            var line_elem = document.createElement("div");
            line_elem.className = "CodeMirror-minimap-line";
            var html = "";

            var textContent = lines[i];
            for(var j = 0; j < textContent.length; j++){
              var _ch = textContent[j] + "";
              if(_ch === "\t"){
                html += "<div class='mini-tab'></div>";
              }
              else if(_ch === " "){
                html += "<div class='mini-space'></div>";
              }
              else{
                var out = "span.cm-" + cm.getTokenAt({
                  line: i,
                  ch: j
                }).type;
                var out_elem = root_elem.querySelector(out);
                var color = getComputedStyle(root_elem).color;
                if(out_elem){
                  color = getComputedStyle(out_elem).color;
                }

                html += "<div class='mini-block' style='background-color:"+color+"'></div>";
              }
            }

            line_elem.innerHTML = html;
            cm.getWrapperElement().getElementsByClassName("CodeMirror-minimap")[0].appendChild(line_elem);
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
