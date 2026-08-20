---
name: tm
description: Tasks, standups and meeting agendas — create, start, complete and search tasks, report what shipped, build an agenda and send it, and search past decisions. Use when the user refers to tasks, priorities, what to work on next, completing work, a standup, an agenda, or why something was decided ("what's next", "start PLT-9puy", "commit task", "new agenda", "standup", "why is it like this", "have we tried this before").
---

# tm

**ADAPTER ONLY — no logic here.** All behaviour lives in `llmeep/tasks/_tooling/tm`. If you find yourself
wanting to add rules to this file, they belong in the executable or in
`llmeep/tasks/_tooling/ontology.md`, so that people using other agents get the same system
(`DEC-003`, principle 3).

Run from the repo root:

```sh
llmeep/tasks/_tooling/tm add [-b] [-n] <title...>   # -b business ledger, -n prioritise it
llmeep/tasks/_tooling/tm go [id]                    # show the current task, or start the next one
llmeep/tasks/_tooling/tm prioritise <id> [-n]       # backlog → prioritised, -n for the top
llmeep/tasks/_tooling/tm park [id] [-n]             # step it back one section, unassigned
llmeep/tasks/_tooling/tm done [id] [--force]        # complete it
llmeep/tasks/_tooling/tm drop <id>                  # remove one that should not have been filed
llmeep/tasks/_tooling/tm find <term>                # search every task ever completed
llmeep/tasks/_tooling/tm review [--reply <text>]    # LLM review of HEAD before pushing
llmeep/tasks/_tooling/tm why <term|DEC-000>         # search decisions, or explain one
llmeep/tasks/_tooling/tm why --stale [--yes]        # records nothing references; --yes prunes
llmeep/tasks/_tooling/tm standup [--send]           # the period's work; --send posts it
llmeep/tasks/_tooling/tm standup --cron             # the crontab line, if scheduling it
llmeep/tasks/_tooling/tm agenda [--send]            # what a meeting must get through
llmeep/tasks/_tooling/tm ontology [<path>|--none]   # where this repo's domain ontology lives
llmeep/tasks/_tooling/tm feedback [<text>|-]        # note what llmeep got wrong; opt-in, never sent
llmeep/tasks/_tooling/tm audience                   # how this user wants to be talked to

llmeep/tasks/_tooling/tm check                      # validate records (hooks and CI call this)
llmeep/tasks/_tooling/tm check --context            # what an agent carries, measured
llmeep/tasks/_tooling/tm check --notify [--send]    # verify the notification channel
```

## Who you are talking to

**Run `tm audience` first and write the way it says.** Per-person, in `.env` — not the same
for the next person here.

## Translating what the user says

| They say | You run |
| --- | --- |
| "what's next" / "what am I on" | `tm go` |
| "let's start PLT-9puy" | `tm go PLT-9puy` |
| "add a task for X" | `tm add X` — pass `-b` if the done-state is a business outcome |
| "that's the next thing" / "move X up" | `tm prioritise <id>`, `-n` for the top |
| "park that" / "I'm blocked on this" | `tm park` — steps it back one section, unassigned |
| "not next after all" / "deprioritise X" | `tm park <id>` — a ranked task steps back to the pool |
| "what is sam working on" | `grep @sam llmeep/tasks/*/board.md` |
| "give this to sam" | `tm add -f sam <title>`, or `tm go <id> -f sam` |
| "commit task" / "that's done" | `tm done`, then commit with `closes <id>` |
| "drop that" / "we're not doing that" | `tm drop <id>` — removes the line, writes no history |
| "let's discuss PLT-9puy" / "that title is vague" | talk it over; record the outcome with the ordinary verbs |
| "have we done this before" | `tm find <term>` |
| "review this" / a push refused as unreviewed | `tm review` — then fix, or `--reply` to argue a point back |
| "why is it like this" / "what did we decide about X" | `tm why <term>`, then `tm why DEC-000` |
| "can we tidy the decisions" | `tm why --stale` — **without** `--yes`. Unreferenced is not finished with; the subject test is the user's |
| "what did we get done this week" / "standup" | `tm standup` — **without** `--send` unless they ask to post it |
| "schedule the standup" / "how do I automate this" | `tm standup --cron`, and point at `llmeep/tasks/_tooling/blueprints/standup.sh` |
| "is the Telegram bot set up" / "post to the group instead" | `tm check --notify` — it lists every chat the bot can see; add `--send` only if they want a test message |
| "our domain model is in docs/" / a commit says no ontology is recorded | `tm ontology <path>`, or `--none` |
| "llmeep should really do X" / friction with the tooling itself | `tm feedback "<what happened>"` — see below |

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

