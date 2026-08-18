---
id: PLT-fupy
title: "Lead the README with what it looks like: tasks, standup --send, notes, agenda"
created: 2026-08-18
---

# PLT-fupy — Lead the README with what it looks like: tasks, standup --send, notes, agenda

## Outcome

Someone landing on the repo sees what using it looks like before they read a word of argument.
Images first: a rendered board, a standup arriving in Telegram, notes being captured and
promoted, an agenda being built.

## Context

The README opens with three paragraphs of reasoning — why most scaffolding is wrong, what is
left when you delete it — and reaches a command about forty lines in. That order is right for
someone already persuaded and wrong for someone deciding whether to care. The argument is good
and should stay; it should stop being the front door.

**What the images should show**, in the order someone would meet them:

- **Tasks** — a board rendered in a conversation, which is the daily loop and the least
  screenshot-able thing about a pile of markdown files.
- **`tm standup --send`** — the report arriving in Telegram. The one moment where a flat file in
  a repo visibly does something a tracker charges for.
- **Notes** — a transcript going in and three notes coming out, one promoted to a task. The
  funnel is the part people do not expect.
- **Agenda** — a draft assembled conversationally and posted. Newest, and the clearest
  demonstration that the records are for people rather than for the tool.

## Points to hold

- **Every image is a real terminal or a real phone**, not a mockup. The whole claim is that this
  is small and already works; a rendered mockup would undercut it.
- **They go stale.** An image of a board is a copy of a format that changed twice this month.
  Whatever ships has to be cheap to regenerate, and it is worth deciding *now* whether that means
  a script, or accepting staleness, or few enough images that redoing them is trivial.
- **The argument keeps its place**, further down. It is why anyone stays.
- **`adopt` is one command and should be visible early** — part of the pitch is that there is
  nothing to set up.

## Acceptance

- [ ] The README opens with what the thing looks like, and the argument follows it
- [ ] Images cover tasks, the standup arriving, notes and the agenda, and are real captures
- [ ] There is a stated answer for how they get refreshed when a format changes
