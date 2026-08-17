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

- [ ] One command moves a task from `prioritised` to `backlog`
- [ ] No ordering flag, or a stated reason why the pool suddenly has a top
- [ ] The ontology's transition table shows it, so the set of verbs is complete on the page that
      defines them
- [ ] A decision records the naming choice if `park` is overloaded rather than a verb added
