---
id: DEC-031
title: The domain ontology is optional, and never an install step
status: accepted
decided: 2026-08-06
deciders: [stewart]
supersedes: []
superseded_by: []
relates_to: [DEC-020, DEC-028]
---

# DEC-031 — The domain ontology is optional, and never an install step

## Status

`accepted` — as of 2026-08-06.

## Context

`ontology/domain/` is the extension point where an adopter describes their own project. It has
always been optional in fact: nothing reads it, `tm` and `nm` behave identically against an
empty one, and the only machinery that looks its way is `check_ontology_currency`, which warns
and never blocks.

Nothing said so. Three places said the opposite by implication, and all three are read
immediately after an install:

- `adopt`'s closing output listed it as the second of two next steps, right under `tm add`.
- `ontology/domain/README.md` opened with "How to start — work in this order. It usually takes
  one sitting" and six numbered steps. The line saying it was optional was the file's last
  sentence.
- `README.md`'s "Start here" list — which `adopt` copies verbatim into every adopting repo as
  the working agreement — had "Describe your own project in `ontology/domain/`" as step 5.

The failure this produced is specific to who reads these files. A person skims a numbered list
and defers what looks like a big job. An agent reads an imperative and does it. On 2026-08-06 an
adoption into another project finished and the agent immediately began writing a full domain
ontology, unprompted, because the install had just told it to (`PLT-eb7v`). The output was not
wrong — it was work nobody had asked for, on the one file set an adopter is least able to judge
on day one, before they had a domain worth writing down.

The general shape matters more than this instance: **documentation aimed at a person is executed
by an agent.** Anything phrased as a step, in a file an agent reads after acting, is an
instruction whether or not it was meant as one.

## Decision

The domain ontology is optional and is never presented as part of adopting llmeep. No
install-time output, working agreement, or README ordering may list it as a step. The pointer
stays — an adopter who wants one must be able to find it — but it is stated as something
available whenever they want it, explicitly marked as not required and not now.

`ontology/domain/README.md` additionally addresses agents directly: filling the directory in is
never a side effect of adopting llmeep, of a task about something else, or of having read the
file.

## Alternatives considered

- **Leave the wording and rely on "Nothing here is mandatory"** — rejected because it was
  already there, fifty lines below six numbered steps, and did not survive contact with an
  agent. A disclaimer after a procedure loses to the procedure.
- **Make the ontology genuinely required** — rejected as the wrong direction. A domain model
  written on install day is written before the author knows the domain, which is the ontology's
  own rule against describing what should be rather than what is. It would also make every
  adoption more expensive at the exact moment the tooling has proven nothing.
- **Drop `check_ontology_currency` so nothing points at the directory at all** — rejected
  because that check fires at the right time. It warns when new platform files land, which is
  when a concept plausibly appeared — weeks in, mid-work, not at install. The warning is the
  intended prompt; the install output was not.
- **Have `adopt` delete `ontology/domain/` unless asked for** — rejected because the pointer has
  to survive for the extension point to be discoverable, and an empty directory with a README
  costs nothing. The problem was the phrasing, not the presence.

## Consequences

Some adopters will never write a domain ontology, and agents working in those repos keep
guessing at domain vocabulary. That is the accepted cost, and it is recoverable at any point;
an ontology written unasked on day one is harder to undo, because it looks authoritative and
agents will trust it.

Every file `adopt` emits or copies is now load-bearing for agent behaviour, including the
working-agreement extract from `README.md`. Editing the text between the `adopt:` markers is
editing an agent prompt, and changes to it should be read that way.

## Revisit when

Something in llmeep actually reads `ontology/domain/` — a command, a check that blocks, a skill
that resolves domain terms from it. A hard dependency would make it part of the install by
definition, and this decision would need reopening rather than working around.
