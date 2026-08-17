---
id: PLT-ehd6
title: Build a meeting agenda from tasks and notes, sendable to Telegram
created: 2026-08-17
---

# PLT-ehd6 — Build a meeting agenda from tasks and notes, sendable to Telegram

## Outcome

Someone builds an agenda by talking to the agent — pulling in blocked tasks and unpromoted
notes, ordering them, saying why each is on there — and posts it to the team channel. Nobody
writes an agenda by hand and nobody arrives without one.

## Context

**An agenda is not a standup.** `tm standup` looks backwards: what closed this period, what is
in progress, what is queued. An agenda looks forwards, and the useful question is narrower —
*what cannot move without people in a room?* Most of a standup is exactly the material an
agenda should leave out, because it is going fine and needs no one's attention.

That distinction has to hold or this becomes a second standup with a different heading.

### The signals already in the records

Nothing needs inventing to make a first version useful:

- **`blocked:PLT-xxxx` tasks.** The strongest signal there is. A blocked task is a thing that
  will not move on its own, and the tag already says what it is waiting for.
- **Unpromoted notes.** `standup_notes()` already extracts them — captured, not yet work, which
  is precisely the "someone should decide whether this is real" pile. That function is also the
  precedent for reading across subsystems: it reads `notes/` directly and shrugs if it is
  absent, so neither subsystem requires the other (`DEC-022`).
- **The business ledger.** `BUS` items are outcomes rather than changes and tend to be the ones
  a meeting is actually for.
- **Tasks that have sat in progress.** `filed:` gives an age for pool lines; whether anything
  records how long something has been *started* needs checking.

### `discuss` is not this

The board's hint line ends `*start · prioritise · done · park · drop · discuss*`
(`.claude/skills/tm/SKILL.md:223`) and nothing implements it. It is tempting to make it mean
"mark this for the agenda" — but it already means something else: *talk this task over with the
agent to sharpen it*, a working verb about one task, not a meeting. Filed separately as
`PLT-gx39`. **Do not take that word for this feature.**

So the agenda needs verbs of its own.

## Settled: the agenda is a rendering, not a fourth record

**It rides on tasks and notes and gets no permanent home of its own.** The test: what does an
agenda know that the records do not? Titles, blocked-by, owner, what was captured — all already
in `board.md` and `notes.md`. A stored agenda is a second copy that goes stale the moment
someone closes a task, which is the thing this project opens by rejecting.

**Three things it produces are not derivable** — the selection, the order, and any per-item
framing. Those are human judgement and would otherwise be lost. So the question is not *record
or not* but *how long do they need to live*, and the answer is: until the meeting ends.

