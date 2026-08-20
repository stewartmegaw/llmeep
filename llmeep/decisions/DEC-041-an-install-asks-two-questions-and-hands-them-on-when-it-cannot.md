---
id: DEC-041
title: An install asks the two questions it cannot infer, and hands them to the agent when there is no terminal
status: accepted
decided: 2026-08-20
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-031, DEC-033, DEC-035, DEC-040]
---

# DEC-041 — An install asks the two questions it cannot infer, and hands them to the agent when there is no terminal

## Status

`accepted` — as of 2026-08-20.

## Context

[`DEC-040`](DEC-040-the-user-type-is-configuration-and-the-tool-announces-it.md) added
`USER_TYPE`, and [`DEC-033`](DEC-033-feedback-is-opt-in-drafted-locally-and-never-sent.md)
added `FEEDBACK`. Both are `.env` keys, both are off or unset by default, and both were
discoverable only by reading `.env.example` — a file an adopter has no particular reason to
open, since the install works without it.

So two settings that materially change the experience were, in practice, never set. `FEEDBACK`
had been in that state since it shipped.

The obvious fix is to ask at the end of an install, and the obvious objection is `PLT-eb7v`:
an agent read `adopt`'s closing output, took a pointer at the domain ontology as its next
instruction, and wrote a whole ontology nobody asked for. That produced
[`DEC-031`](DEC-031-the-domain-ontology-is-optional.md) and a standing caution about install
output being *performed* rather than read.

Underneath that objection is a harder constraint: **most installs are run by an agent, not
typed by a person.** There is no terminal, so a prompt reads EOF and nobody is ever asked. A
prompt alone would have been a feature that fires on a small minority of installs.

## Decision

**`adopt` asks two questions at the end of an install: `USER_TYPE` and `FEEDBACK`.** Answers go
into `.env`, appended, never overwriting a key already there. Enter declines, and declining
writes nothing — unset is a real state for both.

**With no terminal, the questions are written out and addressed to the agent, with an explicit
instruction to put them to the person and not answer them.**

That is deliberately the mechanism `PLT-eb7v` warned about, used the other way round. The
lesson from that incident is not *never address the agent reading this*; it is **never ask it
to answer on the adopter's behalf.** Handing a question to the person is the correction to that
failure, not a repeat of it. The ontology pointer stays exactly as `DEC-031` left it — described,
optional, not a step — because nothing about it is a question only the adopter can answer.

**Notifications are named, not asked.** Configuring one needs a bot token from an external
service, which an install cannot go and fetch. `adopt` says where they are configured and stops.

**`--update` asks nothing.** It names whichever keys are still unanswered, once. Re-asking on
every upgrade would make an answered question look unanswered, and an update is not a
conversation.

## Alternatives considered

- **Keep describing both settings in the closing text, as now.** The status quo, and the
  reason this task exists: `FEEDBACK` has been documented that way since it shipped and is
  effectively never on. Describing a question is not asking it.
- **Prompt only at a terminal, and say nothing otherwise.** Safe, and it fails the common case.
  Most installs are agent-run, so the questions would almost never be asked at all — which is
  the state this decision exists to fix.
- **Have the skill ask on first use** instead of the installer. Genuinely attractive: the skill
  is where the conversation with the person already is. Rejected because it needs state to know
  whether it has asked before, and a skill that opens by interrogating the user is worse than
  an installer that closes by doing it. Also, `SESSION_BUDGET` (`DEC-037`) has no room.
- **Pick defaults and let people change them.** `coder` and `FEEDBACK=off` would both be
  reasonable. Rejected: one decides how somebody is spoken to and the other spends their
  tokens, and a default is a decision taken quietly from the person it affects.
- **Ask about notifications too.** Rejected — it is not answerable in a word. It needs a token
  from BotFather, which is a separate errand with its own verification step (`tm check --notify`).
- **Write the answers into a committed file** rather than `.env`. Rejected for the reason
  `DEC-040` gives: both settings are per-person, and a committed answer makes one adopter's
  choice everyone's.

## Consequences

- **Install output now contains a block that instructs an agent.** That is a mechanism worth
  using sparingly, and the boundary is narrow: hand over questions, never work. Anything added
  there later has to pass that test explicitly.
- **`adopt` can create `.env`**, which nothing did before. It appends and never overwrites, and
  the selftest fixture that used to truncate `.env` had to be corrected — a fixture silently
  discarding what the code under test wrote is a failure that surfaces somewhere else entirely.
- **The interactive path is real code that only a person reaches**, so it is tested under a
  pty. Without that, half the feature would be exercised by nothing.
- **An upgrading adopter is told once**, and only about what is still open. Someone who has
  answered both sees no change.
- **Two questions is the ceiling, not a pattern to extend.** An install that ends in a
  questionnaire is one people learn to skip, and the next setting that wants asking should
  make the case against that rather than assume the slot.

## Revisit when

- A third setting genuinely needs asking, which is the point at which two questions becomes a
  form and the whole shape should be reconsidered.
- Agents stop reading install output as instruction, which would make the written-out branch
  useless rather than merely careful.
- Someone measures how often the written-out questions actually get put to a person. The whole
  design rests on that happening, and nothing verifies it.
