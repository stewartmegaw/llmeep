---
id: DEC-001
title: Taskman is a board file with four skills, backed by git history
status: accepted
decided: 2026-07-31
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [PLT-001, PLT-002, PLT-003, PLT-004, PLT-005]
---

# DEC-001 — Taskman is a board file with four skills, backed by git history

## Context

Jira and its equivalents impose friction that only pays off when a team cannot hold context
in its head. A small team building an MVP inverts every assumption behind that:

- **No handoff.** With one or two developers, the ticket is not communicating with anyone.
- **Review is theatre or absent.** With a single developer there is nobody to review. Where
  changes are AI-generated at volume, a review column tracks a step nobody meaningfully
  performs.
- **The agent already has the context.** It is in the repo. A tracker that lives elsewhere
  is a second, worse copy that must be kept in sync by hand.
- **Building is now rapid.** Writing a detailed description of work that takes an hour is
  friction with no reader. A title is frequently the entire task.

The original skeleton specified one markdown file per task in `open/doing/done` folders,
with mandatory acceptance criteria. Two forcing functions broke it: **priority ordering**,
which is not a property of any single file and which folders cannot express, and the
observation that **git is already a database**, which makes storing completed work in the
working tree redundant.

## Decision

**One board file per ledger is the system.** It holds status, priority order, titles and the
ID counter. A task is one line. Detail files are optional sidecars, written only when a title
was genuinely not enough.

- **Priority is position.** No priority field.
- **Status is section.** `doing` holds at most one task.
- **Acceptance criteria are optional.** Where a sidecar defines them, `done` gates on them.
  Where none exist, there is no gate.
- **`recent` holds the last 15 completed.** Older entries leave the working tree and are
  retrieved from git history by a skill.
- **Four skills:** `add`, `go`, `done`, `find`. Listing is reading the board; reordering is
  moving a line.
- **Completion notifies a team Telegram bot on commit**, carrying the commit SHA.

## Alternatives considered

- **File-per-task in status folders, plus a separate order file.** Rejected: two mechanisms
  to keep in sync, `git mv` churn on every transition, and a permanent class of bugs where
  frontmatter disagrees with the containing folder. The order file could also drift from
  what was actually on disk.
- **Append-only event log (JSONL), all state derived.** Rejected: best machine fit, but
  unusable until the tooling exists, and it destroys grep-ability and hand-inspection. The
  board must be editable with nothing but an editor on day one.
- **SQLite.** Rejected: kills diffs, review and grep. The version control system is the
  feature here, not an obstacle to route around.
- **Priority buckets (P0–P3) with ordering inside each.** Rejected: priority labels inflate
  until everything is P1, and the resulting argument is unresolvable. "Above or below this
  other thing" always has an answer.
- **Mandatory acceptance criteria on every task.** Rejected as MVP friction. Kept as an
  opt-in gate, since with no reviewer they are the only quality gate that exists.
- **Keeping all completed tasks in the tree, or an `archive/`.** Rejected: unbounded growth
  in exactly the artifact that must stay cheap to read. Git already stores this perfectly.
- **Notifying on `task done` rather than on commit.** Rejected: announces work that may
  never be committed, and carries no SHA to point at. Firing post-commit makes the message a
  pointer to the actual change.
- **Reordering via a skill.** Rejected: reordering has no invariant to break in a
  single-file design, and it is the most frequent operation in the system.

## Consequences

- Any query about live state is **one small file read**, which is the property that matters
  most when the primary reader is an agent paying by the token.
- The entire "frontmatter disagrees with folder" bug class is gone, because there is one
  place.
- The board is a **merge-conflict hotspot**. Accepted knowingly: it is fine at 1–3 people
  and would not be at ten. Revisit if the team grows.
- **History is no longer visible by default.** This is the real cost. An agent cannot see
  that an approach was already tried and will not think to look, so the instruction to
  search must be written where it will be encountered — see
  [principle 6](../../ontology/principles.md).
- Hand-editing the board is now sanctioned for reordering, which required a bounded
  exemption to principle 2.

## Revisit when

- The team passes ~4 active committers and board merge conflicts become routine.
- The `recent` window of 15 proves to be the wrong size in practice — too noisy, or so short
  that `find` is needed constantly.
- Task sidecars turn out to be written for most tasks anyway, which would mean the one-line
  default was wrong.
