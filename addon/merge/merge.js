// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE


/**
 * Changes
 * Making getDiff function configurable, so that user can use any diff algorithm
 * that he/she wants. Also changing the expected diff format so that move
 * operations can be supported. I have patched the output of diff-match-patch
 * to make it similar to the new diff format that is supported by merge.js
 */
(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";
  var Pos = CodeMirror.Pos;
  var svgNS = "http://www.w3.org/2000/svg";

  var DiffType = {
    DIFF_EQUAL: 0,
    DIFF_INSERT: 1,
    DIFF_DELETE: -1,
    DIFF_CHANGED: 2,
    DIFF_MOVED_IN: 3,
    DIFF_MOVED_OUT: 4,
    DIFF_MOVED_CHANGED: 5,
    DIFF_MOVED_CHANGED_OUT: 6
  };

  var EditorType = {
    LHS: -1,
    RHS: 1
  };


  /**
   * The diff algorithm returns a sequence of the following DiffChunk objects,
   * each of which represents an operation that when applied will convert source
   * text to destination text. It also stores metadata like line numbers to
   * represent a move operation of some text in source to destination.
   *
   * DiffChunk can contain recursive sub-chunks because it needs to be
   * expressive enough to represent insert and deletes within a move operation."
   */
  CodeMirror.DiffChunk = function(type, lhsStart, lhsEnd, rhsStart, rhsEnd,
      opt_chunks) {

    /**
     * The type of DiffChunk. It defined whether this chunk was unchanged,
     * changed, added, deleted or moved.
     * @type {DiffType}
     */
    this.type = type;

    /**
     * The starting line index of the chunk in left text.
     * @type {Pos}
     */
    this.lhsStart = lhsStart;

    /**
     * The ending line index of the chunk in left text.
     * @type {Pos}
     */
    this.lhsEnd = lhsEnd;

    /**
     * The starting line index of the chunk in right text.
     * @type {Pos}
     */
    this.rhsStart = rhsStart;

    /**
     * The ending line index of the chunk in right text.
     * @type {Pos}
     */
    this.rhsEnd = rhsEnd;

    /**
     * This is not calculated in this file, diffmergedirective.js will call
     * rediff again on changed section and then calculate the diff on word level
     * and fill this array.
     * @type {!Array.<DiffChunk>}
     */
    this.chunks = opt_chunks ? opt_chunks : [];
  };
  var DiffChunk = CodeMirror.DiffChunk;

  function DiffView(mv, type) {
    this.mv = mv;
    this.type = type;
    this.classes = type == "left"
      ? {chunk: "CodeMirror-merge-l-chunk",
         start: "CodeMirror-merge-l-chunk-start",
         end: "CodeMirror-merge-l-chunk-end",
         insert: "CodeMirror-merge-l-inserted",
         del: "CodeMirror-merge-l-deleted",
         connect: "CodeMirror-merge-l-connect",
         movedChunk: "CodeMirror-merge-l-chunk-moved"}
      : {chunk: "CodeMirror-merge-r-chunk",
         start: "CodeMirror-merge-r-chunk-start",
         end: "CodeMirror-merge-r-chunk-end",
         insert: "CodeMirror-merge-r-inserted",
         del: "CodeMirror-merge-r-deleted",
         connect: "CodeMirror-merge-r-connect",
         movedChunk: "CodeMirror-merge-r-chunk-moved"};
  }

  DiffView.prototype = {
    constructor: DiffView,
    init: function(pane, orig, options) {
      this.edit = this.mv.edit;
      this.orig = CodeMirror(pane, copyObj({value: orig, readOnly: true}, copyObj(options)));

      // User can pass getDiff function based on which diff algo he/she wants to
      // use.
      if (options.getDiff) {
        this.getDiff = options.getDiff;
      }

      this.diff = this.getDiff(asString(orig), asString(options.value));
      this.diffOutOfDate = false;

      this.showDifferences = options.showDifferences !== false;
      this.forceUpdate = registerUpdate(this);
      setScrollLock(this, true, false);
      registerScroll(this);
    },
    setShowDifferences: function(val) {
      val = val !== false;
      if (val != this.showDifferences) {
        this.showDifferences = val;
        this.forceUpdate("full");
      }
    }
  };

  function ensureDiff(dv) {
    if (dv.diffOutOfDate) {
      dv.diff = dv.getDiff(dv.orig.getValue(), dv.edit.getValue());
      dv.diffOutOfDate = false;
      CodeMirror.signal(dv.edit, "updateDiff", dv.diff);
    }
  }

  function registerUpdate(dv) {
    var edit = {from: 0, to: 0, marked: []};
    var orig = {from: 0, to: 0, marked: []};
    var debounceChange;
    function update(mode) {
      if (mode == "full") {
        if (dv.svg) clear(dv.svg);
        if (dv.copyButtons) clear(dv.copyButtons);
        clearMarks(dv.edit, edit.marked, dv.classes);
        clearMarks(dv.orig, orig.marked, dv.classes);
        edit.from = edit.to = orig.from = orig.to = 0;
      }
      ensureDiff(dv);
      if (dv.showDifferences) {
        updateMarks(dv.edit, dv.diff, edit, DiffType.DIFF_INSERT, dv.classes);
        updateMarks(dv.orig, dv.diff, orig, DiffType.DIFF_DELETE, dv.classes);
      }
      drawConnectors(dv);
    }
    function set(slow) {
      clearTimeout(debounceChange);
      debounceChange = setTimeout(update, slow == true ? 250 : 100);
    }
    function change() {
      if (!dv.diffOutOfDate) {
        dv.diffOutOfDate = true;
        edit.from = edit.to = orig.from = orig.to = 0;
      }
      set(true);
    }
    dv.edit.on("change", change);
    dv.orig.on("change", change);
    dv.edit.on("markerAdded", set);
    dv.edit.on("markerCleared", set);
    dv.orig.on("markerAdded", set);
    dv.orig.on("markerCleared", set);
    dv.edit.on("viewportChange", set);
    dv.orig.on("viewportChange", set);
    update();
    return update;
  }

  function registerScroll(dv) {
    dv.edit.on("scroll", function() {
      syncScroll(dv, DiffType.DIFF_INSERT) && drawConnectors(dv);
    });
    dv.orig.on("scroll", function() {
      syncScroll(dv, DiffType.DIFF_DELETE) && drawConnectors(dv);
    });
  }

  function syncScroll(dv, type) {
    // Change handler will do a refresh after a timeout when diff is out of date
    if (dv.diffOutOfDate) return false;
    if (!dv.lockScroll) return true;
    var editor, other, now = +new Date;
    if (type == DiffType.DIFF_INSERT) { editor = dv.edit; other = dv.orig; }
    else { editor = dv.orig; other = dv.edit; }
    // Don't take action if the position of this editor was recently set
    // (to prevent feedback loops)
    if (editor.state.scrollSetBy == dv && (editor.state.scrollSetAt || 0) + 50 > now) return false;

    var sInfo = editor.getScrollInfo(), halfScreen = .5 * sInfo.clientHeight, midY = sInfo.top + halfScreen;
    var mid = editor.lineAtHeight(midY, "local");
    var around = chunkBoundariesAround(dv.diff, mid, type == DiffType.DIFF_INSERT);
    var off = getOffsets(editor, type == DiffType.DIFF_INSERT ? around.edit : around.orig);
    var offOther = getOffsets(other, type == DiffType.DIFF_INSERT ? around.orig : around.edit);
    var ratio = (midY - off.top) / (off.bot - off.top);
    var targetPos = (offOther.top - halfScreen) + ratio * (offOther.bot - offOther.top);

    var botDist, mix;
    // Some careful tweaking to make sure no space is left out of view
    // when scrolling to top or bottom.
    if (targetPos > sInfo.top && (mix = sInfo.top / halfScreen) < 1) {
      targetPos = targetPos * mix + sInfo.top * (1 - mix);
    } else if ((botDist = sInfo.height - sInfo.clientHeight - sInfo.top) < halfScreen) {
      var otherInfo = other.getScrollInfo();
      var botDistOther = otherInfo.height - otherInfo.clientHeight - targetPos;
      if (botDistOther > botDist && (mix = botDist / halfScreen) < 1)
        targetPos = targetPos * mix + (otherInfo.height - otherInfo.clientHeight - botDist) * (1 - mix);
    }

    other.scrollTo(sInfo.left, targetPos);
    other.state.scrollSetAt = now;
    other.state.scrollSetBy = dv;
    return true;
  }

  function getOffsets(editor, around) {
    var bot = around.after;
    if (bot == null) bot = editor.lastLine() + 1;
    return {top: editor.heightAtLine(around.before || 0, "local"),
            bot: editor.heightAtLine(bot, "local")};
  }

  function setScrollLock(dv, val, action) {
    dv.lockScroll = val;
    if (val && action != false) syncScroll(dv, DiffType.DIFF_INSERT) && drawConnectors(dv);
    dv.lockButton.innerHTML = val ? "\u21db\u21da" : "\u21db&nbsp;&nbsp;\u21da";
  }

  // Updating the marks for editor content

  function clearMarks(editor, arr, classes) {
    for (var i = 0; i < arr.length; ++i) {
      var mark = arr[i];
      if (mark instanceof CodeMirror.TextMarker ||
          mark instanceof CodeMirror.LineWidget) {
        mark.clear();
      } else if (mark.parent) {
        editor.removeLineClass(mark, "background", classes.chunk);
        editor.removeLineClass(mark, "background", classes.start);
        editor.removeLineClass(mark, "background", classes.end);
        editor.removeLineClass(mark, "background", classes.movedChunk);
      }
    }
    arr.length = 0;
  }

  // FIXME maybe add a margin around viewport to prevent too many updates
  function updateMarks(editor, diff, state, type, classes) {
    var vp = editor.getViewport();
    editor.operation(function() {
      if (state.from == state.to || vp.from - state.to > 20 || state.from - vp.to > 20) {
        clearMarks(editor, state.marked, classes);
        markChanges(editor, diff, type, state.marked, vp.from, vp.to, classes);
        state.from = vp.from; state.to = vp.to;
      } else {
        if (vp.from < state.from) {
          markChanges(editor, diff, type, state.marked, vp.from, state.from, classes);
          state.from = vp.from;
        }
        if (vp.to > state.to) {
          markChanges(editor, diff, type, state.marked, state.to, vp.to, classes);
          state.to = vp.to;
        }
      }
    });
  }

  function markChanges(editor, diff, editorType, marks, from, to, classes) {
    var top = Pos(from, 0), bot = editor.clipPos(Pos(to - 1));
    var cls = editorType == EditorType.LHS ? classes.del : classes.insert;
    function markChunk(start, end, opt_moved) {
      var bfrom = Math.max(from, start), bto = Math.min(to, end);
      for (var i = bfrom; i < bto; ++i) {
        var line = editor.addLineClass(i, "background",
            move ? classes.movedChunk : classes.chunk);
        if (i == start) editor.addLineClass(line, "background", classes.start);
        if (i == end - 1) editor.addLineClass(line, "background", classes.end);
        marks.push(line);
      }
      // When the chunk is empty, make sure a horizontal line shows up
      if (start == end && bfrom == end && bto == end) {
        if (bfrom)
          marks.push(editor.addLineClass(bfrom - 1, "background", classes.end));
        else
          marks.push(editor.addLineClass(bfrom, "background", classes.start));
      }
    }

    var chunkStart = 0, chunkEnd = 0;
    var moveLineWidgetOptions = {coverGutter: true};
    for (var i = 0; i < diff.length; ++i) {
      var part = diff[i], diffType = part.type;

      // We have all information in DIFF_MOVED_IN and DIFF_MOVED_CHANGED, so
      // ignoring OUT diffs.
      if (diffType == DiffType.DIFF_MOVED_OUT ||
          diffType == DiffType.DIFF_MOVED_CHANGED_OUT) {
        continue;
      }

      var msg = document.createElement("div");
      msg.className = "Codemirror-moved-msg";
      var move = false;
      switch (editorType) {
        case EditorType.LHS:
          if (diffType == DiffType.DIFF_MOVED_IN ||
              diffType == DiffType.DIFF_MOVED_CHANGED) {
            move = true;
            if (from <= part.lhsStart.line - 1 && to > part.lhsStart.line - 1) {
              // TODO(mtaran): Add i18n support here.
              msg.appendChild(document.createTextNode("Lines " + (
                  part.lhsStart.line + 1) + "-" + (part.lhsEnd.line + 1) +
                  " moved to " + (part.rhsStart.line + 1) + "-" + (
                  part.rhsEnd.line + 1)));
              var lineWidget = editor.addLineWidget(part.lhsStart.line - 1, msg,
                  moveLineWidgetOptions);
              marks.push(lineWidget);
            }
          }
          if (diffType == DiffType.DIFF_INSERT) {
            chunkStart = chunkEnd;
          } else {
            chunkStart = part.lhsStart.line;
            chunkEnd = part.lhsEnd.line + 1;
          }
          break;
        case EditorType.RHS:
          if (diffType == DiffType.DIFF_MOVED_IN ||
              diffType == DiffType.DIFF_MOVED_CHANGED) {
            move = true;
            if (from <= part.rhsStart.line - 1 && to > part.rhsStart.line - 1) {
              // TODO(mtaran): Add i18n support here.
              msg.appendChild(document.createTextNode("Lines " + (
                  part.rhsStart.line + 1) + "-" + (part.rhsEnd.line + 1) +
                  " moved from " + (part.lhsStart.line + 1) + "-" + (
                  part.lhsEnd.line + 1)));
              var lineWidget = editor.addLineWidget(part.rhsStart.line - 1, msg,
                  moveLineWidgetOptions);
              marks.push(lineWidget);
            }
          }
          if (diffType == DiffType.DIFF_DELETE) {
            chunkStart = chunkEnd;
          } else {
            chunkStart = part.rhsStart.line;
            chunkEnd = part.rhsEnd.line + 1;
          }
          break;
      }

      switch (diffType) {
        case DiffType.DIFF_EQUAL:
          break;
        case DiffType.DIFF_CHANGED:
        case DiffType.DIFF_MOVED_CHANGED:
          for (var j = 0; j < part.chunks.length; j++) {
            var subChunk = part.chunks[j];
            if (subChunk.type == DiffType.DIFF_EQUAL)
              continue;
            var start, end;
            switch (editorType) {
              case EditorType.LHS:
                start = subChunk.lhsStart;
                end = subChunk.lhsEnd;
                break;
              case EditorType.RHS:
                start = subChunk.rhsStart;
                end = subChunk.rhsEnd;
                break;
            }
            if (start != null && end != null && !posEq(start, end))
              marks.push(editor.markText(start, end, {className: cls}));
          }
        case DiffType.DIFF_INSERT:
        case DiffType.DIFF_DELETE:
        case DiffType.DIFF_MOVED_IN:
          markChunk(chunkStart, chunkEnd, move);
          break;

      }
    }
  }

  // Updating the gap between editor and original

  function drawConnectors(dv) {
    if (!dv.showDifferences) return;

    if (dv.svg) {
      clear(dv.svg);
      var w = dv.gap.offsetWidth;
      attrs(dv.svg, "width", w, "height", dv.gap.offsetHeight);
    }
    if (dv.copyButtons) clear(dv.copyButtons);

    var flip = dv.type == "left";
    var vpEdit = dv.edit.getViewport(), vpOrig = dv.orig.getViewport();
    var sTopEdit = dv.edit.getScrollInfo().top, sTopOrig = dv.orig.getScrollInfo().top;
    iterateChunks(dv.diff, function(topOrig, botOrig, topEdit, botEdit) {
      if (topEdit > vpEdit.to || botEdit < vpEdit.from ||
          topOrig > vpOrig.to || botOrig < vpOrig.from)
        return;
      var topLpx = dv.orig.heightAtLine(topOrig, "local") - sTopOrig, top = topLpx;
      if (dv.svg) {
        var topRpx = dv.edit.heightAtLine(topEdit, "local") - sTopEdit;
        if (flip) { var tmp = topLpx; topLpx = topRpx; topRpx = tmp; }
        var botLpx = dv.orig.heightAtLine(botOrig, "local") - sTopOrig;
        var botRpx = dv.edit.heightAtLine(botEdit, "local") - sTopEdit;
        if (flip) { var tmp = botLpx; botLpx = botRpx; botRpx = tmp; }
        var curveTop = " C " + w/2 + " " + topRpx + " " + w/2 + " " + topLpx + " " + (w + 2) + " " + topLpx;
        var curveBot = " C " + w/2 + " " + botLpx + " " + w/2 + " " + botRpx + " -1 " + botRpx;
        attrs(dv.svg.appendChild(document.createElementNS(svgNS, "path")),
              "d", "M -1 " + topRpx + curveTop + " L " + (w + 2) + " " + botLpx + curveBot + " z",
              "class", dv.classes.connect);
      }
      if (dv.copyButtons) {
        var copy = dv.copyButtons.appendChild(elt("div", dv.type == "left" ? "\u21dd" : "\u21dc",
                                                  "CodeMirror-merge-copy"));
        copy.title = "Revert chunk";
        copy.chunk = {topEdit: topEdit, botEdit: botEdit, topOrig: topOrig, botOrig: botOrig};
        copy.style.top = top + "px";
      }
    });
  }

  function copyChunk(dv, chunk) {
    if (dv.diffOutOfDate) return;
    dv.edit.replaceRange(dv.orig.getRange(Pos(chunk.topOrig, 0), Pos(chunk.botOrig, 0)),
                         Pos(chunk.topEdit, 0), Pos(chunk.botEdit, 0));
  }

  // Merge view, containing 0, 1, or 2 diff views.

  var MergeView = CodeMirror.MergeView = function(node, options) {
    if (!(this instanceof MergeView)) return new MergeView(node, options);

    this.options = options;
    var origLeft = options.origLeft, origRight = options.origRight == null ? options.orig : options.origRight;
    var hasLeft = origLeft != null, hasRight = origRight != null;
    var panes = 1 + (hasLeft ? 1 : 0) + (hasRight ? 1 : 0);
    var wrap = [], left = this.left = null, right = this.right = null;

    if (hasLeft) {
      left = this.left = new DiffView(this, "left");
      var leftPane = elt("div", null, "CodeMirror-merge-pane");
      wrap.push(leftPane);
      wrap.push(buildGap(left));
    }

    var editPane = elt("div", null, "CodeMirror-merge-pane");
    wrap.push(editPane);

    if (hasRight) {
      right = this.right = new DiffView(this, "right");
      wrap.push(buildGap(right));
      var rightPane = elt("div", null, "CodeMirror-merge-pane");
      wrap.push(rightPane);
    }

    (hasRight ? rightPane : editPane).className += " CodeMirror-merge-pane-rightmost";

    wrap.push(elt("div", null, null, "height: 0; clear: both;"));
    var wrapElt = this.wrap = node.appendChild(elt("div", wrap, "CodeMirror-merge CodeMirror-merge-" + panes + "pane"));
    this.edit = CodeMirror(editPane, copyObj(options));

    if (left) left.init(leftPane, origLeft, options);
    if (right) right.init(rightPane, origRight, options);

    var onResize = function() {
      if (left) drawConnectors(left);
      if (right) drawConnectors(right);
    };
    CodeMirror.on(window, "resize", onResize);
    var resizeInterval = setInterval(function() {
      for (var p = wrapElt.parentNode; p && p != document.body; p = p.parentNode) {}
      if (!p) { clearInterval(resizeInterval); CodeMirror.off(window, "resize", onResize); }
    }, 5000);
  };

  function buildGap(dv) {
    var lock = dv.lockButton = elt("div", null, "CodeMirror-merge-scrolllock");
    lock.title = "Toggle locked scrolling";
    var lockWrap = elt("div", [lock], "CodeMirror-merge-scrolllock-wrap");
    CodeMirror.on(lock, "click", function() { setScrollLock(dv, !dv.lockScroll); });
    var gapElts = [lockWrap];
    if (dv.mv.options.revertButtons !== false) {
      dv.copyButtons = elt("div", null, "CodeMirror-merge-copybuttons-" + dv.type);
      CodeMirror.on(dv.copyButtons, "click", function(e) {
        var node = e.target || e.srcElement;
        if (node.chunk) copyChunk(dv, node.chunk);
      });
      gapElts.unshift(dv.copyButtons);
    }
    var svg = document.createElementNS && document.createElementNS(svgNS, "svg");
    if (svg && !svg.createSVGRect) svg = null;
    dv.svg = svg;
    if (svg) gapElts.push(svg);

    return dv.gap = elt("div", gapElts, "CodeMirror-merge-gap");
  }

  MergeView.prototype = {
    constuctor: MergeView,
    editor: function() { return this.edit; },
    rightOriginal: function() { return this.right && this.right.orig; },
    leftOriginal: function() { return this.left && this.left.orig; },
    setShowDifferences: function(val) {
      if (this.right) this.right.setShowDifferences(val);
      if (this.left) this.left.setShowDifferences(val);
    },
    rightChunks: function() {
      return this.right && getChunks(this.right);
    },
    leftChunks: function() {
      return this.left && getChunks(this.left);
    }
  };

  function asString(obj) {
    if (typeof obj == "string") return obj;
    else return obj.getValue();
  }



  /* Coverts diff-match-patch output to diff chunk
     which would be used by rediff to give output.
     This is for backward compaitabilty.
     It discards un-important chunks like DIFF_EQUAL,
     which have no role in UI rendering.
  */

  /* Converts
     [[DIFF_EQUAL, "1\n2\n3\n4\n5\n"], [DIFF_DELETE, "A\nB\nC\nD\n"],
     [DIFF_EQUAL, "6\n7\n8\n9\n0\n"], [DIFF_INSERT, "A\nE\nC\nD\n"]]
     to
     [{
      "type": DIFF_CHANGED,
      "lhsStart": {
          "line": 5, "ch": null
      },
      "lhsEnd": {
          "line": 8, "ch": null
      },
      "rhsStart": {
          "line": 5, "ch": null
      },
      "rhsEnd": {
          "line": 4, "ch": null
      },
      "chunks": [{
          "type": DIFF_DELETE,
          "lhsStart": {
              "line": 9, "ch": 0
          },
          "lhsEnd": {
              "line": 9, "ch": 0
          },
          "rhsStart": null,
          "rhsEnd": null,
          "chunks": []
      }]
    }, {
        "type": DIFF_CHANGED,
        "lhsStart": {
            "line": 14, "ch": null
        },
        "lhsEnd": {
            "line": 14, "ch": 0
        },
        "rhsStart": {
            "line": 10, "ch": null
        },
        "rhsEnd": {
            "line": 14, "ch": 0
        },
        "chunks": [{
            "type": DIFF_INSERT,
            "lhsStart": null,
            "lhsEnd": null,
            "rhsStart": {
                "line": 14, "ch": 0
            },
            "rhsEnd": {
                "line": 14, "ch": 0
            },
            "chunks": []
      }]
  }]
  */
  function convertToDiffChunk(diff) {
    var startEdit = 0, startOrig = 0;
    var newdiff = [];
    var edit = Pos(0, 0), orig = Pos(0, 0);
    var subchunks = [];
    for (var i = 0; i < diff.length; ++i) {
      var part = diff[i], diffType = part[0];
      if (diffType == DiffType.DIFF_EQUAL) {
        var startOff = startOfLineClean(diff, i) ? 0 : 1;
        var cleanFromEdit = edit.line + startOff,
          cleanFromOrig = orig.line + startOff;
        moveOver(edit, part[1], null, orig);
        var endOff = endOfLineClean(diff, i) ? 1 : 0;
        var cleanToEdit = edit.line + endOff,
          cleanToOrig = orig.line + endOff;
        if (cleanToEdit > cleanFromEdit) {
          if (i) {
            diffChunk = new DiffChunk(DiffType.DIFF_CHANGED,
              Pos(startOrig, null), Pos(cleanFromOrig - 1, null),
              Pos(startEdit, null), Pos(cleanFromEdit - 1, null),
              subchunks);
            newdiff.push(diffChunk);
            subchunks = [];

          }
          startEdit = cleanToEdit; startOrig = cleanToOrig;
        }
      } else {
        var beg = clonePos(diffType == DiffType.DIFF_INSERT ? edit : orig);
        var end = moveOver(diffType == DiffType.DIFF_INSERT ?
              edit : orig, part[1]);
        if (diffType == DiffType.DIFF_INSERT) {
          subchunks.push(new DiffChunk(diffType, null, null, beg,
            clonePos(end)));
        } else {
          subchunks.push(new DiffChunk(diffType, beg,
            clonePos(end), null, null));
        }
      }
    }
    if (startEdit <= edit.line || startOrig <= orig.line) {
      var diffChunk = new DiffChunk(DiffType.DIFF_CHANGED,
        Pos(startOrig, null), Pos(orig.line, orig.ch),
        Pos(startEdit, null), Pos(edit.line, edit.ch), subchunks);
      newdiff.push(diffChunk);
    }
    return newdiff;
  }


  DiffView.prototype.getDiff = function(a, b) {
    var dmp = new diff_match_patch();
    var diff = dmp.diff_main(a, b);
    dmp.diff_cleanupSemantic(diff);
    // The library sometimes leaves in empty parts,
    // which confuses the algorithm
    for (var i = 0; i < diff.length; ++i) {
      var part = diff[i];
      if (!part[1]) {
        diff.splice(i--, 1);
      } else if (i && diff[i - 1][0] == part[0]) {
        diff.splice(i--, 1);
        diff[i][1] += part[1];
      }
    }

    diff = convertToDiffChunk(diff);
    return diff;
  }

  function iterateChunks(diff, f) {
    var startEdit = 0, startOrig = 0;
    for (var i = 0; i < diff.length; ++i) {
      var part = diff[i], diffType = part.type;
      switch (diffType) {
        case DiffType.DIFF_DELETE:
          f(part.lhsStart.line, part.lhsEnd.line + 1, startEdit, startEdit);
          break;
        case DiffType.DIFF_INSERT:
          f(startOrig, startOrig, part.rhsStart.line, part.rhsEnd.line + 1);
          break;
        case DiffType.DIFF_CHANGED:
          f(part.lhsStart.line, part.lhsEnd.line + 1, part.rhsStart.line,
            part.rhsEnd.line + 1);
          startEdit = part.rhsEnd.line + 1;
          startOrig = part.lhsEnd.line + 1;
          break;
        case DiffType.DIFF_EQUAL:
          startEdit = part.rhsEnd.line + 1;
          startOrig = part.lhsEnd.line + 1;
          break;
        case DiffType.DIFF_MOVED_OUT:
        case DiffType.DIFF_MOVED_CHANGED_OUT:
          startOrig = part.lhsEnd.line + 1;
        case DiffType.DIFF_MOVED_IN:
        case DiffType.DIFF_MOVED_CHANGED:
          f(part.lhsStart.line, part.lhsEnd.line + 1, part.rhsStart.line,
            part.rhsEnd.line + 1);
          startEdit = part.rhsEnd.line + 1;
          break;
      }
    }
  }

  function getChunks(dv) {
    ensureDiff(dv);
    var collect = [];
    iterateChunks(dv.diff, function(topOrig, botOrig, topEdit, botEdit) {
      collect.push({origFrom: topOrig, origTo: botOrig,
                    editFrom: topEdit, editTo: botEdit});
    });
    return collect;
  }

  function endOfLineClean(diff, i) {
    if (i == diff.length - 1) return true;
    var next = diff[i + 1][1];
    if (next.length == 1 || next.charCodeAt(0) != 10) return false;
    if (i == diff.length - 2) return true;
    next = diff[i + 2][1];
    return next.length > 1 && next.charCodeAt(0) == 10;
  }

  function startOfLineClean(diff, i) {
    if (i == 0) return true;
    var last = diff[i - 1][1];
    if (last.charCodeAt(last.length - 1) != 10) return false;
    if (i == 1) return true;
    last = diff[i - 2][1];
    return last.charCodeAt(last.length - 1) == 10;
  }

  function chunkBoundariesAround(diff, n, nInEdit) {
    var beforeE, afterE, beforeO, afterO;
    iterateChunks(diff, function(fromOrig, toOrig, fromEdit, toEdit) {
      var fromLocal = nInEdit ? fromEdit : fromOrig;
      var toLocal = nInEdit ? toEdit : toOrig;
      if (afterE == null) {
        if (fromLocal > n) { afterE = fromEdit; afterO = fromOrig; }
        else if (toLocal > n) { afterE = toEdit; afterO = toOrig; }
      }
      if (toLocal <= n) { beforeE = toEdit; beforeO = toOrig; }
      else if (fromLocal <= n) { beforeE = fromEdit; beforeO = fromOrig; }
    });
    return {edit: {before: beforeE, after: afterE}, orig: {before: beforeO, after: afterO}};
  }

  // General utilities

  function elt(tag, content, className, style) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (style) e.style.cssText = style;
    if (typeof content == "string") e.appendChild(document.createTextNode(content));
    else if (content) for (var i = 0; i < content.length; ++i) e.appendChild(content[i]);
    return e;
  }

  function clear(node) {
    for (var count = node.childNodes.length; count > 0; --count)
      node.removeChild(node.firstChild);
  }

  function attrs(elt) {
    for (var i = 1; i < arguments.length; i += 2)
      elt.setAttribute(arguments[i], arguments[i+1]);
  }

  function copyObj(obj, target) {
    if (!target) target = {};
    for (var prop in obj) if (obj.hasOwnProperty(prop)) target[prop] = obj[prop];
    return target;
  }

  function moveOver(pos, str, copy, other) {
    var out = copy ? Pos(pos.line, pos.ch) : pos, at = 0;
    for (;;) {
      var nl = str.indexOf("\n", at);
      if (nl == -1) break;
      ++out.line;
      if (other) ++other.line;
      at = nl + 1;
    }
    out.ch = (at ? 0 : out.ch) + (str.length - at);
    if (other) other.ch = (at ? 0 : other.ch) + (str.length - at);
    return out;
  }

  function posMin(a, b) { return (a.line - b.line || a.ch - b.ch) < 0 ? a : b; }
  function posMax(a, b) { return (a.line - b.line || a.ch - b.ch) > 0 ? a : b; }
  function posEq(a, b) { return a.line == b.line && a.ch == b.ch; }
  function clonePos(a) { return Pos(a.line, a.ch); }
});
