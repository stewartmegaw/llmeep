---
id: DEC-015
title: The standup nudges from a hook and only ever sends by hand
status: superseded
decided: 2026-08-01
deciders: [stew]
supersedes: []
superseded_by: [DEC-016]
relates_to: [DEC-006, DEC-008, DEC-009]
---

# DEC-015 — The standup nudges from a hook and only ever sends by hand

## Context

Everything in this system is **pull**. You ask, the agent reads the board. `DEC-006` made the
notification channel outbound-only precisely because input belongs in the conversation.

A periodic report of completed work is the one genuinely **push** artifact, and the argument
for it is [principle 6](../../ontology/principles.md#6-context-is-tiered-and-the-working-tree-is-bounded)
pointed at a person rather than an agent: retrieval that has to be *decided on* loses that
coin flip indefinitely. Nobody spontaneously thinks to look back over the week. Completed
tasks also fall out of `recent` as the window fills, so the raw material actively leaves view.

The data already exists. `tasks/history.tsv` carries `date · id · ledger · title · who`,
unbounded and append-only. A period's report is a filter on the date column — no new records,
nothing to keep in sync.

**The hard part was never the report. It was the trigger.**

## Decision

**`tm standup` prints. `tm standup --send` posts. The commit hook only ever nudges.**

```
  ~ no weekly standup for 2026-W31 — run `tm standup` to see it
```

Three things follow from that split.

**The hook cannot send.** A `post-commit` hook fires on whichever machine happened to commit.
Make it post and a three-person team gets three standups, or none, depending on who pulled.
There is no way to fix that without shared state, and shared state here is a one-line file
every hook rewrites — a merge conflict every period, in the records directory, forever.

A **nudge** dissolves the problem instead of solving it. Appearing twice costs nothing;
broadcasting twice is unrecallable and embarrassing. So the marker can be local.

**The marker lives in `.notes/standup`.** Gitignored, disposable, one machine's memory —
exactly what [principle 4](../../ontology/principles.md#4-committed-knowledge-and-local-memory-are-different-things)
describes. It records the last period *seen*, not the last one *sent*, so the nudge appears
once a period rather than once a commit.

**The period is configuration, not a guess.** `STANDUP_PERIOD` in `.env`, defaulting to
`weekly`:

| Period | Window | Fires |
| --- | --- | --- |
| `daily` | 1 day | every day |
| `workday` | 1 day, 3 on a Monday | weekdays only |
| `bidaily` | 2 days | every other day |
| `weekly` | 7 days | once an ISO week |

`bidaily` buckets from the ordinal epoch so two machines agree on where the boundary falls
without sharing anything.

## Alternatives considered

- **Cron.** Needs a machine that is always on, which a small team does not have, and
  scheduling infrastructure is a vendor in the skeleton — [principle 3](../../ontology/principles.md#3-agnostic-core)
  failing at exactly the point it is meant to hold.
- **A committed marker, hook sends.** The only way to get one standup per team automatically.
  Rejected on the conflict cost above, and because an irreversible broadcast triggered by a
  hook is the thing people disable the hook to escape — the same reasoning as `DEC-009`.
- **A window of "everything since the last standup".** Reads better, but the last one may have
  been sent from a colleague's machine, so the contents would depend on who ran it. A fixed
  lookback can overlap when someone reports early; that is the cheaper fault.
- **Nothing.** The system is pull-based and consistent about it. Rejected because the standup
  is the one part of the ceremony Jira replaced that was doing real work, and its value grows
  with team size rather than shrinking.

## Consequences

- **`notify()` splits into `notify_text()` plus a formatter.** The standup posts arbitrary
  text, so dispatch had to stop assuming its caller has a `Task`. One channel lookup, as
  `DEC-008` requires.
- **The report includes what is still in progress.** Work that has sat across a whole period
  is the part someone should react to, and nothing else surfaces it.
- **It cannot say how long something has been in progress.** The board records no start date.
  Listing it is honest; claiming "4 days" would not be.
- **A quiet period is silent.** No completions and nothing in progress means no nudge and no
  report, rather than a message saying so.

## Revisit when

- A team runs this for a month and the nudge is still being ignored. That would mean the push
  artifact is not wanted after all, and the honest response is to delete it rather than make it
  louder.
- The board grows a start timestamp for some other reason, at which point ageing in-progress
  work becomes reportable and should be.
