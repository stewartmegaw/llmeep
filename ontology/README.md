# Ontology

The ontology is the project's shared vocabulary. It exists so that a human and an agent,
reading the same word, resolve it to the same thing — and so that an agent joining cold
can orient without reading the whole codebase.

It is **descriptive, not aspirational**. If the ontology and reality disagree, one of them
is a bug; say which.

## Files

| File                            | Scope                                                             |
| ------------------------------- | ----------------------------------------------------------------- |
| [`principles.md`](principles.md) | The rules the skeleton is built on. Read first.                   |
| [`core.md`](core.md)             | Entities the skeleton itself defines. Stable across all projects. |
| [`glossary.md`](glossary.md)     | Canonical terms and the words we deliberately avoid.              |
| [`domain/`](domain/README.md)    | **Your project's ontology.** The extension point.                 |

## Core vs domain

`principles.md`, `core.md` and `glossary.md` describe *the skeleton*. They are the same in
every clone, so upstream fixes merge cleanly.

`domain/` describes *your project* — its entities, its actors, its lifecycles, its units of
value. It starts empty. Everything you add goes there.

**Extend, do not modify.** If you find yourself editing `core.md` to fit your project, that
is a signal the concept belongs in `domain/` instead. The exception is a genuine defect in
the core model — fix it and upstream it.

## Co-located ontologies

A self-contained subsystem keeps its own vocabulary **next to itself**, not here:

| Subsystem  | Its ontology                                     |
| ---------- | ------------------------------------------------ |
| `taskman/` | [`taskman/ontology.md`](../taskman/ontology.md)  |
| `notes/`   | still in `core.md` — moves out when notes tooling is built |

Two reasons. The subsystem stays **liftable** — you can take `taskman/` to another project
and its definitions travel with it. And the ontology sits where someone working on the
subsystem will actually see it, which is the only way it stays current.

`core.md` keeps a one-line pointer for anything referenced from outside its subsystem, so
the entry point still resolves every term.

The test for whether something belongs here or there: **is it referenced by more than one
subsystem?** Task lives in `taskman/` because only taskman defines it, even though commits
and notes cite task IDs. Principles live here because everything obeys them.

## Conventions

- One entity per file in `domain/`, named after the entity in `kebab-case.md`.
- Every entity states: what it is, what identifies it, what it relates to, and where it
  lives on disk or in the system.
- Cross-reference with relative markdown links. A link to a file that does not exist yet is
  acceptable — it marks a gap, it is not an error.
- Terms defined here are used verbatim everywhere else: in task titles, note headings,
  commit messages, and code identifiers. Consistency of naming is the entire point.
