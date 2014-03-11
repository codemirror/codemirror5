/*jslint indent: 2, nomen: true, vars: true, plusplus: true*/
/*global JSON, document, CodeMirror*/
// declare global: JSON
/**
 * Linked mode extension for CodeMirror.
 * Based on Eclipse http://help.eclipse.org/indigo/topic/org.eclipse.platform.doc.isv/reference/api/org/eclipse/jface/text/link/package-summary.html
 *
 * Define groups of ranges in one or more documents that are linked,
 * i.e. edits in one range are mirrored in all other ranges for that group.
 * When using multiple groups, the user may navigate through each group,
 * optionally cycling back to the original position. An optional exit position
 * defines where the cursor should move when editing is complete.
 *
 * Basic usage:
 *
 * // create linked positions/groups
 * var linkedPos1 = new CodeMirror.LinkedPositon(cm.doc, from1, to1);
 * var linkedGroup1 = new CodeMirror.LinkedPositionGroup([linkedPos1, ..., linkedPosN]);
 *
 * // create exit position (usually not a range, so `to` arg is omitted)
 * var exitPos = new CodeMirror.LinkedPosition(cm.doc, new CodeMirror.Pos(...));
 *
 * // create model
 * var model = new CodeMirror.LinkedModeModel([linkedGroup1, ..., linkedGroupN]);
 *
 * // register event handlers
 * // errorCallback(model:LinkedModeModel, err:string)
 * model.on("error", errorCallback);
 *
 * // TODO
 * // focusCallback(model:LinkedModeModel, linkedPosition:LinkedPosition, linkedGroup:LinkedGroup)
 * // cm.on("linkedModeFocus", focusCallback);
 *
 * // TODO
 * // blurCallback(model:LinkedModeModel, linkedPosition:LinkedPosition, linkedGroup:LinkedGroup)
 * // cm.on("linkedModeBlur", blurCallback);
 *
 * // exitCallback(model:LinkedModeModel, doit:boolean, results:array<{group:LinkedPositionGroup, ranges:array<{from:Pos, to:Pos}>, text:string}>)
 * model.on("exit", exitCallback);
 *
 * // enter linked mode
 * cm.enterLinkedMode(model);
 *
 * Advanced usage:
 * - Using LinkedPosition instance from different documents is supported
 * - By default, only the first position in a LinkedPositionGroup is allowed
 *   to be focused on TAB key travsersal. To enable all positions to be
 *   traversed, use the `stopOnAllPositions: boolean` option in the
 *   LinkedPositionGroup contstructor.
 * - LinkedModeModel contstructor options:
 *   - `noCycle: boolean` exit linked mode when the first or exit position is
 *      reached. Default: false.
 *   - `rangeClassName: string` CSS class for a LinkedPosition range.
 *      Default: CodeMirror-linkedmode-range.
 *   - `emptyClassName: string` CSS class for an empty LinkedPosition range.
 *      Default: CodeMirror-linkedmode-empty.
 *
 * Future plans:
 * - Nested linked modes
 * - Error checking for overlapping ranges
 * - linkedModeFocus and linkedModeBlur events
 * - Smart sorting based on LinkedPosition document
 * - Custom exit key codes (IExitPolicy)
 *
 * See demos/linkedmode.html for a more complete usage example.
 */
