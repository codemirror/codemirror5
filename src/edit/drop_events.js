import { drawSelectionCursor } from "../display/selection";
import { operation } from "../display/operations";
import { clipPos } from "../line/pos";
import { posFromMouse } from "../measurement/position_measurement";
import { eventInWidget } from "../measurement/widgets";
import { makeChange, replaceRange } from "../model/changes";
import { changeEnd } from "../model/change_measurement";
import { simpleSelection } from "../model/selection";
import { setSelectionNoUndo, setSelectionReplaceHistory } from "../model/selection_updates";
import { ie, presto, safari } from "../util/browser";
import { elt, removeChildrenAndAdd } from "../util/dom";
import { e_preventDefault, e_stop, signalDOMEvent } from "../util/event";
import { indexOf } from "../util/misc";

// Kludge to work around strange IE behavior where it'll sometimes
// re-fire a series of drag-related events right after the drop (#1551)
var lastDrop = 0;

export function onDrop(e) {
  var cm = this;
  clearDragCursor(cm);
  if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e))
    return;
  e_preventDefault(e);
  if (ie) lastDrop = +new Date;
  var pos = posFromMouse(cm, e, true), files = e.dataTransfer.files;
  if (!pos || cm.isReadOnly()) return;
  // Might be a file drop, in which case we simply extract the text
  // and insert it.
  if (files && files.length && window.FileReader && window.File) {
    var n = files.length, text = Array(n), read = 0;
    var loadFile = function(file, i) {
      if (cm.options.allowDropFileTypes &&
          indexOf(cm.options.allowDropFileTypes, file.type) == -1)
        return;

      var reader = new FileReader;
      reader.onload = operation(cm, function() {
        var content = reader.result;
        if (/[\x00-\x08\x0e-\x1f]{2}/.test(content)) content = "";
        text[i] = content;
        if (++read == n) {
          pos = clipPos(cm.doc, pos);
          var change = {from: pos, to: pos,
                        text: cm.doc.splitLines(text.join(cm.doc.lineSeparator())),
                        origin: "paste"};
          makeChange(cm.doc, change);
          setSelectionReplaceHistory(cm.doc, simpleSelection(pos, changeEnd(change)));
        }
      });
      reader.readAsText(file);
    };
    for (var i = 0; i < n; ++i) loadFile(files[i], i);
  } else { // Normal drop
    // Don't do a replace if the drop happened inside of the selected text.
    if (cm.state.draggingText && cm.doc.sel.contains(pos) > -1) {
      cm.state.draggingText(e);
      // Ensure the editor is re-focused
      setTimeout(function() {cm.display.input.focus();}, 20);
      return;
    }
    try {
      var text = e.dataTransfer.getData("Text");
      if (text) {
        if (cm.state.draggingText && !cm.state.draggingText.copy)
          var selected = cm.listSelections();
        setSelectionNoUndo(cm.doc, simpleSelection(pos, pos));
        if (selected) for (var i = 0; i < selected.length; ++i)
          replaceRange(cm.doc, "", selected[i].anchor, selected[i].head, "drag");
        cm.replaceSelection(text, "around", "paste");
        cm.display.input.focus();
      }
    }
    catch(e){}
  }
}

export function onDragStart(cm, e) {
  if (ie && (!cm.state.draggingText || +new Date - lastDrop < 100)) { e_stop(e); return; }
  if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e)) return;

  e.dataTransfer.setData("Text", cm.getSelection());
  e.dataTransfer.effectAllowed = "copyMove"

  // Use dummy image instead of default browsers image.
  // Recent Safari (~6.0.2) have a tendency to segfault when this happens, so we don't do it there.
  if (e.dataTransfer.setDragImage && !safari) {
    var img = elt("img", null, null, "position: fixed; left: 0; top: 0;");
    img.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
    if (presto) {
      img.width = img.height = 1;
      cm.display.wrapper.appendChild(img);
      // Force a relayout, or Opera won't use our image for some obscure reason
      img._top = img.offsetTop;
    }
    e.dataTransfer.setDragImage(img, 0, 0);
    if (presto) img.parentNode.removeChild(img);
  }
}

export function onDragOver(cm, e) {
  var pos = posFromMouse(cm, e);
  if (!pos) return;
  var frag = document.createDocumentFragment();
  drawSelectionCursor(cm, pos, frag);
  if (!cm.display.dragCursor) {
    cm.display.dragCursor = elt("div", null, "CodeMirror-cursors CodeMirror-dragcursors");
    cm.display.lineSpace.insertBefore(cm.display.dragCursor, cm.display.cursorDiv);
  }
  removeChildrenAndAdd(cm.display.dragCursor, frag);
}

export function clearDragCursor(cm) {
  if (cm.display.dragCursor) {
    cm.display.lineSpace.removeChild(cm.display.dragCursor);
    cm.display.dragCursor = null;
  }
}
