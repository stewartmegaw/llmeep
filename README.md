![Road Runner](https://static.wikia.nocookie.net/looneytunesshow/images/4/42/Road_Runner.svg/revision/latest/scale-to-width-down/268)

# LLMeep

A project skeleton for a small team working with agents. Tasks, notes and decisions are flat
files in your repo, driven by two commands and read by whatever agent you point at them —
no tracker, no dashboard, nothing to keep in sync.

The team still hears about it. Closing a task broadcasts it to Telegram, Slack or a webhook,
and `tm standup` reports what actually shipped this period — read aloud on the call, or posted
to the channel. Those channels are **outbound only**: anything said back to the bot is ignored,
because the agent is the input surface.

Most scaffolding assumes a team that cannot hold context in its head, and charges coordination
overhead for it — a cost a small team shipping fast pays for nothing. The agent already has the
whole repository, so a tracker living anywhere else is a second, worse copy that someone keeps
in sync by hand. Delete all of that and three things are left worth keeping: **a shared
vocabulary**, **an ordered list of what is next**, and **a durable record of why**. That is
what this is. [The longer argument](#why-this-exists) is at the bottom.

## Get started

```sh
git clone --depth 1 https://github.com/stewartmegaw/llmeep.git my-project
cd my-project && rm -rf .git && git init
git config core.hooksPath tasks/_tooling/hooks     # validation on commit
```

That is the whole install — two Python 3 files, standard library only, nothing to build.

**Now say to your agent.** "What am I on?", "lets start the next task", "that's done, commit it" —
the commands below are what it runs for you, and the whole system is designed to be driven that
way rather than typed. Point your agent at this file.

The hooks block a commit on inconsistent records and warn on drift; `tm check` runs the same
checks standalone, so CI needs no separate configuration. Agent permissions are committed in
`.claude/settings.json`, so a clone stops prompting for the daily commands immediately — the
three that change something you cannot take back (`tm reset`, `tm check --notify --send`,
`nm prune --yes`) deliberately still ask.

## Tracking work

```sh
tasks/_tooling/tm add Fix flaky auth test   # create; -b for business, -n for top of the order
tasks/_tooling/tm go                        # start the next task, or show the one in progress
tasks/_tooling/tm park                      # put it back; unassigns it
tasks/_tooling/tm done                      # complete the current task
tasks/_tooling/tm find auth                 # search everything ever completed
tasks/_tooling/tm standup                   # what closed this period; --send posts it
```

Defaults do the work: `add` assumes platform, `go` and `done` assume the current task. Nothing
inferable from state has to be typed — including **who you are**: `go` assigns a task to you
from your git config, and `done` records it.

**Close the task, then commit** — code, board and history land together, and `closes <id>` in
the message is the permanent link between the two. Listing is reading
[the board](tasks/platform/board.md); reordering is moving a line in it. Neither needs a
command.

Full model: [`tasks/_tooling/ontology.md`](tasks/_tooling/ontology.md).

## Capturing work

`notes/` is not a filing cabinet — it is the funnel that feeds the board.

```
capture              distil               promote            prune
notes/raw/*.md  ──▶  notes/notes.md  ──▶  tasks board    ──▶  git
   (inbox)           (archive)                                 (archive)
                          └──▶ or stays as context, never promoted
```

Paste a call transcript into your agent and it captures what survives; the note is the
artifact, and the transcript is scaffolding that never gets committed.

```sh
notes/_tooling/nm add --from acme-call "Acme want SSO before they will renew"
notes/_tooling/nm promote NTE-shmy   # a note becomes a task, linked both ways
notes/_tooling/nm drop <file>        # a capture in notes/raw/ is processed; git keeps it
notes/_tooling/nm prune              # bound raw/ and the archive; dry without --yes
notes/_tooling/nm find <term>        # search every note ever captured
```

Full model: [`notes/_tooling/ontology.md`](notes/_tooling/ontology.md).

## What it costs your agent

Nothing here is auto-loaded — no `CLAUDE.md`, no always-on context file. What an agent carries
is what it chooses to read, so the standing cost is two lines:

| Loaded             | When                         | Roughly         |
| ------------------ | ---------------------------- | --------------- |
| Skill descriptions | always, in every prompt      | **~150 tokens** |
| `tm` skill         | when you mention tasks       | ~2,500          |
| `nm` skill         | when you mention notes       | ~2,000          |
| A board            | when it lists or starts work | ~400            |

A working session on tasks costs about **3,000 tokens** of context — the skill plus the board —
and the board stays that size on purpose: `recent` is capped at 15 and everything older is
searched with `find` rather than carried. That cap is the whole reason the cost is flat instead
of growing with the project.

## Start here

1. [`ontology/principles.md`](ontology/principles.md) — the seven rules everything follows from.
2. [`ontology/core.md`](ontology/core.md) — the entities that cut across subsystems. A
   self-contained subsystem keeps its vocabulary next to itself instead, like
   [`tasks/_tooling/ontology.md`](tasks/_tooling/ontology.md).
3. [`tasks/_tooling/ontology.md`](tasks/_tooling/ontology.md) — how work is tracked. One board file,
   priority by position.
4. [`notes/_tooling/ontology.md`](notes/_tooling/ontology.md) — how work arrives. Capture, distil, promote,
   prune.
5. Describe your own project in [`ontology/domain/`](ontology/domain/README.md) — the
   extension point. You should not need to edit the core ontology.
6. Put your codebase in [`platform/`](platform/README.md).

---

**Everything below is about llmeep itself, not about your project.** When you adopt this
skeleton, delete from this line down and write your own — the sections above are the working
agreement and are worth keeping. Nothing in the tooling reads this file, so you can cut it
freely; the model lives in [`tasks/_tooling/ontology.md`](tasks/_tooling/ontology.md) and
[`notes/_tooling/ontology.md`](notes/_tooling/ontology.md), which survive any rewrite.

## Why this exists

llmeep is a clonable skeleton for small teams and agents building fast. The name is an LLM and
a road runner: _meep meep_, and it is already gone.

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

## Design notes

### What a note is for

**The transcript is never stored.** An exported call is large and mostly noise, and `notes/raw/`
is committed — saving one would put "hello how are you" into git _permanently_, because pruning
clears the working tree but not history, and every clone carries it forever. **The note is the
artifact; the transcript is scaffolding.**

**Distilling is the agent's job, not a command.** Deciding what in a conversation mattered is
judgement, so there is no `nm process`. The agent reads, calls `nm add` for what survives, and
`nm drop` for the file. `nm` never parses a transcript — the same split as everywhere else in
this project: mechanism in the tool, judgement in the agent.

The test for a line earning its place: **would someone act differently for having read it?**
A note that fails that is noise wearing a summary's clothes.

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
whatever `NOTIFY` names — `telegram`, `slack`, `webhook` or `none`. Messages sent _back_ to a
channel are ignored; Telegram's BotFather description says so and it advertises no commands.

That the channel's configuration lives in the _service_ rather than the repo is the point, not
a gap: bot name, description, which room, who can see it — all of that differs per team and
belongs to them. The repo's share is one line and a secret, so swapping channels touches no
record and no ontology. Adding one is a function plus a dict entry
([`DEC-008`](https://github.com/stewartmegaw/llmeep/blob/main/decisions/DEC-008-notifier-is-swappable.md)).

We built the other way first and deleted it. Inbound Telegram worked — `/add` filed tasks,
`/list` returned the board — and it was still a worse version of something already available
from the same phone: an agent needs no command syntax, no flags, and lands the change on the
board directly instead of queueing it for a later pull. See
[`DEC-006`](https://github.com/stewartmegaw/llmeep/blob/main/decisions/DEC-006-telegram-is-notification-only.md) and
[`DEC-007`](https://github.com/stewartmegaw/llmeep/blob/main/decisions/DEC-007-stray-telegram-messages-are-ignored.md).

The rule generalises past Telegram: **before building an input surface, check whether an agent
with the repository already does it better.** Slack, email, a web UI — the answer is usually
yes, and the surface you skip is one you never have to keep in sync.

Full model: [`tasks/_tooling/ontology.md`](tasks/_tooling/ontology.md).

### The standup

Completed tasks fall out of `recent` as the window fills, so _what did we actually get done_
is the one question the working tree stops being able to answer. `tm standup` asks git instead.

**Usually it is a person.** Whoever runs the weekly call types it and reads the output out;
`--send` posts it if the team wants it in writing. That needs no infrastructure, and it is the
case worth optimising for.

```sh
tasks/_tooling/tm standup           # what closed this period, and what is still open
tasks/_tooling/tm standup --send    # ...and post it to the team channel
```

Set `STANDUP_PERIOD` to `daily`, `workday`, `bidaily` or `weekly` in `.env`.

**If you want it unattended**, `tasks/_tooling/blueprints/standup.sh` is a blueprint for an always-on
machine: it fetches, then reports. Nothing here runs it — `tm standup --cron` prints the line
that would (at `STANDUP_AT`, default `09:00`), and you decide whether to schedule it
([`DEC-017`](https://github.com/stewartmegaw/llmeep/blob/main/decisions/DEC-017-the-standup-is-usually-a-person.md)).

**Close the task, then commit** — code, board and history land together:

```sh
tasks/_tooling/tm done PLT-007
git commit -m "Fix flaky auth test. closes PLT-007"
```

The trailer makes the commit self-identifying, so `find` can recover it later and no SHA is
stored anywhere.

Listing is reading [the board](tasks/platform/board.md); reordering is moving a line in it.
Neither needs a command. `add` and `go` search history automatically, so work that was already
attempted surfaces without anyone deciding to look.

## Adopting this skeleton

```sh
git clone <this-repo> my-project && cd my-project
rm -rf .git && git init
git config core.hooksPath tasks/_tooling/hooks
```

The default branch is **`release`** — a clean skeleton with empty boards, ready to use. It
exists so the tree arrives adopted: no `UNADOPTED.md`, no records of llmeep's own build to
reset, nothing to clear before your first task. Clone `main` and you get the same files plus
this project's boards, history and notes, and two resets to run before they stop being yours
by accident.

Then work through [`ontology/domain/README.md`](ontology/domain/README.md).

**And cut this README back.** Everything from the `---` above down is about llmeep, not about
your project — delete it and write your own introduction in its place. Keep the sections above
the line: they describe how the tooling in this repo is driven, and they stay true whatever you
build in `platform/`.

### Branches

| Branch                | Contains                            | Clone it to…                |
| --------------------- | ----------------------------------- | --------------------------- |
| `release` _(default)_ | Latest clean version                | start a project             |
| `v1`, `v2`, …         | Pinned versions                     | pin to a specific one       |
| `main`                | Development, with full task history | improve the skeleton itself |

**If you cloned `main` instead**, an `UNADOPTED.md` sits in both `tasks/` and `notes/` saying
so, and each tool repeats it until you deal with it. Run **both** resets — adoption is per
subsystem, because the two are meant to be liftable apart:

```sh
tasks/_tooling/tm reset --yes   # clears boards, history, sidecars
notes/_tooling/nm reset --yes   # clears the archive, its history, raw/
```

Otherwise you inherit this project's task history and `find` returns the skeleton's work as
your prior art, which is the amnesia-prevention mechanism working against you. Every `tm add`
and `tm go` says so until you do. `reset` clears both boards, `history.tsv` and the sidecars;
it **keeps** the ontology, principles, templates and decision records. Run it without `--yes`
first to see exactly what goes.

Whether to keep the decisions depends on which repo you are becoming. Improving llmeep itself,
keep them — they explain why the design is what it is. Starting your own project, add `--all`:
`decisions/` is then yours from `DEC-001`, rather than someone else's twenty-five records with
your first decision filed behind them. The design is still described by `ontology/`,
`tasks/_tooling/ontology.md` and `notes/_tooling/ontology.md`, which `reset` never touches.

### Cutting a version

Release branches are **write-once — never merged back**, which is what keeps `board.md` and
`history.tsv` from colliding forever. Each version is a new commit on `release`, made by taking
`main`'s tree and clearing the records:

```sh
git checkout release
git rm -rq .                          # or a rename leaves the old paths behind
git checkout main -- .
tasks/_tooling/tm reset --yes --all   # --all drops this project's decisions too;
notes/_tooling/nm reset --yes         # a release is nobody's project yet
git add -A
git commit -m "v3: clean skeleton" && git tag v3
git checkout main                     # work continues; history intact
```

**A release cut always takes `--all`.** Whoever clones it is starting their own project, so
llmeep's decision records would be twenty-five entries of someone else's reasoning sitting in
front of their first one — the same argument as the task history above, and the reason v2
shipped wrong.

## Status

**Taskman is built and in use** — this repo tracks its own work with it.
[`DEC-001`](https://github.com/stewartmegaw/llmeep/blob/main/decisions/DEC-001-taskman-design.md) (model),
[`DEC-002`](https://github.com/stewartmegaw/llmeep/blob/main/decisions/DEC-002-task-history-index.md) (history),
[`DEC-003`](https://github.com/stewartmegaw/llmeep/blob/main/decisions/DEC-003-skills-are-executables.md) (tooling),
[`DEC-004`](https://github.com/stewartmegaw/llmeep/blob/main/decisions/DEC-004-commits-close-tasks.md) (superseded),
[`DEC-005`](https://github.com/stewartmegaw/llmeep/blob/main/decisions/DEC-005-agent-mediated-git.md) (git).

Not yet done, and honest about it:

- **`ontology/domain/`** is correctly empty, which also means nobody has followed its six steps
  end to end.
- **Adopting into an existing repo** assumes you are starting fresh; a project with its own
  history has no path in yet (`PLT-7g78`).
- **Decisions have no `find`.** Twenty-five records and no way to search them, which is the
  precondition for ever pruning the folder (`PLT-cajd`).

Known limits, which are not bugs:

- **Validation checks consistency, not truth.** The hooks cannot tell you a task was closed that
  should not have been — this has already happened once here, and is recorded in the history.
- **Boards conflict on branches.** The resolution procedure in
  [`tasks/_tooling/ontology.md`](tasks/_tooling/ontology.md) exists but has never been run in anger.
- **Telegram fires on `done`, not on push**, so on a branch the team hears about work before
  they can pull it.

Open work is on the [platform board](tasks/platform/board.md).