(function () {
  "use strict";
  var _currentModel;
  function eventMixin(ctor) {
    ctor.prototype.on = function(type, f) {CodeMirror.on(this, type, f);};
    ctor.prototype.off = function(type, f) {CodeMirror.off(this, type, f);};
  }
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

    if (!range)
      return false;

    if (range.from)
      return range;

    // Convert a bookmark position to a range
    return { from: range, to: range };
  }
  function getMarkerAt(doc, pos, type) {
    var markers = doc.findMarksAt(pos),
      found;

    // linked mode markers will not overlap, return the first linked mode marker
    markers.some(function (marker) {
      if (marker.linkedPosition && (!type || (marker.type === type))) {
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
    marker.off("hide");
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
    this._mapPositionsToGroup = {};
  }
  eventMixin(LinkedModeModel);
  LinkedModeModel.prototype = {
    _createMarker: function (doc, from, to, linkedPos, index) {
      var self = this,
        marker,
        isBookmark = isRangeEmpty(from, to),
        editor = doc.getEditor(),
        group = self._lookupGroup(linkedPos);

      if (isBookmark) {
        marker = doc.setBookmark(from, { widget: emptyRangeSpan(this.options.emptyClassName) });
      } else {
        marker = doc.markText(from, to, {
          className: this.options.rangeClassName,
          clearWhenEmpty: false,
          inclusiveLeft: true,
          inclusiveRight: true
        });
      }

      // Track all CodeMirror instances
      if (editor && (this._codeMirrorInstances.indexOf(editor) < 0))
        this._codeMirrorInstances.push(editor);

      // Save all TextMarkers to clear when we exit linked mode
      this._marks.push(marker);

      marker.linkedPosition = linkedPos;

      // Restore the original marker on undo
      if (!isBookmark) {
        marker.on("unhide", function () {
          linkedPos.marker = marker;
          self._invalidateSortedPositions();
        });

        // Restore prior bookmarks
        var previous = linkedPos.marker;
        if (previous && previous.type === "bookmark") {
          marker.on("hide", function () {
            linkedPos.marker = previous;
            self._invalidateSortedPositions();
          });
        }
      }

      // Stop on the first marker by default unless specified in options
      linkedPos.isStop = (index === 0) || !group || (group.options && group.options.stopOnAllPositions);

      return marker;
    },
    setExit: function (position) {
      this.exitPosition = position;
    },
    _lookupGroup: function (linkedPos) {
      return this._mapPositionsToGroup[linkedPos];
    },
    _onBeforeChange: function (cm, changeObj) {
      // Prevent overlapping edits
      // Ignore undo/redo or changes with a line break
      var self = this,
        editDoc = cm.getDoc(),
        hasLineBreak = changeObj.text.length > 1,
        isUndo = changeObj.origin === "undo",
        isRedo = changeObj.origin === "redo",
        changeGeneration = (isUndo) ? self.changeGeneration - 1 : self.changeGeneration,
        // FIXME editDoc.changeGeneration() is wrong after previous undo? Should use editDoc.isClean(changeGeneration) here
        isClean = editDoc.changeGeneration() <= changeGeneration,
        skip = hasLineBreak || isUndo || isRedo;

      if (self.lock || skip) {
        // Exit if inserting a line break or undoing linkedmode
        if (hasLineBreak || (isUndo && isClean)) {
          // Do not move to the the exit cursor position
          self.exit(false);
        }
        return;
      }

      var toMarker = getMarkerAt(editDoc, changeObj.to),
        fromMarker = getMarkerAt(editDoc, changeObj.from, toMarker && toMarker.type),
        exitMarker = this.exitPosition.marker,
        isExit = (fromMarker === exitMarker) || (toMarker === exitMarker),
        isSameMarker = fromMarker && toMarker && (fromMarker === toMarker),
        targetRange = findMarker(fromMarker);

      if (!isExit && isSameMarker && targetRange) {
        // Prevent the new operation from creating an overlapping edit
        self.lock = true;

        // Update within a marker, cancel this change update update all markers in batch
        changeObj.cancel();

        // Assumes marker and change are on the same line
        var group = self._lookupGroup(fromMarker.linkedPosition),
          offsetStart = changeObj.from.ch - targetRange.from.ch,
          offsetEnd = changeObj.to.ch - targetRange.to.ch,
          doReplaceMarker = (offsetStart === 0 && offsetEnd === 0),
          text = changeObj.text[0],
          marker,
          range,
          from,
          to;

        // Update all markers in the group
        cm.operation(function () {
          group.positions.forEach(function (linkedPos, i) {
            // We should only have valid ranges
            marker = linkedPos.marker;
            range = findMarker(marker);

            if (!range)
              return;

            // Add offset to range
            from = new CodeMirror.Pos(range.from.line, range.from.ch += offsetStart);
            to   = new CodeMirror.Pos(range.to.line,   range.to.ch += offsetEnd);

            marker.doc.replaceRange(text, from, to, changeObj.origin);

            // Replace the old marker if it was hidden due to edits
            if (doReplaceMarker) {
              var updateRangeTo = new CodeMirror.Pos(range.from.line, range.from.ch + text.length),
                replacementMarker = self._createMarker(linkedPos.doc, range.from, updateRangeTo, linkedPos, i);

              linkedPos.marker = replacementMarker;
            }
          });

          if (doReplaceMarker)
            self._invalidateSortedPositions();

          // Release lock
          self.lock = false;
        });
      } else {
        // Update (1) not in any marker, (2) spans different markers or (3)
        // target marker range is invalid
        self.exit(false);
      }
    },
    _nextPosition: function (currentPosition, dir) {
      var linkedPos,
        nextPosition,
        sortedPositions = this._getSortedPositions(),
        index = (dir > 0) ? 0 : sortedPositions.length - 1,
        isExit = (currentPosition === this.exitPosition),
        isFirst = (currentPosition === sortedPositions[0]);

      if (this.options.noCycle) {
        if ((isExit && (dir > 0)) || (isFirst && (dir < 0)))
          return;
      } else if (!isExit) {
        index = sortedPositions.indexOf(currentPosition) + dir;
      }

      while (!nextPosition) {
        linkedPos = sortedPositions[index];
        index = index + dir;

        if (!linkedPos) {
          // No more positions, go to exit or first position if no exit specified
          nextPosition = this.exitPosition || sortedPositions[0];
        } else if (linkedPos.isStop) {
          nextPosition = linkedPos;
        }
      }

      return nextPosition;
    },
    _onKeyDown: function (cm, event) {
      if (event.keyCode === 27) {
        // ESC, exit linked mode without changing cursor
        this.exit(false);
        return;
      }

      var marker = getMarkerAtCursor(cm);

      if (event.keyCode === 13) {
        // ENTER key, exit linked mode optionally at exit position
        var isAtMarker = !!marker;

        // do not insert line break if within a linked position
        if (isAtMarker) {
          event.preventDefault();
        }

        this.exit(isAtMarker);
      } else if (event.keyCode === 9) {
        // TAB, move to next linked position
        var nextPosition,
          dir = (event.shiftKey) ? -1 : 1;

        if (!marker) {
          // tab key outside all linked positions, always go to first marker
          nextPosition = this._getSortedPositions()[0];
        } else {
          nextPosition = this._nextPosition(marker.linkedPosition, dir);
        }

        // do not insert tab char
        event.preventDefault();

        if (nextPosition)
          this._goToMarker(nextPosition.marker);
        else
          this.exit(true);
      }
    },
    _goToMarker: function (marker) {
      var range = findMarker(marker);

      if (range) {
        marker.doc.setSelection(range.from, range.to);
        marker.doc.getEditor().focus();
      }
    },
    _invalidateSortedPositions: function () {
      this._sortedPositions = null;
    },
    _getSortedPositions: function () {
      if (this._sortedPositions)
        return this._sortedPositions;

      var _sortedPositions = [];
      this._sortedPositions = _sortedPositions;

      this.groups.forEach(function (group) {
        group.positions.forEach(function (linkedPos) {
          // Update start position in document
          var range = findMarker(linkedPos.marker);
          linkedPos._pos = (range && range.from) || { line: Number.MAX_VALUE, ch: Number.MAX_VALUE };

          // flat list of all markers
          _sortedPositions.push(linkedPos);
        });
      });

      // TODO real sorting with markers from multiple documents
      // sort markers by start position in document
      _sortedPositions = _sortedPositions.sort(function (a, b) {
        var docCompare = a.marker.doc.id - b.marker.doc.id;

        if (docCompare !== 0)
          return docCompare;

        var lineCompare = a._pos.line - b._pos.line;

        if (lineCompare !== 0)
          return lineCompare;

        return a._pos.ch - b._pos.ch;
      });

      return _sortedPositions;
    },
    _doEnter: function (cm) {
      var self = this,
        error = false;

      // Save the original changeGeneration so we can exit linkedmode if undone
      self.changeGeneration = cm.getDoc().changeGeneration(true);

      function _tryCreateMarker(doc, from, to, linkedPos, index) {
        var tryMarker;

        try {
          tryMarker = self._createMarker(doc, from, to, linkedPos, index);
        } catch (err) {
          error = true;
          CodeMirror.signal(self, "error", self, err);
        }

        return tryMarker;
      }

      self.groups.forEach(function (group) {
        group.positions.forEach(function (linkedPos, index) {
          self._mapPositionsToGroup[linkedPos] = group;
          linkedPos.marker = _tryCreateMarker(linkedPos.doc, linkedPos._from, linkedPos._to, linkedPos, index);
        });
      });

      var sortedPositions = self._getSortedPositions(),
        firstPos = sortedPositions[0];

      if (!firstPos)
        CodeMirror.signal(self, "error", self, "No LinkedPosition found");

      // mark the exit position
      if (self.exitPosition)
        self.exitPosition.marker = _tryCreateMarker(self.exitPosition.doc, self.exitPosition._from, self.exitPosition._to, self.exitPosition);

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

      // Save current model
      _currentModel = self;

      // select the first marker
      self._goToMarker(firstPos.marker);

      return true;
    },
    _enter: function (cm) {
      var doEnter = this._doEnter(cm);
      if (!doEnter)
        this.exit(false);

      return doEnter;
    },
    exit: function (goToExit) {
      var self = this,
        allGroupResults = [],
        range,
        res;

      self.groups.forEach(function (group) {
        res = { group: group, ranges: [], text: null };

        group.positions.forEach(function (linkedPos) {
          range = findMarker(linkedPos.marker);

          if (range && !res.text) {
            res.ranges.push(range);
            res.text = linkedPos.marker.doc.getRange(range.from, range.to);
          }
        });

        allGroupResults.push(res);
      });
      self.groups = [];

      // set selection at exit position
      if (self.exitPosition && goToExit) {
        self._goToMarker(self.exitPosition.marker);
      }

      self._marks.forEach(function (marker) {
        clearMarker(marker);
      });
      self._marks = [];

      self._codeMirrorInstances.forEach(function (cm) {
        cm.off("keydown", self._onKeyDown);
        cm.off("beforeChange", self._onBeforeChange);
      });

      // Remove all state
      self._codeMirrorInstances = [];
      self._mapPositionsToGroup = {};
      _currentModel = null;

      // Pass ranges and text to "exit" event
      allGroupResults.forEach(function (res) {
        CodeMirror.signal(res.group, "exit", res.group, res);
      });
      CodeMirror.signal(self, "exit", self, goToExit, allGroupResults);
    }
  };
  function LinkedPosition(doc, from, to) {
    this.doc = doc;
    this._from = from;
    this._to = to;
    this.marker = null;
  }
  LinkedPosition.prototype = {
    toString: function () {
      return this.doc.id + JSON.stringify(this._from) + JSON.stringify(this._to);
    }
  };
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

    this.options = {
      stopOnAllPositions: options.stopOnAllPositions || false
    };
  }
  eventMixin(LinkedPositionGroup);
  function enterLinkedMode(model) {
    console.assert(model);

    // TODO support nested linked modes
    if (_currentModel /* && !_currentModel.options.allowNested */)
      _currentModel.exit(false);

    model._enter(this);
  }
  CodeMirror.LinkedPosition = LinkedPosition;
  CodeMirror.LinkedModeModel = LinkedModeModel;
  CodeMirror.LinkedPositionGroup = LinkedPositionGroup;
  CodeMirror.defineExtension("enterLinkedMode", enterLinkedMode);
}());
