---
id: DEC-019
title: The tooling split is hand-edited or not, and both subsystems use it
status: superseded
decided: 2026-08-02
deciders: [stew]
supersedes: [DEC-018]
superseded_by: [DEC-026]
relates_to: [DEC-002, DEC-012]
---

# DEC-019 — The split is *hand-edited or not*, and both subsystems use it

## Context

`DEC-018` drew the line at **records versus machinery**, which put `history.tsv` in the open
beside the boards. That line was drawn a day too early — it named the two piles without asking
what a person actually does with them.

The useful question is narrower: **which files does a human ever open?**

| Opened by hand | Never opened by hand |
| --- | --- |
| `board.md` — reordering it is the highest-frequency operation in the system | `history.tsv` — append-only, tab-separated, read only by `grep` |
| `notes.md` — the window, read whole | `tm`, `nm`, hooks, blueprints |
| `ontology.md`, task sidecars | |

On that axis `history.tsv` is not a record a person keeps; it is a byproduct of the tool,
consulted only through `find`. `DEC-018` had it filed with the boards purely because both are
"records", which is a true statement that predicts nothing about how either is used.

`notes/` had drifted from `tasks/` besides. Both ontologies promise the same shape — a bounded
window plus an unbounded ledger — but only `tasks/` had a `_tooling/`.

## Decision

**The line is: hand-edited files sit in the open, everything else sits under `_tooling/`. Both
subsystems are split identically.**

```
tasks/                        notes/
  ontology.md                     ontology.md
  platform/  board.md, tasks/     notes.md
  business/  board.md, tasks/     raw/
  UNADOPTED.md                    decisions/
  _tooling/                       _tooling/
    tm                              nm
    history.tsv                     history.tsv
    hooks/
    blueprints/
    _template.md
```

**`nm` gains the same three-way path split `tm` got** in `DEC-018` — `HERE` for the machinery
and its ledger, `ROOT` for what a person reads, `REPO` for the tree around both. One shape to
learn rather than two.

## Alternatives considered

- **Move only `tasks/history.tsv`.** What was originally asked for, and about ten references
  instead of forty. Rejected because the asymmetry would be permanent and unexplainable: the
  same file, in the same role, at two different depths in two subsystems that are documented as
  mirrors.
- **Keep `DEC-018`'s line.** Defensible, and `history.tsv` genuinely is the most important
  durable record in the system. Rejected because "important" is not the axis — the whole point
  of the folder is telling a reader what they may touch, and nobody may touch `history.tsv`.
- **Rename `_tooling/` to something covering a ledger too.** Accurate, but a second rename of
  the same folder inside two days is churn, and `_tooling` still reads correctly as *the tool
  and what it keeps*.

## Consequences

- **A ledger now lives beside the tool that writes it**, which reads oddly until you notice it
  is also the only thing that ever reads it.
- **Deleting `_tooling/` to swap implementations would take the history with it.** Real risk,
  accepted: `git` still holds every completion, and the alternative is keeping a file in the
  open that nobody may open.
- **`DEC-018` is superseded one day after being written.** Its `__pycache__` fix and its
  `HERE`/`ROOT`/`REPO` split stand; only the placement of `history.tsv` changes.
- **Older decisions name `tasks/history.tsv` and `notes/nm`.** They are committed and not
  edited; substitute the `_tooling/` paths when reading them.

## Revisit when

- Something other than `tm` or `nm` needs to read a ledger directly. That would mean the ledger
  is an interface rather than a byproduct, and it should come back into the open.
