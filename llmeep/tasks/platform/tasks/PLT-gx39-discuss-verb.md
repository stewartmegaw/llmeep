---
id: PLT-gx39
title: The hint line offers a discuss verb that does not exist
created: 2026-08-17
---

# PLT-gx39 — The hint line offers a discuss verb that does not exist

## Outcome

`discuss` either does something or stops being advertised. Right now the board's hint line ends
`*start · prioritise · done · park · drop · discuss*` (`.claude/skills/tm/SKILL.md:223`) and
there is no `discuss` in `tm`, in the ontology, or anywhere else.

## Context

**What it was meant to be:** *talk this task over with the agent to sharpen it.* Not a status,
not a board write — a working verb about one task, for when a title is vague or the acceptance
has not been thought through and the fastest way forward is a conversation.

That makes it unlike every other verb on that line. `start`, `prioritise`, `done`, `park` and
`drop` all move a line between sections; this one moves nothing and produces no record unless
the conversation decides it should. It may be that the hint line is simply the wrong place for
it, since everything else there names a transition.

**It must not be borrowed for the meeting agenda** (`PLT-ehd6`). Marking a task for discussion
*at a meeting* is a different act from talking it over with the agent now, and the agenda work
has been told explicitly to leave the word alone.

The cost of leaving it is small but real: an agent reading the hint line sees a verb the tooling
does not have, and either invents behaviour for it or tells the user it exists. The line is
printed on every board listing, so it is one of the most-read strings in the system.

## Acceptance

- [ ] Either `discuss` does something, or the hint line no longer offers it
- [ ] If it ships, it is clear that it changes no records by itself — anything it produces goes
      through the existing verbs
- [ ] Nothing about it collides with the agenda's use of the word "discussion" (`PLT-ehd6`)
