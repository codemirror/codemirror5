/*global CodeMirror, that */
/*jslint plusplus: true, browser: true, vars: true */
(function(){
// "use strict";
  function iOSpopup(cm) {
     var iPhone  = (navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i)),
         iPad    = (navigator.userAgent.match(/iPad/i)),
         popupVisible = false,
         clipboardText = "",
         wrapper = cm.getWrapperElement(),
         scroller = cm.getScrollerElement(),
         gutterWidth = cm.getGutterElement().offsetWidth;

     // POPUP NODES
     var selectAll=document.createElement('li'),
         select   = document.createElement('li'),
         paste    = document.createElement('li'),
         copy     = document.createElement('li'),
         cut      = document.createElement('li'),
         startDot = document.createElement('span'),
         endDot   = document.createElement('span'),
         startSel = document.createElement('span'),
         endSel   = document.createElement('span'),
         popup    = document.createElement('ul');
 
     // MAGNIFIER NODES
     var magnifyingGlass = document.createElement('div'),
         magnifiedStuff  = document.createElement('div'),
         magnifiedScale = 1.5,
         magnifiedCM;
     magnifyingGlass.className = "magnifyingGlass";
     magnifiedStuff.style.webkitTransform = "scale("+magnifiedScale+")";
     magnifiedStuff.className = "magnifiedStuff";
     magnifiedStuff.style.width = wrapper.style.width;
     magnifiedStuff.style.height = wrapper.style.height;
     magnifyingGlass.appendChild(magnifiedStuff);
 
     popup.id          = "iOSpopup";
     selectAll.innerHTML="Select All";
     select.innerHTML  = "Select";
     paste.innerHTML   = "Paste";
     copy.innerHTML    = "Copy";
     cut.innerHTML     = "Cut";
     startSel.className=endSel.className = "selectionDot";
     startSel.appendChild(startDot);
     endSel.appendChild(endDot);
 
     var lines = document.getElementsByClassName('CodeMirror-lines')[0].firstChild;
     lines.appendChild(popup);
     lines.appendChild(startSel);
     lines.appendChild(endSel);
     scroller.appendChild(magnifyingGlass);

     function drawPopup(){
        var startCursor = cm.cursorCoords(true, "local"),
            endCursor   = cm.cursorCoords(false, "local"),
            scrollInfo  = cm.getScrollInfo(),
            popupX;

        // empty the popup and set display values of all relevant nodes
        popup.innerHTML = null;
        popup.style.display = popupVisible? 'block' : 'none';
        startSel.style.display=endSel.style.display = cm.somethingSelected()? 'block' : 'none';
        // If the popup is the result of a longPress, fill it accordingly
        if(popupVisible && !cm.somethingSelected()){
          popup.appendChild(select);
          popup.appendChild(selectAll);
          if(clipboardText.length>0){ popup.appendChild(paste);}
          popupX = startCursor.x;

        // If something is selected, fill the popup accordingly, and move the input field
        // somewhere offscreen (but keep it visible), since it usually sits atop endSel.
        } else if(cm.somethingSelected()){
          popup.appendChild(cut);
          popup.appendChild(copy);
          if(clipboardText.length>0){ popup.appendChild(paste);}
          if(startCursor.y === endCursor.y){popupX = startCursor.x + (endCursor.x - startCursor.x)/2;}
          else{popupX = scrollInfo.x+screen.availWidth/2;}
          startSel.style.top  = startCursor.y - 0.75*startSel.offsetHeight+ "px";
          startSel.style.left = startCursor.x - 0.50*startSel.offsetWidth + "px";
          endSel.style.top    = endCursor.yBot- 0.25*endSel.offsetHeight  + "px";
          endSel.style.left   = endCursor.x   - 0.50*endSel.offsetWidth   + "px";
          cm.getInputField().style.left = '-1000px';
        }

        // Position the popup relative to selection, taking visible boundary into account
        popup.className = 'aboveEdge';
        // 1a) see if we can position it above the selection
        if((startCursor.y - (popup.offsetHeight+10)) > scrollInfo.y){
          popup.style.top  = startCursor.y - (popup.offsetHeight+10) + "px";
        // 1b) if not, see if we can position it below the selection
        } else if (endCursor.yBot+popup.offsetHeight+10 < scrollInfo.y+scroller.offsetHeight){
          popup.className = 'belowEdge';
          popup.style.top = endCursor.yBot+20+"px";
        // 1c) if not, stick it in the middle of the screen
        } else {
          popup.style.top  = scrollInfo.y + (scroller.offsetHeight/2)+"px";
        }
        // 2a) make sure the popup doesn't go off the left edge of the viewport
        if(popupX-popup.offsetWidth/2 < scrollInfo.x){
          popup.style.left = Math.max(0, scrollInfo.x-gutterWidth) + "px";
          popup.classList.add('leftEdge');
        // 2b) make sure the popup doesn't go off the right edge of the viewport
        } else if(popupX+popup.offsetWidth/2+gutterWidth > screen.availWidth+scrollInfo.x){
          popup.style.left = screen.availWidth+scrollInfo.x - (gutterWidth+popup.offsetWidth+25) + "px";
          popup.classList.add('rightEdge');
        } else {
        // 2c) center the popup a popupX
          popup.style.left = popupX-popup.offsetWidth/2 + "px";
        }
      }

 
     // Factory: return methods for changing CM state in response to dragging corner dots
     function updateSelection(start){
       return function(e){
           e.preventDefault();
           e.stopPropagation();
 
           // on touchEnd, make sure the popup is visible and magnifying glass isn't
           magnifyingGlass.style.display = (e.type === 'touchend')? "none" : "block";
           popupVisible = (e.type === 'touchend');
           if(e.touches.length !== 1){ drawPopup(); return;}
 
           var adjustY  = start? startSel.firstChild.offsetHeight : -endSel.firstChild.offsetHeight,
               coords   = {x: e.touches[0].pageX, y: e.touches[0].pageY+adjustY},
               startPos = start? cm.coordsChar(coords) : cm.getCursor(true),
               endPos   = start? cm.getCursor(false) : cm.coordsChar(coords),
               scrollInfo = cm.getScrollInfo(),
               changingSel = start? startSel : endSel;

           // if the selection is valid, update it and the magnifier, and check to see if we should scroll the editor
           if(startPos.line < endPos.line || (startPos.line===endPos.line && startPos.ch<endPos.ch)){
              cm.setSelection(startPos, endPos);
              magnifiedCM.setSelection(startPos, endPos);
              // see if we need to scroll the editor up
              if(start && cm.cursorCoords(true, "local").y < scrollInfo.y){
                cm.scrollTo(null, cm.cursorCoords(true, "local").y);
              }
//              if(!start && cm.cursorCoords(false, "local").y > scrollInfo.y+scrollInfo.height){
//                cm.scrollTo(null, cm.cursorCoords(false, "local").y-cm.scrollInfo.height);
//              }
              // line up the magnified CM instance, the viewer window and the magifying glass
              magnifiedCM.scrollTo(scrollInfo.x, scrollInfo.y);
              magnifyingGlass.style.top = cm.cursorCoords(start, "local").y - magnifyingGlass.offsetHeight - 10 + "px";
              magnifyingGlass.style.left = changingSel.offsetLeft-changingSel.offsetWidth/2 + "px";
              magnifiedStuff.style.top = (-cm.cursorCoords(start).y+wrapper.offsetTop)*magnifiedScale+10+"px";
              magnifiedStuff.style.left= (-cm.cursorCoords(start).x+gutterWidth-scrollInfo.x)*magnifiedScale+magnifyingGlass.offsetWidth/2+"px";
             }

           drawPopup();
           return false;
          };
     }
 
     // capture the event, execute f(e), and redraw the popup
     function popupFactory(f){return function(e){ e.preventDefault(); f(e); drawPopup();};}
     // draw selection for entire editor
     function selectAllHandler(){ cm.setSelection({line: 0, ch: 0}, {line: cm.lineCount() - 1}); popupVisible = true;}
     // set the clipboardText to whatever was selected, and hide the popup
     function copyHandler(){ clipboardText = cm.getSelection(); popupVisible = false; }
     // replace selection with clipboardText, and hide the popup
     function pasteHandler(){
       var from= cm.coordsChar(cm.cursorCoords(true)),
           to  = cm.coordsChar(cm.cursorCoords(false));
       cm.replaceRange(clipboardText, from, to);
       popupVisible = false;
     }

     // set the clipboardText to whatever was selected, delete the selection, and hide the popup
     function cutHandler(){
       clipboardText = cm.getSelection();
       var from= cm.coordsChar(cm.cursorCoords(true)),
           to  = cm.coordsChar(cm.cursorCoords(false));
       cm.replaceRange("", from, to);
       popupVisible = false;
     }
 
    // draw selection around the current word
    function selectHandler(){
        var cursor = cm.getCursor(),
            words  = cm.getLine(cursor.line).split(/[\s+\(\)\"\']/),
            start=0, end=0, i=0;
        for(i=0; i < words.length; i++){
          start = end;
          end+=words[i].length+1;
          if (end>cursor.ch){ break;}
        }
        cm.setSelection({line: cursor.line, ch: start}, {line: cursor.line, ch: end-1});
        popupVisible = true;
    }

   /*****************************************************************************************
    *    Connect Event Handlers                                                           */
     function showPopup(e){
       popupVisible = true;
       e.preventDefault();
       e.stopPropagation();
       if(e.touches.length !== 1){ return;}
       var coords = {x: e.touches[0].pageX, y: e.touches[0].pageY};
       cm.setCursor(cm.coordsChar(coords));

       // make a clone of the editor, to be magnified
       magnifiedCM = cm.getTextArea().cloneNode(true);
       magnifiedStuff.innerHTML = "";
       magnifiedStuff.appendChild(magnifiedCM);
       magnifiedCM =CodeMirror.fromTextArea(magnifiedCM,{mode: cm.getOption("mode"),
                                                         lineNumbers: cm.getOption("lineNumbers")});

       drawPopup();
       cm.focus();
     }
    
     var timer = null;
     function clearTimer(){window.clearTimeout(timer);}
     function restartTimer(e){
       popupVisible = false;
       e.stopPropagation();
       timer = window.setTimeout(function(){showPopup(e);},500);
       window.setTimeout(drawPopup, 500);
     }

    if(iPad || iPhone){
       CodeMirror.connect(scroller,   "touchstart", restartTimer);
       CodeMirror.connect(scroller,   "touchmove",  clearTimer);
       CodeMirror.connect(scroller,   "touchend",   clearTimer);
       CodeMirror.connect(scroller,   "click",      function(){popupVisible=false;});
                                                     
       CodeMirror.connect(startSel,   "touchstart", updateSelection(true));
       CodeMirror.connect(endSel,     "touchstart", updateSelection(false));
       CodeMirror.connect(startSel,   "touchmove",  updateSelection(true));
       CodeMirror.connect(endSel,     "touchmove",  updateSelection(false));
       CodeMirror.connect(startSel,   "touchend",  updateSelection(true));
       CodeMirror.connect(endSel,     "touchend",  updateSelection(false));
                                                     
       CodeMirror.connect(select,     "touchend",   popupFactory(selectHandler));
       CodeMirror.connect(selectAll,  "touchend",   popupFactory(selectAllHandler));
       CodeMirror.connect(cut,        "touchend",   popupFactory(cutHandler));
       CodeMirror.connect(copy,       "touchend",   popupFactory(copyHandler));
       CodeMirror.connect(paste,      "touchend",   popupFactory(pasteHandler));
       cm.setOption("onChange", function(){popupVisible = false; drawPopup();});
    }
  }
 CodeMirror.defineInitHook(function(cm){new iOSpopup(cm);});
})();