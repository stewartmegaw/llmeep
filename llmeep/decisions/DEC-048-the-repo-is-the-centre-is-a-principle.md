---
id: DEC-048
title: The repo being the centre is a principle, appended as the eighth rather than inserted first
status: accepted
decided: 2026-09-09
deciders: [stewart]
supersedes: []
superseded_by: []
relates_to: [DEC-003, DEC-007, DEC-040, DEC-043]
---

# DEC-048 — The repo being the centre is a principle, appended as the eighth rather than inserted first

## Status

`accepted` — as of 2026-09-09.

## Context

`principles.md` opened with *"Seven rules. Everything else in the skeleton is a consequence of
one of them."* That is a strong claim about completeness, and adding to it is not a documentation
edit.

It stopped being complete when a second door appeared. `PLT-6yjz` proposes a web UI and
`PLT-2gdj` a set of scheduled connectors, both filed 2026-09-07. Until then llmeep had one way
in — an agent holding the repo — and one way out, a notification channel that `DEC-007`
deliberately made deaf. With a single door, "everything lives in the repo" needed no saying:
there was nowhere else it could be.

The claim was already load-bearing under that silence. [Principle 6](../ontology/principles.md)
treats git as the database and a session as disposable, which is only safe because the session
holds nothing the repo does not — `DEC-043` rests entirely on that. Principle 4 draws the same
line inside the repo, between what is committed and what is one machine's scratch. Neither says
the general rule, because neither had to.

## Decision

**It is a principle, and it is the eighth.**

A principle rather than guidance because of what it rules out. It is not advice on how to build
an interface — it decides in advance that a whole class of design is wrong: a draft held in a
UI session, a connector's unread inbox, a queue awaiting a flush, any state an interface has to
reconcile with the repo. That is the same shape as the other seven, each of which forecloses
rather than recommends.

**Appended rather than inserted**, though it is arguably the most foundational of the eight and
would read best first. `principle N` is cited by name across 27 files — decisions, both skills,
`core.md`, the taskman ontology, task details. Inserting at 1 renumbers all seven and silently
breaks every one of those references. A cross-reference that points at the wrong rule is worse
than one that is out of order, and nothing about a numbered list claims the order is
importance.

## Alternatives considered

- **A section in `tasks/_tooling/ontology.md` instead** — rejected. That file is the taskman
  domain model: tasks, ledgers, boards, details. The claim is about the whole skeleton and
  binds `notes/`, `decisions/` and any future interface equally, so scoping it to taskman would
  put it where two thirds of its subject cannot see it.
- **This decision alone, with no principle** — rejected. A decision records a fork that was
  taken; a principle is a standing constraint applied to work nobody has proposed yet. The
  value here is entirely in the second: it has to reach the person building the third
  interface, who will not be reading a 2026 decision about the first two.
- **Leave it implicit, as it has been** — rejected on the evidence that it stopped working. Both
  new tasks needed the rule written into their details before their scope was decidable, and
  the connector one could not answer `DEC-007` without it. A rule that has to be re-derived
  per task is not implicit, it is missing.
- **Insert it as principle 1 and renumber** — rejected above. Worth revisiting only alongside a
  sweep that updates every citation, and even then the churn buys ordering and nothing else.
- **Fold it into principle 1** — rejected, though they are two halves of one idea: machine-first
  formats are affordable *because* a person reads an interface instead. Merged, principle 1
  becomes two rules wearing one number, and the half that constrains interfaces would be buried
  under a heading about file formats.

## Consequences

The eight rules now cover the case llmeep is about to enter, and an interface has a test to
fail against: *if this disappeared, what would be lost?* Access, always. Anything else is a
record that should have been in the repo.

`README.md` says "the eight rules"; `PLT-43mh`'s detail still says seven and is left alone,
being a record of what was true when it was written.

The cost is a numbered list whose order is now explicitly not meaningful — it is the order the
rules were noticed. Anyone reading it as a hierarchy will read it wrong, and nothing in the
document says so beyond this decision.

## Revisit when

A ninth is proposed. Two appended out of order is a list; three is a document that has stopped
being read as a whole, and at that point the renumbering sweep is worth its cost.
