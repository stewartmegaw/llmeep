---
id: PLT-sx7r
title: Code review by two LLM APIs before a commit is pushed, with a permanent reviewed mark
created: 2026-08-19
---

# PLT-sx7r — Code review by two LLM APIs before a commit is pushed, with a permanent reviewed mark

## Outcome

Work that is ready to push gets reviewed first, by up to two independent LLM reviewers, and
cannot be marked reviewed until their objections are resolved, fixed, explained, deliberately
ignored, or escalated to a person. The mark is permanent and lives with the commit.

## The loop

1. A task is done and the commit is ready — **before** it is pushed.
2. Each configured reviewer is given the task (title, sidecar, acceptance) and its
   implementation (the diff), and returns **bullet points where it is not satisfied**. Silence
   is a pass.
3. The agent works the list. Each point ends as **resolved**, **fixed**, **ignored** or
   **explained**.
4. **If the reviewer and the agent cannot agree, the agent stops and asks a person.** No
   automatic override in either direction.
5. Once it passes, the work is marked reviewed by a commit — amended or added — and only then
   is it pushable.

## This reverses a written position

`tasks/_tooling/ontology.md` says, of the board: *"**No review state**, deliberately. With one
developer, or with AI-generated changes at volume, a review column tracks a step nobody
performs. Where acceptance criteria exist, they are the quality gate."*

That was right about a **review column** — a status a human has to remember to move — and is not
an argument against a review that runs itself. The premise has also moved: "AI-generated changes
at volume" was the reason to skip review, and is now the reason to have one. **A decision has to
supersede that line explicitly**, not quietly contradict it.

## Settled

**Several vendors, planned for from the start.** `DEC-008`'s shape: one function and one dict
entry per provider, the choice in `.env`, nothing in the committed core naming a model. The two
reviewers should be free to be different vendors — that is most of the point of having two.

**Agents do not mark their own homework.** The reviewer's verdict is the gate, not the agent's
opinion of the reviewer. An agent may fix, explain or propose that a point be ignored; it may
not declare the review passed. Where it and the reviewer do not agree, it stops and asks a
person — that is the *only* route past an unsatisfied point.

**Sending the diff to a reviewer is not a new exposure.** The coding agent already holds the
whole repository, and a second model reading the same material under the user's own API key is
the same context in the same hands. So this needs no egress ceremony beyond being opt-in and
honest about cost — which is a materially lighter promise than `DEC-033` had to make, and for a
good reason rather than by forgetting.

## Enforcement lives outside the agent's flow

**A `pre-push` hook refuses to push work that is not marked reviewed.** The hook cannot run the
review — hooks cannot call an LLM (`DEC-016`, `DEC-033`) — but it does not need to. It enforces
the *outcome*, exactly as `commit-msg` already refuses a `closes <id>` naming no task. The
review is agent-plus-API; the gate is mechanical and sits outside the flow being gated.

**The trailer names what was reviewed, not just that it was.** Something like
`reviewed: <hash of the reviewed diff> by <reviewer>`, so the hook can check the mark refers to
*this* content. That closes the amend-after-review drift — the record and its subject can no
longer be one commit apart — and makes a stale or copied mark fail rather than pass.

**The ceiling is honest and worth stating.** An agent with shell access can write any trailer it
likes, and `git push --no-verify` skips a pre-push hook the same way `--no-verify` skips
`pre-commit` today. So this makes *accidental* skipping impossible and *deliberate* skipping
visible — which is precisely what the existing bypass accounting does: `--no-verify` is not
blocked, it is recorded in `.git/tm-bypassed` and every later commit reports the standing count.
The same treatment should extend to pushes.

## The hard parts

**Principle 3 — no assumption about an LLM vendor.** This feature is nothing *but* an LLM
vendor, so it has to follow `DEC-008`'s shape: one function and one dict entry per provider, the
choice in `.env`, and nothing in the committed core naming a model. Two reviewers means two
entries, and they should be allowed to be different vendors — that is most of the point.

