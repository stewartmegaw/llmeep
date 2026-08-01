---
id: PLT-c6ab
title: Co-locate the notes ontology and decide if notes needs tooling
created: 2026-07-31
---

# PLT-c6ab — Co-locate the notes ontology and decide if notes needs tooling

## Outcome

`notes/` is a self-contained subsystem on the same terms as `taskman/`: its vocabulary lives
beside it, and it has a lifecycle — capture, process, promote, prune — rather than three static
folders.

## Acceptance

- [ ] `notes/ontology.md` exists; Note, Raw and Archive move out of `ontology/core.md`, which
      keeps one-line pointers for anything referenced from outside.
- [ ] `notes/nm` implements the mechanical operations; judgement stays with the agent.
- [ ] `notes/raw/` is a committed capture inbox; presence means pending.
- [ ] `notes/notes.md` is the archive, one accumulating file.
- [ ] Promoting a note creates a task and records the link both ways.
- [ ] Pruning bounds both `raw/` and the archive, with git as the recovery path.
- [ ] `notes/meetings/`, `notes/reference/` and `.notes/inbox.md` are resolved — absorbed or
      deliberately kept.

## Context

`notes/` was the last of the five top-level folders still running on conventions alone. It held
three static folders (`decisions/`, `meetings/`, `reference/`) with no lifecycle. What it wants
to be is a **pipeline** — the intake funnel that feeds the board.

```
capture              process              promote            prune
notes/raw/*.md  ──▶  notes/notes.md  ──▶  taskman board  ──▶  git
   (inbox)            (archive)                                (archive)
                          └──▶ or stays as context, never promoted
```

## Approach

### Decided

| Question | Answer | Why |
|---|---|---|
| Executable? | **`notes/nm`**, separate from `tm` | Keeps both subsystems liftable. `nm promote` shells out to `taskman/tm add`. |
| Archive shape | **One accumulating file**, `notes/notes.md` | Cheap to read whole, greppable, matches the board and `history.tsv`. Notes are short. |
| Raw state | **Presence means pending** | Processing deletes the file; git keeps it. No marker, no rename, nothing to disagree with. |
| Raw location | **Committed**, `notes/raw/` | Teammates can process; git is the archive after pruning. Accepts that transcripts enter history permanently. |

**`raw/` is a capture inbox, not a transcript folder.** Anything unprocessed goes there — a
meeting summary, a half-formed idea, something noticed mid-flow. Capturing and processing can be
seconds apart; the point is that the thought leaves your head immediately and gets distilled
separately.

### The split: `nm` is mechanical, the agent judges

Reading a transcript and deciding what matters is judgement, which
[principle 7](../../../ontology/principles.md) puts in the agent. `nm` does only what is exact:

| `nm` does | The agent does |
|---|---|
| Append an entry with an ID and date | Read a raw file and decide what is worth keeping |
| Mark a note promoted, with the task id | Decide a note is task-shaped rather than context |
| Delete a processed raw file | Write the task title |
| Prune past the bound | — |

So *processing* is not an `nm` command. It is: the agent reads `raw/x.md`, calls `nm add` once
per extracted note, then `nm drop x.md`. `nm` never parses a transcript.

### Proposed archive format

Line-based, like a board — which makes promote and prune mechanical rather than textual:

```
# notes

## 2026-08-01

NTE-9puy  Auth retry is flaky under load                 raw:2026-08-01-standup  → PLT-k3f9
NTE-k3f9  Sam owns the Stripe migration end to end       raw:2026-08-01-standup

## 2026-07-30

NTE-2m4x  Acme want SSO before they will renew           raw:2026-07-30-acme-call
```

- **`NTE-` IDs**, same random four-character alphabet as tasks — so a note can be referenced by
  a task, a commit, or a person, and `PLT-006`'s collision reasoning carries over unchanged.
- **`raw:` tag** records provenance: which capture it came from. Recoverable from git once the
  raw file is pruned.
- **`→ PLT-xxxx`** marks a promoted note. The note is **not deleted** — it is the record that
  this task came from that conversation, which is the thing worth keeping.

### Proposed commands

```
nm add <text>          capture straight to the archive (a formed thought)
nm drop <rawfile>      mark a raw file processed — deletes it, git keeps it
nm promote <NTE-id>    tm add + record the link both ways
nm prune               bound raw/ and the archive
nm find <term>         search the archive and pruned history
```

Reading is `cat notes/notes.md`; there is no `list`, on the same grounds as the board.

### Absorptions

- **`notes/meetings/`** — replaced. Meeting content arrives in `raw/` and leaves as archive
  entries.
- **`notes/reference/`** — replaced. "Useful context that is not a task" is exactly a note that
  never gets promoted.
- **`.notes/inbox.md`** — redundant. It existed to capture things noticed mid-flow, which is
  what `raw/` now does, and does better: committed rather than local, with a lifecycle rather
  than a file that fills up.
- **`notes/decisions/`** — untouched. `DEC-###` records are a different thing and are not part
  of this flow.

## Open

- **Does the archive need pruning at all?** `history.tsv` grows forever on the grounds that it
  is never read whole — but `notes.md` *is* read whole, which is the argument for bounding it
  the way `recent` is bounded. Probably a count, probably larger than 15.
- **`DEC-###` IDs are still sequential** and carry the branch-collision exposure `PLT-006` fixed
  for tasks. `NTE-` should be random from the start; whether `DEC-` gets migrated is separate.
- **Should `tm find` search notes too?** Today "have we thought about this before?" only
  searches completed work and misses every decision and every note — arguably the more valuable
  half. This is the strongest remaining argument for the subsystems knowing about each other.

## Log

- 2026-07-31 — created. Co-location pending since the taskman ontology moved.
- 2026-08-01 — planned. Four shape questions settled; `raw/` reframed from a transcript folder
  to a general capture inbox, which makes `.notes/inbox.md` redundant.
