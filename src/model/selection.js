import { cmp, copyPos, maxPos, minPos } from "../line/pos";
import { indexOf } from "../util/misc";

// Selection objects are immutable. A new one is created every time
// the selection changes. A selection is one or more non-overlapping
// (and non-touching) ranges, sorted, and an integer that indicates
// which one is the primary selection (the one that's scrolled into
// view, that getCursor returns, etc).
export function Selection(ranges, primIndex) {
  this.ranges = ranges;
  this.primIndex = primIndex;
}

Selection.prototype = {
  primary: function() { return this.ranges[this.primIndex]; },
  equals: function(other) {
    if (other == this) return true;
    if (other.primIndex != this.primIndex || other.ranges.length != this.ranges.length) return false;
    for (var i = 0; i < this.ranges.length; i++) {
      var here = this.ranges[i], there = other.ranges[i];
      if (cmp(here.anchor, there.anchor) != 0 || cmp(here.head, there.head) != 0) return false;
    }
    return true;
  },
  deepCopy: function() {
    for (var out = [], i = 0; i < this.ranges.length; i++)
      out[i] = new Range(copyPos(this.ranges[i].anchor), copyPos(this.ranges[i].head));
    return new Selection(out, this.primIndex);
  },
  somethingSelected: function() {
    for (var i = 0; i < this.ranges.length; i++)
      if (!this.ranges[i].empty()) return true;
    return false;
  },
  contains: function(pos, end) {
    if (!end) end = pos;
    for (var i = 0; i < this.ranges.length; i++) {
      var range = this.ranges[i];
      if (cmp(end, range.from()) >= 0 && cmp(pos, range.to()) <= 0)
        return i;
    }
    return -1;
  }
};

export function Range(anchor, head) {
  this.anchor = anchor; this.head = head;
}

Range.prototype = {
  from: function() { return minPos(this.anchor, this.head); },
  to: function() { return maxPos(this.anchor, this.head); },
  empty: function() {
    return this.head.line == this.anchor.line && this.head.ch == this.anchor.ch;
  }
};

// Take an unsorted, potentially overlapping set of ranges, and
// build a selection out of it. 'Consumes' ranges array (modifying
// it).
export function normalizeSelection(ranges, primIndex) {
  var prim = ranges[primIndex];
  ranges.sort(function(a, b) { return cmp(a.from(), b.from()); });
  primIndex = indexOf(ranges, prim);
  for (var i = 1; i < ranges.length; i++) {
    var cur = ranges[i], prev = ranges[i - 1];
    if (cmp(prev.to(), cur.from()) >= 0) {
      var from = minPos(prev.from(), cur.from()), to = maxPos(prev.to(), cur.to());
      var inv = prev.empty() ? cur.from() == cur.head : prev.from() == prev.head;
      if (i <= primIndex) --primIndex;
      ranges.splice(--i, 2, new Range(inv ? to : from, inv ? from : to));
    }
  }
  return new Selection(ranges, primIndex);
}

export function simpleSelection(anchor, head) {
  return new Selection([new Range(anchor, head || anchor)], 0);
}
