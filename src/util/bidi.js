import { isExtendingChar, lst } from "./misc";

// BIDI HELPERS

export function iterateBidiSections(order, from, to, f) {
  if (!order) return f(from, to, "ltr");
  var found = false;
  for (var i = 0; i < order.length; ++i) {
    var part = order[i];
    if (part.from < to && part.to > from || from == to && part.to == from) {
      f(Math.max(part.from, from), Math.min(part.to, to), part.level == 1 ? "rtl" : "ltr");
      found = true;
    }
  }
  if (!found) f(from, to, "ltr");
}

export function bidiLeft(part) { return part.level % 2 ? part.to : part.from; }
export function bidiRight(part) { return part.level % 2 ? part.from : part.to; }

export function lineLeft(line) { var order = getOrder(line); return order ? bidiLeft(order[0]) : 0; }
export function lineRight(line) {
  var order = getOrder(line);
  if (!order) return line.text.length;
  return bidiRight(lst(order));
}

function compareBidiLevel(order, a, b) {
  var linedir = order[0].level;
  if (a == linedir) return true;
  if (b == linedir) return false;
  return a < b;
}

export var bidiOther = null;
export function getBidiPartAt(order, pos) {
  bidiOther = null;
  for (var i = 0, found; i < order.length; ++i) {
    var cur = order[i];
    if (cur.from < pos && cur.to > pos) return i;
    if ((cur.from == pos || cur.to == pos)) {
      if (found == null) {
        found = i;
      } else if (compareBidiLevel(order, cur.level, order[found].level)) {
        if (cur.from != cur.to) bidiOther = found;
        return i;
      } else {
        if (cur.from != cur.to) bidiOther = i;
        return found;
      }
    }
  }
  return found;
}

function moveInLine(line, pos, dir, byUnit) {
  if (!byUnit) return pos + dir;
  do pos += dir;
  while (pos > 0 && isExtendingChar(line.text.charAt(pos)));
  return pos;
}

// This is needed in order to move 'visually' through bi-directional
// text -- i.e., pressing left should make the cursor go left, even
// when in RTL text. The tricky part is the 'jumps', where RTL and
// LTR text touch each other. This often requires the cursor offset
// to move more than one unit, in order to visually move one unit.
export function moveVisually(line, start, dir, byUnit) {
  var bidi = getOrder(line);
  if (!bidi) return moveLogically(line, start, dir, byUnit);
  var pos = getBidiPartAt(bidi, start), part = bidi[pos];
  var target = moveInLine(line, start, part.level % 2 ? -dir : dir, byUnit);

  for (;;) {
    if (target > part.from && target < part.to) return target;
    if (target == part.from || target == part.to) {
      if (getBidiPartAt(bidi, target) == pos) return target;
      part = bidi[pos += dir];
      return (dir > 0) == part.level % 2 ? part.to : part.from;
    } else {
      part = bidi[pos += dir];
      if (!part) return null;
      if ((dir > 0) == part.level % 2)
        target = moveInLine(line, part.to, -1, byUnit);
      else
        target = moveInLine(line, part.from, 1, byUnit);
    }
  }
}

export function moveLogically(line, start, dir, byUnit) {
  var target = start + dir;
  if (byUnit) while (target > 0 && isExtendingChar(line.text.charAt(target))) target += dir;
  return target < 0 || target > line.text.length ? null : target;
}

// Bidirectional ordering algorithm
// See http://unicode.org/reports/tr9/tr9-13.html for the algorithm
// that this (partially) implements.

// One-char codes used for character types:
// L (L):   Left-to-Right
// R (R):   Right-to-Left
// r (AL):  Right-to-Left Arabic
// 1 (EN):  European Number
// + (ES):  European Number Separator
// % (ET):  European Number Terminator
// n (AN):  Arabic Number
// , (CS):  Common Number Separator
// m (NSM): Non-Spacing Mark
// b (BN):  Boundary Neutral
// s (B):   Paragraph Separator
// t (S):   Segment Separator
// w (WS):  Whitespace
// N (ON):  Other Neutrals

