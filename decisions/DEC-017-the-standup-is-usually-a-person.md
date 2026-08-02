---
id: DEC-017
title: The standup is usually a person, and automating it is a blueprint
status: accepted
decided: 2026-08-01
deciders: [stew]
supersedes: [DEC-016]
superseded_by: []
relates_to: [DEC-003, DEC-006, DEC-015]
---

# DEC-017 — The standup is usually a person, and automating it is a blueprint

## Context

`DEC-015` triggered the standup from a commit hook. `DEC-016` replaced that with cron and a
`--install` that wrote to the local crontab. Both were answering the same unexamined question:
*what should fire this automatically?*

**The likeliest standup has nobody automating anything.** Whoever runs the weekly call opens a
terminal, types `tm standup`, and reads it out — and posts it afterwards if the team wants it in
writing. No scheduler, no always-on host, no credentials. That case already worked and was
being treated as the fallback.

Where automation does make sense, `DEC-016` got the machine wrong. `--install` wrote to the
crontab of the laptop you happen to be sitting at, which is precisely the machine that is asleep
at 09:00 on a Monday. And a bare cron line calling `tm` had a worse fault: **a scheduled checkout
is stale by definition.** It reports whatever was last pulled. Nothing in `DEC-016` fetched.

## Decision

**A person runs the standup. Unattended reporting is an optional blueprint they own.**

`taskman/blueprints/standup.sh` is committed, executable, and run by nothing in this repo. It
fetches, then reports:

```sh
git -C "$REPO" pull --ff-only --quiet origin "$BRANCH"
exec "$REPO/taskman/tm" standup --send
```

**It is a script, not a cron line, because of the fetch.** Where that fetch gets its credentials
is a decision only the operator can make — deploy key, read-only token, an existing agent — and
that decision cannot live in a skeleton. Read-only is sufficient; it never pushes.

**Configuration is by environment, not by editing it.** `REPO` and `BRANCH` come from the cron
line. Editing the file in place would dirty the checkout and make the next `pull --ff-only`
fail — the checkout you least want to be fighting with at 09:00 on a Monday.

**`--ff-only`, never `reset --hard`.** If that checkout has somehow diverged, stop and log it.
Discarding someone's work to deliver a status report is a bad trade.

**`--install` is removed.** `tm standup --cron` still prints the line, because deriving the
schedule from `STANDUP_PERIOD` is real logic and matching them by hand is an easy mistake. But
writing it somewhere is the operator's act, on a machine `tm` is probably not running on.

## Alternatives considered

- **Keep `--install` as well.** Rejected: with both, the obvious move is to install on the
  machine you are typing on, which is the wrong one. Removing it makes the right path the only
  path.
- **Have the blueprint clone rather than pull.** Self-contained and immune to a dirty checkout,
  but it re-solves credentials and disposes of `.env` on every run. A long-lived checkout with a
  `.env` beside it is what an operator would build anyway.
- **Ship a CI workflow instead.** Still rejected on `DEC-016`'s grounds — a workflow file names
  a vendor in the committed core, against [principle 3](../ontology/principles.md#3-agnostic-core).
  The blueprint runs inside CI unchanged if that is what someone has.

## Consequences

- **The primary path needs no setup at all.** `tm standup` works in a fresh clone. Everything
  scheduling-related is opt-in and lives in one readable file.
- **`DEC-016`'s core survives.** The schedule still owns the trigger, and there is still no
  marker file — cron fires once per period by construction.
- **Nothing in the skeleton is scheduled by default**, which is the honest default: a clone
  should not acquire a cron entry.
- **A blueprint can rot.** It is committed but never executed, so nothing catches it breaking.
  Accepted knowingly; it is short, and it is documentation as much as code.

## Revisit when

- Anyone actually runs it unattended and hits something the blueprint does not cover — a
  credential shape, a monorepo path, a container. That feedback is worth more than guessing now.
