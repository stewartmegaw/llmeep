---
id: DEC-011
title: Titles are capped at 120 characters; sidecars may be folders
status: accepted
decided: 2026-07-31
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-001, DEC-010]
---

# DEC-011 — Titles are capped at 120 characters; sidecars may be folders

## Context

Titles were unbounded. `DEC-001` said "a title is the floor and usually the ceiling" and left it
at that, which works while everyone writing tasks shares the same taste. With more than one
developer ([`DEC-010`](DEC-010-tasks-carry-an-assignee.md)) that stops holding, and an
unbounded title pushes the board past readable width — the board being the artifact read far
more often than any sidecar.

The same pressure exists one level down. Some tasks genuinely need a spec *and* a rubric *and*
sample data, and a single markdown file is the wrong container for that. Forcing them into one
file is the same mistake as forcing them into a title.

## Decision

**Titles are capped at 120 characters, with two sentences as the guide.**

- The **character cap is enforced** — `tm add` refuses, and `check` rejects any board line over
  it, so a hand-edited title is caught too.
- The **sentence count only warns.** Counting terminal punctuation false-positives on "e.g."
  and version numbers, and a heuristic that blocks legitimate work is worse than one that
  mentions it. Same reasoning as the ontology-currency check.

**A sidecar may be a folder.** `tasks/<id>-<slug>.md` or `tasks/<id>-<slug>/`, interchangeably.

- A folder's entry point is its **`README.md`** — the same "start here" convention the skeleton
  uses everywhere, and the reason it has no `CLAUDE.md`.
- **A folder without a `README.md` is an error**: nothing to read, and the acceptance gate has
  nowhere to look.
- Everything else in the folder is supporting material. `go` lists it, so the agent knows what
  is there without globbing.

## Alternatives considered

- **Leave titles unbounded and rely on taste.** What `DEC-001` did. Works for one person; with
  several it means the board's width depends on whoever last typed a task.
- **Enforce the sentence count too.** Rejected: `"Bump deps to v1.2. Rerun the e.g. suite."`
  counts as four sentences under any cheap heuristic, and blocking that is worse than the
  rambling title it would prevent.
- **A softer cap that warns rather than blocks.** Rejected for the character limit specifically:
  it is exact and mechanical, so there is no reason to be uncertain about it. Warnings are for
  the things a machine can only guess at.
- **Sidecars stay single files; use a naming convention for extras**
  (`<id>-<slug>-rubric.md`). Rejected: it puts structure in filenames, and `check` would have to
  learn which suffixes are companions rather than separate sidecars.

## Consequences

- **A long title is now a hard stop, not a nudge.** Someone mid-thought has to shorten it and
  open a sidecar. That is the intended friction — it is where the detail belonged anyway.
- **`sidecar_path` returns a file or a directory**, and every caller goes through `sidecar_doc`
  to get something readable. A caller that opens the returned path directly will break on
  folders.
- **120 is a judgement call.** The longest title in the project at the time of writing was 71
  characters, so the cap has roughly 70% headroom over observed practice.

## Revisit when

- 120 turns out to bite regularly rather than occasionally, which would mean it is measuring the
  wrong thing.
- Folder sidecars accumulate enough convention (fixed filenames, expected structure) that they
  want validating beyond "has a README".
