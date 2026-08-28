---
id: DEC-044
title: A closes trailer answers the unfiled-work nudge, which moves to commit-msg to read it
status: accepted
decided: 2026-08-28
deciders: [stewart]
supersedes: []
superseded_by: []
relates_to: [DEC-004, DEC-016, DEC-033]
---

# DEC-044 — A closes trailer answers the unfiled-work nudge, which moves to commit-msg to read it

## Status

`accepted` — as of 2026-08-28.

## Context

`check_untracked_work` warns when files outside llmeep's own paths change with nothing in
progress on any board. It ran from `pre-commit`, and it fired on **every correctly-ordered
commit**: the documented workflow is `tm done` and then commit with `closes <id>`, so by the
time the hook runs the task has already left `in progress`. The commit that did everything
right was the commit being warned about.

Two adopters reported this independently, from separate repos, without either seeing the
other's note — one on 2026-08-20 and one on 2026-08-21, both surfaced by `./sweep`. Both
reached the same diagnosis: the signal that the work is filed is already in the commit, and
the hook is not looking at it. A warning that fires on the correct path is a warning people
learn to scroll past, and it was crowding out the one case the check exists for — real work
landing with no task at all.

The obstacle was a hook-stage one. `pre-commit` does not receive the commit message; git only
hands it to `commit-msg`. So the check could see the staged diff or the trailer, never both.

## Decision

A `closes <id>` trailer naming a task the records know satisfies the nudge, and the check
moves from `pre-commit` to `commit-msg` — the only stage holding the staged diff and the
message at once. `commit-msg` still blocks on a trailer naming no such task (`DEC-004`); the
nudge only warns. The exemption is narrowed to **known** ids so that a typo, which
`check_trailer` is refusing on the same message, cannot also switch the nudge off. A merge in
progress skips it: the staged tree is not this author's work.

## Alternatives considered

- **Exempt on a staged `history.tsv` row, keeping the check in `pre-commit`** — rejected
  because it reads the close rather than the claim. It only works when the close and the code
  land in one commit, and it makes `history.tsv` do double duty as a record and as a hook
  signal. The trailer is the documented link between task and commit (`DEC-004`) and is
  already validated; the history file is not.
- **Drop the nudge entirely** — rejected. Its failure mode was firing too often, not firing
  wrongly. The case it catches — code committed with nothing on the board — is the drift that
  makes the board useless, and nothing else catches it.
- **Make it block rather than warn** — rejected for the reason it has always warned: at commit
  time the work is finished, so blocking punishes someone for a task they can no longer file
  before the fact. The real catch is the agent filing the task when the work is described.
- **Suppress it only for the agent, leaving it for direct `git` use** — rejected because the
  check cannot tell them apart, and a rule that depends on who is typing is a rule nobody can
  reason about.

## Consequences

The nudge now means what it says: something changed and nothing accounts for it. That makes it
worth reading, which is the whole value being bought back.

The cost is that one check now lives in `commit-msg` rather than with the other staged checks
in `pre-commit`, so "where does validation happen" has two answers instead of one. Both hooks
carry a comment saying why. `commit-msg` also runs on merges where `pre-commit` does not,
which is why the merge guard exists — a stage change brought a case the old placement never
had to think about.

`tm check --staged` by hand no longer reports unfiled work. Nothing but `pre-commit` called it
that way.

## Revisit when

A stage appears that sees both the diff and the message and runs before `pre-commit`, or the
workflow stops closing tasks before committing them — at which point the exemption is
answering a question nobody is asking.
