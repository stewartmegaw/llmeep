---
id: DEC-028
title: Everything llmeep owns lives in one folder
status: superseded
decided: 2026-08-04
deciders: [stew]
supersedes: []
superseded_by: [DEC-032]
relates_to: [DEC-003, DEC-018, DEC-020]
---

# DEC-028 — Everything llmeep owns lives in one folder

## Context

A clone or a greenfield install scattered five entries across the repo root: `tasks/`, `notes/`,
`decisions/`, `.notes/` and `.env`, plus `ontology/`, `adopt` and `.claude/`. Every one of those
is an ordinary word. `adopt` already knew this — it refused to install flat when any of them
existed and told you to use `--into ops` — which means **the flat layout was already the case we
apologised for**, kept as the default anyway.

The cost was not aesthetic. A reader landing in the repo cannot tell which directories are the
project and which are the tooling; a rename is five `git mv`s and a `.gitignore` edit; and the
nested install that `adopt --into` produced was a *different shape* from the one every clone
had, so the layout most people ran was the one least exercised.

## Decision

**`tasks/`, `notes/`, `decisions/`, `.notes/` and `.env` live under a single folder, `llmeep/`
by default, for clones and adoptions alike.** `adopt --into ops` renames it; nothing else
changes, and it can be renamed by hand afterwards.

Two things stay at the repo root, and both are the adopter's rather than llmeep's:

- **`ontology/`** — `ontology/domain/` is where a team describes *their own project*. Filing it
  under the tooling folder says it belongs to the tooling, which is the opposite of what it is
  for. `adopt` moved it when nesting; that was wrong and is now fixed.
- **`.claude/`** — the only place an agent looks. Non-negotiable rather than chosen.

`adopt` and the `.llmeep` manifest also stay at the root: `adopt` is the one file a stranger
runs before any of this exists, and pointing them a directory deep is friction on the only step
that has to be effortless.

**The skeleton ships in the same shape it installs.** One `nested()` predicate answers "does
this path live under the install folder?", and both `src_of` and `dest_of` are that predicate
pointed at the source and the destination. Previously the two were separate assumptions and
drifted.

## Alternatives considered

- **Keep flat, keep `--into` as the escape hatch.** The status quo. Rejected because the escape
  hatch was already the recommended path whenever it mattered, and shipping a default you talk
  people out of is a default in name only.
- **Move `ontology/` in as well.** What `adopt --into` did, and simpler to explain — everything
  llmeep ships in one place. Rejected: `ontology/domain/` is the adopter's description of their
  own system, and its emptiness in a fresh install is a prompt to fill it in, not a tooling
  detail to bury.
- **Move `.env` to the repo root** where tooling conventionally looks. Rejected: `tm` resolves
  `.env` from its own install root, so root placement would need a code change to look up
  through the tree, and a repo with two llmeep installs could not give them separate tokens.
- **A dotted folder, `.llmeep/`.** Hides the records from casual listing, which is exactly wrong
  for files whose whole purpose is to be read and hand-edited.

## Consequences

- **`REPO` in `tm` and `nm` is now the install folder, not the git toplevel.** This was already
  true for nested installs and is why nesting needed no configuration. Anything that genuinely
  wants the repository asks git — `dead_links` and the release-directory check both had to, and
  both were silently checking the wrong tree until they did.
- **Existing installs are unaffected.** They keep whatever shape they were installed with;
  `.llmeep` records `into`, and `--update` follows it.
- **One directory to rename.** A repo that wants `ops/` renames the folder — the tooling derives
  its roots from where it sits, so nothing inside needs editing.
- **Relative links inside the trees gained a level.** Anything pointing out of `llmeep/` — to
  `ontology/`, `README.md` — needed one more `../`. Fifty-seven links across thirty files, which
  is precisely the class of error `dead_links` exists for and precisely why it had to stop
  scanning from `REPO`.

## Revisit when

- Someone runs two llmeep installs in one repo. The design allows it and nothing tests it.
- `ontology/` starts feeling like tooling rather than the adopter's. That would mean
  `ontology/domain/` is going unused, which is a bigger problem than where the folder sits.
