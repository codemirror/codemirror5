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
     magnifyingGlass.className = "magnifying selection";
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
 
     // add nodes to the CM DOM, shift the input element so it's out of the way
     var lines = document.getElementsByClassName('CodeMirror-lines')[0].firstChild;
     lines.appendChild(popup);
     lines.appendChild(startSel);
     lines.appendChild(endSel);
     document.body.appendChild(magnifyingGlass);
     cm.getInputField().style.left = '-1000px';

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
        cm.focus();
      }

     // given some coordinates for finger position, draw the magnifier AT LEAST 60px above the finger
     function drawMagnifierAt(coords){
         scrollInfo = cm.getScrollInfo();
         magnifiedCM.scrollTo(scrollInfo.x, scrollInfo.y);
         magnifyingGlass.style.top = coords.y - Math.max(magnifyingGlass.offsetHeight, 60) + "px";
         magnifyingGlass.style.left= coords.x - magnifyingGlass.offsetWidth/2 + "px";
         magnifiedStuff.style.top  = (-coords.y+wrapper.offsetTop+magnifyingGlass.offsetHeight/4)*magnifiedScale+"px";
         magnifiedStuff.style.left = (-coords.x+gutterWidth-scrollInfo.x-15)*magnifiedScale+magnifyingGlass.offsetWidth/2+"px";
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
               scrollInfo = cm.getScrollInfo();
 
           // if the selection is valid, update it and the magnifier, and check to see if we should scroll the editor
           if(startPos.line < endPos.line || (startPos.line===endPos.line && startPos.ch<endPos.ch)){
              cm.setSelection(startPos, endPos);
              magnifiedCM.setSelection(startPos, endPos);
              // see if we need to scroll the editor
              if(start) cm.scrollTo(null, Math.min(cm.cursorCoords(start, "local").y, scrollInfo.y));
              if(start) cm.scrollTo(Math.min(cm.cursorCoords(start, "local").x, scrollInfo.x), null);
              magnifyingGlass.className = 'magnifying selection';
              drawMagnifierAt(coords);
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
     function showMagnifier(e){
       e.preventDefault();
       e.stopPropagation();
       if(e.touches.length !== 1){ return;}
       magnifyingGlass.style.display = "block";
       magnifyingGlass.className = "magnifying cursor"
       popupVisible = false;
       drawPopup();

       //empty the magnifier, then set it to a new clone of the editor
       magnifiedStuff.innerHTML = "";
       magnifiedCM = cm.getTextArea().cloneNode(true);
       magnifiedStuff.appendChild(magnifiedCM);
       magnifiedCM =CodeMirror.fromTextArea(magnifiedCM,{mode: cm.getOption("mode"),
                                                         lineNumbers: cm.getOption("lineNumbers")});
       magnifyingGlass.style.display='block';
                                                     
      // move the magnifying glass to wherever it needs to be, updating the cursor on both CM instances
      // be sure the cursor is always visibile
      function updateMagnifier(e){
         e.preventDefault();
         e.stopPropagation();
         var coords = {x: e.touches[0].pageX, y: e.touches[0].pageY},
             cursor = cm.coordsChar(coords);
         cm.setCursor(cursor);
         magnifiedCM.setCursor(cursor);
         magnifiedStuff.getElementsByClassName("CodeMirror-cursor")[0].style.visibility = "visible";
         drawMagnifierAt(coords);
         cm.focus();
      }
     // ensure magnifier follows the touchmove event, but hold onto that unregistration handler!
     var unregister = CodeMirror.connect(scroller, "touchmove", updateMagnifier, true);
     // clean up the magnifier, and show the popup
     function switchToPopup(){
       magnifyingGlass.style.display='none';
       popupVisible = true;
       unregister();
       drawPopup();
     }
     // when the finger is lifted, hide the magnifier and cleanuo
     CodeMirror.connect(scroller, "touchend", switchToPopup);
     updateMagnifier(e);
    }
    
     var timer = null;
     function clearTimer(){window.clearTimeout(timer);}
     function restartTimer(e){
       popupVisible = false;
       e.stopPropagation();
       timer = window.setTimeout(function(){showMagnifier(e);},500);
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
       CodeMirror.connect(startSel,   "touchend",   updateSelection(true));
       CodeMirror.connect(endSel,     "touchend",   updateSelection(false));
                                                     
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