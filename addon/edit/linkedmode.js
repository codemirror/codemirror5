/*jslint indent: 2, nomen: true, vars: true, plusplus: true*/
/*global document, CodeMirror*/
(function () {
  "use strict";
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
  function LinkedMode(cm, groupArray, options) {
    this.cm = cm;
    this.doc = cm.doc;
    this.groups = makeArray(groupArray);
    this.options = {
      noCycle: (options && options.noCycle) || false,
      rangeClassName: (options && options.positionClassName) || "CodeMirror-linkedmode-range",
      emptyClassName: (options && options.exitClassName) || "CodeMirror-linkedmode-empty"
    };
  }
  LinkedMode.prototype = {
    on: function (type, f) {
      CodeMirror.on(this, type, f);
    },
    off: function (type, f) {
      CodeMirror.off(this, type, f);
    },
    _createMarker: function (from, to, group, isFirst) {
      var marker;
      
      if (isRangeEmpty(from, to)) {
        marker = this.doc.setBookmark(from, { widget: emptyRangeSpan(this.options.emptyClassName) });
      } else {
        marker = this.doc.markText(from, to, {
          className: this.options.rangeClassName,
          clearWhenEmpty: false,
          inclusiveLeft: false,
          inclusiveRight: true
        });
      }
      
      marker.originalStartPos = from;
      marker.linkedModeGroup = group;

      // Stop on the first marker by default unless specified in options
      marker.isStop = isFirst || (group.options && group.options.stopOnAllPositions);
      
      return marker;
    },
    setExit: function (posOrRange) {
      this.exitRange = posOrRange.from ? posOrRange : { from: posOrRange, to: posOrRange };
    },
    _getMarkerAt: function (pos) {
      var markers = this.doc.findMarksAt(pos),
        found;
      
      // linked mode markers will not overlap, return the first linked mode marker
      markers.some(function (marker) {
        if (marker.linkedModeGroup) {
          found = marker;
          return true;
        }

        return false;
      });
      
      return found;
    },
    _getMarkerAtCursor: function () {
      return this._getMarkerAt(this.cm.getCursor());
    },
    _onBeforeChange: function (cm, changeObj) {
      // Prevent overlapping edits
      // Ignore undo/redo changes with a line break
      var self = this,
        hasLineBreak = changeObj.text.length > 1,
        isUndoRedo = !changeObj.update,
        skip = self.lock || hasLineBreak || isUndoRedo;

      if (skip) {
        if (hasLineBreak) {
          // Do not move to the the exit cursor position
          self.stop(false);
        }

        return;
      }

      var fromMarker = self._getMarkerAt(changeObj.from),
        toMarker = self._getMarkerAt(changeObj.to);

      if (fromMarker && toMarker && (fromMarker === toMarker)) {
        // Prevent the new operation from creating an overlapping edit
        self.lock = true;

        // Update within a marker, cancel this change update update all markers in batch
        changeObj.cancel();

        // Assumes marker and change are on the same line
        var group = fromMarker.linkedModeGroup,
          targetRange = self._findMarker(fromMarker),
          offsetStart = changeObj.from.ch - targetRange.from.ch,
          offsetEnd = changeObj.to.ch - targetRange.to.ch,
          replaceMarker = (offsetStart === 0 && offsetEnd === 0),
          text = changeObj.text[0],
          range,
          from,
          to;

        // Update all markers in the group
        cm.operation(function () {
          var marks = group.markers.slice(0);

          marks.forEach(function (m, i) {
            // We should only have valid ranges
            range = self._findMarker(m);
            console.assert(range);

            // Add offset to range
            from = { line: range.from.line, ch: range.from.ch += offsetStart };
            to   = { line: range.to.line,   ch: range.to.ch += offsetEnd };
            
            cm.replaceRange(text, from, to, changeObj.origin);

            if (replaceMarker) {
              // Clear the old marker
              m.clear();

              var updateRangeTo = { line: range.from.line, ch: range.from.ch + text.length };
              group.markers[i] = self._createMarker(range.from, updateRangeTo, group, i === 0);
            }
          });

          if (replaceMarker)
            self._invalidateSortedMarkers();

          // Release lock
          self.lock = false;
        });
      } else {
        // Update (1) not in any marker or (2) spans different markers
        self.stop(false);
      }
    },
    _nextMarker: function (currentMarker) {
      var marker,
        nextMarker,
        index = 0,
        sortedMarkers = this._getSortedMarkers();

      if ((currentMarker === this.exitMarker) && this.options.noCycle) {
        // Do not cycle if we're current at the exit position
        return;
      } else {
        index = sortedMarkers.indexOf(currentMarker) + 1;
      }

      while (!nextMarker) {
        marker = sortedMarkers[index++];

        if (!marker) {
          // No more markers, exit
          nextMarker = this.exitMarker;
        } else if (marker.isStop) {
          nextMarker = marker;
        }
      }

      return nextMarker;
    },
    _onKeyDown: function (cm, event) {
      if (event.keyCode === 27) {
        // ESC, stop linked mode without changing cursor
        this.stop(false);
        return;
      }

      var marker = this._getMarkerAtCursor();

      if (event.keyCode === 13) {
        // ENTER, stop linked mode optionally at stop position
        var isAtMarker = !!marker;
        
        // do not insert line break if within a linked position
        if (isAtMarker) {
          event.preventDefault();
        }
        
        this.stop(isAtMarker);
      } else if (event.keyCode === 9) {
        // TAB, move to next linked position
        var nextMarker;
        
        if (!marker) {
          // tab key outside all linked positions, always go to first marker 
          nextMarker = this._getSortedMarkers()[0];
        } else {
          nextMarker = this._nextMarker(marker);
        }
        
        // do not insert tab char
        event.preventDefault();

        if (nextMarker)
          this._goToMarker(nextMarker);
        else
          this.stop(true);
      }
    },
    _findMarker: function (marker) {
      var range = marker.find();

      if (range && range.from)
        return range;

      // Convert a bookmark position to a range
      return { from: range, to: range };
    },
    _goToMarker: function (marker) {
      var range = this._findMarker(marker);
      this.doc.setSelection(range.from, range.to);
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
          // flat list of all markers
          _sortedMarkers.push(m);
        });
      });

      // sort markers by offset in document
      _sortedMarkers = _sortedMarkers.sort(function (a, b) {
        var lineCompare = a.originalStartPos.line - b.originalStartPos.line;

        if (lineCompare !== 0) {
          return lineCompare;
        }

        return a.originalStartPos.ch - b.originalStartPos.ch;
      });

      return _sortedMarkers;
    },
    start: function () {
      var self = this;

      this.groups.forEach(function (group) {
        group.positions.forEach(function (pos, index) {
          var marker = self._createMarker(pos.from, pos.to, group, (index === 0));

          // Store markers with the group
          group.markers.push(marker);
        });
        
        // positions are invalid once linked mode is active, clear them
        group.positions = null;
      });
      
      // mark the exit position
      if (this.exitRange) {
        this.exitMarker = this._createMarker(this.exitRange.from, this.exitRange.to, "exit");
        
        // clear exit position
        this.exitRange = null;
      }
      
      // install keydown event handler
      this._onKeyDown = this._onKeyDown.bind(this);
      this.cm.on("keydown", this._onKeyDown);

      // use beforeChange events to detect which markers to repair
      this._onBeforeChange = this._onBeforeChange.bind(this);
      this.cm.on("beforeChange", this._onBeforeChange);
      
      // select the first marker
      this._goToMarker(this._getSortedMarkers()[0]);
    },
    stop: function (goToExit) {
      var self = this,
        allGroupResults = [],
        range,
        res,
        from,
        to;

      this.groups.forEach(function (group) {
        res = { ranges: [], text: null };

        group.markers.forEach(function (marker) {
          range = self._findMarker(marker);
          res.ranges.push(range);

          if (range && !res.text)
            res.text = self.cm.getRange(range.from, range.to);
          
          marker.clear();
        });
        
        allGroupResults.push(res);
      });
      
      // set selection at exit position
      if (this.exitMarker) {
        if (goToExit) {
          this._goToMarker(this.exitMarker);
        }
        
        this.exitMarker.clear();
        this.exitMarker = null;
      }
      
      this.cm.off("keydown", this._onKeyDown);
      this.cm.off("beforeChange", this._onBeforeChange);

      // Pass ranges and text to "stop" event
      CodeMirror.signal(this, "stop", allGroupResults);
    }
  };
  function LinkedModeGroup(posArray, options) {
    options = options || {};

    // TODO sanity check that positions (1) don't overlap and (2) are on the same line
    this.positions = makeArray(posArray);
    this.markers = [];

    this.options = {
      stopOnAllPositions: options.stopOnAllPositions || false
    };
  }
  CodeMirror.defineExtension("getLinkedMode", function (groupArray, options) {
    return new LinkedMode(this, groupArray, options);
  });
  CodeMirror.defineExtension("getLinkedGroup", function (posArray) {
    return new LinkedModeGroup(posArray);
  });
  CodeMirror.defineExtension("getLinkedGroups", function (arr, options) {
    var groups = [];
    makeArray(arr).forEach(function (posOrArray) {
      groups.push(new LinkedModeGroup(posOrArray, options));
    });
    return groups;
  });
}());
