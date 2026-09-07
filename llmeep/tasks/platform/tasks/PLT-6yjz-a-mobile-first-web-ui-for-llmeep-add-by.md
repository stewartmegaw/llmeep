---
id: PLT-6yjz
title: A mobile-first web UI for llmeep: add by prompt, edit and delete tasks, read details, drop notes
created: 2026-09-07
---

# PLT-6yjz — A mobile-first web UI for llmeep

## Outcome

A persistently available surface — "llmeep chrome" — serving every llmeep skill from a phone,
hosted on the user's own domain. Small, no frills, MUI + React, mobile first rather than
mobile responsive.

Today the only surfaces are a terminal agent and an outbound Telegram channel. Neither is
*there* when you want to glance at the board.

## Acceptance

- [ ] Reachable from a phone browser on the user's domain, without a terminal
- [ ] Tasks: add, edit, delete
- [ ] Adding goes through the agent API by prompt, not a form that writes records directly
- [ ] Details are readable, including folder details
- [ ] Notes and transcripts can be dropped in
- [ ] Every write goes through `tm` / `nm`, never straight at the files

## Context

### Scope as given

- **Mobile first**, persistently available, servicing **all** llmeep skills — not a task board
  with extras bolted on.
- **MUI React. Simple, small, no frills.** A stated constraint, not a default to improve on.
- **Lives on the user's domain.** Deployment target and ownership both.
- **Add tasks via prompt through an agent API.** The prompt is the input; the agent classifies
  and calls `tm add`. This is the shape that keeps `DEC-007` intact — see below.
- **Edit and delete tasks.** Neither has a verb today. `tm drop` is delete; there is no retitle
  at all, which this session hit twice.
- **View details.** Called *sidecars* in the request — renamed by `DEC-045` on 2026-08-30, and
  now the word for the tag, the file, the verb and the prose.
- **Drop notes and transcripts.** `nm` territory; `notes/raw` is where transcripts land.

### The decision this has to answer to

`DEC-006`, superseded by `DEC-007`, removed inbound Telegram. The reasoning: an agent with the
repo in context already does the job conversationally from a phone, so a command syntax was a
worse version of something already available. **Whoever picks this up must read both first.**

This is not obviously the same thing — a persistent visual surface is not a command syntax, and
routing adds *through the agent* keeps the conversational entry rather than replacing it. But
it is close enough that reopening it deliberately is cheaper than discovering the overlap
halfway through. A decision superseding or narrowing `DEC-007` is likely part of this work.

### Constraints the codebase already imposes

- **Every write goes through the executables** (`DEC-003`, principle 2). A UI that edits
  `board.md` directly re-implements the invariants and drifts. The UI is a client of `tm` and
  `nm`, whatever the transport.
- **Editing needs verbs that do not exist.** There is no retitle and no re-detail. Either the
  UI is read-mostly at first, or `tm` grows them — and if it grows them, they are `tm` verbs
  that the terminal gets too, not UI-only endpoints. `DEC-036` is the rule.
- **Records are files in a git repo.** Concurrent edits from a phone and a terminal are a real
  case. Worth deciding early whether the UI commits, and what happens to a dirty tree.
- **Reordering `prioritised` is a hand edit by design** — the one exemption in `DEC-036`. A
  drag-to-reorder list is the obvious mobile gesture and is exactly this. Probably the single
  most valuable thing the UI can offer that the terminal cannot.

### Open questions, not yet decided

- What "agent API" means concretely — a hosted agent, a local one behind a tunnel, or the
  Claude API called directly with the repo as context.
- Where the repo lives relative to the UI, and who holds write access.
- Auth. "On the user's domain" implies public reachability, and these are private records.
- Whether this is one task or the parent of several. It is filed as one until someone starts it
  and can see the seams.

## Log

- 2026-09-07 — Filed from a verbal scope. Nothing designed or chosen yet.
