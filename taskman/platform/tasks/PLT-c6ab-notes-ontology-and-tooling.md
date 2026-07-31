---
id: PLT-c6ab
title: Co-locate the notes ontology and decide if notes needs tooling
created: 2026-07-31
---

# PLT-c6ab — Co-locate the notes ontology and decide if notes needs tooling

## Outcome

`notes/` is a self-contained subsystem on the same terms as `taskman/`: its vocabulary lives
beside it, and whether it needs an executable is a decided question rather than an open one.

## Context

`notes/` is the last of the five top-level folders still running on conventions alone. Two
things are outstanding, and they are separable.

**Co-location.** [`ontology/README.md`](../../../ontology/README.md) states the rule — a
self-contained subsystem keeps its vocabulary next to itself — and its own table records
`notes/` as the exception, "moves out when notes tooling is built". Note, Decision and Scratch
still sit in [`ontology/core.md`](../../../ontology/core.md). `notes/README.md` folds into
`notes/ontology.md`, and `core.md` keeps one-line pointers for anything referenced from outside
the subsystem — the same shape `taskman/` already has.

**Tooling.** Deliberately undecided. `DEC-001`'s ID-allocation argument applies to `DEC-###`
just as it did to `PLT-###`, and nine decisions in one day is enough that ID collisions on a
branch are plausible. Against that: nine in one day is a burst, not a rate, and every one was
written by hand without difficulty.

## Approach

Do the co-location first — it is unblocked, mechanical, and settles the exception the ontology
README is currently carrying.

Then decide tooling, with three real questions:

1. **Does `notes/` need an executable at all?** If yes it is almost certainly `tm`'s parser
   reused, not a second binary — `DEC-003` rejected multiple executables for taskman and the
   same reasoning holds here.
2. **Should `find` search notes as well as tasks?** Today "have we thought about this before?"
   only searches completed *work*, which misses every decision — arguably the more valuable
   half. This is the strongest argument for touching notes tooling at all.
3. **Do decisions need collision-proof IDs?** `PLT-006` made task IDs random for exactly this
   reason. `DEC-###` is still sequential and has the identical branch-collision exposure.

Whatever is decided, record it — including "no tooling", which is a real answer and the one the
project's ethos points at.

## Log

- 2026-07-31 — created. Co-location has been pending since the taskman ontology moved.
