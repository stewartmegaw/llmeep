---
id: PLT-2gdj
title: Periodically check connectors — Gmail, Google Docs — and turn what they find into captures
created: 2026-09-07
---

# PLT-2gdj — Periodically check connectors

## Framing

**The repo is the centre of all knowledge, memory and planning** (stated 2026-09-07, with
`PLT-6yjz`). A connector is a *feeder* to that centre and never a second store: what it finds
becomes a capture in the repo, or it did not happen. There is no connector inbox to check, no
sync state a person has to reason about, and nothing that is true in Gmail but not on disk.

This is what makes the inbound question below answerable at all. Reading a mailbox on a
schedule is not adding a second way to drive llmeep — it is widening what reaches the one
place everything already lives.

## Outcome

llmeep notices things without being told. Gmail, Google Docs and whatever comes after are
polled on a schedule, and what they turn up lands as captures in `notes/raw` for `nm` to
process — rather than waiting for someone to remember to paste it in.

Split out of `PLT-6yjz` (the mobile-first UI), which shares its API. This half needs no UI and
can ship alone.

## Acceptance

- [ ] At least one connector — Gmail — polls on a schedule with nobody watching
- [ ] What it finds lands as a capture through `nm`, never written straight to `notes/raw`
- [ ] A run that finds nothing is silent, and a run that fails says so somewhere a person looks
- [ ] Credentials are not in the repo
- [ ] Adding the second connector does not mean rewriting the first
- [ ] Nothing is left holding state outside the repo except the poll watermark and credentials

## Context

### The decision this reverses, and it must be reversed deliberately

**This is inbound, and llmeep deleted its only inbound path on purpose.** `DEC-006`, superseded
by `DEC-007`, removed inbound Telegram — `/add` messages becoming tasks — and the reasoning was
that an agent with the repo in context already did it better from the same phone. `DEC-007`
went further and made the bot's inbox unread, deleting `drain_and_reply()`, `telegram_get()`
and the offset file.

**The argument does not transfer, and that is the point worth writing down.** Inbound Telegram
was a worse copy of something a person could already do. A connector is not: nobody is going to
notice a document changed at 3am, and the agent cannot see a mailbox it was never shown. This
is new capability rather than a second path to an old one — but "we removed inbound and now we
are adding it back" is exactly what a reader in six months will see, so the decision has to say
why these are different.

### Constraints already in place

- **Nothing in llmeep polls anything.** The precedent for unattended work is `tm standup
  --cron` plus `_tooling/blueprints/standup.sh`, and even that is opt-in, prints the crontab
  line rather than installing it, and is a person's call to schedule. A connector poller is the
  first thing that would run without being asked.
- **Captures belong to `nm`.** `notes/raw` is the landing area and `nm` owns the lifecycle —
  capture, distil, promote, prune. A connector is a producer of captures, not a second notes
  system. Principle 2 puts the writes behind the executable.
- **Nothing sends or fetches on its own initiative** — the standing rule for `standup --send`
  and `check --notify --send`. Reading a mailbox on a timer is the same class of act pointed
  the other way, and deserves the same explicitness.
- **`.env` is gitignored and per-checkout**, which is where the notify token lives. OAuth
  credentials and refresh tokens have the same shape and the same constraint: never committed.

### Open questions, not yet decided

- **What is worth capturing.** A mailbox produces far more than it should. Everything, a
  label, a sender list, a search — undecided, and the single biggest determinant of whether
  this is useful or noise. A connector that fills `notes/raw` with junk makes `nm` worse.
- **Where it runs.** Cron on an always-on machine, the same host as `PLT-6yjz`'s API, or a
  hosted schedule. It has to be somewhere awake.
- **De-duplication.** A poll that re-captures the same thread every run is the obvious failure.
  Needs a watermark, and somewhere to keep it that is not a record.
- **OAuth and consent**, per connector, per user, refreshed without a person present.
- **Whether the connector list is configuration or code** — the second connector decides this,
  so build the first one knowing there is a second.

## Log

- 2026-09-07 — Filed, split out of `PLT-6yjz` (the mobile-first UI). Nothing designed yet.
- 2026-09-07 — Framing added: a connector feeds the repo, it is not a second store.