**It sends the adopter's code to a third party.** `DEC-033` went to considerable trouble so
feedback carries *no* private context; here the diff **is** the payload. That is a different
promise and must be made loudly: opt-in, off by default, and stated at install rather than
discovered. Anyone with a private repo needs to make that choice deliberately.

**It costs real money**, per commit, on the adopter's key — more than the feedback pass by an
order of magnitude. Whatever ships must say so where someone decides.

**No hook can do it.** `DEC-016` and `DEC-033` already settled that a hook cannot run an LLM and
that commit output reaches nobody. So the trigger is the agent's own flow, next to `tm done` —
which means the thing being reviewed and the thing acting on the review are the same agent.

**Judging "cannot agree" is still the agent's call**, even though passing is not. It can loop —
fix, re-review, fix — or give up and escalate, and only it knows which. Requiring a recorded
reason for every *ignore* is the cheapest guard: it does not prevent a bad call, it makes one
legible afterwards.

## Open questions

- **What happens when the two reviewers disagree with each other?** Escalate, take the union of
  objections, or treat agreement between them as the bar?
- **What if the API is unreachable?** It must not become impossible to ship. Fail open with a
  visible unreviewed mark, or fail closed and wait?
- **`tm` or its own executable?** A review is about a task's implementation, which argues for
  `tm`; but it is also the first thing here that makes a paid network call on the user's behalf,
  which argues for keeping it separable.
- **What is actually sent?** The diff alone, the diff plus the sidecar, or the whole file for
  context. Each is a different bill and a different disclosure.

## Acceptance

- [x] Off unless enabled, and enabling says plainly that it sends code to a third party and
      costs money per commit
- [x] Up to two reviewers, each configured independently, with no vendor named in the core
- [x] Reviewers return bullet points and silence means pass
- [x] Every point ends fixed, or answered back to the reviewer who raised it — *ignore* was
      dropped as an outcome, because a local dismissal is the failure mode this exists to stop
- [x] Disagreement between reviewer and agent stops for a person; nothing auto-overrides, and
      the agent cannot declare the review passed
- [x] A `pre-push` hook refuses unreviewed work, so the gate is outside the flow it gates
- [x] The mark names what was reviewed, so it cannot survive the content changing under it
- [x] A bypassed push is recorded and reported — `--no-verify` already routes through the
      existing bypass log, verified by amending after a review and watching it flag both
- [x] A decision supersedes the ontology's "no review state" line rather than contradicting it
- [x] An unreachable reviewer never makes shipping impossible

## Log

- 2026-08-19 — Built. `tm review` plus a `pre-push` hook, `DEC-039`. Two adapters, both the
  OpenAI chat shape, which is also xAI's — so one function covers both and a third vendor is
  usually a base URL.
- 2026-08-19 — **`ignore` did not survive contact with the design.** It was in the brief as one
  of four outcomes, and it is the exact failure this feature exists to prevent: the party with
  an interest in dismissing a point cannot be the party that dismisses it. So a point is fixed,
  or answered back to the reviewer — `--reply` puts the answer in the next call and the reviewer
  decides whether the point stands. One extra call, and the judgement stays where it belongs.
- 2026-08-19 — The mark hashes the **diff**, not the commit id. Adding the trailer rewrites the
  id, so hashing that would invalidate the review that produced it; hashing the diff survives the
  amend and still fails if the content changes afterwards. Verified: amending after a review is
  caught as *"carries a review of 221058ba, but its diff is 3770c4f4"*.
- 2026-08-19 — Turning it on mid-life would have flagged a repo's whole history. The hook now
  asks git what is genuinely new (`rev-list <local> --not --remotes`), so a branch off an old
  base does not re-flag the base. A first push to an empty remote still needs one `--no-verify`.
- 2026-08-19 — The `tm` skill is ~4,846 for a session against a 5,000 budget. Under, but the
  headroom `DEC-037` bought is mostly gone; `PLT-rsn4`'s deferred answer — rendering rules in a
  file read on demand — is the next move, not more rewording.
