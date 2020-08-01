#!/usr/bin/env node

// List missing reserved words in CSS mode by comparing them against the list on MDN
// output the missing one in a html file
//  bin/list-missing-css-reserved-words.js > bin/missing-css.html


// MDN related methods
//

const bcd = require('mdn-browser-compat-data');

function mayPrefixed(compatSupport) {
  // prefixed in some browser;
  return Object.values(compatSupport).some(aBrowserCompat => aBrowserCompat.prefix);

}

function isOnStandardTrack(compatSupport) {
  // prefixed in some browser;
  return compatSupport.status['standard_track'];

}

// All CSS property names on standard track per MDN,
// including those that are in draft steps.
// In CodeMirror terms, those in draft steps are considered NonStandard
function getCssPropNamesOnStandardTrack() {
  const propStandardTrack = [];
  for (const [propName, propDef] of Object.entries(bcd.css.properties)) {
      if (propDef.__compat && isOnStandardTrack(propDef.__compat)) {
          propStandardTrack.push(propName);
      }
  }
  return propStandardTrack;
}

function getMdnLink(cssPropName) {
  return (bcd.css.properties[cssPropName].__compat || {})['mdn_url'];
}

// CodeMirror ones and the diffs
//

const CodeMirror = require("../addon/runmode/runmode.node.js");
require("../mode/css/css.js");
const cmCssSpecs = CodeMirror.resolveMode('text/css');

EXCLUDED_PROPS = [
  'custom-property', // it means -- variable
];

function getMissingCssPropNameList() {
  const cmPropNameList = Object.keys(cmCssSpecs.propertyKeywords)
    .concat(Object.keys(cmCssSpecs.nonStandardPropertyKeywords));

  const missingPropNames = getCssPropNamesOnStandardTrack()
    .filter(p => !cmPropNameList.includes(p))
    .filter(p => !EXCLUDED_PROPS.includes(p));

  return missingPropNames;
}

/**
 * Turn the list to a web page so that users can easily access correspond MDN article
 * to determine whether the property is standard (i.e, recommendation or candidate recommendation)
 */
function listMissingInHtml() {
  const propListHtml = getMissingCssPropNameList()
    .map(p => `  <li><input type="checkbox"><a target="mdn_spec" href="${getMdnLink(p)}#Specifications">${p}</a></li>`)
    .join('\n');

  return `\
<!doctype html>
<h1>Missing CSS property names</h1>
<button id="ctlShowSelected">Show selected ones as JSON</button>
<textarea id="selected-out" rows="5">
</textarea>
<hr>
<button id="ctlInvertSelected">Invert Selected</button>
<ul>
${propListHtml}
</ul>

<script>
  document.getElementById('ctlShowSelected').onclick = () => {
    const selected = Array.from(document.querySelectorAll('ul input[type="checkbox"]:checked ~ a'), a => a.textContent);
    document.getElementById('selected-out').value = JSON.stringify(selected, null, 2);
  };

  document.getElementById('ctlInvertSelected').onclick = () => {
    Array.from(document.querySelectorAll('ul input[type="checkbox"]'), inEl => {
      inEl.checked = !inEl.checked;
    });
  };
</script>
`;
} // function listMissingInHtml

// Main for command line
if (require.main === module) {
    console.log(listMissingInHtml());
}
