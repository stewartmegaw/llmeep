---
id: DEC-039
title: Code review is a gate on pushing, performed by models that did not write the code
status: accepted
decided: 2026-08-19
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-003, DEC-005, DEC-008, DEC-016, DEC-033]
---

# DEC-039 — Code review is a gate on pushing, performed by models that did not write the code

## Context

`tasks/_tooling/ontology.md` said, of the board: *"**No review state**, deliberately. With one
developer, or with AI-generated changes at volume, a review column tracks a step nobody
performs. Where acceptance criteria exist, they are the quality gate."*

That was right about a **column** — a status someone has to remember to move, which decays into
theatre. It was never an argument against review itself, and its premise has inverted: *"AI
generated changes at volume"* was the reason to skip review, and is now the reason to have one.
Acceptance criteria remain a gate, and they are written by the same agent that then decides it
met them.

## Decision

**Review is a gate on `git push`, not a state on the board.** Nothing moves between sections,
nobody remembers anything, and the enforcement is a hook rather than a habit.

**Up to two reviewers, and neither is the agent that wrote the code.** `tm review` sends the
commit — its message, its task's sidecar, its diff — to each configured LLM. Each returns bullet
points where it is not satisfied, or `SATISFIED`. **Any objection from either counts**: a second
reviewer is there to catch more, not to overrule the first.

**The agent does not mark its own homework.** It may fix a point, or answer one with
`tm review --reply "<answer>"` — which goes *back to the reviewer*, who decides whether the
point stands. There is no local override. Only reviewers returning nothing writes the mark.

**The mark names what was reviewed**: `reviewed: <hash of the diff> by <reviewers>`, added by
amending the commit. Hashing the diff rather than the commit id is what makes that possible —
adding the trailer rewrites the id, and would otherwise invalidate the review that produced it.
It also means a commit whose content changes afterwards fails the gate rather than carrying a
mark that has stopped being true.

**A `pre-push` hook refuses commits without a valid mark.** The hook cannot run a review — a
hook cannot call an LLM (`DEC-016`, `DEC-033`) — but it does not need to. It checks the outcome,
exactly as `commit-msg` refuses a `closes` naming no task, which is what puts the gate outside
the flow it gates.

**Off by default**, because it spends the adopter's own API budget on every commit.

**Fail open when a reviewer is unreachable**, and say so in the mark: `reviewed: … by openai
(xai unreachable)`. A third party's downtime is not a reason nobody can ship. If *no* reviewer
answers, nothing is marked.

**Sending the diff out is not a new exposure.** The coding agent already holds the whole
repository; a second model reading the same material under the user's own key is the same
context in the same hands. So this needs no egress ceremony beyond being opt-in and honest about
cost — a materially lighter promise than `DEC-033` had to make, for a reason rather than by
forgetting.

## Alternatives considered

- **A review column on the board.** What the ontology rejected, and rightly. A status nobody
  moves is worse than no status, because it looks like a control.
- **Let the agent resolve points locally** — mark one *ignored* with a reason and carry on.
  Rejected: it is the whole failure mode. The party with an interest in dismissing a point
  cannot also be the party that dismisses it. Answering back costs one more call and keeps the
  judgement with the reviewer.
- **Both reviewers must object before a point counts.** Fewest false positives, and it lets a
  real problem through whenever one model happens to miss it. The union is the conservative
  reading and makes a second reviewer strictly additive.
- **Review the staged diff before committing**, avoiding the amend. Cleaner mechanically, and
  rejected because the thing being reviewed should be the thing that exists — a commit — rather
  than an index that can still change underneath it.
- **Fail closed on an outage.** Makes a vendor's availability into a condition of shipping. The
  mark says which reviewers answered, which is enough for anyone reading history to judge.
- **A vendor-specific adapter each.** Both shipped adapters speak the OpenAI chat shape, which
  is also what xAI, Groq, OpenRouter and a local server speak, so one function serves them all
  and a third vendor is usually a base URL rather than code (`DEC-008`'s shape).

## Consequences

- **The ontology's "no review state" line is superseded** and rewritten in place to say what is
  true now: no column, and a gate.
- **A commit can be pushed unreviewed** with `git push --no-verify`, exactly as `--no-verify`
  already bypasses `pre-commit`. That is deliberate: an agent with shell access can write any
  trailer it likes, so the honest ceiling is that *accidental* skipping is impossible and
  *deliberate* skipping is visible.
- **Turning it on mid-life does not flag existing history.** The hook checks what is genuinely
  new — `rev-list <local> --not --remotes` — so a new branch off an old base does not re-flag the
  base. A first push to an empty remote is the exception and needs one `--no-verify`.
- **Reviews cost money and take time**, twice per commit when two are configured. Nobody should
  turn this on for a repo where commits are cheap and frequent.
- **The prompt is a committed constant**, so what reviewers are asked is auditable and improves
  for everyone at once — and it is one more thing that drifts if the model changes underneath it.

## Revisit when

- A reviewer is found rubber-stamping. `SATISFIED` is taken at its word, and a model that always
  says it turns the gate into theatre — which is exactly what the "no review column" line warned
  about, one level down.
- Someone wants the reviewers to see more than the diff — the surrounding file, the test output.
  Each is a different bill and a better review, and the trade is worth making deliberately.
