---
id: DEC-062
title: Labels are the adopter's vocabulary, and the tool only checks their shape
status: accepted
decided: 2026-10-06
deciders: [stewart]
supersedes: []
superseded_by: []
relates_to: [DEC-003, DEC-011, DEC-036, DEC-045]
---

# DEC-062 — Labels are the adopter's vocabulary, and the tool only checks their shape

## Status

`accepted` — as of 2026-10-06.

## Context

Every tag the records carried meant something to the tool: `@who`, `blocked:`, `filed:`,
`since:`, `commits:`, `detail`, and on notes `src:` and `task:`. There was no way for an adopter
to say *this one is about Ulster* — so they used the nearest thing that would hold a word.

An adopter's notes were tagged `src:ulster-call` and `src:ulster-meeting-prep`. `src:` records
where a note came from, which `nm add --from` sets automatically. Being free text, it became a
topic label by adoption, and the app renders it as a chip beside the note, which is what made it
look like one. Provenance was doing a job it was not meant for, and doing it only for notes:
tasks had nowhere to put the same word at all.

`tm`'s tag grammar made the gap worse than an absence. Tags are read off the end of a line by a
closed allowlist, so a word that is not in it is swallowed into the title. Writing `ulster` on a
board line did not fail — it silently became part of the task's name.

## Decision

Tasks and notes carry labels: `#word`, chosen by whoever is using the repo.

The tool validates the **shape** and nothing else — a `#`, then 25 characters of letters,
numbers, dot, dash or underscore. There is no registry to add a label to, no allowlist to pass
and no configuration naming the permitted set. The first use creates a label and the last
removal retires it.

`tm label` / `tm unlabel` and `nm label` / `nm unlabel` are the verbs. A bare `tm label` lists
every label in use with a count.

**Labels survive `done`.** They stay on the `recent` line and are written to `history.tsv` in a
column of their own, where `tm find` searches them.

**`src:` stays what it is.** Provenance is recorded by the tool from where a capture came;
a label is chosen by a person. They answer different questions and a record may want both.

## Alternatives considered

- **A registry — labels declared in `.env` or a config file, validated against it** — rejected
  because it puts the adopter's vocabulary under llmeep's governance, which is principle 7 the
  wrong way round. It also makes the common act (use a label) depend on a rare one (go and
  declare it), which is how a feature stops being used.
- **No sigil — a bare word as the tag** — rejected outright. `WORD_TAGS` has exactly one member
  and keeping that true is load-bearing: a tag that reads as ordinary English turns the last
  word of a title into a tag, which is `PLT-jrtf`, where a title ending in "detail" blocked
  every commit in a repository until the parser was fixed. A sigil cannot be mistaken for prose.
- **Reuse `src:` for both** — rejected, and this is the one the adopter had already tried.
  Provenance is written by the tool and is a fact about where something came from; a label is
  written by a person and is a claim about what it is for. Merging them means a capture's origin
  can be edited to change its topic, and a note from `ulster-call` can never be labelled
  anything else.
- **Drop labels at `done`, like `detail` and `blocked:`** — rejected because "what did we ship
  for Ulster" is a question about finished work, and a label that vanished on completion could
  not answer it. `detail` and `blocked:` are dropped because they stop being *true* — a finished
  task has no blocker. A label stays true.
- **Cap the number of labels per record** — not taken. The length cap keeps a line a line, and
  a count cap would be the tool having an opinion about how much vocabulary is too much, which
  is the thing this decision is specifically refusing to do.

## Consequences

- An adopter can group work across ledgers and sections by something llmeep knows nothing
  about, and filter the board, the notes and the app by it.
- `history.tsv` grows a sixth column. Readers already `zip` the header against the row, so
  rows written before this parse unchanged, and a row with no labels is still written with
  five fields.
- Typos make silent near-duplicates — `ulster` beside `ulsters` — and nothing detects them.
  A bare `tm label` listing what is in use with counts is the whole mitigation: it makes the
  existing vocabulary the easiest thing to reuse. This is the known cost of refusing a
  registry, accepted knowingly.
- One more tag in the grammar, on both subsystems, and `check` now has a shape to enforce.

## Revisit when

A repo accumulates enough near-duplicate labels that the listing stops being readable, or
somebody wants to rename a label everywhere it appears. A rename verb is the obvious next
thing and is deliberately not here — it rewrites history rows, which are append-only, and that
needs its own decision.
