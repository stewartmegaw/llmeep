---
id: PLT-pztu
title: Cap task titles and allow folder sidecars
created: 2026-07-31
---

# PLT-pztu — Cap task titles and allow folder sidecars

## Outcome

A title is a handle: capped at 120 characters, with two sentences as the guide. Anything
longer lives in a sidecar, which may be a folder when one file is not enough.

## Acceptance

- [x] `tm add` refuses a title over 120 characters and says where the detail belongs.
- [x] More than two sentences warns but does not block — the count is heuristic.
- [x] `check` applies both rules to every board line, so a hand-edited title is caught too.
- [x] A sidecar may be `<id>-<slug>.md` **or** `<id>-<slug>/` containing `README.md`.
- [x] `go` lists the other files in a folder sidecar.
- [x] A folder without a `README.md` is an error — nothing to read, no acceptance to find.

## Context

Titles were unbounded. A long one pushes the board past readable width, and the board is read
far more often than any sidecar. The cap makes the tradeoff explicit rather than leaving it to
taste.

Folder sidecars follow from the same pressure one level down: some tasks genuinely need a spec
*and* a rubric *and* sample data, and forcing that into one markdown file is the same mistake
as forcing it into a title.

## Log

- 2026-07-31 — built. This sidecar is itself a folder, so the feature was exercised by the task
  that added it.
