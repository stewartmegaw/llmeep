---
name: tm
description: Task tracking — create, start, complete and search tasks. Use when the user refers to tasks, priorities, what to work on next, or completing work ("what's next", "start PLT-9puy", "commit task", "add a task for X", "have we tried this before").
---

# tm

**ADAPTER ONLY — no logic here.** All behaviour lives in `taskman/_tooling/tm`. If you find yourself
wanting to add rules to this file, they belong in the executable or in
`taskman/ontology.md`, so that people using other agents get the same system
(`DEC-003`, principle 3).

Run from the repo root:

```sh
taskman/_tooling/tm add [-b] [-n] <title...>   # -b business ledger, -n top of the order
taskman/_tooling/tm go [id]                    # show the current task, or start the next one
taskman/_tooling/tm park [id] [-n]             # return it to the backlog, unassigned
taskman/_tooling/tm done [id] [--force]        # complete it
taskman/_tooling/tm find <term>                # search every task ever completed
taskman/_tooling/tm standup [--send]           # the period's work; --send posts it
taskman/_tooling/tm standup --cron             # the crontab line, if scheduling it

taskman/_tooling/tm check                      # validate records (hooks and CI call this)
taskman/_tooling/tm check --notify [--send]    # verify the notification channel
taskman/_tooling/tm reset [--yes]              # clear task records when adopting the skeleton
```

## Translating what the user says

| They say | You run |
| --- | --- |
| "what's next" / "what am I on" | `tm go` |
| "let's start PLT-9puy" | `tm go PLT-9puy` |
| "add a task for X" | `tm add X` — pass `-b` if the done-state is a business outcome |
| "park that" / "I'm blocked on this" | `tm park` — returns it to the `backlog`, unassigned |
| "what is sam working on" | `grep @sam taskman/*/board.md` |
| "give this to sam" | `tm add -f sam <title>`, or `tm go <id> -f sam` |
| "commit task" / "that's done" | `tm done`, then `git commit` with `closes <id>` in the message |
| "have we done this before" | `tm find <term>` |
| "what did we get done this week" / "standup" | `tm standup` — **without** `--send` unless they ask to post it |
| "schedule the standup" / "how do I automate this" | `tm standup --cron`, and point at `taskman/_tooling/blueprints/standup.sh` |
| "I've just cloned this to start a project" | `tm reset` to see what goes, then `--yes` |
| "is the Telegram bot set up" | `tm check --notify` — add `--send` only if they want a test message |

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

## When asked for tasks, lift the tasks

**Read `taskman/*/board.md` first, every time** — never from memory, and never from the example
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

    ### backlog
    ---

    **PLT-k3f9**  Migrate config loader — @sam

    **PLT-2m4x**  Upgrade toolchain — blocked by PLT-9puy

    **PLT-7t1p**  Drop legacy endpoint — *unassigned*

    ---

    *start · done · park · drop · discuss*

Omit empty sections. Omit `recent` unless asked.

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
  the routing rule in `taskman/ontology.md` and pass `-b` yourself (principle 7).
- **Run `done` before committing**, so the board, history and code land in one commit.
- **Include `closes <id>`** in the commit message when acceptance is met. That trailer is the
  permanent link between task and commit — nothing else records it.
- **Listing is reading `taskman/<ledger>/board.md`. Reordering is moving a line in it.**
  Neither is a command; do not invent one.
- **Resolving a board merge conflict** follows the table in `taskman/ontology.md`, not a
  textual merge.
- **`tm standup` prints; `tm standup --send` broadcasts.** Nothing in the repo triggers a
  send — a scheduler does. Never add `--send` on your own initiative.
- **The standup is usually read aloud, not automated.** `--cron` prints a line for an
  always-on machine; scheduling it is the user's call, and nothing here does it for them.
- **`check` never sends anything.** `--notify` reports configuration; only `--send` posts, and
  that reaches a whole team. Do not add it casually.