// Returns null if characters are ordered as they appear
// (left-to-right), or an array of sections ({from, to, level}
// objects) in the order in which they occur visually.
export var bidiOrdering = (function() {
  // Character types for codepoints 0 to 0xff
  var lowTypes = "bbbbbbbbbtstwsbbbbbbbbbbbbbbssstwNN%%%NNNNNN,N,N1111111111NNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNbbbbbbsbbbbbbbbbbbbbbbbbbbbbbbbbb,N%%%%NNNNLNNNNN%%11NLNNN1LNNNNNLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLN";
  // Character types for codepoints 0x600 to 0x6ff
  var arabicTypes = "rrrrrrrrrrrr,rNNmmmmmmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmrrrrrrrnnnnnnnnnn%nnrrrmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmmmmmmNmmmm";
  function charType(code) {
    if (code <= 0xf7) return lowTypes.charAt(code);
    else if (0x590 <= code && code <= 0x5f4) return "R";
    else if (0x600 <= code && code <= 0x6ed) return arabicTypes.charAt(code - 0x600);
    else if (0x6ee <= code && code <= 0x8ac) return "r";
    else if (0x2000 <= code && code <= 0x200b) return "w";
    else if (code == 0x200c) return "b";
    else return "L";
  }

  var bidiRE = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
  var isNeutral = /[stwN]/, isStrong = /[LRr]/, countsAsLeft = /[Lb1n]/, countsAsNum = /[1n]/;
  // Browsers seem to always treat the boundaries of block elements as being L.
  var outerType = "L";

  function BidiSpan(level, from, to) {
    this.level = level;
    this.from = from; this.to = to;
  }

  return function(str) {
    if (!bidiRE.test(str)) return false;
    var len = str.length, types = [];
    for (var i = 0, type; i < len; ++i)
      types.push(type = charType(str.charCodeAt(i)));

    // W1. Examine each non-spacing mark (NSM) in the level run, and
    // change the type of the NSM to the type of the previous
    // character. If the NSM is at the start of the level run, it will
    // get the type of sor.
    for (var i = 0, prev = outerType; i < len; ++i) {
      var type = types[i];
      if (type == "m") types[i] = prev;
      else prev = type;
    }

    // W2. Search backwards from each instance of a European number
    // until the first strong type (R, L, AL, or sor) is found. If an
    // AL is found, change the type of the European number to Arabic
    // number.
    // W3. Change all ALs to R.
    for (var i = 0, cur = outerType; i < len; ++i) {
      var type = types[i];
      if (type == "1" && cur == "r") types[i] = "n";
      else if (isStrong.test(type)) { cur = type; if (type == "r") types[i] = "R"; }
    }

    // W4. A single European separator between two European numbers
    // changes to a European number. A single common separator between
    // two numbers of the same type changes to that type.
    for (var i = 1, prev = types[0]; i < len - 1; ++i) {
      var type = types[i];
      if (type == "+" && prev == "1" && types[i+1] == "1") types[i] = "1";
      else if (type == "," && prev == types[i+1] &&
               (prev == "1" || prev == "n")) types[i] = prev;
      prev = type;
    }

    // W5. A sequence of European terminators adjacent to European
    // numbers changes to all European numbers.
    // W6. Otherwise, separators and terminators change to Other
    // Neutral.
    for (var i = 0; i < len; ++i) {
      var type = types[i];
      if (type == ",") types[i] = "N";
      else if (type == "%") {
        for (var end = i + 1; end < len && types[end] == "%"; ++end) {}
        var replace = (i && types[i-1] == "!") || (end < len && types[end] == "1") ? "1" : "N";
        for (var j = i; j < end; ++j) types[j] = replace;
        i = end - 1;
      }
    }

    // W7. Search backwards from each instance of a European number
    // until the first strong type (R, L, or sor) is found. If an L is
    // found, then change the type of the European number to L.
    for (var i = 0, cur = outerType; i < len; ++i) {
      var type = types[i];
      if (cur == "L" && type == "1") types[i] = "L";
      else if (isStrong.test(type)) cur = type;
    }

    // N1. A sequence of neutrals takes the direction of the
    // surrounding strong text if the text on both sides has the same
    // direction. European and Arabic numbers act as if they were R in
    // terms of their influence on neutrals. Start-of-level-run (sor)
    // and end-of-level-run (eor) are used at level run boundaries.
    // N2. Any remaining neutrals take the embedding direction.
    for (var i = 0; i < len; ++i) {
      if (isNeutral.test(types[i])) {
        for (var end = i + 1; end < len && isNeutral.test(types[end]); ++end) {}
        var before = (i ? types[i-1] : outerType) == "L";
        var after = (end < len ? types[end] : outerType) == "L";
        var replace = before || after ? "L" : "R";
        for (var j = i; j < end; ++j) types[j] = replace;
        i = end - 1;
      }
    }

    // Here we depart from the documented algorithm, in order to avoid
    // building up an actual levels array. Since there are only three
    // levels (0, 1, 2) in an implementation that doesn't take
    // explicit embedding into account, we can build up the order on
    // the fly, without following the level-based algorithm.
    var order = [], m;
    for (var i = 0; i < len;) {
      if (countsAsLeft.test(types[i])) {
        var start = i;
        for (++i; i < len && countsAsLeft.test(types[i]); ++i) {}
        order.push(new BidiSpan(0, start, i));
      } else {
        var pos = i, at = order.length;
        for (++i; i < len && types[i] != "L"; ++i) {}
        for (var j = pos; j < i;) {
          if (countsAsNum.test(types[j])) {
            if (pos < j) order.splice(at, 0, new BidiSpan(1, pos, j));
            var nstart = j;
            for (++j; j < i && countsAsNum.test(types[j]); ++j) {}
            order.splice(at, 0, new BidiSpan(2, nstart, j));
            pos = j;
          } else ++j;
        }
        if (pos < i) order.splice(at, 0, new BidiSpan(1, pos, i));
      }
    }
    if (order[0].level == 1 && (m = str.match(/^\s+/))) {
      order[0].from = m[0].length;
      order.unshift(new BidiSpan(0, 0, m[0].length));
    }
    if (lst(order).level == 1 && (m = str.match(/\s+$/))) {
      lst(order).to -= m[0].length;
      order.push(new BidiSpan(0, len - m[0].length, len));
    }
    if (order[0].level == 2)
      order.unshift(new BidiSpan(1, order[0].to, order[0].to));
    if (order[0].level != lst(order).level)
      order.push(new BidiSpan(order[0].level, len, len));

    return order;
  };
})();

// Get the bidi ordering for the given line (and cache it). Returns
// false for lines that are fully left-to-right, and an array of
// BidiSpan objects otherwise.
export function getOrder(line) {
  var order = line.order;
  if (order == null) order = line.order = bidiOrdering(line.text);
  return order;
}
