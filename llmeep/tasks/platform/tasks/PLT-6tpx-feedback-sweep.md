---
id: PLT-6tpx
title: Sweep a defined set of repos for upstream feedback drafts
created: 2026-08-10
---

# PLT-6tpx — Sweep a defined set of repos for upstream feedback drafts

The collecting half of `PLT-43mh`, which is the drafting half. That task writes suggestions to a
known path inside an adopting repo; this one reads them back out of every such repo on the
machine, so a draft nobody remembers to look at still arrives.

## Outcome

From llmeep itself, one command reports every feedback draft written by every adopting repo it
has been told about, so the drafts become a list to triage rather than files rotting in repos
their owner has moved on from.

## Context

While every adopting repo is a directory on the one machine, collection is a filesystem walk
and needs no protocol. The set of repos is configuration — a list of paths, kept where the rest
of llmeep's configuration lives — because guessing by scanning the disk for the marker file is
both slower and a surprise.

The contract with `PLT-43mh` is the draft's **path and format**: a fixed location inside the
adopting repo, and a shape the sweeper can read without loading the repo's records. Neither task
can be finished without agreeing it, and it is the only thing they share. If it drifts, the
sweeper silently reports nothing — which looks identical to "no feedback", so the sweep should
distinguish *no drafts* from *path not found* rather than printing an empty list for both.

**Later this becomes GitHub issues**, once drafts are being filed there instead. That is a
second reader over the same triage output, not a second system: the sweep's job is to produce a
list of suggestions, and where it read them from is an implementation detail behind that. Worth
keeping the sweep's output shape free of anything filesystem-specific for exactly that reason.

**Triage is checking against the decisions.** The drafting reviewer carries llmeep's principles
— `adopt` installs them — but not its decisions, which stay in this repo. So it will re-propose
things already settled and rejected, in good faith, and the check for that has to happen here
where the DEC records are. `tm why <term>` is already exactly that lookup; a suggestion that
lands on an existing decision is not noise to discard but the signal that the decision was
never persuasive, or has stopped being true.

**Periodically is a scheduler's job, not the repo's** (`DEC-016`, `DEC-017`). The standup settled
this pattern already: the repo ships a command and a blueprint, and the person decides whether
cron runs it. Nothing here should fire on a commit or install a schedule uninvited — the same
reasoning applies unchanged, since a commit is not a clock and a sweep is even less urgent than
a standup.

## Acceptance

- [x] The set of repos to sweep is configuration, not discovery
- [x] One command prints every draft found, attributed to the repo it came from
- [x] A configured path that no longer exists is reported, not silently skipped
- [x] Nothing schedules itself; if periodic running is wanted it is a blueprint plus the user's
      own cron line, following the standup
- [x] The output shape does not assume the drafts came from a filesystem
- [x] A suggestion matching an existing decision is surfaced as such, not dropped

## Log

- 2026-08-10 — Built as `tm feedback --sweep [--send]`, reading `FEEDBACK_REPOS` from `.env`.
  `blueprints/sweep.sh` is the unattended shape, run by nothing here. Eight cases in
  `TestSweep`.
- 2026-08-10 — **Four states, not three.** The acceptance named *found*, *gone* and *quiet*;
  building it turned up a fourth — a path that is fine with no llmeep in it — which is a
  different thing to go and fix from a path that has vanished. All four are reported distinctly,
  and the sweep prints how many repos it read every time, so a short report cannot be misread as
  a quiet week.
- 2026-08-10 — **No `--cron` flag**, deliberately, and a deviation from how the standup reads.
  `standup --cron` earns its place by deriving the schedule from `STANDUP_PERIOD`, where getting
  it wrong by hand is easy. A sweep has no period to derive from, so the flag would print a
  constant and imply logic that is not there. The crontab line is in the blueprint's header
  instead.
- 2026-08-10 — **No second decision.** `DEC-033` already covers the transport and names this
  task as its other half; the choices made here — configuration over discovery, matching rather
  than filtering against decisions — are its implementation rather than a reversal of it. One
  thing was worth adding to it: `--sweep --send` does send, and that had to be squared with
  `DEC-033`'s "sent by nobody". It squares because the sending happens on the maintainer's
  machine over drafts already collected. Nothing on an adopting repo ever gains a transport.
