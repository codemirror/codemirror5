import { lst } from "./misc.js"

// BIDI HELPERS

export function iterateBidiSections(order, from, to, f) {
  if (!order) return f(from, to, "ltr", 0)
  let found = false
  for (let i = 0; i < order.length; ++i) {
    let part = order[i]
    if (part.from < to && part.to > from || from == to && part.to == from) {
      f(Math.max(part.from, from), Math.min(part.to, to), part.level == 1 ? "rtl" : "ltr", i, part.atomic)
      found = true
    }
  }
  if (!found) f(from, to, "ltr")
}

export let bidiOther = null
export function getBidiPartAt(order, ch, sticky) {
  let found
  bidiOther = null
  for (let i = 0; i < order.length; ++i) {
    let cur = order[i]
    if (cur.from < ch && cur.to > ch) return i
    if (cur.to == ch) {
      if (cur.from != cur.to && sticky == "before") found = i
      else bidiOther = i
    }
    if (cur.from == ch) {
      if (cur.from != cur.to && sticky != "before") found = i
      else bidiOther = i
    }
  }
  return found != null ? found : bidiOther
}

// Returns an array with the positions of isolate and normal segments for the entire string
function getTextAndIsolatePositions(str, marks) {
  let flag = 0, len = str.length, textAndIsolates = [], start, nextIsolate
  if (!marks) return [{from: 0, to: len}]
  for (let i = 0; i < len;) {
    start = i, nextIsolate = marks[flag]
    for (let j = 0; j < marks.length; j++) { if (i >= marks[j].from && i < marks[j].to) { nextIsolate = marks[j]; break; }}
    if (!nextIsolate) { nextIsolate = {from: len } }
    if (i < nextIsolate.from) {
      for (; i < len && i < nextIsolate.from; i++ ) {}
      textAndIsolates.push({from: start, to: i})
    } else {
      for (; i < len && i < nextIsolate.to; i++) {}
      textAndIsolates.push({from: start, to: i, isolate: nextIsolate.marker.isolate, atomic: nextIsolate.marker.atomic})
      flag += 1
    }
  }
  return textAndIsolates
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
let bidiOrdering = (function() {
  // Character types for codepoints 0 to 0xff
  let lowTypes = "bbbbbbbbbtstwsbbbbbbbbbbbbbbssstwNN%%%NNNNNN,N,N1111111111NNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNbbbbbbsbbbbbbbbbbbbbbbbbbbbbbbbbb,N%%%%NNNNLNNNNN%%11NLNNN1LNNNNNLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLN"
  // Character types for codepoints 0x600 to 0x6f9
  let arabicTypes = "nnnnnnNNr%%r,rNNmmmmmmmmmmmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmmmmmmmmnnnnnnnnnn%nnrrrmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmnNmmmmmmrrmmNmmmmrr1111111111"
  function charType(code) {
    if (code <= 0xf7) return lowTypes.charAt(code)
    else if (0x590 <= code && code <= 0x5f4) return "R"
    else if (0x600 <= code && code <= 0x6f9) return arabicTypes.charAt(code - 0x600)
    else if (0x6ee <= code && code <= 0x8ac) return "r"
    else if (0x2000 <= code && code <= 0x200b) return "w"
    else if (code == 0x200c) return "b"
    else return "L"
  }

  let bidiRE = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/
  let isNeutral = /[stwN]/, isStrong = /[LRr]/, countsAsLeft = /[Lb1n]/, countsAsNum = /[1n]/

  function BidiSpan(level, from, to, isolate, atomic) {
    this.level = level
    this.from = from; this.to = to
    this.isolate = isolate; this.atomic = atomic
  }

  return function(str, direction, marks) {
    let outerType = direction == "ltr" ? "L" : "R"

    let textAndIsolates = getTextAndIsolatePositions(str, marks)

    if (str.length == 0 || direction == "ltr" && !bidiRE.test(str)) return false
    let len = str.length, types = []
    for (let i = 0; i < len; ++i)
      types.push(charType(str.charCodeAt(i)))

    // W1. Examine each non-spacing mark (NSM) in the level run, and
    // change the type of the NSM to the type of the previous
    // character. If the NSM is at the start of the level run, it will
    // get the type of sor.
    for (let i = 0, prev = outerType; i < len; ++i) {
      let type = types[i]
      if (type == "m") types[i] = prev
      else prev = type
    }

    // W2. Search backwards from each instance of a European number
    // until the first strong type (R, L, AL, or sor) is found. If an
    // AL is found, change the type of the European number to Arabic
    // number.
    // W3. Change all ALs to R.
    for (let i = 0, cur = outerType; i < len; ++i) {
      let type = types[i]
      if (type == "1" && cur == "r") types[i] = "n"
      else if (isStrong.test(type)) { cur = type; if (type == "r") types[i] = "R" }
    }

    // W4. A single European separator between two European numbers
    // changes to a European number. A single common separator between
    // two numbers of the same type changes to that type.
    for (let i = 1, prev = types[0]; i < len - 1; ++i) {
      let type = types[i]
      if (type == "+" && prev == "1" && types[i+1] == "1") types[i] = "1"
      else if (type == "," && prev == types[i+1] &&
               (prev == "1" || prev == "n")) types[i] = prev
      prev = type
    }

    // W5. A sequence of European terminators adjacent to European
    // numbers changes to all European numbers.
    // W6. Otherwise, separators and terminators change to Other
    // Neutral.
    for (let i = 0; i < len; ++i) {
      let type = types[i]
      if (type == ",") types[i] = "N"
      else if (type == "%") {
        let end
        for (end = i + 1; end < len && types[end] == "%"; ++end) {}
        let replace = (i && types[i-1] == "!") || (end < len && types[end] == "1") ? "1" : "N"
        for (let j = i; j < end; ++j) types[j] = replace
        i = end - 1
      }
    }

    // W7. Search backwards from each instance of a European number
    // until the first strong type (R, L, or sor) is found. If an L is
    // found, then change the type of the European number to L.
    for (let i = 0, cur = outerType; i < len; ++i) {
      let type = types[i]
      if (cur == "L" && type == "1") types[i] = "L"
      else if (isStrong.test(type)) cur = type
    }

    // N1. A sequence of neutrals takes the direction of the
    // surrounding strong text if the text on both sides has the same
    // direction. European and Arabic numbers act as if they were R in
    // terms of their influence on neutrals. Start-of-level-run (sor)
    // and end-of-level-run (eor) are used at level run boundaries.
    // N2. Any remaining neutrals take the embedding direction.
    for (var i$6b = 0; i$6b < textAndIsolates.length; i$6b++) {
      var isolatePart = textAndIsolates[i$6b], isolateDir = isolatePart.isolate
      var isolateLen = textAndIsolates[i$6b].to
      for (var i$6 = 0; i$6 < isolateLen; ++i$6) {
        if (isNeutral.test(types[i$6])) {
          var end$1 = (void 0), replace$1
          for (end$1 = i$6 + 1; end$1 < isolateLen && isNeutral.test(types[end$1]); ++end$1) {}
          var before = (i$6 - textAndIsolates[i$6b].from ? types[i$6-1] : outerType) == "L"
          var after = (end$1 < isolateLen ? types[end$1] : outerType) == "L"
          replace$1 = before == after ? (before ? "L" : "R") : isolateDir ? isolateDir == "rtl" ? "R" : "L" : outerType
          for (var j$1 = i$6; j$1 < end$1; ++j$1) { types[j$1] = replace$1 }
          i$6 = end$1 - 1
        }
      }
    }

    // Here we depart from the documented algorithm, in order to avoid
    // building up an actual levels array. Since there are only three
    // levels (0, 1, 2) in an implementation that doesn't take
    // explicit embedding into account, we can build up the order on
    // the fly, without following the level-based algorithm.
    let order = [], m
    for (var i$0 = 0; i$0 < textAndIsolates.length; i$0++) {
      len = textAndIsolates[i$0].to
      let isolate = textAndIsolates[i$0].isolate, atomic = textAndIsolates[i$0].atomic
      for (var i$7 = textAndIsolates[i$0].from; i$7 < len;) {
        if (countsAsLeft.test(types[i$7])) {
          var start = i$7
          for (++i$7; i$7 < len && countsAsLeft.test(types[i$7]); ++i$7) {}
          order.push(new BidiSpan(0, start, i$7, isolate, atomic))
        } else {
          var pos = i$7, at = order.length
          for (++i$7; i$7 < len && types[i$7] != "L"; ++i$7) {}
          for (var j$2 = pos; j$2 < i$7;) {
            if (countsAsNum.test(types[j$2])) {
              if (pos < j$2) { order.splice(at, 0, new BidiSpan(1, pos, j$2, isolate, atomic)); }
              var nstart = j$2
              for (++j$2; j$2 < i$7 && countsAsNum.test(types[j$2]); ++j$2) {}
              order.splice(at, 0, new BidiSpan(2, nstart, j$2, isolate, atomic))
              pos = j$2
            } else { ++j$2; }
          }
          if (pos < i$7) { order.splice(at, 0, new BidiSpan(1, pos, i$7, isolate, atomic)); }
        }
      }
    }
    if (direction == "ltr") {
      if (order[0].level == 1 && (m = str.match(/^\s+/))) {
        order[0].from = m[0].length
        order.unshift(new BidiSpan(0, 0, m[0].length))
      }
      if (lst(order).level == 1 && (m = str.match(/\s+$/))) {
        lst(order).to -= m[0].length
        order.push(new BidiSpan(0, len - m[0].length, len))
      }
    }
    return direction == "rtl" ? order.reverse() : order
  }
})()

// Get the bidi ordering for the given line (and cache it). Returns
// false for lines that are fully left-to-right, and an array of
// BidiSpan objects otherwise.
export function getOrder(line, direction) {
  let order = line.order
  if (order == null) { order = line.order = bidiOrdering(line.text, direction, line.markedSpans); }
  return order
}
