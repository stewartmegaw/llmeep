---
id: PLT-9v2n
title: Drop install-by-clone and make adopt the only way in
created: 2026-08-17
---

# PLT-9v2n — Drop install-by-clone and make adopt the only way in

## Outcome

One way in: `adopt`, run from the repo you want llmeep in. The greenfield path —
`git clone && rm -rf .git && git init`, where your project *is* the skeleton — is gone from the
README and from the machinery that exists to make it safe.

## Context

Two install paths have been maintained since the beginning, and they are not two shapes of the
same thing. `adopt` copies a manifest of machinery into a repo that already exists. Cloning
hands over **the entire llmeep working tree** and asks the new owner to make it theirs — which
is why so much of the system is really about damage control for that second path.

What exists only because of it:

- **`tm reset` and `tasks/UNADOPTED.md`.** A marker file and a command whose whole job is
  telling a cloner "these records are somebody else's, run this to clear them". `adopt` never
  needs either: it calls `reset` on the destination itself (`adopt:771-772`), so an adopted repo
  has empty boards by construction and no marker to explain.
- **Most of `tm check --release`.** Empty boards, an empty `history.tsv`, cleared decisions, no
  `UNADOPTED.md` — every one of those assertions protects a cloner from inheriting llmeep's
  records. `adopt` reads none of it: `managed()` walks `tasks/_tooling` and `notes/_tooling`
  plus a short list, and boards and history are not in it. A release could carry llmeep's own
  records untouched and every adopting repo would be unaffected.
- **The write-once release branch,** which exists so that a cloneable tree can be cut without
  merging records back and colliding forever.
- **The dead-link sweep in the release check,** because a cloner reads llmeep's markdown in
  place, with llmeep's relative paths.
- **`selftest`'s `greenfield` fixture** and the cases built on it.

And what prompted this: **the leak keeps coming back through that door.** `DEC-034` took the
collecting half out of what `adopt` installs, and it was still in the release tree for a
cloner; `PLT-8fmj` took the script out of the release, and the README's maintainer section and
`selftest`'s cases are still there for a cloner. Adopters get one extracted block and are
structurally incapable of seeing any of it. Each fix has been a patch on the same underlying
fact: **cloning gives someone everything, and then we try to remember what to take away.**

## Settled: `release` stops being a branch

**Releases become tags on `main`.** The clean tree already buys `adopt` nothing. A fresh install
copies whole trees with `shutil.copytree` (`adopt:107-119`) and then clears them by shelling out
to `tm reset --yes --all` (`adopt:771`) — and `reset`'s docstring says exactly why: *"A clone
carries llmeep's own records. Clearing them here means an adopter never sees someone else's
board."* `adopt` is already written for a dirty source. The cut is a second barrier behind a
first one that works.

Tags stay. `--update` fetches a version and `version_of()` is `git describe --tags
--exact-match`, which is happy with a tag on `main`, so existing installs keep updating.

**Sequencing, and this is the whole risk.** Dropping the clean branch while `adopt` still
copies-then-clears takes two barriers down to one — and that one is a delete-list somebody has
to keep correct, which is the pattern this task exists to escape. So:

1. **`adopt` constructs empty record trees** instead of copying llmeep's and deleting them. It
   already knows the shape: four headings per board, an empty `history.tsv`,
   `decisions/_template.md`. After this the source's contents stop mattering by construction.
2. **`tm reset` and `UNADOPTED.md` go**, rather than surviving as `adopt`'s private helper.
3. **Releases become tags on `main`**, and `check --release` loses everything that was
   protecting a cloner.

Each step ships on its own and none is a leap. The default branch becomes `main` at step 3 —
today it is `release` so a casual visitor sees a clean skeleton, and with no cloners they should
see the project. `is_clone()` stays: `--update` still fetches a checkout to copy from.

## Open questions
- **What does someone with no repo at all do?** Today they clone. Afterwards it is
  `git init` then `adopt`, which is one extra command and needs to be the documented first line
  of the README rather than a footnote.
- **Forks.** Someone forking llmeep to run their own clones this repo and works on it — that is
  developing llmeep, not installing it, and it should stay possible. The distinction to hold is
  *install* versus *check out the project*, which the README currently blurs.
- ~~**Existing greenfield installs.**~~ None exist — confirmed 2026-08-17. Nothing has to be
  migrated, and the compatibility question that would have shaped this task does not arise.

## Acceptance

- [x] `adopt` is the only install documented, and the README's first instruction works from an
      empty directory
- [x] Nothing remains whose only purpose is protecting a cloner from llmeep's own records
- [x] A decision records what was dropped, what was kept, and why one way in beats two
- [x] `adopt` builds empty record trees rather than copying llmeep's and clearing them, so a
      dirty source cannot reach an adopter even in principle
- [x] Releases are tags on `main`, the default branch is `main`, and installs still update

## Log

- 2026-08-17 — Done in one commit rather than the three the plan proposed. The steps turned out
  to be coupled, not sequential: `adopt` called `tm reset` to clear what it had just copied, so
  removing `reset` and making `adopt` build empty records is a single change, and once the source
  no longer matters the release ceremony has nothing left to protect.
- 2026-08-17 — ~250 lines deleted against ~40 added. `tm check --release` went entirely, along
  with both `reset` commands, both `UNADOPTED.md` markers, the skeleton nudges, `dead_links`,
  `RELEASE_DIRS`, `MAINTAINER_ONLY` and the `release` branch. `DEC-035` records it.
- 2026-08-17 — The default branch is still `release` on the remote and has to be switched to
  `main` by hand; nothing in the repo can do that. Until it is, a casual visitor lands on a
  branch that is no longer cut.
