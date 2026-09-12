---
id: DEC-051
title: A prompt nobody says out loud belongs in the tool's output, not in a skill
status: accepted
decided: 2026-09-12
deciders: [stewart]
supersedes: []
superseded_by: []
relates_to: [DEC-003, DEC-033, DEC-049, DEC-050]
---

# DEC-051 — A prompt nobody says out loud belongs in the tool's output, not in a skill

## Status

`accepted` — as of 2026-09-12.

## Context

`DEC-050` moved the *formats* out of the skills. What is left in them divides cleanly by what
fires it.

Most of a skill fires on something the user said: "what's next", "park that", "why is it like
this". A skill loads when its subject comes up, so those rules are in the only place they could
be.

A few fire on nothing anyone says. **Spend a pass on whether llmeep got in the way** fires after
a commit. **Would a reasonable person propose the opposite next month?** fires after work that
changed established behaviour. Nobody asks for either, which `DEC-049` already showed to be the
failing case for a skill: at the moment such a rule must fire, nothing has come up, so nothing
loads the file that holds it.

Two things follow, and they point the same way. The rule is unreliable — it fires only if the
agent happens to have loaded the skill for another reason. And it is *vendor-scoped*: for
feedback that is the whole defect, because the value of the feature is friction reported from
projects on other people's agents, and the prompt existed only in `.claude/`.

## Decision

**A prompt with no utterance behind it is printed by the command in whose flow it belongs.**

`tm done` prints the feedback question when `FEEDBACK` is on, beside the handover line it already
prints. The skill keeps nothing: the question, the hard *nothing from this project* constraint and
the path to the rubric all travel with the prompt.

**Not a git hook.** The ontology's *there is no hook, and there will not be one* stands, and this
does not touch it. A hook that reminded would print into commit output — `DEC-015`'s failure,
which `DEC-016` recorded as the emptiest room available, most of all when an agent is committing.
`done` is a command somebody ran, printing to whoever ran it, and it is not on the commit path:
it cannot block, slow or fail a commit. `selftest` holds that line directly — a committing
adopter with the switch on must see no new gate and no new output.

**Once per closed task**, on the same argument as the handover line: a prompt on every command is
a prompt nobody reads.

## Alternatives considered

- **A `post-commit` hook.** The first design, and rejected on the ontology's existing reasoning
  rather than on new grounds. Worth writing down because it will look right again: the hook
  already runs `tm check --nudge`, so the mechanism is there and free. What is not free is the
  room — commit output, which this project has already measured as unread.
- **Leave the prompts in the skill and accept the cost.** What `DEC-050` rejected for formats,
  for one more reason here: a skill is one vendor's file, and this particular prompt exists to
  collect reports from repos that are not running that vendor.
- **A second `SessionStart`-style trigger in the adapter.** `DEC-049` warned that one hook is an
  adapter and several is a runtime. This adds no adapter trigger at all — the prompt is in the
  portable executable, so an agent with no adapter gets it too, which is the reverse of the trade
  that warning was about.
- **Print it on every `tm` command**, the way the audience banner prints. Rejected: the banner is
  one line of standing context, and this is a task to perform. Asking for a pass fifteen times a
  session is how a prompt gets trained out.
- **Have `tm feedback` itself carry the guidance only.** It already does when run. That is the
  rubric's home and not a trigger: the command has to be chosen before it can say anything, and
  being chosen is the part that was missing.

## Consequences

The `tm` skill loses ~130 tokens and gains nothing to maintain in their place; a task session is
~3,830 against `DEC-037`'s 5,000.

**Every adopter gets the prompt**, on any agent, and a human closing a task by hand sees it too.
That is the half of the loop that was missing, and it is the half that determines whether `sweep`
ever has anything to collect.

**The feedback loop's reliability now depends on `done` being run**, which the records already
depend on — `done` is the only thing that writes history, and a close that skips it is already a
defect the hooks catch.

`selftest` asserts the prompt fires with the switch on, stays silent with it off, names a rubric
file that exists, and does not appear on `status`, `go`, `board` or `park`.

## Revisit when

A third prompt of this shape appears. Two is a pattern; three in different commands means the
question is where the *flow* is, not where each prompt is, and that is a different design.