## After committing, if feedback is on

Off by default, and `tm feedback` refuses while it is — so run it, and if it says off, this
section is over. When on, one short pass on one question: **did llmeep's machinery get in the
way, or is something missing its principles imply?** Usually nothing; a pass that always finds
something is manufacturing noise. `tm feedback "<what happened>"`.

**Never about this project** — no code, file names, domain terms or task titles. If the point
needs one, do not write it. Rubric: `llmeep/tasks/_tooling/ontology.md`.

## Building an agenda

`tm agenda` creates the draft and says so. **Then stop** — no listing, no suggestions. They have
`tasks`, `notes` and `tm why` for looking things up.

**You write `llmeep/.notes/agenda.md`** as they talk, and **everything is reshaped into this
form** — pasted prose, a task id, a note plus a passing thought. Nothing goes in verbatim.

    1. Injury Database – Value?

    - What's the value proposition of the component
    - Who would pay for it?

    Next Steps

**No markdown.** A heading is a plain numbered line, a bullet is a hyphen. It is going to a chat
message, where `##` renders as `##` — strip it out of anything they paste. `Next Steps` stays last.

**A section is a topic, not a record.** Most of an agenda corresponds to nothing in the repo —
strategy, open questions.

**Their words go in; what you find is offered.** Search each topic they raise — `tm find`, the
boards, `nm find`, `tm why` — then name the aligned records **once per section** and wait for a
yes. Nothing you found goes in unasked.

**Print the whole agenda after every change.** It goes out under their name and gets read aloud;
nothing should reach the meeting they have not seen.

**Offer the gaps back too.** A question nobody can answer yet is a note; something that plainly
has to be done is a task. Never file unasked — turning every unknown into a record buries the
few that matter.

`--send` posts it under a dated heading, body as written — never unasked. A later `tm agenda`
says `sent <date>`, and `edited since` if it moved on.

## `discuss` is yours, `drop` is the tool's

Both are on the board's hint line, and they resolve opposite ways for the reason
[principle 7](../../../llmeep/ontology/principles.md) gives.

**`drop` changes a record, so it is a command.** `tm drop <id>` removes the line and its sidecar
and writes no history — nothing happened. Never use `done` instead: that files a completion and
broadcasts one for work nobody did.

**`discuss` changes nothing, so it is not.** It means *talk this task over and sharpen it*: read
the sidecar, ask what "done" looks like, propose a better title. Record the outcome with the
verbs that exist. There is no `tm discuss` — a command that only starts a conversation does
nothing.

## A rejected alternative is a decision, and nobody will prompt you

`check` enforces the *shape* of a decision and refuses a rewrite. Nothing prompts you to write
one, so **this is on you.**

**Before work that changes established behaviour, run `tm why <term>`.** If a decision already
covers it you are superseding, not editing, and finding that out now is cheaper than at commit
time when `check` refuses the rewrite.

**Afterwards, ask one question: would a reasonable person propose the opposite next month?**
If yes, write the decision — the rejected option and the reason are the record. Copy
`decisions/_template.md`, fill the frontmatter, and say what you considered and why not.

Not for bug fixes, renames, or anything whose opposite is obviously wrong. A decision per change
is how the folder becomes noise.

**Do not write one silently.** Say you have, and why — it is a claim the project stands behind,
not a side effect of the task.

## Titles are handles

**A title is a shell argument, so quote it or use stdin.** A `;`, `&`, `|`, `(` or `)` in what
the user said will split the command and silently truncate the title — `tm` never sees the rest,
and the board looks fine because the fragment is still a valid title.

**120 characters, two sentences.** `tm add` refuses a longer title. When the user describes work
in a paragraph, write a short handle and put the rest in a sidecar.

A sidecar is `llmeep/tasks/<ledger>/tasks/<id>-<slug>.md` — note the ledger — or a **folder** of
that name with a `README.md` plus whatever else the task needs.

