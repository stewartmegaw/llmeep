---
id: DEC-053
title: The app pushes what it commits, on the classification tm unpushed already makes
status: accepted
decided: 2026-09-13
deciders: [stewart]
supersedes: []
superseded_by: []
relates_to: [DEC-005, DEC-042, DEC-048, DEC-003]
---

# DEC-053 — The app pushes what it commits, on the classification `tm unpushed` already makes

## Status

`accepted` — as of 2026-09-13.

## Context

The app committed and stopped there. `DEC-005` keeps git in the agent's hands and `tm` reads git
without ever writing it, so every other agent here is a person or an assistant with a terminal,
deciding when to push.

The app has no terminal behind it. It exists because principle 8 makes the repo the centre and
this is how a non-technical person reaches it — someone who cannot be asked to push, which
`DEC-042` already established. So a task filed from a phone was committed to a checkout inside a
container and went nowhere: invisible to the team, absent from anyone's next pull, and gone
entirely if that volume was replaced. Reported plainly: *the ui can currently only commit, that is
no use*.

The credential was never the obstacle. The app's own guard test has described it as holding one
that can push the adopter's repo since it was written.

## Decision

**Every commit the app makes is followed by a push, except where `DEC-042` says the range is not
the app's to send.**

| Unpushed range | The app |
| --- | --- |
| `records` | Pushes, without asking. |
| `code` | Commits, does not push, and says the change is not live because a push is where a deploy starts. |
| `no upstream` | Commits, and says there is nowhere to push to. |
| push fails | Commits, and reports the failure verbatim. |

**The classification is read, not recomputed.** `tm unpushed --json` exists for this, on
`tm board --json`'s reasoning: the rule about which commits may leave a repo should have one
implementation, and a second one in the app would drift the first time a record tree is added.

**A failed push is reported, never swallowed.** The person is told the change is committed and not
live. That is a state they can act on; a success that is half true is not.

## Alternatives considered

- **Push everything it commits, unconditionally.** What was asked for, and it is right in every
  case except one: a push moves the branch, so a records commit made from a phone would carry any
  unpushed code out with it and possibly into a deploy. `DEC-042` decided that this is the
  adopter's call, and nothing about the app changes the argument — it makes it sharper, because
  the person holding the phone is the one least able to judge what a deploy would do.
- **Ask in the reply, the way `DEC-042` has the agent ask.** Rejected as a first move: the app's
  tools write `tasks/` and `notes/` and nothing else, so it cannot act on a yes. Offering a choice
  it cannot honour is worse than explaining why it stopped. If the app ever gets a verb for
  pushing a whole branch, this is the decision to revisit.
- **Push from `tm` instead** — a `tm push` verb the app calls. Rejected: `DEC-005` and `DEC-042`
  both rest on `tm` only ever reading git, and the banner, the hooks and `unpushed` all assume it.
  A verb that pushes would put the one irreversible git act inside the tool every adopter runs.
  The app is an agent, and pushing is what an agent does here.
- **Pull or rebase when the push is rejected.** Rejected: a non-fast-forward means someone else
  moved the branch, and resolving that is a judgement with a working tree at stake. The app says
  the push failed and why.
- **Commit on a branch of its own and open a pull request.** A real design, and a different
  product: it needs a host API, a vendor, and a person to merge. `DEC-042`'s split already lets
  records travel safely on the branch someone is on.

## Consequences

A change made on a phone is live for everyone else by the time the reply is read, which is what
the app was for.

**The container now needs a remote it can write to**, and says so when it has not got one rather
than failing quietly. That is a deployment requirement the README states.

**The `code` case is now visible to a non-coder** — a warning saying their change is committed and
not live. `DEC-042` accepted that git becomes visible at exactly this point and bounded it to one
question: whether the project is live.

**A push happens inside a request.** Reading the board and asking a question do not push, because
nothing was committed; the network call is on the turns that changed something.

`selftest` asserts all of it against a real bare remote: a records commit arrives there, a range
with code in it does not, no upstream and a deleted remote each report rather than fail, and a
read-only turn leaves the remote untouched.

## Revisit when

The app gets a verb that can push a branch with code on it — then the `code` row becomes a
question it can honour, and `DEC-042`'s "asks" applies here as written.
