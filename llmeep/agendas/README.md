# agendas — what meetings had to get through

**Committed.** Each file is one meeting: `<date>-<slug>.md`, the title on its first line, and
`Next Steps` last. A directory listing is the history.

The counterpart is [`.notes/agendas/`](../.notes/README.md), which is local to one machine and
gitignored. Same file shape, same verbs; the difference is who can read it next year.

| Made by                    | Lands in            |
| -------------------------- | ------------------- |
| the app                    | here                |
| `tm agenda "<title>"`      | `.notes/agendas/`   |
| `tm agenda <name> --publish` | here, from there  |

**The default follows the door you came in by** (`PLT-49p8`). A terminal is one person's machine
and a half-formed agenda there is thinking; the app is the team's surface. Nothing moves an
agenda back out of here, because git history is not easy to un-say and meeting agendas name
people.

A `✓` after the bullet or the section number means the meeting worked through that line.
`tm agenda <name> --send` strips them on the way out, so the room never receives a half-ticked
agenda (`DEC-058`).
