---
id: DEC-058
title: A tick is working state and never leaves the machine
status: accepted
decided: 2026-09-23
deciders: [stewart]
supersedes: []
superseded_by: []
relates_to: [DEC-008]
---

# DEC-058 — A tick is working state and never leaves the machine

## Status

`accepted` — as of 2026-09-23.

## Context

An agenda is worked through in a meeting, and an adopter wanted to check items off as the room
got to them — a checkbox per line in the app, a marker on the line in the file (`PLT-6fbp`).

That collided with when an agenda is sent. `--send` posts the draft to the team channel and then
rolls it aside under today's date, so the next `tm agenda` starts clean and a live draft has
never been sent. But the send happens *before* the meeting — it is how the room finds out what
is coming — and the ticking happens during it. So at the moment ticks matter, the thing being
ticked has already been posted, and anything that goes out afterwards is a different message.

## Decision

A tick is a `✓` on the line, after the bullet or the section number. It is working state for
whoever is running the meeting, and `--send` strips every one on the way out, so the message the
room receives is always the clean agenda no matter what has been ticked. The file keeps its
ticks; stripping happens to the outgoing copy only.

Nothing about ticks is state the tool tracks. A tick is added and removed by whoever is editing
the text, exactly as a line is dropped, which keeps `PLT-ehd6` intact: the tool stores an agenda
and posts it, and has never known what one says.

## Alternatives considered

- **Tick first, send afterwards as the record of what was covered** — rejected because it gives
  up sending the agenda in advance, which is the main thing sending is for. A room that first
  sees the agenda after the meeting has already had the meeting unprepared.
- **Leave the draft live through a send so it can be ticked, and close it out separately** —
  rejected as more machinery than the problem warrants: it ends "a live draft has never been
  sent", so the draft gains a sent-on date, and adds a verb to file it afterwards.
- **Strip the ticks from the file too, once sent** — not considered seriously; it destroys the
  one copy the person running the meeting is working from.

## Consequences

Ticking is safe at any point, which is the point: nobody has to think about whether an agenda
has gone out before checking something off. The cost is that the file and the sent message are
no longer byte-identical — the first divergence between them, where previously `--send` posted
the body exactly as written. That is why the stripping is one regular expression anchored to the
line's leading marker, and why it is tested by what reaches the channel rather than by what the
function returns.

Ticks are as impermanent as the agenda holding them: local, gitignored, gone with the machine.

## Revisit when

An agenda needs to be sent *after* a meeting as a record of what was covered. That is a
different message from the one this decision protects, and it would want the ticks in it — so
it is a second verb, not a change to this one.
