---
id: DEC-052
title: The app catalogues this repo's records, and llmeep's own documents are not among them
status: accepted
decided: 2026-09-13
deciders: [stewart]
supersedes: []
superseded_by: []
relates_to: [DEC-031, DEC-032, DEC-034, DEC-035, DEC-048]
---

# DEC-052 — The app catalogues this repo's records, and llmeep's own documents are not among them

## Status

`accepted` — as of 2026-09-13.

## Context

`DEC-032` moves llmeep's model into the adopting repo: `ontology/core.md`,
`ontology/principles.md` and the two `_tooling/ontology.md` files are installed under the install
folder, where an agent can read them on demand. The adopter's own domain ontology is not copied
anywhere — it stays where they keep it and `tm ontology <path>` records the path.

The app's readable catalogue then globbed `ontology/*.md` and both `_tooling/ontology.md` files
relative to that same install folder. In llmeep's own checkout those patterns name the project's
own model, which is correct. In an adopted repo they name llmeep's — so the Ontology tab offered
**Core, Principles, Taskman, Notes and a guide to writing an ontology**: five documents about
llmeep, and none about the repo they were being read in. Reported by an adopter looking at their
own app.

This is `PLT-gpq8` again, one layer along. There, a client project read shipped feedback
documentation and offered its owner the chance to point their install at a fork — a feature
addressed to us, surfacing in a repo it has no business existing in. `DEC-034` answered that by
keeping maintainer tooling out of the install. The same mistake reached the app through documents
that *do* legitimately ship.

## Decision

**The catalogue offers what this repo records. A file `adopt` installed is llmeep's, and llmeep's
documents are not this repo's records.**

The manifest in `.llmeep` is the test: it lists every path `adopt` wrote, so the app reads that
list and skips those files. Nothing is deleted, moved or made unreadable — an agent still reads
the model on demand, which is the only reader it was installed for.

**The asymmetry comes free rather than being coded.** llmeep's own checkout has no manifest,
because it is the source and not an install, so nothing is skipped and its model still lists —
there it *is* the project's own. `tm check` already decides whose decisions a citation may name
the same way (`DEC-035`).

## Alternatives considered

- **List llmeep's model under a second group** — "About llmeep", beside theirs. Rejected:
  principle 8 makes the app how a non-technical person reaches *their* repo, and a permanent
  section about the tool in a tool for looking at your own work is the tool talking about itself.
  An agent that needs the model reads the file; a person who wants it has the README and the
  public repo.
- **Exclude by filename** — a list of `core.md`, `principles.md`, `ontology.md`. Rejected: it
  would hide an adopter's own `core.md`, and it goes stale the first time llmeep adds a file.
  Whose a file is is recorded, so nothing needs guessing.
- **Drop the Ontology group entirely** unless a path is recorded. Rejected: the same outcome by a
  blunter route, and it would have suppressed llmeep's own model in llmeep's own app.
- **Stop installing llmeep's model in adopted repos.** Tempting, and wrong: `DEC-032` installs it
  so an agent with no network and no adapter can still read the system it is operating, and
  feedback is worth more when a note can name the principle it contradicts.
- **Leave it and document it.** What the ontology already effectively did. An adopter should not
  need to learn which of the five documents in their app are about their own business.

## Consequences

An adopted repo's Ontology tab holds their domain ontology or nothing. Since the app opens a
single document rather than listing one, tapping Ontology now goes straight to their model.

**It creates an empty state that did not exist**, so the Decisions and Ontology screens say what
would fill them — "No domain ontology recorded yet — ask to record where yours lives" — rather
than "Nothing here yet". A blank screen is a bug report waiting to be filed.

**The manifest gains a second reader**, and with it a reason to stay accurate that is visible to a
person rather than only to `--update`. A file missing from it would now also be offered as the
adopter's own.

`selftest` asserts both halves: the five documents are absent from an adopted repo's catalogue and
still present on disk, and llmeep's own tree still lists its own model. The test that previously
asserted an adopted repo has an Ontology group encoded the defect, and now asserts the group
appears when — and only when — `tm ontology` has recorded one.

## Revisit when

An adopter asks to read llmeep's model in the app. That is the "About llmeep" group above, and it
should be a deliberate section someone asked for rather than a glob that happened to match.
