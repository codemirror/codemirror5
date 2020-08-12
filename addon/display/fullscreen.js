// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE
(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineOption("fullscreen", null, function(cm, val, old) {
    if (typeof val === "string") val = {className: val};
    else if (typeof val === "number") val = {zIndex: val};
    else if (typeof val === "function") val = {onchange: val};
    else if (!val || typeof val !== "object") val = {};
    if (!old || typeof old !== "object") old = {};
    if (typeof cm.state.fullscreen !== "object") cm.state.fullscreen = {};
    var state = cm.state.fullscreen;
    state.options = val;
    if (!val.bindDocument != !old.bindDocument) {
      var type = val.bindDocument ? "addEventListener" : "removeEventListener";
      if (val.bindDocument) state.fullscreenchange = onFullscreenChange(cm);
      document[type]("fullscreenchange", state.fullscreenchange);
      document[type]("msfullscreenchange", state.fullscreenchange);
      document[type]("mozfullscreenchange", state.fullscreenchange);
      document[type]("webkitfullscreenchange", state.fullscreenchange);
    }
    if (!val.shortcut != !old.shortcut) cm[val.shortcut && !val.documentShortcut ? "addKeyMap" : "removeKeyMap"](keyMap);
    if (!val.documentShortcut != !old.documentShortcut) {
      if (val.documentShortcut) state.keydown = onKeyDown(cm);
      document[val.documentShortcut ? "addEventListener" : "removeEventListener"]("keydown", state.keydown);
    }
  });

  var keyMap = {
    F11: function(cm) {
      (cm.state.fullscreen.enabled ? setNormal : setFullscreen)(cm);
    },
    Esc: function(cm) {
      if (cm.state.fullscreen.enabled) setNormal(cm);
      else return CodeMirror.Pass;
    }
  };

  function onKeyDown(cm) {
    return function(e) {
      if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (e.keyCode == 122) {
        e.preventDefault();
        (cm.state.fullscreen.enabled ? setNormal : setFullscreen)(cm);
      } else if (e.keyCode == 27 && cm.state.fullscreen.enabled) {
        e.preventDefault();
        setNormal(cm);
      }
    }
  }

  function onFullscreenChange(cm) {
    return function() {
      if (documentInFullscreen()) {
        if (!cm.state.fullscreen.enabled) setFullscreen(cm);
      } else if (cm.state.fullscreen.enabled) setNormal(cm);
    }
  }

  CodeMirror.defineExtension("toggleFullscreen", function(val) {
    if (typeof val === "undefined") val = !this.state.fullscreen.enabled;
    if (!val == !this.state.fullscreen.enabled) return;
    (val ? setFullscreen : setNormal)(this);
  });

  CodeMirror.defineExtension("isFullscreen", function() {
    return this.state.fullscreen.enabled;
  });

  var defaultStyle = {width: "", height: "auto", position: "fixed", top: 0, right: 0, bottom: 0, left: 0, zIndex: 2147483647};

  function setFullscreen(cm) {
    var state = cm.state.fullscreen, options = state.options, wrap = cm.display.wrapper;
    state.enabled = true;
    state.restore = {scrollLeft: window.pageXOffset, scrollTop: window.pageYOffset, documentOverflow: document.documentElement.style.overflow, wrapStyle: {}};
    if (options.bindDocument && !documentInFullscreen()) (document.documentElement.requestFullscreen || document.documentElement.mozRequestFullscreen || document.documentElement.webkitRequestFullscreen || document.documentElement.msRequestFullscreen || fullscreenNotAvailable).call(document.documentElement, Element.ALLOW_KEYBOARD_INPUT);
    for (var prop in defaultStyle) {
      if (options[prop] !== false) {
        state.restore.wrapStyle[prop] = wrap.style[prop];
        wrap.style[prop] = (prop in options ? options : defaultStyle)[prop];
      }
    }
    document.documentElement.style.overflow = "hidden";
    if (options.className !== false) wrap.className += " " + ("className" in options ? options.className : "CodeMirror-fullscreen");
    cm.refresh();
    if (typeof options.onenter === "function") options.onenter();
    if (typeof options.onchange === "function") options.onchange(true);
  }

  function setNormal(cm) {
    var state = cm.state.fullscreen, options = state.options, wrap = cm.display.wrapper, info = state.restore;
    state.enabled = false;
    if (options.className !== false) wrap.className = wrap.className.replace(new RegExp("\\s*" + ("className" in options ? options.className : "CodeMirror-fullscreen") + "\\b"), "");
    for (var prop in info.wrapStyle) wrap.style[prop] = info.wrapStyle[prop];
    document.documentElement.style.overflow = info.documentOverflow;
    window.scrollTo(info.scrollLeft, info.scrollTop);
    if (options.bindDocument && documentInFullscreen()) (document.exitFullscreen || document.mozCancelFullscreen || document.webkitExitFullscreen || document.msExitFullscreen || fullscreenNotAvailable).call(document);
    cm.refresh();
    if (typeof options.onexit === "function") options.onexit();
    if (typeof options.onchange === "function") options.onchange(false);
  }

  function documentInFullscreen() {
    return document.fullscreenElement || document.msFullscreenElement || document.mozFullscreenElement || document.webkitFullscreenElement;
  }

  function fullscreenNotAvailable() {
    throw new Error("You browser does not support controlling fullscreen.");
  }
});