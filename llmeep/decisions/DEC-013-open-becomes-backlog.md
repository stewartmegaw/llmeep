---
id: DEC-013
title: The open section is renamed backlog
status: accepted
decided: 2026-08-01
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-001]
---

# DEC-013 — The `open` section is renamed `backlog`

## Context

The board had three sections: `doing`, `open`, `recent`. **`open` reads as an active ticket** —
"open issue", "open PR" — when it holds work nobody has started. The section that meant *not
begun* was named after a word that colloquially means *in progress*.

This surfaced in use, not in review: a rendered board prompted "why *open*? sounds like it's in
progress."

`DEC-001` named the sections and did not examine the word.

## Decision

**`## open` becomes `## backlog`.** The attribute in `tm` follows (`board.backlog`), which also
stops it shadowing the `open` builtin.

```
doing
  PLT-9puy  Fix flaky auth test          @stew

backlog
  PLT-k3f9  Migrate config loader        @sam
  PLT-2m4x  Upgrade toolchain            blocked:PLT-9puy
```

**This reverses a stated position.** Both glossaries listed *backlog* as a word to avoid —
"vague about ordering; the board defines a strict one". That was wrong. Most people read a
backlog as ordered; grooming a backlog *is* reordering it. And whatever imprecision it carries,
it does not carry `open`'s active/inactive ambiguity, which is the worse fault. The avoid-list
entries are removed, and `open (as a section)` takes their place.

**Rendered boards are not numbered.** A numbered list implies the number is a handle you can
pass to a command; it is not, and line order already conveys priority.

## Alternatives considered

- **`next`.** Foregrounds ordering, which is the board's central claim, and reads well against
  `doing`. Rejected on use: "next" implies one thing, and the section routinely holds twenty.
- **`todo`.** Unambiguous and dull. Not wrong, but says nothing about ordering, which is the
  property that makes this board work.
- **Leave it.** The cheapest option, and the ambiguity is small. Rejected because the cost of
  renaming is a morning's find-and-replace once, and the cost of the ambiguity is every new
  reader.

## Consequences

- **`DEC-001` and `DEC-010` describe a section named `open`.** They are committed and not edited;
  this record is the reconciliation. Anyone reading them should substitute `backlog`.
- **Existing boards need one line changed.** `## open` → `## backlog`. A board not migrated
  parses as having no backlog at all — the parser matches section names exactly and will not
  guess.
- The glossary is one entry shorter and one entry more accurate.

## Revisit when

- Never, ideally. Renaming a section is cheap once and annoying twice.
