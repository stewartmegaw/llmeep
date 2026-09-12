---
name: decisions
description: Search, explain and write the records the project stands behind — why something is the way it is, what was rejected, and what supersedes what. Use when the user asks why a thing is built this way, what was decided about X, whether something has been tried before, or wants the decisions tidied ("why is it like this", "what did we decide about auth", "have we tried this", "can we prune the decisions"), and when work is about to change or has just changed established behaviour. Not for tasks or notes; those are the tm and nm skills.
---

# decisions

**ADAPTER ONLY.** `llmeep/tasks/_tooling/tm why` searches and explains; the judgement about
whether a decision is owed is yours, and the model — lifecycle, what `check` enforces, the three
triggers and the four cases that are not one — is **Decision** in `llmeep/ontology/core.md`. Split out of the `tm` skill because changing established
behaviour is occasional and every task session was paying for it (`PLT-2cyh`, `PLT-buj6`).

**Run `llmeep/tasks/_tooling/tm audience` first and write the way it says.**

```sh
tm why <term>                 # search every decision, pruned ones included
tm why DEC-000                # explain one: supersession chain, who cites it, where
tm why --stale [--yes]        # records nothing references; --yes prunes to a stub
```

## Before changing established behaviour

**Run `tm why <term>` first.** If a decision already covers it you are **superseding, not
editing** — and finding that out now is cheaper than at commit time, where `check` refuses a
rewrite and is right to.

Supersession is claimed from both sides: the old record gets `superseded_by`, the new one
`supersedes`, and `check` enforces the pair.

## Afterwards, one question

**Would a reasonable person propose the opposite next month?** `tm done` asks this on every
close, because nothing anyone says out loud triggers it (`DEC-051`).

- **Yes** → write it. Copy `llmeep/decisions/_template.md`, fill the frontmatter, and say what
  you considered and **why not** — the rejected option and its reason are the whole value. A
  reader who cannot tell whether an alternative was weighed or never seen has nothing.
- **No** → say nothing and move on. Not for bug fixes, renames, or anything whose opposite is
  obviously wrong. A decision per change is how the folder becomes noise.

**Never write one silently.** Say you have, and why: it is a claim the project stands behind,
not a side effect of the task.

## Tidying

`tm why --stale` lists records nothing references. **Run it without `--yes`.** Unreferenced is
not the same as finished with — whether a decision still binds is the user's judgement, never
yours — and a pruned record leaves a stub rather than vanishing.

## Answering "why is it like this"

`tm why <term>` first, then `tm why DEC-000` on what it finds. Quote the decision rather than
paraphrasing it, and **never a bare id**: `DEC-027 (filing and ranking are separate acts)`.
A decision that turns out not to exist is a defect — `check` reads every citation now — so say
so rather than reasoning around it.
