# Core

The shared vocabulary: what things are called, and where each one is defined. It exists so that
a human and an agent, reading the same word, resolve it to the same thing.

It is **descriptive, not aspirational**. If this file and reality disagree, one of them is a
bug; say which.

**Extend, do not modify.** Your project's entities go in [`domain/`](domain/README.md), which
starts empty. If you find yourself editing this file to fit your project, that is the signal
the concept belongs there instead — the exception being a genuine defect in the core model.

## Where things are defined

A self-contained subsystem keeps its vocabulary **next to itself**, so it stays liftable and so
it sits where someone working on it will see it. Only what is referenced from outside a
subsystem is named here.

| Term          | Defined in                                        |
| ------------- | ------------------------------------------------- |
| **task**      | [`tasks/ontology.md`](../tasks/ontology.md) — with ledger, board, sidecar, window, history |
| **note**      | [`notes/ontology.md`](../notes/ontology.md) — with capture, archive, distil, promote, prune |
| **decision**  | below — it belongs to the project, not to a subsystem |
| **scratch**   | [`.notes/README.md`](../.notes/README.md) — local, disposable, never a source of truth |
| **platform**  | The system being built. One per project, in `platform/`. Never "the app" or "the product". |
| **business**  | Everything that is not the platform. Subject of `tasks/business/`. |

The test for whether something belongs here or in a subsystem: **is it referenced by more than
one subsystem?** Task is defined in `tasks/` because only that subsystem defines it, even
though commits and notes cite task ids. Principles live here because everything obeys them.

## Decision

A record of a choice made, the alternatives rejected, and why — a claim the project stands
behind, written deliberately. It sits at the top level rather than inside a subsystem
(`DEC-021`). A note is something someone said on a Tuesday; the two are unrelated.

- **Identity:** `DEC-###`, sequential, never reused.
- **Lives in:** `decisions/DEC-###-<slug>.md`
- **Lifecycle:** `accepted → superseded`. **Never edited in substance and never deleted.** To
  change a decision, write a new one that supersedes it — the record of having believed
  something is itself the value.
- **Enforced, not trusted:** `tm check` rejects a rewrite, a one-sided supersession, a status
  that disagrees with `superseded_by`, a dangling reference and a duplicate id. Nobody can hold
  that graph in their head, so nobody is asked to.

## Words we avoid

Not style policing — each of these has caused a real ambiguity.

| Avoid                | Because                                                          | Use instead                    |
| -------------------- | ---------------------------------------------------------------- | ------------------------------ |
| doc, documentation   | Conflates committed notes with generated API docs.               | **note**, or name the artifact |
| the app, the product | Ambiguous between platform and business framing.                 | **platform**                   |
| TODO (as a tracker)  | Untracked work with no ID. Fine in code, not as a unit of work.  | a **task**                     |
| archive (as a verb)  | Ambiguous: deleted, or done, or superseded?                      | `done`, `dropped`, `superseded` |

Tasks has its own avoid-list — see [`tasks/ontology.md`](../tasks/ontology.md).

## Naming conventions

- **Task IDs:** `PLT-9puy`, `BUS-hg7f`. Randomly allocated so branches cannot collide. Never
  reused, never renumbered.
- **Decision IDs:** `DEC-001`. Same rules.
- **Filenames:** `<ID>-<kebab-case-slug>.md`. The slug is a convenience; the ID is identity.
- **Dates:** always absolute and ISO-8601 (`2026-07-31`). Never "yesterday", "last sprint",
  "recently" — a relative date is unresolvable to a reader arriving later.
- **References:** always by ID (`PLT-004`), never by title. Titles change.
- **Terms are used verbatim** everywhere: task titles, note headings, commit messages, code
  identifiers. Consistency of naming is the entire point.
