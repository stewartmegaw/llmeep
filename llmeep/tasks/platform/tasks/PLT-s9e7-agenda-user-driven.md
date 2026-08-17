---
id: PLT-s9e7
title: "Agenda should be user-driven: create the draft, name the sources, list nothing"
created: 2026-08-17
---

# PLT-s9e7 — Agenda should be user-driven: create the draft, name the sources, list nothing

## Outcome

Saying "agenda" creates the draft and gets out of the way. The agent says it exists and that
tasks, notes and decisions can go on it — and **lists none of them**. The user drives: they run
`tasks` when they want to see tasks, and then say what belongs.

## Context

`PLT-ehd6` shipped a `tm agenda` that lists candidates — blocked tasks, unpromoted notes, open
business. Using it showed the listing is wrong in two ways.

**It answers a question nobody asked.** An agenda is mostly the things on someone's mind, not the
things a board can infer. Opening with a filtered view of the records frames the meeting around
what the tooling happens to notice, which is a narrow and slightly arbitrary slice — and it is
the same mistake as pre-filling the draft, one step further back. The user already has `tasks`,
`notes` and `tm why` for looking things up, each better at it than a merged list.

**Most of an agenda is not in the records at all.** The worked example below is five sections of
strategy — value propositions, funding trade-offs, who to sell to first — and almost none of it
corresponds to a task, a note or a decision. It is thinking, written down for the meeting.

So the shape inverts: **the agent creates the draft and names what can be added; the user says
what goes on it.**

## The format

Numbered sections, each a heading and bullets, ending in `Next Steps`. From the example the user
gave:

```markdown
## 1. Injury Database – Value?

- What's the value proposition of the injury database component
- Who would pay for it / who cares about this data?
- How it fits into the wider Trace offering

## 2. Rugby Strategy Data Analysis

- Live app idea for coaching strategy decisions
- We'd have to pay for rugby data from Stats Perform and this would be expensive
- Technical shape: data ingestion, LLM layer, output/UX for coaches

## Next Steps
...
```

Points to hold:

- **A section is a topic, not a record.** Its heading is what the meeting is about; a task or
  note id appears in a bullet if it is relevant, and often nothing does.
- **Bullets are prose.** Half of them are questions. They are what someone wants said out loud,
  not a status.
- **`Next Steps` is always the last section**, and is usually empty until the meeting happens.

## What "agenda" should say

Roughly: the draft exists, here is where, add tasks, notes, decisions or anything else. One or
two lines. **No listing, no suggestions, no summary of what is outstanding** — the same rule the
board rendering already follows.

## Settled: the draft holds unique content, and is not backed up

`PLT-ehd6` put the draft in `.notes/` on a specific test — the tree forbids depending on it as a
**source of truth**, and an agenda passed because everything on it existed elsewhere. *Delete it
and you lose a few minutes of picking, not information.*

**Free thoughts break that test.** Five sections of strategy written for Tuesday exist nowhere
else, and `.notes/` is gitignored, disposable and absent from a teammate's checkout. Losing it
before the meeting loses real work.

**Accepted, knowingly.** The draft is for one meeting. What survives is what the meeting
produced — notes promoted, decisions written, tasks filed — which is the pipeline `DEC-012`
already sets for transcripts: distilled, not stored. An agenda is scaffolding in exactly the
same way.

So the cost is real and stated rather than engineered around: **an unsent agenda is not backed
up.** Lose the machine, or `rm` the file, and Tuesday's thinking is gone. That has to be said
where someone will read it before it bites, not discovered afterwards.

Rejected:

- **Move the draft somewhere committed.** Makes it a fourth record type and reopens what
  `PLT-ehd6` settled — a stored agenda is a second copy of the board that goes stale, and now
  also a half-formed strategy document in everyone's diff.
- **Capture to notes on send.** Sending is the moment the thinking stops being private, so this
  is tempting. Rejected as automatic: most bullets are questions for one meeting and would fill
  `notes/` with material nobody will process. If something on an agenda deserves keeping, `nm add`
  says so deliberately — which is a person's judgement, not a side effect of posting.

## Acceptance

- [x] Saying "agenda" creates the draft and names the sources in a line or two; it lists nothing
- [x] The draft is created with the section-and-bullets shape, ready to be filled
- [x] Free-text sections that reference no record are first-class, not a special case
- [x] `Next Steps` is present and last
- [x] The unique-content question above is answered — accepted, with the cost stated
- [x] "An unsent agenda is not backed up" is said somewhere a user meets it, not only here
- [x] Whatever `tm agenda` no longer does is removed rather than left unused

## Log

- 2026-08-17 — The candidate listing is gone entirely, not hidden behind a flag. `agenda_candidates`
  and `agenda_notes` deleted with it.
- 2026-08-17 — The scaffold is `## Next Steps` and nothing else. A numbered heading with an empty
  bullet under it is a form to fill in, and this is not a form; sections go above it.
- 2026-08-17 — `--send` refuses a draft holding only the scaffold. "Has bytes in it" stopped being
  the same question as "has anything on it" the moment `tm agenda` started writing the file.
- 2026-08-17 — "It is not backed up" is printed when the draft is created, which is where someone
  meets it. Also in the ontology, with the two rejected alternatives.
- 2026-08-17 — The `tm` skill is 31 tokens over budget and I stopped shaving rather than degrade
  it further. Filed as `PLT-rsn4`: the budget was calibrated at eight commands and there are
  twelve, so the question is whether 4,000 is still the right number rather than what else to cut.
