---
id: PLT-43mh
title: Opt in at install time to send improvement feedback upstream
created: 2026-08-10
---

# PLT-43mh — Opt in at install time to send improvement feedback upstream

## Outcome

A repo that adopted llmeep can, if its owner said yes at install time, send improvement
suggestions back upstream — written by the agent that has been living in the records, not by a
human filling in a form. A repo that said nothing sends nothing and spends no tokens.

## Context

The people best placed to say what llmeep is missing are the ones using it on a real project,
and they are the least likely to open an issue about it. Their agent already knows: it has run
`tm` all week, hit the friction, worked around the gap. The suggestion is cheap to produce at
the moment the friction happens and expensive to reconstruct later.

Open questions the work has to settle:

- **Opt-in placement.** `adopt` is the install surface, so the question belongs there — but
  `adopt` currently runs unattended-friendly and asking a question changes that. A flag
  (`--feedback`) plus a recorded setting is probably the shape, defaulting to off.
- **Trigger.** The suggestion is after a commit — a review pass over what just landed, asking
  "did the machinery get in the way here?". That is a hook, and hooks in this repo are
  `core.hooksPath llmeep/tasks/_tooling/hooks`, which today only validate. A post-commit hook
  that invokes an agent is a different category of thing to one that runs `tm check`: it costs
  the user tokens, it is slow, and it must never block or fail a commit.
- **Cost.** This is the part that needs to be honest and visible. Agent-driven review on every
  commit is real spend on the adopter's account. Options: every commit, every Nth, on `tm
  standup`, or only when the user asks. Whatever is chosen, the opt-in prompt has to say plainly
  that it costs tokens.
- **Cadence, once drafting is local.** Writing to a file still costs a review pass, so "every
  commit" is still a token decision even with no transport attached.

## Settled

- **Transport is a local draft.** Suggestions accumulate in a file in the adopting repo; no
  credentials, no network, nothing to configure. Every repo is on the one machine, so collecting
  them is a filesystem walk — `PLT-6tpx` sweeps a configured set of repos and reports what it
  finds, so a draft still arrives when its author has moved on. `gh issue create` is a later
  step layered on the same drafts, not a second path.

  **The draft's path and format are therefore a contract**, not an implementation choice: a
  fixed location inside the adopting repo, readable without loading that repo's records. It is
  the only thing the two tasks share, and if it drifts the sweep reports nothing while looking
  like it worked.
- **A suggestion never carries private context.** This is a hard constraint, not a redaction
  step bolted on at send time. The payload is a statement about *llmeep's machinery* — where
  the records, commands or conventions got in the way — and nothing about the adopter's code,
  domain, filenames, task titles or commit contents. If a suggestion cannot be written without
  naming something from the repo, it is not written.

  That sharpens what the review pass is even for: it is not a review of the diff. It looks at
  the interaction with the skeleton — a command run twice, a check that fired misleadingly, a
  convention worked around — and reports only that. It is the honest version anyway, since a
  suggestion phrased in someone else's domain is not usable upstream.

## What the review pass is looking for

llmeep states why it exists, and every adopting repo carries that statement: `adopt` installs
`ontology/principles.md` and `ontology/core.md` into the repo it adopts. So the reviewer is not
offering an opinion about what a task tracker should be — it has the seven principles to hand
and can say which one the friction contradicts. That shared standard is what makes a suggestion
from someone else's project usable here.

Three things worth flagging, in rough order of value:

- **Missing functionality** — the user wanted something the model plainly implies and no command
  provides. Principle 2 makes this a defect by construction: if a record needs changing and
  there is no command for it, that is a gap in the tooling, and an adopter hitting it is the
  only way anyone finds out.
- **Machinery contradicting its own principles** — a command that made hand-editing the easier
  path, a check that pushed toward a prettier record over a parseable one. The most valuable
  report of all, and the hardest to see from inside the project.
- **Friction** — a command run twice, a convention worked around, a message that read as an
  instruction when it was a note. Cheap to notice, cheap to act on.

Not wanted: preferences with no principle behind them, and anything that only makes sense for
one domain.

**The reviewer has the principles but not the decisions.** `adopt` ships
`decisions/_template.md` and nothing else — llmeep's own DEC records stay here, because that
tree belongs to the adopting project. So the reviewer knows *why llmeep exists* and cannot know
*what llmeep has already rejected*, and will re-propose settled things in good faith. That is
not a flaw in the draft; it is a triage problem, and it belongs to `PLT-6tpx`, which runs where
the decisions actually are.

## Acceptance

- [x] The opt-in exists at install time, is off unless chosen, and says out loud that it costs
      the adopter tokens
- [x] A repo that did not opt in runs exactly as it does today — no hook, no prompt, no spend
- [x] Suggestions are written to a local file and nothing sends them; the owner does that
- [x] A suggestion contains no repo content, names or domain terms — only what happened with
      llmeep's own machinery
- [x] The trigger cannot block, slow or fail a commit
- [x] A decision records the trigger and the local-draft transport, and what was rejected

## Log

- 2026-08-10 — Built. `FEEDBACK=on` in `.env`, `tm feedback` writes to a gitignored
  `feedback.md`, rubric and trigger in `tasks/_tooling/ontology.md`, `DEC-033` records it.
  Four selftest cases in `TestFeedback` assert the off-by-default gate, the `## <date>` contract,
  the ignore rule and that the commit path is untouched.
- 2026-08-10 — Two things surfaced that were not in the plan. `--update` never re-ran
  `append_ignores`, so a repo adopted before today would have got the feature and not the rule
  for it, and committed our feedback into their history on the first run; fixed, with a case that
  fails without the fix. And the `tm` skill was already at 3,993 of its 4,000-token budget, so
  carrying the trigger crossed it — recorded in `DEC-033` and filed as `PLT-fnxy`, since it is
  the one cost a repo pays whether or not it opts in.
