# Notes

Durable, shared knowledge. Committed, reviewable, and safe to rely on.

This is the counterpart to [`.notes/`](../.notes/README.md), which is local, disposable and
gitignored. The distinction is [principle 4](../ontology/principles.md): a note is a claim
the project stands behind; scratch is one machine's thinking.

## Structure

| Directory                    | Holds                                                              |
| ---------------------------- | ------------------------------------------------------------------ |
| [`decisions/`](decisions/)   | Choices made, alternatives rejected, and why. `DEC-###`. Immutable. |
| [`meetings/`](meetings/)     | What was discussed, decided and assigned. Dated.                    |
| [`reference/`](reference/)   | Standing explanations: how something works, runbooks, external links. |

## What belongs here

A note earns its place if someone arriving in six months would be worse off without it.

- **Decisions** — always. Any non-obvious choice with a rejected alternative.
- **Meetings** — where something was decided or assigned. Not every call.
- **Reference** — knowledge that currently lives only in someone's head.

## What does not

- Anything derivable from the code. It will rot, and it will be trusted while rotten.
- Work to be done. That is a task — see [`../taskman/`](../taskman/ontology.md).
- Half-formed thinking. That is scratch — see [`../.notes/`](../.notes/README.md).

## Conventions

- **Absolute dates always** (`2026-07-31`). Never "last week", "recently", "next sprint".
- **Reference records by ID** (`PLT-004`, `DEC-002`), never by title.
- **State staleness explicitly.** If a note is known to be out of date, say so at the top
  rather than quietly leaving it wrong. Agents will believe it otherwise.
- **Promotion is explicit.** Material moves from `.notes/` to here deliberately, never by
  drift.

## Decisions are immutable

A decision is never edited to change its substance and never deleted. To change your mind,
write a new decision that supersedes the old one and mark the old one `superseded`. The
record of having believed something — and why — is the point.

Fixing a typo is fine. Rewriting the rationale is not.

## Mutation

Per [principle 2](../ontology/principles.md), notes are created and updated through tooling
once it exists — chiefly for ID allocation and index maintenance. The tooling is not built
yet; see the open decisions in the root [`README.md`](../README.md).
