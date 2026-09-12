---
name: tm
description: Tasks — create, start, reword, prioritise, park, complete and search tasks, attach detail to one, and search what has already been done. Use when the user refers to tasks, priorities, what to work on next, completing work, or whether it is safe to clear ("what's next", "start PLT-9puy", "commit task", "park that", "have we done this before", "can I clear"). A standup is the standup skill, a meeting agenda is the agenda skill, and why something was decided is the decisions skill.
---

# tm

**ADAPTER ONLY — no logic here.** All behaviour lives in `llmeep/tasks/_tooling/tm`. If you find yourself
wanting to add rules to this file, they belong in the executable or in
`llmeep/tasks/_tooling/ontology.md`, so that people using other agents get the same system
(`DEC-003`, principle 3).

Run from the repo root. **`tm` below is `llmeep/tasks/_tooling/tm`** — the path is written once
here and nowhere else in this file.

```sh
tm add [-b] [-n] <title...>   # -b business ledger, -n prioritise it
tm status                     # where things stand; starts nothing, writes nothing
tm go [id]                    # show the current task, or start the next one
tm prioritise <id> [-n]       # backlog → prioritised, -n for the top
tm park [id] [-n]             # step it back one section, unassigned
tm done [id] [--force]        # complete it
tm retitle <id> <title...>    # reword one, keeping its id and its place
tm drop <id>                  # remove one that should not have been filed
tm detail [id] [--folder]     # attach a detail and tag the board line
tm find <term>                # search every task ever completed
tm board --chat [--recent]    # the board, rendered to pass on as it is
tm review [--reply <text>]    # LLM review of HEAD before pushing
tm ontology [<path>|--none]   # where this repo's domain ontology lives
tm feedback [<text>|-]        # note what llmeep got wrong; opt-in, never sent
tm audience                   # how this user wants to be talked to
tm handover                   # what this session holds that the records do not

tm check                      # validate records (hooks and CI call this)
tm check --context            # what an agent carries, measured
tm check --notify [--send]    # verify the notification channel
```

## Who you are talking to

**Run `tm audience` first and write the way it says.** Per-person, in `.env` — not the same
for the next person here.

## Translating what the user says

Speech that maps to a verb you would not guess from the list above. Everything else does.

| They say | You run |
| --- | --- |
| "what am I on" / "where were we" | `tm status` — reads, never starts. A `SessionStart` hook already ran it |
| "what's next" / "start the next thing" | `tm go` — **starts** the top of the queue if nothing is running |
| "park that" / "I'm blocked" / "deprioritise X" | `tm park [id]` — steps it back one section, unassigned |
| "what is sam working on" | `grep @sam llmeep/tasks/*/board.md` |
| "give this to sam" | `tm add -f sam <title>`, or `tm go <id> -f sam` |
| "commit task" / "that's done" | `tm done`, then commit with `closes <id>` |
| "review this" / a push refused as unreviewed | `tm review` — then fix, or `--reply` to argue a point back |
| "is the Telegram bot set up" / "post to the group instead" | `tm check --notify` — it lists every chat the bot can see; add `--send` only if they want a test message |
| "our domain model is in docs/" / a commit says no ontology is recorded | `tm ontology <path>`, or `--none` |
| "llmeep should really do X" / friction with the tooling itself | `tm feedback "<what happened>"` — it refuses if the switch is off, and says so |
| "can I clear?" / "am I safe to start fresh" | `tm handover` — what this session holds that the records do not |

**You are the mobile interface.** The channel is outbound only — nothing reads its inbox, so
task management is this conversation, wherever it happens (`DEC-006`).

## Every piece of work has a task, and it exists before the work starts

**When the user starts describing or planning work that does not correspond to a task in
progress, create it first.** Run `tm add <title>` and `tm go` before writing code — not
afterwards, and not at commit time.

This is the one rule with no mechanical backstop worth relying on. A hook can notice at commit
that `platform/` changed with nothing in progress, and it does warn — but by then the work is
finished, and a warning after the fact does not put it on the board. **You are the enforcement.**

It costs two seconds and it is what keeps the board equal to reality. Do not ask permission for
this; just create the task and say you have.

Exceptions worth not bothering about: typo fixes, formatting, a one-line config tweak. If you
would not mention it in standup, it does not need a task.

## Clearing is safe here, and saying so is your job

**When `done` says "nothing carries over", pass it on.** It prints that on every close, and
relaying it is the whole point: clearing early is the ordinary habit here, not the nervous one,
because `go` plus the board brings a session back.

**"Can I clear?" is `tm handover`, never a guess from how full the context feels.** It lists
what nothing on disk could reconstruct. The list is knowingly incomplete — a decision that
should have been written and was not is the most expensive thing a clear can cost, and nothing
detects it.

Never name a way to clear; that is the harness's, and its spelling is not yours to assume
(`DEC-043`).

## A closed task is committed before the next one starts

