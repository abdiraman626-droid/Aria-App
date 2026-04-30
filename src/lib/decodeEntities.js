// Decode HTML entities (e.g. &#39; → ', &amp; → &, &quot; → ")
// Uses a textarea — the standard browser-native trick that handles
// every named entity and numeric reference (&#NN; and &#xNN;) correctly.

let _ta = null;

export function decodeEntities(str) {
  if (!str || typeof str !== 'string') return str;
  // Fast path — no entities present
  if (!str.includes('&')) return str;
  if (!_ta) _ta = document.createElement('textarea');
  _ta.innerHTML = str;
  return _ta.value;
}
