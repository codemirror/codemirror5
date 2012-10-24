/*global CodeMirror, that */
/*jslint plusplus: true, browser: true, vars: true */
(function(){
// "use strict";
  function iOSpopup(cm) {
    if(!(navigator.userAgent.match(/iPod/i) ||
         navigator.userAgent.match(/iPad/i) ||
         navigator.userAgent.match(/iPhone/i))) return false;
     var popupVisible = false,
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
     var magnifier = document.createElement('div'),
         magnifiedStuff  = document.createElement('div'),
         magnifiedScale = 1.5,
         magnifiedCM;
     magnifier.className = "magnifying selection";
     magnifiedStuff.style.webkitTransform = "scale("+magnifiedScale+")";
     magnifiedStuff.className = "magnifiedStuff";
     magnifiedStuff.style.width = wrapper.style.width;
     magnifiedStuff.style.height = wrapper.style.height;
     magnifier.appendChild(magnifiedStuff);
 
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
     document.body.appendChild(magnifier);
     cm.getInputField().style.left = '-1000px';

     function drawPopup(e){
        var startCursor = cm.cursorCoords(true, "local"),
            endCursor   = cm.cursorCoords(false, "local"),
            scrollInfo  = cm.getScrollInfo(),
            popupX;
 
        // draw the magnifying glass at (coords.x, coords.y), which are set in updateCursors()
        if(e.type && e.type !== "touchend" && e.type !== "click"){
           // generate magnifier at the right place, either as a cursor or selection shape
           magnifier.className = "magnifying "+(!cm.somethingSelected()? "cursor" : "selection");
           magnifiedCM.scrollTo(scrollInfo.x, scrollInfo.y);
           magnifier.style.top = e.coords.y - Math.max(magnifier.offsetHeight, 60) + "px";
           magnifier.style.left= e.coords.x - magnifier.offsetWidth/2 + "px";
           magnifiedStuff.style.top  = (-e.coords.y+wrapper.offsetTop+magnifier.offsetHeight/4)*magnifiedScale+"px";
           magnifiedStuff.style.left = (-e.coords.x+gutterWidth-scrollInfo.x-15)*magnifiedScale+magnifier.offsetWidth/2+"px";
        }
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
        // 1c) if not, stick it in the both of the screen
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
 
 
     // Factory: capture the event, prevent default, execute f, and redraw the popup
 function popupFactory(f){return function(e){ e.preventDefault(); f(e); drawPopup(e);};}

     // Factory: return methods for changing CM start and end cursors, which also control magnifier display
     function updateCursors(mode){
       return function(e){
           // on touchEnd, show the popup and hide the magnifier
           popupVisible = (e.type === 'touchend');
           magnifier.style.display = (e.type === 'touchend')? "none" : "block";
              if(e.touches.length !== 1){ drawPopup(e); return;}
              var adjustY  = (mode!=="end")? startSel.firstChild.offsetHeight : -endSel.firstChild.offsetHeight;
              e.coords   = {x: e.touches[0].pageX, y: e.touches[0].pageY+(mode==="both"? 0 : adjustY)};
              var startPos = (mode!=="end")?   cm.coordsChar(e.coords) : cm.getCursor(true),
                  endPos   = (mode!=="start")? cm.coordsChar(e.coords) : cm.getCursor(false),
                  scrollInfo = cm.getScrollInfo();
           // if the cursor positions are valid, update it and the magnifier, and check to see if we should scroll the editor
           if(mode==="both" || startPos.line<endPos.line || (startPos.line===endPos.line && startPos.ch<endPos.ch)){
              cm.setSelection(startPos, endPos);
              magnifiedCM.setSelection(startPos, endPos);
              // see if we need to scroll the editor
              if((mode!=="end")){cm.scrollTo(null, Math.min(cm.cursorCoords(true, "local").y, scrollInfo.y));}
              if((mode!=="end")){cm.scrollTo(Math.min(cm.cursorCoords(true, "local").x, scrollInfo.x), null);}
             }
          };
     }
 
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
              
      //empty the magnifier, set it to a new clone of the editor, and fake it as "focused"
     function magnifyCursor(e){
       while (magnifiedStuff.firstChild){magnifiedStuff.removeChild(magnifiedStuff.firstChild);}
       cm.save();
       magnifiedCM = cm.getTextArea().cloneNode(true);
       magnifiedCM.value = cm.getTextArea().value;
       magnifiedStuff.appendChild(magnifiedCM);
       magnifiedCM = CodeMirror.fromTextArea(magnifiedCM,{mode: "scheme", lineNumbers: cm.getOption("lineNumbers")});
       magnifiedCM.getScrollerElement().className = cm.getScrollerElement().className + " CodeMirror-focused";
       // set touchMove and touchEnd events, which are cleaned up on touchEnd
       var unregisterMove = CodeMirror.connect(scroller, "touchmove", popupFactory(updateCursors("both")), true),
           unregisterEnd  = CodeMirror.connect(scroller, "touchend", function(e){
                                                                      unregisterMove(); unregisterEnd();
                                                                      updateCursors("both")(e);},
                                               true);
       // update the cursor and magnifier position 
       popupFactory(updateCursors("both"))(e);
     }

   /*****************************************************************************************
    *    Connect Event Handlers                                                           */
     var timer = null;
     function clearTimer(){window.clearTimeout(timer);}
     function setTimer(e){
        timer = window.setTimeout(function(){magnifyCursor(e);},500);
     }

     CodeMirror.connect(scroller,   "touchstart", setTimer);
     CodeMirror.connect(scroller,   "touchmove",  clearTimer);
     CodeMirror.connect(scroller,   "touchend",   clearTimer);
     CodeMirror.connect(scroller,   "click",      function(e){popupVisible=false; setTimeout(function(){drawPopup(e)}, 500);});
                                                     
     CodeMirror.connect(startSel,   "touchstart", popupFactory(updateCursors("start")));
     CodeMirror.connect(endSel,     "touchstart", popupFactory(updateCursors("end")));
     CodeMirror.connect(startSel,   "touchmove",  popupFactory(updateCursors("start")));
     CodeMirror.connect(endSel,     "touchmove",  popupFactory(updateCursors("end")));
     CodeMirror.connect(startSel,   "touchend",   popupFactory(updateCursors("start")));
     CodeMirror.connect(endSel,     "touchend",   popupFactory(updateCursors("end")));
                                                   
     CodeMirror.connect(select,     "touchend",   popupFactory(selectHandler));
     CodeMirror.connect(selectAll,  "touchend",   popupFactory(selectAllHandler));
     CodeMirror.connect(cut,        "touchend",   popupFactory(cutHandler));
     CodeMirror.connect(copy,       "touchend",   popupFactory(copyHandler));
     CodeMirror.connect(paste,      "touchend",   popupFactory(pasteHandler));
     cm.setOption("onChange", function(e){popupVisible = false; drawPopup(e);});
  }
 CodeMirror.defineInitHook(function(cm){iOSpopup(cm);});
})();