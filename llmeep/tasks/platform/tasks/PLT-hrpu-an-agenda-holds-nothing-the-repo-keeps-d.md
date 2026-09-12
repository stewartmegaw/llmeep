---
id: PLT-hrpu
title: An agenda holds nothing the repo keeps — decide whether it should exist at all
created: 2026-09-12
---

# PLT-hrpu — Does an agenda belong in llmeep?

## Outcome

Either a decision saying why an agenda is worth its machinery, or the machinery is gone. Not a
third state where it stays because nobody looked at it.

## Context

**This is a question for whoever uses agendas, not a defect to fix.** The evidence below is what
makes it worth asking; the answer is a judgement about how the tool is actually used, and the
person raising it does not use it.

### What an agenda is, checked rather than remembered

- It lives at `.notes/agenda.md`, which `.gitignore` covers. [Principle
  4](../../../ontology/principles.md) says `.notes/` is "local and disposable" and **nothing may
  depend on it**.
- Its content is, by the skill's own description, "mostly nothing in the repo — strategy, open
  questions".
- `--send` posts it to the notification channel and rolls the file to a dated name. **Nothing in
  the repo records that a meeting happened, or what it covered.**
- [Principle 8](../../../ontology/principles.md) says everything besides the repo is a way of
  reaching it and "holds nothing of its own". An agenda holds something of its own and then
  discards it.

### What it costs

- 42 lines in `tm` and five functions: `agenda_path`, `agenda_rolled`, `roll_agenda`,
  `cmd_agenda`, `agenda_send`.
- A skill of its own since `PLT-2cyh` — ~596 tokens when a meeting is mentioned.
- A verb, a `--send` path, a dated roll, and the `AGENDA_ROLLED_RE` that reads the rolled names
  back.
- **No decision.** `tm why agenda` finds none, and the one citation the code makes — `DEC-038`
  — names a decision that was never written (`PLT-um7k`).

### The case for keeping it

Preparing for a meeting is real work, and the alternative is a document somewhere llmeep cannot
see. The skill already does the part that feeds records back: it offers unknowns as notes and
obvious work as tasks. If an agenda is how those get caught, it earns its place.

### The case against

Everything valuable about it is the feeding-back, and that needs no file, no verb, no roll and
no skill — a conversation plus `nm add` and `tm add` does it. The rest is a composer for a chat
message, which is the one thing in llmeep that keeps state nothing else can see.

## Acceptance

- [ ] Decided, either way, and recorded — a decision if it stays, a removal if it goes
- [ ] If it goes: the verb, the five functions, the skill and the `.notes` paths all go with it
- [ ] If it stays: the decision says what is lost by deleting it, which is the part nobody has
      written down
