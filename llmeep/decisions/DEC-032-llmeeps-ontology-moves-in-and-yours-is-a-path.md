---
id: DEC-032
title: llmeep's ontology moves in, and yours is a path llmeep records
status: accepted
decided: 2026-08-06
deciders: [stewart]
supersedes: [DEC-028]
superseded_by: []
relates_to: [DEC-031, DEC-003]
---

# DEC-032 — llmeep's ontology moves in, and yours is a path llmeep records

## Status

`accepted` — as of 2026-08-06. Supersedes [`DEC-028`](DEC-028-everything-llmeep-owns-lives-in-one-folder.md)
in part: its rule that everything llmeep owns lives in one folder stands and is now actually
true. What is superseded is the exception it carved out for `ontology/`.

## Context

`DEC-028` put every tree under `llmeep/` except two. `.claude/` stayed at the repo root because
that is the only place an agent looks — still true, still not up for debate. `ontology/` stayed
on the grounds that *"`ontology/domain/` is where a team describes their own project. Filing it
under the tooling folder says it belongs to the tooling."*

That argument is sound and covers one subdirectory. It was applied to the whole folder, and the
whole folder was not the adopter's. Adopting into a repo with no `ontology/` created one holding:

| File | Whose | On `--update` |
| ---- | ----- | ------------- |
| `principles.md` (223 lines) | llmeep's | overwritten |
| `core.md` (113 lines) | llmeep's | overwritten |
| `domain/README.md` (71 lines) | llmeep's | overwritten |
| `domain/_template.md` (57 lines) | llmeep's | overwritten |
| `domain/*` | the adopter's | untouched, and empty |

464 lines, none of them about the adopter's project, under a generic top-level name in someone
else's repository — claimed on their behalf for a directory `DEC-031` had just established was
optional. A project that later wanted its own `ontology/` would find the name taken by the
tooling. Reported from a real adoption on 2026-08-06.

`DEC-028`'s remaining defence — *"its emptiness in a fresh install is a prompt to fill it in"* —
had been retracted the same day by `DEC-031`, which decided that prompt was the bug.

The check that watched the directory made the same mistake in a costlier place.
`check_ontology_currency` compared new platform files against a hardcoded `ontology/domain/`.
In an adopted repo, where the platform **is** the codebase, that fired on every commit adding a
source file and could not be satisfied except by writing an ontology nobody had asked for.
llmeep's own `platform/` is empty, so llmeep never saw its own noise — the failure mode its own
docstring names, invisible from where it was written and constant everywhere it was installed.

## Decision

**Everything llmeep ships lives under the install folder. `.claude/` is the only exception.**
`ontology/principles.md`, `ontology/core.md` and the domain guidance move to
`llmeep/ontology/`. The guidance flattens to `domain-ontology.md` and `domain-template.md`,
because a `domain/` directory that is not for your domain files was the misleading part.

**The adopter's ontology is a path, not a location llmeep provides.** `adopt` creates nothing
for it. `tm ontology <path>` records where theirs lives, `tm ontology --none` records that
there is none, and `.llmeep` carries the answer across updates. Three states, and the
distinction between the last two is the point: a path is watched, `--none` is silence, and
never-asked warns once per triggering commit naming the command that ends it.

**An agent that sees that warning asks the user.** It never writes an ontology and never
answers `--none` on their behalf. That is `DEC-031` applied to the one surface that could
otherwise reintroduce the behaviour it banned.

## Alternatives considered

- **Leave the layout; keep the check as it was.** Rejected: the check is unsatisfiable in
  exactly the repos it runs in, and an unsatisfiable warning is the one that teaches people
  `--no-verify`, taking every other check with it.
- **Move only `principles.md` and `core.md`, keep `ontology/domain/` at the root.** The first
  answer, and half right — it fixes ownership but still claims the root name, still ships an
  empty directory as a prompt, and still hardcodes one path for every adopter.
- **Delete `check_ontology_currency`.** Rejected: staleness is real, agents trust a stale
  ontology, and nothing else catches it. The check fires at the right moment — mid-work, when a
  concept plausibly appeared. Only its target was wrong.
- **Auto-discover the ontology by scanning for `ontology/` or `docs/ontology/`.** Rejected as
  guessing. A wrong guess is a check watching a directory nobody maintains, which reads green
  and means nothing. Being asked once is cheaper than being wrong silently.
- **Keep the path in a file `tm` owns rather than in `.llmeep`.** Rejected: `.llmeep` already
  claims to be the record of the install, and a second config file is a second thing to find,
  migrate and forget. `tm` parses the manifest header rather than importing the installer,
  which would be a dependency in the wrong direction (`DEC-003`).
- **Require an ontology and block on staleness.** Rejected for the reasons in `DEC-031`.

## Consequences

- **A repo can have its own `ontology/` and adopt llmeep.** Previously the two collided in a
  way `--into` could not fix, and `adopt` waved it through by not refusing.
- **`--update` migrates in place.** llmeep's four files are deleted from wherever they were —
  repo root for post-`DEC-028` installs, install folder for the ones before it — and reinstalled
  under `llmeep/ontology/`. Deletion is gated on the manifest checksum, so a file the adopter
  edited or that predated adoption is left alone (`PLT-s9ea`). Their own files never move, and
  their directory becomes the recorded ontology path.
- **The kept-file protection was extended to `.claude/`.** Writing the test for the above found
  that skips were recorded for the trees and not for the agent adapters, so an adopter who
  already had `.claude/settings.json` got it kept once and certified as ours in the manifest —
  `PLT-s9ea` again, on the one path still installed at the repo root. Present since that fix
  and hidden behind the ontology case that found it.
- **A pathspec is not an output path.** The check resolved the recorded path against the
  install folder rather than the repo root, so `ontology` matched `llmeep/ontology/` and passed
  on llmeep's own files. Caught in test, and only because the fixture used a repo whose
  ontology was at the root.

## Revisit when

Something in llmeep needs to *read* an adopter's ontology rather than watch its mtime — resolving
domain terms in a skill, say. A consumer needs structure, and structure means either a schema or
a convention about layout, which is a different decision from where the directory sits.