**Before `tm add` or `tm go`, check `git status` for uncommitted changes to
`llmeep/tasks/_tooling/history.tsv`.** `done` is the only command that writes there, so a change
to it means the last task was closed and never committed. Not `board.md` — `add`, `go` and
`park` all write that.

When you find them, **ask** — an `AskUserQuestion` with the closed task's id and title, offering
*commit it now* (recommended) or *start anyway*. Do not commit unasked; a commit is the user's
call. Do not stay silent either, which is the case this rule exists for.

Not a tidiness rule: two closes in one working tree cannot be split by file afterwards, so the
one-to-one link `tm find` reads back is lost. The ontology's **Git** section has the incident.

## `discuss` is yours, `drop` is the tool's

Both are on the board's hint line, and they resolve opposite ways for the reason
[principle 7](../../../llmeep/ontology/principles.md) gives.

**`drop` changes a record, so it is a command.** `tm drop <id>` removes the line and its detail
and writes no history — nothing happened. Never use `done` instead: that files a completion and
broadcasts one for work nobody did.

**`discuss` changes nothing, so it is not.** It means *talk this task over and sharpen it*: read
the detail, ask what "done" looks like, propose a better title. Record the outcome with the
verbs that exist — `retitle` for sharper words, `detail`, `prioritise`, `park`, `drop`. Nothing
is a legitimate outcome too. There is no `tm discuss` — a command that only starts a conversation does
nothing.

## Titles are handles

**A title is a shell argument, so quote it or use stdin.** A `;`, `&`, `|`, `(` or `)` in what
the user said will split the command and silently truncate the title — `tm` never sees the rest,
and the board looks fine because the fragment is still a valid title.

**120 characters, two sentences.** `tm add` refuses a longer title. When the user describes work
in a paragraph, write a short handle and put the rest in the task's detail.

**`tm detail [id]` makes one** — file plus board tag, which `check` requires together, so
never write either by hand. `--folder` when a task needs several artifacts. Running it again
just prints the path, so it is safe to say when unsure. It lands under the task's own ledger.

**Notes are a separate subsystem.** If the user pastes a transcript or wants something
remembered rather than done, that is `nm` — see its skill. A note becomes a task with
`nm promote`, not `tm add`, so the link back to the conversation survives.

## Three workflows are other skills

Invoke `standup` when someone asks what shipped, `agenda` when they are preparing for a meeting,
and `decisions` for why something is the way it is — or when work is about to change, or has just
changed, behaviour the project already had. `done` asks about that one on every close.

## When asked for tasks, run `tm board --chat`

**Print what it gives you and nothing else** — no commentary on what is outstanding, no
suggestions about what to file, no summary of recent work. **Never in a code block:** that
scrolls sideways on a phone, and this is read on a phone.

`--recent` adds the completed window, when they ask for it. An empty board renders as "nothing
in the backlog", and that is the whole answer.

This was ten rules and a worked example here until `PLT-jzhh`. It is `board_sections` in `tm`
now, so every agent gets the render rather than only one reading this file, and the reasoning
behind each rule is **Rendering a board** in `llmeep/tasks/_tooling/ontology.md`.

## Rules

**Never write a bare id in prose** — to the user, or in a commit. `PLT-9wmv (add tm standup)`,
not `PLT-9wmv`: four random characters, read on a phone away from the board. Rendered lists are
exempt, the title is on the line. `commit-msg` warns and prints the text to paste, but only for
commits — what you say to the user is enforced by nobody.

- **You classify, the tool does not.** `add` always assumes the platform ledger. Decide from
  the routing rule in `llmeep/tasks/_tooling/ontology.md` and pass `-b` yourself (principle 7).
- **Run `done` before committing**, and put `closes <id>` in the message when acceptance is met.
  Board, history and code land together, and that trailer is the only record linking the two.
- **Never write to `board.md` yourself.** Every move between sections has a verb — `add`,
  `prioritise`, `go`, `park`, `done`, `drop` — so reaching for the file means you have the wrong
  verb, not that the tool is missing one (`DEC-036`). Reordering *within* `prioritised` is the
  one exception, and it is a hand edit by design.
- **`tm add` files into the pool, not the queue.** A bare `tm go` will not pick it up. If the
  user says the thing they just filed is next, that is `tm add -n` or a following
  `tm prioritise` — say which you used.
- **Resolving a board merge conflict** follows the table in the ontology, not a textual merge.
- **You do not pass your own review.** `tm review` marks the commit only when the reviewers have
  nothing left; you may fix a point or answer it with `--reply`, which goes back to *them*. There
  is no local override, and pushing unreviewed needs `--no-verify`, which is recorded.
- **Nothing sends on your initiative.** `standup --send` and `check --notify --send` each reach
  a whole team; add them only when asked. `--cron` prints a line for an always-on machine, and
  scheduling it is the user's call.
- **"no domain ontology is recorded" is a question for the user, not a job to do.** Ask where
  theirs is, or whether they want one, then `tm ontology <path>` or `--none`. Never write one
  because a warning mentioned it, and never answer `--none` for them (`DEC-032`).
