---
id: DEC-043
title: When to clear context is judged by what the records do not hold, and the tool never names a way to clear
status: accepted
decided: 2026-08-22
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-003, DEC-005, DEC-037]
---

# DEC-043 — When to clear context is judged by what the records do not hold, and the tool never names a way to clear

## Status

`accepted` — as of 2026-08-22.

## Context

The argument for keeping records in the repo is that carrying them is cheaper than the tracker
they replace, and `tm go` is described as a context loader rather than a state change. If both
are true then a session is disposable exactly when `go` plus the board would bring back
everything that matters — and clearing early should be the ordinary habit rather than the
nervous one.

Nothing said so, and nothing helped anyone judge it. The instinct in the absence of a signal is
to hoard context, which is the opposite of what this design earns.

[`DEC-037`](DEC-037-budget-the-session-not-the-file.md) measures what a session *costs*. That is
a different question from what a session *holds*, and conflating them is the trap: a nearly
empty context can be holding the only copy of an afternoon's reasoning, and a full one can be
holding nothing but a file it re-read four times.

## Decision

**The question is not how full the context is. It is what this session knows that nothing on
disk does.** `tm handover` lists it:

| Loose | Because |
| --- | --- |
| A task in progress with no sidecar | The title survives a clear; where the work got to does not |
| Captures in `notes/raw` | The transcript is on disk, the judgement about it is not |
| An agenda draft past its scaffold | The conversation shaping it is the unwritten part |
| Uncommitted changes | The files keep; the reason for them may not |

**Every one is a proxy, and the list is knowingly incomplete.** A decision that should have
been written and was not is the most expensive thing a clear can cost, and nothing can detect
it. The command says so rather than implying coverage it does not have.

**Unpushed commits are deliberately absent.** They are on disk and survive a clear intact.
That is `tm unpushed` and a different question — *is this live*, not *is this saved*.

**`tm done` says it unasked, once per closed task**, projecting past the commit it just asked
for. That is the one moment where the answer is nearly always "nothing", by construction: board,
history and code are about to land together. Everywhere else it is asked for.

**The tool never names a way to clear.** Clearing is a harness feature and its spelling is
vendor-specific. `tm` reports the state; what to do about it belongs to whatever is reading
([`DEC-003`](DEC-003-skills-are-executables.md), principle 3).

## Alternatives considered

- **Measure context size and warn past a threshold.** What `DEC-037` already does for files,
  and the obvious extension. Rejected: size is not the risk. It would nudge hardest at exactly
  the wrong times and stay silent when a short session held the only copy of something.
- **Nudge from `post-commit`, like the in-progress check.** Fits the existing grain and would
  fire at a real boundary. Rejected because the useful message here is the *positive* one —
  "nothing is loose" — which is true on most commits, so it would print constantly and be read
  never. `done` fires once per task instead.
- **Say nothing unprompted; make it purely a command.** Safe and nearly useless: an agent that
  never thinks to ask never asks, and the whole point is to shift a habit.
- **Judge sidecar quality, not just existence** — flag a sidecar with no `Log`. Rejected as
  false precision. A one-line sidecar can be complete and a long one can be stale; existence is
  the honest signal available.
- **Have the tool tell the agent to clear.** Rejected on principle 3: `/clear` is one vendor's,
  and a shipped executable that assumes which agent is reading is the failure that principle
  exists to prevent.

## Consequences

- **A false positive costs the whole feature.** `notes/raw/.gitkeep` shipped by `adopt` was
  counted as a capture, so every fresh install reported something loose that was not — found
  while testing, and the reason the clean case is asserted first in the suite.
- **`done` now carries a second line.** It is the busiest output in the tool and this is the
  only thing added to it unasked; anything further should have to argue against that.
- **The incompleteness is stated in the output**, which makes the command weaker to read and
  honest. A list that implied it caught everything would be trusted past what it can do.
- **No skill change.** `done` and the command carry it, which matters against the session
  budget `DEC-037` sets.

## Revisit when

- Someone loses real work to a clear this called safe. The proxies are the weak point, and that
  is the evidence that would move them.
- The unwritten-decision gap gets a detector, which would be the single biggest improvement and
  is not obviously possible.
