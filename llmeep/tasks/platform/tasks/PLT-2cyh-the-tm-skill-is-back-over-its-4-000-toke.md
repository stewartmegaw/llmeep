---
id: PLT-2cyh
title: The tm skill is back over its 4,000-token budget; three verbs have been added since PLT-rsn4
created: 2026-09-04
---

# PLT-2cyh — The tm skill is back over its 4,000-token budget

## Outcome

The tm skill is under 4,000 tokens again, and a task session under 5,000 — and it carries the
handover rule it is currently missing. Cutting to size while leaving a known gap unfilled would
mean doing this twice.

## Acceptance

- [x] `tm check --context` reports the tm skill under 4,000 and a task session under 5,000
- [x] The skill tells the agent to relay `done`'s clear prompt, and to run `tm handover` when
      asked whether it is safe to clear
- [x] Nothing the skill says today is lost silently — anything cut is either moved into
      `ontology.md` or deliberately dropped, and this Log says which

## Context

`PLT-rsn4` set the budget at 4,000 and closed on 2026-08-17. Measured 2026-09-07:

    tm skill       ~4546   budget 4000, over by 546
    a task session ~5206   budget 5000, over by 206

The drift is verb-by-verb, and each increment looked affordable on its own:

    2026-08-30  DEC-045  rename to detail            +85
    2026-08-30  DEC-046  tm detail                   +85
    2026-08-31  DEC-047  commits: on a parked line   +83

That is the shape of the problem, not an argument against any of the three. A skill that grows
with every command is what `PLT-rsn4` already diagnosed; it was fixed once and nothing stopped
it happening again. Worth considering whether the fix is a *budget check* that fails rather
than a one-off trim — `check --context` already measures it and only warns.

### Folded in: the handover rule the skill has never carried

Raised 2026-09-04 and folded here rather than filed separately, because a skill being re-cut
for size is the moment to decide what earns its place.

`tm handover` and the clear recommendation exist and work. `tm done` prints *nothing carries
over after that — a good moment to clear* on every close, `tm handover` lists what is loose,
`ontology.md` has a Handover section, and `DEC-043` decides that the tool reports and the
reader acts.

**The skill never mentions it.** `handover` appears nowhere in `.claude/skills/tm/SKILL.md` —
not in the command list, not in the translation table, not in the rules. It is in `tm --help`
and nowhere an agent reads by default.

Measured on the session of 2026-08-28 to 2026-08-31: six tasks closed, six clear prompts
printed by `done`, **zero relayed to the user and zero acted on.** The agent read the line in
the tool output and dropped it every time, because nothing said it was its to pass on. Six
clean clear points — board, history and code landing together each time — and the context ran
straight through all of them.

Two rules are missing, and both are adapter territory rather than executable territory
(`DEC-003`):

- When `done` says nothing carries over, say so to the user.
- "Can I clear?" / "am I safe to start fresh?" runs `tm handover`, never a guess from how full
  the context feels — which is the question `ontology.md` says is never the right one.

They have to fit inside the reduced budget, not on top of it.

## Log

- 2026-09-04 — Filed after the tm skill measured ~4,546 across three commits.
- 2026-09-07 — Folded in the handover gap raised the same week, with the six-for-six evidence.
- 2026-09-12 — Done. What moved and where:
  - **Board and standup rendering reasoning → `tasks/_tooling/ontology.md`**, under *Rendering a
    board*. Every rule stayed in the skill as an imperative; every *why* left, including the two
    dated findings and the standup's three extra rules.
  - **The agenda workflow → its own skill**, `.claude/skills/agenda/`. A meeting is occasional
    and every task session was paying 387 tokens for it. `adopt` installs and reroots it, and
    `tm --help` still lists `tm agenda`.
  - **The command list writes the tool's path once** rather than twenty-two times, which also
    surfaced `retitle` and `handover` missing from it entirely.
  - **`tm`'s description narrowed** so an agenda no longer routes to this skill.
  - **Nothing was deliberately dropped.** Two verbs and both handover rules were *added*.
  - `check --context` measures every shipped skill now, so the split moved a cost rather than
    hiding one. An unmeasured cost is what let this happen twice.

  4,652 → 3,992 on the file; 5,347 → 4,690 on a session, against a 5,000 budget.
