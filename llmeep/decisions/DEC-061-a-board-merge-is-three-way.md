---
id: DEC-061
title: A board merge compares each side with the merge base, not with each other
status: accepted
decided: 2026-10-02
deciders: [stewart]
supersedes: []
superseded_by: []
relates_to: [DEC-054, DEC-036, DEC-057]
---

# DEC-061 — A board merge compares each side with the merge base, not with each other

## Status

`accepted` — as of 2026-10-02.

## Context

`tm resolve` settles what a merge did to the records. Where the two sides put a task in
different sections, it kept the stronger one — `recent` over `in progress` over `prioritised`
over `backlog` — on the argument that an explicit ranking outranks the absence of one. Six of
the seven rules in **Merging boards** are arithmetic on two sets, and this was the seventh, the
one that "says out loud what it chose".

The argument has a hole, and an adopter found it. The app ran `park` on a task, moving it
`prioritised` → `backlog`. The other side only added an unrelated task to the backlog. On
merge, `resolve` reported:

```
<id> was in prioritised on one side — kept the ranking
```

and wrote the task back into `prioritised`, undoing the park.

Nobody on the other side had an opinion about that task. Its line was the merge base's,
carried forward untouched. Reading the two sides alone cannot tell a decision from a line
nobody edited — but the base can, and `resolve` already reads it: `merge_sides()` returns it and
`resolve_lines` uses it for presence. Only the section rule ignored it.

The report is the worse half. A revert is recoverable; a revert announced as a considered choice
is read, believed, and not checked.

## Decision

The section is resolved three-way and per task. A side whose placement equals the merge base
made no move, so the other side's move is the only one and wins outright, silently — nothing was
discarded, so there is nothing to report. Only when both sides moved the task, and to different
sections, is there a conflict: the stronger section wins and `resolve` names the move it threw
away, so the person can go and check.

## Alternatives considered

- **Keep preferring the stronger section, and improve the message** — rejected because the
  message was not the defect. Telling someone accurately that their park has been reverted still
  reverts it, and `park` exists precisely to say "not this, not now" (`DEC-036`).
- **Treat any section disagreement as a conflict and refuse to write** — rejected because the
  common case is one side moving a task and the other doing nothing near it, which is not a
  conflict and has an obviously correct answer. A resolver that stops on it would make the
  ordinary merge a manual board edit, which is what `resolve` exists to avoid.
- **Prefer the side with the later commit timestamp** — rejected: timestamps order commits, not
  intentions, and rebases and cherry-picks rewrite them. It would also make the result depend on
  which machine's clock was right.
- **Resolve from the reflog or the commits that touched each line** — rejected as a second,
  richer model of the same question. The base is already read, already exact, and already the
  thing git itself merges against.

## Consequences

- A deliberate move survives a merge with a branch that never touched that task — `park`,
  `prioritise` and `go` all behave the same way here, in both directions.
- `resolve` goes quiet in a case where it used to speak. That is the point: it now reports only
  where something was actually discarded, which is what makes the report worth reading.
- "Kept the ranking" is gone as a line. A test asserted it; that test now asserts the task ends
  in the right section and that nothing claims a conflict.
- A task both sides moved differently still resolves by strength, which is still a guess. It is
  now a guess that says it is one, and names the alternative.
- Costs one extra lookup per task into a board `resolve` had already parsed.

## Revisit when

A conflict appears that the base cannot settle because both sides moved the task through
several sections and the ends happen to look equivalent. Nothing in the records distinguishes
those paths today, and adding per-move history to the board to serve a merge would be the
board carrying a log — which `history.tsv` already is.
