---
id: PLT-rsn4
title: The tm skill outgrew its 4,000-token budget; every new command adds to it
created: 2026-08-17
---

# PLT-rsn4 — The tm skill outgrew its 4,000-token budget; every new command adds to it

## Outcome

Either the skill fits its budget with room to grow, or the budget is a number someone chose on
purpose for the tool as it is now. Not a warning that fires on every measurement and gets shaved
back below the line each time.

## Context

`SKILL_BUDGET = 4000` was calibrated when the skill measured ~3,650 and `tm` had eight commands.
It now has twelve — `drop`, `agenda` and `feedback` since, plus `park` gaining a second
destination — and every one needs a usage line, usually a translation-table row, and sometimes a
section explaining a judgement the executable cannot make.

`PLT-fnxy` trimmed it back under the line on 2026-08-10, by a principle that was right and still
is: **the skill states the rule, the ontology holds the argument.** That principle has now been
applied. What is left is not padding.

It has crossed three times since, in one day:

| After | Measured |
| --- | --- |
| `PLT-fnxy` closed | 3,671 |
| `tm drop` + `discuss` | 3,884 |
| `tm agenda` | 3,990 |
| `tm agenda` reshaped (`PLT-s9e7`) | 4,031 |
| padding and hand-back (`PLT-ntec`) | 4,158 |
| offer-and-show (`PLT-4daz`) | **4,181** |

Each time it was shaved back by compressing sentences, and the round on 2026-08-17 produced no
real saving — 4,147 to 4,031 by rewording, which is where salami-slicing starts making a file
worse rather than smaller. Shaving stopped there, and the next behaviour added 127 tokens on top
of it. **It is now ~160 over and growing with the tool, which is the actual finding**: this is
not a file that drifted, it is a file whose subject got bigger.

## The question to actually answer

**Is 4,000 still the right number?** It was ~10% headroom over a measurement, not a limit derived
from anything. A skill that loads whole on every mention of tasks is worth being strict about —
but strict at the wrong number produces exactly what happened today: a warning nobody can clear
except by degrading prose.

Things worth weighing:

- **The usage block repeats `llmeep/tasks/_tooling/` eighteen times**, ~100 tokens of pure
  prefix. Collapsing it was considered and rejected in `PLT-fnxy` because a bare `tm` is not on
  `PATH` and an agent would run it and fail. That reasoning still holds, but it is the single
  largest mechanical saving available and deserves a second look — a one-line note plus a
  `$TM` convention might buy it safely.
- **Sections that exist to stop an agent doing something** — the commit-before-next rule, the
  file-a-task-first rule, the never-write-to-`board.md` rule — are the ones with real cost and
  the ones that would hurt most to lose. They are also, measured, most of the file.
- **The two rendering examples** (standup, board) are ~700 tokens together and are format
  contracts. Trimmed once already.
- **Whether the budget should scale** with the number of commands rather than being a constant,
  since the honest driver of growth is the tool's surface area.

## Acceptance

- [x] `tm check --context` is quiet, and stays quiet after the next command is added
- [x] If the budget moved, a decision says why and on what basis — not "it was in the way"
- [x] Nothing was cut that stops an agent hand-editing records or skipping a task

## Log

- 2026-08-17 — The answer was that the budget measured the wrong thing. An agent working on tasks
  loads the skill **and** the board; the check computed that session total, printed it, and then
  budgeted the file anyway. `DEC-037` moves the budget onto the session and covers the notes side
  too, which was unmeasured — `notes.md` holds 200 notes and is read whole.
- 2026-08-17 — **It is also a relaxation, and the decision says so.** 5,000 on a session holding a
  ~480-token board is ~4,520 for the skill against 4,000 before. Both the better measurement and
  the higher ceiling are real, and the second was not smuggled in behind the first.
- 2026-08-17 — Trimmed ~70 tokens of genuine duplication first — `done`/`closes` was stated in
  three places — so this is not purely moving the goalposts. What remains is not padding: two
  rendering sections that are format contracts, a phrase table mapping speech to commands, and
  rules that stop an agent hand-editing records.
- 2026-08-17 — The structural answer was identified and deferred: moving the rendering rules to a
  file read on demand takes ~1,000 tokens out of the always-loaded skill. Rejected for now
  because the commonest reason the skill loads is someone asking to see their tasks, so it would
  be read most sessions anyway. That is the answer when this next fires.
- 2026-08-17 — `selftest` now asserts a freshly installed session is inside its budget, so the
  check being quiet is a property with a test rather than a thing someone remembers to look at.
