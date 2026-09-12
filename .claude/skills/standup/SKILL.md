---
name: standup
description: Report what shipped — the period's completed work, what is in progress, and both open sections with their counts — and post it to the team channel. Use when the user asks for a standup, what got done this week, what shipped, or wants to send the report ("standup", "what did we get done", "send the standup", "schedule the standup"). Not for building a meeting agenda; that is the agenda skill.
---

# standup

**ADAPTER ONLY.** `llmeep/tasks/_tooling/tm standup` produces the report; this is how to show
it, and `DEC-003` is why that lives here rather than in the executable. Split out of the `tm`
skill because a report is as occasional as a meeting and every task session was paying for it
(`PLT-2cyh`, `PLT-umh3`).

**Run `llmeep/tasks/_tooling/tm audience` first and write the way it says.**

**Never `--send` unless they asked to post it.** It reaches a whole team.

`llmeep/tasks/_tooling/tm standup` prints for a terminal and you are rendering for a phone. **Bold each heading, leave
everything else exactly as the tool wrote it** — same wording, same order, same counts. Do not
re-summarise: what you show and what Telegram receives are the same report.

    **2026-08-02 → 2026-08-03**

    **@stew**
    ✓ Fix flaky auth test

    **In progress**
    PLT  Migrate config loader — @sam

    **Priority (2)**
    PLT  Upgrade toolchain
    BUS  Renew the Acme contract

    **Backlog (11)**
    PLT  Replace the fixture loader
    …and 9 more

    **Captured, not yet work**
    · Acme want SSO before they will renew

- **`PLT` / `BUS` are the tool's.** Keep them and the two-space gap; never tag a line it did
  not tag. Captured notes keep their `·` and have no ledger.
- **The counts are the full sections.** Reproduce them and `…and N more` verbatim; never
  recount from what you can see.
- **Never re-sort**, and never read `Backlog` as priority.
- **Never a code block.** No hint line — a standup is a report, not a menu.

Why each of these: **Rendering a board** in `llmeep/tasks/_tooling/ontology.md`, which the
standup shares.

`tm standup --cron` prints the line to schedule it, and
`llmeep/tasks/_tooling/blueprints/standup.sh` is there if they want it unattended. Scheduling
is their call, never yours.

