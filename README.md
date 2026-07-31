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
- **The agent is the interface.** Bots, forms and dashboards are input surfaces built for
  humans who lack context. An agent already has the whole repository — so it takes the input,
  and every other channel becomes notification-only.

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

Listing is reading [the board](taskman/platform/board.md); reordering is moving a line in it.
Neither needs a command. `add` and `go` search history automatically, so work that was already
attempted surfaces without anyone deciding to look.

### The agent is the interface

There is deliberately **no chat bot, no form, no dashboard** for managing work. Anything you
would type into one, you say to the agent — including from a phone, since Claude Code runs
there too. You speak; it translates:

```
"what am I on?"          →   tm go
"start PLT-9puy"         →   tm go PLT-9puy
"add a task for X"       →   tm add X
"that's done, commit it" →   tm done  &&  git commit -m "…. closes PLT-9puy"
```

**That includes git.** Nothing enforces it — direct git use keeps working, and revert, rebase
and CI must never be blocked — but the board only stays current if the agent is driving.

**Every other channel is notification-only, and swappable.** `done` announces completions to
whatever `NOTIFY` names — `telegram`, `slack`, `webhook` or `none`. Messages sent *back* to a
channel are ignored; Telegram's BotFather description says so and it advertises no commands.

That the channel's configuration lives in the *service* rather than the repo is the point, not
a gap: bot name, description, which room, who can see it — all of that differs per team and
belongs to them. The repo's share is one line and a secret, so swapping channels touches no
record and no ontology. Adding one is a function plus a dict entry
([`DEC-008`](notes/decisions/DEC-008-notifier-is-swappable.md)).

We built the other way first and deleted it. Inbound Telegram worked — `/add` filed tasks,
`/list` returned the board — and it was still a worse version of something already available
from the same phone: an agent needs no command syntax, no flags, and lands the change on the
board directly instead of queueing it for a later pull. See
[`DEC-006`](notes/decisions/DEC-006-telegram-is-notification-only.md) and
[`DEC-007`](notes/decisions/DEC-007-stray-telegram-messages-are-ignored.md).

The rule generalises past Telegram: **before building an input surface, check whether an agent
with the repository already does it better.** Slack, email, a web UI — the answer is usually
yes, and the surface you skip is one you never have to keep in sync.

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
```

The default branch is **`release`** — a clean skeleton with empty boards, ready to use. That is
deliberately not the development branch: most people cloning want the skeleton, not the
skeleton's own build history.

Then work through [`ontology/domain/README.md`](ontology/domain/README.md).

### Branches

| Branch          | Contains                              | Clone it to…                    |
| --------------- | ------------------------------------- | ------------------------------- |
| `release` *(default)* | Latest clean version            | start a project                 |
| `v1`, `v2`, …   | Pinned versions                       | pin to a specific one           |
| `main`          | Development, with full task history   | improve the skeleton itself     |

**If you cloned `main` instead**, run `taskman/tm reset --yes` — otherwise you inherit this
project's task history and `find` returns the skeleton's work as your prior art, which is the
amnesia-prevention mechanism working against you. Every `tm add` and `tm go` says so until you
do. `reset` clears both boards, `history.tsv` and the sidecars; it **keeps** the ontology,
principles, templates and decision records, because those explain why the design is what it is.
Run it without `--yes` first to see exactly what goes.

### Cutting a version

Release branches are **write-once — never merged back**, which is what keeps `board.md` and
`history.tsv` from colliding forever. Each version is a new commit on `release`, made by taking
`main`'s tree and clearing the records:

```sh
git checkout release
git checkout main -- .
taskman/tm reset --yes
git commit -am "v2: clean skeleton" && git tag v2
git checkout main            # work continues; history intact
```

## Status

**Taskman is built and in use** — this repo tracks its own work with it.
[`DEC-001`](notes/decisions/DEC-001-taskman-design.md) (model),
[`DEC-002`](notes/decisions/DEC-002-task-history-index.md) (history),
[`DEC-003`](notes/decisions/DEC-003-skills-are-executables.md) (tooling),
[`DEC-004`](notes/decisions/DEC-004-commits-close-tasks.md) (superseded),
[`DEC-005`](notes/decisions/DEC-005-agent-mediated-git.md) (git).

Not yet done, and honest about it:

- **Telegram** (`PLT-005`) is written and wired into `done`, but has never sent a message.
  Needs a bot token and an `.env.example`.
- **`notes/`** is conventions only — no tooling, and its entities still live in
  `ontology/core.md` rather than a co-located `notes/ontology.md`.
- **`ontology/domain/`** is correctly empty, which also means nobody has followed its six steps
  end to end.

Known limits, which are not bugs:

- **Validation checks consistency, not truth.** The hooks cannot tell you a task was closed that
  should not have been — this has already happened once here, and is recorded in the history.
- **Boards conflict on branches.** The resolution procedure in
  [`taskman/ontology.md`](taskman/ontology.md) exists but has never been run in anger.
- **Telegram fires on `done`, not on push**, so on a branch the team hears about work before
  they can pull it.

Open work is on the [platform board](taskman/platform/board.md).
