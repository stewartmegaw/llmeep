---
id: DEC-003
title: Skills are one Python 3 executable; vendor integrations are thin adapters
status: accepted
decided: 2026-07-31
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-001, DEC-002, PLT-002, PLT-003]
---

# DEC-003 — Skills are one Python 3 executable; vendor integrations are thin adapters

## Context

[`DEC-001`](DEC-001-taskman-design.md) defined four skills — `add`, `go`, `done`, `find` — but
deliberately deferred how they are implemented and invoked until their functions were known.
They now are, and they are modest: parse a board, allocate an ID, move lines between sections,
prune to 15, append and grep a TSV, read a git SHA, and POST to Telegram.

The constraint that shapes this is [principle 3](../../ontology/principles.md). Every agent
vendor has its own skill format, and adopting one would mean a project cloned by someone using
a different agent silently has no taskman at all. Whatever a skill *is* here, it has to work
for every agent and for a human at a terminal.

## Decision

**A skill is an executable command.** Every agent can run a shell command, and so can a person;
it is the only common denominator that does not pick a vendor.

- **One executable, `tasks/tm`,** with four subcommands. Fewer moving parts than four
  scripts, and co-located with the ontology and data so the subsystem stays liftable.

  ```
  tm add Fix flaky auth test     # -b business, -n top of order
  tm go [id]                     # no id: show current, or start the top of open
  tm done [id]                   # defaults to the current task
  tm find auth
  ```

- **Defaults over arguments, but no guessing.** `add` assumes `platform`; `go` and `done`
  assume the current task, since WIP-1 means there is only one. But the tool does **not**
  infer the ledger from the title. A deterministic script classifying intent from keywords is
  unpredictable *and* unintelligent, and wrong silently. The routing rule is in the ontology;
  the agent invoking `tm` has it and passes `-b`. **Judgement belongs in the agent; the tool
  is the actuator.**

- **Python 3, standard library only.** No `pip install`, no lockfile, no virtualenv. Present by
  default on macOS and mainstream Linux. It covers board parsing, TSV, `urllib.request` for
  Telegram and `subprocess` for git without reaching outside stdlib.

- **Vendor adapters are committed but thin.** A wrapper that surfaces `/tm` in an agent's
  native skill list is ergonomics, never logic, and must carry a header saying so. If an
  adapter contains behaviour, users of other agents get a different system — the exact failure
  principle 3 exists to prevent.

- **The four commands are listed in `README.md`.** An agent only uses a skill it knows exists,
  and the root README is the contract every agent reads. Discovery cannot depend on the
  adapter, because not every agent has one.

## Alternatives considered

- **POSIX shell + awk.** Genuinely zero dependencies and the purist answer. Rejected because
  `done` has to rewrite board sections, prune the window and reflow the file — fiddly state
  manipulation in awk, and fragile the first time the format shifts. The dependency saved is
  one that is already present nearly everywhere.
- **Go, committed binary.** Fastest and dependency-free at runtime, but requires either a
  toolchain on clone or committed per-platform binaries. Friction at clone time is precisely
  what this skeleton exists to remove.
- **Node.** Widely present, but heavier and subject to version churn, with no advantage over
  Python for this workload.
- **Vendor-native skills as the implementation** (`.claude/skills/` and equivalents). Rejected
  outright: it makes the system vendor-conditional, and a clone by someone using a different
  agent would have no taskman at all.
- **Four separate executables.** Rejected as more moving parts for no gain; subcommands share
  the board parser they all need.

## Consequences

- Anyone can drive taskman from a terminal with no agent at all, which is the honest test of
  whether the design is vendor-neutral.
- **Python 3 is now a dependency of the skeleton**, though not of `platform/`. Windows without
  a Python install is the case that breaks, and it is an accepted gap.
- Adapters are a discipline, not a mechanism — nothing stops someone putting logic in one. The
  header helps; the commit hook could check it later if it becomes a real problem.
- The repo now contains a vendor-named directory, which slightly dents the agnostic
  presentation even though the behaviour stays neutral.

## Revisit when

- Startup latency becomes noticeable — `add` and `go` run a history search on every
  invocation, and interpreter startup is the floor on how fast that can feel.
- Someone needs to run this where Python 3 is genuinely unavailable.
- An adapter is found containing logic, which would mean the discipline is not holding on its
  own.
