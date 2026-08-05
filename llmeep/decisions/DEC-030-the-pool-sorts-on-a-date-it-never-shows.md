---
id: DEC-030
title: The pool sorts on a date it never shows
status: accepted
decided: 2026-08-05
deciders: [stewart]
supersedes: []
superseded_by: []
relates_to: [DEC-027]
---

# DEC-030 — The pool sorts on a date it never shows

## Status

`accepted` — as of 2026-08-05.

## Context

`filed:` was added so the pool had something to sort on (`PLT-xt3h`). Sorting followed
(`PLT-947q`), and then display: `PLT-a4ej` put the date on every backlog line, and `PLT-947q`'s
follow-up moved it ahead of the title to make it scannable. All three shipped in v32.

The argument for showing it was that an order with an invisible key reads as arbitrary. In use
it turned out the opposite way round. A date column beside a pool line is the most concrete
thing on that line, and concrete numbers get acted on — a reader reaches for it as age, then as
urgency, then as a deadline, none of which a pool line carries. `DEC-027` made filing and
ranking separate acts precisely so a filed thought costs nothing; a visible date puts a cost
back on it, because now the board is displaying how long you have ignored something.

It is also the one surface with no room to spare. The board and the standup are read on a
phone, eight lines at a time, and the column spends width on every line to answer a question
almost nobody asks.

## Decision

The pool sorts newest-`filed:` first and never prints the date. The tag stays in `board.md`,
write-once, exactly as `DEC-027` and `PLT-xt3h` left it — this is a display rule only, and
`filed:` remains the sort key, the audit trail, and the thing `check` validates.

## Alternatives considered

- **Show the date on every pool line** — rejected because it reads as a deadline. Shipped in
  v32 and reverted within a day; this decision is what that day bought.
- **Show it only past a threshold — "sat here 30 days"** — rejected because it is the same
  claim with extra machinery. A pool line that has waited a month is not thereby more urgent
  than one filed yesterday, and a badge saying so is an opinion the pool is not entitled to.
- **Drop `filed:` and stop sorting** — rejected because the unsorted pool renders in board-file
  order, which is an accident of editing. Sorting by the one real signal beats rendering the
  accident; it is only *showing* the signal that misleads.
- **Show it in `board.md` but not the standup** — rejected because the two are meant to read
  alike. Splitting the rule doubles what an agent has to remember and puts the misreading back
  on the surface people look at most.

## Consequences

The pool's order has no visible explanation, which is a real cost: someone who does not know
the rule sees an arbitrary list. That is why the rule is stated in three places — the skill,
`ontology.md`, and `standup_lines` — rather than inferred from the output.

Anyone who genuinely wants the filing date reads `board.md`, where the tag is plain text and
always was. No command surfaces it, and none should be added without reopening this.

## Revisit when

Pools get long enough that "what has rotted here" is a real question — say, a hundred lines
across both ledgers. The answer then is a command that asks it directly, not a column that
answers it on every line whether or not it was asked.
