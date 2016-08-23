import { onBlur } from "../display/focus";
import { on } from "../util/event";

// These must be handled carefully, because naively registering a
// handler for each editor will cause the editors to never be
// garbage collected.

function forEachCodeMirror(f) {
  if (!document.body.getElementsByClassName) return;
  var byClass = document.body.getElementsByClassName("CodeMirror");
  for (var i = 0; i < byClass.length; i++) {
    var cm = byClass[i].CodeMirror;
    if (cm) f(cm);
  }
}

var globalsRegistered = false;
export function ensureGlobalHandlers() {
  if (globalsRegistered) return;
  registerGlobalHandlers();
  globalsRegistered = true;
}
function registerGlobalHandlers() {
  // When the window resizes, we need to refresh active editors.
  var resizeTimer;
  on(window, "resize", function() {
    if (resizeTimer == null) resizeTimer = setTimeout(function() {
      resizeTimer = null;
      forEachCodeMirror(onResize);
    }, 100);
  });
  // When the window loses focus, we want to show the editor as blurred
  on(window, "blur", function() {
    forEachCodeMirror(onBlur);
  });
}
// Called when the window resizes
function onResize(cm) {
  var d = cm.display;
  if (d.lastWrapHeight == d.wrapper.clientHeight && d.lastWrapWidth == d.wrapper.clientWidth)
    return;
  // Might be a text scaling operation, clear size caches.
  d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null;
  d.scrollbarsClipped = false;
  cm.setSize();
}
