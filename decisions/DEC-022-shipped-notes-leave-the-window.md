---
id: DEC-022
title: A note whose task shipped leaves the window
status: superseded
decided: 2026-08-02
deciders: [stew]
supersedes: []
superseded_by: [DEC-023]
relates_to: [DEC-012]
---

# DEC-022 — A note whose task shipped leaves the window

## Context

`DEC-012` says **"a promoted note is not deleted"**, on the grounds that it records where a task
came from — a thing git cannot reconstruct.

That reasoning holds. The conclusion drawn from it did not, because it conflated two files:

| | |
| --- | --- |
| `notes.md` | the **window** — 200 entries, read whole, narrowed by `prune` |
| `history.tsv` | the **record** — every note ever, append-only, grepped by `find` |

The provenance `DEC-012` wanted to protect lives in `history.tsv` and was never at risk.
Removing a note from `notes.md` loses nothing, in exactly the way `recent` falling off the board
loses nothing.

**And the window evicts.** `nm:116` is `del self.notes[WINDOW:]` on every save. So a note about
work that already shipped does not merely clutter the list — it occupies a slot and pushes an
unactioned idea out of view. That is the wrong trade in a system whose entire claim is that the
working tree stays small enough to read.

The first attempt at this hid shipped notes at render time. That was worse than doing nothing: it
made the list look right while the file kept filling, so the eviction carried on invisibly.

## Decision

**`nm prune` removes notes whose linked task appears in taskman's history.**

```
  NTE-zuhc  shipped as PLT-9wmv

  ✓ pruned 0 capture(s), 1 shipped, 0 over the window
```

The note is gone from `notes.md`; the row stays in `history.tsv`; `nm find digest` still returns
it with its task id attached. Nothing about `DEC-012`'s provenance claim is lost.

**Until pruned, a shipped note renders with a `✓`.** It is on its way out rather than hidden, and
the tick is the prompt to run `prune`.

**`nm` reads taskman's ledger directly** rather than taskman notifying notes on `done`. `check`
already reads it to validate task links, and the alternative couples the two subsystems in the
direction that matters — `tm done` would have to know that notes exist.

## Alternatives considered

- **Keep them forever, as `DEC-012` says.** Rejected on the eviction: at the cap, a shipped note
  displaces a live one. If the window were unbounded this would be a matter of taste.
- **Hide at render, keep in the file.** What was built first. Rejected once the eviction was
  understood — a display fix for a storage problem, hiding the symptom and preserving the fault.
- **Delete on promote.** Simpler, and wrong: a promoted task can be parked, dropped, or never
  finished. The note is the record that the idea existed, and it should survive until the idea
  has actually been dealt with.
- **`tm done` tells `nm`.** Immediate rather than waiting for a prune, but it makes taskman
  depend on notes existing, against `DEC-012`'s own reason for splitting them.

## Consequences

- **`DEC-012` states a rule this narrows.** Following `DEC-013`'s precedent, that record is not
  edited and not marked superseded — the pipeline it describes is otherwise intact. Read its
  "not deleted" as "not deleted from `history.tsv`".
- **Provenance now needs `find` to reach.** It was previously visible by reading `notes.md`. That
  is the same bargain the board already makes with `recent`.
- **Nothing removes a note whose task was never finished**, by design. An idea that went nowhere
  stays visible, which is usually the point of having written it down.

## Revisit when

- Someone wants the note gone the moment the task closes, without waiting for a `prune`. That
  wants an event, and events want coupling — worth the cost only if the delay actually bites.
