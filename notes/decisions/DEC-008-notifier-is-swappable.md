---
id: DEC-008
title: The notifier is swappable; Telegram is one implementation
status: accepted
decided: 2026-07-31
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-006, DEC-007, PLT-005]
---

# DEC-008 — The notifier is swappable; Telegram is one implementation

## Context

`notify()` was hardcoded to Telegram: it read `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` and
POSTed to `api.telegram.org`. Adding Slack would have meant editing the function every project
does not want to fork.

[`DEC-007`](DEC-007-stray-telegram-messages-are-ignored.md) recorded a consequence that looked
like a cost:

> **Configuration moved out of the repo.** The BotFather description is state in Telegram, not
> in version control, so a fresh clone cannot set it up.

**That framing was wrong.** The channel's configuration living in the service is not a leak —
it is the boundary. Everything about how the channel presents itself (bot name, description,
which room, who can see it, retention) belongs to the service and differs per team; the repo's
share is one line naming the channel and a secret. Which means the channel can be replaced
without touching a record, an ontology file, or a task.

The skeleton claims to be vendor-agnostic ([principle 3](../../ontology/principles.md)). A
hardcoded Telegram call was the one place that was false.

## Decision

**`NOTIFY` names the channel; a dict maps names to functions.**

```
NOTIFY=telegram | slack | webhook | none        (default: telegram)
```

```python
NOTIFIERS = {
    "telegram": notify_telegram,
    "slack":    notify_slack,
    "webhook":  notify_webhook,
    "none":     lambda text: None,
}
```

Each notifier takes rendered text, returns its own name on success, and returns `None` when
unconfigured — so `done` can report "not configured" without treating it as a failure.

**Adding a channel is one function and one dict entry.** That is the entire extension point:
no plugin loader, no registry, no config schema, no entry-point discovery. The dict *is* the
interface, and it stays readable at a glance.

**`tm check --telegram` becomes `tm check --notify`**, dispatching on the configured channel.
Setup is inherently per-channel — Telegram needs a wizard because nobody can guess a chat id;
Slack needs one URL — so `check` dispatches, while sending goes through `notify()` for all of
them.

**The out-of-repo configuration is stated as an advantage**, in `.env.example`, the root README
and `taskman/ontology.md`: the channel is external and replaceable *by design*.

## Alternatives considered

- **Leave it Telegram-only.** Simplest, and it worked. Rejected: it was the single concrete
  vendor lock in a project whose third principle is being vendor-agnostic, and the fix is a
  dict.
- **Generic webhook only — drop the named channels.** Purest, and it does cover Slack. Rejected:
  Telegram's API is not a plain JSON POST (form-encoded, token in the path, `chat_id` required),
  so "generic" would have meant dropping the channel that actually works today. `webhook` is
  offered *alongside* named ones, not instead.
- **A `taskman/notify` shell script the user rewrites.** Maximum flexibility, zero providers to
  maintain. Rejected: it ships broken — every adopter has to write a script before completions
  announce anywhere — and it adds a second executable to a subsystem that deliberately has one.
- **A plugin system with discovery.** Rejected as machinery for a problem the size of four
  functions.

## Consequences

- **Principle 3 is now true in code, not just in prose.** Nothing in `tm` names a vendor except
  one entry in a dict.
- **Telegram keeps working with no change** — it is the default, and existing `.env` files need
  no edit.
- **Four channels to keep working, not one.** `slack` and `webhook` are thin enough that this is
  cheap, but it is not free: neither has been exercised against a real endpoint, only against a
  missing-configuration path.
- **`NOTIFY=none` is a supported state.** A project that wants no announcements says so, rather
  than leaving credentials blank and relying on a silent skip.

## Revisit when

- A channel needs richer payloads than one line of text — threading, attachments, per-task
  routing. The dict would then be passing a Task rather than a string.
- Someone needs two channels at once. The current shape sends to exactly one.
