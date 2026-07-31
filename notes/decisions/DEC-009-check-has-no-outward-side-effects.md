---
id: DEC-009
title: check has no outward side effects; visible actions are opt-in
status: accepted
decided: 2026-07-31
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-008, PLT-001]
---

# DEC-009 — `check` has no outward side effects; visible actions are opt-in

## Context

`tm check --notify` sent a real message every time it ran. Developing the swappable notifier
([`DEC-008`](DEC-008-notifier-is-swappable.md)) meant running it repeatedly, and each run
pinged a real phone — six times in one afternoon before anyone said anything.

That is not a testing accident. **A command named `check` sent a message to a whole team as a
side effect of validating configuration.** Anyone verifying their setup, or a CI job that
someday runs `tm check --notify`, would do the same.

The project already had the right instinct elsewhere: `tm reset` is a dry run unless `--yes`,
because it destroys records. The same logic applies to anything other people can see — but it
had only been applied to the destructive case, not the *visible* one.

## Decision

**`tm check` never takes an action anyone outside the machine can observe.** It reads state,
reports, and exits.

**Visible actions are opt-in with an explicit flag.** `tm check --notify` verifies the channel
is configured and reports where messages would go; `tm check --notify --send` posts a test
message.

**The rule generalises to anything named `check`**, including checks not yet written: a
validator may read anything, and may write only to stdout. If a check wants to prove a path
works end to end, that proof is a flag, not a default.

Destructive and *visible* are two axes of the same concern — an action you cannot take back.
`reset` guards the first; this guards the second.

## Alternatives considered

- **Leave it sending.** It is a test command; sending is what proves the channel works.
  Rejected: proving the channel works is occasional, and validating configuration is routine.
  The default should serve the routine case.
- **Send only when the channel is newly configured.** Would have stopped the repeat pings while
  keeping first-run confirmation. Rejected as state-dependent behaviour — "did it send?" would
  depend on invisible history, which is worse than a flag.
- **Route test messages somewhere quieter.** No such destination exists for Telegram, and
  inventing one per channel is machinery to avoid typing six characters.

## Consequences

- **Setup is now two commands, not one**: `--notify` to confirm configuration, then
  `--notify --send` to prove it. Accepted — the second is run once.
- **CI can call `tm check --notify` safely**, which it could not before.
- The Telegram helper's chat-id wizard still calls `getUpdates`, which is a network read. That
  is observation, not action, and stays.

## Revisit when

- A check is written whose only useful form is the side-effecting one, making the flag pure
  ceremony.
