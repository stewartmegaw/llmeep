---
id: DEC-024
title: Drop means remove, in both subsystems, for both kinds of thing
status: accepted
decided: 2026-08-02
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-012, DEC-023]
---

# DEC-024 — `drop` means remove, in both subsystems, for both kinds of thing

## Context

Two faults, one word.

**There was no way to remove a note.** Every archive correction during the skeleton's own build
was a hand edit of `notes.md` and `notes/_tooling/history.tsv` — five separate times, including
removing invented example notes that had been sitting in the real archive for a day. That is
precisely what [principle 2](../../ontology/principles.md#2-mutation-flows-through-tooling) exists
to prevent, and the gap was invisible because the hand edit always worked.

**`drop` already meant something else.** `nm drop <file>` marked a raw capture processed, while
`drop` on the rendered task board meant *delete this line*. One word, two meanings, across two
subsystems a reader is told are mirrors.

## Decision

**`nm drop <NTE-id | file>` removes the thing named.**

```
  dropped NTE-n9ex  throwaway to prove drop works
  git keeps it — `git log -S NTE-n9ex`
```

**One verb, not two.** `drop` already means *get rid of this* on the board; a second word for the
same intention is a second thing to remember, and this project has repeatedly chosen fewer
commands over more precise ones.

**Dispatch on shape is not a guess.** An `NTE-` id and a filename cannot be mistaken for each
other, so nothing is being inferred about intent — the distinction is in the argument, written
down, exactly as [principle 7](../../ontology/principles.md#7-judgement-belongs-to-the-agent-mechanism-belongs-to-the-tool)
requires. A pair of forms that *could* collide would need two commands.

**Dropping a note takes its history row with it.** A note that should not exist should not exist
anywhere, and the parallel is exact: dropping a task line leaves nothing in taskman's ledger
either, because only `done` ever writes there. Git holds both.

**It acts immediately, with no `--yes`.** `reset` and `prune` are dry by default because they are
bulk operations whose scope is not obvious from the command. `drop` names one record, and the
line it prints is the confirmation.

## Alternatives considered

- **A second verb — `nm forget`, `nm rm`.** Keeps `drop` pointing only at captures. Rejected: the
  collision is with the *task board's* `drop`, which is the more visible surface, so a new word
  would leave the confusing pair intact and add a third.
- **Rename the capture command instead** — `nm processed <file>`. More literal, and it frees
  `drop` cleanly. Rejected on cost: the capture case is the rarer one, and a longer word for it
  buys nothing a shared verb does not.
- **Keep the note's history row.** Consistent with `promote`'s old reasoning. Rejected under
  `DEC-023` — the row's only remaining value was provenance for work that shipped, and a dropped
  note by definition did not.

## Consequences

- **`nm find` no longer returns dropped notes**, matching pruned ones. `git log -S <id>` is the
  retrieval path, and the command prints that line so nobody has to remember it.
- **A note pointing at a task can still be dropped**, and says so — the task is untouched. The
  reverse case, a task whose note vanished, was already the normal state after `prune`.
- **Three ways to lose a note now exist**: `drop` (deliberate), `prune` (shipped), and the 200
  window (age). Only the third is silent, and `PLT-rnqp` is open on whether that window is the
  right size.

## Revisit when

- A user drops the wrong note and finds `git log -S` an unacceptable recovery path. That would
  argue for the dry-run flag this decision declined to add.
