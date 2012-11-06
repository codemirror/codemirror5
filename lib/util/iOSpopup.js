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
     function elt(tag, content, id, className) {
       var e = document.createElement(tag);
       if (className) e.className = className;
       if (id) e.id = id;
       if (typeof content == "string") e.innerHTML=content;
       else if (content) for (var i = 0; i < content.length; ++i) e.appendChild(content[i]);
       return e;
     }
     var selectAll= elt('li', "Select All"),
         select   = elt('li', "Select"),
         paste    = elt('li', "Paste"),
         copy     = elt('li', "Copy"),
         cut      = elt('li', "Cut"),
         startSel = elt('span',[elt('span')],'start','selectionDotTouchTarget'),
         endSel   = elt('span',[elt('span')],'end','selectionDotTouchTarget'),
         popup    = elt('ul',null,'iOSpopup'),
         magnifiedStuff = elt('div',null,null,'magnifiedStuff'),
         magnifier= elt('div',[magnifiedStuff],'magnifier'),
         notch    = elt('b',null,'notch','above'),
         tool     = elt('div',[popup,magnifier,notch],'tool');
     var magnifiedScale = 1.5, magnifiedCM;
     magnifiedStuff.style.webkitTransform = "scale("+magnifiedScale+")";
     magnifiedStuff.style.width = wrapper.style.width;
     magnifiedStuff.style.height = wrapper.style.height;
     // Make sure there's only one set of tool nodes on the page
     if(!document.getElementById('tool')){
       document.body.appendChild(tool);
       document.body.appendChild(startSel);
       document.body.appendChild(endSel);
     }
 
     function drawTool(e){
        var start       = cm.cursorCoords(true),
            end         = cm.cursorCoords(false),
            scrollInfo  = cm.getScrollInfo(),
            selected    = cm.somethingSelected(),
            bounds      = scroller.getBoundingClientRect(),
            popupX;
         function shown(x,y){ return x>bounds.left && x<bounds.right &&
                                    y>bounds.top  && y<bounds.bottom;}
         // place the dots at the right place, or hide them altogether
         function drawSelectionDots(e){
           startSel.style.display=(selected && shown(start.x, start.y))? 'block' : 'none';
           endSel.style.display=(selected && shown(end.x, end.yBot))? 'block' : 'none';
           startSel.style.top  = start.y  + "px";
           startSel.style.left = start.x  + "px";
           endSel.style.top    = end.yBot + "px";
           endSel.style.left   = end.x    + "px";
         }
        // draw the Magnifier and position the notch
        function drawMagnifier(e){
           magnifier.className = !selected? "circle" : "rectangle";
           magnifiedCM.scrollTo(scrollInfo.x, scrollInfo.y);
           tool.style.left = e.coords.x - tool.offsetWidth/2 + "px";
           tool.style.top  = e.coords.y - tool.offsetHeight  + "px";
           magnifiedStuff.style.top  = (-e.coords.y+wrapper.offsetTop+magnifier.offsetHeight/6)*magnifiedScale+"px";
           magnifiedStuff.style.left = (-e.coords.x+gutterWidth-scrollInfo.x-15)*magnifiedScale+magnifier.offsetWidth/2+"px";
           notch.style.left = -tool.offsetWidth/2 - 10 + 'px'; // shift left by half notchWidth
           notch.className ='above';
        }
        // draw the Popup and position the notch
        function drawPopup(e){
           if(selected){
             popup.appendChild(cut);
             popup.appendChild(copy);
             popupX = (start.y===end.y)? start.x+(end.x-start.x)/2 : scroller.offsetLeft+(wrapper.offsetWidth-scroller.offsetLeft)/2;
           } else {
             popup.appendChild(select);
             popup.appendChild(selectAll);
             popupX = start.x;
           }
           if(clipboardText.length>0){ popup.appendChild(paste);}
           // Assume the popup is centered onscreen, pointing down. Then check edge cases.
           notch.className ='above';
           tool.style.top  = wrapper.offsetTop + wrapper.offsetHeight/2 + "px";
           if(start.y > wrapper.offsetTop && start.y-tool.offsetHeight > window.pageYOffset){
             tool.style.top  = start.y - (tool.offsetHeight+10) + "px";
           } else if (end.yBot+tool.offsetHeight+10 < wrapper.offsetTop+wrapper.offsetHeight){
             notch.className='below';
             tool.style.top = end.yBot+10+"px";
           }
           // make sure the popup is never out of bounds, and position the triangle near cursor with CSS
           var tw = tool.offsetWidth;
           tool.style.left = Math.min(Math.max(0, popupX-tw/2), screen.availWidth-tw) + "px";
           notch.style.left  = Math.min(Math.max(15, popupX-tool.offsetLeft), tw-15)-tw-10+"px";
        }
        // position selectionDots, clear popup, and draw the appropriate tool
        drawSelectionDots(e);

        popup.innerHTML = null;
        tool.style.left = '0px';
        if(tool.className==="magnify"){ drawMagnifier(e); }
        if(tool.className==="popup")  { drawPopup(e); }
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
//           if(tool.className==="magnify" && mode !== "both") e.coords = cm.cursorCoords(mode==="start");
           var startPos = (mode!=="end")?   cm.coordsChar(e.coords) : cm.getCursor(true),
               endPos   = (mode!=="start")? cm.coordsChar(e.coords) : cm.getCursor(false);
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
       magnifiedCM = CodeMirror.fromTextArea(magnifiedCM,{mode: cm.getOption("mode"), lineNumbers: cm.getOption("lineNumbers")});
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
          drawTool(e);
       }
       LAST_TOUCH = e;
     }
     // if the target node is a line's child (parent = PRE), start the holdTimer
    function startHandler(e){
//      cm.getInputField().style.left = e.changedTouches[0].pageX + 20 + "px";
//       cm.getInputField().style.top = e.changedTouches[0].pageY + 20 + "px";
       console.log(cm.getInputField().style.left);
       if(e.target.nodeName === "LI"){return;}
       tool.className = '';
       holdTimer = window.setTimeout(function(){magnifyCursor(e);},250);
       LAST_TOUCH = e;
     }

     CodeMirror.connect(scroller,   "touchstart", startHandler);
     CodeMirror.connect(scroller,   "touchmove",  moveHandler);
     CodeMirror.connect(scroller,   "touchend",   endHandler);
     CodeMirror.connect(scroller,   "scroll",     drawTool);
                                                    
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
     CodeMirror.connect(cm.getInputField(), "focus", function(e){e.preventDefault();});
 }

 CodeMirror.defineInitHook(function(cm){iOSpopup(cm);});
})();