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

**One way in: run `adopt` from inside your repo.** Your code, history and README are untouched;
it adds the record trees beside them and starts you with empty boards.

```sh
git clone --depth 1 https://github.com/stewartmegaw/llmeep.git /tmp/llmeep
cd my-project
/tmp/llmeep/adopt --dry-run    # then again without --dry-run
```

That is the whole install — two Python 3 files, standard library only, nothing to build. It sets
`core.hooksPath` for you, so validation is on from the first commit.

**Starting from nothing?** `mkdir my-project && cd my-project && git init`, then the same three
lines. There is deliberately no separate path for a new project: llmeep used to be installable
by cloning it and deleting its `.git`, and one way in is fewer things to keep honest
([`DEC-035`](llmeep/decisions/DEC-035-adopt-is-the-only-way-in.md)).

Your own `tasks/`, `notes/`, `decisions/` or `ontology/` are safe: everything llmeep ships
lives under `llmeep/`, which `--into ops` renames if that name is taken too.
[More on adopting](#adopting-into-a-repo-that-already-exists).

**Now say to your agent.** "What am I on?", "lets start the next task", "that's done, commit it" —
the commands below are what it runs for you, and the whole system is designed to be driven that
way rather than typed. Point your agent at this file.

The hooks block a commit on inconsistent records and warn on drift; `tm check` runs the same
checks standalone, so CI needs no separate configuration. Agent permissions are committed in
`.claude/settings.json`, so an install stops prompting for the daily commands immediately — the
two that change something you cannot take back (`tm check --notify --send`, `nm prune --yes`)
deliberately still ask.

<!-- adopt:start — everything to adopt:end is copied into an adopting repo by ./adopt -->

## Tracking work

```sh
llmeep/tasks/_tooling/tm add Fix flaky auth test   # file it in the backlog; -b for business, -n prioritises
llmeep/tasks/_tooling/tm prioritise PLT-9puy       # backlog → prioritised; -n for the top of the order
llmeep/tasks/_tooling/tm go                        # start the next task, or show the one in progress
llmeep/tasks/_tooling/tm park                      # step it back one section; unassigns it
llmeep/tasks/_tooling/tm done                      # complete the current task
llmeep/tasks/_tooling/tm drop PLT-9puy             # remove one that should not have been filed
llmeep/tasks/_tooling/tm find auth                 # search everything ever completed
llmeep/tasks/_tooling/tm why standup               # search decisions; `tm why DEC-017` explains one
llmeep/tasks/_tooling/tm standup                   # what closed this period; --send posts it
llmeep/tasks/_tooling/tm agenda                    # what a meeting must get through; --send posts it
```

Defaults do the work: `add` assumes platform, `go` and `done` assume the current task. Nothing
inferable from state has to be typed — including **who you are**: `go` assigns a task to you
from your git config, and `done` records it.

**Close the task, then commit** — code, board and history land together, and `closes <id>` in
the message is the permanent link between the two. Listing is reading
[the board](llmeep/tasks/platform/board.md); reordering is moving a line in it. Neither needs a
command.

**When you reject an alternative someone will propose again, write a decision.** Nothing prompts
you to — `tm check` enforces their shape and their graph, but whether a choice was worth
recording is judgement. Copy `decisions/_template.md`; the test is *would a reasonable person
suggest the opposite next month?* Not for bug fixes or renames. `tm why <term>` searches them,
and is worth running **before** work that changes established behaviour.

Full model: [`llmeep/tasks/_tooling/ontology.md`](llmeep/tasks/_tooling/ontology.md), and
[`llmeep/ontology/core.md`](llmeep/ontology/core.md) for decisions.

## Capturing work

`notes/` is not a filing cabinet — it is the funnel that feeds the board.

```
capture              distil               promote            prune
llmeep/notes/raw/*.md  ──▶  llmeep/notes/notes.md  ──▶  tasks board    ──▶  git
   (inbox)           (archive)                                 (archive)
                          └──▶ or stays as context, never promoted
```

Paste a call transcript into your agent and it captures what survives; the note is the
artifact, and the transcript is scaffolding that never gets committed.

```sh
llmeep/notes/_tooling/nm add --from acme-call "Acme want SSO before they will renew"
llmeep/notes/_tooling/nm promote NTE-shmy   # a note becomes a task, linked both ways
llmeep/notes/_tooling/nm drop <file>        # a capture in llmeep/notes/raw/ is processed; git keeps it
llmeep/notes/_tooling/nm prune              # bound raw/ and the archive; dry without --yes
llmeep/notes/_tooling/nm find <term>        # search every note ever captured
```

Full model: [`llmeep/notes/_tooling/ontology.md`](llmeep/notes/_tooling/ontology.md).

## What it costs your agent

Nothing here is auto-loaded — no `CLAUDE.md`, no always-on context file. What an agent carries
is what it chooses to read, so the standing cost is two lines:

| Loaded             | When                         | Roughly         |
| ------------------ | ---------------------------- | --------------- |
| Skill descriptions | always, in every prompt      | **~150 tokens** |
| `tm` skill         | when you mention tasks       | ~4,100          |
| `nm` skill         | when you mention notes       | ~1,900          |
| A board            | when it lists or starts work | ~400            |

A working session on tasks costs about **4,600 tokens** of context — the skill plus the board —
and the board stays that size on purpose: `recent` is capped at 15 and everything older is
searched with `find` rather than carried. That cap is the whole reason the cost is flat instead
of growing with the project.

**Measure it rather than trusting this table**, which was wrong by a third before anyone
checked — the skill grew a section at a time, each one justified, and nothing added them up:

```sh
llmeep/tasks/_tooling/tm check --context
```

It warns past 5,000 tokens for a **session** — a skill plus the record file read to answer with
it, which is what working actually costs. A skill loads whole the moment its subject comes up,
and the board is loaded beside it; budgeting the file alone missed half of that and could not
tell a file quietly accreting from a tool that had grown twelve commands where it had eight
([`DEC-037`](llmeep/decisions/DEC-037-budget-the-session-not-the-file.md)). The models — `llmeep/tasks/_tooling/ontology.md` and its notes counterpart — are
deliberately absent from that table and from the budget. They are far larger (~8,600 tokens for
tasks) and read on demand, when the model changes rather than when work happens.

## Telling llmeep what it got wrong

**Off, and it stays off unless you switch it on.** With `FEEDBACK=on` in `llmeep/.env`, your
agent spends a short pass after each commit on one question: did llmeep's own machinery get in
the way, and is something missing that its principles imply? What it notices goes in
`llmeep/feedback.md`.

```sh
llmeep/tasks/_tooling/tm feedback                 # what has been drafted
llmeep/tasks/_tooling/tm feedback "<what happened>"   # add one by hand
```

Two things this deliberately is not. **It costs tokens** — a review pass per commit, on your
account — which is the entire reason it is opt-in rather than a default. And **nothing sends
it**: `feedback.md` is gitignored and local, there is no network call, no credential and no
schedule. Reading it and passing it on is your act, whenever you feel like it.

A draft is about llmeep and never about your project — no code, no file names, no domain terms,
no task titles. That is a hard rule and not a redaction pass at the end: a point that cannot be
made without naming something in your repo does not get written. It is also the useful version,
since a suggestion phrased in your domain is not actionable by anyone else.

There is no git hook here and there will not be one. A hook cannot run a review, and one that
merely reminded would print into commit output, which nobody reads — least of all when the
agent is doing the committing.

## Updating

`adopt` installed `.llmeep` at the root of this repo. It is the installer itself, carrying the
version and a checksum per file in its header, so updating needs no clone step:

```sh
./.llmeep --version
./.llmeep --update --dry-run    # what it would fetch; fetches nothing
./.llmeep --update              # fetches the newest release tag and applies it
```

**Machinery is replaced; records never are.** Boards, notes, captures, decisions, both
`history.tsv` files and any domain ontology of your own are not touched. A file you have edited since
installing is reported and kept — the checksums are how it can tell — so re-run with `--force`
once you have diffed it. Restart your agent session afterwards, since skills are read at
startup.

## Start here

1. [`llmeep/ontology/principles.md`](llmeep/ontology/principles.md) — the seven rules everything follows from.
2. [`llmeep/ontology/core.md`](llmeep/ontology/core.md) — the entities that cut across subsystems. A
   self-contained subsystem keeps its vocabulary next to itself instead, like
   [`llmeep/tasks/_tooling/ontology.md`](llmeep/tasks/_tooling/ontology.md).
3. [`llmeep/tasks/_tooling/ontology.md`](llmeep/tasks/_tooling/ontology.md) — how work is tracked. One board file,
   priority by position.
4. [`llmeep/notes/_tooling/ontology.md`](llmeep/notes/_tooling/ontology.md) — how work arrives. Capture, distil, promote,
   prune.
5. [Writing a domain ontology](llmeep/ontology/domain-ontology.md) — the extension point, if you
   *want* to describe your own project. Optional, kept wherever you like, nothing reads it, and
   not an install step. Write it when agents keep guessing your domain wrong, then
   `tm ontology <path>` so commits notice when it goes stale. You should not need to edit the
   core ontology.
6. Put your codebase in [`platform/`](platform/README.md).

<!-- adopt:end -->

---

**Everything below is about llmeep itself, not about your project.** When you adopt this
skeleton, delete from this line down and write your own — the sections above are the working
agreement and are worth keeping. Nothing in the tooling reads this file, so you can cut it
freely; the model lives in [`llmeep/tasks/_tooling/ontology.md`](llmeep/tasks/_tooling/ontology.md) and
[`llmeep/notes/_tooling/ontology.md`](llmeep/notes/_tooling/ontology.md), which survive any rewrite.

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
"that's next"            →   tm prioritise PLT-9puy
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

Full model: [`llmeep/tasks/_tooling/ontology.md`](llmeep/tasks/_tooling/ontology.md).

### The standup

Completed tasks fall out of `recent` as the window fills, so _what did we actually get done_
is the one question the working tree stops being able to answer. `tm standup` asks git instead.

**Usually it is a person.** Whoever runs the call types it and reads the output out;
`--send` posts it if the team wants it in writing. That needs no infrastructure, and it is the
case worth optimising for.

```sh
llmeep/tasks/_tooling/tm standup           # what closed this period, and what is still open
llmeep/tasks/_tooling/tm standup --send    # ...and post it to the team channel
```

Reports the day by default. Set `STANDUP_PERIOD` to `workday`, `bidaily` or `weekly` in
`.env` for a longer window; `workday` is `daily` that skips weekends and covers them on Monday.

**If you want it unattended**, `llmeep/tasks/_tooling/blueprints/standup.sh` is a blueprint for an always-on
machine: it fetches, then reports. Nothing here runs it — `tm standup --cron` prints the line
that would (at `STANDUP_AT`, default `09:00`), and you decide whether to schedule it
([`DEC-017`](https://github.com/stewartmegaw/llmeep/blob/main/decisions/DEC-017-the-standup-is-usually-a-person.md)).

**Close the task, then commit** — code, board and history land together:

```sh
llmeep/tasks/_tooling/tm done PLT-007
git commit -m "Fix flaky auth test. closes PLT-007"
```

The trailer makes the commit self-identifying, so `find` can recover it later and no SHA is
stored anywhere.

Listing is reading [the board](llmeep/tasks/platform/board.md); reordering is moving a line in it.
Neither needs a command. `add` and `go` search history automatically, so work that was already
attempted surfaces without anyone deciding to look.

## Adopting this skeleton

```sh
git clone --depth 1 <this-repo> /tmp/llmeep
cd my-project && /tmp/llmeep/adopt
```

**`adopt` is the only install.** It copies machinery — the tools, the hooks, the templates, the
ontology — and *builds* the record trees empty. Nothing llmeep records is copied, so nothing
llmeep records can arrive in your repo: no boards to clear, no history to reset, no marker file
explaining whose records those are. The clone you take it from can be any state at all
([`DEC-035`](llmeep/decisions/DEC-035-adopt-is-the-only-way-in.md)).

It also sets `core.hooksPath`, so validation runs from your first commit.

That is the whole setup — nothing else is required before your first task.
[Writing a domain ontology](llmeep/ontology/domain-ontology.md) is there when you want it, and
is not part of getting started.

### Adopting into a repo that already exists

The recipe above starts a project. To join one, run `adopt` from inside it — your code, your
history and your README are never touched:

```sh
git clone --depth 1 https://github.com/stewartmegaw/llmeep.git /tmp/llmeep
cd my-project
/tmp/llmeep/adopt --dry-run    # what it would do
/tmp/llmeep/adopt
```

It copies the four record trees and the agent adapters in, appends to `.gitignore` rather than
replacing it, installs the hooks, and clears llmeep's own records so you start empty.
**Restart your agent session afterwards** — skills are read at startup, so the two it just
installed are invisible to the session that ran it. Anything
already present is skipped and reported, never overwritten. **Your code stays where it is** —
`platform/` is not created, because an existing repo already has one.

It also copies itself in as `.llmeep`, which is how the repo updates later — see
[Updating](#updating).

Your README is not touched either, so the working agreement is written beside the install: it
is **`ops/README.md`** when nested, and **`LLMEEP.md`** at the root when not — a flat install
has no directory of its own, and `README.md` there is yours. Either way it holds the sections an
adopter needs, extracted from the region between the `adopt:` markers in this file, so it
cannot drift. Link to it from your own README.

Everything llmeep ships goes under one folder, so a repo that already has its own `tasks/`,
`notes/`, `decisions/` or `ontology/` collides with nothing. Rename the folder if `llmeep/`
itself is taken, or just because you would rather call it something else:

```sh
/tmp/llmeep/adopt --into ops    # ops/tasks/, ops/notes/, ops/decisions/, ops/ontology/
```

### Taking a newer release

`adopt` records what it installed — version and a checksum per file — in `.llmeep`. That is what
lets the same script update you later, from a fresh clone of the newer version:

```sh
/tmp/llmeep/adopt --update --dry-run    # what would change
/tmp/llmeep/adopt --update
```

It replaces **machinery only** — the two `_tooling/` trees, the ontology's core and principles,
the templates, the skills — and never a record. Both `history.tsv` files are excluded by name,
because they are records that happen to live inside machinery; boards, notes, captures,
decisions and any ontology of your own are never touched at all.

A file you have edited since installing is **reported and kept**, not overwritten; the checksums
are how it can tell. Re-run with `--force` once you have diffed it. Updates refuse to run
backwards, or from an unreleased clone onto a released install.

Nesting needs no configuration: `tm` and `nm` derive their roots from where they sit, and the
hooks resolve `tm` from their own location rather than the repo root. What does need adjusting,
`adopt` adjusts — the permission allowlist in `.claude/settings.json` and both `SKILL.md` files
are rewritten to the nested paths, since an allowlist that matches nothing prompts for every
command and a skill that names the wrong path sends your agent at a file that is not there.

**And cut this README back.** Everything from the `---` above down is about llmeep, not about
your project — delete it and write your own introduction in its place. Keep the sections above
the line: they describe how the tooling in this repo is driven, and they stay true whatever you
build in `platform/`.

### Branches and tags

**One branch, `main`, and a tag per version.** There is no release branch: it existed so a clean
tree could be cloned as a starting point, and with `adopt` building records empty there is
nothing for a clean tree to be cleaner than.

| Ref           | Is                                  |
| ------------- | ----------------------------------- |
| `main`        | The project. Development happens here |
| `v1`, `v2`, … | A version, tagged on `main`         |

`adopt --update` resolves a tag, so pinning still works exactly as before. A clone of `main`
carries llmeep's own boards, history and decisions — and that is now simply what a clone of a
project looks like, because nobody installs by cloning.

### Before cutting: `selftest`

```sh
python3 selftest                 # ~40s; needs release tags in the checkout
```

`tm check` validates records. `selftest` checks that the thing an adopter runs still works —
a fresh adopt, adoption into a repo that already has a `tasks/` directory, `--into ops`, and
**upgrades from previous releases**, which is the axis nothing else covers and where every
install bug so far has lived (`DEC-029`).

Run it before tagging. It never touches this repo; every case builds a throwaway repo in a temp
directory. Deliberately not in the pre-commit hook — a slow hook gets bypassed, taking `check`
with it.

### Collecting feedback from the repos that use this

`./sweep` reads drafts back out of every repo you list in `FEEDBACK_REPOS` — `:`-separated paths
in `llmeep/.env`, written down rather than scanned for. It prints; nothing sends.

**It lives at the root beside `adopt` and `selftest`, and it does not ship.** `adopt` walks
`tasks/_tooling` and `notes/_tooling`, so nothing here reaches an adopting repo. That placement
is the point: this was briefly `tm feedback --sweep`, which put a maintainer's tool into the
shipped executable, its `--help`, the shipped `.env.example`, the shipped ontology and the
shipped skill — and a client project's agent duly read it and offered to point their install at
a fork (`DEC-034`). Adopters have the drafting half, and that is all they ever needed.

A broken sweep must never read like a quiet week, so it separates the ways a repo can produce
nothing: deleted, no llmeep in it, an llmeep too old to have `tm feedback` at all, and a switch
nobody turned on. Only a repo that is current, opted in and had nothing to say reports as quiet.
A draft that appears to land on a decision already made is flagged rather than filtered — an
adopter re-proposing something settled is the most useful thing in the pile, since `adopt` ships
the principles and not the decisions, so they could not have known.

### Cutting a version

**A version is a tag on `main`.**

```sh
python3 selftest        # the install lifecycle still works
git tag v36 && git push origin main v36
```

That is all of it. There was a whole ceremony here until `DEC-035` — a write-once `release`
branch, a tree copied across and stripped, two `reset` commands, a `git rm` of the maintainer
tooling, and a `tm check --release` asserting the result was empty enough to hand to a stranger.
Every one of those steps existed because a release was something you could **clone and start
from**, so it had to arrive already clean.

Nothing clones a release any more. `adopt` copies machinery and builds records empty, so what a
tag contains stopped mattering: llmeep's boards, its decisions and its own maintainer scripts can
all sit in the tagged tree and none of them reaches anybody. The cut is a tag because there is
nothing left to cut.

## Status

**Taskman is built and in use** — this repo tracks its own work with it.
[`DEC-001`](https://github.com/stewartmegaw/llmeep/blob/main/decisions/DEC-001-taskman-design.md) (model),
[`DEC-002`](https://github.com/stewartmegaw/llmeep/blob/main/decisions/DEC-002-task-history-index.md) (history),
[`DEC-003`](https://github.com/stewartmegaw/llmeep/blob/main/decisions/DEC-003-skills-are-executables.md) (tooling),
[`DEC-004`](https://github.com/stewartmegaw/llmeep/blob/main/decisions/DEC-004-commits-close-tasks.md) (superseded),
[`DEC-005`](https://github.com/stewartmegaw/llmeep/blob/main/decisions/DEC-005-agent-mediated-git.md) (git).

Not yet done, and honest about it:

- **The domain-ontology guidance** has never been followed end to end on a real project, so
  its six steps are advice rather than experience.
- **Adopting into an existing repo** assumes you are starting fresh; a project with its own
  history has no path in yet (`PLT-7g78`).
- **Decisions have no `find`.** Twenty-five records and no way to search them, which is the
  precondition for ever pruning the folder (`PLT-cajd`).

Known limits, which are not bugs:

- **Validation checks consistency, not truth.** The hooks cannot tell you a task was closed that
  should not have been — this has already happened once here, and is recorded in the history.
- **Boards conflict on branches.** The resolution procedure in
  [`llmeep/tasks/_tooling/ontology.md`](llmeep/tasks/_tooling/ontology.md) exists but has never been run in anger.
- **Telegram fires on `done`, not on push**, so on a branch the team hears about work before
  they can pull it.

Open work is on the [platform board](llmeep/tasks/platform/board.md).
