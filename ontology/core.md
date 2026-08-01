# Core entities

The entities the skeleton itself defines. These are the same in every clone. Your project's
entities go in [`domain/`](domain/README.md).

Each entry states: what it is, what identifies it, what it relates to, where it lives.

---

## Platform

The system being built — code, infrastructure, configuration, and whatever else ships.

- **Identity:** singular. There is one platform per project.
- **Lives in:** `platform/`
- **Relates to:** subject of every task in [Ledger](#ledger) `platform`.
- **Notes:** the skeleton is agnostic to its language and architecture. `platform/` is a
  deliberate hole; the skeleton does not scaffold it or constrain it.

## Business

Everything about the project that is not the platform: customers, positioning, pricing,
operations, finance, legal, hiring.

- **Identity:** singular, like Platform.
- **Lives in:** no dedicated tree — it is the subject matter of `taskman/business/` and of
  much of `notes/`.
- **Relates to:** subject of every task in [Ledger](#ledger) `business`.

## Task

A unit of intended change — the thing the project actually tracks.

- **Defined in:** [`taskman/ontology.md`](../taskman/ontology.md), along with Ledger, Board,
  Sidecar, Window and History.
- **Notes:** taskman's vocabulary is co-located with taskman. Only the pointer lives here,
  because a Task is referenced from outside the subsystem — a [Note](#note) or a commit
  message may cite one by ID.

## Note

Durable knowledge captured from a conversation, a call, or a thought — and the intake funnel
that feeds the board.

- **Defined in:** [`notes/ontology.md`](../notes/ontology.md), along with Capture, Archive and
  the distil/promote/prune lifecycle.
- **Notes:** only the pointer lives here, because a Note is referenced from outside the
  subsystem — a task can name the note it came from.

## Decision

A [Note](#note)-adjacent record of a choice made, the alternatives rejected, and why. It is
**not** part of the notes pipeline: a decision is a claim the project stands behind, written
deliberately; a note is something someone said on a Tuesday.

- **Identity:** `DEC-###`, sequential, never reused.
- **Lives in:** `notes/decisions/DEC-###-<slug>.md`
- **Lifecycle:** `accepted → superseded`. **Never edited in substance and never deleted.** To
  change a decision, write a new one that supersedes it — the record of having believed
  something is itself the value.

## Scratch

Local, disposable working material: session logs, intermediate reasoning, anything not yet worth
committing.

- **Identity:** none guaranteed. Nothing may reference Scratch as a source of truth.
- **Lives in:** `.notes/` — gitignored.
- **Relates to:** may be **promoted** into a [Note](#note) or a Task. Promotion is explicit and
  one-directional; see principle 4.

## Ontology

This vocabulary. Self-describing, and an entity in its own right because tooling and agents
are expected to read it.

- **Lives in:** `ontology/`, split into core (stable, shared) and `domain/` (yours).
- **Relates to:** defines the terms used by every other entity.

## Skill

A packaged, named procedure an agent invokes — the sanctioned way to mutate or query
records under principle 2.

- **Identity:** its name.
- **Lives in:** not yet decided. Location and implementation language are open questions;
  see `README.md` → Open decisions.
- **Notes:** whatever form Skills take, they must be invokable without a specific vendor's
  agent runtime. A Skill that only one provider's tooling can run violates principle 3.

## Automation

An unattended process — a hook, a scheduled job, a CI step — that performs the same kind of
mutation a Skill does, without a human or agent in the loop.

- **Relates to:** shares the invariants and, ideally, the implementation of [Skills](#skill).
- **Notes:** Skills and Automations are the only two legitimate writers to `taskman/` and
  `notes/`.
