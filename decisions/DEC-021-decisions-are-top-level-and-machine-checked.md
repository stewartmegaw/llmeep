---
id: DEC-021
title: Decisions are top-level, and their graph is machine-checked
status: accepted
decided: 2026-08-02
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-012, DEC-019, DEC-020]
---

# DEC-021 — Decisions are top-level, and their graph is machine-checked

## Context

`DEC-###` records lived in `notes/decisions/` on the grounds that both are durable committed
knowledge. True, and the only thing the two shared.

The cost showed up as **five places that had to say decisions are the exception**: the folder
annotation in `notes/ontology.md`, a section in the same file titled *"Decisions are a different
thing"*, a rule in the `nm` skill, the `nm reset` output, and `ontology/core.md` calling a
decision "Note-adjacent" and then immediately disclaiming the adjacency.

The stronger argument was in the code:

```
tasks/_tooling/tm  dec_dir = os.path.join(REPO, "notes", "decisions")
tasks/_tooling/tm  git diff --cached --name-only -- notes/decisions/
```

**`tm` owned a folder inside `notes/`.** `tm reset --all` deleted decisions; `check_decisions`
validated them at every commit. Meanwhile `DEC-012` split `nm` from `tm` to keep the two
subsystems liftable, and `DEC-020` refused to write a single shared `reset` on exactly those
grounds. Lifting `notes/` into another project took the records and left the validator behind.

Decisions were *stored* by one subsystem and *governed* by another, and owned by neither.

## Decision

**`decisions/` is top-level.** It belongs to the project, not to a subsystem, which is what its
position now says.

**Supersession is verified on both sides.** The second half of this decision matters more than
the first. A decision is never hand-edited — but nothing enforced that beyond a word-count
threshold on rewrites, and the integrity that actually breaks is *referential*:

- `A supersedes B` with no matching `B superseded_by A` — the stale record still reads as
  current from one direction
- `superseded_by` set while `status` still says `accepted`
- a reference to a `DEC-` that does not exist
- two files claiming the same id

`check_decision_graph` now rejects all four. It walks **the whole folder, not the staged diff**,
because the file that goes stale is by definition the other one — the one not in this commit.

**Validation, not a writing tool, is the enforcement.** A `dm new` command would allocate ids and
set both sides, and would do nothing whatsoever to stop someone opening the file in an editor.
The check does. Writing the prose of a decision is pure judgement and belongs to whoever is
holding the argument ([principle 7](../ontology/principles.md#7-judgement-belongs-to-the-agent-mechanism-belongs-to-the-tool)).

## Alternatives considered

- **A third executable, `decisions/_tooling/dm`.** Consistent with `DEC-003` and `DEC-019`, and
  `DEC-020` even named "a third subsystem appears" as its revisit trigger. Rejected for now:
  the mechanism worth automating is id allocation and reciprocal frontmatter, and a check that
  catches both errors is smaller than a tool that avoids them — and unlike the tool, it also
  catches the hand-edit.
- **Leave them in `notes/`.** `notes/` genuinely means *durable committed knowledge* against
  `.notes/` meaning *disposable local*, which is [principle 4](../ontology/principles.md#4-committed-knowledge-and-local-memory-are-different-things).
  Rejected: that axis is real but weaker than ownership, and it was costing five disclaimers.
- **Move `check_decisions` out of `tm` instead of moving the folder.** Solves the coupling from
  the other end, but needs somewhere to put it, which is the third executable again.

## Consequences

- **26 inbound links repointed**, plus 10 `../../ontology/` links inside the records themselves
  becoming `../`. Editing committed decisions is permitted for this — a path is not substance —
  and the move registers as a rename, so `check_decisions` sees the files as new rather than
  rewritten.
- **`tm` still validates `decisions/`**, so the reach across trees is not gone; it now points at
  a neutral top-level folder rather than into a peer subsystem.
- **Every existing record already passed** the new graph check on first run — eleven supersede
  links, all reciprocal. That was luck plus care, which is the argument for checking it.
- **`nm reset` no longer mentions decisions**, because it no longer has any relationship to them.
- **Decisions still have no search** (`PLT-cajd`). Position changed; retrievability did not.

## Revisit when

- Id allocation collides. `DEC-###` is sequential, which is the exact problem random task ids
  were introduced to solve (`DEC-002`); two branches writing `DEC-022` is possible and the graph
  check would catch it only after the fact.
- The folder outgrows `ls` as its index, at which point `find` stops being optional.
