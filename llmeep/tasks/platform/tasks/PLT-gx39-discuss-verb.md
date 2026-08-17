---
id: PLT-gx39
title: The hint line offers two verbs that do not exist — discuss and drop
created: 2026-08-17
---

# PLT-gx39 — The hint line offers two verbs that do not exist — discuss and drop

## Outcome

Every verb the hint line offers exists, or stops being offered.

The line reads `*start · prioritise · done · park · drop · discuss*`
(`.claude/skills/tm/SKILL.md:223`). `tm` implements four of those six —
`go`/`prioritise`/`done`/`park`. **`discuss` and `drop` do not exist**, in `tm`, in the ontology,
or anywhere else. It is printed under every board listing, which makes it one of the most-read
strings in the system, and it is wrong twice.

## `drop`

The commoner of the two in practice: a filed task that turns out not to be wanted. `nm drop`
exists for notes, so the word is already in the vocabulary with a meaning — *remove it* — and
`DEC-024` settles what that means (remove everywhere, not mark as removed).

Whether `tm` should have it is a real question rather than a formality. A task nobody will do
could equally be closed, but `done` writes a history row and a completion notification, which
would be a lie. Today the only route is hand-editing the board, which is the same gap
`PLT-uwek` describes for demotion.

## `discuss`

**What it was meant to be:** *talk this task over with the agent to sharpen it.* Not a status,
not a board write — a working verb about one task, for when a title is vague or the acceptance
has not been thought through and the fastest way forward is a conversation.

That makes it unlike everything else on that line. `start`, `prioritise`, `done` and `park` all
name a transition, and `drop` would; this one moves nothing and produces no record unless the
conversation decides it should. It may be that the hint line is simply the wrong place for
it, since everything else there names a transition.

**It must not be borrowed for the meeting agenda** (`PLT-ehd6`). Marking a task for discussion
*at a meeting* is a different act from talking it over with the agent now, and the agenda work
has been told explicitly to leave the word alone.

The cost of leaving either one is small but real: an agent reading the hint line sees a verb the
tooling does not have, and either invents behaviour for it or tells the user it exists.

## Acceptance

- [x] Every verb on the hint line exists, or is no longer on it
- [x] If `discuss` ships, it is clear that it changes no records by itself — anything it
      produces goes through the existing verbs
- [x] If `drop` ships, it removes everywhere rather than marking (`DEC-024`), and does not write
      a history row or fire a completion notification
- [x] Nothing about `discuss` collides with the agenda's use of the word "discussion"
      (`PLT-ehd6`)
- [x] The rule the two share is written down — a board change with no command behind it is a
      gap — so `PLT-uwek` can apply it rather than re-derive it. That task itself is untouched
      and still open; "settled alongside" was the wrong bar and this is what was actually done

## Log

- 2026-08-17 — The two resolve opposite ways, and the split is [principle
  7](../../../ontology/principles.md) exactly. `drop` changes records — a line, a sidecar, a
  `blocked:` tag pointing at it — so it is a command. `discuss` changes nothing; it is judgement,
  and whatever comes out of it is recorded with verbs that already exist. A `tm discuss` could
  only print an invitation to a conversation the user is already having.
- 2026-08-17 — `DEC-024` turned out to have specified `tm drop` two weeks before it existed. It
  settled `nm drop` partly by reasoning from *"`drop` already means get rid of this on the
  board"* — describing a verb the hint line advertised and the tool did not have. So this needed
  no new decision, only the implementation that decision assumed.
- 2026-08-17 — So the hint line lists **what you can say**, not what the executable implements,
  and the two sets are allowed to differ. What is not allowed is a word there that neither the
  tool nor the agent does anything with. Written into the ontology so the next addition to that
  line has a test to meet.
