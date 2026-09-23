---
id: PLT-xkrc
title: The app never shows a private agenda
created: 2026-09-23
---

# PLT-xkrc — The app never shows a private agenda

## Outcome

`PLT-49p8` gave agendas two trees and then had the app read both. That is a hole, not a
cosmetic problem: the app has no authentication of its own and refuses to serve until
`LLMEEP_AUTH_HANDLED` says it is behind an ingress, an IAP or a VPN — in other words it is
built to be reached by the team. `.notes/agendas/` promises the opposite, that a teammate
cloning the repo gets none of it. Serving one through the app hands it to exactly the people it
was kept from, and the private tree stops meaning anything.

## Acceptance

- [x] `tm agenda --json --shared` lists only the repo tree
- [x] `--shared` is a wall on every verb, so `--set` and `--send` cannot reach `.notes/` by name
- [x] the server passes `--shared` on every agenda call
- [x] the `publish` tool is gone from the app's table
- [x] no private marker, no "Share it", no `(private)` in the board menu — there is nothing to
      mark, because the app cannot see one
- [x] a name matching a private agenda reports "no agenda yet", not "there is one you may not
      see"

## Context

**Hiding it from the listing would not have been enough.** A name is guessable — it is the date
and a slug of the title — so a filter on the read with the write left open is not a boundary.
Hence `shared_only` living in `find_agenda`, where every verb goes through it.

**The error message is part of the fix.** Saying "that agenda is private" confirms it exists,
who it is about and roughly when it was written, to someone who was not supposed to know there
was one. "No agenda yet" is what the app can honestly see.

**Cost, accepted:** an agenda written by an agent at a terminal is private by default, so
working through it on a phone means `tm agenda <name> --publish` first. One command, run by the
person who wrote it, which is the right person to be deciding.

**The obvious next ask is a single-user escape hatch** — a setting saying "this app is only ever
me, show my private agendas too". Not built. The app cannot tell whether it is exposed, the safe
default is the one that cannot leak, and a setting that turns a boundary off is worth having
only once somebody actually wants it.

## Log

- 2026-09-23 — Filed after the UI showed a private agenda in the board menu and that turned out
  to be a privacy hole rather than a UI question.
