---
id: PLT-6yjz
title: A mobile-first web UI for llmeep: add by prompt, edit and delete tasks, read details, drop notes
created: 2026-09-07
---

# PLT-6yjz — A mobile-first web UI for llmeep

## Framing

**The repo is the centre of all knowledge, memory and planning. The UI is a means to help
non-techies interact with it.** Stated 2026-09-07, and it settles more than it looks like.

*The repo is the centre* means the UI is a client and never a store. Nothing exists because
the UI holds it; every screen is a view of a file, and every action is a `tm` or `nm` call that
lands as a commit. A feature that would only work while the UI is up is out of scope by
definition — not deferred, wrong.

*For non-techies* names the audience, and llmeep already knows what that means. `DEC-040` put
`USER_TYPE` in `.env`; `DEC-042` gave a non-coder's agent different latitude; `DEC-045` renamed
*sidecar* to *detail* on exactly this ground. The UI is where that work pays off or does not.

It also resolves a tension in [principle 1](../../../ontology/principles.md), which says on-disk
formats are machine-first and human readability is best-effort. That is affordable precisely
because a person is not meant to read `board.md`. The UI is what makes it true rather than an
excuse.

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
- [ ] The API commits its writes to the repo, and says what it did
- [ ] Nothing is reachable only through the UI — every screen has a file behind it
- [ ] A non-technical person completes add, edit and read without being told an id, a command
      or a file path

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
  now the word for the tag, the file, the verb and the prose. That rename was made for this
  audience; the UI is the first place it is tested against a real one.
- **Drop notes and transcripts.** `nm` territory; `notes/raw` is where transcripts land.
- **The API commits to the repo.** Settled 2026-09-07. It is not a read-through view over a
  working tree someone else commits — a write from a phone lands as a commit, like every other
  write in llmeep. Which resolves the *does the UI commit* question below and raises the dirty-
  tree one in its place.

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
- **Records are files in a git repo, and the API commits.** So concurrent edits from a phone
  and a terminal are not a hypothetical: a commit from the phone while a terminal session has
  an uncommitted board is a conflict in `board.md`, which the ontology has a resolution table
  for and no automation. What the API does when the tree is already dirty is undecided and has
  to be, before the first write.
- **Ids are not handles for people.** `PLT-6egb` exists because a bare id in prose is
  unreadable to a human, and the rule to attach a title snippet is almost never followed. A UI
  for non-techies cannot show an id where a title belongs, and probably should not show one at
  all outside a detail view.
- **Reordering `prioritised` is a hand edit by design** — the one exemption in `DEC-036`. A
  drag-to-reorder list is the obvious mobile gesture and is exactly this. Probably the single
  most valuable thing the UI can offer that the terminal cannot.

### Settled 2026-09-09

- **It ships to adopters**, via `adopt`. Not llmeep's own tool — part of the product.
- **A container serves both halves**, back end and front end. Where it runs is the adopter's
  choice: their own compute, their own cluster. llmeep ships the recipe and the instructions —
  including what the container needs in order to commit to their repo — not a hosting decision.
- **It sits behind a path.** A k8s service routing `/llmeep` to the container is the shape to
  build for, which means the front end has to work under a base path rather than at a domain
  root. Easy to get wrong in an SPA and expensive to retrofit.
- **The app carries no auth.** Public URL, or behind a domain that already handles it — the
  adopter's call, and the more likely one. See the risk below; this needs saying out loud in
  the install instructions rather than being left implied.
- **A prompt becomes a task through an LLM call from the back end**, which then calls `tm add`.
  Not an agent loop — one call that classifies and shapes a title, with the tool doing the
  writing.

### The vendor question is already answered, and not the way it looks

Shipping an LLM call inside an adopted product runs straight at
[principle 3](../../../ontology/principles.md) — *no assumption about LLM vendor*. It is not a
new problem: `tm review` already ships one, and `DEC-039` settled the terms.

Copy that shape exactly rather than inventing a second one:

- **Off unless configured.** `REVIEW=` is empty by default and the feature simply does not run.
- **The adopter's own key and their own budget**, in gitignored `.env`.
- **An endpoint, not a vendor.** `REVIEW_<NAME>_BASE` speaks the OpenAI chat shape, which
  reaches OpenAI, xAI, Groq, OpenRouter or a local server. llmeep's own reviewers are `openai`
  and `xai` — Anthropic is not privileged anywhere in the shipped tree, and this must not be
  the thing that changes that.
- **The model is required, never defaulted**, because a wrong default bills someone for a call
  that was never going to work.

So the answer to "which API" is *whichever the adopter configured*, and Claude is one of them.

### Where the code lives — an assumption, flag it if wrong

`adopt` installs `_tooling` trees and `.claude/`; it copies files into a repo. Copying a React
source tree into every adopting repo would be a poor fit — a build step, a `node_modules`, and
a second language in a project that may have no use for either.

**So: the image is published, and `adopt` ships the recipe.** The adopter gets a manifest, the
`.env` keys and the instructions; the source stays in llmeep's own repo. That keeps the
installed skeleton the same shape it is now.

Proceeding on that unless told otherwise, because it decides the file layout before anything
else can be written.

### Risks worth naming before any code

- **No auth on private records.** Task titles say a great deal about what someone is building,
  and the install instructions will carry a default that is only safe if the adopter acts. The
  honest thing is to say so where it cannot be skimmed past, and to make the container refuse
  to serve until the adopter has confirmed they have handled it.
- **The container commits to their repo**, so it needs a credential with write access to
  records. Scope, rotation and what happens when it expires all need answers.
- **Concurrent writes.** A commit from the phone while a terminal session holds an uncommitted
  board is a conflict in `board.md`. The ontology has a resolution table and no automation.

### Still open

- What the container does when the tree is already dirty, and whether it pushes.
- Whether this is one task or the parent of several. **Two seams are visible now**: scheduled
  connectors (`PLT-2gdj`) share the API and need no UI, and the container plus its install
  recipe is separable from the UI it serves.

## Log

- 2026-09-07 — Filed from a verbal scope. Nothing designed or chosen yet.
- 2026-09-07 — The API commits to the repo. Scheduled connectors split out as `PLT-2gdj`.
- 2026-09-07 — Framing added: the repo is the centre, the UI is how a non-techie reaches it.
- 2026-09-09 — Ships via `adopt`; container serves both halves, adopter hosts it, behind a path
  like `/llmeep`; no auth in the app; prompt→task is one LLM call on `DEC-039`'s terms.
