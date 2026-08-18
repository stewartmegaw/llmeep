---
id: PLT-5d25
title: A sent agenda rolls to a dated file, so the next one starts clean
created: 2026-08-18
---

# PLT-5d25 — A sent agenda rolls to a dated file, so the next one starts clean

## Context

Nothing happened to a sent agenda. `tm agenda` saw the existing draft, reported `sent <date>`,
and starting next week's meant clearing the file by hand. Beside it sat `agenda.sent`, a second
file whose only job was saying whether the first had gone out.

Noticed on first real use, from the `.notes/` listing: two files, one of them metadata.

## Decided

**A successful send renames the draft to `agenda-YYYY-MM-DD.md`.** The next `tm agenda` finds no
draft and creates a clean one, reporting `last sent 2026-08-18, kept as agenda-2026-08-18.md`.

`agenda.sent` is gone. The date is in the name, and **a live `agenda.md` is unsent by
construction** — which removes the mtime comparison behind `edited since` as well.

**Only a successful send rolls.** `NOTIFY=none` announces nowhere, which is not a send; a draft
that never left is still the draft.

**Two sends in a day are two files**, suffixed rather than overwritten. The second is usually a
correction, and losing the first loses the record of what the room was actually shown.

## Coverage gap, stated rather than hidden

The roll itself is **verified manually** — a local webhook sink, a real send, the rename and the
clean next draft — and **not covered by `selftest`**. Rolling requires a send that succeeds, and
every fixture here quietens itself with `NOTIFY=none` precisely so no test can reach a channel.
An attempt to run a webhook sink inside the suite had the install reading a stale `.env`, for a
reason not worth more time than it had already taken.

What is covered: that a *failed* send does not roll, that no marker file is left, that the
scaffold is refused, and that a bare run never sends. What is not: the rename after a real send.
The gap is narrow and known — anyone touching `agenda_send` should re-run the manual check.

## Acceptance

- [x] A successful send rolls the draft to a dated filename
- [x] The next `tm agenda` starts clean and names the last sent file
- [x] `agenda.sent` is gone, and with it `edited since`
- [x] A failed send leaves the draft alone, with a test
- [x] Two sends in one day keep both files
