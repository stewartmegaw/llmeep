---
id: DEC-006
title: Telegram is notification-only; task management is conversational via an agent
status: superseded
decided: 2026-07-31
deciders: [stew]
supersedes: []
superseded_by: [DEC-007]
relates_to: [DEC-003, DEC-005, PLT-005, PLT-5pk8]
---

# DEC-006 — Telegram is notification-only; task management is conversational via an agent

> **Superseded by [`DEC-007`](DEC-007-stray-telegram-messages-are-ignored.md) on 2026-07-31.**
>
> The core decision stands: Telegram is outbound only, inbound task entry is gone, and task
> management is conversational through an agent. What changed is one sub-decision — how stray
> messages *to* the bot are handled. This document chose an auto-reply drained inside
> `notify()`; `DEC-007` replaces that with a BotFather description and silence.

## Context

`PLT-5pk8` added inbound Telegram: `/add` messages became tasks, `/list` returned the board.
It worked, and it was tested end to end.

It was also redundant. **Claude Code runs on mobile**, and an agent with the repository in
context does the same job conversationally — *"what am I on?"*, *"start PLT-9puy"*, *"add a
task for X"* — with no command syntax to remember, no `-b` flag to get right, and no pull step
before the task lands on the board. Any other agent with repo access can do the same.

Once that was true, the inbound half was a worse version of something already available from
the same phone.

## Decision

**Telegram is outbound only.** `done` announces completions; nothing else.

**Anything sent to the bot gets one reply** telling the sender it takes no commands and
pointing at the agent. A message into a bot that answers nothing reads as broken.

**The reply is folded into the notify path**, not given its own command. `notify()` drains
pending updates after sending and answers each once. A standalone `tm inbox` — or worse, cron —
would be polling infrastructure for a message that carries no information anyone is waiting on.
Completions happen often enough.

**`tm inbox` is removed**, along with `/add` parsing, `/list`, and the board-summary renderer.
The skill count returns to four.

## Alternatives considered

- **Keep inbound alongside the agent.** Two ways to do one thing, one strictly worse, both
  needing maintenance. Rejected on the same grounds as every other duplication this project
  has deleted.
- **Leave inbound messages unanswered.** Simplest — no drain, no reply. Rejected: silence is
  indistinguishable from a broken bot, and the cost of answering is one call folded into work
  that already happens.
- **Keep `tm inbox` purely to send the notification-only reply.** A command whose entire job is
  to say "this does nothing" — and one that still needs remembering or cron. Rejected.
- **Poll on a cron for faster replies.** Infrastructure for a courtesy message. The reply is
  not time-sensitive by definition; it tells someone to go somewhere else.

## Consequences

- **The mobile path is now the agent, not the bot.** Telegram tells the team something
  finished; Claude Code is where work gets managed. That split is cleaner than the bot doing
  half of each.
- **One fewer skill, and one less thing to secure.** The chat-ID allowlist existed because
  inbound could write to the board. Nothing writes from Telegram now.
- `PLT-5pk8` stays in history as completed, because it was. This decision removes the feature
  it delivered; the history records that we built it, and this record says why it went.
- **Replies are delayed until the next completion.** Accepted: the reply is a signpost, not
  information.

## Revisit when

- Someone needs to file a task from a device where no agent is available.
- The team's Telegram group becomes a place people expect to interact rather than be notified.
