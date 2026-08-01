---
id: DEC-016
title: A scheduler triggers the standup, not the repo
status: accepted
decided: 2026-08-01
deciders: [stew]
supersedes: [DEC-015]
superseded_by: []
relates_to: [DEC-006, DEC-008, DEC-009]
---

# DEC-016 — A scheduler triggers the standup, not the repo

## Context

`DEC-015` put the standup behind a `post-commit` nudge. That was wrong, and it was wrong for a
reason worth writing down rather than quietly fixing.

**A commit is not a clock.** Commits cluster and then stop for a day; they fire on whichever
machine happened to be committing; and they say nothing about whether a period has elapsed. The
nudge also printed into commit output — which nobody reads, least of all on a phone, and which
lands in the agent's tool output rather than in front of a person when the agent is doing the
committing. The one push artifact in the system was pushing to the emptiest room available.

Underneath that was a design error: `DEC-015` accepted a trigger that could not send, then built
a local marker to make the trigger tolerable. The marker only existed to compensate for the
trigger being wrong.

## Decision

**Nothing inside the repo triggers the standup. A scheduler does.**

```sh
tm standup --cron             # prints the crontab line for STANDUP_PERIOD
tm standup --cron --install   # writes it, replacing any previous one
```

The period stays configuration (`STANDUP_PERIOD`), joined by `STANDUP_AT` for the time of day,
and the generated schedule follows both:

| Period | Cron | Window reported |
| --- | --- | --- |
| `daily` | `0 9 * * *` | 1 day |
| `workday` | `0 9 * * 1-5` | 1 day, 3 on a Monday |
| `bidaily` | `0 9 */2 * *` | 2 days |
| `weekly` | `0 9 * * 1` | 7 days |

**The schedule is the memory.** `DEC-015`'s marker file is deleted outright — asking "has this
period been reported?" was only ever necessary because commits fire at arbitrary times. Cron
fires once per period by construction, so there is no state to keep, nothing in `.notes/` and
nothing that could disagree between machines.

**The line is written to be portable, not clever.** Absolute paths throughout, because cron runs
with a minimal `PATH` and an unrelated working directory; and everything else it needs — the
channel, the token — `tm` reads from `.env` itself, so no environment has to be reproduced.
Verified by running it under `env -i PATH=/usr/bin:/bin` from `/tmp`.

**`--install` is idempotent** via a `# tm-standup` tag comment, so changing the period replaces
the entry rather than scheduling a second standup.

## Alternatives considered

- **Keep the nudge as well as cron.** Rejected: two triggers for one report, one of which is
  known not to reach anyone. The nudge's only remaining job would be reminding you to configure
  the other trigger, which `README.md` does better and once.
- **Ship a CI workflow file.** The realistic always-on host for a team, and genuinely less setup
  than cron. Rejected from the skeleton because a workflow file names a vendor, which is
  [principle 3](../../ontology/principles.md#3-agnostic-core) failing in the committed core. A
  crontab line is POSIX and works anywhere, including inside CI if that is what someone has.
- **`--install` writes the crontab without showing it.** Rejected on the pattern already set by
  `tm reset`, `nm prune` and `check --notify`: anything that changes something outside this repo
  shows its work first and acts on an explicit flag.

## Consequences

- **`DEC-015` is superseded in its mechanism, not its principle.** "Only an explicit act sends"
  survives intact — `--send` is still the only thing that posts, and cron is a person deciding
  once rather than a hook deciding repeatedly.
- **`check --nudge` is smaller.** The standup check is gone from the commit path entirely; hooks
  are back to validating records, which is all they were ever good at.
- **Scheduling is now the cloner's one manual step**, and it is one command. That is the correct
  amount of friction for something that broadcasts to a team.
- **A sleeping laptop reports nothing.** Cron does not catch up. Said plainly in `--install`
  output rather than engineered around.

## Revisit when

- Someone wants catch-up semantics — a missed Monday reported on Tuesday. That needs the
  last-sent marker this decision just deleted, and should be weighed against how much anyone
  actually minds.
