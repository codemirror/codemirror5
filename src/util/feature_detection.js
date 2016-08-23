import { elt, range, removeChildren, removeChildrenAndAdd } from "./dom";
import { ie, ie_version } from "./browser";

// Detect drag-and-drop
export var dragAndDrop = function() {
  // There is *some* kind of drag-and-drop support in IE6-8, but I
  // couldn't get it to work yet.
  if (ie && ie_version < 9) return false;
  var div = elt('div');
  return "draggable" in div || "dragDrop" in div;
}();

var zwspSupported;
export function zeroWidthElement(measure) {
  if (zwspSupported == null) {
    var test = elt("span", "\u200b");
    removeChildrenAndAdd(measure, elt("span", [test, document.createTextNode("x")]));
    if (measure.firstChild.offsetHeight != 0)
      zwspSupported = test.offsetWidth <= 1 && test.offsetHeight > 2 && !(ie && ie_version < 8);
  }
  var node = zwspSupported ? elt("span", "\u200b") :
    elt("span", "\u00a0", null, "display: inline-block; width: 1px; margin-right: -1px");
  node.setAttribute("cm-text", "");
  return node;
}

// Feature-detect IE's crummy client rect reporting for bidi text
var badBidiRects;
export function hasBadBidiRects(measure) {
  if (badBidiRects != null) return badBidiRects;
  var txt = removeChildrenAndAdd(measure, document.createTextNode("A\u062eA"));
  var r0 = range(txt, 0, 1).getBoundingClientRect();
  var r1 = range(txt, 1, 2).getBoundingClientRect();
  removeChildren(measure);
  if (!r0 || r0.left == r0.right) return false; // Safari returns null in some cases (#2780)
  return badBidiRects = (r1.right - r0.right < 3);
}

// See if "".split is the broken IE version, if so, provide an
// alternative way to split lines.
export var splitLinesAuto = "\n\nb".split(/\n/).length != 3 ? function(string) {
  var pos = 0, result = [], l = string.length;
  while (pos <= l) {
    var nl = string.indexOf("\n", pos);
    if (nl == -1) nl = string.length;
    var line = string.slice(pos, string.charAt(nl - 1) == "\r" ? nl - 1 : nl);
    var rt = line.indexOf("\r");
    if (rt != -1) {
      result.push(line.slice(0, rt));
      pos += rt + 1;
    } else {
      result.push(line);
      pos = nl + 1;
    }
  }
  return result;
} : function(string){return string.split(/\r\n?|\n/);};

export var hasSelection = window.getSelection ? function(te) {
  try { return te.selectionStart != te.selectionEnd; }
  catch(e) { return false; }
} : function(te) {
  try {var range = te.ownerDocument.selection.createRange();}
  catch(e) {}
  if (!range || range.parentElement() != te) return false;
  return range.compareEndPoints("StartToEnd", range) != 0;
};

export var hasCopyEvent = (function() {
  var e = elt("div");
  if ("oncopy" in e) return true;
  e.setAttribute("oncopy", "return;");
  return typeof e.oncopy == "function";
})();

var badZoomedRects = null;
export function hasBadZoomedRects(measure) {
  if (badZoomedRects != null) return badZoomedRects;
  var node = removeChildrenAndAdd(measure, elt("span", "x"));
  var normal = node.getBoundingClientRect();
  var fromRange = range(node, 0, 1).getBoundingClientRect();
  return badZoomedRects = Math.abs(normal.left - fromRange.left) > 1;
}
