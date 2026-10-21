// Wraps every inline math / number+unit run inside Arabic text in a Unicode LTR isolate (U+2066 LRI … U+2069 PDI),
// so "6 ∥ 12 = 72 ÷ 18 = 4 Ω", "4 Ω", "6.022 × 10²³", "V_o,peak = 11.3 V" or "+962 77585 3203" keep their order
// inside right-to-left sentences (HTML text, speech bubbles and .srt/.vtt captions).
// A run = Latin letters, digits, Greek, sub/superscripts, math symbols and spaces between them; it is isolated when it
// contains a digit together with a space, a letter or an operator. Leading/trailing punctuation stays outside.
const RUN_CHARS = "A-Za-z0-9\\u00B2\\u00B3\\u00B9\\u00B0\\u00B5\\u00B7\\u00D7\\u00F7\\u0370-\\u03FF\\u2070-\\u209F\\u2190-\\u21FF\\u2200-\\u22FF\\u2032\\u2033\\u2212\\u2013.,:;=+\\-*/^_()\\[\\]{}|<>%'\"!#&~∥√Ω";
const RUN = new RegExp(`[${RUN_CHARS}](?:[${RUN_CHARS} \\u00A0]*[${RUN_CHARS}])?`, 'g');
const LEAD = /^[\s.,:;!?)\]}"'·\-–]+/, TRAIL = /[\s.,:;!?(\[{"'·\-–]+$/;
export function isolateUnits(text) {
  // " · " (spaced middle dot) separates phrases: never let a run cross it
  if (text.includes(' · ')) return text.split(' · ').map(isolateUnits).join(' · ');
  // keep already-isolated segments untouched
  return text.split(/(⁦[^⁩]*⁩)/).map(part => part.startsWith('⁦') ? part : part.replace(RUN, m => {
    let lead = m.match(LEAD)?.[0] || '', body = m.slice(lead.length), trail = body.match(TRAIL)?.[0] || '';
    body = body.slice(0, body.length - trail.length);
    // balance a single unmatched bracket by leaving it outside
    if (body.endsWith(')') && !body.includes('(')) { trail = ')' + trail; body = body.slice(0, -1); }
    if (body.startsWith('(') && !body.includes(')')) { lead += '('; body = body.slice(1); }
    const needs = /[A-Za-z][+#]/.test(body) || /\d/.test(body) &&/[\sA-Za-zͰ-Ͽ=+\-−×÷/^_∥√Ω%°·:,()²³¹⁰-⁹₀-₉]/.test(body.replace(/^\d+(\.\d+)?$/, ''));
    return needs ? `${lead}⁦${body}⁩${trail}` : m;
  })).join('');
}
