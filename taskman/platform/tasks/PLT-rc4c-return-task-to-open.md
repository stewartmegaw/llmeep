---
id: PLT-rc4c
title: Add a tm command to return a task from doing to open
created: 2026-07-31
---

# PLT-rc4c — Add a tm command to return a task from doing to open

## Outcome

Parking a started task is a command, not a hand edit.

## Context

The lifecycle in [`ontology.md`](../../ontology.md) lists `doing → open` ("returned; no
ceremony") as legal, but `tm` has no operation for it. It came up twice on 2026-07-31 — parking
`PLT-005` while it waited on a bot token, and dropping `PLT-vs6d` once it was obsolete — and
both times the board was edited by hand.

That is the one transition where the design and the tool disagree, and hand-editing a status
transition is exactly what [principle 2](../../../ontology/principles.md) exists to prevent.

## Approach

**Open: is a command right at all?** Two readings, and they conflict:

- **Yes** — it is a status transition. Principle 2 puts those in tooling, and every other
  transition (`add`, `go`, `done`) is a command. This one being manual is an inconsistency, not
  a design.
- **No** — moving a line between sections of one file breaks no invariant, which is the exact
  test the [reordering exemption](../../ontology.md) uses. By that test it qualifies as a hand
  edit and the gap is imaginary.

The tiebreaker is probably WIP-1: `go` refuses when `doing` is occupied, so a user who wants to
switch tasks is *forced* into a hand edit by the tool's own guard. That is worse than either
answer on its own.

**Naming, if it is built.** `tm park` reads best for the intent (set aside, come back).
`tm stop` implies abandonment. `tm open` collides with the section name and reads as a noun.

Also decide whether `doing → dropped` needs the same treatment — dropping from `doing` happened
once already and is not in the documented lifecycle at all.

## Log

- 2026-07-31 — created after the second hand edit in one session.
