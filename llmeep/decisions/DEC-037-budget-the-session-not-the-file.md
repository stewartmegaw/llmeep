---
id: DEC-037
title: Context is budgeted per session, not per file
status: accepted
decided: 2026-08-17
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-003, DEC-029]
---

# DEC-037 — Context is budgeted per session, not per file

## Context

`tm check --context` warned when a skill file passed 4,000 tokens. That number was ~10% headroom
over where measuring happened to put the `tm` skill when the check was written, and the tool had
eight commands.

It has twelve now. `drop`, `agenda` and `feedback` arrived, `park` gained a second destination,
and each needs a usage line, usually a row in the phrase table, and sometimes a paragraph
describing a judgement the executable deliberately refuses to make. On 2026-08-17 the warning
fired five times in one day and was cleared four of those by rewording — 4,147 to 4,031 in one
round, with no structural change. That is the point at which a budget stops measuring anything
and starts degrading the file it guards.

Two things were wrong underneath.

**A skill is not the cost.** An agent working on tasks loads the skill *and* the board. The board
grows with the project until the `recent` cap bounds it, which is the one thing in this design
that could make the cost grow with the number of tasks — the property the cap exists to protect —
and nothing was watching it. The check computed the session total and printed it, then budgeted
the file anyway.

**A per-file ceiling cannot tell two kinds of growth apart.** Drift — a file quietly accreting —
is what the budget was written for, and `PLT-fnxy` found real drift in 2026-08-10. Growth in the
tool's surface is a different thing, legitimate, and it fires the same warning.

## Decision

**Budget the session: a skill plus the record file read to answer with it.**

```
a task session   ~4591 tokens   tm skill plus platform board
a notes session  ~1934 tokens   nm skill plus notes archive
```

**`SESSION_BUDGET = 5000`**, and it covers both subsystems. The notes session was unbudgeted and
unmeasured before this; `notes.md` holds up to 200 notes and is read whole, so it is exactly the
shape of thing that grows unnoticed.

The basis for the number: a session has to stay a small fraction of a working context — low
single-digit percent — because the argument for keeping records in the repo at all is that
carrying them is obviously cheaper than the tracker they replace. Anything in that range is
defensible; what is not defensible is creep, which is what the check exists to catch.

**Moving it is a decision.** Not a convenience when a warning is inconvenient. The promise it
guards is that the cost is flat in the size of the *project* — a bigger backlog must never cost
more, which the `recent` cap delivers and this now verifies.

## Alternatives considered

- **Keep the file budget and cut the skill under it.** Tried, in the same session. What remains
  is not padding: the two rendering sections are format contracts, the phrase table maps natural
  speech to commands, and the rest is rules that stop an agent hand-editing records or skipping a
  task. Getting 180 tokens out meant rewording sentences until they read worse.
- **Move the rendering rules to a second file, read on demand.** Would take ~1,000 tokens out of
  the always-loaded file, and it is the right shape of answer — the same split as *the skill
  states the rule, the ontology holds the argument*. Rejected for now because the most common
  reason the `tm` skill loads at all is someone asking to see their tasks, so the file would be
  read most sessions anyway, trading a saving for a round trip. Worth revisiting if the skill
  grows again.
- **Scale the budget with the number of commands.** Honest about the real driver and useless as a
  guard: a budget that grows whenever the thing it measures grows is not a budget.
- **Drop the check.** It has earned its place twice — `PLT-c4zq` was filed believing the ontology
  was the file filling context, and measuring showed it was the skill.

## Consequences

- **This is a relaxation, and saying so plainly matters.** 5,000 on a session containing a
  ~480-token board is ~4,520 for the skill, against 4,000 before. The measurement is better and
  the ceiling is 13% higher; both are true, and the second was not an accident of the first.
- **The board is now watched**, so a project that somehow grew its board past the `recent` cap
  would trip the same warning. Nothing did that before.
- **The notes side is measured for the first time**, at roughly a third of its budget.
- **~410 tokens of headroom**, which is three or four more commands at the rate this month set.
  The next time it fires, the answer is probably the on-demand rendering file rather than another
  round of rewording.

## Revisit when

- The warning fires again. The trim has been done; the next answer is structural.
- Someone measures what a session actually costs against a real context window rather than
  against a number chosen for its shape, and finds low single-digit percent is the wrong target.
