# Domain ontology — your project goes here

This directory is empty in the skeleton. It is where you describe **your** project: its
entities, its actors, its lifecycles, its units of value.

The [core ontology](../core.md) describes the skeleton's machinery — tasks, notes, ledgers.
It says nothing about what you are actually building. That is this directory's job.

## How to start

Work in this order. It usually takes one sitting.

1. **Name the thing.** One paragraph in `overview.md`: what the platform does, for whom,
   and what would be lost if it did not exist. Written for someone with no context.
2. **List the nouns.** Whatever your project talks about all day — `Customer`, `Order`,
   `Shipment`, `Dataset`, `Route`. Aim for 5–15. If you have 40, you are listing database
   tables, not modelling a domain.
3. **Give each noun a file.** Copy [`_template.md`](_template.md) to `<noun>.md` and fill it
   in. One entity per file, `kebab-case.md`.
4. **Draw the relationships.** In each file, say what it relates to and how. Contradictions
   between two files are the useful output of this step — resolve them.
5. **Name the actors.** Who or what acts on the system: user roles, external systems,
   scheduled processes.
6. **Write the lifecycles.** For every entity with states, enumerate the states and the
   legal transitions between them. Ambiguous state machines are where bugs and
   misunderstandings live.

Then add an `index.md` here linking your files, and link to it from the root `README.md`.

## Rules

- **Extend, do not modify.** Do not edit `../core.md`, `../principles.md` or
  `../glossary.md` to fit your project. If a concept feels like it belongs in core, it
  almost certainly belongs here instead. The exception is a real defect in the core model —
  fix that and upstream it.
- **Reuse core terms verbatim.** If your domain has a concept of "task", either it *is* the
  core Task or it needs a different name. Two meanings for one word is the failure mode this
  whole directory exists to prevent.
- **Describe what is, not what should be.** The ontology is a map. When it disagrees with
  reality, say which one is wrong and fix that one.
- **Keep it current.** A stale ontology is worse than none, because agents will trust it.
  Updating this directory is part of the work, not cleanup after it.
- **Machine-first.** Per [principle 1](../principles.md), prefer explicit enumerated lists
  and typed fields over flowing prose. This is reference material for a parser.

## Suggested shape

```
ontology/domain/
  index.md          # links to everything here
  overview.md       # what this project is, in one paragraph
  actors.md         # who and what acts on the system
  <entity>.md       # one per entity
  lifecycles.md     # state machines, if not covered per-entity
  glossary.md       # domain terms, extending ../glossary.md
```

Nothing here is mandatory. Delete what you do not need.
