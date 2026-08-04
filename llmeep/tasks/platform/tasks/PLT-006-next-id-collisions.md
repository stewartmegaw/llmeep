---
id: PLT-006
title: Prevent next_id collisions across branches
created: 2026-07-31
---

# PLT-006 — Prevent next_id collisions across branches

## Outcome

Two branches cannot end up with two different tasks sharing one ID, and if they somehow do, it
is caught rather than silently carried.

## Context

`next_id` lives on the board. Two branches that each run `add` both read `6`, both allocate
`PLT-006`, and both write `next_id: 7`. Git merges that cleanly when the two lines land in
different places, or reports a trivial conflict that a person resolves by keeping one — either
way **two distinct tasks now share an ID.**

That is worse than the merge friction `DEC-001` knowingly accepted. A board conflict is
visible and annoying; this is silent and corrupting. Every reference by ID becomes ambiguous,
and `history.tsv` inherits the ambiguity permanently, since it is append-only.

Surfaced while tracing the design through a worked example on 2026-07-31.

## Acceptance

- [x] Two branches can each create a task and merge without producing a duplicate ID.
- [ ] If a duplicate ID reaches a board by any route, `pre-commit` rejects it, naming both.
      **Deferred to `PLT-001`** — this is a hook, and hooks are that task's scope. Allocation is
      collision-proof without it; this is defence in depth.
- [x] `history.tsv` cannot receive a second entry for an ID it already contains.
- [x] Whatever scheme is chosen, IDs stay short enough to say out loud and type — they are
      referenced constantly in commit messages and conversation.

## Approach

**Chosen: option 2, non-sequential IDs.** `PLT-` plus four characters from a 30-symbol
alphabet with `0/1/i/l/o` removed — `PLT-9puy`, `BUS-hg7f`. 810,000 values, and allocation also
checks locally, so a collision requires two branches to independently draw the same value.

`next_id` is deleted from the board entirely. A field that cannot exist cannot conflict, which
is why this beats deriving `max(seen) + 1`: that removes the *stored* counter but two branches
still compute the same next value, making collisions detectable rather than impossible.

Existing sequential IDs (`PLT-001`…`PLT-006`) remain valid and are not renumbered — IDs are
opaque strings and nothing requires them to be sequential. New tasks simply get the new form.
This is why the acceptance criterion is met without rewriting history.

**Cost accepted:** the implicit chronology of sequential numbering is gone. `PLT-9puy` does not
tell you it came after `PLT-003`. The board's order and `history.tsv`'s dates carry that
instead, and neither was relying on the ID.

Rejected: **derive from max** (detects, does not prevent) and **keep the counter, check on
merge** (leaves the window open between allocation and merge).

A resolution procedure now exists in [the ontology](../../_tooling/ontology.md) — the agent unions the
boards, re-derives `next_id`, and renumbers the loser of a duplicate. **That is a cure, not a
prevention.** Renumbering breaks the never-renumbered rule, and any commit trailer already
naming the old ID silently points at the wrong task and cannot be fixed without rewriting
history. The damage is done at allocation time; the merge only discovers it.

Agent-mediated git ([`DEC-005`](../../../decisions/DEC-005-agent-mediated-git.md)) shrinks
the exposure but does not remove it: two people with two agents on two machines collide exactly
the same way. **An ID scheme that cannot collide is the only fix independent of how the team
works** — which is the argument for option 2 over option 1.

## Log

- 2026-07-31 — created after a worked example exposed the collision.
- 2026-07-31 — implemented as non-sequential IDs; `next_id` removed from boards. Closed with
  `--force`: the `pre-commit` duplicate check is deferred to `PLT-001` by scope, not skipped.
