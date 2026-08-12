---
id: DEC-034
title: Maintainer tooling lives at the root and does not ship to adopters
status: accepted
decided: 2026-08-12
deciders: [stew]
supersedes: []
superseded_by: []
relates_to: [DEC-003, DEC-008, DEC-018, DEC-033]
---

# DEC-034 — Maintainer tooling lives at the root and does not ship to adopters

## Context

`DEC-033` built feedback in two halves: adopters draft, and llmeep collects. The collecting half
shipped as `tm feedback --sweep`, which put it in the executable every adopting repo installs —
and therefore in `tm --help`, in the shipped `.env.example`, in the shipped `tasks/_tooling`
ontology, in the shipped skill, and in a shipped `blueprints/sweep.sh`.

Every one of those is a file an agent reads. A client project's agent duly read them and told
its owner that `FEEDBACK_REPOS` was unset, explained what the collecting end was for, and
offered to point their install at a fork they own.

Nothing malfunctioned. The tooling described itself accurately, in a repo that had no business
knowing the feature exists. A client engaged to build their own product does not need to learn
that their task tracker has an upstream, that the upstream collects reports, or that they could
run their own collection — and being offered it invites a question they should never have been
handed.

The mistake was not the wording. It was assuming that "one executable with subcommands"
(`DEC-003`) meant every command belongs in it.

## Decision

**A tool only its maintainers run lives at the repo root, beside `adopt` and `selftest`, and is
never installed.** `adopt` builds its manifest by walking `tasks/_tooling` and `notes/_tooling`
plus a short explicit list, so the root is already the place nothing ships from — `adopt` and
`selftest` have always been there and no adopter has ever seen either.

So `tm feedback --sweep` becomes `./sweep`. `tm` keeps the drafting half, which is genuinely the
adopter's: they write feedback about the tooling they use.

**`DEC-003` is unchanged and was never in tension with this.** "One executable" is about the
system an adopter gets — `tm` is still one command with subcommands, and no vendor-specific
logic has moved anywhere. A script that only ever runs in this repo is not part of that system.

**The sweep loses `--send`.** The notifier lives in `tm` and `DEC-008` keeps exactly one of it,
so posting from a root script would mean either a second channel dispatcher or a *post this
text* command added to the executable every client installs — putting back the surface this
decision removes. The report goes to the person who ran it, and cron mails stdout like any other
job.

**The draft format is now read by two programs.** `tm feedback` writes `## YYYY-MM-DD` entries;
`./sweep` parses them. That duplication is accepted because the two halves genuinely run in
different repos and cannot share code. `selftest` is the guard: it writes with a real `tm` in a
real adopted repo and reads with the real `./sweep`.

## Alternatives considered

- **Keep the command, delete the documentation.** The smallest change, and it fails on
  `tm --help`, which lists every subcommand and is the first thing an agent runs when it wants
  to know what a tool does. Undocumented-but-present is not hidden, it is merely unexplained,
  which is worse — the agent finds it and has to guess.
- **Gate it on the repo being llmeep.** Cheap, and it leaves the code, the help line and the
  config key in every install. It answers "can they run it" and not "can they see it", and the
  complaint was about seeing it.
- **Keep `--send` by adding `tm notify <text>`.** A general "post this string" command would
  solve it in three lines and hand every client a way to post arbitrary text to their team
  channel from the command line. Rejected on blast radius alone.
- **Ship the sweep but document it as ours.** Tried implicitly — the ontology section said "only
  useful if you maintain llmeep or a fork" and the client's agent surfaced it anyway. A caveat
  in prose does not stop a reader who is looking for unset configuration to helpfully offer to
  set.

## Consequences

- **Adopters see exactly one feedback feature**, the one that is theirs. Nothing in an install
  mentions collection, and a selftest case walks a freshly adopted repo asserting that no file
  in it contains `FEEDBACK_REPOS`, `--sweep` or `cmd_sweep`.
- **This needs a release to reach anyone.** v34 shipped the leaky version, so every repo updated
  to it still carries the maintainer-facing text until they take the next one.
- **A general rule now exists** for a category that had no home: llmeep tooling that is not part
  of what llmeep gives you. `adopt`, `selftest` and `sweep` are that category.
- **The root gets busier.** Three scripts now, and nothing stops a fourth being added carelessly.
  The check is the same question each time: would an adopter ever run this?

## Revisit when

- A root script needs something substantial from `tm` that is not worth duplicating. Two small
  parsers is a fine price; a third copy of the board reader would not be.
- Collection moves to GitHub issues, which changes where the sweep reads from but not where it
  lives.
