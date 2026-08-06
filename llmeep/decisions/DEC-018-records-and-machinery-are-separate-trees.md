---
id: DEC-018
title: Records and machinery live in separate trees
status: superseded
decided: 2026-08-02
deciders: [stew]
supersedes: []
superseded_by: [DEC-019]
relates_to: [DEC-001, DEC-003]
---

# DEC-018 — Records and machinery live in separate trees

## Context

`tasks/` had grown to hold two unrelated kinds of thing side by side:

| Records | Machinery |
| --- | --- |
| `history.tsv` | `tm` |
| `platform/board.md`, `platform/tasks/` | `hooks/` |
| `business/board.md`, `business/tasks/` | `blueprints/` |
| `ontology.md` | `_template.md` |

Nothing marked the boundary. A reader opening `tasks/` could not tell at a glance which files
are the ledger the project depends on and which are the code that maintains it — and the
distinction matters more here than usual, because
[principle 2](../ontology/principles.md#2-mutation-flows-through-tooling) says one side is
hand-editable (reordering a board) and the other is not.

A committed `__pycache__/tmcpython-314.pyc` was found in the same directory, tracked in git and
not ignored. It had been shipping to every cloner. That is the kind of thing a mixed tree hides.

## Decision

**`tasks/` holds records. `tasks/_tooling/` holds everything that runs.**

```
tasks/
  ontology.md
  history.tsv
  platform/          board.md + tasks/
  business/          board.md + tasks/
  _tooling/
    tm
    hooks/
    blueprints/
    _template.md
```

The leading underscore already meant *not a record* in this repo — `_template.md` carried that
signal before this decision existed. It now marks the whole subtree.

**`tm` splits one path constant into three.** `ROOT` was doing duty as both "where this script
lives" and "where the records live", which was only ever true by accident:

```python
HERE = os.path.dirname(os.path.abspath(__file__))   # the machinery
ROOT = os.environ.get("TM_ROOT") or os.path.dirname(HERE)   # the ledgers
REPO = os.path.dirname(ROOT)                        # the working tree
```

**`check` now verifies the hooks are wired up.** Moving `hooks/` breaks
`core.hooksPath` in every existing clone, and that failure is *silent* — git runs nothing and
reports nothing. The one check that cannot be delegated to a hook is the one asking whether the
hooks exist at all.

## Alternatives considered

- **Move only `hooks/`, `blueprints/` and `_template.md`; leave `tm` at `tasks/tm`.** Keeps
  the most-typed path in the project short and needs no changes to `tm` itself. Rejected
  deliberately: a rule with an exception in it is not a rule, and `tasks/` would still have
  contained one executable.
- **`tasks/bin/`.** Conventional, but hooks, a shell blueprint and a markdown template are not
  binaries; the name would undersell the contents.
- **Leave it.** The cost is real — 56 references across 9 files, plus a re-run of
  `core.hooksPath` in every clone. Rejected on the same reasoning as `DEC-013`: the rename is
  paid once and the confusion is paid by every reader.

## Consequences

- **Every path changes**, including ~30 rules in `.claude/settings.json` and the `TM` constant in
  `notes/nm` — which is built from path segments and so was invisible to a textual search for
  `tasks/tm`. Worth remembering the next time a move looks fully covered by grep.
- **Existing clones must re-run `git config core.hooksPath tasks/_tooling/hooks`.** `tm check`
  now says so rather than leaving it to be discovered.
- **`DEC-003` and `DEC-017` describe `tasks/tm`.** They are committed and not edited; this
  record is the reconciliation. Substitute `tasks/_tooling/tm` when reading them.
- **`__pycache__/` and `*.pyc` are now gitignored** and the tracked artifact is removed.

## Revisit when

- `_tooling/` accumulates enough that it wants internal structure of its own. That would be a
  sign the machinery has outgrown a single skeleton, which is a different problem.
