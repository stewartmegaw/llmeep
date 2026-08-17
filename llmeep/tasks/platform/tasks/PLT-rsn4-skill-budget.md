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
| `tm agenda` reshaped (`PLT-s9e7`) | **4,031** |

Each time it was shaved back by compressing sentences, and the last round produced no real
saving — 4,147 to 4,031 by rewording, which is where salami-slicing starts making a file worse
rather than smaller. It is 31 tokens over and there is nothing obvious left to cut.

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

- [ ] `tm check --context` is quiet, and stays quiet after the next command is added
- [ ] If the budget moved, a decision says why and on what basis — not "it was in the way"
- [ ] Nothing was cut that stops an agent hand-editing records or skipping a task
