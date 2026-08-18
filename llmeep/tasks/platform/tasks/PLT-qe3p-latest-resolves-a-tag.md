---
id: PLT-qe3p
title: update fetches the default branch, so latest means main's tip rather than the newest release
created: 2026-08-18
---

# PLT-qe3p — `update` fetches the default branch, so `latest` means main's tip rather than the newest release

## Context

`fetch_release("latest")` cloned with no `--branch`, which is *the remote's default branch*. That
was correct while the default was `release` and every commit on it was a cut version.

`DEC-035` made a version a tag on `main`, and the default branch moved to `main` on 2026-08-18.
Together those turned `latest` into "whatever was committed most recently". `do_update` then asks
the clone what version it is — `git describe --tags --exact-match` — gets `unreleased` for any
tip that is not itself tagged, and **refuses**:

```
! this clone is unreleased; the install is on v37. Check out a release tag
  in the clone, or `--force` if you mean to run unreleased code.
```

Reproduced against a real v37 install. It works today only because `main`'s tip happens to be
the v37 commit; the first push after a release breaks every adopter's `./.llmeep --update`.

## Fixed

`latest` asks the remote for its highest `vN` tag and clones that. A tag is what a release *is*
now, so a release is what it asks for. `git ls-remote --tags` rather than a clone-then-look, so
nothing is fetched to answer the question.

## The part that cannot be fixed from here

**The resolution runs in the installed copy.** `.llmeep` fetches, then hands over to the fetched
`adopt`. So every repo already on v37 or earlier still has the old `latest`, and will keep
resolving the default branch until it takes this version *once* by name:

```sh
LLMEEP_VERSION=v38 ./.llmeep --update
```

After that, `latest` works. There is no way to reach back into an install that has not updated
yet — an installer can only fix the next update, never the current one.

## Acceptance

- [x] `latest` resolves the newest release tag, not the default branch
- [x] An install whose source has an untagged tip updates cleanly
- [x] `selftest` covers it with a source whose branch tip is deliberately past the newest tag
- [x] The migration step for existing installs is written down where someone will find it
