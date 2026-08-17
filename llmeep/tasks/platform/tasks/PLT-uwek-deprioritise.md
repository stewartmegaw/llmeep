---
id: PLT-uwek
title: Every status transition has a command except prioritised back to backlog
created: 2026-08-17
---

# PLT-uwek — Every status transition has a command except prioritised back to backlog

## Outcome

Demoting a ranked task to the pool is a command, like every other status change. Nobody edits
`board.md` by hand to say "actually, not next".

## Context

**"Status is section"** — the ontology's own words. So moving a line between sections is a status
transition, not a reordering, and every other one has a verb:

| Transition | Command |
| --- | --- |
| → backlog | `tm add` |
| backlog → prioritised | `tm prioritise` |
| → in progress | `tm go` |
| in progress → prioritised | `tm park` |
| → recent | `tm done` |
| **prioritised → backlog** | **nothing** |

The exemption that covers hand edits is narrower than it looks. It says *reordering* needs no
tooling, because one file holds both the tasks and their order and moving a line within a
section cannot create drift. That reasoning does not reach across a section boundary, where the
thing being changed is status.

Observed on 2026-08-17: asked to deprioritise a task, the agent hand-edited `board.md`, because
that is the only way. [Principle 2](../../../ontology/principles.md) exists to stop exactly
that — "if you want to change a record, there should be a command for it. If there is no
command, that is a gap in the tooling."

## Open questions

- **Name.** `deprioritise` is accurate and long. `park` is the natural word and already taken
  for in-progress → prioritised — but the two are the same idea at different heights, so a
  `park` that reads the line's current section and demotes it one step may be the honest answer
  rather than a new verb. That would make `park` mean *step this back*, which is what people
  already say out loud.
- **Does it belong on the hint line?** That line already advertises two verbs that do not exist
  (`PLT-gx39`), so adding a third name to it wants care.
- **`-n`, or no ordering flag?** The pool has no order (`DEC-027`), so unlike `prioritise` and
  `park` there is no top to go to. The absence of the flag is itself a statement.

## Acceptance

- [x] One command moves a task from `prioritised` to `backlog`
- [x] No ordering flag, or a stated reason why the pool suddenly has a top
- [x] The ontology's transition table shows it, so the set of verbs is complete on the page that
      defines them
- [x] A decision records the naming choice if `park` is overloaded rather than a verb added

## Log

- 2026-08-17 — `park` overloaded rather than a new verb, per the open question. *Park* already
  means *set this aside*, and setting aside something you ranked is the same act as setting aside
  something you started, one rung lower. `DEC-036`.
- 2026-08-17 — The ontology argued **against** this task and had to be answered rather than
  ignored. Its test was *"does the tool leave you any other way?"* — `park` earned a command
  because WIP-1 forces it, and demotion did not because nothing forces it. That test was written
  for a person with an editor open. Handed five verbs and one hole, an agent learns that writing
  to `board.md` is normal, and the next thing it hand-edits has an invariant behind it. The test
  is now *"is this a transition a person asks for out loud?"*
- 2026-08-17 — Same pass fixed a line that `tm drop` had falsified hours earlier: the ontology
  still said *"dropping stays a hand edit"*. Two documents disagreeing about whether a shipped
  command exists is worse than either answer.
- 2026-08-17 — `-n` errors rather than being ignored when the landing is the pool. A flag that
  silently does nothing teaches the wrong model of the board.
