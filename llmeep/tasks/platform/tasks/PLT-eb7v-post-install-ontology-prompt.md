# PLT-eb7v — Post-install ontology prompt reads as mandatory

Reported after adopting llmeep into another project: the agent finished the install and
immediately began writing a domain ontology, unprompted. Nothing about llmeep requires one.

## What is actually required

Nothing reads `ontology/domain/`. `tm` and `nm` run against an empty one. The only machine
touchpoint is `check_ontology_currency` (`llmeep/tasks/_tooling/tm:1705`), a pre-commit check
that **warns and never blocks** when a commit adds platform files while `ontology/domain/`
is unchanged. An adopter who never writes one gets a warning on some commits and nothing else.

## Why the agent did it anyway

1. `adopt:698` closes with `And read:  ontology/domain/README.md — describe your project there`,
   in the same "then do this" block as the `tm add` line above it. It reads as the next step.
2. `ontology/domain/README.md` then opens with **"How to start — work in this order. It usually
   takes one sitting"** and six numbered steps. The only line saying it is optional
   (*"Nothing here is mandatory. Delete what you do not need."*) is the last sentence of the
   file, ~50 lines down.

Neither file is wrong about the value of an ontology. Both are wrong about who is being
addressed and when.

## Acceptance

- `adopt`'s closing output addresses the human and marks the ontology as optional, without
  losing the pointer — an adopter who wants one still knows where to go.
- `ontology/domain/README.md` leads with what the directory is for and that it is optional,
  before any numbered procedure.
- A fresh adopt read by an agent does not produce a domain ontology as a side effect.

## Outcome

Three places fixed, not two — `README.md`'s "Start here" list was the worst of them, because
`adopt` copies that block verbatim into every adopting repo as the working agreement, so
"5. Describe your own project in `ontology/domain/`" was sitting permanently in a file the
agent reads each session.

- `adopt:698` — closing output now marks it optional and addresses the human.
- `ontology/domain/README.md` — leads with what it is for, that nothing reads it, and a line
  telling agents not to start it as a side effect. The six steps follow.
- `README.md:166` — step 5 restated as an optional extension point.
- `README.md:327` — "then work through ontology/domain/README.md" replaced with a statement
  that setup is complete.

Resolved the open question by writing `DEC-031` (the domain ontology is optional, and never an
install step). The opposite is genuinely arguable — the pre-commit warning already nudges that
way — so the rejected alternatives are worth having on record.

Verified: 12/12 selftests, `tm check` clean, and a scratch `adopt` run confirms both the new
closing output and the copied working agreement.
