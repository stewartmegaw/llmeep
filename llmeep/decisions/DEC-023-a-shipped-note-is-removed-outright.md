---
id: DEC-023
title: A shipped note is removed outright, history row included
status: accepted
decided: 2026-08-02
deciders: [stew]
supersedes: [DEC-022]
superseded_by: []
relates_to: [DEC-012]
---

# DEC-023 — A shipped note is removed outright, history row included

## Context

`DEC-022` took a shipped note out of the window and kept its `history.tsv` row, on the same
provenance argument `DEC-012` made: the row records where a task came from.

The question that undid it: **why store one idea in two ledgers?**

Normal use is to curate a note until it becomes a task, and curate the task thereafter. Once
`PLT-9wmv` has a permanent row in `tasks/_tooling/history.tsv`, the note's row adds one field
that the task lacks — `src:` — and duplicates the rest.

It is not free. `nm check` reads taskman's board *and* its history on every commit, purely to
verify each note's `task:` link still resolves. That coupling exists only because the note
outlives promotion.

And `DEC-012`'s justification is simply wrong. It claims provenance is something *"git cannot
reconstruct"* — but the note was committed when it was written. `git log -S NTE-zuhc` finds it.
That is [principle 6](../../ontology/principles.md#6-context-is-tiered-and-the-working-tree-is-bounded)
exactly, and it was not applied here.

## Decision

**`nm prune` deletes a shipped note entirely — window line and history row.**

```
NTE-br2j  shipped as PLT-ghkg — removed, git keeps it
```

**Shipped, not promoted.** A promoted task can be parked, or dropped by hand, and only `done`
writes a task history row. Until the task ships, the note is the only record the idea ever
existed, and it stays. That distinction is the whole reason this is a `prune` rule rather than
something `promote` does.

**No tombstone.** Marking the row as removed would leave a second record of the thing being
removed for being a second record.

This is the second exception to append-only in `notes/`, after `promote` rewriting a row to add
its task id. Both are now named in `notes/_tooling/ontology.md`.

## Alternatives considered

- **Carry `src:` onto the task, then drop the note row.** One permanent record with provenance
  intact. Rejected as not worth a new column in taskman's history and a notes-shaped concept
  inside taskman — for a field that is usually `null` and rarely asked about.
- **Keep the row, as `DEC-022` decided.** Defensible if *"which customer asked for this"* is a
  frequent question. It is not, for a team of this size, and the per-commit link check is a real
  standing cost.
- **Delete on promote.** Loses ideas whose tasks are dropped, which is the failure `DEC-022`
  correctly avoided.

## Consequences

- **`nm find` no longer returns shipped notes.** Provenance moves from `find` to `git log -S`,
  which is slower and deliberate — the same bargain the board already makes with `recent`.
- **`nm check`'s link validation shrinks** to notes still in the window, since the rest are gone.
- **`DEC-022` is superseded within the hour.** Its diagnosis — that the window evicts, and that
  hiding at render was a display fix for a storage fault — stands. Only its conclusion about the
  history row changes.
- **Verified end to end in a copy of the repo**: note → promote → done → prune, with both files
  checked before and after and `nm check` passing. Not tested against the live ledgers, because a
  test that pollutes an append-only file is not a test worth running.

## Revisit when

- Someone asks *"which call did this come from"* about shipped work more than once. That is the
  signal the rejected first alternative was right, and carrying `src:` onto the task becomes
  worth its column.
