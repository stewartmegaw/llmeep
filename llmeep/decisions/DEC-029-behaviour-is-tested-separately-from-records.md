---
id: DEC-029
title: Behaviour is tested separately from records, and upgrades are the axis that matters
status: accepted
decided: 2026-08-04
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-003, DEC-017, DEC-028]
---

# DEC-029 — Behaviour is tested separately from records

## Context

`tm check` has fourteen validators and every one checks *records*: boards parse, ids are unique,
`blocked:` resolves, a release tree is empty, links point somewhere. It has never checked that
`adopt` works.

`DEC-028` then shipped five bugs through that gap in three releases. Three reached a tag before
being found; two were caught by this suite the first time it ran.

| | Broke | Found by |
| --- | --- | --- |
| v27 | `is_clone` looked for `tasks/_tooling` at a clone's root — **no adopter could fetch v27** | a user asking how to upgrade |
| v27 | `do_update` bypassed `src_of`, died partway, left a half-updated install | the same question |
| v28 | update **split `ontology/`**, orphaning the adopter's `domain/` | guessing wrong about a real repo's layout, then testing the real one |
| v29 | `--into ops` silently left every path pointing at `llmeep/` | this suite, first run |
| v29 | upgrading a **flat** install pointed its agent paths at a folder it does not have | this suite, first full run |

They share one cause, and it is not carelessness. Everything was tested as a *fresh clone* or a
*fresh adoption*. Neither ever upgrades anything, so the update path — the only code that has to
understand two versions at once — was covered by nothing at all.

## Decision

**`selftest` at the repo root, beside the `adopt` it mostly tests.** Standard library
`unittest`, no install step (`DEC-003`), no network.

**It is a matrix, not a checklist: layout against transition.** Greenfield, default folder,
`--into ops`, and a repo that already has its own `tasks/` — each crossed with fresh install and
upgrade-from-previous-releases. The v28 split lived in exactly one cell and would have survived
any checklist that did not name it.

**Fixtures are local clones of release tags**, so the suite is offline and pins what it upgrades
*from*. One tag is pinned by name rather than taken from the newest: `PRE_DEC028 = "v26"`. The
first version of this test used "the two most recent tags" and **passed with the ontology fix
deliberately reverted**, because both recent tags were already past the layout change. A
migration test whose fixtures drift past the migration tests nothing.

**Every case asserts the five things that would have caught all five bugs:** the tooling runs
from where it was installed, records survive, nothing is duplicated, every documented path
resolves, and a refused update writes nothing.

**A test is not trusted until it has been seen to fail.** Both regressions were re-introduced in
a throwaway clone and the suite confirmed red, then green. That step is what exposed the drifting
fixture.

**Not wired into the pre-commit hook.** It is the first slow thing here (~40s), and a slow hook
gets bypassed, taking `check` with it — the reasoning already recorded for `check --nudge`. It is
a documented step before a release cut instead.

## Alternatives considered

- **Extend `tm check`.** Rejected: `check` runs in hooks and CI on every commit and must stay
  fast, and it validates the repo it is in — this needs to build repos that are not this one.
- **Ship a CI workflow.** Still rejected on principle 3 and the reasoning in `DEC-016` and
  `DEC-017`: a workflow file names a vendor in the committed core. The suite is a script and
  runs unchanged inside whatever CI someone has.
- **Test `adopt`'s functions directly** rather than by running it. Faster and far easier to
  write, and it would have caught none of the five — every one was about how real paths land on
  a real disk across two versions.
- **Fixtures generated in-process** instead of cloning tags. No dependency on release history,
  but then the "old version" is a fiction written by the same person who wrote the new one, and
  the bug is always in what actually shipped.

## Consequences

- **The suite depends on this repository's tags.** A checkout without them skips the upgrade
  rows and says so — a shallow CI clone is not a broken suite, but it is not a passing one
  either, and anyone relying on it needs `fetch-depth: 0`.
- **`PRE_DEC028` must be revisited when the migration it guards is retired**, and any future
  layout change needs its own pinned fixture. That is the cost of pinning, and it is cheaper
  than a test that quietly stops testing.
- **It does not prove the update is atomic, because it is not.** Copying is file-by-file with no
  rollback (`PLT-fqcz`). What is pinned is that the guards run before the first write.
- **`selftest` ships in the release.** A cloner gets a suite for the tooling they now own; it is
  one file and is excluded from what `adopt` installs into someone else's repo.

## Revisit when

- The suite takes long enough that it stops being run before cuts. Then it needs splitting into
  a fast layer and a slow one, not deleting.
- A bug reaches a tag again. The honest response is to add the cell it lived in, and to ask why
  the matrix did not already have it.
