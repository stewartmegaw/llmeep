---
id: DEC-025
title: The notes window narrows only on prune, and the render is bounded separately
status: accepted
decided: 2026-08-02
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-012, DEC-023]
---

# DEC-025 — The window narrows only on `prune`, and the render is bounded separately

## Context

The task that opened this asked whether 200 was the right size for `notes.md`, given the board
keeps only 15 in `recent`.

The comparison does not hold — `recent` is a courtesy tail of *finished* work, while `notes.md`
holds live context — but looking at it found three real faults.

**The window narrowed silently, on every write.** `Archive.save()` ran `del self.notes[WINDOW:]`,
so adding the 201st note evicted the oldest with no output. For a note like *"their platform
standardised on Postgres 16"* — durable context nobody will ever action — silent eviction is the
one loss mode that matters, because nothing prompts you to notice.

**That made two other things unreachable.** `prune` reported how many entries were over the
window, and `check` errored if `notes.md` exceeded it. Neither could ever fire, because `save()`
had already truncated. Two guards, both dead, both looking alive.

**And a leak.** `DEC-023` removes a shipped note's history row, but computed the set from notes
*in the window*. A note that fell out of the window while its task was still open became
unreachable — one idea recorded in two ledgers, permanently. `NTE-zuhc` was in exactly that
state.

## Decision

**`save()` sorts and never truncates. `prune` narrows.**

Narrowing is a deliberate act with a dry run, like every other destructive operation here. It is
not a side effect of adding a note.

```
~ notes.md holds 6, the window is 4 — `nm prune` to narrow it
```

`check` warns rather than errors — being over the window is a state to resolve, not a broken
record.

**`prune` scans history, not just the window**, so a shipped note is reachable however long ago
it left view.

**Storage and presentation are bounded separately, by different numbers.** The file keeps 200
because an agent reads it whole cheaply. A rendered list shows the 20 most recent and says how
many remain, because a person on a phone cannot scan 200. This is
[principle 1](../../ontology/principles.md#1-machine-first-representation) — presentation is a
separate concern from storage — and conflating them is what made 200 look like the problem.

**200 stands.** With eviction now deliberate and the render bounded, the number governs only how
much history a `prune` keeps, where generous is the safer direction.

## Alternatives considered

- **Cut the window to match the board's 15.** What the task proposed. Rejected: `recent` is
  finished work that git already holds, while `notes.md` is live context whose loss is silent.
  The two want opposite defaults.
- **Keep truncating in `save()` but log it.** Smaller change. Rejected — a destructive default
  with a message is still a destructive default, and every other narrowing operation in this
  project asks first.
- **Drop `WINDOW` entirely and let the archive grow.** Tempting once the render is bounded, and
  nearly right. Rejected because `prune` would lose its purpose for the archive, and an unbounded
  file eventually stops being "read whole" without anyone deciding that it should.

## Consequences

- **`notes.md` can now exceed 200** between prunes. `check` says so on every commit.
- **Nothing evicts a note without being asked.** The three ways to lose one — `drop`, `prune`
  shipped, `prune` window — are now all explicit, closing the gap `DEC-024` flagged.
- **Found by testing, not review**: removing the truncation broke `prune`, which had been relying
  on `save()` to do the narrowing. The comment said `# save() enforces the window` and stopped
  being true in the same commit that made the window matter.
- **`NTE-zuhc`'s orphaned row is gone**, and the archive and history now reconcile exactly.

## Revisit when

- Anyone runs a real project through this for a month. Every number here — 200, 20, 15 — is a
  guess made without a single day of production use.
