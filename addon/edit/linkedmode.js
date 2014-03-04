/*jslint indent: 2, nomen: true, vars: true, plusplus: true*/
/*global document, CodeMirror*/
/**
 * Linked mode extension for CodeMirror.
 * Based on Eclipse http://help.eclipse.org/indigo/topic/org.eclipse.platform.doc.isv/reference/api/org/eclipse/jface/text/link/package-summary.html
 *
 * Define groups of ranges in one or more documents that are linked,
 * i.e. edits in one range are mirrored in all other ranges for that group.
 * When using multiple groups, the user may navigate through each group,
 * optionally cycling back to the original position.
 *
 * These are supported options:
 *
 * `TODO` (default true)
 *   TODO
 *
 * See demos/linkedmode.html for a more complete usage example.
 */
(function () {
  "use strict";
  var _currentModel;
  function makeArray(arr) {
    return Array.isArray(arr) ? arr : [arr];
  }
  function isRangeEmpty(from, to) {
    if (!from || !to) {
      return true;
    }
    return (from.line === to.line) && (from.ch === to.ch);
  }
  function emptyRangeSpan(className) {
    var span = document.createElement("span");
    span.className = className;
    return span;
  }
  function findMarker (marker) {
    var range = marker.find();

    if (range && range.from)
      return range;

    // Convert a bookmark position to a range
    return { from: range, to: range };
  }
  function getMarkerAt(doc, pos, type) {
    var markers = doc.findMarksAt(pos),
      found;
    
    // linked mode markers will not overlap, return the first linked mode marker
    markers.some(function (marker) {
      if (marker.linkedPositionGroup && (!type || (marker.type === type))) {
        found = marker;
        return true;
      }

      return false;
    });
    
    return found;
  }
  function getMarkerAtCursor(cm, type) {
    return getMarkerAt(cm.getDoc(), cm.getCursor(), type);
  }
  function clearMarker(marker) {
    marker.clear();
    marker.off("unhide");
  }
  function LinkedModeModel(groupArray, options) {
    this.groups = makeArray(groupArray);
    this.options = {
      noCycle: (options && options.noCycle) || false,
      rangeClassName: (options && options.positionClassName) || "CodeMirror-linkedmode-range",
      emptyClassName: (options && options.exitClassName) || "CodeMirror-linkedmode-empty"
    };

    this._marks = [];
    this._codeMirrorInstances = [];
  }
  LinkedModeModel.prototype = {
    on: function (type, f) {
      CodeMirror.on(this, type, f);
    },
    off: function (type, f) {
      CodeMirror.off(this, type, f);
    },
    _createMarker: function (doc, from, to, group, index) {
      var self = this,
        marker,
        isBookmark = isRangeEmpty(from, to),
        editor = doc.getEditor();
      
      if (isBookmark) {
        marker = doc.setBookmark(from, { widget: emptyRangeSpan(this.options.emptyClassName) });
      } else {
        marker = doc.markText(from, to, {
          className: this.options.rangeClassName,
          clearWhenEmpty: false,
          inclusiveLeft: false,
          inclusiveRight: true
        });
      }

      // Track all CodeMirror instances
      if (editor && (this._codeMirrorInstances.indexOf(editor) < 0))
        this._codeMirrorInstances.push(editor);

      // Save all TextMarkers to clear when we exit linked mode
      this._marks.push(marker);
      
      marker.linkedPositionGroup = group;

      // Restore the original marker on undo
      if (!isBookmark) {
        marker.on("unhide", function () {
          group.markers[index] = marker;
          self._invalidateSortedMarkers();
        });

        // Restore prior bookmarks
        var previous = group.markers[index];
        if (previous && previous.type === "bookmark") {
          marker.on("hide", function () {
            group.markers[index] = previous;
            self._invalidateSortedMarkers();
          });
        }
      }

      // Stop on the first marker by default unless specified in options
      marker.isStop = (index === 0) || (group.options && group.options.stopOnAllPositions);
      
      return marker;
    },
    setExit: function (position) {
      this.exitPosition = position;
    },
    _onBeforeChange: function (cm, changeObj) {
      // Prevent overlapping edits
      // Ignore undo/redo and changes with a line break
      var self = this,
        editDoc = cm.getDoc(),
        hasLineBreak = changeObj.text.length > 1,
        isUndoRedo = !changeObj.update,
        skip = self.lock || hasLineBreak || isUndoRedo;

      if (skip) {
        if (hasLineBreak) {
          // Do not move to the the exit cursor position
          self.exit(false);
        }
        return;
      }

      var toMarker = getMarkerAt(editDoc, changeObj.to),
        fromMarker = getMarkerAt(editDoc, changeObj.from, toMarker && toMarker.type),
        isExit = (fromMarker === this.exitMarker) || (toMarker === this.exitMarker),
        isSameMarker = fromMarker && toMarker && (fromMarker === toMarker);

      if (!isExit && isSameMarker) {
        // Prevent the new operation from creating an overlapping edit
        self.lock = true;

        // Update within a marker, cancel this change update update all markers in batch
        changeObj.cancel();

        // Assumes marker and change are on the same line
        var group = fromMarker.linkedPositionGroup,
          targetRange = findMarker(fromMarker),
          offsetStart = changeObj.from.ch - targetRange.from.ch,
          offsetEnd = changeObj.to.ch - targetRange.to.ch,
          doReplaceMarker = (offsetStart === 0 && offsetEnd === 0),
          text = changeObj.text[0],
          range,
          from,
          to;

        // TODO handle multiple docs

        // Update all markers in the group
        cm.operation(function () {
          var marks = group.markers.slice(0);

          marks.forEach(function (m, i) {
            // We should only have valid ranges
            range = findMarker(m);
            console.assert(range);

            // Add offset to range
            from = new CodeMirror.Pos(range.from.line, range.from.ch += offsetStart);
            to   = new CodeMirror.Pos(range.to.line,   range.to.ch += offsetEnd);
            
            m.doc.replaceRange(text, from, to, changeObj.origin);

            // Replace the old marker if it was hidden due to edits
            if (doReplaceMarker) {
              var updateRangeTo = new CodeMirror.Pos(range.from.line, range.from.ch + text.length),
                replacementMarker = self._createMarker(m.doc, range.from, updateRangeTo, group, i);

              group.markers[i] = replacementMarker;
            }
          });

          if (doReplaceMarker)
            self._invalidateSortedMarkers();

          // Release lock
          self.lock = false;
        });
      } else {
        // Update (1) not in any marker or (2) spans different markers
        self.exit(false);
      }
    },
    _nextMarker: function (currentMarker, dir) {
      var marker,
        nextMarker,
        sortedMarkers = this._getSortedMarkers(),
        index = (dir > 0) ? 0 : sortedMarkers.length - 1,
        isExit = (currentMarker === this.exitMarker),
        isFirst = (currentMarker === sortedMarkers[0]);

      if (this.options.noCycle) {
        if ((isExit && (dir > 0)) || (isFirst && (dir < 0)))
          return;
      } else if (!isExit) {
        index = sortedMarkers.indexOf(currentMarker) + dir;
      }

      while (!nextMarker) {
        marker = sortedMarkers[index];
        index = index + dir;

        if (!marker) {
          // No more markers, go to exit or first marker if no exit specified
          nextMarker = this.exitMarker || sortedMarkers[0];
        } else if (marker.isStop) {
          nextMarker = marker;
        }
      }

      return nextMarker;
    },
    _onKeyDown: function (cm, event) {
      if (event.keyCode === 27) {
        // ESC, exit linked mode without changing cursor
        this.exit(false);
        return;
      }

      var marker = getMarkerAtCursor(cm);

      if (event.keyCode === 13) {
        // ENTER, exit linked mode optionally at exit position
        var isAtMarker = !!marker;
        
        // do not insert line break if within a linked position
        if (isAtMarker) {
          event.preventDefault();
        }
        
        this.exit(isAtMarker);
      } else if (event.keyCode === 9) {
        // TAB, move to next linked position
        var nextMarker,
          dir = (event.shiftKey) ? -1 : 1;
        
        if (!marker) {
          // tab key outside all linked positions, always go to first marker 
          nextMarker = this._getSortedMarkers()[0];
        } else {
          nextMarker = this._nextMarker(marker, dir);
        }
        
        // do not insert tab char
        event.preventDefault();

        if (nextMarker)
          this._goToMarker(nextMarker);
        else
          this.exit(true);
      }
    },
    _goToMarker: function (marker) {
      var range = findMarker(marker);
      marker.doc.setSelection(range.from, range.to);
    },
    _invalidateSortedMarkers: function () {
      this._sortedMarkers = null;
    },
    _getSortedMarkers: function () {
      if (this._sortedMarkers)
        return this._sortedMarkers;

      var _sortedMarkers = [];
      this._sortedMarkers = _sortedMarkers;

      this.groups.forEach(function (group) {
        group.markers.forEach(function (m) {
          // Update start position in document
          m._pos = findMarker(m).from;

          // flat list of all markers
          _sortedMarkers.push(m);
        });
      });

      // TODO sorting with markers from multiple documents
      // sort markers by start position in document
      _sortedMarkers = _sortedMarkers.sort(function (a, b) {
        var lineCompare = a._pos.line - b._pos.line;

        if (lineCompare !== 0) {
          return lineCompare;
        }

        return a._pos.ch - b._pos.ch;
      });

      return _sortedMarkers;
    },
    _enter: function () {
      var self = this,
        error = false,
        marker;

      function _tryCreateMarker(doc, from, to, group, index) {
        var tryMarker;

        try {
          tryMarker = self._createMarker(doc, from, to, group, index);
        } catch (err) {
          error = true;
          CodeMirror.signal(self, "error", err);
        }

        return tryMarker;
      }

      self.groups.forEach(function (group) {
        group.positions.forEach(function (pos, index) {
          marker = _tryCreateMarker(pos.doc, pos.from, pos.to, group, index);

          // Store markers with the group
          if (marker)
            group.markers.push(marker);
        });
        
        // positions are invalid once linked mode is active, clear them
        group.positions = null;
      });
      
      // mark the exit position
      if (self.exitPosition) {
        self.exitMarker = _tryCreateMarker(self.exitPosition.doc, self.exitPosition.from, self.exitPosition.to, "exit");
        
        // clear exit position
        self.exitPosition = null;
      }

      if (error)
        return false;
      
      // install keydown event handler
      self._onKeyDown = self._onKeyDown.bind(self);

      // use beforeChange events to detect which markers to repair
      self._onBeforeChange = self._onBeforeChange.bind(self);

      self._codeMirrorInstances.forEach(function (cm) {
        cm.on("keydown", self._onKeyDown);
        cm.on("beforeChange", self._onBeforeChange);
      });
      
      // select the first marker
      self._goToMarker(self._getSortedMarkers()[0]);

      return true;
    },
    exit: function (goToExit) {
      var self = this,
        allGroupResults = [],
        range,
        res,
        from,
        to;

      self.groups.forEach(function (group) {
        res = { ranges: [], text: null };

        group.markers.forEach(function (marker) {
          range = findMarker(marker);
          res.ranges.push(range);

          if (range && !res.text)
            res.text = marker.doc.getRange(range.from, range.to);
        });
        
        allGroupResults.push(res);
      });
      
      // set selection at exit position
      if (self.exitMarker && goToExit) {
        self._goToMarker(self.exitMarker);
      }

      self._marks.forEach(function (marker) {
        clearMarker(marker);
      });
      
      self._codeMirrorInstances.forEach(function (cm) {
        cm.off("keydown", self._onKeyDown);
        cm.off("beforeChange", self._onBeforeChange);
      });

      // Pass ranges and text to "exit" event
      CodeMirror.signal(self, "exit", allGroupResults);
    }
  };
  function LinkedPosition(doc, from, to) {
    this.doc = doc;
    this.from = from;
    this.to = to;
  }
  function LinkedPositionGroup(posArray, options) {
    var self = this;
    options = options || {};

    // TODO sanity check that positions (1) don't overlap and (2) are on the same line
    this.positions = [];

    // Convert raw positions into LinkedPosition
    makeArray(posArray).forEach(function (rangeOrPosition) {
      var p;
      if (rangeOrPosition instanceof LinkedPosition)
        p = rangeOrPosition;
      else
        p = new LinkedPosition(options.doc, rangeOrPosition.from, rangeOrPosition.to);
      self.positions.push(p);
    });

    this.markers = [];

    this.options = {
      stopOnAllPositions: options.stopOnAllPositions || false
    };
  }
  function enterLinkedMode(model) {
    console.assert(model);

    // TODO support nested linked modes
    if (_currentModel /* && !_currentModel.options.allowNested */)
      _currentModel.exit(false);

    _currentModel = model;
    _currentModel._enter();
  }
  CodeMirror.LinkedPosition = LinkedPosition;
  CodeMirror.LinkedModeModel = LinkedModeModel;
  CodeMirror.LinkedPositionGroup = LinkedPositionGroup;
  CodeMirror.defineExtension("enterLinkedMode", enterLinkedMode);
}());
