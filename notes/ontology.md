# Notes

The whole of note-keeping: vocabulary, format and operation, in one file.

It lives here rather than in `ontology/core.md` because it describes one subsystem —
[`ontology/README.md`](../ontology/README.md) explains the convention.

**Rationale and rejected alternatives:**
[`DEC-012`](decisions/DEC-012-notes-is-a-pipeline.md).

```
notes/
  nm             <- the executable; five commands
  ontology.md    <- this file
  notes.md       <- the archive: the window you read
  history.tsv    <- every note ever; grep-only, never loaded
  raw/           <- captures waiting to be processed
  decisions/     <- DEC records; a different thing, see below
```

---

## The pipeline

`notes/` is not a filing cabinet. It is the intake funnel that feeds the board.

```
capture              distil               promote            prune
notes/raw/*.md  ──▶  notes.md        ──▶  taskman board  ──▶  git
   (inbox)           (archive)                                 (archive)
                          └──▶ or stays as context, never promoted
```

A note is either **something to do** — in which case it becomes a task — or **something worth
knowing** that never will. Both belong here; only the first leaves.

## Capture

Two ways in, and the commoner one never touches the filesystem.

**Distil a call.** Paste an exported transcript into the agent and it captures what survives:

```sh
nm add --from acme-call <<'EOF'
Acme want SSO before they will renew
Their security review lands 2026-09-15
Sam owns the Stripe migration end to end
EOF
```

**The transcript itself is never written.** An exported call is large and mostly noise —
greetings, scheduling, restatement — and `raw/` is committed, so saving one would put that noise
into git *permanently*. Pruning clears the working tree, not history, and every clone carries it
forever. **The note is the artifact; the transcript is scaffolding.**

**Drop a file in `raw/`** for anything you want to keep and process later — a written summary, a
shared document, an idea captured mid-flow. Presence means pending: there is no processed
marker, because processing deletes the file and git keeps it.

```sh
nm drop 2026-08-01-standup.md    # processed; gone from the tree
```

The test for whether something belongs in `raw/` rather than being distilled on the spot:
**would anyone want to read it again?**

## What distilling keeps

This is judgement, so it is the agent's job — there is deliberately no `nm process` command.

| Keep | Discard |
|---|---|
| Decisions made, and what was rejected | Greetings, small talk, scheduling |
| Commitments — who will do what | Restatement of what everyone already knew |
| Facts that change a plan — a customer need, a slipped dependency, a constraint | Anything already recorded in the repo |
| Open questions raised and left unresolved | Thinking-aloud that led nowhere |

The test for a line earning its place: **would someone act differently for having read it?**
A note that fails that is noise wearing a summary's clothes.

## Note

One line in the archive.

- **Identity:** `NTE-` plus four characters from `23456789abcdefghjkmnpqrstuvwxyz` — random, not
  sequential, so two branches cannot allocate the same one. The same reasoning as `PLT-006`.
- **Capped at 200 characters.** A note is a line. Anything longer is a task or a decision
  wearing the wrong clothes.
- **Tags:** `src:acme-call` records where it came from; `task:PLT-9puy` records where it went.

```
# notes

## 2026-08-01

NTE-shmy  Acme want SSO before they will renew            src:acme-call  task:PLT-9wmv
NTE-enu9  Sam owns the Stripe migration end to end        src:acme-call
```

**A promoted note is not deleted.** It is the record that a task came from a particular
conversation on a particular day — which is the part worth keeping, and the part git cannot
reconstruct.

## Archive and history

Exactly the split taskman uses, for the same reason.

- **`notes.md`** is the **window**: the most recent 200 notes, grouped by date, newest first.
  Always read whole, so it must stay bounded.
- **`history.tsv`** holds **every note ever captured**. Append-only, never read whole — only
  grepped by `find`. It grows forever, and that is fine.

Pruning narrows the window; it loses nothing.

**One exception to append-only:** promoting a note rewrites its history row to add the task id.
A link discovered later is new information about an existing row, not a second row — and a
`find` that could not show where a note went would be missing the useful half.

## Skill

Five commands. Reading is `cat notes/notes.md`; there is no `list`, on the same grounds as the
board.

| Skill     | Invocation                        | Does                                                     |
| --------- | --------------------------------- | -------------------------------------------------------- |
| `add`     | `nm add [--from <src>] <text…>`   | Capture. Reads stdin for batch — one note per line.       |
| `drop`    | `nm drop <file>`                  | Mark a capture processed by deleting it. Git keeps it.    |
| `promote` | `nm promote <NTE-id> [-b] [-n]`   | `tm add`, then link both ways.                            |
| `prune`   | `nm prune [--yes]`                | Bound `raw/` and the window. Dry unless `--yes`.          |
| `find`    | `nm find <term>`                  | Search every note ever captured.                          |

`nm check` validates records; it is not a skill, because it touches no note.

**`nm` is mechanical; the agent judges.** There is no `process` command because processing is
reading a transcript and deciding what matters. `nm` never parses one:

| `nm` does | The agent does |
|---|---|
| Allocate an id, append with a date | Decide what in a capture is worth keeping |
| Link a note to its task | Decide a note is task-shaped rather than context |
| Delete a processed capture | Write the task title |
| Bound the window | — |

## Pruning

`nm prune` is a **dry run unless `--yes`** — the same guard `tm reset` uses for destruction and
`tm check --notify` uses for visibility.

- **Captures older than 30 days** are offered for deletion. Something unprocessed for a month is
  probably never going to be processed, and admitting that beats an inbox nobody trusts.
- **The window past 200** is narrowed. Nothing is lost; `history.tsv` keeps it and `find`
  retrieves it.

The two are not equivalent, and the command says so: pruning a capture discards work nobody did;
pruning the window only changes what you see by default.

## Decisions are a different thing

`notes/decisions/` holds `DEC-###` records and is **not part of this pipeline**. A decision is a
claim the project stands behind, written deliberately, never edited in substance, superseded
rather than changed. A note is something someone said on a Tuesday.

They share a folder because both are durable knowledge. They share nothing else.

---

## Glossary

| Term        | Means                                                             |
| ----------- | ----------------------------------------------------------------- |
| **capture** | Anything in `raw/` awaiting processing. Presence means pending.    |
| **distil**  | Turn a capture into notes. Judgement; the agent's job.             |
| **note**    | One line in the archive. `NTE-` id.                                |
| **archive** | `notes.md` — the window of recent notes, read whole.               |
| **history** | `notes/history.tsv` — every note ever. Grep-only.                  |
| **promote** | Turn a note into a task, linking both ways.                        |
| **prune**   | Drop stale captures; narrow the window.                            |

### Words we avoid

| Avoid            | Because                                                        | Use instead        |
| ---------------- | -------------------------------------------------------------- | ------------------ |
| minutes          | Implies a record of what was said, not what mattered.          | **notes**          |
| transcript       | The input, never the artifact — it is not kept.                | **capture**        |
| summarise        | Suggests shortening everything; the job is discarding most.    | **distil**         |
| inbox zero       | The goal is a true board, not an empty folder.                 | —                  |
| archive (verb)   | Ambiguous: pruned, promoted, or deleted?                       | **prune**, **promote** |
