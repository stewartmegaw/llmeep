---
id: DEC-063
title: The app may read what the repo tracks, and may never quote it back
status: accepted
decided: 2026-10-08
deciders: [stewart]
supersedes: []
superseded_by: []
relates_to: [DEC-042, DEC-052, DEC-005]
---

# DEC-063 — The app may read what the repo tracks, and may never quote it back

## Status

`accepted` — as of 2026-10-08.

## Context

The app's tools wrote and read records and nothing else. That is the right boundary for
writing — `WRITABLE` is three trees and every write goes through a verb — but it made the chat
unable to answer an ordinary question about the project it sits inside. "Is the ticket feed
handled anywhere yet", "what does the spec say about accuracy", "where does the ingest run" all
needed a terminal, which is the thing this app exists so that somebody never needs.

Two things had to be settled to let it read at all.

**What may be read.** The app has no login of its own; it sits behind whatever the adopter put
in front of it. A reader that took a path would need to defend against traversal forever, and a
reader that took any file would hand `llmeep/.env` — which holds the model key and the review
keys — to anyone who could reach the screen.

**What may be said.** A phone is not where anyone reads source, and a transcript full of
somebody's code is noise at best. The person asking is explicitly someone who may not be a
developer.

## Decision

The app may read **what the repo tracks** — `git ls-files` — and nothing else.

Tracked means committed, and a commit of this repo already reaches every teammate and the
remote, so reading it through the app discloses nothing the repo was keeping. Anything
gitignored is outside the boundary by construction rather than by a list somebody has to keep
correct, and `.env` is gitignored in every install because `adopt` writes that rule. A second
check refuses anything whose name looks like a credential, for the repo where somebody once
committed one.

A path is matched **verbatim against that set**. Nothing is joined onto a directory until the
path is known to be one of ours, so `../`, absolute paths and symlinks out of the tree fail by
not matching rather than by being detected.

**It reads to answer, and never quotes.** The prompt says to answer in the reader's own terms,
to name a path but never show its contents, and never to reply with a code block. On a turn
that actually read a project file, fenced blocks are stripped from the answer and replaced by a
line saying the code is in the repo — a mechanical backstop, narrow on purpose, because an
instruction is only an instruction.

**It cannot write them.** There is no verb, and `WRITABLE` is unchanged.

## Alternatives considered

- **Catalogue every project file, as `catalogue()` does for documents** — rejected on size. The
  catalogue is rebuilt per request and shipped to the browser for the Other tab; a repo of a few
  thousand files would make every page load carry a list nobody is going to browse. The
  catalogue stays the boundary for *documents*, which are few and are meant to be read.
- **An allowlist of readable directories in `.env`** — rejected because it is a second
  configuration of something git already answers, and it fails the wrong way: a new directory
  is unreadable until somebody remembers, so the feature quietly stops working.
- **Read anything under the repo root, with a denylist of secret names** — rejected. A denylist
  is a list of the secrets somebody thought of; `git ls-files` is a positive statement about
  what has already been published. The name check is kept, but as the second line, not the
  first.
- **Let it quote freely** — rejected on who is reading. Also the transcript is not a record and
  is not committed, so code pasted into it is in the one place nobody can find it again.
- **Enforce the no-quoting rule by refusing the whole answer** — rejected as worse than the
  problem: a turn that did the work and then lost its reply is the failure `PLT-mrt8` already
  taught us to avoid. Stripping the block and saying so keeps the answer.

## Consequences

- The chat can answer questions about the project, which is most of what anyone would ask it
  that it previously could not.
- A file that is tracked is readable through a screen that may have no login in front of it.
  That is the accepted cost, and it is bounded by the same thing that bounds `git clone`: if it
  should not be readable, it should not be committed.
- A newly written file is unreadable until it is committed. That is correct — it is not part of
  what the repo says yet — and it will surprise somebody.
- The no-quoting rule is an instruction with a narrow mechanical backstop. A model determined to
  paraphrase a file line by line is not prevented, and nothing here claims otherwise.
- `.env.example` is excluded by the name check although it is tracked and harmless. Over-strict
  in that one case, and not worth a carve-out that weakens the rule.

## Revisit when

An adopter wants the app to answer about work in progress rather than committed work, or a repo
turns up where tracked files genuinely must not be read by everyone who can reach the app. The
first needs a decision about reading the working tree; the second needs the app to have a notion
of who is asking, which it deliberately does not.
