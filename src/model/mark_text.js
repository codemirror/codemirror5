import { elt } from "../util/dom";
import { eventMixin, hasHandler, on } from "../util/event";
import { endOperation, operation, runInOp, startOperation } from "../display/operations";
import { clipPos, cmp, Pos } from "../line/pos";
import { lineNo, updateLineHeight } from "../line/utils_line";
import { clearLineMeasurementCacheFor, findViewForLine, textHeight } from "../measurement/position_measurement";
import { seeReadOnlySpans, seeCollapsedSpans } from "../line/saw_special_spans";
import { addMarkedSpan, conflictingCollapsedRange, getMarkedSpanFor, lineIsHidden, lineLength, MarkedSpan, removeMarkedSpan, visualLine } from "../line/spans";
import { copyObj, indexOf, lst } from "../util/misc";
import { signalLater } from "../util/operation_group";
import { widgetHeight } from "../measurement/widgets";
import { regChange, regLineChange } from "../display/view_tracking";

import { linkedDocs } from "./document_data";
import { addChangeToHistory } from "./history";
import { reCheckSelection } from "./selection_updates";

// TEXTMARKERS

// Created with markText and setBookmark methods. A TextMarker is a
// handle that can be used to clear or find a marked position in the
// document. Line objects hold arrays (markedSpans) containing
// {from, to, marker} object pointing to such marker objects, and
// indicating that such a marker is present on that line. Multiple
// lines may point to the same marker when it spans across lines.
// The spans will have null for their from/to properties when the
// marker continues beyond the start/end of the line. Markers have
// links back to the lines they currently touch.

var nextMarkerId = 0;

export function TextMarker(doc, type) {
  this.lines = [];
  this.type = type;
  this.doc = doc;
  this.id = ++nextMarkerId;
}
eventMixin(TextMarker);

// Clear the marker.
TextMarker.prototype.clear = function() {
  if (this.explicitlyCleared) return;
  var cm = this.doc.cm, withOp = cm && !cm.curOp;
  if (withOp) startOperation(cm);
  if (hasHandler(this, "clear")) {
    var found = this.find();
    if (found) signalLater(this, "clear", found.from, found.to);
  }
  var min = null, max = null;
  for (var i = 0; i < this.lines.length; ++i) {
    var line = this.lines[i];
    var span = getMarkedSpanFor(line.markedSpans, this);
    if (cm && !this.collapsed) regLineChange(cm, lineNo(line), "text");
    else if (cm) {
      if (span.to != null) max = lineNo(line);
      if (span.from != null) min = lineNo(line);
    }
    line.markedSpans = removeMarkedSpan(line.markedSpans, span);
    if (span.from == null && this.collapsed && !lineIsHidden(this.doc, line) && cm)
      updateLineHeight(line, textHeight(cm.display));
  }
  if (cm && this.collapsed && !cm.options.lineWrapping) for (var i = 0; i < this.lines.length; ++i) {
    var visual = visualLine(this.lines[i]), len = lineLength(visual);
    if (len > cm.display.maxLineLength) {
      cm.display.maxLine = visual;
      cm.display.maxLineLength = len;
      cm.display.maxLineChanged = true;
    }
  }

  if (min != null && cm && this.collapsed) regChange(cm, min, max + 1);
  this.lines.length = 0;
  this.explicitlyCleared = true;
  if (this.atomic && this.doc.cantEdit) {
    this.doc.cantEdit = false;
    if (cm) reCheckSelection(cm.doc);
  }
  if (cm) signalLater(cm, "markerCleared", cm, this);
  if (withOp) endOperation(cm);
  if (this.parent) this.parent.clear();
};

