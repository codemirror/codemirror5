/*global CodeMirror, that */
/*jslint plusplus: true, browser: true, vars: true */
(function(){
// "use strict";
  function iOSpopup(cm) {
     var iPhone  = (navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i)),
         iPad    = (navigator.userAgent.match(/iPad/i)),
         popupVisible = false,
         clipboardText = "";

     // POPUP NODES
     var selectAll=document.createElement('li'),
         select   = document.createElement('li'),
         paste    = document.createElement('li'),
         copy     = document.createElement('li'),
         cut      = document.createElement('li'),
         startSel = document.createElement('span'),
         endSel   = document.createElement('span'),
         popup    = document.createElement('ul');
 
     popup.id          = "iOSpopup";
     selectAll.innerHTML="Select All";
     select.innerHTML  = "Select";
     paste.innerHTML   = "Paste";
     copy.innerHTML    = "Copy";
     cut.innerHTML     = "Cut";
     startSel.className=endSel.className = "selectionDot";
     var lines = document.getElementsByClassName('CodeMirror-lines')[0].firstChild;
     lines.appendChild(popup);
     lines.appendChild(startSel);
     lines.appendChild(endSel);

     function drawPopup(){
        var startCursor = cm.cursorCoords(true, "local"),
            endCursor   = cm.cursorCoords(false, "local"),
            cmWidth     = cm.getWrapperElement().offsetWidth,
            scrollInfo  = cm.getScrollInfo(),
            gutterWidth = cm.getGutterElement().offsetWidth,
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
          // somewhere offscreen (but keep it visible), since it usually sits atop endSel
          // position the popup relative to selection, taking visible boundary into account
          } else if(cm.somethingSelected()){
            popup.appendChild(cut);
            popup.appendChild(copy);
            if(clipboardText.length>0){ popup.appendChild(paste);}
            if(startCursor.y === endCursor.y){popupX = startCursor.x + (endCursor.x - startCursor.x)/2;}
            else{popupX = scrollInfo.x+screen.availWidth/2;}
            startSel.style.top  = startCursor.y-startSel.offsetWidth + "px";
            startSel.style.left = startCursor.x-startSel.offsetWidth/2 + "px";
            endSel.style.top    = endCursor.yBot + "px";
            endSel.style.left   = endCursor.x-endSel.offsetHeight/2 + "px";
            cm.getInputField().style.left = '-1000px';
          }

          // assume the popup's orietentation is pointing up
          popup.className = 'aboveEdge';
          // see if we can position it above the selection
          if((startCursor.y - (popup.offsetHeight+10)) > scrollInfo.y){
            popup.style.top  = startCursor.y - (popup.offsetHeight+20) + "px";
          // if not, see if we can position it below the selection
          } else if (endCursor.yBot+popup.offsetHeight+10 < scrollInfo.y+cm.getScrollerElement().offsetHeight){
            popup.className = 'belowEdge';
            popup.style.top = endCursor.yBot+20+"px";
          // if not, stick it in the middle of the screen
          } else {
            popup.style.top  = scrollInfo.y + (cm.getScrollerElement().offsetHeight/2)+"px";
          }
          // make sure the popup doesn't go off the left edge of the viewport
          if(popupX-popup.offsetWidth/2 < scrollInfo.x){
            popup.style.left = Math.max(0, scrollInfo.x-gutterWidth) + "px";
            popup.classList.add('leftEdge');
          // make sure the popup doesn't go off the right edge of the viewport
          } else if(popupX+popup.offsetWidth/2+gutterWidth > screen.availWidth+scrollInfo.x){
            popup.style.left = screen.availWidth+scrollInfo.x - (gutterWidth+popup.offsetWidth+25) + "px";
            popup.classList.add('rightEdge');
          } else {
            popup.style.left = popupX-popup.offsetWidth/2 + "px";
          }
      }

 
     // Factory: return methods for changing CM state in response to dragging corner dots
     function updateSelection(startChanging){
       return function(e){
           e.preventDefault();
           e.stopPropagation();
           if(e.touches.length !== 1){ return;}
           var adjustY = startChanging? startSel.offsetHeight : -startSel.offsetHeight,
               coords = {x: e.touches[0].pageX, y: e.touches[0].pageY+adjustY},
               startPos = startChanging? cm.coordsChar(coords) : cm.getCursor(true),
               endPos = startChanging? cm.getCursor(false) : cm.coordsChar(coords),
               scrollInfo = cm.getScrollInfo();
           // if the selection is valid, check to see if we should also scroll the editor
           if(startPos.line < endPos.line || (startPos.line===endPos.line && startPos.ch<endPos.ch)){
              cm.setSelection(startPos, endPos);
              if(startChanging && cm.cursorCoords(true, "local").y < scrollInfo.y){
                cm.scrollTo(null, cm.cursorCoords(true, "local").y);
              }
              if(!startChanging && cm.cursorCoords(false, "local").y > scrollInfo.y+scrollInfo.height){
                cm.scrollTo(null, cm.cursorCoords(false, "local").y-cm.scrollInfo.height);
              }
             }
           drawPopup();
           return false;
          };
     }
 
     // capture the event, execute f(e), and redraw the popup
     function popupFactory(f){return function(e){ e.preventDefault(); f(e); drawPopup();}}
 
     // draw selection for entire editor
     function selectAllHandler(e){ cm.setSelection({line: 0, ch: 0}, {line: cm.lineCount() - 1});}
 
     // set the clipboardText to whatever was selected, and hide the popup
     function copyHandler(e){ clipboardText = cm.getSelection(); popupVisible = false; }

     // replace selection with clipboardText, and hide the popup
     function pasteHandler(e){
       var from= cm.coordsChar(cm.cursorCoords(true)),
           to  = cm.coordsChar(cm.cursorCoords(false));
       cm.replaceRange(clipboardText, from, to);
       popupVisible = false;
     }

     // set the clipboardText to whatever was selected, delete the selection, and hide the popup
     function cutHandler(e){
       clipboardText = cm.getSelection();
       var from= cm.coordsChar(cm.cursorCoords(true)),
           to  = cm.coordsChar(cm.cursorCoords(false));
       cm.replaceRange("", from, to);
       popupVisible = false;
     }
 
    // draw selection around the current word
    function selectHandler(e){
        var cursor = cm.getCursor(),
            words  = cm.getLine(cursor.line).split(/[\s+\(\)\"\']/),
            start=0, end=0, i=0;
        for(i=0; i < words.length; i++){
          start = end;
          end+=words[i].length+1;
          if (end>cursor.ch){ break;}
        }
        cm.setSelection({line: cursor.line, ch: start}, {line: cursor.line, ch: end-1});
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
       var scroller  = cm.getScrollerElement();
       CodeMirror.connect(scroller,   "touchstart", restartTimer);
       CodeMirror.connect(scroller,   "touchmove",  clearTimer);
       CodeMirror.connect(scroller,   "touchend",   clearTimer);
       CodeMirror.connect(scroller,   "click",      function(){popupVisible=false;});
       CodeMirror.connect(startSel,   "touchstart", updateSelection(true));
       CodeMirror.connect(endSel,     "touchstart", updateSelection(false));
       CodeMirror.connect(startSel,   "touchmove",  updateSelection(true));
       CodeMirror.connect(endSel,     "touchmove",  updateSelection(false));
       CodeMirror.connect(select,     "touchend",   popupFactory(selectHandler));
       CodeMirror.connect(selectAll,  "touchend",   popupFactory(selectAllHandler));
       CodeMirror.connect(cut,        "touchend",   popupFactory(cutHandler));
       CodeMirror.connect(copy,       "touchend",   popupFactory(copyHandler));
       CodeMirror.connect(paste,      "touchend",   popupFactory(pasteHandler));
       cm.setOption("onChange", function(){popupVisible = false; drawPopup();});
    }
  }
  CodeMirror.defineExtension("addPopup", function() { return new iOSpopup(this);});
})();