---
id: DEC-007
title: Stray Telegram messages are ignored; BotFather says so, not code
status: accepted
decided: 2026-07-31
deciders: [stew]
supersedes: [DEC-006]
superseded_by: []
relates_to: [PLT-005, PLT-5pk8]
---

# DEC-007 — Stray Telegram messages are ignored; BotFather says so, not code

## Context

[`DEC-006`](DEC-006-telegram-is-notification-only.md) made Telegram outbound only and removed
inbound task entry. It kept one piece of inbound machinery: an auto-reply telling anyone who
messaged the bot that it takes no commands, drained inside `notify()` so it needed no command
and no cron.

That reply was built and it worked. But the cost was a drain function, a reply helper, an
offset file in `.git/`, and an extra HTTP call on every completion — to answer a message most
people will never send, once, and only *after* they had already been confused enough to send it.

Telegram already has the right surface for this, and it is free.

## Decision

**Messages sent to the bot are ignored.** Nothing reads its inbox.

**BotFather carries the message instead:**

```
/setdescription   Notifications only. Manage tasks by talking to Claude Code.
/setcommands      (send an empty list — the bot then advertises none)
```

The description shows in an empty chat **before** anyone types, which no reply can. Clearing
the command list removes the autocomplete that invites the message in the first place. So the
zero-code option is not merely cheaper — it acts earlier in the sequence, where the problem
actually is.

**Removed:** `drain_and_reply()`, `telegram_reply()`, `telegram_get()`, the
`.git/tm-telegram-offset` file, and the extra call in `notify()`. Roughly 3,100 characters.
`notify()` is now send-and-return.

## Alternatives considered

- **Keep the auto-reply.** It works and it is already written. Rejected: it solves the problem
  later and more expensively than a BotFather field, and "already written" is the sunk-cost
  argument, not a reason.
- **Keep it but move it behind a command.** `DEC-006` already rejected this — a command whose
  entire job is to say "this does nothing".
- **Say nothing anywhere.** Silence with no description does read as broken. The BotFather
  field is what makes ignoring acceptable; without it, this decision would be worse than
  `DEC-006`.

## Consequences

- **`tm` no longer reads from Telegram at all** — the integration is one outbound POST. Every
  helper that existed to receive is gone.
- **Configuration moved out of the repo.** The BotFather description is state in Telegram, not
  in version control, so a fresh clone cannot set it up — `tasks/_tooling/ontology.md` documents the
  two commands, but nothing enforces them.
- Someone who messages the bot gets silence. Accepted, because the description and the empty
  command list mean they should not have got as far as typing.

## Revisit when

- The BotFather description proves insufficient and people still message the bot expecting
  action.
- Telegram gains a native "this bot does not accept input" affordance that removes the need to
  say it in prose.
