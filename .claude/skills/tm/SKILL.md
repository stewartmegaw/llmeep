---
name: tm
description: Task tracking — create, start, complete and search tasks. Use when the user refers to tasks, priorities, what to work on next, or completing work ("what's next", "start PLT-9puy", "commit task", "add a task for X", "have we tried this before").
---

# tm

**ADAPTER ONLY — no logic here.** All behaviour lives in `tasks/_tooling/tm`. If you find yourself
wanting to add rules to this file, they belong in the executable or in
`tasks/_tooling/ontology.md`, so that people using other agents get the same system
(`DEC-003`, principle 3).

Run from the repo root:

```sh
tasks/_tooling/tm add [-b] [-n] <title...>   # -b business ledger, -n prioritise it
tasks/_tooling/tm go [id]                    # show the current task, or start the next one
tasks/_tooling/tm prioritise <id> [-n]       # backlog → prioritised, -n for the top
tasks/_tooling/tm park [id] [-n]             # return it to prioritised, unassigned
tasks/_tooling/tm done [id] [--force]        # complete it
tasks/_tooling/tm find <term>                # search every task ever completed
tasks/_tooling/tm standup [--send]           # the period's work; --send posts it
tasks/_tooling/tm standup --cron             # the crontab line, if scheduling it

tasks/_tooling/tm check                      # validate records (hooks and CI call this)
tasks/_tooling/tm check --notify [--send]    # verify the notification channel
tasks/_tooling/tm check --release            # validate a cut tree before committing a version
tasks/_tooling/tm reset [--yes]              # clear task records when adopting the skeleton
```

## Translating what the user says

| They say | You run |
| --- | --- |
| "what's next" / "what am I on" | `tm go` |
| "let's start PLT-9puy" | `tm go PLT-9puy` |
| "add a task for X" | `tm add X` — pass `-b` if the done-state is a business outcome |
| "that's the next thing" / "move X up" | `tm prioritise <id>`, `-n` for the top |
| "park that" / "I'm blocked on this" | `tm park` — returns it to `prioritised`, unassigned |
| "what is sam working on" | `grep @sam tasks/*/board.md` |
| "give this to sam" | `tm add -f sam <title>`, or `tm go <id> -f sam` |
| "commit task" / "that's done" | `tm done`, then `git commit` with `closes <id>` in the message |
| "have we done this before" | `tm find <term>` |
| "what did we get done this week" / "standup" | `tm standup` — **without** `--send` unless they ask to post it |
| "schedule the standup" / "how do I automate this" | `tm standup --cron`, and point at `tasks/_tooling/blueprints/standup.sh` |
| "I've just cloned this to start a project" | `tm reset` to see what goes, then `--yes` |
| "is the Telegram bot set up" / "post to the group instead" | `tm check --notify` — it lists every chat the bot can see; add `--send` only if they want a test message |

**You are the mobile interface.** Telegram sends completion notifications and nothing reads
its inbox — messages sent to the bot are ignored. Task management is this conversation,
wherever it happens (`DEC-006`).

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
`tasks/_tooling/history.tsv`.** `done` is the only command that writes a row there, so an
uncommitted change to it means the last task was closed and never committed. Do not key on
`board.md` — `add`, `go` and `park` all write it, and a task merely filed is not a task
waiting on a commit.

When you find them, **ask** — an `AskUserQuestion` with the closed task's id and title, offering
*commit it now* (recommended) or *start anyway*. Do not commit unasked; a commit is the user's
call. Do not stay silent either, which is the case this rule exists for.

The cost of not asking is not a tidiness one. `done` writes the board and history rows the
moment it runs, so a second task closed on top of the first leaves both sets of records in one
working tree with no way to split them by file. Recovering one commit per task then means
reverting work by hand to stage it — which is exactly what happened on 2026-08-03, cutting
llmeep's README title out and back in to keep two trailers honest.

Committing when asked keeps `closes <id>` meaning one commit, which is what `tm find` recovers
later. Two tasks in one commit is not fatal — two trailers in one message is legal — but the
link stops being one-to-one and the history gets harder to read back.

## Titles are handles

**A title is a shell argument, so quote it or use stdin.** A `;`, `&`, `|`, `(` or `)` in what
the user said will split the command and silently truncate the title — `tm` never sees the rest,
and the board looks fine because the fragment is still a valid title.

**120 characters, two sentences.** `tm add` refuses a longer title. When the user describes work
in a paragraph, do not put the paragraph in the title — write a short handle and put the rest in
a sidecar.