// Find the position of the marker in the document. Returns a {from,
// to} object by default. Side can be passed to get a specific side
// -- 0 (both), -1 (left), or 1 (right). When lineObj is true, the
// Pos objects returned contain a line object, rather than a line
// number (used to prevent looking up the same line twice).
TextMarker.prototype.find = function(side, lineObj) {
  if (side == null && this.type == "bookmark") side = 1;
  var from, to;
  for (var i = 0; i < this.lines.length; ++i) {
    var line = this.lines[i];
    var span = getMarkedSpanFor(line.markedSpans, this);
    if (span.from != null) {
      from = Pos(lineObj ? line : lineNo(line), span.from);
      if (side == -1) return from;
    }
    if (span.to != null) {
      to = Pos(lineObj ? line : lineNo(line), span.to);
      if (side == 1) return to;
    }
  }
  return from && {from: from, to: to};
};

// Signals that the marker's widget changed, and surrounding layout
// should be recomputed.
TextMarker.prototype.changed = function() {
  var pos = this.find(-1, true), widget = this, cm = this.doc.cm;
  if (!pos || !cm) return;
  runInOp(cm, function() {
    var line = pos.line, lineN = lineNo(pos.line);
    var view = findViewForLine(cm, lineN);
    if (view) {
      clearLineMeasurementCacheFor(view);
      cm.curOp.selectionChanged = cm.curOp.forceUpdate = true;
    }
    cm.curOp.updateMaxLine = true;
    if (!lineIsHidden(widget.doc, line) && widget.height != null) {
      var oldHeight = widget.height;
      widget.height = null;
      var dHeight = widgetHeight(widget) - oldHeight;
      if (dHeight)
        updateLineHeight(line, line.height + dHeight);
    }
  });
};

TextMarker.prototype.attachLine = function(line) {
  if (!this.lines.length && this.doc.cm) {
    var op = this.doc.cm.curOp;
    if (!op.maybeHiddenMarkers || indexOf(op.maybeHiddenMarkers, this) == -1)
      (op.maybeUnhiddenMarkers || (op.maybeUnhiddenMarkers = [])).push(this);
  }
  this.lines.push(line);
};
TextMarker.prototype.detachLine = function(line) {
  this.lines.splice(indexOf(this.lines, line), 1);
  if (!this.lines.length && this.doc.cm) {
    var op = this.doc.cm.curOp;
    (op.maybeHiddenMarkers || (op.maybeHiddenMarkers = [])).push(this);
  }
};

// Collapsed markers have unique ids, in order to be able to order
// them, which is needed for uniquely determining an outer marker
// when they overlap (they may nest, but not partially overlap).
var nextMarkerId = 0;

// Create a marker, wire it up to the right lines, and
export function markText(doc, from, to, options, type) {
  // Shared markers (across linked documents) are handled separately
  // (markTextShared will call out to this again, once per
  // document).
  if (options && options.shared) return markTextShared(doc, from, to, options, type);
  // Ensure we are in an operation.
  if (doc.cm && !doc.cm.curOp) return operation(doc.cm, markText)(doc, from, to, options, type);

  var marker = new TextMarker(doc, type), diff = cmp(from, to);
  if (options) copyObj(options, marker, false);
  // Don't connect empty markers unless clearWhenEmpty is false
  if (diff > 0 || diff == 0 && marker.clearWhenEmpty !== false)
    return marker;
  if (marker.replacedWith) {
    // Showing up as a widget implies collapsed (widget replaces text)
    marker.collapsed = true;
    marker.widgetNode = elt("span", [marker.replacedWith], "CodeMirror-widget");
    if (!options.handleMouseEvents) marker.widgetNode.setAttribute("cm-ignore-events", "true");
    if (options.insertLeft) marker.widgetNode.insertLeft = true;
  }
  if (marker.collapsed) {
    if (conflictingCollapsedRange(doc, from.line, from, to, marker) ||
        from.line != to.line && conflictingCollapsedRange(doc, to.line, from, to, marker))
      throw new Error("Inserting collapsed marker partially overlapping an existing one");
    seeCollapsedSpans();
  }

  if (marker.addToHistory)
    addChangeToHistory(doc, {from: from, to: to, origin: "markText"}, doc.sel, NaN);

  var curLine = from.line, cm = doc.cm, updateMaxLine;
  doc.iter(curLine, to.line + 1, function(line) {
    if (cm && marker.collapsed && !cm.options.lineWrapping && visualLine(line) == cm.display.maxLine)
      updateMaxLine = true;
    if (marker.collapsed && curLine != from.line) updateLineHeight(line, 0);
    addMarkedSpan(line, new MarkedSpan(marker,
                                       curLine == from.line ? from.ch : null,
                                       curLine == to.line ? to.ch : null));
    ++curLine;
  });
  // lineIsHidden depends on the presence of the spans, so needs a second pass
  if (marker.collapsed) doc.iter(from.line, to.line + 1, function(line) {
    if (lineIsHidden(doc, line)) updateLineHeight(line, 0);
  });

  if (marker.clearOnEnter) on(marker, "beforeCursorEnter", function() { marker.clear(); });

  if (marker.readOnly) {
    seeReadOnlySpans();
    if (doc.history.done.length || doc.history.undone.length)
      doc.clearHistory();
  }
  if (marker.collapsed) {
    marker.id = ++nextMarkerId;
    marker.atomic = true;
  }
  if (cm) {
    // Sync editor state
    if (updateMaxLine) cm.curOp.updateMaxLine = true;
    if (marker.collapsed)
      regChange(cm, from.line, to.line + 1);
    else if (marker.className || marker.title || marker.startStyle || marker.endStyle || marker.css)
      for (var i = from.line; i <= to.line; i++) regLineChange(cm, i, "text");
    if (marker.atomic) reCheckSelection(cm.doc);
    signalLater(cm, "markerAdded", cm, marker);
  }
  return marker;
}

