---
name: standup
description: Report what shipped — the period's completed work, what is in progress, and both open sections with their counts — and post it to the team channel. Use when the user asks for a standup, what got done this week, what shipped, or wants to send the report ("standup", "what did we get done", "send the standup", "schedule the standup"). Not for building a meeting agenda; that is the agenda skill.
---

# standup

**ADAPTER ONLY — no logic here, and no format either.** `llmeep/tasks/_tooling/tm standup`
produces the report *and* renders it; this file is the trigger and the two judgements a tool
cannot make — who is being written to, and whether to send. Split out of the `tm` skill because a
report is as occasional as a meeting and every task session was paying for it (`PLT-2cyh`,
`PLT-umh3`); the format left for the executable in `PLT-jzhh`, where every agent gets it
(`DEC-003`, principle 3).

**Run `llmeep/tasks/_tooling/tm audience` first and write the way it says.**

**Never `--send` unless they asked to post it.** It reaches a whole team.

`llmeep/tasks/_tooling/tm standup --chat` renders it. **Print it exactly as it comes, and never
in a code block** — a code block scrolls sideways on a phone, which is where this is read. Do not
re-summarise, do not re-sort, and add no hint line: a standup is a report, not a menu. What you
show and what the channel receives are the same report. Anything the command says *about* the
report — `not sent`, `sent via telegram` — is on stderr and is not part of it.

The format is `render_markdown` in `tm` since `PLT-jzhh`, beside the Telegram and Slack renderers
it was a fourth copy of. Why each rule: **Rendering a board** in
`llmeep/tasks/_tooling/ontology.md`, which the standup shares.

`tm standup --cron` prints the line to schedule it, and
`llmeep/tasks/_tooling/blueprints/standup.sh` is there if they want it unattended. Scheduling
is their call, never yours.

