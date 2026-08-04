---
id: DEC-002
title: Task history is an append-only index, searched automatically by add and do
status: accepted
decided: 2026-07-31
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-001, PLT-003, PLT-004]
---

# DEC-002 — Task history is an append-only index, searched automatically by `add` and `go`

## Context

[`DEC-001`](DEC-001-taskman-design.md) bounds the board at 15 recent tasks, with everything
older recoverable from git. That left a hazard named but unsolved: **an agent cannot see that
an approach was already tried and will not think to look.** The instruction to search was
written into [principle 6](../../ontology/principles.md) and the taskman README, but an
instruction an agent must *decide* to follow will lose that coin flip indefinitely. Bounded
context without retrieval is forgetting on a schedule.

Two problems had to be solved together.

**Retrieval had to be free.** Reconstructing past tasks from git is genuinely awkward:
reordering churns the board constantly, so `git log -p -- board.md` shows the same task line
added and removed dozens of times. Deduping that on every operation is slow and fragile — and
a slow automatic search is one that gets switched off.

**Searching had to stop being a decision.** Any design where the agent must remember to
search fails for the same reason the convention it replaced failed.

## Decision

**`tasks/history.tsv` is an append-only index of every completed task**, written by `done`,
one line per completion:

```
#date	id	ledger	title	commit
2026-07-30	PLT-011	platform	Cache warm on boot	a3f21c8
```

**It is never read whole — only grepped.** That property is what distinguishes it from a
board: a board is always loaded and must stay bounded; history costs zero context because
nothing loads it. It grows forever, and that is fine.

**`add` and `go` search it automatically**, always, and print matches inline. Searching stops
being an act the agent performs and becomes a property of operations it already performs.
`find` remains for explicit digging.

Two constraints keep the automatic search from decaying into noise: **at most 3 hits**, and
**print nothing when there are none**. A section that is usually absent gets read when it
appears; one that is always present with weak matches gets skipped within a week.

## Alternatives considered

- **Pure git archaeology — no index file.** Strictly honours principle 6, but reorder churn
  makes the log noisy, and parsing it is slow enough that nobody would run it automatically.
  It optimised for a principle at the cost of the thing the principle exists to enable.
- **Index generated into `.notes/` on demand.** No repo growth, no redundancy — but every
  clone and every fresh agent rebuilds it cold, and `.notes/` is explicitly something nothing
  may depend on ([principle 4](../../ontology/principles.md)).
- **Instruction only — keep the README wording, add nothing.** This was the status quo, and
  it is what prompted the question. Advisory retrieval does not survive context compaction.
- **A `history:` pointer line on the board.** Rejected for now: it puts an instruction where
  it is always read, but it is still advisory, and covering `add` and `go` mechanically
  addresses the cases that matter. Revisit if free-form discussion proves to be a real gap.
- **A commit hook warning on resemblance to reverted work.** Catches the most, but fires
  after the work is done, which is the wrong moment for this particular failure.

## Consequences

- The amnesia hazard is closed **at the entry points**. Creating a task surfaces duplicates;
  starting one surfaces prior attempts. Neither requires anyone to remember anything.
- `find` becomes a grep of one local file rather than git archaeology — simple enough to be
  reliable, which is what makes it safe to run automatically.
- **One committed file grows without bound.** Accepted knowingly, in tension with principle 6.
  The reconciliation: principle 6 bounds what is *loaded*, not what is *stored*, and an index
  is not duplication — it is what makes stored data cheap to query.
- **The residual gap is real.** Free-form discussion that invokes no skill triggers no search.
  Nothing mechanical covers that case, and this decision does not pretend otherwise.
- History must be treated as append-only. Rewriting it would silently destroy the record that
  makes the bounded board safe.

## Revisit when

- The automatic search proves noisy enough that people start ignoring it — the 3-hit cap or
  the matching heuristic is then wrong.
- Free-form discussion turns out to be where duplicated work actually originates, which would
  justify the board pointer line after all.
- `history.tsv` grows large enough that grep is no longer instant. That is a long way off, and
  the fix then is an index format, not a smaller record.
