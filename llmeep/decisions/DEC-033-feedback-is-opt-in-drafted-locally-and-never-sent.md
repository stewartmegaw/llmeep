---
id: DEC-033
title: Feedback about llmeep is opt-in, drafted locally, and sent by nobody
status: accepted
decided: 2026-08-10
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-003, DEC-005, DEC-006, DEC-016, DEC-017]
---

# DEC-033 — Feedback about llmeep is opt-in, drafted locally, and sent by nobody

## Context

llmeep is used on real projects by people who will never open an issue about it. Their agent
knows exactly where it chafes — it has run these commands all week and worked around the gaps —
and that knowledge is cheap at the moment the friction happens and gone an hour later.

Three things made this awkward to build rather than obvious:

- **It costs the adopter money.** A review pass is tokens on their account, on a repo they
  adopted for a task tracker. Anything on by default is spending someone else's budget on our
  roadmap.
- **It reads their repo.** An agent drafting a suggestion is holding a private codebase, and a
  suggestion is a thing that eventually gets sent somewhere.
- **The obvious trigger is a hook, and a hook cannot do it.** Hooks here are three-line shell
  scripts calling `tm check`. The judgement is the entire product.

## Decision

**Off by default. Drafted to a local file. Sent by a person, never by the repo.**

The switch is `FEEDBACK` in `.env`, default `off`, and `tm feedback` **refuses** while it is
off. `.env` rather than the `.llmeep` manifest: the manifest is committed, so a flag there would
opt a whole team in on one person's say-so, and what it turns on bills each of them. `.env` is
gitignored and per-checkout, which is the right shape for a choice about your own spend — and it
works in a plain clone of the skeleton, which has no manifest at all.

**The trigger is the agent, in the commit flow, and there is no hook.** `DEC-005` already puts
git in the agent's hands and completion before the commit; this sits in the same place, one step
later. The instruction lives in `tasks/_tooling/ontology.md` so every agent gets it, with a short
pointer in the vendor adapters (`DEC-003`). Because nothing is on the commit path, the trigger
cannot block, slow or fail a commit — not by care, but by construction.

**Drafts go to `feedback.md` beside `.env`, gitignored, and nothing sends them.** No network, no
credential, no schedule. `## YYYY-MM-DD` and then the text, which is a contract rather than a
rendering choice: `PLT-6tpx` sweeps this file from outside the repo, and a format that drifts
produces an empty sweep indistinguishable from having no feedback.

**A draft carries nothing from the adopter's repo** — no code, file names, domain terms, task
titles or commit contents. Not a redaction step at the end: a point that cannot be made without
naming something there does not get written. This is also the useful version, because a
suggestion phrased in someone else's domain is not actionable upstream. "Carries no private
context" and "is worth receiving" turn out to be the same rule.

**The rubric is the principles**, which every adopting repo already has because `adopt` installs
them. That is what makes a note from a stranger's project usable here: it can say which
principle the friction contradicts instead of offering an opinion about what a tracker should
be.

## Alternatives considered

- **A `post-commit` hook that runs the review.** The first idea and impossible: hooks are shell,
  and an LLM pass is not something a shell script performs. A hook that *reminded* instead was
  rejected on `DEC-016`'s finding — commit output is the emptiest room available, most of all
  when an agent is doing the committing, which here it always is.
- **On by default, with a way to turn it off.** Rejected: it spends the adopter's tokens on our
  roadmap without being asked, and the first they would know is the bill. An opt-out also has to
  be found before it can be used, and the people least likely to find it are the ones paying.
- **A prompt during `adopt`.** Rejected: `adopt` has no `input()` anywhere and runs unattended;
  adding the first interactive question to an installer to ask a favour is a bad trade. A flag
  in `.env.example` documents itself and is read at the moment someone is configuring anyway.
- **The `.llmeep` manifest as the switch.** Rejected as above — committed, therefore a decision
  made on a teammate's behalf about their own spend. The `ontology` key is fine there because it
  is a fact about the repo; this is a preference about a person.
- **Post upstream directly — a webhook, or `gh issue create`.** Rejected for now on egress: a
  draft written from a private repo should not be able to leave it by accident, and the only
  version of that guarantee anyone can check is one with no transport at all. `gh` is a later
  layer over the same drafts (`PLT-6tpx`), not a second path.
- **Commit `feedback.md` into the adopting repo.** Rejected: it is about the tooling, not the
  project, so it would land in front of a team it is not addressed to, dirty their diffs, and
  eventually reach their remote.
- **Put drafts in `.notes/`.** The obvious home for a gitignored local file, and refused by that
  tree's own contract: *nothing may depend on `.notes/`*, and the sweep would. `.env` is the
  precedent instead — gitignored, local, and depended on deliberately.
- **Have `tm` decide what belongs in a draft.** Rejected on principle 7 and `DEC-003`: the tool
  timestamps and appends, the agent judges. A script guessing at whether a complaint is about
  llmeep or about the adopter's code would be exactly the unpredictable classifier `DEC-003`
  already refused for ledger routing.

## Consequences

- **A repo that says nothing spends nothing**, and behaves precisely as it did before the
  feature existed. That is the property everything else here is arranged to protect.
- **Most adopters will never switch it on**, and the ones who do are self-selected as caring
  about the tooling. That is a small, good sample rather than a large, noisy one.
- **The `tm` skill crossed its 4,000-token budget** to carry the trigger — it has to be in the
  file loaded when someone is committing, and the ontology is read on demand. It was at 3,993
  before this, so any addition at all was going to cross; ~190 tokens went in and it now
  measures ~4,190. Recorded rather than absorbed by raising the constant, and `tm check
  --context` says so out loud, which is what the budget is for.

  **This is the one cost a repo pays without opting in.** Everything else here is behind the
  switch, but the skill loads whole whether or not the switch is on. Trimming the skill back
  under its budget is real work and belongs to its own task, not to this one.
- **Drafts accumulate with nothing clearing them.** One machine, one file, and a person deletes
  it. If that becomes annoying it is `PLT-6tpx`'s problem, since the sweep is what would re-read
  the same suggestion twice.
- **Nothing verifies the no-private-context rule.** It is an instruction to an agent, and
  instructions get ignored. Accepted knowingly: the backstop is that nothing sends, so a leak
  requires a person to read the draft and pass it on anyway.

## Revisit when

- Someone switches it on and the drafts are worthless — the rubric is wrong, or a per-commit
  pass is the wrong moment and it should hang off the standup instead.
- Enough repos opt in that reading `feedback.md` by hand stops scaling, which is the point
  `PLT-6tpx` stops being enough and a real transport earns its risk.
