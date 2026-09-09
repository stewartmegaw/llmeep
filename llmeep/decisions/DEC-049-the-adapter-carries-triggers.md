---
id: DEC-049
title: The vendor adapter carries triggers as well as permissions, and the answer stays in tm
status: accepted
decided: 2026-09-09
deciders: [stewart]
supersedes: []
superseded_by: []
relates_to: [DEC-003, DEC-027, DEC-043]
---

# DEC-049 — The vendor adapter carries triggers as well as permissions, and the answer stays in `tm`

## Status

`accepted` — as of 2026-09-09.

## Context

A session that has just started, or just been cleared, holds nothing. `DEC-043` makes that safe
— the records hold everything — and principle 8 makes it the design rather than a consolation.
But safe is not the same as oriented: the agent begins knowing nothing about the board and only
finds out if someone asks.

The obvious fix was a rule in the tm skill, and it cannot work. **A skill loads when its
subject comes up.** At the top of a session nothing has come up, so no instruction inside the
skill can fire before the first message that mentions tasks — which is exactly the case where
the prompt is not needed.

Nor could the answer be `tm go`. It shows what is in progress, and when nothing is, it *starts*
the top of the queue. Run unattended that picks someone's next task for them, which is the
judgement principle 7 keeps with a person and `DEC-027` keeps out of the pool.

## Decision

**Two halves, split on the vendor line.**

`tm status` is the portable half: what is in progress, what a bare `go` would take next, and
the two open counts. It writes nothing and starts nothing, and that is the whole reason it is
not `go`. Any agent, on any harness, can run it.

`.claude/settings.json` is the vendor half. It runs `tm status` on `SessionStart` — which
covers a fresh start and a context clear alike — and wraps the output in the JSON envelope
Claude Code injects as context. The event name and the envelope are the only Claude-specific
things in it.

This makes the adapter carry a **trigger** for the first time; until now it held permissions
only. That stays inside `DEC-003`'s "ergonomics, never logic": the trigger decides *when* to
ask, never *what the answer is*. The test it passes is that an agent with no such hook loses
the prompt and nothing else — the board, the verb and the answer are all still there.

## Alternatives considered

- **A rule in the tm skill** — rejected on the mechanics above. The skill is not loaded at the
  moment the rule would have to fire. This was the first design and it was wrong for a reason
  worth writing down, because it will look right again to the next person.
- **Have the hook run `tm go`** — rejected: it starts work. A trigger that runs unattended must
  not take a decision, and `go` takes the one decision the tool is most careful to leave alone.
- **Print the whole board** — rejected. It grows without bound, it is what the agent renders
  when *asked*, and a session-start injection that scales with the backlog gets skipped. Status
  orients; the board is one command away.
- **Include what `tm handover` reports** — rejected for now, though tempting: loose records mean
  the previous session ended mid-thought. But `handover` answers what a session held that the
  records do not, which is a question about an *ending* session. Pointing it backwards at a
  starting one needs its own thinking.
- **A `--json` flag on `tm status`** — rejected. It would put Claude Code's wire format inside
  the vendor-agnostic executable, which is principle 3 failing at exactly the point it exists
  for. The adapter wraps; the tool prints.

## Consequences

The board reaches the agent before the first question rather than after it, and a clear costs
one command instead of a conversation.

`.claude/settings.json` now runs on every session, so a broken command there is a broken
session start. It is covered three ways in `selftest`: the hook exists and names `tm status`,
its command is rerooted for a named-folder install (`PLT-wxr5`'s failure in a new place), and
the exact string the file holds is piped and its output parsed.

Adopters on other agents get `tm status` and no trigger. That is the honest state of a vendor
adapter, and the ontology now says what an adapter is allowed to carry.

The tm skill grew again — ~4,624 tokens against `PLT-2cyh`'s 4,000 budget. The `status` entry
replaced a translation-table row that pointed "what am I on" at `go`, which was the same trap
one level up, so the words earned their place even as the total got worse.

## Revisit when

A second trigger is wanted. One hook is an adapter; several is a runtime, and at that point the
line between ergonomics and logic needs redrawing rather than restating.
