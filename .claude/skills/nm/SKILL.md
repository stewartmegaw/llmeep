---
name: nm
description: Notes — capture, distil and promote. Use when the user pastes a call transcript or meeting notes, shares something worth remembering, mentions an idea in passing, or asks what was said/decided/captured ("here's the transcript", "note that down", "did we discuss X", "turn that into a task").
---

# nm

**ADAPTER ONLY — no logic here.** All behaviour lives in `notes/_tooling/nm`; the model is
`notes/ontology.md`. If you want to add rules, they belong in one of those, so people using
other agents get the same system (`DEC-003`, principle 3).

Run from the repo root:

```sh
notes/_tooling/nm add [--from <src>] <text...>   # capture; reads stdin for batch
notes/_tooling/nm drop <NTE-id | file>           # remove a note, or a processed capture
notes/_tooling/nm promote <NTE-id> [-b] [-n]     # note becomes a task, linked both ways
notes/_tooling/nm prune [--yes]                  # bound raw/, drop shipped notes; dry without --yes
notes/_tooling/nm find <term>                    # search every note ever captured
notes/_tooling/nm reset [--yes]                  # clear notes when adopting the skeleton
```

## Distilling is your job, not a command

There is deliberately **no `nm process`**. Deciding what in a conversation mattered is judgement,
so `nm` never parses a transcript — you do.

**When the user pastes a call transcript or meeting notes**, do this in one pass without being
asked:

1. Read it and decide what survives.
2. `nm add --from <source>` with one note per line on stdin.
3. `nm promote` the ones that are actually work.
4. Tell the user what you captured and what you promoted — briefly.

```sh
notes/_tooling/nm add --from acme-call <<'EOF'
Acme want SSO before they will renew
Their security review lands 2026-09-15
Sam owns the Stripe migration end to end
EOF
```

**Text is a shell argument, so quote it or use stdin.** A `;`, `&`, `|`, `(` or `)` in what the
user said will split the command and silently truncate the record — the tool never sees the rest.
Heredoc is the safe default when the text is anything but plain words.

`--from` is a short slug for where it came from: `acme-call`, `standup`, `board-review`.

**Never write the transcript to disk.** Not to `notes/raw/`, not anywhere. An exported call is
large and mostly noise, `raw/` is committed, and git would keep it permanently — pruning clears
the working tree, not history. The note is the artifact; the transcript is scaffolding.

## What survives

| Keep | Discard |
| --- | --- |
| Decisions made, and what was rejected | Greetings, small talk, scheduling |
| Commitments — who will do what | Restatement of what everyone already knew |
| Facts that change a plan — a customer need, a slipped dependency, a constraint | Anything already in the repo |
| Open questions raised and left unresolved | Thinking-aloud that led nowhere |

The test for a line earning its place: **would someone act differently for having read it?**
A note that fails that is noise wearing a summary's clothes.

Expect to discard most of it. A thirty-minute call is usually three to six notes. If you are
producing fifteen, you are transcribing rather than distilling.

## Translating what the user says

| They say | You run |
| --- | --- |
| pastes a transcript / "here are the notes from the call" | distil → `nm add --from <src>` → `nm promote` the actionable ones |
| "note that down" / "remember that" | `nm add <text>` |
| "that should be a task" | `nm promote <NTE-id>` |
| "did we discuss X" / "what did they say about Y" | `nm find <term>` |
| "what's in the inbox" | `ls notes/raw/` |
| "I've processed that file" | `nm drop <file>` |
| "drop that note" / "that one's wrong" | `nm drop <NTE-id>` — removes it from the archive *and* history |
| "I've just cloned this to start a project" | `nm reset` to see what goes, then `--yes` — and `tm reset` too |
| "what have we captured lately" | `cat notes/notes.md` |

## When asked for notes, summarise them

**Show the 20 most recent and say how many remain** — `…and 34 older, `nm find` or ask for all`.
The file holds up to 200 because an agent reads it whole cheaply; a person scanning a phone does
not. Storage and presentation are bounded separately and by different numbers.

**Read `notes/notes.md` first, every time.** Never render the list from memory or from the
example below — ids are four random characters and a plausible-looking wrong one is
indistinguishable from a right one until someone acts on it.


Render the archive compactly, grouped by date, and **lead with the count of unprocessed
captures** — that is the actionable part, and it is invisible in `notes.md`.

**Render as markdown, never a code block** — a code block scrolls horizontally on a phone,
which is where this gets read. Date, then `---` on its own line. Bold the id. Blank line
between notes. `###` heading for the date, `---` under it.

**Leave a blank line after every `---`.** Without one the terminal renderer swallows the rule
into the line below and prints a literal `---NTE-shmy` — tested 2026-08-02.

    3 captures waiting in raw/

    ### 2026-08-01
    ---

    **NTE-shmy**  Acme want SSO before they will renew → PLT-9wmv ✓

    **NTE-enu9**  Sam owns the Stripe migration → PLT-2m4x

    **NTE-k8dq**  Their security review lands 2026-09-15

    ---

    *promote · drop · find · discuss*

End with the rule and hint line whenever there are notes. **Never link the ids** — relative
markdown links to repo files render as "unsupported link" over Remote Control.

**Mark a linked task `✓` once it is done** — one `grep -f` of the linked ids against
`taskman/_tooling/history.tsv`. A ticked note is awaiting removal, not hidden: `nm prune` deletes
it outright, window and history row both, because the task now carries the record.

**Offer `nm prune` when you see ticks.** That is the command that clears them.

Mark promoted notes with their task. Drop the `src:` tags unless asked — provenance matters when
searching, not when reading. No commentary.

If captures are waiting, offer once to distil them; do not distil unasked.

## Rules

**Never write a bare id in prose.** Attach a title snippet — `PLT-9wmv (add tm standup)`, not
`PLT-9wmv`. Ids are four random characters, chosen to be collision-proof rather than memorable,
and this gets read on a phone away from the repo. Rendered lists are exempt: the title is already
on the line.

- **A note is one line**, capped at 200 characters. Anything longer is a task or a decision
  wearing the wrong clothes.
- **Promote eagerly.** A note that is clearly work should become a task in the same breath — do
  not leave the user to ask. A note that is context stays a note forever, and that is fine.
- **A promoted note survives until its task ships**, then `nm prune` deletes it. Until then a
  task can be parked or dropped, and the note is the only record the idea existed.
- **`notes/raw/` is for things worth reading again** — a written summary, a shared document, an
  idea to process later. The test is whether anyone would open it twice. Presence means pending;
  there is no processed marker.
- **Reading is `cat notes/notes.md`.** There is no `list`, on the same grounds as the board.
- **Decisions are not notes**, and live at `decisions/`, outside this subsystem — claims the
  project stands behind, never edited in substance. Do not put one through this pipeline.
