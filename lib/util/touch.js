/*global CodeMirror, that */
/*jslint plusplus: true, browser: true, vars: true */
(function(){
// "use strict";
  function TouchSupport(cm, keyConfig) {
     that = this;
     this.iPhone  = (navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i));
     this.iPad    = (navigator.userAgent.match(/iPad/i));
     this.cm = cm;
     /*****************************************************************************************
       *    Build Nodes we'll need                                                          */

     // POPUP
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
     
     // KEYBOARD
     function keyFactory(config){
       var node = document.createElement('li');
       node.innerHTML = config.key;
       config.fn = config.fn || function(){
         var e = document.createEvent('TextEvent');
         e.initTextEvent('textInput', true, true, window, config.key, 1);
         document.activeElement.dispatchEvent(e);
       };
 
       // two states: WAITING_FOR_START and WAITING_FOR_END.
       // If we are in WAITING_FOR_END and we see a touchend, then  call the function.
       var WAITING_FOR_START = 0,
           WAITING_FOR_END = 1,
           currentState = WAITING_FOR_START;
       node.addEventListener("touchstart",
                             function(e) {
                             node.className="pressed";
                             currentState = WAITING_FOR_END;
                             e.preventDefault();
                             });
       node.addEventListener("touchmove",
                             function(e) {
                             node.className="pressed";
                             currentState = WAITING_FOR_START;
                             e.preventDefault();
                             });
       node.addEventListener("touchend",
                             function(e) {
                             node.className="";
                             if (currentState === WAITING_FOR_END) {
                             config.fn();
                             }
                             currentState = WAITING_FOR_START;
                             e.preventDefault();
                             });
       return node;
    }

    var keyList = document.createElement('UL'),
        i;
    keyList.id = 'keys';
    keyList.className = this.iPad? 'iPad' : 'iPhone';
    document.body.appendChild(keyList);
    that.keyList = keyList;
    that.keyArray = keyConfig;
    for(i in keyConfig){ keyList.appendChild(keyFactory(keyConfig[i])); }

   /*****************************************************************************************
    *    Connect Event Handlers                                                           */
    if(this.iPad || this.iPhone){
      this.connectKeyboardEvents();
      this.connectPopupEvents();
    }
  }
 
  TouchSupport.prototype = {
   /*****************************************************************************************
    *    Keyboard Code                                                                    */
    keysVisible: false,
 
    drawKeyboard: function(){
      if(!that.keysVisible){that.keyList.style.display = 'none'; return;}
      var isLandscape = Math.abs(window.orientation) === 90,
          keyWidth, keyHeight, keyboardHeight, i;

      // innerWidth is the num of pixels displayed end-to-end
      // divide that by the number of keys to get the avg key width, then subtract some padding for space between keys
      // maximum limits on width, and height/width ratios are specific to device and orientation
      if(that.iPad){
        keyWidth  = Math.min(Math.round(window.innerWidth/that.keyArray.length), isLandscape? 85 : 65) - 13;
        keyHeight = 0.75*keyWidth;
        keyboardHeight = isLandscape? 380 : 290;
      } else if(that.iPhone){
        keyWidth  = Math.min(Math.round(window.innerWidth/that.keyArray.length), isLandscape? 40 : 30) - 5;
        keyHeight = (isLandscape? 0.75 : 1.2)*keyWidth;
        keyboardHeight = isLandscape? 86 : 140;
      }
      for(i=0; i < that.keyList.childNodes.length; i++){
        that.keyList.childNodes[i].style.width     = keyWidth+"px";
        that.keyList.childNodes[i].style.lineHeight= keyHeight+"px";
        that.keyList.childNodes[i].style.fontSize  = (0.5*keyHeight)+"px";
      }
      that.keyList.style.display = 'block';
      that.keyList.style.bottom = (keyboardHeight - (window.pageYOffset)) + "px";
    },
 
    // assign events to window, and codemirror input element
    connectKeyboardEvents: function(){
      CodeMirror.connect(window,"touchmove", that.drawKeyboard);
      CodeMirror.connect(window,"scroll", that.drawKeyboard);
      CodeMirror.connect(window,"orientationchange", that.drawKeyboard);
      that.cm.setOption("onBlur", function(){that.keysVisible = false; that.drawKeyboard();});
      that.cm.setOption("onFocus", function(){that.keysVisible = true; that.drawKeyboard();});
    },

 
   /*****************************************************************************************
    *    Popup Code                                                                       */
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
        var middle = startCursor.x;
 
      // If something is selected, fill the popup accordingly, and move the input field
      // somewhere offscreen (but keep it visible), since it usually sits atop endSel
      // position the popup relative to selection, taking visible boundary into account
      } else if(cm.somethingSelected()){
        popup.appendChild(that.cut);
        popup.appendChild(that.copy);
        if(that.clipboardText.length>0){ popup.appendChild(that.paste);}
        if(startCursor.y == endCursor.y){middle = startCursor.x + (endCursor.x - startCursor.x)/2;}
        else middle = cm.getScrollerElement().clientWidth/2;
        startSel.style.top  = startCursor.y-startSel.offsetWidth + "px";
        startSel.style.left = startCursor.x-startSel.offsetWidth/2 + "px";
        endSel.style.top    = endCursor.yBot + "px";
        endSel.style.left   = endCursor.x-endSel.offsetHeight/2 + "px";
        cm.getInputField().style.left = '-1000px';
      }
 
      // position the popup so it's always onscreen, and never blocking the cursor
      popup.className = '';
      if((startCursor.y - (popup.offsetHeight+10)) < scrollInfo.y){
        popup.classList.add('belowEdge');
        popup.style.top = startCursor.yBot+10+"px";
      } else {
        popup.classList.add('aboveEdge');
        popup.style.top  = startCursor.y - (popup.offsetHeight+10) + "px";
      }
      if(middle-popup.offsetWidth/2 < 0){
        popup.style.left = "0px";
        popup.classList.add('leftEdge');
      } else if(middle+popup.offsetWidth/2 > cmWidth){
        popup.style.left = cmWidth+scrollInfo.x - (gutterWidth+popup.offsetWidth+10) + "px";
        popup.classList.add('rightEdge');
      } else {
        popup.style.left = middle-popup.offsetWidth/2 + "px";
      }
    },

    // Factory: return methods for changing CM state in response to dragging corner dots
    updateSelection: function(startChanging){
      return function(e){
        e.preventDefault();
        e.stopPropagation();
        if(e.touches.length !== 1){ return;}
        var coords = {x: e.touches[0].pageX, y: e.touches[0].pageY},
            startPos = startChanging? that.cm.coordsChar(coords) : that.cm.getCursor(true),
            endPos = startChanging? that.cm.getCursor(false) : that.cm.coordsChar(coords);
        if(startPos.ch >= endPos.ch && startPos.line >= endPos.line){ return;}
        that.cm.setSelection(startPos, endPos);
        that.drawPopup();
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

  CodeMirror.defineExtension("addKeyrow", function(keyArray) {
                             return new TouchSupport(this, keyArray);
  });
})();


// A Fix for the iOS Viewport Scaling bug
// http://webdesignerwall.com/tutorials/iphone-safari-viewport-scaling-bug
 (function(doc) {
   "use strict";
    var addEvent = 'addEventListener',
    type = 'gesturestart',
    qsa = 'querySelectorAll',
    scales = [1, 1],
    meta = qsa in doc ? doc[qsa]('meta[name=viewport]') : [];
    function fix() {
      meta.content = 'width=device-width,minimum-scale=' + scales[0] + ',maximum-scale=' + scales[1];
      doc.removeEventListener(type, fix, true);
    }
    if ((meta = meta[meta.length - 1]) && addEvent in doc) {
      fix(); scales = [0.25, 1.6]; doc[addEvent](type, fix, true);
    }
  }(document));
