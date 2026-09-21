---
id: DEC-047
title: A parked task carries a commit count, attributed by WIP-1 rather than by naming
status: superseded
decided: 2026-08-31
deciders: [stewart]
supersedes: []
superseded_by: [DEC-057]
relates_to: [DEC-004, DEC-036, DEC-030]
---

# DEC-047 — A parked task carries a commit count, attributed by WIP-1 rather than by naming

**Superseded by [`DEC-057`](DEC-057-several-tasks-run-at-once.md), 2026-09-21.** The
count stays and so does the reason for it; what changed is how it is attributed. WIP-1
was the mechanism here — one task in progress, so the window between starting and parking
belonged to it — and a pointer in `.git/` does that job without forbidding a second task.


## Status

`accepted` — as of 2026-08-31.

## Context

`park` unassigns, deliberately: parked means available, and leaving a name on it would make an
open task look owned. The cost is that a task with three commits behind it and one nobody has
ever opened render as the same line. That is exactly the distinction you need when choosing
what to pick up, since part-done work is far cheaper to finish than work not started.

Nothing else recovered it. `tm find` searches completed tasks only, so in-flight work on a
parked task was findable only by reading the git log for a trailer convention — and the trailer
is not there yet, because `closes <id>` is written once, at completion (`DEC-004`).

An adopter reported it from a real repo on 2026-08-24 and proposed the fix: count the commits
carrying a task's id, and show it on the board line. **That mechanism cannot work here.** No
commit names a task until the one that closes it, so the count would be zero for precisely the
unfinished tasks it exists to tell apart. The need was right and the mechanism was not.

## Decision

`go` records `since:<sha>` — where HEAD was when the task was started. `park` counts the
commits landed since, adds them to any `commits:<n>` already on the line, and removes the
anchor. A parked line therefore says how much work is behind it, and `go` says so again when
the task is resumed.

**Attribution comes from WIP-1, not from naming.** One task is in progress at a time, so
everything committed in that window was committed against it. This is the only correlation the
records actually support, and it costs no new convention: nobody has to remember to mention an
id.

`since:` exists only on a line in `in progress`. `park` folds it away, and `check` warns if it
is found anywhere else — left in place it would be folded twice and double-count. Absent
`commits:` means none, and a task parked before this existed has none forever, the same rule
`filed:` already follows.

## Alternatives considered

- **Count commits whose message names the task**, the adopter's own proposal — rejected on the
  facts above: the only naming convention fires at completion, so the count is zero exactly
  when it is needed. Adopting it would have meant *also* inventing a convention for mentioning
  ids in ordinary commits, which is a habit to maintain rather than a record to read.
- **Stop unassigning on park** — rejected. It solves the display problem by breaking the
  meaning: an unfinished task showing a name reads as owned, and someone else will leave it
  alone. Available is the accurate state, and the fix belongs on the line, not on the
  assignee.
- **A `started:<date>` marker instead of a count** — rejected as strictly weaker for the same
  cost. It answers "has anyone opened this" but not "how far did they get", and started-then-
  abandoned is not part-done. A date beside a title also reads as a deadline (`DEC-030`).
- **Record the count in `history.tsv`** — rejected. That file is completions only, appended by
  `done`. Writing in-flight state there would make the one append-only record mutable.
- **Derive it live, counting `since:`..HEAD at render time** — rejected: HEAD keeps moving
  after a park, so an untouched task would accrue everyone else's commits. The count has to be
  frozen at the moment work stops.

## Consequences

The board answers "what is cheapest to pick up" without anyone consulting git, and it answers
it for a task nobody owns — which was the gap.

The number is a *proxy*, and an honest one only while WIP-1 holds. A commit made during someone
else's stretch, or work done without committing, is counted or missed accordingly. That is
accepted: it decorates a board line and steers a choice, and no decision rests on it.

Two more tags exist on the model. `commits:` is meant to be read; `since:` is plumbing, renders
nowhere, and is the reason `check` gained a warning it did not need before.

## Revisit when

WIP-1 stops holding — a board that lets one person run two tasks at once makes the window
ambiguous, and the count would have to be attributed some other way or dropped.
