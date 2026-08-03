# Glossary

Canonical terms. Use these exact words in task titles, note headings, commit messages and
code identifiers — the consistency is the point.

## Terms

| Term           | Means                                                                        |
| -------------- | ---------------------------------------------------------------------------- |
| **platform**   | The system being built. Never "the app", "the product", "the codebase".       |
| **business**   | Everything that is not the platform.                                          |
| **task**       | A unit of intended change with an ID. Defined in `tasks/ontology.md`.       |
| **note**       | Committed, durable knowledge under `notes/`.                                  |
| **decision**   | A note recording a choice and its rejected alternatives. `DEC-###`.           |
| **scratch**    | Local, disposable material under `.notes/`. Never a source of truth.          |
| **promote**    | Move something from scratch into a note or a task. Explicit, one-directional. |
| **skill**      | A named procedure an agent invokes to mutate or query records.                |
| **automation** | An unattended process that does the same, with no one in the loop.            |
| **record**     | Any managed file under `tasks/` or `notes/`.                                |
| **domain**     | This project's own ontology, in `ontology/domain/`.                           |

## Words we avoid

Not style policing — each of these has caused a real ambiguity.

| Avoid                | Because                                                          | Use instead                    |
| -------------------- | ---------------------------------------------------------------- | ------------------------------ |
| doc, documentation   | Conflates committed notes with generated API docs.               | **note**, or name the artifact |
| the app, the product | Ambiguous between platform and business framing.                 | **platform**                   |
| TODO (as a tracker)  | Untracked work with no ID. Fine in code, not as a unit of work.  | a **task**                     |
| archive (as a verb)  | Ambiguous: deleted, or done, or superseded?                      | `done`, `dropped`, `superseded` |

Taskman has its own avoid-list — see [`tasks/ontology.md`](../tasks/ontology.md).

## Naming conventions

- **Task IDs:** `PLT-9puy`, `BUS-hg7f`. Randomly allocated so branches cannot collide; see
  [`tasks/ontology.md`](../tasks/ontology.md). Never reused, never renumbered.
- **Decision IDs:** `DEC-001`. Same rules.
- **Filenames:** `<ID>-<kebab-case-slug>.md`. The slug is a convenience; the ID is identity.
- **Dates:** always absolute and ISO-8601 (`2026-07-31`). Never "yesterday", "last sprint",
  "recently" — a relative date is unresolvable to a reader arriving later.
- **References:** always by ID (`PLT-004`), never by title. Titles change.

## Adding terms

Domain terms go in `ontology/domain/`, not here. This file covers the skeleton's own
vocabulary, so that it stays mergeable with upstream.
