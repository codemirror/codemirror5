// Optimize some code when these features are not used.
export let sawReadOnlySpans = false, sawCollapsedSpans = false, sawIsolateSpans = false

export function seeReadOnlySpans() {
  sawReadOnlySpans = true
}

export function seeCollapsedSpans() {
  sawCollapsedSpans = true
}

export function seeIsolateSpans() {
  sawIsolateSpans = true
}
