# .notes — local working memory

**Gitignored.** Everything here is local to one machine and disposable. This README is the
only file in this tree that is committed.

The counterpart is [`notes/`](../notes/ontology.md), which is shared and durable. The
distinction is [principle 4](../ontology/principles.md): `notes/` is what the project stands
behind; `.notes/` is one machine's thinking, in progress.

## Structure

| Path         | Holds                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| `sessions/`  | Per-session working logs. `YYYY-MM-DD-<topic>.md`.                        |
| `scratch/`   | Anything transient: drafts, output dumps, experiments, dead ends.         |

## The rule that matters

**Nothing may depend on `.notes/`.** No task, note, ontology file, script or automation may
reference it as a source of truth. A teammate cloning this repo gets none of it, and that
must break nothing.

If something here matters, **promote** it:

| It is…                            | Promote to                     |
| --------------------------------- | ------------------------------ |
| work that needs doing             | a task in `tasks/`             |
| a choice that was made            | a decision in `decisions/`     |
| knowledge someone else will need  | a note — `notes/nm add`        |
| nothing of the above              | delete it                      |

Promotion is deliberate and one-directional. Scratch never becomes truth by drift.

## Sessions

A session log is a scratchpad for one working session: what you are trying to do, what you
found, what you tried, what is still open. Its value is resuming after an interruption —
not archival.

End a session by triaging the log: promote what matters, then let the rest rot. There is no
obligation to keep it, and no obligation to tidy it.

## Capture goes to `notes/raw/`, not here

There is deliberately no inbox in this folder. Something noticed mid-flow belongs in
[`notes/raw/`](../notes/ontology.md) — committed, so a teammate can process it, and with a
lifecycle rather than a file that only fills up. `.notes/` is for material with no future.
