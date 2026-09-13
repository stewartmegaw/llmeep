---
id: DEC-054
title: The deterministic half of a record merge belongs to the tool, and the rest says what it chose
status: accepted
decided: 2026-09-13
deciders: [stewart]
supersedes: []
superseded_by: []
relates_to: [DEC-001, DEC-005, DEC-027, DEC-047, DEC-050]
---

# DEC-054 — The deterministic half of a record merge belongs to the tool, and the rest says what it chose

## Status

`accepted` — as of 2026-09-13.

## Context

`board.md` is one file everyone touches; `DEC-001` accepted that cost knowingly. The ontology's
**Merging boards** held seven rules for resolving it and opened by saying there is no tool for
this, because resolving a conflict is judgement about what each branch intended.

Six of those seven rules are not judgement. Union the pool. Union the queue, keeping the target's
order and appending the incoming side's. Keep `prioritised` when a task is ranked on one side and
not the other. Union `recent`, sort by date, prune to fifteen. Keep every `history.tsv` row and
sort. Only one row needs a person: two tasks in progress breaks WIP-1, and which branch's work is
in the merge is not in the file.

The same section already carried the warning that a textual merge "will silently drop task lines,
leave two tasks in progress, or drop a history row — all of which look fine in the diff". A rule
with that consequence, applied by hand, at the moment somebody is trying to finish a merge, is the
shape of thing that gets applied approximately.

**And the dangerous merge turned out to be the one git is happy with.** Written as a
conflict-resolver first, this found nothing in two of its own test cases, because git had merged
them cleanly: a task dropped on one side while the other moved it between sections touches
different lines, so git takes both edits and the task is back; a task completed on one side while
the other ranked it lands in two sections at once. No marker, no conflict, nothing wrong in the
diff. That is the case worth having a tool for, and no amount of guidance addressed to an agent
resolving a *conflict* would ever have covered it.

## Decision

**`tm resolve` applies the table, and reads three sides from wherever they are.** Index stages
during a conflict; `MERGE_HEAD` during a merge git resolved itself; the two parents of a merge
commit already made. The third is the one this exists for.

**Union means union of additions, minus deletions.** `drop` says a record should not exist, so a
plain union resurrects it — a merge artifact nobody can explain later.

**Presence is resolved for the board as a whole, then the section.** Four independent section
merges read "prioritised on one side" as a deletion from that side's pool, which is how a dropped
task came back whenever the other side had touched it. Where the sides disagree on the section,
the stronger wins: `recent`, then `in progress`, then `prioritised`, then `backlog`.

**The judgement row is named, never chosen quietly.** With two tasks in progress, the branch being
merged into keeps its task and the incoming one returns to the top of `prioritised`, unassigned
and stripped of its anchor but keeping `commits:` (`DEC-047`). The output says which, and how to
swap them.

**It writes records and never the index.** Staging and committing belong to whoever ran it, so
every git call in `tm` stays a read (`DEC-005`).

## Alternatives considered

- **Leave it as guidance, as the ontology had it.** Rejected on the clean-merge case alone:
  guidance addressed to someone resolving a conflict cannot fire when there is no conflict. The
  table also survives — the tool applies it, the ontology still explains why each rule is what it
  is, which is the same division `DEC-050` drew for rendering.
- **A git merge driver** in `.gitattributes`, so `git merge` calls this itself. Genuinely
  tempting, and rejected for now: a driver runs inside git's merge with no way to report what it
  decided except by exiting zero, and the WIP-1 row has to be *said*. It also configures itself
  per clone, so a teammate without it gets silent textual merges of the same file — the worst of
  both. Worth revisiting if the output problem can be solved.
- **Resolve and commit in one step.** Rejected: `DEC-005` keeps git in the agent's hands, and a
  tool that commits a merge nobody inspected is exactly the silent resolution this replaces.
- **Have `check` refuse a board that a merge broke**, and fix it by hand. `check` should still
  catch it, and a refusal at commit time is the backstop — but it arrives after the merge and
  names a state rather than mending it.
- **Key board lines on the first token.** What the first implementation did, and it was wrong:
  `recent` leads with the completion date and every other section with the id, so completed tasks
  were filed under a date. Two tasks finished on one day collided, and a task ranked on one side
  and finished on the other looked like two records and vanished from the merge. The board came
  out empty — caught by a test, which is the whole argument for this being code.

## Consequences

A merge of records has one answer, applied the same way every time, by whoever or whatever is
merging.

**Ten tests**, including the two clean-merge cases that git resolves silently, both `history.tsv`
sides surviving, a conflict outside the record trees being left alone with its markers, and the
resolution still being unmerged afterwards so finishing the merge stays the caller's act.

**The ontology's "there is no tool for this" is gone**, and the table it introduced is now the
documentation of code rather than instructions to a reader.

**`tm resolve` is worth running when nothing looked wrong**, which is an odd thing to ask of
anyone — so the skill says it, and the app will call it after every pull.

## Revisit when

Someone wants `git merge` to do this itself. That is the merge driver above, and the blocker is
that a driver has no voice.
