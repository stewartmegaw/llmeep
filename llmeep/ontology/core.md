# Core

The shared vocabulary: what things are called, and where each one is defined. It exists so that
a human and an agent, reading the same word, resolve it to the same thing.

It is **descriptive, not aspirational**. If this file and reality disagree, one of them is a
bug; say which.

**Extend, do not modify.** Your project's entities go in an ontology of your own, kept
wherever you like — [`domain-ontology.md`](domain-ontology.md) explains how, and llmeep
neither creates one nor requires it. If you find yourself editing this file to fit your
project, that is the signal the concept belongs there instead — the exception being a genuine
defect in the core model.

## Where things are defined

A self-contained subsystem keeps its vocabulary **next to itself**, so it stays liftable and so
it sits where someone working on it will see it. Only what is referenced from outside a
subsystem is named here.

| Term          | Defined in                                        |
| ------------- | ------------------------------------------------- |
| **task**      | [`llmeep/tasks/_tooling/ontology.md`](../tasks/_tooling/ontology.md) — with ledger, board, sidecar, window, history |
| **note**      | [`llmeep/notes/_tooling/ontology.md`](../notes/_tooling/ontology.md) — with capture, archive, distil, promote, prune |
| **decision**  | below — it belongs to the project, not to a subsystem |
| **scratch**   | [`llmeep/.notes/README.md`](../.notes/README.md) — local, disposable, never a source of truth |
| **platform**  | The system being built. Below — it is a rule, not a directory. Never "the app" or "the product". |
| **business**  | Everything that is not the platform. Subject of `tasks/business/`. |

The test for whether something belongs here or in a subsystem: **is it referenced by more than
one subsystem?** Task is defined in `tasks/` because only that subsystem defines it, even
though commits and notes cite task ids. Principles live here because everything obeys them.

## Platform

The system being built: one per project, and the subject of every task in the `platform` ledger.

**It is the repo minus llmeep's own paths** — anything that is not `tasks/`, `notes/`,
`decisions/`, `ontology/`, `.notes/` or `.claude/`, and not documentation or configuration
sitting loose at the top. A fresh clone puts it in `platform/`, an empty directory kept for the
purpose. A repo that adopted llmeep keeps its code where it already was, and that code is no
less the platform for it (`PLT-tdb5`).

Defining it by subtraction rather than by a directory is what lets `tm` warn about work landing
with no task in a repo that never had a `platform/` — the pathspec matched nothing there, so
the warning was silently absent.

## Decision

A record of a choice made, the alternatives rejected, and why — a claim the project stands
behind, written deliberately. It sits at the top level rather than inside a subsystem
(`DEC-021`). A note is something someone said on a Tuesday; the two are unrelated.

- **Identity:** `DEC-###`, sequential, never reused.
- **Lives in:** `decisions/DEC-###-<slug>.md`
- **Lifecycle:** `accepted → superseded → pruned`. **Never edited in substance.** To change a
  decision, write a new one that supersedes it — the record of having believed something is
  itself the value. Superseded is not a step towards deletion: measured on 2026-08-04, the two
  most-referenced records in this project were both superseded. Only a record **nothing
  references** is a prune candidate, and `tm why --stale` proposes rather than acts.
- **Enforced, not trusted:** `tm check` rejects a rewrite, a one-sided supersession, a status
  that disagrees with `superseded_by`, a dangling reference and a duplicate id. Nobody can hold
  that graph in their head, so nobody is asked to.

### When to write one

Nothing prompts you. `check` enforces the *shape* of a decision and the graph between them, but
no tool can tell that a choice was worth recording — that is judgement, and it stays with the
person or agent doing the work ([principle 7](principles.md)).

Three triggers, most mechanical first:

1. **You are about to contradict a decision that already exists.** `check` refuses to let you
   quietly rewrite one, so this is forced eventually — but it is forced at commit time, after
   the work. Run `tm why <term>` *before* starting anything that changes established behaviour
   and you find out while it is still cheap.
2. **You rejected an alternative someone will propose again.** The test is not "was this
   important?" — it is **"would a reasonable person suggest the opposite next month?"** If yes,
   the rejected option and its reason are the record; without them the same idea comes back and
   gets re-argued from nothing.
3. **The reason exists only in a conversation.** A commit message says what changed. A decision
   says what else was considered and why not. When the second one is missing, the first reads
   like arbitrary preference six weeks later.

**When not to.** A bug fix. A rename with no alternative. Anything where the opposite would be
obviously wrong. A decision per change is how the folder becomes noise, and noise is what makes
the genuine ones unreadable.

The chain is the point, not the individual record. `DEC-015` → `DEC-016` → `DEC-017` is three
answers to one question, and the two wrong ones are what stop the first being proposed again.

## Words we avoid

Not style policing — each of these has caused a real ambiguity.

| Avoid                | Because                                                          | Use instead                    |
| -------------------- | ---------------------------------------------------------------- | ------------------------------ |
| doc, documentation   | Conflates committed notes with generated API docs.               | **note**, or name the artifact |
| the app, the product | Ambiguous between platform and business framing.                 | **platform**                   |
| TODO (as a tracker)  | Untracked work with no ID. Fine in code, not as a unit of work.  | a **task**                     |
| archive (as a verb)  | Ambiguous: deleted, or done, or superseded?                      | `done`, `dropped`, `superseded` |

Tasks has its own avoid-list — see [`llmeep/tasks/_tooling/ontology.md`](../tasks/_tooling/ontology.md).

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
