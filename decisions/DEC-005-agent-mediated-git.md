---
id: DEC-005
title: Git is agent-mediated; completion happens before the commit, not after
status: accepted
decided: 2026-07-31
deciders: [stew]
supersedes: [DEC-004]
superseded_by: []
relates_to: [DEC-001, DEC-002, DEC-003, PLT-001, PLT-005, PLT-006]
---

# DEC-005 — Git is agent-mediated; completion happens before the commit, not after

## Context

[`DEC-004`](DEC-004-commits-close-tasks.md) put completion in a post-commit hook because the
board recorded the completing commit's SHA, and a SHA cannot be written into its own commit.
Completion therefore had to follow the commit, which left the board trailing committed state by
one commit and required a hook to parse trailers.

Then `DEC-004` itself dropped SHA storage — the trailer makes the commit self-identifying, so
nothing needs storing. **That removed the reason the hook existed, and nobody noticed at the
time.** With no SHA to wait for, the board move can happen *before* the commit and land inside
it.

Separately, tracing the design through a worked example showed the remaining rough edges —
forgotten trailers, the one-commit lag, board merge conflicts — are all artefacts of git being
driven from several places at once. If project git flows through the agent, most of them stop
arising rather than needing to be handled.

## Decision

**Project git commands go through the agent.** Stated as a prerequisite in `README.md`, not
enforced. Direct git use keeps working — `git revert`, interactive rebase, CI and the 2am fix
must never be blocked — but a hook prints one line when it notices the board left stale.

**Completion happens before the commit**, so everything lands together:

```
tm go PLT-006                            # board: open → doing
...work...
tm done PLT-006                          # board: doing → recent, history appended, Telegram sent
git commit -m "…. closes PLT-006"        # code + board + history, one commit
```

**The post-commit completion hook is dropped.** Nothing parses trailers at commit time. The
trailer stays in the message as the permanent link that `find` resolves with
`git log --grep`. Hooks return to validation only, which is their proper job.

**`tm` survives, and the agent invokes it.** What goes away is the typing, not the tool:

```
user:   "lets start PLT-123"       →   agent runs: tm go PLT-123
user:   "commit task"              →   agent runs: tm done PLT-123, then git commit
```

Allocating IDs, pruning `recent` to exactly 15 and appending TSV rows are **pure mechanism**,
and [principle 7](../ontology/principles.md) puts mechanism in the tool. An agent editing the
board by hand is still a hand edit, which is what
[principle 2](../ontology/principles.md) exists to prevent — and an off-by-one in a prune
fails silently, surfacing only much later.

### Carried forward from DEC-004

- A `closes <id>` trailer in the commit message, now written by the agent rather than parsed by
  a hook.
- **No SHA stored anywhere.** `git log --grep` resolves commits on demand.
- The agent composing the commit decides whether acceptance is met — judgement at the moment the
  message is written.
- `done` still works with no commit at all, which is how business tasks close. It is now the
  primary path rather than a fallback.

## Alternatives considered

- **Force agent-mediated git.** A hook rejecting commits without a marker the agent sets.
  Rejected: trivially bypassed with `--no-verify`, and it breaks revert, rebase, CI and
  emergency fixes. It also contradicts [`DEC-003`](DEC-003-skills-are-executables.md)'s honest
  test — that a human at a terminal can drive this with no agent at all.
- **Prerequisite with no nudge.** Simplest, but a convention with nothing noticing when it
  breaks is the failure mode this design has rejected repeatedly.
- **Drop `tm`; the agent edits the board directly.** Tempting — no Python dependency, one fewer
  task. Rejected: it converts deterministic bookkeeping into probabilistic bookkeeping, and
  makes taskman agent-only, which is a *modality* lock as limiting as the vendor lock principle 3
  guards against.
- **Drop `tm`, let hooks catch drift.** Keeps determinism at the boundary instead of the
  operation. Rejected: errors surface at commit rather than being prevented, and a rejected
  commit is a worse experience than a correct write.
- **Keep the post-commit hook as well.** Redundant once the agent orders operations correctly,
  and two paths to completion is exactly the kind of duplication this project keeps deleting.

## Consequences

- **The board is never in a half-state.** Code, board and history land in one commit, so a
  teammate pulling at any moment sees a consistent picture.
- **One fewer hook, and no trailer parsing.** `PLT-005` shrinks to sending the Telegram message
  from `done`, which is where it started before the SHA problem forced it into a hook.
- **Telegram still fires before push.** Unchanged by this decision — `done` runs locally, and on
  a branch the notification can precede the merge by days.
- **`next_id` collisions are unaffected** (`PLT-006`). Two people with two agents on two machines
  collide identically; only a collision-proof ID scheme fixes that.
- **The prerequisite will be violated.** It is a convention with a nudge, not a mechanism. The
  board going stale is the visible symptom, and it is recoverable by running `tm` afterwards.

## Revisit when

- The nudge proves insufficient and boards routinely go stale.
- Someone needs to work in this repo without an agent regularly enough that the prerequisite is
  a burden rather than a description.
