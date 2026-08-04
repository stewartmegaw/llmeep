---
id: DEC-012
title: Notes is a pipeline that feeds the board; transcripts are distilled, not stored
status: accepted
decided: 2026-08-01
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-002, DEC-003, PLT-c6ab]
---

# DEC-012 — Notes is a pipeline that feeds the board; transcripts are distilled, not stored

## Context

`notes/` was the last of the five top-level folders running on conventions alone: three static
subfolders (`decisions/`, `meetings/`, `reference/`) with no lifecycle and no tooling. Nothing
connected it to the board, so material that should have become work sat in a folder instead.

The shape it wanted was a **pipeline**, not a filing cabinet — capture, distil, promote, prune —
with the board as its output.

The commonest real use turned out to be specific: after a call, paste the exported transcript
into the agent and get notes in one pass. That single case decided several things at once.

## Decision

**`notes/` is the intake funnel for tasks.**

```
capture              distil               promote            prune
notes/raw/*.md  ──▶  notes.md        ──▶  taskman board  ──▶  git
```

**A separate `notes/nm` executable**, not an extension of `tm`. Both subsystems stay liftable —
`tasks/_tooling/ontology.md` claims you can take that folder to another project, and folding notes into
`tm` would make it false. `nm promote` shells out to `tm add --id`, which was added for exactly
this: a machine-readable id back, rather than parsing prose.

**`nm` is mechanical; the agent judges. There is no `process` command.** Reading a transcript and
deciding what matters is judgement, which [principle 7](../../ontology/principles.md) puts in the
agent. Processing is: the agent reads a capture, calls `nm add` for what survives, then
`nm drop`. `nm` never parses a transcript.

**Transcripts are never written to disk.** An exported call is large and mostly noise, and
`raw/` is committed — saving one would put "hello how are you" into git *permanently*. Pruning
clears the working tree, not history, and every clone carries it forever. The note is the
artifact; the transcript is scaffolding.

**`raw/` is a general capture inbox**, not a transcript folder — a written summary, a shared
document, an idea captured mid-flow. **Presence means pending**: there is no processed marker,
because processing deletes the file and git keeps it.

**Archive and history split exactly as taskman's does** ([`DEC-002`](DEC-002-task-history-index.md)):
`notes.md` is the window (200 notes, read whole, must stay bounded); `history.tsv` holds every
note ever, is only grepped, and grows forever.

**A promoted note is not deleted.** It records that a task came from a particular conversation on
a particular day — the part worth keeping, and the part git cannot reconstruct.

**`nm prune` is dry unless `--yes`**, matching `tm reset` and `tm check --notify`.

## Alternatives considered

- **Extend `tm` with note subcommands.** One executable, one parser, and `promote` becomes
  trivial. Rejected: it breaks taskman's liftability, which its own ontology promises.
- **No executable at all — conventions plus the agent.** Genuinely viable, since distilling is
  judgement and promoting is nearly `tm add`. Rejected because id allocation, the archive/history
  split, linking and pruning are all mechanical, and an agent doing them by hand is the
  hand-editing [principle 2](../../ontology/principles.md) exists to prevent.
- **Store the transcript in `raw/` and mark it processed.** The original sketch. Rejected once
  the size and signal-to-noise of a real exported transcript were considered: a processed marker
  is state to keep true, and committing the file is a permanent decision made casually.
- **One file per note**, like decisions. Rejected: the archive stops being one cheap read, and
  most notes are one line.
- **Keep `meetings/` and `reference/`.** Rejected as the same thing twice — meeting content
  arrives as captures, and "useful context that is not a task" is precisely a note that never
  gets promoted.

## Consequences

- **`notes/meetings/`, `notes/reference/` and `.notes/inbox.md` are gone.** The first two are
  absorbed; the third existed to catch things noticed mid-flow, which `raw/` does better —
  committed rather than local, with a lifecycle rather than a file that fills up.
- **`history.tsv` is rewritten in one case**: promoting adds the task id to an existing row. A
  link discovered later is new information about that row, not a second row — but it is a
  documented exception to append-only, and the only one.
- **`nm check` joins the pre-commit hook.** Notes now block a commit the same way records do.
- **Two executables, two parsers, two history files.** The cost of keeping both subsystems
  liftable. They share shape but no code, so a fix to one does not reach the other.
- **A note capped at 200 characters** will occasionally be too small. The intent is that
  anything larger is a task or a decision, but the boundary will be argued.

## Revisit when

- The 200-note window proves wrong in either direction — a busy month could fill it in weeks.
- `find` needs to span subsystems: today "have we thought about this before?" requires both
  `tm find` and `nm find`, and neither searches decisions.
- The duplication between `tm` and `nm` becomes a maintenance burden rather than a boundary.
