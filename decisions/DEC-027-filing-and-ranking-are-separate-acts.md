---
id: DEC-027
title: Filing a task and ranking it are separate acts
status: accepted
decided: 2026-08-03
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-001, DEC-026]
---

# DEC-027 — Filing a task and ranking it are separate acts

## Context

One `backlog` section held everything not yet started, and the model said **position is
priority**. That gave the board a single ordered list, and `add` appended to the bottom of it.

The claim was never true. A task lands on the board the moment someone thinks of it — mid-task,
from a note, out of a conversation — and `add` gives it a position because the list has no way
to hold something without one. Every filing was therefore an implicit ranking, made at the worst
possible moment: before anyone had read it, by whoever happened to be typing.

The consequences were quiet ones. The bottom of the list accumulated things nobody had ever
compared to anything, indistinguishable from things deliberately ranked last. `tm standup`
listed the top eight as "NEXT UP", which was honest for the first three and fiction after that.
And a merge of two branches had to resolve an ordering that neither side had actually decided —
the ontology's own merge rule admitted there was "no correct answer".

The vocabulary had already noticed. The glossary's *words we avoid* table listed "backlog" as a
term to avoid because it is "vague about ordering", and told you to use "the `backlog` section"
instead — a row that says a word is too vague and then recommends it. Two other passages still
referred to an `open` order that no longer existed. The model had been patched around a
distinction it never made.

## Decision

**The board carries two open sections. `backlog` is a pool; `prioritised` is a queue.**

```
## in progress      at most one per assignee
## prioritised      ordered — position is priority
## backlog          unordered — position means nothing
## recent           last 15 completed
```

`add` files into the pool. **Filing costs no ranking decision**, which is the whole point:
capturing a thought should be free, and the queue should contain only statements someone
actually made.

**A bare `go` reads `prioritised` and nothing else.** With an empty queue and a full pool it
starts nothing and says so. Picking out of an unordered pool would be the tool choosing your next
task from lines whose order means nothing — [principle 7](../ontology/principles.md) exactly
backwards.

**`go <id>` starts anything, from either section.** Naming a task *is* the decision, and
requiring it be prioritised first would be ceremony — worse, it would push people into the board
to take a step the tool refused to, which is the trap
[`DEC-001`'s park rule](../tasks/_tooling/ontology.md) exists to avoid.

**`park` returns to `prioritised`, not the pool.** Something you started was decided work.
Parking says "not now", not "never ranked this".

**`tm prioritise <id> [-n]` moves pool → queue**, and is the one part of this that fails the
project's own test for when something earns a command. Moving a line between two open sections
breaks no invariant, and `go <id>` means the tool never traps you into needing it. It exists
because **triage happens in bulk** — a week's filings ranked in one sitting — and that is where a
hand edit drops a `blocked:` tag or lands a line in `recent` without a date. Every other hand
edit moves one line. Hand editing remains entirely valid, and is still the only way to reorder
*within* `prioritised`.

**The standup reports the queue, and reports its absence.** Nothing prioritised behind a full
pool prints as exactly that. An empty queue is the most actionable thing a standup can say.

## Alternatives considered

- **Leave one list and change nothing.** The status quo works, and its failure is silent rather
  than loud. Rejected because the vocabulary had already broken down trying to describe it, and
  a model whose own glossary contradicts itself will not survive contact with a second team.
- **`add` files into `prioritised`.** Preserves today's `add`-then-`go` loop exactly, with no
  triage step. Rejected: the pool would then fill only by demotion, so it becomes a place things
  go to die rather than the default state of a new idea, and every filing is still an implicit
  ranking.
- **A `priority:` tag instead of a section.** Rejected on the existing grounds — P0/P1/P2 inflate
  until everything is P1, and the glossary already refuses labels. Sections cannot inflate.
- **Promotion by hand edit only, no command.** Consistent with the reordering exemption, and
  genuinely defensible. Rejected on the bulk-triage argument above, and recorded as a known
  deviation rather than dressed up as a principle.
- **Three sections (now / next / someday).** More expressive, and every tracker that has tried it
  ends up with two live and one abandoned. Two is the smallest split that carries the
  distinction.

## Consequences

- **A new task no longer surfaces in `tm go`.** This is the change people will feel. `add -n`
  and `prioritise` are the answers, and both are one command.
- **Merges get cheaper, not dearer.** Most conflicts are now pool unions, where order does not
  exist and there is nothing to resolve. Only `prioritised` needs the ordering rule.
- **The pool will grow without bound**, and nothing prunes it. That is correct for now — it is
  one line per task in a file nobody has to read — but it is the thing to watch.
- **`position` means something narrower.** It is a task's place in `prioritised`. Elsewhere it
  is an artefact of filing order and must not be read.
- **Existing boards migrate by renaming.** Today's `backlog` was documented as ordered, so it
  became `prioritised`; the pool starts empty. Nobody's ranking was discarded.

## Revisit when

- The pool is large enough that finding something in it is a problem. That is a search feature,
  not a third section — `tm find` covers history and would need to cover the board too.
- Nothing is ever prioritised and everyone uses `go <id>` instead. That would mean the queue is
  ceremony for this team, and the honest response is to collapse it back rather than nag.
