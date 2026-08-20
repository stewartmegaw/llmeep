---
id: DEC-040
title: The user type is per-person configuration, and the tool announces it on every command
status: accepted
decided: 2026-08-20
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-003, DEC-005, DEC-033, DEC-037]
---

# DEC-040 — The user type is per-person configuration, and the tool announces it on every command

## Status

`accepted` — as of 2026-08-20.

## Context

Everything this project writes is written for one kind of reader: someone who commits, reads a
diff, and can be handed a command to paste. [`DEC-005`](DEC-005-agent-mediated-git.md) went as
far as routing git *through* the agent, but it still assumes the agent can talk about git
afterwards — the whole `closes <id>` convention is stated to the user as a git fact.

That assumption fails for an adopter who does not code. Not gently: mentioning a branch or a
merge conflict to them is noise at best, and at worst it stops them, because the sentence ends
in a decision they have no basis to make. The same is true in the other direction — a coder
reading four sentences of careful prose where three bullets would do is being slowed down by
politeness.

So there are two audiences, they want opposite things, and nothing in the repo knew which one
was reading.

Two constraints shaped the answer. It is **per-person** — a team can hold both kinds at once,
so anything committed decides for everyone. And a task session already measures ~4,900 against
the 5,000 [`DEC-037`](DEC-037-budget-the-session-not-the-file.md) allows, so the rules for two
audiences do not fit in the file that is always loaded.

## Decision

**`USER_TYPE` in `.env`, one of `coder` or `non-coder`, and unset means nobody has said.**

`tm audience` prints the full rules for whichever is set. Every other command prints a one-line
reminder above its own output, with two exemptions where the reader is not a person: `check`,
which hooks run and `git` reads, and `add --id`, which prints a bare id for `nm promote` to
consume. The skills carry one line each: run it, and write the way it says.

`non-coder` carries one rule that is structural rather than stylistic: **prefer anything over a
git worktree.** A worktree eventually needs a command pasted into a terminal by hand, which is
precisely the handoff this user cannot make.

## Alternatives considered

- **Put the rules in the skill.** The obvious place, and where every other conversational rule
  in this project lives. Rejected twice over: the skill is committed, so one person's setting
  would become everyone's, and there is not enough room under `SESSION_BUDGET` for two
  audiences' rules in a file loaded every session.
- **Have `adopt` write the rules into the skill at install time**, from an answer given then.
  Fits the budget, since only one audience's rules land. Rejected: it is still committed, so it
  still decides for the whole team, and it makes the installed skill differ from the released
  one — which `adopt --update` then has to reconcile forever.
- **Print the reminder once per session rather than on every command.** Cheaper and less
  repetitive. Rejected because there is no session: `tm` exits. Anything "once" would need state
  on disk to track what a session even is, to save a single line.
- **Print it on every command including `check`.** Symmetric, and rejected because `check` runs
  inside `git commit`. Its output is read by a hook and skimmed by a person who did not ask a
  question; a line addressed to an agent in the middle of it is aimed at nobody.
- **Default unset to `coder`.** Tempting, because `coder` is what everything already does.
  Rejected: it would make the tool assert a style nobody chose, and there is a real difference
  between *this user wants bullets* and *nobody has said*. The first is a setting; the second is
  a question `adopt` should ask (`PLT-8kg9`).
- **A richer set of types** — `coder`, `non-coder`, `manager`, `designer`. Rejected as invented
  demand. Two is what there is evidence for, and the value is a string, so a third costs one
  dict entry when someone actually needs it.

## Consequences

- **The non-coder path is now a promise the project has to keep**, and nothing enforces it. A
  hook cannot see what the agent said. The banner is the whole mechanism, which is why it prints
  above every command rather than once.
- **`~4,964` of a `5,000` session budget.** This decision spends most of the headroom
  `DEC-037` left. The next command added to `tm` almost certainly trips the check, and the answer
  then is the structural one that decision already named — moving the rendering rules to a file
  read on demand — not another round of rewording.
- **Unset stays completely silent**, so every existing adopter's output is unchanged to the byte
  and nothing about this is opt-out.
- **Anything printing for a machine now has to say so.** `add --id` had to be exempted, and the
  next such consumer will have to be too. It is a small ongoing tax, paid for the banner being
  unconditional everywhere else — which is the property that makes it worth anything.
- **The setting is invisible until someone sets it.** `.env.example` documents it and
  `PLT-8kg9` will have `adopt` ask outright; until then, discovery is reading the file.
- **`nm` gained no code.** It defers to `tm audience` through its skill, rather than duplicating
  `.env` loading — which for a worktree is forty lines of subtlety, not four.

## Revisit when

- A third audience turns up with evidence behind it, rather than as a guess.
- The banner proves insufficient — an agent shows a non-coder a commit anyway — in which case
  the reminder is not the problem and the rules need to be somewhere the agent cannot pass by.
- `adopt` asks the question (`PLT-8kg9`), which may make `unset` rare enough to be worth
  treating as an error rather than as silence.
