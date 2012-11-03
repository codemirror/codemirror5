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
         tool = document.createElement('div'),
         popup    = document.createElement('ul'),
         notch    = document.createElement('b');

     tool.id           = "tool";
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
     document.body.appendChild(tool);
     document.body.appendChild(startSel);
     document.body.appendChild(endSel);
     tool.appendChild(popup);
     tool.appendChild(magnifier);
     tool.appendChild(notch);

     function drawTool(e){
        var start       = cm.cursorCoords(true),
            end         = cm.cursorCoords(false),
            scrollInfo  = cm.getScrollInfo(),
            selected    = cm.somethingSelected(),
            bounds      = scroller.getBoundingClientRect(),
            popupX;
 
         function shown(x,y){
            return x>bounds.left && x<bounds.right &&
                   y>bounds.top  && y<bounds.bottom;
         }

         // place the dots at the right place, or hide them altogether
         function drawSelectionDots(){
           startSel.style.display=(selected && shown(start.x, start.y))? 'block' : 'none';
           endSel.style.display=(selected && shown(end.x, end.yBot))? 'block' : 'none';
           startSel.style.top  = start.y - 0.75*startSel.offsetHeight+ "px";
           startSel.style.left = start.x - 0.50*startSel.offsetWidth + "px";
           endSel.style.top    = end.yBot- 0.25*endSel.offsetHeight  + "px";
           endSel.style.left   = end.x   - 0.50*endSel.offsetWidth   + "px";
         }
        // draw the Magnifier and position the notch
        function drawMagnifier(){
           magnifier.className = !selected? "cursor" : "selection";
           magnifiedCM.scrollTo(scrollInfo.x, scrollInfo.y);
           tool.style.left = e.coords.x - tool.offsetWidth/2 + "px";
           tool.style.top  = e.coords.y - tool.offsetHeight  + "px";
           magnifiedStuff.style.top  = (-e.coords.y+wrapper.offsetTop+magnifier.offsetHeight/6)*magnifiedScale+"px";
           magnifiedStuff.style.left = (-e.coords.x+gutterWidth-scrollInfo.x-15)*magnifiedScale+magnifier.offsetWidth/2+"px";
           notch.style.left = -tool.offsetWidth/2 - 5 + 'px'; // shift left by half notchWidth
           notch.className ='above';
        }
        // draw the Popup and position the notch
        function drawPopup(){
           if(selected){
             popup.appendChild(cut);
             popup.appendChild(copy);
             popupX = (start.y===end.y)? start.x+(end.x-start.x)/2 : screen.availWidth/2;
           } else {
             popup.appendChild(select);
             popup.appendChild(selectAll);
             popupX = start.x;
           }
           if(clipboardText.length>0){ popup.appendChild(paste);}
           // Position the popup relative to selection, taking visible boundary into account
           // Try above, then below, then the middle of the screen
           notch.className ='above';
           if(start.y-tool.offsetHeight > window.pageYOffset){
             tool.style.top  = start.y - (tool.offsetHeight+10) + "px";
           } else if (end.yBot+tool.offsetHeight+10 < window.pageYOffset+screen.availHeight){
             notch.className='below';
             tool.style.top = end.yBot+10+"px";
           } else {
             tool.style.top  = window.pageYOffset + screen.availHeight/2 + "px";
           }
           // make sure the popup is never out of bounds, and position the triangle near cursor with CSS
           var hw = tool.offsetWidth;
           tool.style.left = Math.min(Math.max(0, popupX-hw/2), screen.availWidth-hw) + "px";
           notch.style.left  = Math.min(Math.max(15, popupX-tool.offsetLeft), hw-15)-hw-10+"px";
        }
        // position selectionDots, clear popup, and draw the appropriate tool
        drawSelectionDots();
        popup.innerHTML = null;
        tool.style.left = '0px';
        if(tool.className==="magnify"){ drawMagnifier(); }
        if(tool.className==="popup")  { drawPopup(); }
        cm.focus();
      }
     // Factory: capture the event, prevent default, execute f, and redraw the popup
     function popupFactory(f){return function(e){e.stopPropagation(); e.preventDefault(); f(e); drawTool(e);};}
     // Factory: return methods for changing CM start and end cursors, which also control magnifier display
     function updateCursors(mode){
       return function(e){
           // on touchEnd, show the popup and hide the magnifier
           tool.className = (e.type !== 'touchend')? "magnify" : "popup";
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
        tool.className = 'popup';
     }
     // set the clipboardText to whatever was selected, and hide the popup
     function copyHandler(){
        clipboardText = cm.getSelection();
        tool.className = '';
     }
     // replace selection with clipboardText, and hide the popup
     function pasteHandler(){
       var from= cm.coordsChar(cm.cursorCoords(true)),
           to  = cm.coordsChar(cm.cursorCoords(false));
       cm.replaceRange(clipboardText, from, to);
       tool.className = '';
     }
     // set the clipboardText to whatever was selected, delete the selection, and hide the popup
     function cutHandler(){
       clipboardText = cm.getSelection();
       var from= cm.coordsChar(cm.cursorCoords(true)),
           to  = cm.coordsChar(cm.cursorCoords(false));
       cm.replaceRange("", from, to);
       tool.className = '';
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
        tool.className = 'popup';
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
                                                                       tool.className = 'popup';
                                                                       popupFactory(updateCursors("both"))(e);
                                                                       unregisterMove(); unregisterEnd();
                                                                    },
                                               true);
       // update the cursor and magnifier position
       popupFactory(updateCursors("both"))(e);
     }
 
   /*****************************************************************************************
    *    Connect Event Handlers                                                           */
     var holdTimer = null;
     var recentTap = false;
     var LAST_TOUCH;
                                                     
     function moveHandler(e){
       window.clearTimeout(holdTimer);
       drawTool();
       LAST_TOUCH = e;
     }
     function endHandler(e){
       window.clearTimeout(holdTimer);
       // onTap: hide popup and corners, start timer for doubleTap
       function onTap(e){
         startSel.style.display=endSel.style.display='none';
         recentTap=window.setTimeout(function(){recentTap=false;},250);
         tool.className = '';
       }
       // onDoubleTap: initialize the magnifier, set the cursor to tap location and select
       function onDoubleTap(e){
         initializeMagnifier(e);
         updateCursors("both")(e);
         popupFactory(selectHandler)(e);
       }
       if(LAST_TOUCH.type === "touchstart"){
         if(recentTap){ onDoubleTap(e);} else {onTap(e);}
       }
       // make sure the popup returns if something is selected
       if(LAST_TOUCH.type === "touchmove" && cm.somethingSelected()){
          tool.className = 'popup';
          drawTool();
       }
       LAST_TOUCH = e;
     }
     // if the target node is a line's child (parent = PRE), start the holdTimer
    function startHandler(e){
       if(e.target.nodeName === "LI"){return;}
       tool.className = '';
       holdTimer = window.setTimeout(function(){magnifyCursor(e);},250);
       LAST_TOUCH = e;
     }

     CodeMirror.connect(scroller,   "touchstart", startHandler);
     CodeMirror.connect(scroller,   "touchmove",  moveHandler);
     CodeMirror.connect(scroller,   "touchend",   endHandler);
                                                    
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
     cm.setOption("onChange", function(e){tool.className=''; drawTool(e);});
 }

 CodeMirror.defineInitHook(function(cm){iOSpopup(cm);});
})();