---
id: DEC-057
title: Several tasks run at once, and a pointer in .git says which one this checkout is on
status: accepted
decided: 2026-09-21
deciders: [stewart]
supersedes: [DEC-047]
superseded_by: []
relates_to: [DEC-001, DEC-010, DEC-005]
---

# DEC-057 — Several tasks run at once, and a pointer in `.git` says which one this checkout is on

## Status

`accepted` — as of 2026-09-21.

## Context

One task in progress per person was never argued for. `DEC-001` lists *"`doing` holds at most one
task"* as a bullet, in a document whose premise is one or two developers with no handoff;
`DEC-010` narrowed it from per-board to per-person the first time it was pressure-tested. It is a
premise that acquired dependents, not a finding.

Two things came to rest on it.

**The commit count.** `go` wrote `since:<sha>` to the board line and `park` folded
`rev-list since..HEAD` into `commits:N`. That number — *how much work is behind this task* — is
only honest if nothing else of yours was running in that window. It exists because an adopter
reported that a parked task with nine commits behind it and one nobody had touched rendered
identically (`PLT-b8gk`), and part-done work is the cheaper of the two to pick up.

**The defaults.** `done`, `park` and `detail` with no id took `in_progress[0]`.

Both are real, and neither requires forbidding concurrency. Running three unrelated things in one
project is ordinary, and the alternatives on offer were worktrees — rejected — or lying to the
count.

## Decision

**`in progress` holds as many tasks as people have started.** `go` starts one or switches to one;
nothing refuses on the grounds that you are already busy.

**A pointer in `.git/tm-current` says which task this checkout is on**, as id and anchor sha. It
is per-checkout state, which is what `since:` always was and could never be on a committed line:
two clones share one board and have two HEADs, so an anchor written there was only right for
whoever wrote it last. It sits beside the tokens `check` already keeps in `.git/`.

**Switching banks.** `go`, `park` and `done` fold `rev-list <anchor>..HEAD` onto whatever the
pointer named before moving it. One fold per switch — not a trailer on every commit, which was the
other way to attribute work and costs vigilance on every single commit rather than a word when you
change what you are doing.

**A bare verb asks when it cannot know.** With a pointer, `done` means the task you are on. With
several running and no pointer, it refuses and lists them. Taking `in_progress[0]` would close,
record and *notify a team* about a task nobody was talking about — which is the one thing the
single slot was quietly protecting.

**The count is filtered by author.** `rev-list --author` — a teammate's commits arriving by pull
inflated your task's number, which has been true since the count existed and was invisible only
while one person was pushing.

## Alternatives considered

- **A `task:` trailer on every commit.** Exact, and the first thing I proposed. Rejected as the
  expensive way to buy the same thing: it asks for a line on every commit forever, where the
  pointer asks for a word when you switch. Both fail the same way — forget, and the count is
  wrong — but one failure is rare and the other is constant.
- **Worktrees**, one per task. The standard answer, and refused by the person who has to use it.
  Worth naming because a per-checkout pointer is the same idea with the isolation removed: it
  works *because* a checkout is where a HEAD lives, and it does not demand a second tree to get
  one.
- **Keep WIP-1 and drop the count.** Coherent, and it throws away something an adopter asked for
  to preserve a premise nobody argued for.
- **Allow several and stop counting when they overlap.** The count goes blank exactly when the
  most is in flight, which is when it is worth most.
- **A session id rather than a checkout.** Two agents in one working tree would each get a
  pointer — and they would still be committing into one HEAD, so the attribution would be
  guesswork wearing a label. A checkout is the honest unit because it is the one that owns a HEAD.

## Consequences

Three unrelated tasks in one project is now an ordinary state, and the board says so.

**`since:` is no longer written.** An old line that has one keeps it until `park` folds it once,
and `check`'s rule about it sitting outside `in progress` still holds for records written before
this.

**The merge rule loses a case.** Two branches with work under way used to break WIP-1, so
`tm resolve` evicted the incoming task to the top of the queue; both survive now, which is also
what is true — each was started by somebody who has not finished. The test that asserted the
eviction now asserts the opposite.

**The commit nudge says one thing.** It warned about every task in progress, which was one line
while only one could be; with three running it printed three per commit, so it names the one this
checkout is on and counts the rest.

**`tm status` marks the current task**, which is how a session with no memory finds out where it
is without asking.

**What is lost:** the guarantee that the board's `in progress` is a single claim about what a
person is doing. It is a list of what they have started, and whether that stays honest is now a
habit rather than an invariant.

## Revisit when

Somebody runs two agents in one working tree. The pointer cannot tell them apart — both would bank
onto whichever task the last `go` named — and at that point the question is whether a session owns
a checkout, not whether a checkout owns a pointer.
