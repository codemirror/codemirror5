/*jslint indent: 2, nomen: true, vars: true, plusplus: true*/
/*global document, CodeMirror*/
// TODO

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
      rangeClassName: (options && options.positionClassName) || "CodeMirror-linkedmode-range",
      emptyClassName: (options && options.exitClassName) || "CodeMirror-linkedmode-empty"
    };
  }
  LinkedMode.prototype = {
    _createMarker: function (from, to, group) {
      var marker;
      
      if (isRangeEmpty(from, to)) {
        marker = this.doc.setBookmark(from, { widget: emptyRangeSpan(this.options.emptyClassName) });
      } else {
        marker = this.doc.markText(from, to, { className: this.options.rangeClassName });
      }
      
      marker.linkedModeGroup = group;
      
      CodeMirror.on(marker, "clear", function (cm) { console.log("clear")});
      CodeMirror.on(marker, "hide", function (cm) { console.log("hide")});
      CodeMirror.on(marker, "unhide", function (cm) { console.log("unhide")});
      
      return marker;
    },
    addGroup: function (group) {
      this.groups.push(group);
    },
    setExitPosition: function (pos) {
      this.exitPos = pos;
    },
    _getMarkerAtCursor: function () {
      var markers = this.doc.findMarksAt(this.cm.getCursor()),
        found;
      
      // linked mode markers will not overlap, return the first linked mode marker
      markers.some(function (marker) {
        if (marker.linkedModeGroup) {
          found = marker;
        }
      });
      
      return found;
    },
    _onChange: function (cm, changeObj) {
      // TODO create a new marker if the change range matches an existing position and the change inserts text
      // TODO convert a marker to a bookmark if the change range matches an existing position and the exact range of text is deleted
      // TODO convert a bookmark to a mark if the change range starts at a bookmark
    },
    _onKeyDown: function (cm, event) {
      if (event.keyCode === 13) {
        // ENTER, stop linked mode optionally at stop position
        var isAtMarker = !!this._getMarkerAtCursor();
        
        // do not insert line break if within a linked position
        if (isAtMarker) {
          event.preventDefault();
        }
        
        this.stop(isAtMarker);
      } else if (event.keyCode === 27) {
        // ESC, stop linked mode without changing cursor
        this.stop(false);
      } else if (event.keyCode === 9) {
        // TAB, move to next linked position
        var marker = this._getMarkerAtCursor(),
          nextMarkerIndex,
          nextMarker;
        
        if (!marker) {
          // tab key outside all linked positions, stop linked mode
          this.stop(false);
          return;
        }
        
        if (marker === this.exitMarker) {
          // cycle to first marker
          // TODO support for no-cycle
          nextMarker = this.groups[0].markers[0];
        } else {
          // find the marker sequence within the parent group
          nextMarkerIndex = marker.linkedModeIndex + 1;
          
          // TODO support NO_STOP positions
          if (nextMarkerIndex < marker.linkedModeGroup.markers.length) {
            // go to the next position in the same group
            nextMarker = marker.linkedModeGroup.markers[nextMarkerIndex];
          } else {
            // go to the first position in the next group
            var nextGroupIndex = this.groups.indexOf(marker.linkedModeGroup) + 1;
            
            if (nextGroupIndex < this.groups.length) {
              nextMarker = this.groups[nextGroupIndex].markers[0];
            }
          }
        }
        
        // do not insert tab char
        event.preventDefault();
        
        if (!nextMarker) {
          nextMarker = this.exitMarker;
        }
        
        this._goToMarker(nextMarker);
      }
    },
    _goToMarker: function (marker) {
      var pos = marker.find();
      this.doc.setSelection(pos.from || pos, pos.to);
    },
    start: function () {
      var self = this,
        firstMarker;
      
      // mark all positions from each group
      this.groups.forEach(function (group) {
        group.positions.forEach(function (pos, index) {
          var marker = self._createMarker(pos.from, pos.to, group);
          marker.linkedModeIndex = index;
          group.markers.push(marker);
          
          if (!firstMarker) {
            firstMarker = marker;
          }
        });
        
        // positions are invalid once linked mode is active, clear them
        group.positions = null;
      });
      
      // mark the exit position
      if (this.exitPos) {
        this.exitMarker = this._createMarker(this.exitPos.from, this.exitPos.to || this.exitPos.from, "exit");
        
        // clear exit position
        this.exitPos = null;
      }
      
      // install keydown event handler
      this._onKeyDown = this._onKeyDown.bind(this);
      this.cm.on("keydown", this._onKeyDown);
      
      // select the first marker
      this._goToMarker(firstMarker);
    },
    stop: function (goToExit) {
      // clear markers
      this.groups.forEach(function (group) {
        var marker;
        
        group.markers.forEach(function (marker) {
          marker.clear();
        });
        
        group.markers = null;
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
    }
  };
  function LinkedModeGroup(posArray) {
    this.positions = makeArray(posArray);
    this.markers = [];
  }
  CodeMirror.defineExtension("getLinkedMode", function (groupArray, options) {
    return new LinkedMode(this, groupArray, options);
  });
  CodeMirror.defineExtension("getLinkedGroup", function (posArray) {
    return new LinkedModeGroup(posArray);
  });
  CodeMirror.defineExtension("getLinkedGroups", function (arr) {
    var groups = [];
    makeArray(arr).forEach(function (posOrArray) {
      groups.push(new LinkedModeGroup(posOrArray));
    });
    return groups;
  });
}());
