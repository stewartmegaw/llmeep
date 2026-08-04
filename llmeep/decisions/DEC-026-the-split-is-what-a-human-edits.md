---
id: DEC-026
title: The split is what a human edits while working, not what a human could open
status: accepted
decided: 2026-08-03
deciders: [stew]
supersedes: [DEC-019]
superseded_by: []
relates_to: [DEC-003, DEC-012, DEC-018]
---

# DEC-026 — The split is *what a human edits while working*

## Context

`DEC-019` drew the line at **hand-edited or not**, and listed `ontology.md` among the files
opened by hand. That was true in the sense that nothing stops you opening it. It was wrong
about frequency, which is what the line is actually for.

A day of real use puts the difference plainly:

| Touched while working | Opened once, or never |
| --- | --- |
| `board.md` — reordered constantly, the highest-frequency operation there is | `ontology.md` — read when changing the model, which is rare |
| `notes.md` — the window, read whole | `history.tsv`, `tm`, `nm`, hooks, blueprints |
| task sidecars — written with the task | |

`ontology.md` is 570 lines in `tasks/` and 204 in `notes/`. Sitting at the top of each
subsystem, it was the largest thing a newcomer saw when they opened a folder they came to for a
board — and it is reference material for changing the tooling, not for using it. The same
argument that keeps `history.tsv` out of the way applies to it, and `DEC-019` reached the
opposite conclusion only because it asked whether a human *could* open the file rather than
whether one routinely does.

## Decision

**The line is: files a human edits in the course of working sit in the open; reference
material and machinery sit under `_tooling/` together.**

```
tasks/                          notes/
  platform/  board.md, tasks/     notes.md
  business/  board.md, tasks/     raw/
  UNADOPTED.md                    UNADOPTED.md
  _tooling/                       _tooling/
    ontology.md                     ontology.md
    tm                              nm
    history.tsv                     history.tsv
    hooks/
    blueprints/
    _template.md
```

`_tooling/` is therefore **the machinery and the model it implements**, not "nothing that is
ever hand-edited". The tree diagrams inside both ontologies say so.

Everything else in `DEC-019` stands: both subsystems split identically, and `nm` keeps the
three-way `HERE` / `ROOT` / `REPO` path split it gained there.

## Alternatives considered

- **Leave it where `DEC-019` put it.** Rejected: it made the first thing in each subsystem the
  thing least often needed, and the cost fell on exactly the person least equipped to ignore it
  — someone arriving at `tasks/` for the first time.
- **Move the ontologies to a top-level `docs/`.** Rejected: it breaks co-location, which is the
  whole point of `DEC-012`. The model has to travel with the subsystem for `tasks/` to stay
  liftable into another repo.
- **Delete them and fold the model into the skills.** Rejected: the skills are adapters and are
  vendor-scoped (`.claude/`), while the ontology is the thing that survives an agent change.
  `DEC-003` depends on the model existing outside the skill.

## Consequences

- A subsystem folder now shows only what you came for: boards, notes, captures.
- `_tooling/` is no longer a promise that nothing inside is hand-edited. That promise was
  already soft — `_template.md` lives there and is copied by hand.
- Roughly twenty references moved: the README, both skills, five decision records, both
  executables' docstrings, three layout diagrams, and the sidecar cross-links.
- Nothing mechanical enforces this. `tm check` validates that decisions do not get rewritten;
  it cannot tell that a file moved contrary to one. This decision was caught by reading
  `DEC-019`, which is not a repeatable process.

## Revisit when

A human starts opening an `ontology.md` weekly — that would mean the model is unstable, and the
file should sit where the work is happening. Failing that, nothing here changes.
