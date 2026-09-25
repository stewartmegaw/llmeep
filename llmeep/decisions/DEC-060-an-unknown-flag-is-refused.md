---
id: DEC-060
title: An unknown flag is refused, never ignored
status: accepted
decided: 2026-09-25
deciders: [stewart]
supersedes: []
superseded_by: []
relates_to: [DEC-003, DEC-018]
---

# DEC-060 — An unknown flag is refused, never ignored

## Status

`accepted` — as of 2026-09-25.

## Context

`tm` and `nm` parse their own argv: each command picks the flags it cares about out of the
list and ignores the rest. That is fine until two copies of llmeep are in play at once, which
is now the ordinary case rather than the exotic one — the web app ships as an image and the
install it drives is a clone of the adopter's repo, and the two are updated on separate
schedules.

An adopter hit it. The image was built from vN+1 while the repo the pod clones was still on
vN, because the `--update` had not been committed and pushed yet. The agenda screen showed:

```
{"error": "Expecting value: line 2 column 3 (char 3)"}
```

The API calls `tm agenda --json`. vN's `tm agenda` had no `--json`, ignored it, printed its
ordinary human-readable draft summary and **exited 0**. `json.loads` then choked on prose.

The existing guard could not catch it. `explain()` in the API only inspects runs that failed —
a non-zero exit, or usage text — so a tool that accepts a flag it has never heard of and
succeeds never reaches it. From every angle upstream, the run had worked.

The same silence had already cost something smaller: `tm agenda --unpublish`, a verb that
deliberately does not exist, fell through the flag handling and created an agenda called
"monday" beside the one the person meant.

## Decision

Every command declares the flags it answers to — `FLAGS` in each tool — and anything else is
refused with a non-zero exit, before the command runs. The message names the flag, lists what
the command does take, and says the install may be older than whatever is calling it.

A flag's *value* is exempt: `--set`, `--reply`, `-f`, `--after`, `--period`, `--msg`,
`--from` are followed by the user's own words, which may begin with a dash. A bare `-` is
stdin.

## Alternatives considered

- **Leave it permissive, and catch the decode error at the far end** — rejected because it
  fixes one caller. The hazard is not `json.loads`; it is a tool reporting success for work it
  did not do, which is wrong for every caller including a person at a terminal. Catching it
  downstream also has to be written again at each of the four call sites, and once more for
  the next one.
- **Compare the image's version with the install's manifest version and warn** — rejected on
  the argument already in `explain()`'s docstring: asking the install what it can do beats
  comparing versions, because a version test needs a release to exist before it can be written
  and goes stale at every rename. It is also a second implementation of "are these two
  compatible", drifting from the first.
- **Per-command checks, as `agenda` already had** — rejected as the shape that produced this.
  One command out of twenty-three had the check, which is indistinguishable from none when the
  caller is a program. The table is the same code once, and a test asserts every dispatched
  command has an entry, so it cannot rot quietly.
- **Accept the flag and warn on stderr** — rejected because the caller reads exit status, not
  stderr, and a warning nobody is listening to is the state we are leaving.

## Consequences

- An adopter running an install behind the app now sees which flag is missing and is told to
  update, instead of a parser error naming a column number.
- A typo fails instead of doing something adjacent. `tm agenda monday --privte` is now a
  refusal rather than a new agenda.
- Adding a flag means adding it in two places — the command and `FLAGS`. The cost is paid
  once per flag and caught by `test_every_command_declares_its_flags` when it is not.
- Anything scripting `tm` with a flag that was silently tolerated will now break. That is the
  intent; a script relying on an ignored flag was already not doing what it read as doing.
- This does nothing for installs already in the wild, whose old `tm` is the one being called.
  Knowingly accepted: the fix is forward-looking, and the failure it prevents only exists
  between a caller and an install that are both current enough to have it.

## Revisit when

A flag needs to be genuinely optional across versions — a caller that wants to pass `--json`
to both an old and a new install and take whichever it gets. Nothing needs that today, and
the honest answer then is a capability query rather than a permissive parser.
