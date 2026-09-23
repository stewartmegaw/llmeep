---
id: PLT-49p8
title: "An agenda is a record: private on this machine, shared in the repo"
created: 2026-09-23
---

# PLT-49p8 — An agenda is a record: private on this machine, shared in the repo

## Outcome

An agenda stops being a thing you send and start being a thing you keep. It was built as a
message on its way to Telegram — one fixed file, `.notes/agenda.md`, rolled aside on send and
never read again — and it has outgrown that. Meetings are worked through in the app, items are
ticked off, and what the room got through is worth seeing next month.

So an agenda is a file in a tree, and there are two trees:

| Tree                  | Committed | Made by                          |
| --------------------- | --------- | -------------------------------- |
| `llmeep/agendas/`     | yes       | the app, by default              |
| `.notes/agendas/`     | no        | `tm agenda`, by default          |

**The default follows the door you came in by.** A terminal is one person's machine and a
half-formed agenda there is thinking; the app is the team's surface and an agenda made in it is
already something the team can see. Either can be made the other way on request, and
`tm agenda --publish <name>` moves a private one into the repo. Nothing moves the other way:
git history is not easy to un-say.

## Acceptance

- [x] an agenda is `<date>-<slug-of-title>.md` in one of the two trees
- [x] `tm agenda "<title>"` writes a private one; the app's create writes a shared one
- [x] several agendas are open at once, because next Monday's board call and tomorrow's 1:1 are
      different files
- [x] `--publish <name>` moves private to shared; there is no verb the other way
- [x] `--json` lists every open agenda from both trees, saying which is which
- [x] `--set`, `--send` and the app's edits all name the agenda they act on
- [x] the roll is gone: no `agenda-<date>.md`, no `AGENDA_ROLLED`, no "starts clean"
- [x] a legacy `.notes/agenda.md` or `agenda-<date>.md` is moved into `.notes/agendas/` on the
      first run that touches an agenda, so no adopter loses one
- [x] `llmeep/agendas/` joins `READ_TREES`; `.notes/agendas/` needs the narrow read path
- [x] ticks survive, and are still stripped by `--send` (`DEC-058`)

## Context

**This supersedes the `.notes/` placement, so it earns a decision.** `.notes/README.md` says
nothing may depend on that tree as a source of truth and that a teammate cloning the repo gets
none of it. That was right for a draft on its way out the door and wrong for the record of what
a meeting got through. What survives is the principle underneath (principle 4): `.notes/` is one
machine's thinking, and that is exactly what a private agenda still is.

**The roll existed only because there was one filename.** `roll_agenda` renamed the draft to
`agenda-<date>.md` so the next `tm agenda` could start clean, and `-2`, `-3` handled two sends in
a day. With a file per agenda, all of that is a directory listing. Sending stops ending an
agenda's life, which also dissolves the knot in `DEC-058`: ticking happens after the send, and
there is now something left to tick.

**The cost, accepted knowingly:** a shared agenda is visible to everyone with a clone, forever.
Meeting agendas name people. That is why the terminal default is private and why there is no
verb that un-publishes.

Sits under `PLT-hrpu`, which asks whether the agenda should exist at all. `PLT-uqet` shrinks to
the app's half once this lands: listing past agendas becomes listing a directory.

## Log

- 2026-09-23 — Filed after working through the shape in conversation. The prompt was wanting
  ticked state visible later, which turned out to be a question about what an agenda is rather
  than about when to commit one.
- 2026-09-23 — Built. Two bugs the tests caught, both the same shape: **an argument that is not
  a flag is a name**, so anything unrecognised fell through to "make a new agenda called that".
  `tm agenda monday --publish` created one called *monday* because `--publish` took the next word
  as its value, and `--unpublish` — a verb deliberately absent — created one too. Unknown flags
  are now refused rather than ignored, and a bare `-` is `--set`'s stdin marker rather than a
  name.
- 2026-09-23 — **`check` says nothing about agendas, deliberately.** Every other record tree is
  cross-referenced — a `blocked:` tag resolves, a note points at a task that exists — and an
  agenda points at nothing that has to hold. There is no consistency to check, so a checker here
  would only invent rules for a file whose whole premise is that the tool does not parse it.
