# Reference

Standing explanations: how something works, how to operate it, where the external things
live.

## What belongs here

- **Runbooks** — how to do a recurring operational thing, step by step.
- **Explanations** — how a subsystem or process actually works, especially where the code
  does not make it obvious.
- **External pointers** — dashboards, vendor consoles, accounts, third-party docs. What it
  is, where it is, who owns access.

## What does not

- **Anything derivable from the code.** It will drift, and it will be trusted while wrong.
  Document the *why* and the *non-obvious*; let the code speak for the *what*.
- **Domain modelling.** That is [`ontology/domain/`](../../ontology/domain/README.md).
- **A record of a choice.** That is a [decision](../decisions/).

## Conventions

- One topic per file, `kebab-case.md`.
- Start with a one-line statement of what the file covers and who it is for.
- Note the last-verified date at the top of anything operational. A runbook nobody has run
  in a year should say so.
- If a note is known to be stale, mark it at the top rather than leaving it silently wrong.
