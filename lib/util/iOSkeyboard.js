/*global CodeMirror, that */
/*jslint plusplus: true, browser: true, vars: true */
(function(){
    "use strict";
    var FifthRow = function(cm, keyConfig, keySound) {
        var keysVisible = false,
        iPhone  = (navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i)),
        iPad    = (navigator.userAgent.match(/iPad/i)),
        keySound = {sound: new Audio(keySound), play: function(){this.sound.play()}};

        /*****************************************************************************************
         *    Build Nodes we'll need                                                          */

        // KEYBOARD
        var keyFactory = function(config){
            var node = document.createElement('li');
            node.innerHTML = config.key;
            config.fn = config.fn || function(){
                cm.replaceSelection(config.key);
                cm.setCursor(cm.getCursor(false));
            };
            
            // two states: WAITING_FOR_START and WAITING_FOR_END.
            // If we are in WAITING_FOR_END and we see a touchend, then  call the function.
            var WAITING_FOR_START = 0,
            WAITING_FOR_END = 1,
            currentState = WAITING_FOR_START;
            node.addEventListener("touchstart",
                                  function(e) {
                                      node.className="pressed";
                                      // keySound.play();
                                      currentState = WAITING_FOR_END;
                                      e.stopPropagation();
                                      e.preventDefault();
                                  });
            node.addEventListener("touchmove",
                                  function(e) {
                                      node.className="pressed";
                                      currentState = WAITING_FOR_START;
                                      e.stopPropagation();
                                      e.preventDefault();
                                  });
            node.addEventListener("touchend",
                                  function(e) {
                                      node.className="";
                                      if (currentState === WAITING_FOR_END) {
                                          config.fn();
                                      }
                                      currentState = WAITING_FOR_START;
                                      e.stopPropagation();
                                      e.preventDefault();
                                  });
            return node;
        }

        var keyList = document.createElement('UL'), i;
        keyList.id = 'keys';
        keyList.className = iPad? 'iPad' : 'iPhone';
        document.body.appendChild(keyList);

        for(i in keyConfig){ keyList.appendChild(keyFactory(keyConfig[i])); }
        
        var intervalId;

        var drawKeyboard = function(){
            if(!keysVisible){
                keyList.style.display = 'none';
                if (intervalId) {clearInterval(intervalId); intervalId = undefined; } 
                return;
            }
            var isLandscape = Math.abs(window.orientation) === 90,
            keyWidth, keyHeight, keyboardHeight, i;
            
            // innerWidth is the num of pixels displayed end-to-end
            // divide that by the number of keys to get the avg key width, then subtract some padding for space between keys
            // maximum limits on width, and height/width ratios are specific to device and orientation
            if(iPad){
                keyWidth  = Math.min(Math.round(window.innerWidth/keyConfig.length), isLandscape? 85 : 65) - 13;
                keyHeight = 0.75*keyWidth;
                keyboardHeight = isLandscape? 380 : 290;
            } else if(iPhone){
                keyWidth  = Math.min(Math.round(window.innerWidth/keyConfig.length), isLandscape? 40 : 30) - 5;
                keyHeight = (isLandscape? 0.75 : 1.2)*keyWidth;
                keyboardHeight = isLandscape? 86 : 140;
            }
            for(i=0; i < keyList.childNodes.length; i++){
                keyList.childNodes[i].style.width     = keyWidth+"px";
                keyList.childNodes[i].style.lineHeight= keyHeight+"px";
                keyList.childNodes[i].style.fontSize  = (0.5*keyHeight)+"px";
            }
            keyList.style.position = 'absolute';
            keyList.style.display = 'block';            
            if (! intervalId) {
                var oldPageOffset = undefined;
                intervalId = setInterval(
                    function() { 
                        var newPageOffset = window.pageYOffset;
                        if (oldPageOffset != newPageOffset) {
                            keyList.style.bottom = (keyboardHeight - (window.pageYOffset)) + "px";
                        }
                        oldPageOffset = newPageOffset;
                    },
                    100);
            }
        };


        /*****************************************************************************************
         *    Connect Event Handlers                                                           */
        if(iPad || iPhone){
            var _onBlur = cm.getOption('onBlur');
            var _onFocus = cm.getOption('onFocus');
            cm.setOption("onBlur", 
                         function() {
                             if (_onBlur) { _onBlur(); }
                             keysVisible = false; 
                             drawKeyboard();
                         });
            cm.setOption("onFocus",
                         function(){
                             if (_onFocus) { _onFocus(); }
                             keysVisible = true; 
                             drawKeyboard();
                         });
        }
    }    
    CodeMirror.defineExtension("addKeyrow", 
                               function(keyArray, keySound) { 
                                   return new FifthRow(this, keyArray, keySound);
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
