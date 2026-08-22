---
id: PLT-t774
title: "Say when it is safe to clear context: report what the session holds that the records do not"
created: 2026-08-21
---

# PLT-t774 — Say when it is safe to clear context

The agent should say when now is a good moment to clear, and where the records already hold
everything, clearing hard should be the preferred move rather than the nervous one.

This is the project's own thesis pointed back at itself. The argument for keeping records in
the repo is that they are cheaper to carry than the tracker they replace — and `tm go` is
already described as a context loader rather than a state change. If that is true, a session
is disposable exactly when `go` plus the board would bring back everything that matters.

## What makes it unsafe, and all of it is checkable

The question is not *how full is the context* — it is **what does this session know that
nothing on disk does.** Candidates, in rough order of how often they bite:

- Uncommitted changes in the working tree.
- A task in progress whose sidecar does not say where the work got to. The title survives a
  clear; "I was halfway through the second half of this" does not.
- Captures in `notes/raw/` read but not distilled. The transcript is on disk, but the judgement
  about what mattered in it is not.
- An agenda draft edited since it was sent, or never sent.
- Unpushed work — `tm unpushed` already answers this.
- A decision that should have been written and was not. **Not checkable**, and the most
  expensive thing to lose: the rejected alternative exists only in the conversation.

## Shape

`tm` reports the list; the agent decides whether to raise it. That is
[principle 7](../../../llmeep/ontology/principles.md) — the loose ends are mechanical, the
judgement about whether now is a good moment is not.

`tm done` followed by its commit is the obvious high point: board, history and code have just
landed together, so by construction nothing is left in the session. Saying so there costs
nothing and is right nearly every time.

## The constraint that shapes everything

**llmeep cannot clear anything, and must not name a way to.** Clearing is a harness feature and
its spelling is vendor-specific; `/clear` is one agent's. [Principle 3](../../../llmeep/ontology/principles.md)
and `DEC-003` mean the tool reports state and the adapter — or the agent — knows what to do
with it. Nothing in the shipped executable may assume which agent is reading.

## Settled

`tm handover` lists what is loose; the agent judges whether it matters. `tm done` volunteers
the answer once per closed task, projecting past the commit it just asked for — the one moment
where "nothing" is true by construction, since board, history and code are about to land
together. Everywhere else it is asked for.

Direction taken on the open questions:

- **Volunteered only at `done`.** A `post-commit` nudge fits the existing grain and was
  rejected: the useful message here is the positive one, which is true on most commits, so it
  would print constantly and be read never.
- **The incompleteness is printed, not implied.** The command says it lists what is loose, not
  what matters. A list that read as exhaustive would be trusted past what it can do.
- **One command, not a flag on `check`.** `check` is hook-facing and its reader is `git`.

Corrections to what this file said before the work:

- **Unpushed commits are not a handover concern.** They are on disk and survive a clear intact.
  Listing them would conflate *is this saved* with *is this live*, which is `tm unpushed`.
- **Sidecar quality is not judged, only existence.** A one-line sidecar can be complete and a
  long one stale; existence is the honest signal available.

`DEC-043` carries the argument, including why context *size* is the wrong measure — a nearly
empty session can hold the only copy of an afternoon's reasoning.

## Found while testing

`adopt` ships `notes/raw/.gitkeep`, which counted as a capture, so every fresh install reported
something loose that was not. A false positive costs this feature everything it has — the whole
value is that "nothing carries over" can be believed — so the clean case is the first assertion
in the suite.
