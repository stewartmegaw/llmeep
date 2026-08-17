---
id: PLT-4daz
title: "Agenda: offer found records rather than adding them, and show the whole draft after every change"
created: 2026-08-17
---

# PLT-4daz — Agenda: offer found records rather than adding them, and show the whole draft after every change

## Outcome

Nothing reaches an agenda that its owner did not put there or say yes to, and they have seen the
whole thing every time it changed.

## Context

`PLT-ntec` shipped two behaviours with inconsistent guards, and the inconsistency was spotted
immediately: filing a note or task was **suggest, never unasked**, while padding a point with an
aligned record just wrote it in.

There was a reason — a padded bullet lands in a gitignored scratch file with `--send` as a second
gate, and a filed note lands in the repo permanently. But it misses what makes an agenda
different from everything else in `.notes/`: **it is posted under someone's name and read aloud
to other people.** A bullet they did not write and did not notice is a different kind of mistake
there than in a scratch file.

## Decided

**Their words go in; what the search found is offered.** Aligned records are named **once per
section** and wait for a yes. Batched rather than per record, because a five-section agenda
confirmed line by line is a conversation nobody finishes — and per section is where the user is
already thinking anyway.

**The whole agenda is printed after every change.** Not a summary of what changed — the draft as
it now stands. This is the stronger of the two guards: a confirmation covers the moment of
insertion, while printing the draft means the person sending it has actually seen what they are
sending, every time, including the parts they wrote themselves and have since forgotten.

## Acceptance

- [x] Records found by searching are offered, batched per section, never written unasked
- [x] The user's own words still go straight in — the guard is on what the agent found
- [x] The full draft is printed after every change, not a diff or a summary
- [x] The reason is recorded, so the guard is not dropped later as ceremony

## Log

- 2026-08-17 — No code, both halves being agent behaviour. Costs another ~23 tokens of skill,
  which is `PLT-rsn4`'s problem and increasingly obviously so.
