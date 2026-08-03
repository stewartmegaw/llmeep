---
id: DEC-014
title: The doing section is renamed in progress
status: accepted
decided: 2026-08-01
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-001, DEC-013]
---

# DEC-014 — The `doing` section is renamed `in progress`

## Context

Second of two section renames on the same day; [`DEC-013`](DEC-013-open-becomes-backlog.md)
covers `open` → `backlog`. `doing` was terse in a way nothing else on the board is — a bare
gerund where every neighbouring label is a noun phrase.

## Decision

**`## doing` becomes `## in progress`.** The board now reads `in progress` / `backlog` /
`recent`.

**Section headings and attribute names are no longer the same string.** The parser previously
did `getattr(self, section)`, which worked only while every heading was a valid identifier. A
heading with a space breaks that — and breaks it *silently*, parsing as a section that does not
exist and dropping every line under it. An explicit map now stands between them:

```python
SECTIONS = {"in progress": "in_progress", "backlog": "backlog"}
```

That is the durable part of this change. The rename is cosmetic; removing the accidental
coupling between what a human reads and what Python can name is not.

## Alternatives considered

- **`active`.** One word, no space, no parser change. Rejected: it invites "active" meaning
  "not archived", which is the same ambiguity `open` had.
- **Leave `doing`.** Defensible — it is unambiguous, which is more than `open` was. Rejected on
  consistency: renaming one section and not the other leaves the board reading half-considered.

## Consequences

- **A board not migrated loses its in-progress section entirely** — the parser matches headings
  exactly and will not guess. One line to change: `## doing` → `## in progress`.
- **`DEC-001`, `DEC-010` and two completed task sidecars describe a section named `doing`.**
  They are records of what was true when written and are left alone; this is the reconciliation.
- Prose throughout now says "in progress" rather than "in `doing`", which reads better anyway.

## Revisit when

- Never, ideally. See `DEC-013`.
