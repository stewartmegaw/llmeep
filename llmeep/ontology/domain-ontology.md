# Writing a domain ontology

**This file is guidance, not a container.** It is llmeep's, it lives with llmeep's other
machinery, and nothing of yours goes beside it. Your own ontology — if you write one — lives
wherever you keep documentation, under whatever name you like.

A domain ontology describes **your** project: its entities, its actors, its lifecycles, its
units of value. The [core ontology](core.md) describes the skeleton's machinery — tasks,
notes, ledgers — and says nothing about what you are actually building.

## This is optional, and it is not an install step

**Nothing in llmeep reads your ontology, and llmeep never creates one.** `tm` and `nm` behave
identically whether you have one or not, and an adopter who never writes a line loses no
functionality. The one piece of machinery that looks its way is a pre-commit check that
*warns* — never blocks — when a commit adds files to the platform and leaves your ontology
unchanged. It stays silent until you have told it where to look:

```sh
tm ontology docs/model     # where yours lives
tm ontology --none         # you are not writing one; stop asking
```

Write it when you have a domain worth writing down and agents that keep guessing wrong about
it — which is usually some weeks in, not the afternoon you installed the skeleton.

**Agents: do not start this because you have read it.** The instructions below are addressed
to a person who has decided to do the work. Writing an ontology is never a side effect of
adopting llmeep, of a task about something else, or of finding this file. If a commit warns
that no ontology is recorded, that is a question for the person you are working with — ask
them where theirs is, or whether they want one, and record the answer.

## How to start

Once you have decided to do it, work in this order. It usually takes one sitting.

1. **Name the thing.** One paragraph in `overview.md`: what the platform does, for whom,
   and what would be lost if it did not exist. Written for someone with no context.
2. **List the nouns.** Whatever your project talks about all day — `Customer`, `Order`,
   `Shipment`, `Dataset`, `Route`. Aim for 5–15. If you have 40, you are listing database
   tables, not modelling a domain.
3. **Give each noun a file.** Copy [`domain-template.md`](domain-template.md) to `<noun>.md`
   and fill it in. One entity per file, `kebab-case.md`.
4. **Draw the relationships.** In each file, say what it relates to and how. Contradictions
   between two files are the useful output of this step — resolve them.
5. **Name the actors.** Who or what acts on the system: user roles, external systems,
   scheduled processes.
6. **Write the lifecycles.** For every entity with states, enumerate the states and the
   legal transitions between them. Ambiguous state machines are where bugs and
   misunderstandings live.

Then add an `index.md` linking your files, link to it from your `README.md`, and run
`tm ontology <path>` so the currency check knows where it is.

## Rules

- **Extend, do not modify.** Do not edit `core.md` or `principles.md` to fit your
  project. If a concept feels like it belongs in core, it almost certainly belongs here
  instead. The exception is a real defect in the core model — fix that and upstream it.
- **Reuse core terms verbatim.** If your domain has a concept of "task", either it *is* the
  core Task or it needs a different name. Two meanings for one word is the failure mode this
  whole directory exists to prevent.
- **Describe what is, not what should be.** The ontology is a map. When it disagrees with
  reality, say which one is wrong and fix that one.
- **Keep it current.** A stale ontology is worse than none, because agents will trust it.
  Updating it is part of the work, not cleanup after it — which is the whole reason the
  currency check exists.
- **Machine-first.** Per [principle 1](principles.md), prefer explicit enumerated lists
  and typed fields over flowing prose. This is reference material for a parser.

## Suggested shape

One directory of your own, anywhere in the repo — `docs/model/`, `ontology/`, `domain/`:

```
<wherever you chose>/
  index.md          # links to everything here
  overview.md       # what this project is, in one paragraph
  actors.md         # who and what acts on the system
  <entity>.md       # one per entity
  lifecycles.md     # state machines, if not covered per-entity
  glossary.md       # domain terms, extending llmeep's core.md
```

None of it is mandatory. Take what you need and leave the rest.
