/*global CodeMirror, that */
/*jslint plusplus: true, browser: true, vars: true */

/*
 iOS CodeMirror Support (C) 2012 Emmanuel Schanzer
 */
(function(){
// "use strict";
  function iOSpopup(cm) {
    if(!(navigator.userAgent.match(/iPod/i) ||
         navigator.userAgent.match(/iPad/i) ||
         navigator.userAgent.match(/iPhone/i))){ return false;}
     var clipboardText = "",
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
        // get frequently used variables, and set display of popup and selection corners
        var startCursor = cm.cursorCoords(true, "local"),
            endCursor   = cm.cursorCoords(false, "local"),
            scrollInfo  = cm.getScrollInfo(),
            selected    = cm.somethingSelected(),
            popupX;
        popup.innerHTML = null;
        startSel.style.display=endSel.style.display = selected? 'block' : 'none';
        // draw the magnifying glass at (coords.x, coords.y), which are set in updateCursors()
        if(e.type && e.type !== "touchend" && e.type !== "click" && magnifiedCM){
           // generate magnifier at the right place, either as a cursor or selection shape
           magnifier.className = "magnifying "+(!selected? "cursor" : "selection");
           magnifiedCM.scrollTo(scrollInfo.x, scrollInfo.y);
           magnifier.style.top = e.coords.y - Math.max(magnifier.offsetHeight, 60) + "px";
           magnifier.style.left= e.coords.x - magnifier.offsetWidth/2 + "px";
           magnifiedStuff.style.top  = (-e.coords.y+wrapper.offsetTop+magnifier.offsetHeight/6)*magnifiedScale+"px";
           magnifiedStuff.style.left = (-e.coords.x+gutterWidth-scrollInfo.x-15)*magnifiedScale+magnifier.offsetWidth/2+"px";
        }
        // Fill the popup and move selection corners based on selection
        if(selected){
           popup.appendChild(cut);
           popup.appendChild(copy);
           if(clipboardText.length>0){ popup.appendChild(paste);}
           if(startCursor.y === endCursor.y){popupX=startCursor.x+(endCursor.x-startCursor.x)/2;}
           else{popupX = scrollInfo.x+screen.availWidth/2;}
           startSel.style.top  = startCursor.y - 0.75*startSel.offsetHeight+ "px";
           startSel.style.left = startCursor.x - 0.50*startSel.offsetWidth + "px";
           endSel.style.top    = endCursor.yBot- 0.25*endSel.offsetHeight  + "px";
           endSel.style.left   = endCursor.x   - 0.50*endSel.offsetWidth   + "px";
         } else {
           popup.appendChild(select);
           popup.appendChild(selectAll);
           if(clipboardText.length>0){ popup.appendChild(paste);}
           popupX = startCursor.x;
         }
        // Position the popup relative to selection, taking visible boundary into account
        // Try above, then below, then the middle of the screen
        popup.className = 'aboveEdge';
        if((startCursor.y - (popup.offsetHeight+10)) > scrollInfo.y){
          popup.style.top  = startCursor.y - (popup.offsetHeight+10) + "px";
        } else if (endCursor.yBot+popup.offsetHeight+10 < scrollInfo.y+scroller.offsetHeight){
          popup.className = 'belowEdge';
          popup.style.top = endCursor.yBot+20+"px";
        } else {
          popup.style.top  = scrollInfo.y + (scroller.offsetHeight/2) + "px";
        }

        // make sure the popup is never out of bounds, and position the triangle near cursor with CSS
        var triangleLeft ='50%',
            leftEdge = scrollInfo.x - gutterWidth,
            rightEdge = (wrapper.offsetWidth+scrollInfo.x)-(gutterWidth+popup.offsetWidth+wrapper.offsetLeft);
        popup.style.left = Math.min(rightEdge, Math.max(0, popupX-popup.offsetWidth/2, leftEdge)) + "px";
        triangleLeft = Math.min(Math.max(15, popupX-popup.offsetLeft), popup.offsetWidth-20);
        // remove the triangleStyle (if it exists), and replace it with a new one
        var triangleStyle = document.getElementById('triangleStyle');
        if(triangleStyle){ triangleStyle.parentNode.removeChild(triangleStyle);}
        triangleStyle    = document.createElement('style');
        triangleStyle.appendChild(document.createTextNode('#iOSpopup  li:last-child:after{left: '+triangleLeft+'px;'));
        triangleStyle.id = 'triangleStyle';
        document.getElementsByTagName('head')[0].appendChild(triangleStyle);

        cm.focus();
      }
 
     // Factory: capture the event, prevent default, execute f, and redraw the popup
     function popupFactory(f){return function(e){e.stopPropagation(); e.preventDefault(); f(e); drawPopup(e);};}

     // Factory: return methods for changing CM start and end cursors, which also control magnifier display
     function updateCursors(mode){
       return function(e){
           // on touchEnd, show the popup and hide the magnifier
           popup.style.display = (e.type === 'touchend')? "block" : "none";
           magnifier.style.display = (e.type === 'touchend')? "none" : "block";
           var adjustY  = (mode!=="end")? startSel.firstChild.offsetHeight : -endSel.firstChild.offsetHeight;
           e.coords   = {x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY+(mode==="both"? 0 : adjustY)};
           var startPos = (mode!=="end")?   cm.coordsChar(e.coords) : cm.getCursor(true),
              endPos   = (mode!=="start")? cm.coordsChar(e.coords) : cm.getCursor(false),
              oldScroll= cm.getScrollInfo();
           // if the cursor positions are valid, update it and the magnifier, and check to see if we should scroll the editor
           if(mode==="both" || startPos.line<endPos.line || (startPos.line===endPos.line && startPos.ch<endPos.ch)){
              cm.setSelection(startPos, endPos);
              if(magnifiedCM) magnifiedCM.setSelection(startPos, endPos);
              cm.scrollIntoView((mode!=="end"? startPos : endPos));
             }
           if(mode!=="both"){e.coords.y   = cm.cursorCoords(mode!=="end", "page").y;}
          };
     }
 
     // draw selection for entire editor
     function selectAllHandler(e){
        cm.setSelection({line: 0, ch: 0}, {line: cm.lineCount() - 1}); popup.style.display = "block";
  }
     // set the clipboardText to whatever was selected, and hide the popup
     function copyHandler(){ clipboardText = cm.getSelection(); popup.style.display = "none"; }
     // replace selection with clipboardText, and hide the popup
     function pasteHandler(){
       var from= cm.coordsChar(cm.cursorCoords(true)),
           to  = cm.coordsChar(cm.cursorCoords(false));
       cm.replaceRange(clipboardText, from, to);
       popup.style.display = "none";
     }
     // set the clipboardText to whatever was selected, delete the selection, and hide the popup
     function cutHandler(){
       clipboardText = cm.getSelection();
       var from= cm.coordsChar(cm.cursorCoords(true)),
           to  = cm.coordsChar(cm.cursorCoords(false));
       cm.replaceRange("", from, to);
       popup.style.display = "none";
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
        popup.style.display = "block";
    }
              
     // empty the magnifier, set it to a new clone of the editor, and fake it as "focused"
     function initializeMagnifier(){
       cm.save();
       magnifiedStuff.innerHTML = "";
       magnifiedCM = cm.getTextArea().cloneNode(true);
       magnifiedCM.value = cm.getTextArea().value;
       magnifiedStuff.appendChild(magnifiedCM);
       magnifiedCM = CodeMirror.fromTextArea(magnifiedCM,{mode: "scheme", lineNumbers: cm.getOption("lineNumbers")});
       magnifiedCM.getScrollerElement().className = cm.getScrollerElement().className + " CodeMirror-focused";
     }
     function magnifyCursor(e){
       initializeMagnifier();
       // set touchMove and touchEnd events, which are cleaned up on touchEnd
       var unregisterMove = CodeMirror.connect(scroller, "touchmove", popupFactory(updateCursors("both")), true),
           unregisterEnd  = CodeMirror.connect(scroller, "touchend", function(e){
                                                                      unregisterMove(); unregisterEnd();
                                                                      popupFactory(updateCursors("both"))(e);},
                                               true);
       // update the cursor and magnifier position 
       popupFactory(updateCursors("both"))(e);
     }

   /*****************************************************************************************
    *    Connect Event Handlers                                                           */
     var holdTimer = null;
     var recentTap = false;
     var LAST_TOUCH;

     function moveOrEndHandler(e){
       window.clearTimeout(holdTimer);
       // onTap: hide popup and corners, start timer for doubleTap
       function onTap(e){
         popup.style.display=startSel.style.display=endSel.style.display='none';
         recentTap=window.setTimeout(function(){recentTap=false;},250);
       }
       // onDoubleTap: initialize the magnifier, set the cursor to tap location and select
       function onDoubleTap(e){
         initializeMagnifier(e);
         updateCursors("both")(e);
         popupFactory(selectHandler)(e);
       }
       // clear holdTimer, and check for Tap and DoubleTap
       if(LAST_TOUCH.type === "touchstart" && e.type === "touchend"){
         recentTap? onDoubleTap(e) : onTap(e);
       }
       LAST_TOUCH = e;
     }
     // if the target node is a line's child (parent = PRE), start the holdTimer
     function startHandler(e){
       if(e.target.parentNode.nodeName !== "PRE") return;
       holdTimer = window.setTimeout(function(){magnifyCursor(e);},500);
       LAST_TOUCH = e;
     }
                                                     
     CodeMirror.connect(scroller,   "touchstart", startHandler);
     CodeMirror.connect(scroller,   "touchmove",  moveOrEndHandler);
     CodeMirror.connect(scroller,   "touchend",   moveOrEndHandler);
                                                     
     CodeMirror.connect(startSel,   "touchstart", popupFactory(updateCursors("start")));
     CodeMirror.connect(endSel,     "touchstart", popupFactory(updateCursors("end")));
     CodeMirror.connect(startSel,   "touchmove",  popupFactory(updateCursors("start")));
     CodeMirror.connect(endSel,     "touchmove",  popupFactory(updateCursors("end")));
     CodeMirror.connect(startSel,   "touchend",   popupFactory(updateCursors("start")));
     CodeMirror.connect(endSel,     "touchend",   popupFactory(updateCursors("end")));
                                                   
     CodeMirror.connect(select,     "click",   popupFactory(selectHandler));
     CodeMirror.connect(selectAll,  "click",   popupFactory(selectAllHandler));
     CodeMirror.connect(cut,        "click",   popupFactory(cutHandler));
     CodeMirror.connect(copy,       "click",   popupFactory(copyHandler));
     CodeMirror.connect(paste,      "click",   popupFactory(pasteHandler));
     cm.setOption("onChange", function(e){popup.style.display = "none"; drawPopup(e);});
  }
 CodeMirror.defineInitHook(function(cm){iOSpopup(cm);});
})();