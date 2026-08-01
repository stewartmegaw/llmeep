# Taskman

The whole of task tracking: vocabulary, format and operation, in one file.

It lives here rather than in `ontology/core.md` because it describes one subsystem —
[`ontology/README.md`](../ontology/README.md) explains the convention. The project-wide
ontology holds only what cuts across subsystems.

**Why any of this exists** — Jira friction, PRs with one developer, git as a database — is in
the [root README](../README.md) and not repeated here.
**Rationale and rejected alternatives:** [`DEC-001`](../notes/decisions/DEC-001-taskman-design.md),
[`DEC-002`](../notes/decisions/DEC-002-task-history-index.md).

```
taskman/
  tm               <- the executable; five commands
  ontology.md      <- this file
  history.tsv      <- every completed task; grep-only, never loaded
  platform/
    board.md
    tasks/         <- optional sidecars
  business/
    board.md
    tasks/
```

---

## Ledger

A tracked stream of work. There are exactly two.

| Ledger      | Prefix | Owns                                                        |
| ----------- | ------ | ----------------------------------------------------------- |
| `platform/` | `PLT-` | Work whose done-state is *the system behaves differently*.  |
| `business/` | `BUS-` | Work whose done-state is a business outcome.                |

- **Identity:** the literal strings `platform` and `business`.
- **Relates to:** has exactly one [Board](#board).
- **Notes:** both share one structure, one lifecycle and one set of skills. The split is about
  ownership and cadence, not mechanism — see [principle 5](../ontology/principles.md).

**Routing.** Code, infra, tooling, tests, tech debt and incident follow-ups are platform —
including work on taskman itself. Pricing, positioning, contracts, hiring, vendor selection,
customer research and recurring obligations are business, **even when delivering them needs
code**. The test is the done-state, not the activity.

When work genuinely spans both, put it on the board that owns the outcome and reference the
counterpart from a sidecar.

Business tasks run longer and vaguer, and with acceptance criteria optional nothing forces
them to sharpen. The check that still applies: if there is no outcome you would recognise on
sight, it is not a task — it is a note.

## Board

The single source of truth for a ledger's live state: which tasks exist, their order, what is
being worked on, and what was recently completed.

- **Identity:** one per [Ledger](#ledger), at `taskman/<ledger>/board.md`.
- **Contains:** [Tasks](#task) as lines. Nothing else — **no counter, no metadata.** A field
  that does not exist cannot conflict between branches (`PLT-006`).
- **Invariants:** IDs unique across both boards and history; **at most one task in `doing` per
  assignee**; at most 15 entries in `recent`; every `blocked:` and `detail` tag resolves.

```
# platform

## doing

PLT-004  Add request tracing              @stew
PLT-011  Migrate config loader            @sam

## open

PLT-007  Fix flaky auth test
PLT-002  Rework the retry policy          @sam  blocked:PLT-007  detail
PLT-009  Upgrade toolchain

## recent

2026-07-30  PLT-011  Cache warm on boot
2026-07-29  PLT-003  Drop legacy endpoint
```

- **Priority is position.** No P0/P1/P2. The question is never "is this a P1?" — it is "is
  this above or below that?", which is answerable. Labels inflate until everything is P1;
  positions cannot.
- **Status is section.** `doing` holds at most one task **per assignee**.
- **First token is the task's own ID.** Everything after the title is a labelled tag.
- **`blocked:PLT-007`** — cannot start until that task is done.
- **`@stew`** — who owns it. See [Assignee](#assignee).
- **`detail`** — a [Sidecar](#sidecar) exists. Its absence means the line is the whole task,
  so nothing goes looking.

### Reordering is a hand edit

One file holds both the tasks and their order, so moving a line cannot create drift — there is
no second place for it to disagree with. The highest-frequency operation in the system
therefore needs no tooling: **open the board, move the line.**

This is a deliberate, bounded exemption from [principle 2](../ontology/principles.md).
Anything with an invariant to break — allocating IDs, transitioning status, pruning — still
goes through a skill.

## Task

A unit of intended change. **One line on a [Board](#board).**

- **Identity:** `PLT-` or `BUS-` plus four characters from `23456789abcdefghjkmnpqrstuvwxyz`
  (no `0/1/i/l/o`) — `PLT-9puy`, `BUS-hg7f`. **Randomly allocated, never reused, never
  renumbered.** Random rather than sequential so two branches cannot allocate the same ID
  (`PLT-006`); 810,000 values, and `add` also checks locally before using one.

  Sequential IDs from before this change (`PLT-001`…) remain valid. An ID is an opaque string;
  nothing requires it to be ordered. The cost of losing implicit chronology is carried by the
  board's order and history's dates instead.

- **Lifecycle:**

  ```
  open → doing → done
  open → done           (small tasks; go/done pairs are friction at MVP pace)
  open → dropped        (delete the line; git keeps it)
  doing → open          (returned; no ceremony)
  ```

- **No review state**, deliberately. With one developer, or with AI-generated changes at
  volume, a review column tracks a step nobody performs. Where acceptance criteria exist, they
  are the quality gate.
- **Title:** a handle, not a description. **Capped at 120 characters**, with **two sentences**
  as the guide — the cap is enforced, the sentence count only warns, because counting terminal
  punctuation false-positives on "e.g." and version numbers and a heuristic that blocks
  legitimate work is worse than one that mentions it. The board is read far more often than any
  sidecar, so the title pays for width it does not earn.
- **Notes:** a title is the floor and usually the ceiling. A lengthy description of work that
  takes an hour is friction with no reader. Anything that will not fit belongs in a
  [Sidecar](#sidecar).

## Assignee

Who owns a task. An `@name` tag on the board line — the same shape as `blocked:` and `detail`,
so the format gains no new concept.

- **No tag means available**, not missing. `add` never claims — a filed task belongs to the team
  pool until someone starts it. Claiming on creation would make a task you filed *for* someone
  else yours, and their bare `go` would never offer it.
- **Identity is derived, never configured.** In order: `TM_USER`, `git config taskman.user`, the
  local part of `git config user.email`, then `git config user.name`. The email local part comes
  first because it is short, stable and already unique in a team, which a display name is not.
- **`go` claims, `park` releases, `done` records.** Starting a task assigns it to you; parking
  puts it back unclaimed; completing writes the name to `history.tsv` and the notification.
  `-f <name>` on `add` and `go` acts on someone else's behalf.
- **Bare `go` skips work claimed by others.** Name it explicitly to take it over.
- **Unclaimed tasks in `doing` are adopted** by the next `go` — otherwise a task started before
  a claim existed is invisible to its owner's WIP check, silently permitting a second.
- **Where git has no identity, claims are simply not made** and the behaviour degrades to a
  single shared slot.

Git already answers *who did* finished work — the commit author, via `find`. What it cannot
answer is *who owns* open work, and that is the case that causes two people to pick up the same
task. See [`DEC-010`](../notes/decisions/DEC-010-tasks-carry-an-assignee.md).

## Sidecar

Optional detail for a Task whose title was not sufficient.

- **Lives in:** `taskman/<ledger>/tasks/<id>-<slug>.md` — **or a folder** at
  `taskman/<ledger>/tasks/<id>-<slug>/` when one file is not enough. A folder's entry point is
  its `README.md`, the same "start here" convention the rest of the skeleton uses; a folder
  without one is an error, since there is nothing to read and no acceptance to find. Everything
  else in the folder is supporting material, and `go` lists it.
- **Frontmatter:** `id`, `title`, `created` — on the file, or on the folder's `README.md`.
- **Notes:** write one when the work is subtle, the acceptance is non-obvious, or the
  reasoning is worth keeping — **not by default.** Its absence is meaningful and free to
  check, because the board line carries the `detail` tag.

A folder suits a task that genuinely needs several artifacts — a spec *and* a rubric *and*
sample data. Forcing those into one markdown file is the same mistake as forcing them into a
title.

**Sections. All four are optional; omit rather than leave empty.**

| Section        | For                                                        | Effect                                    |
| -------------- | ---------------------------------------------------------- | ----------------------------------------- |
| **Outcome**    | What is true when this is done, observably.                | None. Write it when "done" is ambiguous.  |
| **Acceptance** | Checkable conditions, as a task list.                      | **`done` refuses until every box is checked.** Omit it and there is no gate. |
| **Context**    | Why this exists — the problem, not the solution.           | None. Skip if git already says it.        |
| **Log**        | Append-only, newest last, absolute dates.                  | None. For work spanning sessions.         |

Acceptance being both optional and load-bearing is the design: at MVP pace most tasks never
earn a sidecar, but where there is no reviewer, criteria are the only quality gate that
exists. You opt into the gate by writing it.

[`_template.md`](_template.md) is the copyable skeleton of the above — an artifact, not part
of this ontology. It carries no guidance, because guidance you delete on every use is friction.

## Window

The `recent` section of a Board: the last 15 completed Tasks, newest first.

- **Notes:** the Board's bound. When a sixteenth completes, the oldest is **pruned** — out of
  the working tree entirely. See [principle 6](../ontology/principles.md).

## History

The append-only index of every Task that has ever completed. The query layer for work that has
left the Window.

- **Lives in:** `taskman/history.tsv`. Written by `done`, one line per completion.
  **Append-only; never rewritten.**

  ```
  #date	id	ledger	title
  2026-07-30	PLT-011	platform	Cache warm on boot
  ```

- **No SHA is stored.** The completing commit says `closes PLT-011`, so it is self-identifying
  and always recoverable — `git log --grep="closes PLT-011"`. Storing it would be derived data
  that can go stale, and it was the sole cause of an ordering constraint that no longer exists.
  See [`DEC-004`](../notes/decisions/DEC-004-commits-close-tasks.md).

- **Never read whole — only grepped.** That is the whole distinction from a Board: a Board is
  always loaded and must stay bounded; History costs zero context because nothing loads it. It
  grows forever, and that is fine.
- It duplicates git deliberately. Git holds this already, but in a form that is expensive to
  query — reordering churns the board constantly, so the same task line appears added and
  removed dozens of times in `git log -p`. An index is not duplication; it is what makes the
  data cheap enough to search on every operation.

## Skill

One of five operations. Everything else — listing, reordering — is a file read or a hand edit.

**A skill is an executable command**, not a vendor artifact. Every agent can run a shell
command, and so can a person; it is the only common denominator that does not pick a winner.
One executable, `taskman/tm`, written in Python 3 with standard library only — no install
step. See [`DEC-003`](../notes/decisions/DEC-003-skills-are-executables.md).

| Skill  | Invocation           | Does                                                            |
| ------ | -------------------- | --------------------------------------------------------------- |
| `add`  | `tm add <title…>`    | Allocates the ID, appends to `open`. `-f <name>` assigns. **Searches History.** |
| `go`   | `tm go [id]`         | No id: shows what is in `doing`, or starts the top of `open` if nothing is. With an id: starts that one. **Searches History.** |
| `park` | `tm park [id] [-n]`  | `doing` → `open`, at the bottom (`-n` for the top). Releases the claim. |
| `done` | `tm done [id]`       | Defaults to whatever is in `doing`. Moves to `recent`, prunes, appends to History, notifies. Run **before** committing. |
| `find` | `tm find <term>`     | Greps History explicitly.                                        |

```sh
tm add Fix flaky auth test        # title needs no quotes; everything after the flags is the title
tm add -b Call three customers    # -b for the business ledger
tm add -n Fix the build           # -n puts it on top of the order
tm go                             # "what should I be doing?"
tm go PLT-007                     # start that one specifically
tm park                           # put it back; the next `go` picks something else
tm done                           # complete the current task
```

**Defaults do the work.** `add` assumes `platform`, since most tasks are. `go` and `done`
assume the current task, since WIP-1 means there is only ever one. Nothing that can be
inferred from state has to be typed.

> **`add` appends to the bottom; `go` takes from the top.** So `tm add X` followed by bare
> `tm go` starts whatever was already highest-priority, **not** X. That is correct — priority is
> position, and a new task has not earned the top — but it surprises people, and scripting the
> pair has closed the wrong task in practice. Use `tm add -n` if it really is next, or name it:
> `tm go <id>`.

`go` is the one that beats a tracker: with no argument it is a **context loader**, not a state
change. It answers "what am I doing?" and "what's next?" with the same command, and puts the
task, its sidecar, its blockers and any linked decisions in front of the agent.

### Why `park` is a command when reordering is not

Moving a line between `doing` and `open` breaks no invariant, so by the
[reordering exemption](#reordering-is-a-hand-edit) it could be a hand edit. It is a command
because **WIP-1 creates the need**: `go` refuses while `doing` is occupied, so anyone switching
tasks is pushed by the tool's own guard into editing the board — precisely what
[principle 2](../ontology/principles.md) exists to prevent. A tool that forces you to break its
own rule has to provide the way out.

Nothing in `tm` blocks deleting a line, so **dropping stays a hand edit**. The test is not "is
it a status transition?" but "does the tool leave you any other way?"

`park` returns a task to the **bottom** of `open` by default. A parked task is usually one you
could not continue; putting it back on top means the next bare `go` restarts it immediately.
`-n` for the case where it genuinely is still next.

### The tool does not classify

`add` defaults to `platform` and takes `-b` for business. It does **not** guess the ledger from
the title.

This is [principle 7](../ontology/principles.md) — judgement belongs to the agent, mechanism to
the tool. The routing rule is written down under [Ledger](#ledger); an agent invoking `tm` has
that rule and the surrounding context, so it classifies properly and passes `-b`. A script
inferring intent from keywords would be unpredictable *and* unintelligent, and wrong silently.

The same test applies to anything added later: **if a behaviour requires understanding what the
user meant, it does not belong in the executable.**

### Vendor adapters

A wrapper that surfaces these in an agent's native skill list is **ergonomics, never logic**,
and carries a header saying so:

```
.claude/skills/tm/SKILL.md   ->  runs ./taskman/tm
```

If an adapter contains behaviour, someone using a different agent gets a different system —
the exact failure [principle 3](../ontology/principles.md) exists to prevent.

### Discovery

An agent only uses a skill it knows exists, so the five commands are listed in the
[root README](../README.md) — the contract every agent reads. Discovery must not depend on an
adapter, because not every agent has one.

### Not skills

Two more subcommands exist. Neither touches a task, so neither is a skill:

| Command             | Does                                                             |
| ------------------- | ---------------------------------------------------------------- |
| `tm check [--staged]` | Validates records. What the hooks and CI both call.            |
| `tm reset [--yes]`  | Clears task records when the skeleton is adopted for a new project. Dry run unless `--yes`. See the [root README](../README.md). |

## Notifications — outbound, and swappable

`done` announces completions to whatever channel `NOTIFY` names:

```
NOTIFY=telegram | slack | webhook | none        (default: telegram)
```

```
✓ Fix the checkout redirect (PLT-9k2m)
platform · stew · 2026-08-01
```

**The channel is deliberately external and replaceable.** Everything about how it presents
itself — bot name, description, which room, who can see it, how long it retains — is configured
in the service, not in this repo. The repo's share is one line in `.env` and a secret. That is
the boundary, not a leak: swapping channels touches no record, no ontology file and no task.

**Adding a channel is one function and one dict entry** in `taskman/tm`. That is the whole
extension point — no plugin loader, no registry, no config schema. See
[`DEC-008`](../notes/decisions/DEC-008-notifier-is-swappable.md).

`tm check --notify` verifies the configured channel and walks its setup if it is missing. It
**does not send** — pass `--send` to post a test message. `check` never takes an action anyone
outside the machine can observe ([`DEC-009`](../notes/decisions/DEC-009-check-has-no-outward-side-effects.md)),
the same guard `reset` applies to destruction. **A failed send never fails a completion.**

### Nothing comes back in

Task management is conversational, through an agent that already has the repository in context
— *"what am I on?"*, *"start PLT-9puy"*, *"add a task for X"*. That works from a phone, needs no
command syntax, and lands the change on the board directly.

Inbound Telegram was built and then removed for being a worse version of it
([`DEC-006`](../notes/decisions/DEC-006-telegram-is-notification-only.md)). Messages sent to
the bot are ignored; say so in its BotFather description and send `/setcommands` an empty list,
which also removes the autocomplete that invites the message
([`DEC-007`](../notes/decisions/DEC-007-stray-telegram-messages-are-ignored.md)).

The rule generalises: **before building an input surface, check whether an agent with the
repository already does it better.**

## Git

**Prerequisite: project git commands go through the agent.** Not enforced — direct git use keeps
working, and `revert`, interactive rebase, CI and the 2am fix must never be blocked. But the
board only stays current if the agent is the one driving.

**Close the task, then commit.** Everything lands in one commit:

```sh
tm go PLT-007                              # board: open → doing
# ...work...
tm done PLT-007                            # board: doing → recent, history appended, Telegram sent
git commit -m "Fix auth test. closes PLT-007"   # code + board + history, together
```

Nothing parses the trailer at commit time. It is written so the commit is **self-identifying** —
`find` resolves it later with `git log --grep="closes PLT-007"`. That is why no SHA is stored
anywhere.

> **If you are an agent: run `done` before committing, and include `closes <id>` in the
> message** when the acceptance criteria are met. You have the sidecar and the diff at that
> moment — that is where the judgement belongs, and doing it in this order is what keeps the
> board and the commit consistent.
>
> **And create the task before the work, not after.** When the user starts planning something
> that is not in `doing`, run `tm add` and `tm go` first. The hook warns at commit time if
> `platform/` changed with nothing in `doing`, but that is a backstop, not the mechanism — by
> then the work is already done. Typos and formatting do not need a task; anything you would
> mention in standup does.

If a commit lands with a task still in `doing`, a hook prints one line:

```
PLT-007 still in doing — run `tm done PLT-007` if that commit finished it
```

Information, never a gate. No prompt, no network, no cost.

**What touches git:**

| Command | Writes               | Git                                 |
| ------- | -------------------- | ----------------------------------- |
| `add`   | board line           | none                                |
| `go`    | board, reads sidecar | none                                |
| `done`  | board, history       | none                                |
| `find`  | nothing              | `git log --grep` to resolve commits |

No `tm` command touches git state. Hooks only ever **validate** — they never mutate records.
See [`DEC-005`](../notes/decisions/DEC-005-agent-mediated-git.md).

### Hooks

One step, from a clean clone — `.git/hooks` is not committed, so git is pointed at the
committed directory instead:

```sh
git config core.hooksPath taskman/hooks
```

| Hook          | Runs                | Effect                                          |
| ------------- | ------------------- | ----------------------------------------------- |
| `pre-commit`  | `tm check --staged` | **Blocks** on record errors                     |
| `commit-msg`  | `tm check --msg`    | **Blocks** a `closes <id>` naming no such task   |
| `post-commit` | `tm check --nudge`  | Warns only — never blocks                       |

The hooks are three-line shell scripts calling `tm check`; the logic is in the executable, so
CI runs the identical checks with `tm check` and any failure reproduces without committing.

**Blocks** — duplicate IDs across boards and history, a reused ID, two tasks in `doing`, an
over-long or misordered `recent`, a dangling `blocked:` or `detail` tag, a sidecar with no board
line or a mismatched frontmatter id, a decision rewritten in substance without being superseded,
and a `closes` trailer naming nothing.

**Warns** — a task still in `doing` after a commit, `platform/` changed with nothing in `doing`,
new files under `platform/` while `ontology/domain/` is untouched, and commits that bypassed the
checks.

Checks read **records only**, never `platform/` source — the ontology-currency warning looks at
which files were added, not what is in them. That is what keeps hooks working regardless of the
language `platform/` is written in ([principle 3](../ontology/principles.md)).

`--no-verify` skips `pre-commit` and `commit-msg` but **not** `post-commit`, so bypassing is
noticed and appended to `.git/tm-bypassed`. Every later commit reports the standing count until
it is cleared. The escape hatch stays open, and it is not silent.

### Merging boards

Branches conflict on `board.md` — it is one file that everyone touches, the cost `DEC-001`
accepted knowingly. There is no tool for this: resolving it is judgement about what each branch
*intended*, which belongs to the agent. But judgement needs rules, or it improvises differently
each time. Apply these in order:

| Element        | Rule                                                                       |
| -------------- | -------------------------------------------------------------------------- |
| `open` lines   | **Union both sides.** A task added on either branch exists.                 |
| Ordering       | No correct answer. Keep the target branch's order; append the incoming branch's tasks below, preserving their relative order. Reprioritise afterwards if it matters. |
| `doing`        | If both sides have one, that breaks WIP-1. Keep whichever one's work is in the merge; return the other to the top of `open`. |
| `recent`       | Union, sort by date descending, prune to 15.                                |
| `history.tsv`  | Append-only, so both sides appended at EOF. Keep both lines, sort by date. Never drop one. |

**Duplicate IDs should now be impossible** — `PLT-006` made allocation random rather than
sequential, so there is no shared counter for two branches to race. If one appears anyway,
keep the ID an existing commit already references (`git log --grep="closes <id>"`) and give the
other a fresh one, recording the renumber in its log.

> **If you are an agent resolving a board conflict:** apply the table above rather than
> resolving textually. A textual merge will silently drop task lines, leave two tasks in
> `doing`, or drop a history row — all of which look fine in the diff.

### Natural language over a deterministic core

The agent translates intent into commands; the commands stay mechanical.

```
"lets start PLT-123"   →   tm go PLT-123
"commit task"          →   tm done PLT-123  &&  git commit -m "…. closes PLT-123"
```

This is [principle 7](../ontology/principles.md) again. The agent interprets; `tm` allocates IDs,
prunes to exactly 15 and appends rows — pure mechanism, where an off-by-one fails silently. An
agent editing the board by hand would still be a hand edit.

### Retrieval is automatic

Completed work leaves the working tree, so **an agent cannot see that something was already
tried, and will not think to look.** An instruction to search would lose that coin flip
indefinitely, so searching is not an instruction — it is a side effect of operations that
already happen.

```
$ do PLT-007
  PLT-007  Fix flaky auth test

  ⚠ related history
    PLT-041  Quarantine flaky auth tests      2026-04-02
    PLT-019  Retry auth handshake on timeout  2026-02-11
```

`add` catches duplicates at creation; `go` catches "we already tried this" before work starts.
Two rules keep it from decaying into noise: **at most 3 hits**, and **print nothing when there
are none** — a section that is usually absent gets read when it appears.

**The residual gap:** free-form discussion invokes no skill and so triggers no search. Nothing
mechanical covers that. If it proves to be where duplicated work starts,
[`DEC-002`](../notes/decisions/DEC-002-task-history-index.md) names the fix.

---

## Glossary

| Term         | Means                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| **board**    | The one file holding a ledger's live state.                             |
| **ledger**   | One of the two streams: `platform` or `business`.                       |
| **task**     | A unit of intended change. One line. Not "ticket", "issue", "story".    |
| **sidecar**  | Optional detail file for a task whose title was not enough.             |
| **window**   | The `recent` section — last 15 completed.                               |
| **prune**    | Drop an entry off the end of the window, out of the working tree.       |
| **history**  | `taskman/history.tsv`. Grep-only, never loaded.                         |
| **position** | A task's place in the `open` order. **This is its priority.**           |

### Words we avoid

| Avoid                      | Because                                                          | Use instead              |
| -------------------------- | ---------------------------------------------------------------- | ------------------------ |
| ticket, issue, story, card | Imply an external tracker's semantics we do not implement.       | **task**                 |
| backlog                    | Vague about ordering; the board defines a strict one.            | the `open` section       |
| priority (as a label)      | P0/P1/P2 inflate until everything is P1.                         | "above/below `PLT-004`"  |
| archive                    | There is no archive. Completed work leaves the tree.             | **history**, via `find`  |
| WIP                        | Not a status.                                                    | `doing`                  |
| in review                  | Not a state in this lifecycle, deliberately.                     | —                        |
