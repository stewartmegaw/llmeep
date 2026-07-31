# Project Skeleton

A clonable skeleton for small teams and agents building fast.

## Why this exists

Most project scaffolding assumes a team that cannot hold context in its head. Jira, PR
review, sprint ceremony, exhaustive specs — all of it is coordination overhead, and it only
pays for itself at a size most projects never reach. Applied to a small team shipping an
MVP, it is pure friction:

- **Jira is too much friction for a team that wants to move fast.** The ticket is not
  communicating with anyone; it is a form you fill in for yourself.
- **What is the point of a PR when there is one developer?** And in a near future where
  reviewing AI-generated changes at volume is not meaningful review, the review column tracks
  a step nobody performs.
- **The AI has the context right there in the project.** A tracker living somewhere else is a
  second, worse copy that someone has to keep in sync by hand.
- **Building is now rapid.** A lengthy description of work that takes an hour has no reader.
  A title is frequently the whole task, and a definition of done is worth writing only
  sometimes.
- **Git is already a database.** Completed work does not need to sit in the working tree. Keep
  a short window of recent history and search the rest on demand.

So this skeleton keeps only what stays irreducible at that size: **a shared vocabulary**, **an
ordered list of what is next**, and **a durable record of why**. Everything else is deleted
rather than made lighter.

Two consequences run through the whole design. **Records are written for agents first** —
machine-parseable beats pretty, and rendering for humans is a separate job. And **fewer moving
parts wins**: fewer skills, fewer files, fewer states, fewer things to keep in sync.

It is agnostic to **language**, **architecture** and **LLM vendor**. Nothing assumes you write
Go or TypeScript, nothing assumes a monolith or microservices, and nothing here is named after
a model provider — the agent contract lives in `README.md`, not `CLAUDE.md` or `AGENTS.md`,
because every agent reads README. Point yours at this file.

## Layout

| Path        | Committed | Purpose                                                            |
| ----------- | --------- | ------------------------------------------------------------------ |
| `ontology/` | yes       | The shared vocabulary. What things are called and how they relate.  |
| `taskman/`  | yes       | Task boards. `platform/` for build work, `business/` for the rest.  |
| `notes/`    | yes       | Durable, shared knowledge. Decisions, meetings, reference.          |
| `.notes/`   | **no**    | Local working memory. Sessions, scratch, inbox. Gitignored.         |
| `platform/` | yes       | **Your project goes here.** Empty in the skeleton.                  |

## Tracking work

Four commands. No install step — one Python 3 file, standard library only.

```sh
taskman/tm add Fix flaky auth test   # create; -b for business, -n for top of the order
taskman/tm go                        # start the next task, or show the one in progress
taskman/tm done                      # complete the current task
taskman/tm find auth                 # search everything ever completed
```

Defaults do the work: `add` assumes platform, `go` and `done` assume the current task. Nothing
inferable from state has to be typed.

**Close the task, then commit** — code, board and history land together:

```sh
taskman/tm done PLT-007
git commit -m "Fix flaky auth test. closes PLT-007"
```

The trailer makes the commit self-identifying, so `find` can recover it later and no SHA is
stored anywhere.

**Prerequisite: project git commands go through the agent.** Nothing enforces this — direct git
use keeps working, and revert, rebase and CI must never be blocked — but the board only stays
current if the agent is driving. In practice you speak and it translates:

```
"lets start PLT-123"   →   tm go PLT-123
"commit task"          →   tm done PLT-123  &&  git commit -m "…. closes PLT-123"
```

Listing is reading [the board](taskman/platform/board.md); reordering is moving a line in it.
Neither needs a command. `add` and `go` search history automatically, so work that was already
attempted surfaces without anyone deciding to look.

**Install the validation hooks** — one step, because `.git/hooks` is not committed:

```sh
git config core.hooksPath taskman/hooks
```

They block on inconsistent records and warn on drift. `tm check` runs the same checks
standalone, so CI needs no separate configuration.

Full model: [`taskman/ontology.md`](taskman/ontology.md).

## Start here

1. [`ontology/principles.md`](ontology/principles.md) — the seven rules everything follows from.
2. [`ontology/core.md`](ontology/core.md) — the entities that cut across subsystems. A
   self-contained subsystem keeps its vocabulary next to itself instead, like
   [`taskman/ontology.md`](taskman/ontology.md).
3. [`taskman/ontology.md`](taskman/ontology.md) — how work is tracked. One board file, four
   skills, priority by position.
4. Describe your own project in [`ontology/domain/`](ontology/domain/README.md) — the
   extension point. You should not need to edit the core ontology.
5. Put your codebase in [`platform/`](platform/README.md).

## Adopting this skeleton

```sh
git clone <this-repo> my-project && cd my-project
rm -rf .git && git init
git config core.hooksPath taskman/hooks
taskman/tm reset --yes
```

**`tm reset` matters.** Without it you inherit *this* project's task history, and `find` will
return the skeleton's work as your prior art — the amnesia-prevention mechanism working against
you. It clears both boards, `history.tsv` and the task sidecars.

It **keeps** the ontology, the principles, the templates and the decision records, because those
explain why the design is what it is. `--all` drops the decisions too. Run without `--yes` first
to see exactly what goes.

Until you run it, every `tm add` and `tm go` says so.

Then work through `ontology/domain/README.md`.

## Status

Taskman's design is settled —
[`DEC-001`](notes/decisions/DEC-001-taskman-design.md) (model),
[`DEC-002`](notes/decisions/DEC-002-task-history-index.md) (history),
[`DEC-003`](notes/decisions/DEC-003-skills-are-executables.md) (tooling).

`taskman/tm` is **not written yet**. The board is usable by hand in the meantime — it is a
text file by design, and that is not a workaround. Open work is on the
[platform board](taskman/platform/board.md); `PLT-003` builds the executable and unblocks
everything else.
