---
id: DEC-046
title: Attaching a detail is a verb, not something check infers
status: accepted
decided: 2026-08-30
deciders: [stewart]
supersedes: []
superseded_by: []
relates_to: [DEC-011, DEC-036, DEC-045]
---

# DEC-046 — Attaching a detail is a verb, not something check infers

## Status

`accepted` — as of 2026-08-30.

## Context

A detail is paired with a `detail` tag on the board line, and `check` enforced the pairing in
both directions: a tag with no file is an error, and a file with no tag is an error. Nothing
wrote either. `add` only ever writes `filed:`, so attaching a detail meant creating the file by
hand and then hand-editing `board.md` — the one thing the guidance says never to do
(`DEC-036`), performed in the window between two errors where the records are invalid whichever
half you write first.

`DEC-036` had already drawn the rule this breaks: every move on the board has a verb, so
reaching for the file means the verb is missing, not that the file is the interface. Attaching
a detail was simply the transition nobody had noticed had no verb. An adopter reported it from
a real repo on 2026-08-24.

## Decision

`tm detail [id] [--folder]` writes the detail from `_template.md`, fills its frontmatter, and
tags the board line — both halves, in one command. It defaults to whatever is in progress, the
same reading `park` and `done` take. It is **idempotent**: run on a task that already has one it
prints the path and changes nothing, and run on a file whose line lost its tag it repairs the
tag. A completed task and an unknown id are each refused by name, pointing at `go` and `find`.

The verb is named after the tag it writes, which `DEC-045` is what made possible: the tag, the
file, the command and the prose are now one word.

Separately, **an empty `- [ ]` is not an acceptance criterion.** `_template.md` ships one to
show the shape, so every detail written from it — by hand before this, by the verb after —
armed a gate that says nothing and can never be met. `done` refused with `[ ]` and no text
beside it, and the only way past was `--force`, which skips the criteria that *were* written.

## Alternatives considered

- **Have `check` infer the tag from the file existing** — the other half of the adopter's own
  suggestion, and rejected. The tag is what makes a detail's absence *visible on the board* and
  free to check; inferring it means reading the directory to render a line, and the board stops
  being the whole truth about a task. It also fixes only one direction: a tag written by hand
  with no file would still be an error with no verb to satisfy it.
- **Drop the `detail` tag entirely and let the file be the record** — rejected for the same
  reason at greater cost. The board is the artifact people read, and a task whose detail you
  can only discover by listing a directory is one nobody opens.
- **Fold it into `add`, so filing a task always writes a detail** — rejected. Most tasks never
  earn one, and a directory of empty templates makes the `detail` tag meaningless. Its absence
  is information.
- **`tm add --detail`** — rejected: it only covers the moment of filing. The common case is a
  task that turns out to need more than its title once someone starts it, which is a second
  moment and wants its own word.
- **Leave the empty box counting, and have the verb write no Acceptance section** — rejected.
  It fixes the verb and leaves the trap for anyone copying `_template.md`, which is still the
  documented way to write one by hand. The template is not the bug; counting a blank form as a
  standard is.

## Consequences

The board and the files can no longer disagree through ordinary use, and `check`'s two errors
become what they were meant to be — a guard against corruption rather than a description of the
supported workflow.

`tm --help` and the skill grow a line each, and the tm skill is now ~4,463 tokens against a
budget `PLT-rsn4` set at 4,000. That budget was already exceeded before this; the verb makes it
worse by about 85 tokens and does not cause it.

A task can now carry a detail without anyone having decided the work needs one, since the verb
is cheap to run. That is the intended trade: cheap enough to say casually is what makes it get
used instead of the hand edit.

## Revisit when

Details start being written for most tasks rather than the few that need them, which would mean
the tag has stopped carrying information and the check that enforces it is measuring nothing.