A sidecar is `tasks/<id>-<slug>.md`, or a **folder** `tasks/<id>-<slug>/` with a `README.md`
plus whatever else the task needs.

**Notes are a separate subsystem.** If the user pastes a transcript or wants something
remembered rather than done, that is `nm` — see its skill. A note becomes a task with
`nm promote`, not `tm add`, so the link back to the conversation survives.

## Rendering a standup

`tm standup` prints for a terminal. You are rendering for a phone, so give the headings weight
the plain text cannot — **bold each heading**, leave the body as it is, and keep the tool's own
wording and order. Do not re-summarise it; the point is that what you show and what Telegram
receives are the same report.

    **Standup · 2026-08-02 → 2026-08-03**

    **@stew**
    ✓ Fix flaky auth test

    **Priority**
    · Migrate config loader
    · Upgrade toolchain

    **Captured, not yet work**
    · Acme want SSO before they will renew

Same constraints as the board: **never a code block** — it scrolls sideways on a phone — and a
blank line after any `---`. No hint line; a standup is a report, not a menu.

## When asked for tasks, lift the tasks

**Read `tasks/*/board.md` first, every time** — never from memory, and never from the example
below. Ids are four random characters, so a plausible wrong one reads exactly like a right one.

Render the live state. **Nothing else** — no commentary on what is
outstanding, no suggestions about what to file, no summary of recent work. If they wanted
analysis they will ask for it.

**Render as markdown, never a code block.** A code block preserves column alignment but
scrolls horizontally on a phone, and this is read on a phone. Vertical length is the cheaper
cost — scrolling down is natural, scrolling sideways is not.

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

    ---

    *start · prioritise · done · park · drop · discuss*

Omit empty sections. Omit `recent` unless asked.

**`prioritised` is ordered and `backlog` is not.** Render them in that order and never
reorder either one yourself. Position in `prioritised` is priority, so it is information;
position in `backlog` is an accident of when something was filed, so reading it as a ranking —
or telling the user what is "top of the backlog" — invents a decision nobody made.

**End with the hint line** whenever the board is not empty — one italic line, no prompt, no
blocking. The verbs already work in conversation; the hint exists because someone who did not
design them has no way to know that.

**Do not number the lines.** Their order already conveys priority, and a number falsely
suggests a handle you can pass to a command.

A line with no `@name` is **unassigned and available** — that is the normal state for anything
nobody has started. Do not read it as missing data.

Say "nothing in the backlog" and stop if both boards are clear.

## Rules

**Never write a bare id in prose.** Attach a title snippet — `PLT-9wmv (add tm standup)`, not
`PLT-9wmv`. Ids are four random characters, chosen to be collision-proof rather than memorable,
and this gets read on a phone away from the repo. Rendered lists are exempt: the title is already
on the line.

- **You classify, the tool does not.** `add` always assumes the platform ledger. Decide from
  the routing rule in `tasks/_tooling/ontology.md` and pass `-b` yourself (principle 7).
- **Run `done` before committing**, so the board, history and code land in one commit.
- **Ask before starting a task on top of an uncommitted one** — see the rule above.
- **Include `closes <id>`** in the commit message when acceptance is met. That trailer is the
  permanent link between task and commit — nothing else records it.
- **Listing is reading `tasks/<ledger>/board.md`. Reordering is moving a line in it.**
  Neither is a command; do not invent one. `prioritise` is the exception, and only for
  `backlog` → `prioritised` — reordering *within* `prioritised` is still a hand edit.
- **`tm add` files into the pool, not the queue.** A bare `tm go` will not pick it up. If the
  user says the thing they just filed is what they are doing next, that is `tm add -n` or a
  following `tm prioritise` — say which you used.
- **Resolving a board merge conflict** follows the table in `tasks/_tooling/ontology.md`, not a
  textual merge.
- **`tm standup` prints; `tm standup --send` broadcasts.** Nothing in the repo triggers a
  send — a scheduler does. Never add `--send` on your own initiative.
- **The standup is usually read aloud, not automated.** `--cron` prints a line for an
  always-on machine; scheduling it is the user's call, and nothing here does it for them.
- **`tm check --release` runs inside a cut tree**, not here. It asserts what a release must be
  — empty records, no `UNADOPTED.md`, decisions cleared, the directories git cannot carry, no
  dead relative links — and every one of those was a defect that shipped before it existed.
- **`check` never sends anything.** `--notify` reports configuration; only `--send` posts, and
  that reaches a whole team. Do not add it casually.
