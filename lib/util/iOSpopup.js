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
         hoverElt = document.createElement('div'),
         popup    = document.createElement('ul'),
         notch    = document.createElement('b');

     hoverElt.id       = "hoverElt";
     popup.id          = "iOSpopup";
     notch.id          = "notch"
     selectAll.innerHTML="Select All";
     select.innerHTML  = "Select";
     paste.innerHTML   = "Paste";
     copy.innerHTML    = "Copy";
     cut.innerHTML     = "Cut";
     startSel.className=endSel.className = "selectionDot";
     startSel.appendChild(startDot);
     endSel.appendChild(endDot);
 
     // MAGNIFIER NODES
     var magnifier = document.createElement('div'),
         magnifiedStuff  = document.createElement('div'),
         magnifiedScale = 1.5,
         magnifiedCM;
     magnifier.id = "magnifier";
     magnifiedStuff.style.webkitTransform = "scale("+magnifiedScale+")";
     magnifiedStuff.className = "magnifiedStuff";
     magnifiedStuff.style.width = wrapper.style.width;
     magnifiedStuff.style.height = wrapper.style.height;
     magnifier.appendChild(magnifiedStuff);
 
     // add nodes to the CM DOM, shift the input element so it's out of the way
     var lines = document.getElementsByClassName('CodeMirror-lines')[0].firstChild;
     document.body.appendChild(hoverElt);
     lines.appendChild(startSel);
     lines.appendChild(endSel);
     hoverElt.appendChild(popup);
     hoverElt.appendChild(magnifier);
     hoverElt.appendChild(notch);
     cm.getInputField().style.left = '-1000px';
 
     function drawPopup(e){
        // get frequently used variables, and set display of popup and selection corners
        var startCursor = cm.cursorCoords(true),
            endCursor   = cm.cursorCoords(false),
            scrollInfo  = cm.getScrollInfo(),
            selected    = cm.somethingSelected(),
            selectDivs  = document.getElementsByClassName('CodeMirror-selected'),
            popupX;
        // position selectionDots and clear popup
        startSel.style.display=endSel.style.display = selected? 'block' : 'none';
        startSel.style.top  = cm.cursorCoords(true,  "local").y   - 0.75*startSel.offsetHeight+ "px";
        startSel.style.left = cm.cursorCoords(true,  "local").x   - 0.50*startSel.offsetWidth + "px";
        endSel.style.top    = cm.cursorCoords(false, "local").yBot- 0.25*endSel.offsetHeight  + "px";
        endSel.style.left   = cm.cursorCoords(false, "local").x   - 0.50*endSel.offsetWidth   + "px";
        popup.innerHTML = null;
 
        // draw the magnifying glass at (coords.x, coords.y), which are set in updateCursors()
        if(hoverElt.className==="magnify"){
           // generate magnifier at the right place, either as a cursor or selection shape
           magnifier.className = !selected? "cursor" : "selection";
           magnifiedCM.scrollTo(scrollInfo.x, scrollInfo.y);
           hoverElt.style.left = e.coords.x - hoverElt.offsetWidth/2 + "px";
           hoverElt.style.top  = e.coords.y - hoverElt.offsetHeight  + "px";
           magnifiedStuff.style.top  = (-e.coords.y+wrapper.offsetTop+magnifier.offsetHeight/6)*magnifiedScale+"px";
           magnifiedStuff.style.left = (-e.coords.x+gutterWidth-scrollInfo.x-15)*magnifiedScale+magnifier.offsetWidth/2+"px";
           notch.style.left = -hoverElt.offsetWidth/2 - 5 + 'px'; // shift left by half notchWidth
           notch.className ='above';
        }
        // Fill the popup and move selection corners based on selection
        if(hoverElt.className==="popup"){
          if(selected){
             popup.appendChild(cut);
             popup.appendChild(copy);
             if(startCursor.y === endCursor.y){popupX=startCursor.x+(endCursor.x-startCursor.x)/2;}
             else{popupX = scrollInfo.x+screen.availWidth/2;}
           } else {
             popup.appendChild(select);
             popup.appendChild(selectAll);
             popupX = startCursor.x;
           }
          if(clipboardText.length>0){ popup.appendChild(paste);}
          // Position the popup relative to selection, taking visible boundary into account
          // Try above, then below, then the middle of the screen
          notch.className ='above';
          if((startCursor.y - (hoverElt.offsetHeight)) > scrollInfo.y){
            hoverElt.style.top  = startCursor.y - (hoverElt.offsetHeight+10) + "px";
          } else if (endCursor.yBot+hoverElt.offsetHeight+10 < scrollInfo.y+scroller.offsetHeight){
            notch.className='below';
            hoverElt.style.top = endCursor.yBot+10+"px";
          } else {
            hoverElt.style.top  = scrollInfo.y + (scroller.offsetHeight/2) + "px";
          }
          // make sure the popup is never out of bounds, and position the triangle near cursor with CSS
          var leftEdge = scrollInfo.x - gutterWidth,
              rightEdge = (wrapper.offsetWidth+scrollInfo.x)-(gutterWidth+hoverElt.offsetWidth+wrapper.offsetLeft);
          hoverElt.style.left = Math.min(rightEdge, Math.max(0, popupX-hoverElt.offsetWidth/2, leftEdge)) + "px";
          var notchLeft = Math.min(Math.max(15, popupX-hoverElt.offsetLeft), hoverElt.offsetWidth)-hoverElt.offsetWidth;
          notch.style.left = notchLeft-5 + 'px'; // shift left by half notchWidth
        }
        cm.focus();
      }
     // Factory: capture the event, prevent default, execute f, and redraw the popup
     function popupFactory(f){return function(e){e.stopPropagation(); e.preventDefault(); f(e); drawPopup(e);};}
     // Factory: return methods for changing CM start and end cursors, which also control magnifier display
     function updateCursors(mode){
       return function(e){
           // on touchEnd, show the popup and hide the magnifier
           hoverElt.className = (e.type !== 'touchend')? "magnify" : "popup";
           var adjustY  = (mode!=="end")? startSel.firstChild.offsetHeight : -endSel.firstChild.offsetHeight;
           e.coords   = {x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY+(mode==="both"? 0 : adjustY)};
           var startPos = (mode!=="end")?   cm.coordsChar(e.coords) : cm.getCursor(true),
              endPos   = (mode!=="start")? cm.coordsChar(e.coords) : cm.getCursor(false),
              oldScroll= cm.getScrollInfo();
           // if the cursor positions are valid, update it and the magnifier, and check to see if we should scroll the editor
           if(mode==="both" || startPos.line<endPos.line || (startPos.line===endPos.line && startPos.ch<endPos.ch)){
              cm.setSelection(startPos, endPos);
              if(magnifiedCM){magnifiedCM.setSelection(startPos, endPos);}
              cm.scrollIntoView((mode!=="end"? startPos : endPos));
             }
          };
     }
     // draw selection for entire editor
     function selectAllHandler(e){
        cm.setSelection({line: 0, ch: 0}, {line: cm.lineCount() - 1});
        hoverElt.className = 'popup';
     }
     // set the clipboardText to whatever was selected, and hide the popup
     function copyHandler(){
        clipboardText = cm.getSelection();
        hoverElt.className = '';
     }
     // replace selection with clipboardText, and hide the popup
     function pasteHandler(){
       var from= cm.coordsChar(cm.cursorCoords(true)),
           to  = cm.coordsChar(cm.cursorCoords(false));
       cm.replaceRange(clipboardText, from, to);
       hoverElt.className = '';
     }
     // set the clipboardText to whatever was selected, delete the selection, and hide the popup
     function cutHandler(){
       clipboardText = cm.getSelection();
       var from= cm.coordsChar(cm.cursorCoords(true)),
           to  = cm.coordsChar(cm.cursorCoords(false));
       cm.replaceRange("", from, to);
       hoverElt.className = '';
     }
     // draw selection around the current word
     function selectHandler(){
        var start=0, end=0, i=0,
            cursor = cm.getCursor(),
            words  = cm.getLine(cursor.line).split(/[\s+\(\)\"\']/);
        for(i=0; i < words.length; i++){
          start = end;
          end+=words[i].length+1;
          if (end>cursor.ch){ break;}
        }
        // if we've got something to select, select it!
        if(start < end-1){
           cm.setSelection({line: cursor.line, ch: start}, {line: cursor.line, ch: end-1});
        // there's only whitespace after the cursor. Step backwards if the line has text, and try selection again
        } else if(start > 0){
          cm.setCursor({line: cursor.line, ch: start-1});
          return selectHandler();
        // we're on an empty line. Walk forwards until we find a non-empty line, then select starting whitespace
        } else {
          var endLine = cursor.line;
          while(endLine<cm.lineCount() && cm.getLine(endLine).length===0){ endLine++;}
          var endCh = cm.getLine(endLine).split(/\S/)[0].length;
          cm.setSelection({line: cursor.line, ch: start}, {line: endLine, ch: endCh});
        }
        hoverElt.className = 'popup';
     }
     // empty the magnifier, set it to a new clone of the editor, and fake it as "focused"
     function initializeMagnifier(e){
       cm.save();
       magnifiedStuff.innerHTML = "";
       magnifiedCM = cm.getTextArea().cloneNode(true);
       magnifiedCM.value = cm.getTextArea().value;
       magnifiedStuff.appendChild(magnifiedCM);
       magnifiedCM = CodeMirror.fromTextArea(magnifiedCM,{mode: "scheme", lineNumbers: cm.getOption("lineNumbers")});
       magnifiedCM.getScrollerElement().className = scroller.className + " CodeMirror-focused";
     }
     function magnifyCursor(e){
      initializeMagnifier(e);
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
         startSel.style.display=endSel.style.display='none';
         hoverElt.className = '';
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
         if(recentTap){ onDoubleTap(e);} else {onTap(e);}
       }
       LAST_TOUCH = e;
       popupFactory(updateCursors("both"));
     }
     // if the target node is a line's child (parent = PRE), start the holdTimer
    function startHandler(e){
       if(e.target.nodeName === "LI"){return;}
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
                                                   
     CodeMirror.connect(select,     "touchend",   popupFactory(selectHandler));
     CodeMirror.connect(selectAll,  "touchend",   popupFactory(selectAllHandler));
     CodeMirror.connect(cut,        "touchend",   popupFactory(cutHandler));
     CodeMirror.connect(copy,       "touchend",   popupFactory(copyHandler));
     CodeMirror.connect(paste,      "touchend",   popupFactory(pasteHandler));
     cm.setOption("onChange", function(e){hoverElt.className=''; drawPopup(e);});
  }
 CodeMirror.defineInitHook(function(cm){iOSpopup(cm);});
})();