---
id: DEC-055
title: One signed endpoint says something upstream moved, and the records are settled before the result is pushed
status: accepted
decided: 2026-09-13
deciders: [stewart]
supersedes: []
superseded_by: []
relates_to: [DEC-016, DEC-042, DEC-053, DEC-054]
---

# DEC-055 — One signed endpoint says something upstream moved, and the records are settled before the result is pushed

## Status

`accepted` — as of 2026-09-13.

## Context

`DEC-053` made the app push what it commits, which turned it into a writer on a branch other
people write to. It had no inbound half at all: the container fetched nothing, so it drifted until
its next commit was a merge nobody asked for, on the file everybody touches.

`DEC-054` had just made the resolution of that merge deterministic, which is what makes acting on a
push safe rather than hopeful.

## Decision

**`POST /api/refresh` means something upstream moved.** It takes a push payload, acts only on the
default branch, and does one of five things: nothing (`current`), a fast-forward, a merge whose
records are settled by `tm resolve` and then committed and pushed, an abort when anything outside
`tasks/` or `notes/` conflicts, or a refusal when something is staged outside the records.

**The signature is the whole gate, and it fails closed.** The route sits in front of
`LLMEEP_AUTH_HANDLED`, because that gate is about authenticating *people* and a webhook is not one.
It verifies `X-Hub-Signature-256` as an HMAC over the raw bytes, in constant time, and with no
`HOOK_SECRET` set it refuses every call rather than trusting one.

**Generic route, borrowed scheme.** `/api/github` would put a vendor's name in the committed core,
which `DEC-016` refused for a workflow file. The signature format is GitHub's because that is what
most senders already produce; nothing else about the route knows who is calling.

**The settled records are pushed, not just held locally.** A merge resolved only here would leave
everyone else pulling the version git got wrong.

**A code-only push is still followed**, and reported as `records: false`. Only record changes are
worth acting on, but a checkout that refuses to follow code diverges anyway, which is the problem
this endpoint exists to prevent.

## Alternatives considered

- **Poll instead of a webhook** — fetch on a timer, or when the last fetch is older than N. It
  needs no inbound route, no secret and no ingress change, and it is the only option that works for
  an install behind a VPN or an identity-aware proxy, where GitHub's POST can never arrive. Not
  taken: the maintainer chose the webhook alone. **The limitation is real and worth stating: an
  install GitHub cannot reach gets no refresh**, and for those deployments the answer is still a
  poll.
- **Fire the app's agent at it** — have the model decide what to do about the push. Rejected:
  this is a deterministic sequence with a documented answer, and spending a model call plus an
  adopter's tokens on "run these four git commands" is the wrong tool at the wrong price.
- **Rebase the app's local commits onto the remote** instead of merging. Rejected: a rebase
  rewrites commits the app has already pushed in the ordinary case, and the merge is the thing
  `tm resolve` is built to settle.
- **Let git resolve the records and check afterwards.** Rejected on `DEC-054`'s evidence — the
  clean merge is the dangerous one, and "check afterwards" means someone has to look.
- **Return before doing the work**, so the sender gets its 2xx immediately. Worth doing if a
  hosting provider ever complains: the work is seconds, and answering with what happened is more
  useful than answering fast.

## Consequences

A push from anybody reaches the app, and what everyone pulls afterwards is a board that was settled
by the model rather than by git's opinion of it.

**The endpoint is reachable without a person's credentials**, which is new for this app. It is
bounded by the signature, by acting only on the default branch, and by doing nothing but git
operations on the records — but it is a surface that did not exist, and `HOOK_SECRET` is now
security-relevant configuration.

**An install GitHub cannot reach gains nothing from this.** Named in the alternatives above so that
nobody has to rediscover it.

**A conflict outside the records leaves the container behind rather than half-merged**, and says so.
That is the honest failure: somebody has to do that merge.

Nine tests, against a bare remote and a second clone standing in for whoever else pushes —
including the clean merge git gets wrong, an aborted foreign conflict leaving `HEAD` and the working
file untouched, and the signature rejecting a wrong body, a wrong signature, an absent one and any
call at all when no secret is configured.

## Revisit when

Someone runs this where GitHub cannot reach it. The poll above is the answer, and it does not
conflict with this decision — the same `refresh` behind a timer.
