// One definition of "matches", used by every tab.
//
// **Shared rather than reimplemented per tab** (`PLT-t6wd`). The tab labels
// count the matches and the panes show them, and those are two different pieces
// of code — a board counted by one rule and filtered by another would show
// "Board 3" above two rows, which is worse than no count at all.
//
// **In the browser, over what is already loaded.** Every tab has its records in
// hand; a round trip to ask the repo what it already sent would be slower, would
// fail offline, and would need a verb that does not exist. The cost is that it
// searches what is on screen rather than everything there has ever been —
// completed work is `tm find`, at a terminal, and a document's body is not
// searched because only its title is loaded until you open it.

// Space-separated terms, all of which must appear somewhere in the row. AND
// rather than OR: typing a second word is how anyone narrows a list, and an OR
// would widen it, which reads as the search having broken.
export function terms(query) {
  return String(query || '').toLowerCase().split(/\s+/).filter(Boolean)
}

// `fields` is whatever identifies the row — nulls and numbers are fine, so a
// caller can pass an id, a title and a tag without checking each one first.
export function matches(query, ...fields) {
  const want = terms(query)
  if (!want.length) return true
  const hay = fields.filter((f) => f !== null && f !== undefined)
    .join(' ').toLowerCase()
  return want.every((t) => hay.includes(t))
}

// `true` when nothing is being searched for, so callers can skip filtering
// entirely and keep their untouched render.
export function idle(query) {
  return terms(query).length === 0
}
