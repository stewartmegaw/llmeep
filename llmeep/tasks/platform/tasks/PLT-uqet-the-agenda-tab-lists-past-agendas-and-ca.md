---
id: PLT-uqet
title: The agenda tab lists past agendas and hands a new one to the agent
created: 2026-09-23
---

# PLT-uqet — The agenda tab lists past agendas and hands a new one to the agent

## Outcome

The agenda tab shows the draft, a list of the agendas already sent, and a way to start a new one.
Sent agendas are currently write-only: `roll_agenda` files each under `.notes/agenda-<date>.md`
and nothing ever reads one back, so a year of meetings accumulates as a directory nobody opens.

## Acceptance

- [ ] `tm agenda --json` returns every rolled agenda, not just `last_sent`
- [ ] a past agenda can be read back — by the tool and in the tab
- [ ] the tab lists past agendas by **title**, falling back to the date
- [ ] "Create agenda" switches to the conversation tab and hands off to the agent
- [ ] `tm agenda "<title>"` writes the title as the draft's first line
- [ ] `--send` heading carries the title: `Agenda — Monday board call, 2026-09-23`
- [ ] the server serves `.notes/agenda-YYYY-MM-DD[-n].md` and nothing else under `.notes`

## Context

**A title, given by the user, is the cheapest context there is.** "Monday board call", "1:1 with
Sam" and "investor update" produce completely different offers from the agent, and without one it
has to ask — a round trip that costs most on a phone, which is where this tab exists. It pays off
twice: a column of dates is not worth scanning, a column of titles is the meeting history.

The title is the draft's **first line**, written by `tm agenda "<title>"`. That is a second
positional rule in a file the tool deliberately does not parse — *first line is the title*
beside *`Next Steps` is last*. Two rules is not a format; a third would be, so the line holds
there.

**Create agenda hands off to the chat, and this reverses a recorded position.** `PLT-s9e7`
removed candidate-listing from `tm agenda` and the skill says "Then stop — no listing, no
suggestions", because framing a meeting around the slice a board happens to notice was wrong
twice over. The distinction being drawn now: a *tool* listing records mechanically is what was
rejected; an *agent* offering things is judgement (principle 7) and can say "you parked the
pricing question three weeks ago", which no query produces. `DEC-051` also says a prompt with no
utterance belongs to the tool — bare `tm agenda` takes no argument — so the button spending a
model turn is deliberate and against the cheaper path. **That earns a decision record, not a
quiet edit to the skill.**

**The read is a new path through the server's security boundary.** `.notes` is gitignored and
outside `READ_TREES`, so serving a past agenda widens what the app can read. Narrow it to the
`agenda-YYYY-MM-DD[-n].md` shape with no traversal rather than widening `READ_TREES`.

`PLT-hrpu` asks whether the agenda should exist at all, and that question sits above this one.

## Log

- 2026-09-23 — Filed. Shape settled with the user in conversation: titles, chat handoff, and
  listing the past ones.
