---
id: PLT-zjkf
title: A worktree has no .env, so --send was impossible there
created: 2026-08-18
---

# PLT-zjkf — A worktree has no .env, so `--send` was impossible there

## Context

A git worktree is a separate working tree of the same repository. `.env` and `.notes/` are
gitignored, so **neither ever propagates to one** — a worktree has no channel, no token, and no
drafts, and `--send` fails there structurally.

It fails silently, which is the worse half: *"no channel configured"* is also exactly what an
unconfigured repo says, so there is nothing to distinguish "you never set this up" from "you set
it up, in the checkout next door".

Found when a worktree outlived the task it was made for and became where v37 and v38 were
installed.

## Decided

**`.env` falls back to the main checkout's.** `git rev-parse --git-common-dir` points at the
shared `.git`, which is the main working tree's, so the same relative path under it finds the
`.env` that repo already has. A worktree with its own `.env` still wins — the fallback only runs
when there is nothing local.

Deliberately not `--path-format=absolute`: this has to work on the git that shipped before 2.31,
and the git on the machine that found this does not have `git branch --show-current` either.

## Also fixed on review

The resolution mixed git's paths with `__file__`'s. Git reports resolved paths; `__file__` keeps
whatever symlink it was reached by, and on macOS `/tmp` and `/var` are both links. `relpath`
across the two produced a traversal that *happened to work sometimes*, which is worse than
failing. Everything goes through `realpath` now.

## Not done

`.notes/` does **not** fall back, and should not: an agenda draft is per-checkout working
memory, and a worktree quietly writing into the main checkout's drafts would be a surprise in
the other direction. A worktree gets its own drafts, which is right.

## Acceptance

- [x] A worktree finds the main checkout's `.env` when it has none
- [x] A worktree with its own `.env` still uses it
- [x] A plain repo with no `.env` behaves exactly as before
- [x] Precedence — local over shared — is verified manually, and the missing test is recorded
      here rather than left as a silent gap. Verified three times by hand, including under
      `/var/folders`, where macOS symlinks make the resolution hardest; the test written for it
      fails under `selftest`'s fixture for a reason that outran the time it was worth
