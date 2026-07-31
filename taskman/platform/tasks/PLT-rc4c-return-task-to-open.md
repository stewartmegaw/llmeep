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

## Acceptance

- [x] `tm park` returns the task in `doing` to `open`; `tm park <id>` names one explicitly.
- [x] Refuses with a clear message when nothing is in `doing`, or when the named task is not.
- [x] Returns to the **bottom** by default so the next bare `go` does not restart it; `-n` for
      the top.
- [x] Documented in `taskman/ontology.md`, the root README and the agent skill.

## Approach

**Resolved: yes, it is a command.** Two readings conflicted:

- **Yes** — it is a status transition. Principle 2 puts those in tooling, and every other
  transition (`add`, `go`, `done`) is a command. This one being manual is an inconsistency, not
  a design.
- **No** — moving a line between sections of one file breaks no invariant, which is the exact
  test the [reordering exemption](../../ontology.md) uses. By that test it qualifies as a hand
  edit and the gap is imaginary.

**WIP-1 was the tiebreaker.** `go` refuses when `doing` is occupied, so a user switching tasks
is *forced* into a hand edit by the tool's own guard. A tool that makes you break its own rule
has to provide the way out — so the test is not "is it a status transition?" but "does the tool
leave any other way?"

By that test **dropping stays a hand edit**: nothing in `tm` blocks deleting a line.

**Named `park`** — it carries the intent (set aside, come back). `stop` implies abandonment;
`open` collides with the section name and reads as a noun.

`doing → dropped` needs no command for the same reason, but it is undocumented in the
lifecycle. Left as-is; worth adding if it recurs.

## Log

- 2026-07-31 — created after the second hand edit in one session.
- 2026-07-31 — built as `tm park`. Testing it surfaced a separate bug in `Task.render()`: tags
  were concatenated onto titles long enough to fill the padding column, and `_parse` then read
  the tag back as part of the title. Fixed in the same change.
