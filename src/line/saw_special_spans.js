// Optimize some code when these features are not used.
export var sawReadOnlySpans = false, sawCollapsedSpans = false;

export function seeReadOnlySpans() {
  sawReadOnlySpans = true;
}

export function seeCollapsedSpans() {
  sawCollapsedSpans = true;
}
