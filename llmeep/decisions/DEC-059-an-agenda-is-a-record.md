---
id: DEC-059
title: An agenda is a record, private on one machine or shared in the repo
status: accepted
decided: 2026-09-23
deciders: [stewart]
supersedes: []
superseded_by: []
relates_to: [DEC-008, DEC-051, DEC-058]
---

# DEC-059 — An agenda is a record, private on one machine or shared in the repo

## Status

`accepted` — as of 2026-09-23.

## Context

An agenda was built as a message on its way to Telegram. One fixed file, `.notes/agenda.md`,
posted by `--send` and then rolled aside under its date so the next one could start clean. It
lived in `.notes/`, whose contract says nothing may depend on it as a source of truth and that a
teammate cloning the repo gets none of it.

That was right for a draft on its way out the door, and it stopped being right. Meetings are now
worked through in the app, items are ticked off as a room gets to them (`DEC-058`), and what a
meeting got through is worth seeing next month. None of that survived: ticks landed on a
gitignored file, and the file had already been rolled away by the send.

The prompt was a question about commit timing — should the app commit ticks on a timer, or amend
the last commit? Both answers were wrong for the same reason. Amending rewrites a commit the app
may already have pushed (`DEC-053`). A timer invents a kind of commit this project does not
have: mechanical, with no task in progress and a message that says nothing. And underneath both
was the real question, which is not when to commit an agenda but whether an agenda is the sort
of thing that gets committed at all.

## Decision

An agenda is a file in a tree, and there are two trees. `llmeep/agendas/` is committed and
shared; `.notes/agendas/` is local to one machine. Same file shape, same verbs: `<date>-<slug>.md`,
the title on the first line, `Next Steps` last.

**The default follows the door you came in by.** `tm agenda "<title>"` in a terminal makes a
private one, because a terminal is one person's machine and a half-formed agenda there is
thinking. The app makes a shared one, because the app is the team's surface and what is made
there is already something the team can see. `--publish` moves a private agenda into the repo
and **nothing moves it back**.

Sending no longer ends an agenda's life, and the roll is gone with it. Several agendas are open
at once, because next Monday's board call and tomorrow's 1:1 are different meetings.

## Alternatives considered

- **Commit the agenda on a timer** — rejected. It needs a scheduler the app does not have, it
  commits a file that is mid-edit, and every such commit trips the check for changed files with
  no task in progress — a warning an adopter had already reported as noise. A commit reading
  "agenda updated 14:32" is not a record of anything.
- **Amend the last commit** — rejected. `DEC-053` pushes what it commits, so HEAD may be on the
  remote and amending means a force push over a teammate's fetch.
- **Leave agendas in `.notes/` and promote one by hand when it matters** — rejected as the
  situation being left: agendas nobody remembered to promote stay invisible, which is exactly
  the problem. The `.notes/` contract survives for the private half, which is genuinely one
  machine's thinking.
- **One tree, always shared** — rejected because a meeting agenda names people. "Discuss Sam's
  performance" reads differently in git history than in a file that dies with the laptop.
- **One tree, always private, with an export** — rejected as the same invisibility with an extra
  step, and an export is a copy that immediately disagrees with the file it came from.
- **Keep one draft and add a close-out step at the end of the meeting** — rejected once the file
  per agenda made it unnecessary. The roll existed only because there was one filename.

## Consequences

A shared agenda is visible to everyone with a clone, permanently, and that is accepted
knowingly. It is why the terminal default is private and why there is no verb that un-publishes:
a wrong `--publish` is a `git rm` and a force push, which is not something a flag should imply
it can undo.

`tm agenda` becomes smaller. `roll_agenda`, `agenda_rolled`, `AGENDA_ROLLED` and the "two sends
in a day" numbering all go, replaced by a directory listing. Every verb gains an optional name,
and with one agenda open they behave exactly as before.

Legacy `.notes/agenda.md` and `agenda-<date>.md` files are carried into the private tree on the
first run that touches an agenda, titled `Agenda <date>` rather than from their first line —
which is a section heading, not a name for the meeting.

The app can write `agendas/`, which widens `WRITABLE` from two trees to three.

## Revisit when

An agenda needs to be shared with people who do not have the repo. Publishing to a tree assumes
the audience is the team, and a board that reads agendas but not code would want something else
— which is a different decision from this one, not a change to it.
