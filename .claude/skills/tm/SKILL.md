---
name: tm
description: Task tracking — create, start, complete and search tasks. Use when the user refers to tasks, priorities, what to work on next, or completing work ("what's next", "start PLT-9puy", "commit task", "add a task for X", "have we tried this before").
---

# tm

**ADAPTER ONLY — no logic here.** All behaviour lives in `taskman/tm`. If you find yourself
wanting to add rules to this file, they belong in the executable or in
`taskman/ontology.md`, so that people using other agents get the same system
(`DEC-003`, principle 3).

Run from the repo root:

```sh
taskman/tm add [-b] [-n] <title...>   # -b business ledger, -n top of the order
taskman/tm go [id]                    # show the current task, or start the next one
taskman/tm park [id] [-n]             # return it to the backlog, releasing your claim
taskman/tm done [id] [--force]        # complete it
taskman/tm find <term>                # search every task ever completed

taskman/tm check                      # validate records (hooks and CI call this)
taskman/tm check --notify [--send]    # verify the notification channel
taskman/tm reset [--yes]              # clear task records when adopting the skeleton
```

## Translating what the user says

| They say | You run |
| --- | --- |
| "what's next" / "what am I on" | `tm go` |
| "let's start PLT-9puy" | `tm go PLT-9puy` |
| "add a task for X" | `tm add X` — pass `-b` if the done-state is a business outcome |
| "park that" / "I'm blocked on this" | `tm park` — returns it to the `backlog` and releases your claim |
| "what is sam working on" | `grep @sam taskman/*/board.md` |
| "give this to sam" | `tm add -f sam <title>`, or `tm go <id> -f sam` |
| "commit task" / "that's done" | `tm done`, then `git commit` with `closes <id>` in the message |
| "have we done this before" | `tm find <term>` |
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

**120 characters, two sentences.** `tm add` refuses a longer title. When the user describes work
in a paragraph, do not put the paragraph in the title — write a short handle and put the rest in
a sidecar.

A sidecar is `tasks/<id>-<slug>.md`, or a **folder** `tasks/<id>-<slug>/` with a `README.md`
plus whatever else the task needs.

**Notes are a separate subsystem.** If the user pastes a transcript or wants something
remembered rather than done, that is `nm` — see its skill. A note becomes a task with
`nm promote`, not `tm add`, so the link back to the conversation survives.

## When asked for tasks, lift the tasks

Read the boards and render the live state. **Nothing else** — no commentary on what is
outstanding, no suggestions about what to file, no summary of recent work. If they wanted
analysis they will ask for it.

**Render as markdown, never a code block.** A code block preserves column alignment but
scrolls horizontally on a phone, and this is read on a phone. Vertical length is the cheaper
cost — scrolling down is natural, scrolling sideways is not.

Section name, then `---` on its own line (a setext H2: one construct gives you the heading and
the rule). Bold the id. Blank line between tasks. Tags become prose after an em dash.

    in progress
    ---

    **PLT-9puy**  Fix flaky auth test — @stew

    backlog
    ---

    **PLT-k3f9**  Migrate config loader — @sam

    **PLT-2m4x**  Upgrade toolchain — blocked by PLT-9puy

    **PLT-7t1p**  Drop legacy endpoint — *unclaimed*

Omit empty sections. Omit `recent` unless asked.

**Do not number the lines.** Their order already conveys priority, and a number falsely
suggests a handle you can pass to a command.

A line with no `@name` is **unclaimed and available** — that is the normal state for anything
nobody has started. Do not read it as missing data.

Say "nothing in the backlog" and stop if both boards are clear.

## Rules

- **You classify, the tool does not.** `add` always assumes the platform ledger. Decide from
  the routing rule in `taskman/ontology.md` and pass `-b` yourself (principle 7).
- **Run `done` before committing**, so the board, history and code land in one commit.
- **Include `closes <id>`** in the commit message when acceptance is met. That trailer is the
  permanent link between task and commit — nothing else records it.
- **Listing is reading `taskman/<ledger>/board.md`. Reordering is moving a line in it.**
  Neither is a command; do not invent one.
- **Resolving a board merge conflict** follows the table in `taskman/ontology.md`, not a
  textual merge.
- **`check` never sends anything.** `--notify` reports configuration; only `--send` posts, and
  that reaches a whole team. Do not add it casually.
