---
id: DEC-056
title: The order of the queue is asked for with a verb, not edited by hand
status: accepted
decided: 2026-09-21
deciders: [stewart]
supersedes: [DEC-036]
superseded_by: []
relates_to: [DEC-027, DEC-003, DEC-048]
---

# DEC-056 — The order of the queue is asked for with a verb, not edited by hand

## Status

`accepted` — as of 2026-09-21.

## Context

`DEC-036` drew the line at transitions: every move between sections has a verb, and reordering
*within* a section stays a hand edit. Its reasoning was about what a gap teaches — give an agent
five verbs and one hole and it learns that writing to `board.md` is a normal thing to do, and the
next file it edits by hand has an invariant behind it.

The hole was tolerable while every hand was at a terminal. `prioritised` is the only ordered
section and **its position is the priority** (`DEC-027`), so changing that order is one of the few
genuine decisions the board records — and the only way to make it was to open the file.

Principle 8 then put a phone in front of it. An interface cannot hand-edit `board.md`: parsing and
rewriting the board at the far end is a second implementation of the model, which is the mistake
`DEC-003` exists to prevent, and it is the exact behaviour `DEC-036` refuses to teach. So the hole
that was an exemption became a wall: on a phone the queue could be added to and taken from, and
never ordered.

## Decision

**`tm prioritise <id> --after <id>` places a task behind one already ranked**, beside `-n` for the
top and a bare call for the bottom. Repositioning something already in the queue is no longer a
refusal when a place is named; a bare `prioritise` on a ranked task still is, because it asked for
nothing and moving it silently would be a reordering nobody requested.

**Positioned by neighbour, never by index.** *Third* is a fact about a list somebody else may have
just changed; *after `PLT-9puy`* is a fact about two tasks and survives the queue moving under it —
which is what a board two people write to needs.

**What carries forward from `DEC-036`, unchanged:** every transition between sections has a verb;
`park` is the one that steps back, one rung at a time, reading the rung off the record rather than
guessing; and `-n` errors rather than being ignored when the landing is the pool. Only the sentence
about reordering is retired.

**Hand editing stays valid.** This writes the same file the same way, and a person with an editor
loses nothing.

## Alternatives considered

- **Leave it a hand edit and give the app up/down buttons** that swap neighbours by rewriting the
  board through some other path. Rejected: every such path is the second implementation, and two of
  them — `tm` and the app — would disagree the first time a tag is added.
- **`--at <n>`, an index.** Rejected above: an index is a claim about a list rather than about the
  task, and it is wrong the moment anyone else ranks something. The interface knows its neighbours
  because it just drew them.
- **A `reorder` verb of its own.** Rejected: *prioritise this one, after that one* is what somebody
  says out loud, and `DEC-036`'s test for a verb is exactly that. A second word for the same act is
  vocabulary the hint line has already had to be corrected for once.
- **Let the app write `board.md` directly, guarded by the commit check.** Rejected on `DEC-003`
  and on the guard's own promise: the check is about which paths may be staged, not about who
  understands the format, and it would pass while the model drifted.

## Consequences

The order of the queue is now something anyone can change from anywhere, including the person who
will not open a terminal — which is the whole of principle 8 applied to the one section where
order carries meaning.

**`DEC-036` is superseded rather than amended**, and most of it is restated above: the chain is the
record of having believed the narrower thing, and the reason it held for a month is still true for
every section that is not the queue.

`prioritise` now has three landings, so its refusals have to say which one is missing; each of the
five is asserted.

Nine tests, including that a pooled task can land mid-queue in one move, that work in progress is
never reordered, and that the board still validates afterwards.

## Revisit when

A second section acquires an order. Nothing suggests one will — the pool is unordered by definition
and `recent` is sorted by date — but if it does, the question of whether `--after` generalises is
the one to ask before adding a second verb.
