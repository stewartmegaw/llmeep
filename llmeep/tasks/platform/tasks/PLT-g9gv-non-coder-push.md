---
id: PLT-g9gv
title: "A non-coder's agent pushes on its own, except where the commit could reach a deploy"
created: 2026-08-20
---

# PLT-g9gv — A non-coder's agent pushes on its own, except where the commit could reach a deploy

`DEC-040` says a non-coder is never shown git. That has a consequence nobody has acted on yet:
if they cannot be asked to push, and the agent does not push either, their work sits local
forever. Auto-push is not an extra — it is what makes the type coherent.

## The caveat, restated

The proposal was that a non-coder cannot edit `platform/`, because that might trigger CI/CD.
The risk is real, but the boundary is in the wrong place twice.

**Editing triggers nothing. Pushing does.** A local change to `platform/` is inert. Forbidding
the edit protects nothing and costs them the ability to change their own project, which is what
they are here to do.

**You cannot push half a commit.** So the gate has to sit at push time and read what the commit
touched: records only, or `platform/` as well. That is a real distinction the tooling can make.

## Where it actually gets hard

The rule that protects them creates a state they cannot be told about. A commit touching
`platform/` is unpushed, and the agent may not say "unpushed", "branch" or "CI".

The way out is that **the question is not a git question and never was.** They cannot answer
*should I push to origin/main?* They can answer *shall I make this live?* — that is a decision
about their own project, in their own terms, and it is the one this actually is. Auto-push
where nothing can happen; ask in their language where something can.

## The shape: a paused state, not a second user type

Proposed: a `platform/` edit pauses automatic git actions, and the pause lifts when the change
is committed or reverted. The state machine is right — the *situation* changes, not the person.
Two corrections.

**The pause lifts on push, not on commit.** A commit reaches nothing; a push is what a pipeline
watches. Lifting at commit re-arms auto-push with the platform change sitting in the branch, and
the very next records-only commit carries it out to CI. That transition is the whole risk, so it
has to be the one the state machine gets right.

**Git does become visible, and that is the price of editing code.** The first draft of this
argued the opposite — that a paused non-coder should still be spoken to in deploy language,
never git. Decided against: editing `platform/` puts you in the domain where git is real, and
pretending otherwise leaves the pause with no exit anybody can take. "Nothing is pushed yet —
should I push?" is a comprehensible question, and it is the one that resolves the state.

**Bounded, though: the push state, not the whole surface.** Pushed or not pushed is one concept
with a consequence attached, and it is learnable in a sentence. A merge conflict, a rebase, a
detached HEAD, `--no-verify` — a non-coder cannot act on any of those, so exposing them buys
nothing and they stay agent-handled even while paused. The penalty for editing code is knowing
whether your work is live. It is not the rest of git.

    non-coder, clear      → commits and pushes on its own; git never mentioned
      first write under platform/
    non-coder, paused     → still commits; never pushes on its own; says what is unpushed
                            and asks. Everything other than push state stays hidden.
      pushed on their say-so, or the change reverted
    non-coder, clear

The state is derivable from `git status` and the diff against the upstream branch, so nothing
has to be remembered between sessions — which matters, because a pause that only exists in one
agent's context is a pause the next session does not honour.

## Settled

Four states over the whole unpushed range, not per commit — a push moves the branch, so records
sitting behind a code change go out with it. `clear`, `records` (pushes on its own), `code`
(says it is not live yet and asks), `no upstream` (says nothing). `tm unpushed` reports it and
the banner carries it above every command; neither ever pushes, because every git call in `tm`
is a read and `DEC-005` keeps it that way.

Direction taken on the three open questions:

- **No CI detection.** Assume any push can deploy. A pipeline can hang off a server-side hook
  that leaves nothing in the repo to find, so *this push is inert* is not a claim available
  from in here. Being over-careful costs a question; being wrong ships a deploy.
- **The agent pushes, not `tm`.** A `tm push` would be deterministic and would make `tm` mutate
  git and reach the network for the first time, to save a command the agent already runs.
- **A declined push stays local**, and the banner keeps saying so. Nothing escalates. The
  side-branch fallback is drafted in `DEC-042` if this ever costs somebody work.

One thing the record trees taught: `adopt` never installs `platform/` — *an adopting repo is
the platform* — so the boundary is computed from where the four record trees actually landed.
`--into ops` and a flat install both work; a hardcoded `llmeep/` would have called an adopter's
own `llmeep/` directory records.

`DEC-042` carries the argument, including the alternative that was argued for here and
overruled: keeping git wholly invisible and asking in deploy language.
