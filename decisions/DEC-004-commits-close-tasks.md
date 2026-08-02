---
id: DEC-004
title: Commit trailers close tasks; no SHA is stored
status: superseded
decided: 2026-07-31
deciders: [stew]
supersedes: []
superseded_by: [DEC-005]
relates_to: [DEC-001, DEC-002, DEC-003, PLT-001, PLT-005]
---

# DEC-004 — Commit trailers close tasks; no SHA is stored

> **Superseded by [`DEC-005`](DEC-005-agent-mediated-git.md) on 2026-07-31.**
>
> The trailer and the no-SHA decision both stand. What changed is the mechanism: this decision
> put completion in a **post-commit hook**, because recording the SHA forced completion to
> follow the commit. Dropping SHA storage — decided in this very document — removed that
> constraint, and the hook with it. Completion now runs *before* the commit so everything lands
> together.
>
> Kept for the reasoning below, particularly the rejected alternatives, which still hold.

## Context

[`DEC-001`](DEC-001-taskman-design.md) recorded the completing commit's SHA on the board and in
history, and fired the Telegram notification post-commit so the message could point at a real
change. That created a constraint nobody had spotted: **a commit's SHA cannot be written inside
that same commit.** Completing a task therefore had to happen strictly after committing, which
made the ordering fragile and easy to get wrong.

The question that unlocked it: if the commit is the moment work becomes real, why is completing
a task a separate act at all? Could the commit trigger it?

**Prompting was considered and rejected.** A post-commit hook can prompt when a human commits
from a shell, but there is no TTY when an agent commits programmatically, nor in GUI clients,
nor in CI — a hook blocking on stdin hangs the caller. Worse, most commits complete nothing, so
the hook would ask on every one; that noise gets silenced with `--no-verify`, which disables
every other check the hook performs. It also puts judgement in a hook, which
[`DEC-003`](DEC-003-skills-are-executables.md) rejected for the same reason.

## Decision

**A commit message trailer closes a task.**

```sh
git commit -m "Fix flaky auth test. closes PLT-007"
```

A post-commit hook parses the trailer and invokes `tm done PLT-007`. No prompt, so it behaves
identically for a human, an agent, a GUI and CI. Silent on every commit that does not say
`closes`, so it never becomes noise. Intent is declared, never inferred.

**The hook is thin.** It parses the trailer and calls the executable; the completion logic lives
in `tm` and nowhere else, per `DEC-003`.

**No SHA is stored anywhere.** The trailer makes the commit self-identifying, so it can always
be recovered:

```sh
git log --grep="closes PLT-007" --format=%h
```

`history.tsv` drops its `commit` column and `recent` drops the SHA. `find` resolves commits on
demand.

**The board edit is left uncommitted** and rides along with the next commit. The hook always
runs, so nothing can be forgotten; the board simply trails committed state by one commit.

**`done` survives as the fallback.** Business tasks frequently complete with nothing to commit,
and closing them with an empty commit would be worse than typing a command. It is demoted, not
removed: rarely used for platform work, still there when there is no commit.

**A forgotten trailer is met with a nudge, not a judgement.** When `doing` is occupied and the
message carries no trailer, the hook prints one line and exits:

```
PLT-007 still in doing — add "closes PLT-007" to the message when it is done
```

No prompt, no network, no blocking, no cost. It works offline, in CI and in a GUI, and an agent
sees it in the commit's output. It is information, never a gate.

**The judgement of whether work is complete belongs to the agent composing the commit**, not to
a hook running after it. The agent is the thing running `git commit`; it has the sidecar's
acceptance criteria and the diff it just made. So the instruction lives in this ontology — *when
committing work for the current task, include `closes <id>` if the acceptance is met* — and is
acted on at the moment the message is written.

## Alternatives considered

- **Post-commit hook prompts "is this task done?"** The original proposal. Rejected on three
  counts: no TTY for agents, GUIs or CI; noise on every non-completing commit, leading to
  `--no-verify`; and judgement in a hook.
- **Infer completion from the diff.** Rejected outright — guessing intent, silently wrong,
  exactly what `DEC-003` ruled out for ledger classification.
- **Hook calls an LLM to judge completion when the trailer is missing, then asks the user to
  confirm.** Solves a real problem — a forgotten trailer strands a task in `doing` indefinitely
  — but rejected on four counts. It hard-codes a vendor into the commit path (API key, network
  dependency and per-commit cost), which is [principle 3](../ontology/principles.md) failing
  at the most load-bearing point in the system; a clone by someone using another provider gets a
  broken hook. Every commit would wait on a network round-trip, and offline commits would break.
  The confirmation step needs a TTY that agents and CI do not have. And it is judgement in a
  hook, rejected twice already.

  The decisive counter-argument is that **the intelligence is already in the room**: the agent
  is the thing running `git commit`, holding the acceptance criteria and the diff. Reaching back
  out to an API after the fact pays for something that was free a moment earlier. Hence the
  nudge, plus an instruction acted on when the message is composed.
- **Hook makes a follow-up chore commit.** Keeps the board matching committed state, at the cost
  of a second commit per task and a hook that commits on your behalf. Rejected as noise; the
  board trailing by one commit is self-correcting.
- **Hook amends the original commit.** Would put work and bookkeeping in one clean commit, but
  amending in post-commit re-fires hooks and rewrites history that may already be pushed.
  Rejected as fragile.
- **Stage the board change in `pre-commit` so it lands in the same commit.** Impossible: git's
  hook order gives `pre-commit` no access to the message, and `commit-msg` cannot reliably alter
  the tree. This is what forces the edit outside the commit.
- **Keep storing the SHA.** Saves a `git log` call when displaying history and would let
  `history.tsv` work outside a checkout. Rejected: it is derived data that can go stale, and it
  is the sole cause of the ordering constraint.

## Consequences

- **The ordering constraint is gone.** There is no longer a right and wrong sequence to
  remember, because completing is a side effect of committing.
- **Notification moves into the post-commit hook**, refining `DEC-001`'s mechanism while keeping
  its intent: the message announces work that genuinely exists, and the commit is recoverable
  from the trailer.
- The board trails committed state by one commit. A teammate pulling mid-window may briefly see
  a task in `doing` that is closed. Self-correcting, and worth the simplicity.
- `find` now requires a git checkout to resolve commits. Titles and dates still work without
  one.
- **The trailer becomes load-bearing.** A typo'd ID silently closes nothing, or the wrong thing.
  Hook validation should catch an ID that does not exist.

## Revisit when

- The one-commit lag causes real confusion in practice.
- Trailer typos turn out to be a common failure.
- Someone needs task history outside a git checkout.
