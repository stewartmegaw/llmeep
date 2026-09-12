---
id: DEC-050
title: The tool renders for the target, and a skill passes the output on
status: accepted
decided: 2026-09-12
deciders: [stewart]
supersedes: []
superseded_by: []
relates_to: [DEC-003, DEC-008, DEC-037, DEC-049]
---

# DEC-050 — The tool renders for the target, and a skill passes the output on

## Status

`accepted` — as of 2026-09-12.

## Context

`tm` already rendered the standup three ways from one `(heading, lines)` structure —
`render_plain` for a terminal, `render_telegram` in HTML, `render_slack` in mrkdwn — because
`DEC-008` made the notifier swappable and the report must not care which channel it is talking
to.

A fourth renderer existed outside all of that, written in prose, in the skills. The `tm` skill
carried ten rules and a worked example for turning `board.md` into markdown for a phone; the
standup skill carried four more and a second example. Together that was ~780 tokens, and the
board half was loaded on every task session whether or not anyone asked to see a board.

Three things were wrong with it beyond the cost.

**It reached one agent.** A rule in `.claude/skills/` is Claude Code's. Principle 3 says an
adopter on another agent gets the same system, and on the format they did not — they got
`board.md` and no contract for reading it out.

**Prose cannot be verified.** `selftest` could assert the rules were *present* in the file. That
a blank line actually follows every `---`, that no id is linked, that the pool is newest-first —
nothing could test any of it, because nothing but a model produced the output.

**Principle 1 already said where this belonged.** Its corollary is that presentation is a
separate concern from storage, and that when a person needs to read the state of the project
"that is the job of a display command that renders the records". The display command existed;
the render was in a skill.

**The two copies had already drifted.** The standup skill promised that "what you show and what
Telegram receives are the same report", and its own example title-cased headings the tool writes
in capitals. Both could not be true, and nobody noticed for six weeks.

## Decision

**Rendering belongs to the executable, for every target it has.** `tm board --chat` and
`tm standup --chat` print markdown for the conversation the agent is in, from the same section
structure the other renderers read. The skills say what a skill is for: run it, pass the output
on unchanged, never in a code block, and add nothing.

`--chat` suppresses the banner and sends every status line to stderr, on the rule `--json`
already set: stdout is the artifact, and a line *about* the artifact is not part of it.

## Alternatives considered

- **Move the rendering rules to a second file the skill reads on demand** — `DEC-037`'s
  alternative, rejected then because the board is most of why the skill loads at all, so the file
  would be read anyway and a saving would become a round trip. It stays rejected, and for a
  better reason: a second file is still prose, still reaches one agent, and still cannot be
  tested.
- **Leave it in the skill and cut words instead.** That is what `DEC-037` recorded as degrading
  the file it guarded. The render was not padding; it was a format contract, which is exactly the
  kind of thing that should not be compressed and should not be in prose.
- **Render in the UI layer instead** — rejected. `tm board --json` already serves an interface
  that has its own opinion about presentation. A reader in a chat window is not an interface: it
  has no renderer of its own, which is why the agent was being handed the job.
- **Emit vendor-specific markup** — rejected on `DEC-049`'s grounds for refusing `--json` on
  `tm status`. `--chat` is plain markdown, and the one vendor-shaped decision — that Telegram
  wants HTML — stays where it already was, behind `NOTIFY`.
- **Keep the em-dash the prose version used.** Titles here contain em-dashes, so a suffix after
  one reads as though the title never ended. A model smoothed that over silently; a renderer
  cannot, so the separator is `·`.

## Consequences

A task session is ~3,984 tokens against `DEC-037`'s 5,000, down from ~4,440, and the `tm` skill
is ~3,270 from ~3,727. A standup session is ~1,239. None of it came out of a rule: every rule
survives, in code, where it is executed rather than followed.

**The format is testable for the first time**, and `selftest` now asserts the output rather than
the instruction — the blank line after `---`, no linked ids, no filing date, the pool's order, the
bold headings, the counts.

**Adopters on other agents gain a render they never had.** This is the reverse of the usual
adapter trade: the vendor file got smaller and every agent got more.

**Two renders now agree by construction.** The heading a standup shows is the heading the channel
receives, in the tool's own capitals. The prose version's title case is gone, which is a visible
change to what a standup looks like and the price of the two being one thing.

**The skills can no longer be read as the contract.** Anyone changing what a board looks like
edits `board_sections` and `render_board`, and the reasoning for each rule stays in the
ontology's **Rendering a board**.

## Revisit when

A second reader wants a different shape — a digest, a per-person board (`PLT-3wjv`). That is a
flag on the renderer, not a rule in a skill, and if it ever looks like the latter again this
decision is the reason it is not.
