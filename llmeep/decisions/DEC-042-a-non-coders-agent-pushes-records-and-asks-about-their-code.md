---
id: DEC-042
title: A non-coder's agent pushes records on its own and asks before pushing their code
status: accepted
decided: 2026-08-21
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-005, DEC-040, DEC-041]
---

# DEC-042 — A non-coder's agent pushes records on its own and asks before pushing their code

## Status

`accepted` — as of 2026-08-21.

## Context

[`DEC-040`](DEC-040-the-user-type-is-configuration-and-the-tool-announces-it.md) says a
non-coder is never shown git, and the agent makes those calls itself. Taken literally that has a
consequence nobody spotted when it was written: **their work never leaves the machine.** An
agent that may neither push on its own nor ask has no route out, and every completed task piles
up on one laptop until something is lost.

So the agent has to push. And a push is where a deploy starts.

The repo cannot tell whether that matters. A pipeline can hang off a GitHub workflow, a GitLab
config, a server-side hook, or a platform watching the branch — the last two leave nothing in
the tree to find. *This push is inert* is not a claim that can be made from inside the repo.

An early draft of this drew the boundary at editing: a non-coder may not touch application code
at all. That protects nothing. A local edit triggers no pipeline; only a push does, and the ban
costs them the ability to change their own project, which is what they are there for.

## Decision

**The split is by what the unpushed range touches, and the agent acts on it.**

| State | The agent |
| --- | --- |
| `clear` | Nothing to do. |
| `records` | Pushes without asking. Boards, notes, decisions and history reach no build. |
| `code` | Does not push. Says the work is not live yet, and asks. |
| `no upstream` | Says nothing about pushing; there is nowhere to push to. |

**Classified over the whole unpushed range, not per commit.** A push moves the branch, so
records committed behind a code change go out with it.

**`tm unpushed` reports; it never pushes.** Every git call in `tm` is a read and
[`DEC-005`](DEC-005-agent-mediated-git.md) keeps git in the agent's hands. The banner carries
the same answer above every command, so the rule does not depend on the agent thinking to ask.

**Git becomes visible to a non-coder here, and that is the price of editing code.** Bounded to
one thing: whether their project is live. A conflict, a rebase, a detached HEAD or
`--no-verify` stays hidden and handled silently, because none of those is a decision they can
take.

**Declining is a real answer.** The work stays local and the banner keeps saying so. Nothing
escalates and nothing pushes anyway.

**No attempt to detect CI**, and none of this applies to a coder, who drives their own git.

## Alternatives considered

- **Never push; wait to be asked.** What `DEC-040` implied. Rejected: it is the trap this
  decision exists to spring — nobody who cannot be shown git will ever say "push".
- **Push everything automatically.** Coherent, and it deploys their code without anyone
  deciding to. The one outcome worth spending real complexity to avoid.
- **Forbid a non-coder from editing application code.** The first shape this took. Rejected:
  editing triggers nothing, so it protects nothing, and it removes the point of the project.
- **Detect CI from the repo** — workflows, pipeline configs. Rejected: silently wrong for
  server-side hooks and platform-side branch watchers, and silently wrong is the failure mode
  that ships a deploy nobody asked for.
- **A `.env` key declaring whether pushes deploy.** Honest about not knowing, and one typo from
  the unsafe answer, on a key nobody would revisit. Assuming every push can deploy costs a
  question and can only ever be over-careful.
- **`tm push` does it.** Deterministic — the agent could not skip the check. Rejected: `tm`
  would mutate git and reach the network for the first time, against `DEC-005`, to save the
  agent one command it is already running.
- **Keep git wholly invisible and ask in deploy language** — *shall I make this live?* Argued
  for at length here, and rejected by the person it concerns. Two problems: the question has no
  honest answer when the work is committed but not pushed, and it leaves the paused state with
  no exit anyone can name. Editing code puts you in the domain where git is real; "nothing is
  pushed yet, should I push?" is a sentence anybody can act on.
- **Park declined work on a side branch** so nothing is lost. Attractive — it keeps a backup
  without touching the live branch. Rejected for now: it spends a branch concept on someone who
  has none, and test pipelines watch side branches too, so it is not as inert as it looks.

## Consequences

- **A non-coder now sees exactly one git word**, and it arrives attached to a decision they can
  weigh. Every other git concept stays where `DEC-040` put it.
- **`tm` reads git on every command for a non-coder** — three more `git` calls, to compute the
  banner. Measurable, small, and the alternative is a rule discovered only by an agent that
  thought to look.
- **Records are the common case and they flow.** `tm done` plus a commit touches boards and
  history and nothing else, so completing work never stops to ask.
- **A declined push has no backstop.** Work sits local, and this decision accepts that in
  exchange for never deploying by accident. If it starts costing people work, the side-branch
  alternative above is the answer already drafted.
- **The record trees are computed, not assumed.** `--into ops` and a flat install both work,
  which a hardcoded `llmeep/` would not.

## Revisit when

- Someone loses work to a pause nobody resolved. That is the cost this decision knowingly
  accepted, and it is the trigger for the side-branch fallback.
- A non-coder turns out to answer "should I push?" with consistent bafflement, which would mean
  the bounded exception is not as learnable as it reads.
- `tm` needs to mutate git for some other reason, at which point `tm push` stops being a
  special case and the `DEC-005` argument should be reopened as a whole.
