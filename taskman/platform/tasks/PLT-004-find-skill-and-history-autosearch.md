---
id: PLT-004
title: Build find skill and history.tsv auto-search
created: 2026-07-31
---

# PLT-004 — Build find skill and history.tsv auto-search

## Outcome

Work that was already attempted surfaces on its own, without anyone deciding to look for it.
`add` and `go` grep `taskman/history.tsv` and print matches inline; `find` does it explicitly.

## Context

[`DEC-002`](../../../notes/decisions/DEC-002-task-history-index.md). The board is bounded at
15 recent tasks ([`DEC-001`](../../../notes/decisions/DEC-001-taskman-design.md)), so
completed work leaves the working tree. An instruction to search history would lose that coin
flip indefinitely, so retrieval is a side effect of `add` and `go` rather than a step —
[principle 6](../../../ontology/principles.md).

## Acceptance

- [x] `done` appends exactly one tab-separated line per completion: `date, id, ledger, title`.
      Append-only — the file is never rewritten. (No `commit` column: `DEC-004` dropped SHA
      storage, since the trailer makes the commit self-identifying.)
- [x] `find <term>` greps titles and IDs across both ledgers, strongest match first then newest.
- [x] `add` searches before allocating an ID and shows possible duplicates.
- [x] `go` searches before moving the line and shows prior related work.
- [x] **At most 3 hits** from the automatic search.
- [x] **Nothing is printed when there are no hits** — no empty heading, no "0 results". This
      is what keeps the output worth reading.
- [x] Automatic search adds no perceptible latency. A slow search gets disabled, and a
      disabled search is no search.
- [x] Works on a fresh clone with an empty `history.tsv`.

## Approach

**Word-overlap scoring**, not substring. The term is split into words of 3+ characters; rows
score by how many distinct words they contain, then break ties by date. Scoring beats substring
because it ranks — with a hard cap of 3, ranking is what decides whether the slots hold the
best matches or merely the first ones found.

Commits are resolved lazily: `git log --grep="closes <id>"` runs only for rows actually being
displayed, at most 3. That is what keeps the automatic path fast enough to always run.

Still open: whether `find` should also search commit messages directly, which would catch work
never tracked as a task at all. Deliberately not built — it changes `find` from "what did we
do" to "what happened", and those are different questions.

## Log

- 2026-07-31 — created alongside `DEC-002`.
- 2026-07-31 — implemented in `tm`. Word-overlap scoring, 3-hit cap, silent when empty.
