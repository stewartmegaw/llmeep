// A label's colour, worked out from its name.
//
// **Nothing is stored** (`PLT-5gfc`). A colour chosen and saved would be a new
// field on every record, a verb to set it, and a merge rule for when two people
// chose differently — all to decide something nobody has an opinion about until
// they see it. Derived from the name instead: the same label is the same colour
// on every card, in the filter row, on every device, for everyone, with no
// record of it anywhere.
//
// The cost is that nobody can choose. That is the right trade here: the point
// of the colour is to tell two labels apart at a glance, not to mean anything.
// A label whose colour had to *mean* something would be a second vocabulary on
// top of the first.

// Ten hues that stay apart from each other and from the app's own blue, which
// is reserved for "this filter is on". Each is a text colour dark enough to
// read on white, with its own faint fill — picked as pairs rather than computed
// from one hue, because an even sweep round a colour wheel puts several
// near-identical yellows and greens next to each other.
const PALETTE = [
  { fg: '#9c2a2a', bg: '#fbeaea' },   // brick
  { fg: '#8a4b16', bg: '#fbf0e4' },   // amber
  { fg: '#6b5a0e', bg: '#f7f3dd' },   // olive
  { fg: '#2f6b35', bg: '#e8f4e9' },   // green
  { fg: '#0f6b63', bg: '#e3f3f1' },   // teal
  { fg: '#2a5a8a', bg: '#e8f0f8' },   // steel
  { fg: '#4b3f9c', bg: '#eeecfa' },   // indigo
  { fg: '#7a3380', bg: '#f7eaf8' },   // plum
  { fg: '#9c2a62', bg: '#fbeaf2' },   // magenta
  { fg: '#5a5f66', bg: '#eef0f2' },   // slate
  { fg: '#1f6a8a', bg: '#e4f1f6' },   // cyan
  { fg: '#8a5a2a', bg: '#f6eee5' },   // tan
]

// FNV-1a with an avalanche finish. The hash alone is fine in its high bits and
// poor in its low ones, and it is the low bits a modulo reads — over a
// realistic set of labels that put four of twenty on one colour. Mixing the
// high bits down first spreads them: measured over the same twenty, eleven of
// the twelve colours get used and no colour takes more than three.
function hash(name) {
  let h = 0x811c9dc5
  for (let i = 0; i < name.length; i += 1) {
    h ^= name.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  h ^= h >>> 16
  h = Math.imul(h, 0x7feb352d)
  h ^= h >>> 15
  h = Math.imul(h, 0x846ca68b)
  h ^= h >>> 16
  return h >>> 0
}

export default function labelColour(name) {
  return PALETTE[hash(String(name).toLowerCase()) % PALETTE.length]
}
