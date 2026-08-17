---
id: PLT-ntec
title: Agenda points should pull in aligned records, and hand unknowns back as tasks or notes
created: 2026-08-17
---

# PLT-ntec — Agenda points should pull in aligned records, and hand unknowns back as tasks or notes

## Outcome

An agenda point arrives with whatever the project already knows about it attached, and the
questions it leaves behind get offered back as notes or tasks. The records feed the meeting and
the meeting feeds the records.

## Context

`PLT-s9e7` made the agenda user-driven and deleted the candidate listing, which left the records
out of it entirely. That went one step too far in the other direction: someone naming a topic
should not have to remember that a task exists about it, or that it was captured as a note three
weeks ago, or that a decision already settled part of it.

**This is not the candidate list coming back, and the difference is direction.** That list
arrived unasked and framed the meeting around whatever the board happened to notice — proposing
the agenda. This answers a topic a person raised — researching it. One is the tool having an
opinion about what matters; the other is the tool being useful about what was said.

The search tools are already there and each is better at its own corner than a merged list was:
`tm find` over completed work, the boards for live tasks, `nm find` over every note captured,
`tm why` over the decisions.

## Handing the gaps back

An agenda is mostly questions, and a question that survives being written down is usually one of
two things:

| On the agenda | Offer to file |
| --- | --- |
| A question nobody can answer yet — a cost, a constraint, what a customer wants | a **note**, because it is context that will change a plan later |
| Something that plainly has to be done, discovered while writing the agenda | a **task**, filed now rather than remembered |

**Suggest; never file unasked.** The point of writing an agenda is to find out what you do not
know, and turning every unknown into a record automatically buries the few that matter. Same
judgement `nm` asks for when distilling a transcript: most of it does not survive, and the test
is whether anyone would act differently for having read it.

## Acceptance

- [x] Naming a topic prompts a search of tasks, notes and decisions, and aligned records become
      bullets under that heading
- [x] The difference from the deleted candidate list is written down, so it is not read as a
      reversal
- [x] Unknowns are offered as notes or tasks, and nothing is filed without being asked
- [x] No new command — the search tools already exist and the judgement is the agent's
      (principle 7)

## Log

- 2026-08-17 — No code. Both halves are agent behaviour over commands that already exist, which
  is where they belong: deciding whether a note from three weeks ago is *aligned* with a topic
  is exactly the judgement `tm` refuses to make.
- 2026-08-17 — Cost 127 tokens of skill, taking it to ~4,158 against a 4,000 budget. Recorded in
  `PLT-rsn4` rather than paid for by shaving prose again — the file is not drifting, its subject
  is getting bigger.