// SHARED TEXTMARKERS

// A shared marker spans multiple linked documents. It is
// implemented as a meta-marker-object controlling multiple normal
// markers.
export function SharedTextMarker(markers, primary) {
  this.markers = markers;
  this.primary = primary;
  for (var i = 0; i < markers.length; ++i)
    markers[i].parent = this;
}
eventMixin(SharedTextMarker);

SharedTextMarker.prototype.clear = function() {
  if (this.explicitlyCleared) return;
  this.explicitlyCleared = true;
  for (var i = 0; i < this.markers.length; ++i)
    this.markers[i].clear();
  signalLater(this, "clear");
};
SharedTextMarker.prototype.find = function(side, lineObj) {
  return this.primary.find(side, lineObj);
};

function markTextShared(doc, from, to, options, type) {
  options = copyObj(options);
  options.shared = false;
  var markers = [markText(doc, from, to, options, type)], primary = markers[0];
  var widget = options.widgetNode;
  linkedDocs(doc, function(doc) {
    if (widget) options.widgetNode = widget.cloneNode(true);
    markers.push(markText(doc, clipPos(doc, from), clipPos(doc, to), options, type));
    for (var i = 0; i < doc.linked.length; ++i)
      if (doc.linked[i].isParent) return;
    primary = lst(markers);
  });
  return new SharedTextMarker(markers, primary);
}

export function findSharedMarkers(doc) {
  return doc.findMarks(Pos(doc.first, 0), doc.clipPos(Pos(doc.lastLine())),
                       function(m) { return m.parent; });
}

export function copySharedMarkers(doc, markers) {
  for (var i = 0; i < markers.length; i++) {
    var marker = markers[i], pos = marker.find();
    var mFrom = doc.clipPos(pos.from), mTo = doc.clipPos(pos.to);
    if (cmp(mFrom, mTo)) {
      var subMark = markText(doc, mFrom, mTo, marker.primary, marker.primary.type);
      marker.markers.push(subMark);
      subMark.parent = marker;
    }
  }
}

export function detachSharedMarkers(markers) {
  for (var i = 0; i < markers.length; i++) {
    var marker = markers[i], linked = [marker.primary.doc];
    linkedDocs(marker.primary.doc, function(d) { linked.push(d); });
    for (var j = 0; j < marker.markers.length; j++) {
      var subMarker = marker.markers[j];
      if (indexOf(linked, subMarker.doc) == -1) {
        subMarker.parent = null;
        marker.markers.splice(j--, 1);
      }
    }
  }
}
