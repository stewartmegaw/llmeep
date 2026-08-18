---
id: PLT-dk4r
title: Skill descriptions were never updated as commands were added, so agenda routed to nm
created: 2026-08-18
---

# PLT-dk4r — Skill descriptions were never updated as commands were added, so agenda routed to nm

## Context

Frontmatter `description:` is **the only text an agent sees when choosing a skill.** The body —
usage block, phrase table, every rule — is read after the choice is made, so anything not in the
description cannot influence routing at all.

`tm` gained `standup`, `why`, `feedback`, `drop` and `agenda` and the description was never
touched. It still said *"Task tracking — create, start, complete and search tasks."* Meanwhile
`nm` advertised *"pastes a call transcript or **meeting notes**"*.

So "new agenda:" matched `nm`. Reported after the first real use of the feature: v37 shipped
`tm agenda`, and the words anyone would actually say to reach it pointed somewhere else.

**This is the same failure as `PLT-43nz`**, a day earlier, where `tm --help` still described the
old `park`. Both are metadata left behind by a change that updated the body. Both were invisible
to the tests, because every test calls commands directly and never routes anything.

## Fixed

`tm`'s description now names standups, agendas and decisions, with the phrases someone would use.
`nm`'s drops "meeting notes" for "notes from a conversation" and says outright that agendas are
`tm`'s.

`selftest` asserts the `tm` description contains the words a user says that **do not contain
"task"** — `agenda`, `standup`, `decided` — since those are the only ones where the description
is doing the whole job. Adding a command means adding its word to that list, which is the
checklist this was missing.

## Acceptance

- [x] `tm`'s description covers what `tm` does, in words a user would say
- [x] `nm` no longer claims meetings, and points at `tm` for agendas
- [x] A test fails if a routing word stops being in the description