**Notes are a separate subsystem.** If the user pastes a transcript or wants something
remembered rather than done, that is `nm` — see its skill. A note becomes a task with
`nm promote`, not `tm add`, so the link back to the conversation survives.

## Rendering a standup

`tm standup` prints for a terminal. You are rendering for a phone, so give the headings weight
the plain text cannot — **bold each heading**, leave the body as it is, and keep the tool's own
wording and order. Do not re-summarise it; the point is that what you show and what Telegram
receives are the same report.

    **2026-08-02 → 2026-08-03**

    **@stew**
    ✓ Fix flaky auth test

    **In progress**
    PLT  Migrate config loader — @sam

    **Priority (2)**
    PLT  Upgrade toolchain
    BUS  Renew the Acme contract

    **Backlog (11)**
    PLT  Replace the fixture loader
    BUS  Draft the pricing page
    …and 9 more

    **Captured, not yet work**
    · Acme want SSO before they will renew

**`PLT` and `BUS` are the tool's, not yours.** Both ledgers share one list, so the tag is the
only thing saying which is which — keep it, keep the two-space gap, and never add one to a line
the tool did not tag. Captured notes have no ledger and keep their `·`.

**The bracketed counts are the full sections, not what is shown.** Reproduce the count and the
`…and N more` line exactly; never recount from the lines you see. `Priority (0)` appears only
when nothing is ranked and the pool is not empty — the state a standup most needs to say out loud.

**Keep the tool's order.** Do not re-sort, do not read `Backlog` as priority, do not suggest
reordering the board to match.

Same constraints as the board: **never a code block** — it scrolls sideways on a phone — and a
blank line after any `---`. No hint line; a standup is a report, not a menu.

## When asked for tasks, lift the tasks

**Read `llmeep/tasks/*/board.md` first, every time** — never from memory, never from the example
below. Ids are four random characters, so a plausible wrong one reads like a right one.

Render the live state. **Nothing else** — no commentary on what is outstanding, no suggestions
about what to file, no summary of recent work. If they wanted analysis they will ask for it.

**Render as markdown, never a code block.** A code block scrolls sideways on a phone, and this
is read on a phone. Scrolling down is the cheaper cost.

`###` heading, then `---` under it, above the list. Bold the id. Blank line between tasks.
Tags become prose after an em dash.

**Leave a blank line after every `---`.** Without one the terminal renderer swallows the rule
into the line below and prints a literal `---PLT-9puy` — tested 2026-08-02. The blank line
before it is optional; the one after is not.

**Never link the ids.** A relative markdown link to a repo file renders as "unsupported link"
over Remote Control — tested 2026-08-01. Plain bold ids only.

    ### in progress
    ---

    **PLT-9puy**  Fix flaky auth test — @stew

    ### prioritised
    ---

    **PLT-k3f9**  Migrate config loader — @sam

    **PLT-2m4x**  Upgrade toolchain — blocked by PLT-9puy

    ### backlog
    ---

    **PLT-7t1p**  Drop legacy endpoint — *unassigned*

    **PLT-021**  Audit the retry timeouts — *unassigned*

    ---

    *start · prioritise · done · park · drop · discuss*

Omit empty sections. Omit `recent` unless asked.

**Never reorder `prioritised`.** Its position *is* the priority; rearranging it overwrites
someone's decision.

**Sort `backlog` newest-filed first**, matching the standup. It is a view — it changes what you
print, never what is in `board.md` (`DEC-027`). Undated lines sort last. Never call anything
"top of the backlog": sorted by date is not ranked by importance.

**Never print the date** (`DEC-030`). It is the sort key and nothing else. Beside a title it
reads as a deadline, which is exactly what a pool line does not carry.

**End with the hint line** whenever the board is not empty — one italic line, no prompt, no
blocking. The verbs already work in conversation; someone who did not design them has no way
to know that.

**Do not number the lines.** A number falsely suggests a handle you can pass to a command.

A line with no `@name` is **unassigned and available** — the normal state for anything nobody
has started, not missing data.

Say "nothing in the backlog" and stop if both boards are clear.

## Rules

**Never write a bare id in prose.** Attach a title snippet — `PLT-9wmv (add tm standup)`, not
`PLT-9wmv`. Ids are four random characters, chosen to be collision-proof rather than memorable,
and this gets read on a phone away from the repo. Rendered lists are exempt: the title is already
on the line.

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
