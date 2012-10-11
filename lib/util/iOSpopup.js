/*global CodeMirror, that */
/*jslint plusplus: true, browser: true, vars: true */
(function(){
// "use strict";
  function iOSpopup(cm) {
     that = this;
     this.iPhone  = (navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i));
     this.iPad    = (navigator.userAgent.match(/iPad/i));
     this.cm = cm;
     // POPUP NODES
     this.popup = document.createElement('ul');
     this.popup.id = "iOSpopup";
     this.selectAll=document.createElement('li');
     this.select  = document.createElement('li');
     this.paste   = document.createElement('li');
     this.copy    = document.createElement('li');
     this.cut     = document.createElement('li');
     this.selectAll.innerHTML="Select All";
     this.select.innerHTML  = "Select";
     this.paste.innerHTML   = "Paste";
     this.copy.innerHTML    = "Copy";
     this.cut.innerHTML     = "Cut";
     this.startSel        = document.createElement('span');
     this.endSel          = document.createElement('span');
     this.startSel.className  = 'selectionDot';
     this.endSel.className    = 'selectionDot';
     var lines = document.getElementsByClassName('CodeMirror-lines')[0].firstChild;
     lines.appendChild(this.popup);
     lines.appendChild(this.startSel);
     lines.appendChild(this.endSel);

   /*****************************************************************************************
    *    Connect Event Handlers                                                           */
    if(this.iPad || this.iPhone){
      this.connectPopupEvents();
    }
  }
 
  iOSpopup.prototype = {
    popupVisible: false,
    clipboardText: "",
    timer: null,
 
    drawPopup : function(){
      var popup     = that.popup,
          startSel  = that.startSel,
          endSel    = that.endSel,
          cm        = that.cm,
          startCursor=cm.cursorCoords(true, "local"),
          endCursor = cm.cursorCoords(false, "local"),
          cmWidth   = cm.getWrapperElement().offsetWidth,
          scrollInfo   = cm.getScrollInfo(),
          gutterWidth=cm.getGutterElement().offsetWidth;
 
      // empty the popup and set display values of all relevant nodes
      popup.innerHTML = null;
      popup.style.display     = that.popupVisible? 'block' : 'none';
      startSel.style.display  = cm.somethingSelected()? 'block' : 'none';
      endSel.style.display    = cm.somethingSelected()? 'block' : 'none';
 
      // If the popup is the result of a longPress, fill it accordingly
      if(that.popupVisible && !cm.somethingSelected()){
        popup.appendChild(that.select);
        popup.appendChild(that.selectAll);
        if(that.clipboardText.length>0){ popup.appendChild(that.paste);}
        var popupX = startCursor.x;
 
      // If something is selected, fill the popup accordingly, and move the input field
      // somewhere offscreen (but keep it visible), since it usually sits atop endSel
      // position the popup relative to selection, taking visible boundary into account
      } else if(cm.somethingSelected()){
        popup.appendChild(that.cut);
        popup.appendChild(that.copy);
        if(that.clipboardText.length>0){ popup.appendChild(that.paste);}
        if(startCursor.y == endCursor.y){popupX = startCursor.x + (endCursor.x - startCursor.x)/2;}
        else popupX = scrollInfo.x+screen.availWidth/2;
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
        popup.style.top  = startCursor.y - (popup.offsetHeight+10) + "px";
      // if not, see if we can position it below the selection
      } else if (endCursor.yBot+popup.offsetHeight+10 < scrollInfo.y+cm.getScrollerElement().offsetHeight){
        popup.className = 'belowEdge';
        popup.style.top = endCursor.yBot+10+"px";
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
    },

    // Factory: return methods for changing CM state in response to dragging corner dots
    updateSelection: function(startChanging){
      return function(e){
        e.preventDefault();
        e.stopPropagation();
        if(e.touches.length !== 1){ return;}
        var adjustY = startChanging? that.startSel.offsetHeight : -that.startSel.offsetHeight;
        var coords = {x: e.touches[0].pageX, y: e.touches[0].pageY+adjustY},
            startPos = startChanging? that.cm.coordsChar(coords) : that.cm.getCursor(true),
            endPos = startChanging? that.cm.getCursor(false) : that.cm.coordsChar(coords);
        if(startPos.line < endPos.line || (startPos.line==endPos.line && startPos.ch < endPos.ch)){
            that.cm.setSelection(startPos, endPos);
            that.drawPopup();
        }
        return false;
      };
    },
 
    // handlers and timers for showing and hiding the popup
    setTimer: function(e){that.timer = window.setTimeout(function(){that.showPopup(e);},800);},
    clearTimer: function(){window.clearTimeout(that.timer);},
    hidePopupAndSetTimer: function(e){
      e.stopPropagation();
      that.setTimer(e);
      window.setTimeout(that.drawPopup, 500);
    },
  
    showPopup: function(e){
      that.popupVisible = true;
      e.preventDefault();
      e.stopPropagation();
      if(e.touches.length !== 1){ return;}
      var coords = {x: e.touches[0].pageX, y: e.touches[0].pageY};
      that.cm.setCursor(that.cm.coordsChar(coords));
      that.drawPopup();
      that.cm.focus();
    },

    // draw selection around the current word
    selectHandler: function(e){
      e.preventDefault();
      var cursor = that.cm.getCursor(),
          words  = that.cm.getLine(cursor.line).split(/[\s+\(\)\"\']/),
          start=0, end=0, i=0;
      for(i=0; i < words.length; i++){
        start = end;
        end+=words[i].length+1;
        if (end>cursor.ch){ break;}
      }
      var startPos = {line: cursor.line, ch: start},
          endPos = {line: cursor.line, ch: end-1};
      that.cm.setSelection(startPos, endPos);
      that.drawPopup();
    },
                                          
    // fake the event, and dispatch from CM's own input element
    cutHandler: function(e){
      e.preventDefault();
      that.clipboardText = that.cm.getSelection();
      var from= that.cm.coordsChar(that.cm.cursorCoords(true)),
          to  = that.cm.coordsChar(that.cm.cursorCoords(false));
      that.cm.replaceRange("", from, to);
      that.popupVisible = false;
      that.drawPopup();
    },
                                                
    // fake the event, and dispatch from CM's own input element
    pasteHandler: function(e){
      e.preventDefault();
      var from= that.cm.coordsChar(that.cm.cursorCoords(true)),
          to  = that.cm.coordsChar(that.cm.cursorCoords(false));
      that.cm.replaceRange(that.clipboardText, from, to);
      that.popupVisible = false;
      that.drawPopup();
    },
    
    // fake the event, and dispatch from CM's own input element
    copyHandler: function(e){
      e.preventDefault();
      that.clipboardText = that.cm.getSelection();
      that.popupVisible = false;
      that.drawPopup();
    },

    // draw selection for entire editor
    selectAllHandler: function(e){
      e.preventDefault();
      that.cm.setSelection({line: 0, ch: 0}, {line: that.cm.lineCount() - 1});
      that.drawPopup();
    },
                                                                                                     
    // assign events to scroller, selection dots, and popup buttons
    connectPopupEvents:function(){
      var scroller  = that.cm.getScrollerElement();
      CodeMirror.connect(scroller,      "touchstart", this.hidePopupAndSetTimer);
      CodeMirror.connect(scroller,      "touchmove",  this.clearTimer);
      CodeMirror.connect(scroller,      "touchend",   this.clearTimer);
      CodeMirror.connect(scroller,      "onclick",    this.drawPopup);
      // startSel and endSel control the selection state
      CodeMirror.connect(this.startSel, "touchstart", this.updateSelection(true));
      CodeMirror.connect(this.endSel,   "touchstart", this.updateSelection(false));
      CodeMirror.connect(this.startSel, "touchmove",  this.updateSelection(true));
      CodeMirror.connect(this.endSel,   "touchmove",  this.updateSelection(false));
      // popup menu buttons
      CodeMirror.connect(this.select,   "touchend",  this.selectHandler);
      CodeMirror.connect(this.selectAll,"touchend",  this.selectAllHandler);
      CodeMirror.connect(this.cut,      "touchend",  this.cutHandler);
      CodeMirror.connect(this.copy,     "touchend",  this.copyHandler);
      CodeMirror.connect(this.paste,    "touchend",  this.pasteHandler);
      
      // if the contents are changed at all, make sure we hide the popup and update the popup
      that.cm.setOption("onChange", function(){that.popupVisible = false; that.drawPopup();});
    }
  };

  CodeMirror.defineExtension("addPopup", function() { return new iOSpopup(this);});
})();