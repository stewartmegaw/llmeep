---
id: PLT-22fn
title: "A user type in .env — coder or non-coder — shapes how the agent talks and what it decides alone"
created: 2026-08-19
---

# PLT-22fn — A user type in .env — coder or non-coder — shapes how the agent talks and what it decides alone

`.env` carries a user type declaration: `coder` or `non-coder`. The skills read it and it
changes what the agent says and what it decides without asking.

## non-coder

- Never surfaces git. No branches, commits, diffs, conflicts, `--no-verify`, none of it.
- Where a git decision is needed, the agent makes it and carries on. It does not ask, and it
  does not report the mechanics afterwards — only the outcome in the user's own terms.
- Same for anything else that is machinery rather than work: the answer is the thing they
  asked for, not the steps that produced it.
- **Worktrees are off unless there is no way round.** A worktree does not stay inside the
  conversation — it periodically needs the user to paste a command into a terminal themselves,
  which is precisely the handoff a non-coder cannot make. Prefer whatever keeps the work in
  one place. Where one is genuinely unavoidable, the agent drives it and never hands over a
  command to run.

## coder

- Bullet points, not prose. Short lines, no throat-clearing.
- Git is fair game and worth naming — the ids, the trailer, what the hook refused.

## Settled

`USER_TYPE` in `.env`, `coder` or `non-coder`. Unset stays silent rather than defaulting —
*nobody has said* is a different state from *this user wants bullets*, and `PLT-8kg9` is the
task that makes `adopt` ask.

The rules could not go in the skill: it is committed, so one person's setting would decide for
the whole team, and a task session had ~95 tokens under `SESSION_BUDGET`. So `tm audience`
prints them, and every other command prints a one-line reminder above its output. `DEC-040`
carries the argument; the ontology's **Audience** section carries the rules.
