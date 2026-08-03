---
id: DEC-020
title: Adoption is per subsystem, and notes needs its own reset
status: accepted
decided: 2026-08-02
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-012, DEC-019]
---

# DEC-020 — Adoption is per subsystem, and notes needs its own reset

## Context

`tm reset` and `tasks/UNADOPTED.md` exist because a clone of `main` inherits the skeleton's
task history, and `add`/`go` search that history automatically — so the tool answers *"have we
tried this before?"* with a stranger's work.

`notes/` had exactly the same exposure and none of the machinery. **`nm` had no `reset`
command at all**, so the skeleton's notes were not merely inherited but *uncleanable* without
hand-editing two files. `nm add` runs the same automatic related-history search that made this
worth solving for tasks.

**Notes are the worse case.** A stale task reads as a stale task. An inherited note reads as
something *your team said*. The six notes in this archive are observations about this repo's own
internals — which rendering approaches failed, what someone thought the board should do next.
Cloned into an unrelated project they become confident statements of context that nobody there
ever made.

## Decision

**Each subsystem owns its own adoption.** `notes/` gets `nm reset` and `notes/UNADOPTED.md`,
mirroring `tasks/`:

```sh
tasks/_tooling/tm reset --yes   # boards, history, sidecars
notes/_tooling/nm reset --yes     # archive, history, raw/
```

**Two commands, not one.** A single `reset` covering both would be more convenient exactly once,
and would couple two subsystems that `DEC-012` deliberately keeps liftable apart — someone taking
`notes/` alone into another project should get a working adoption path with it. `tm reset` does
not touch notes; `nm reset` does not touch tasks. Each says so in its output.

`nm reset` keeps `ontology.md`, `nm` and `decisions/` — the same principle as `tm reset`, which
keeps what explains the design and clears what is specific to a project.

## Alternatives considered

- **One `reset` at the repo root.** Fewer commands, and adoption is realistically a single
  moment. Rejected on the coupling: it would need a third executable, or one subsystem reaching
  into the other, to save one line typed once in a project's life.
- **A single `UNADOPTED.md` at the repo root.** Tempting, and honestly close. Rejected because
  the marker is also the mechanism — each tool deletes its own on reset, and a shared file has no
  correct owner when only one subsystem has been adopted.
- **No marker for notes, just the command.** Rejected: the marker is what makes the problem
  visible to someone who has not read the README, which is the entire population it exists for.

## Consequences

- **Adopting the whole skeleton is two commands.** Stated in `README.md` and in both markers,
  rather than left to be discovered.
- **A partially adopted repo is now representable** — tasks reset, notes not — and the remaining
  marker says which.
- **Found while implementing: `tm reset` wrote a history header without the `who` column**
  `DEC-010` added, so a reset repo's first completion would sit under a four-column header. Fixed
  in the same change.
- **`--yes` was verified against a copy of `notes/`, not the live tree.** A destructive command
  tested only in dry-run is a destructive command that has not been tested.

## Revisit when

- A third subsystem appears. Three adoption commands is where this stops being reasonable and
  a shared convention — a marker interface, not a shared file — starts earning its keep.
