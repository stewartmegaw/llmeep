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
taskman/tm done [id] [--force]        # complete it
taskman/tm find <term>                # search every task ever completed
```

## Translating what the user says

| They say | You run |
| --- | --- |
| "what's next" / "what am I on" | `tm go` |
| "let's start PLT-9puy" | `tm go PLT-9puy` |
| "add a task for X" | `tm add X` — pass `-b` if the done-state is a business outcome |
| "commit task" / "that's done" | `tm done`, then `git commit` with `closes <id>` in the message |
| "have we done this before" | `tm find <term>` |

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
