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

## The thing this has to solve first

`adopt` is usually run *by an agent*, not typed by a person. `PLT-eb7v` is the incident: output
phrased as a step got performed by the agent reading it, which is why the closing text describes
rather than offers.

So an interactive prompt has an obvious failure mode — the agent answers it, and the user never
sees the question. Whatever this task does needs an answer to that. Options, unresolved:

- Prompt only on a TTY, and print the current description when there is none.
- Do not prompt at all; have the *skill* ask on first use, where the conversation is with the
  person.
- A flag the human path sets.

That choice looks like a decision worth recording (`tm why`), not just an implementation detail.
