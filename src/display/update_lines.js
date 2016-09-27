import { heightAtLine } from "../line/spans"
import { getLine, lineAtHeight, updateLineHeight } from "../line/utils_line"
import { paddingTop, textHeight } from "../measurement/position_measurement"
import { ie, ie_version } from "../util/browser"

// Read the actual heights of the rendered lines, and update their
// stored heights to match.
export function updateHeightsInViewport(cm) {
  let display = cm.display
  let prevBottom = display.lineDiv.offsetTop
  for (let i = 0; i < display.view.length; i++) {
    let cur = display.view[i], height
    if (cur.hidden) continue
    if (ie && ie_version < 8) {
      let bot = cur.node.offsetTop + cur.node.offsetHeight
      height = bot - prevBottom
      prevBottom = bot
    } else {
      let box = cur.node.getBoundingClientRect()
      height = box.bottom - box.top
    }
    let diff = cur.line.height - height
    if (height < 2) height = textHeight(display)
    if (diff > .001 || diff < -.001) {
      updateLineHeight(cur.line, height)
      updateWidgetHeight(cur.line)
      if (cur.rest) for (let j = 0; j < cur.rest.length; j++)
        updateWidgetHeight(cur.rest[j])
    }
  }
}

// Read and store the height of line widgets associated with the
// given line.
function updateWidgetHeight(line) {
  if (line.widgets) for (let i = 0; i < line.widgets.length; ++i)
    line.widgets[i].height = line.widgets[i].node.parentNode.offsetHeight
}

// Compute the lines that are visible in a given viewport (defaults
// the the current scroll position). viewport may contain top,
// height, and ensure (see op.scrollToPos) properties.
export function visibleLines(display, doc, viewport) {
  let top = viewport && viewport.top != null ? Math.max(0, viewport.top) : display.scroller.scrollTop
  top = Math.floor(top - paddingTop(display))
  let bottom = viewport && viewport.bottom != null ? viewport.bottom : top + display.wrapper.clientHeight

  let from = lineAtHeight(doc, top), to = lineAtHeight(doc, bottom)
  // Ensure is a {from: {line, ch}, to: {line, ch}} object, and
  // forces those lines into the viewport (if possible).
  if (viewport && viewport.ensure) {
    let ensureFrom = viewport.ensure.from.line, ensureTo = viewport.ensure.to.line
    if (ensureFrom < from) {
      from = ensureFrom
      to = lineAtHeight(doc, heightAtLine(getLine(doc, ensureFrom)) + display.wrapper.clientHeight)
    } else if (Math.min(ensureTo, doc.lastLine()) >= to) {
      from = lineAtHeight(doc, heightAtLine(getLine(doc, ensureTo)) - display.wrapper.clientHeight)
      to = ensureTo
    }
  }
  return {from: from, to: Math.max(to, from + 1)}
}
