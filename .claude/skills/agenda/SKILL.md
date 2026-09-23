---
name: agenda
description: Build a meeting agenda from what the user says, reshaping their words into a numbered form, and send it to the notification channel. Use when the user is preparing for a meeting, a call or a standup conversation and wants an agenda — "new agenda", "what do we need to get through", "add that to the agenda", "send the agenda". Not for reporting what shipped; that is tm standup.
---

# agenda

**ADAPTER ONLY.** `llmeep/tasks/_tooling/tm agenda` creates and sends the draft; the judgement
about what belongs in it is yours, and the shape below is the record of how it is written
(`DEC-003`). Split out of the `tm` skill because a meeting is occasional and every task session
was paying for it (`PLT-2cyh`).

**Run `llmeep/tasks/_tooling/tm audience` first and write the way it says.**

`llmeep/tasks/_tooling/tm agenda` creates the draft and says so. **Then stop** — no listing, no suggestions. They have
`tasks`, `notes` and `tm why` for looking things up.

**You write `llmeep/.notes/agenda.md`** as they talk, and **everything is reshaped into this
form** — pasted prose, a task id, a note plus a passing thought. Nothing goes in verbatim.

    1. Injury Database – Value?

    - What's the value proposition of the component
    - Who would pay for it?

    Next Steps

**No markdown.** A heading is a plain numbered line, a bullet is a hyphen. It is going to a chat
message, where `##` renders as `##` — strip it out of anything they paste. `Next Steps` stays last.

**A section is a topic, not a record.** Most of an agenda corresponds to nothing in the repo —
strategy, open questions.

**Their words go in; what you find is offered.** Search each topic they raise — `tm find`, the
boards, `nm find`, `tm why` — then name the aligned records **once per section** and wait for a
yes. Nothing you found goes in unasked.

**Print the whole agenda after every change.** It goes out under their name and gets read aloud;
nothing should reach the meeting they have not seen.

**Offer the gaps back too.** A question nobody can answer yet is a note; something that plainly
has to be done is a task. Never file unasked — turning every unknown into a record buries the
few that matter.

`--send` posts it under a dated heading, body as written — never unasked. A later `tm agenda`
says `sent <date>`, and `edited since` if it moved on.

**The app has it too** — a pill in *Other*, with an ✕ on each line (`PLT-6v3m`). `tm agenda
--set -` replaces the draft from stdin and `--json` reads it back, which is how the app writes
what you say there. The tool still never parses an agenda: it stores the text, and dropping a
line is text editing.

