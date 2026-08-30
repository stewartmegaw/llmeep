---
id: DEC-045
title: A sidecar is called a detail, the word the board tag already used
status: accepted
decided: 2026-08-30
deciders: [stewart]
supersedes: []
superseded_by: []
relates_to: [DEC-011, DEC-040, DEC-042]
---

# DEC-045 — A sidecar is called a detail, the word the board tag already used

## Status

`accepted` — as of 2026-08-30.

## Context

The file or folder holding what a task's title could not was called a **sidecar** everywhere
except the one place a person actually reads it. The board tag has always been `detail`:

    PLT-fupy Lead the README with what it looks like  detail  filed:2026-08-18

So the machinery said one word and every document said another, and `check` printed both in a
single breath — `PLT-9puy is tagged detail but has no sidecar`. Nobody learns anything from
that line.

*Sidecar* is a metaphor about **position** — a thing bolted to the side of another thing. It
carries real meaning in photography (`.xmp` beside a `.raw`) and to people who have met it
there, which is a narrower audience than llmeep now has. Since `DEC-040` the tool knows whether
it is talking to a coder or not, and since `DEC-042` a non-coder's agent acts on its own
judgement more often — so the vocabulary a non-coder has to be taught before they can read
their own board is a cost the project chose to start paying attention to. "Put the rest in a
sidecar" is an instruction you cannot follow without first being told what one is.

## Decision

The concept is a **detail**: `tm detail_path`, `detail_doc`, `check_details`, `## Detail` in
the ontology, "the task's detail" in prose. The board tag is unchanged, because it was already
right. Nothing about the thing itself changes — `DEC-011` still holds in full: a detail is a
file or a folder, a folder's entry point is its `README.md`, and a folder without one is an
error.

**Records keep the word they were written with.** Decisions, `history.tsv`, completed task
details and board lines filed before this are left alone. They are the account of what was
decided and when, and editing them to match today's vocabulary would make `tm why sidecar`
unable to find the term's own history. Two live pointers carry a reader across: a comment in
`tm` beside the renamed section, and a line under `## Detail` in the ontology.

## Alternatives considered

- **`attachment`** — rejected. Familiar from email and chat, which is the problem: it suggests
  a file that arrived from somewhere else, and usually several. A detail is one document you
  write, one per task. It also names a relationship rather than the content, which is the same
  weakness as *sidecar* wearing friendlier clothes.
- **`brief`** — rejected, though it was the closest. A design brief or a project brief is
  exactly the right register for a non-coder. But it is a word nobody has met in this system,
  where `detail` is already on every board line — and the argument for renaming was to stop
  having two words, not to arrive at a third.
- **`notes`** — rejected outright: `nm` is a separate subsystem with its own records, and the
  collision would be worse than the problem.
- **`spec` / `write-up` / `page`** — rejected. `spec` is developer vocabulary, the exact
  failure being corrected. The others are clear but say nothing the board tag does not.
- **Leave it and document *sidecar* better** — rejected. The glossary already defined it. A
  term that needs a glossary entry to survive a first reading is the cost being removed, and
  documenting it harder does not remove it.
- **Rewrite the records too, for one consistent vocabulary** — rejected. A decision is
  superseded, never rewritten, and the same instinct applied to `history.tsv` would quietly
  falsify what was filed. Inconsistency between the live machinery and the archive is the
  honest state of a project that changed its mind.

## Consequences

The error messages explain themselves — `tagged detail but no detail file or folder exists`
says what to do without a glossary. One word covers the tag, the file, the function names and
the prose.

The rename makes `PLT-hwx5` (a verb for attaching one) cheaper: the verb is now `tm detail
<id>`, named after the tag it writes, with nothing left to explain.

The costs are accepted knowingly. Older records say *sidecar* and always will, so anyone
reading back through decisions or `git log` meets a word the live system no longer uses — which
is why the two pointers exist. `detail` is also an ordinary English word, so prose has to say
"the task's detail" where "a sidecar" was unambiguous on its own. That is the price of a word
someone can read without being taught it.

## Revisit when

Never, on the merits — a rename that settles on the word already in the data is not a decision
that wants reopening. Reopen only if `detail` turns out to collide with a second concept in the
records, at which point the collision is the thing to solve.
