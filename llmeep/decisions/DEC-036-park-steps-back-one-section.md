---
id: DEC-036
title: Every board transition has a verb, and park is the one that steps back
status: accepted
decided: 2026-08-17
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-001, DEC-024, DEC-027]
---

# DEC-036 — Every board transition has a verb, and `park` is the one that steps back

## Context

Five of the six transitions on the board had a command. `add` files, `prioritise` ranks, `go`
starts, `park` returns a started task to the queue, `done` completes. **Demoting a ranked task
back to the pool had nothing** — saying "not next after all" meant opening `board.md` and moving
the line, which is what happened on 2026-08-17 when one was asked for.

The model had a considered position on this and it argued the other way. The
[reordering exemption](../tasks/_tooling/ontology.md) says moving a line breaks no invariant,
because one file holds both the tasks and their order and there is no second place for it to
disagree with. `park` was justified as an exception on the narrow ground that **WIP-1 forces
it**: `go` refuses while something is in progress, so a tool guard pushes you into editing the
board. The test was written down as *"does the tool leave you any other way?"*, and by that test
demotion did not qualify. Nothing forces it; you simply want it.

That test was written for a person with an editor open. It does not survive contact with the
thing this project is actually for.

## Decision

**Every transition between sections has a verb. Reordering *within* a section stays a hand
edit.**

The test changes from *"does the tool leave you any other way?"* to **"is this a transition a
person asks for out loud?"** Because an agent drives this board, and an agent has no editor and
no muscle memory. Give it five verbs and one hole, and what it learns is that writing to
`board.md` is a normal thing to do — and the next thing it hand-edits is one with an invariant
behind it. A gap in the verb set is how principle 2 gets taught away.

**`park` steps a task back one section**: `in progress` → `prioritised` → `backlog`, and no
further. Not a second verb. *Park* already means *set this aside*, and setting aside something
you ranked is the same act as setting aside something you started, one rung lower — it is what
people say out loud, and it adds no vocabulary to a hint line that has already had to be
corrected for advertising words nothing implemented.

**Which rung is read off the record, not guessed.** The section a line sits in is written down
and unambiguous, so this is dispatch on state rather than inference of intent — the distinction
`DEC-024` drew for `nm drop` (principle 7).

**`-n` errors when the landing is the pool** rather than being quietly ignored. The pool has no
top (`DEC-027`), and a flag that silently does nothing teaches the wrong model of the board.

**A bare `park` still means the task in progress.** "Park it" said in front of a board is about
the thing you are doing; reaching for a ranked task instead would be the guessing this project
keeps refusing.

## Alternatives considered

- **`tm deprioritise <id>`.** Accurate, symmetric with `prioritise`, and a seventh verb for an
  act the sixth already describes. Rejected on the same grounds this project keeps choosing:
  fewer commands over more precise ones (`DEC-024`).
- **`tm backlog <id>`.** Genuinely tempting, because `prioritise` is named for its destination
  and this would be too. Rejected because it reads as a noun, and because it would make `park`
  and `backlog` two words for one intention depending on where the line started — the exact
  thing that makes a verb set hard to hold in your head.
- **Leave it a hand edit and say so louder.** The consistent-with-the-old-test answer, and the
  one the ontology implied. Rejected because the cost lands on an agent rather than a person: a
  documented exception is something a human reads once and an agent generalises from.
- **`park` returning a *started* task straight to the pool.** Simpler code, one destination. But
  something you started was decided work, and dropping it two rungs erases the ranking decision
  as well as the start. Parking says "not now", not "never ranked this".

## Consequences

- **The verb set is closed.** Every transition a person names has a command, so an agent has no
  reason to write to `board.md` — and any future addition to the board has to bring its verb
  with it, which is the point.
- **`park` now has two destinations**, which is more behaviour in one command than this project
  usually likes. It is bounded by the section list and dispatches on written-down state, so it
  cannot be surprised by an input.
- **The ontology's stated test changed**, and with it the justification for `park` itself. The
  old text also said *"dropping stays a hand edit"*, which stopped being true when `tm drop`
  shipped hours earlier under `DEC-024`. Both are corrected in the same pass rather than left as
  two documents disagreeing.
- **Nothing that worked stopped working.** A bare `park`, `park <id>` on a started task, and `-n`
  all behave as before.

## Revisit when

- A third destination appears — a section between `prioritised` and `backlog`, say — at which
  point "steps back one" stops being obvious and the verb probably does need splitting.
- Someone wants to demote *and* keep the assignee. Parking unassigns, on the grounds that a task
  nobody is doing is available; if that turns out to be wrong for demotion specifically, this is
  where to say so.
