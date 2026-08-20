---
id: PLT-8kg9
title: "adopt should ask: coder or non-coder, feedback on or off, then say where notifications are configured"
created: 2026-08-19
---

# PLT-8kg9 — adopt should ask: coder or non-coder, feedback on or off, then say where notifications are configured

At the end of an install/adopt, three prompts:

1. **Coder or non-coder.** Writes the user type into `.env` — see PLT-22fn, which defines what
   the setting then changes.
2. **Feedback on or off.** Today this is only described in the closing output, off by default,
   deliberately not offered as a step. Asking outright replaces that paragraph.
3. **Where notifications are configured** — `.env`, and what goes in it. A statement, not a
   question; nothing here should try to set up Telegram during an install.

## Settled

**It asks at a terminal, and hands the questions over when there is none.** Most installs are
agent-run, so a prompt alone would have fired on a small minority — the no-TTY branch writes
the questions out addressed to the agent, telling it to put them to the person and not answer
them itself.

`PLT-eb7v` is the obvious objection: output phrased as a step gets *performed* by the agent
reading it, which there produced a domain ontology nobody asked for. The line drawn is that
the lesson was never *do not address the agent* — it was *never ask it to answer on the
adopter's behalf*. `DEC-041` carries the argument, and the boundary it sets: hand over
questions, never work.

Two scope calls made here rather than left open. **Notifications are named, not asked** —
setting one up needs a token from an external service, which is a separate errand with its own
verification step. **`--update` asks nothing**; it names whichever keys are still unanswered,
once, because re-asking on every upgrade makes an answered question look unanswered.
