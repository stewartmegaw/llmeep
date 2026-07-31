---
id: PLT-001
title: Enforce record lifecycle via git hooks
created: 2026-07-31
---

# PLT-001 — Enforce record lifecycle via git hooks

## Outcome

A commit cannot land while the project's records are inconsistent with it. Git hooks check
the boards, `notes/` and `ontology/` at commit time and fail the commit — naming the specific
record and violation — rather than relying on anyone remembering.

## Context

[Principle 2](../../../ontology/principles.md) says mutation flows through tooling, and
[the `domain/` README](../../../ontology/domain/README.md) says a stale ontology is worse than
none because agents trust it. Both are currently conventions, and conventions that depend on
remembering decay.

The commit is the one moment every change reliably passes through, so it is where enforcement
belongs — and under [principle 6](../../../ontology/principles.md) the commit is already the
system of record. This is also where the Telegram notification fires (`PLT-005`).

Blocked on `PLT-003`: hooks enforce whatever the skills do, so they cannot be written first.

## Acceptance

- [ ] **Board integrity.** Commit rejected on: duplicate IDs across both boards and history; an
      ID reused from history; more than one task in `## doing`; a `blocked:` or `detail` tag
      pointing at something that does not exist.
- [ ] **Window integrity.** `## recent` holds at most 15 entries, newest first.
- [ ] **Trailer validity.** A `closes <id>` trailer naming a task that does not exist is
      rejected at `commit-msg`. The trailer is the permanent link `find` resolves, so a typo
      severs a task from its commit silently (`DEC-005`).
- [ ] **ID uniqueness across branches.** Duplicate IDs are rejected, naming both (`PLT-006`).
- [ ] **Stale-board nudge.** A commit landing while a task sits in `doing` prints one line
      suggesting `tm done`. **Never blocks** — this is the check that catches direct git use,
      and blocking it would break the escape hatches `DEC-005` deliberately preserved.
- [ ] Hooks **validate only** — they never mutate records. Mutation is `tm`'s job (`DEC-005`).
- [ ] **Sidecar integrity.** Every `tasks/*.md` corresponds to a live board line tagged
      `detail`, and its frontmatter `id` matches its filename.
- [ ] **Decision immutability.** Commit rejected when a `notes/decisions/` file's substance
      changed without a `superseded_by` — typo-level diffs pass.
- [ ] **Ontology currency.** Commit touching `platform/` warns when `ontology/domain/` has not
      been updated and the diff suggests a domain concept was added or renamed. Heuristic is
      fine; false positives must be cheap to dismiss. **Warns, does not block** — this is the
      check most likely to become noise, and a noisy hook gets bypassed permanently.
- [ ] Hooks read records only, never platform source, and run without any toolchain
      `platform/` needs ([principle 3](../../../ontology/principles.md)).
- [ ] Installable in one documented step from a clean clone, since `.git/hooks` is not
      committed.
- [ ] Every check runs standalone outside the hook, so CI can run the same checks and a
      failure is reproducible without committing.
- [ ] `--no-verify` leaves a trace — decide the mechanism and document it.

## Log

- 2026-07-31 — created.
- 2026-07-31 — rewritten for the board design (`DEC-001`). Folder-vs-frontmatter checks
  dropped; that bug class no longer exists. Ontology check downgraded to a warning.
