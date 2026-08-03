---
id: DEC-010
title: Tasks carry an assignee, and WIP-1 becomes one per person
status: accepted
decided: 2026-07-31
deciders: [stew]
supersedes: [DEC-001]
superseded_by: []
relates_to: [DEC-005, PLT-001]
---

# DEC-010 — Tasks carry an assignee, and WIP-1 becomes one per person

## Context

[`DEC-001`](DEC-001-taskman-design.md) dropped assignees as Jira ceremony, on the premise that
"the ticket is not communicating with anyone". That premise was too narrow. **This project is
not exclusive to a single developer**, and once more than one person works a board, the
question *who is doing what next* has no answer anywhere in the system.

Git answers it for finished work — `find` resolves `closes PLT-xyz` to a commit, and the commit
has an author. It cannot answer it for **open** work, which is the case that actually causes
collisions: two people picking up the same task because neither could see the other had it.

`DEC-001` also set WIP-1 as one task in `doing` per *board*. That silently assumed a single
worker: with two people, the second to start is refused by a limit that was never about them.

## Decision

**An `@name` tag on the board line.** Same shape as `blocked:` and `detail`, so the format
gains no new concept:

```
PLT-9puy  Fix flaky auth test                    @stew
PLT-k3f9  Migrate config loader                  @sam  blocked:PLT-9puy  detail
```

**Identity is derived, never configured.** `whoami()` reads, in order: `TM_USER`,
`git config taskman.user`, the local part of `git config user.email`, then `git config
user.name`. The email local part is the primary source because it is short, stable, and already
unique within a team — a display name is none of those. Nothing new to set up.

**`go` claims, `park` releases, `done` records.** Starting a task assigns it to you; parking it
puts it back unclaimed and available; completing it writes the name into `history.tsv` and the
notification. `-f <name>` on `add` and `go` acts on someone else's behalf.

**`go` skips tasks claimed by others.** Bare `tm go` will not pick up work someone else owns —
name it explicitly to take it over.

**WIP-1 becomes one in `doing` per person.** The hook checks per assignee, not per board.

**`history.tsv` gains a fifth column, appended last** (`date, id, ledger, title, who`) so rows
written before assignees existed still parse — `zip` simply stops short.

## Alternatives considered

- **Leave it out, as `DEC-001` decided.** Rejected: the premise ("nobody to communicate with")
  is false for a multi-developer team, which is a supported case, not an exception.
- **Record only who *completed* a task.** Smaller, and it feeds the notification — but it
  largely duplicates the commit author, and answers the question nobody was stuck on. The
  collision risk is on *open* work.
- **Claim on the board without changing WIP-1.** Rejected as immediately broken: two people with
  claims cannot both have something in `doing` under a per-board limit.
- **A section per person.** Rejected — it fights priority-by-position, which is the board's
  central property.

## Consequences

- **A `doing` section can now hold several tasks**, one per person. "At most one in `doing`" was
  a load-bearing sentence in the ontology and is now wrong; the invariant is per assignee.
- **Unclaimed tasks in `doing` are adopted by the next `go`.** Without this, a task started
  before assignees existed is invisible to its owner's per-person WIP check, which silently
  permits a second task. Found during testing, exactly that way.
- **Identity depends on git config.** Where none is set, claims are simply not made and the
  behaviour degrades to the previous single-slot model. Nothing errors.
- **Names are slugged and unverified.** `@sam` is whatever git says; there is no roster and no
  validation that a name belongs to a real person.

## Revisit when

- Names collide (two `sam`s), which would need a roster the project currently does not have.
- Someone wants to see one person's board without reading the whole file — a filter, which
  today means `grep @sam`.
