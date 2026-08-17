---
id: DEC-035
title: adopt is the only install, and it builds records rather than clearing them
status: accepted
decided: 2026-08-17
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-018, DEC-020, DEC-028, DEC-029, DEC-034]
---

# DEC-035 — `adopt` is the only install, and it builds records rather than clearing them

## Context

There were two ways to install llmeep, and they were not two shapes of one thing.

`adopt` copied a manifest of machinery into a repo that already existed. **Cloning handed over
the entire working tree** — llmeep's boards, its history, its decisions, its notes, its own
maintainer scripts — and asked the new owner to make it theirs. Almost everything below existed
to make that second path survivable:

- **`tm reset` and `nm reset`**, plus a `tasks/UNADOPTED.md` and a `notes/UNADOPTED.md` whose
  only job was telling a cloner those records belonged to someone else, repeated by both tools
  on every command until dealt with.
- **A write-once `release` branch**, so a cloneable tree could be cut without merging records
  back and colliding forever.
- **`tm check --release`** — empty boards, empty history, cleared decisions, no marker files,
  the directories git cannot carry, no dead relative links, no maintainer-only scripts. Every
  assertion in it protected a cloner.
- **A cut recipe** of eight commands that had to be run in order and got fixed twice in a week.

And `adopt` did not need any of it. It already copied llmeep's records in and deleted them again
by shelling out to `reset`, so it was written for a dirty source all along. The clean release was
a second barrier behind a working first one.

The pattern kept costing. `DEC-034` took the collecting half of feedback out of what `adopt`
installs, and it was still in the release tree for a cloner. `PLT-8fmj` took the script out of
the release, and the README's maintainer section and `selftest`'s cases were still there. Each
fix was a patch on the same fact: **cloning gives someone everything, and then we try to remember
what to take away.**

Confirmed 2026-08-17 that no repo has ever been installed by cloning, so nothing had to be
migrated.

## Decision

**`adopt` is the only install, and it constructs the record trees empty.**

It copies exactly the manifest it already maintained — tools, hooks, templates, ontology,
`.env.example` — and then *writes* an empty board per ledger, an empty `history.tsv` per
subsystem, an empty archive and the three `.gitkeep` directories. Nothing llmeep records is
copied, so nothing llmeep records can arrive. **The state of the source stopped mattering by
construction rather than by cleanup.**

Everything that existed to protect a cloner goes: both `reset` commands, both `UNADOPTED.md`
markers, the skeleton nudges, `tm check --release` entirely, and the `release` branch.

**A version is now a tag on `main`.** `adopt --update` already resolved tags rather than
branches, so pinning and updating are unchanged, and existing installs keep working.

**Starting from nothing is `git init` then `adopt`** — one extra command, documented as the
first line rather than a footnote.

## Alternatives considered

- **Keep both paths and fix the leaks as they appear.** What we had been doing. Three commits in
  one week, each closing one door on the same room, and `DEC-034` proved the room has more doors
  than anyone can enumerate — the README and the test suite were still open when we stopped
  looking.
- **Drop the clean release but leave `adopt` copying-then-clearing.** Tempting because it is one
  commit instead of several, and wrong: it takes two barriers down to one, and the survivor is a
  delete list somebody has to keep correct as record types are added. That is the exact pattern
  being escaped.
- **Have `tm` and `nm` gain an `init` that writes their own empty records**, so `adopt` never
  learns the format. Cleaner on paper and rejected as circular: `adopt` would depend on the tools
  it is in the middle of installing, and it would add a command to both executables to remove one
  from each. The coupling is instead named where it lives, with `selftest` driving the real tools
  against a built tree as the guard.
- **Keep `check --release` for the dead-link sweep.** It found real breakage twice. But it looked
  for links that resolve on `main` and not in a cut tree, and there is no cut tree — on `main`
  they resolve by construction.

## Consequences

- **`adopt` now knows the shape of a record, not just its path.** One `BOARD` template, two
  history headers, one archive header. That is a genuine coupling with `tm` and `nm`, accepted
  knowingly and guarded by `selftest`, which adopts and then drives the real tools at the result —
  a board with wrong headings fails there immediately, because `tm add` has nowhere to put a line.
- **Roughly 250 lines deleted** across the two executables, the installer, the README and the
  ontologies, against about 40 added.
- **Releasing is `git tag`.** The eight-command recipe, the branch and the pre-cut validation are
  gone, and with them the class of defect where the recipe itself was wrong.
- **A clone of `main` is just a clone of a project now** — full of llmeep's records, because that
  is what a project's repo contains and nobody starts from it.
- **`selftest` lost its greenfield axis** and gained two cases in its place: that a fresh adopt
  contains none of llmeep's records, and that llmeep's own checkout — the dirtiest source there
  is — installs clean.
- **No path exists for someone who wants llmeep's decisions**, which `reset` without `--all` used
  to leave in place for a fork. Forking is cloning the repo and working on it, which still works;
  it is simply no longer called installing.

## Revisit when

- Someone genuinely wants to start a project *as* llmeep rather than adopt it into one. That
  would be a fork, and the question would be whether forks need a supported path at all.
- `adopt`'s idea of an empty record and the tools' idea drift apart in a way `selftest` does not
  catch, which would argue for shipping empty templates rather than templating them in code.