So the draft is local and disposable — see [Where the draft lives](#where-the-draft-lives) for
why that is *not* `.notes/` despite the description fitting. **What survives is what the meeting
produced**: tasks filed or reprioritised, decisions written, notes promoted. The same pipeline
`DEC-012` already sets for transcripts — distilled, not stored.

Consequences worth stating so they are not re-argued:

- **Recurrence needs no agenda history.** A task still blocked next week regenerates its own
  signal. The durable state is the task's, and it is already durable.
- **"Prove we discussed X on the 14th" is minutes, not an agenda**, and the answer is a note or
  a decision. Keeping them separate stops a business need smuggling persistence into this.
- **The order never goes on the board line.** Position in `prioritised` already means priority;
  an agenda order is a different order for a different purpose, and one line carrying both makes
  each less trustworthy.

## Settled: it is built conversationally, so the draft is real state

An agenda gets assembled across a conversation — *add that one, no not that one, move it up,
say why it is on there* — and possibly across days, while other work happens. The agent cannot
hold that between commands, so **the draft is a file**, not something reconstructed each time.

But a file is all it is. [Principle 2](../../../ontology/principles.md) puts mutation behind
tooling because records have invariants worth defending; a scratch draft has none, so it gets
the same bounded exemption reordering already has.

### Two commands, and editing in between

**`tm agenda`** gathers candidates and seeds the draft. **`tm agenda --send`** posts it. That is
the whole surface.

An earlier pass here listed six verbs — add, drop, reorder, annotate, show, send — and that was
wrong. The model already answers it: *listing is reading the board, reordering is moving a line
in it, and neither is a command.* Reordering is the highest-frequency operation in the system
and deliberately has no tooling, because there is no invariant to break. A scratch file has no
invariants at all, so the argument is stronger here, not weaker. The agent edits markdown; that
is what the conversation already is.

**`--send` posts the file's contents without parsing them.** No structure, no format contract,
nothing for the draft and the sender to drift apart over — the failure that had to be designed
around for `feedback.md`. Whatever the agent wrote is what the team receives, which is also the
only version anyone can check before it goes.

**A picker is an adapter, never the mechanism.** In Claude Code the same gathering step can be
`AskUserQuestion` over blocked tasks and unpromoted notes — but that widget is vendor-specific,
and [principle 3](../../../ontology/principles.md) with `DEC-003` are unambiguous that an
adapter holding behaviour gives users of other agents a different system. It may only produce
the same edits a person would make by hand.

### Where the draft lives

**`.notes/`, as a draft in scratch.** An earlier pass ruled that out on the tree's own contract —
*nothing may depend on `.notes/`* — and applied it too literally. That rule is about **sources of
truth**, and its stated purpose is that a teammate cloning the repo gets none of it and nothing
breaks. An agenda draft passes: delete it and a few minutes of picking are lost, not
information, because every task and note it points at is still there.

That is what separates it from `feedback.md`, which sits at the install root instead. Those
drafts are the only copy of their content and another program collects them later, which makes
them truth. A selection over records that already exist is not. `.notes/README.md` lists
"drafts" under `scratch/` in as many words.

The ergonomics settle it either way: an agent resuming work looks in `.notes/`, which is exactly
the case of someone assembling an agenda over a couple of days while doing other things.

`tm agenda` must therefore treat a missing draft as normal and start a fresh one — never an
error, because a teammate's checkout has none by design.

## Design constraints

- **`tm agenda`, following `tm standup`.** Same subsystem, same shape: it crosses into notes the
  way the standup already does, so no new concept and no new cross-dependency.
- **Print by default; `--send` broadcasts.** The established discipline (`DEC-015`, `DEC-017`),
  and the agent rule is that `--send` is never added on anyone's own initiative. Reuse
  `notify_text` and the existing renderers — the channel is swappable and nothing here should
  learn its name (`DEC-008`).
- **Nothing schedules it.** A meeting has a time and a person; that person runs this. If someone
  wants it posted the morning of, that is a blueprint and their own cron line, exactly as the
  standup settled (`DEC-016`, `DEC-017`).
- **An empty agenda is a real answer** and should say so plainly, rather than padding itself
  with whatever is nearest. A meeting with nothing to decide is worth knowing about before it
  starts.

## Acceptance

- [ ] One command renders an agenda from tasks and notes, and it is visibly not a standup —
      nothing appears on it that is simply progressing normally
- [ ] Every item says why it is on the list: blocked by what, captured when, waiting on whom
- [ ] `--send` posts to the configured channel and nothing else does; a bare run only prints
- [ ] Nothing in the repo triggers it on a schedule
- [ ] An agenda with nothing on it says so in one line
- [ ] Two commands and no more: `tm agenda` and `tm agenda --send`
- [ ] A draft survives between sessions, and a missing one starts a fresh agenda rather than
      failing
- [ ] `--send` posts what is in the file, without parsing it
- [ ] The agenda is drivable from a terminal with no picker, and the picker adds no behaviour
      the command does not have
- [ ] No fourth record type: nothing about an agenda outlives the meeting except the tasks,
      notes and decisions it produced
- [ ] The word `discuss` is untouched by this task
