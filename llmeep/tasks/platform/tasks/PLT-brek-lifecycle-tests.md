# Test the install lifecycle, not just the records

`tm check` has fourteen validators and every one of them checks *records* — boards parse, ids are
unique, links resolve, a release tree is empty. Nothing checks that the thing an adopter runs
still works.

`DEC-028` shipped three bugs through that gap on 2026-08-04, in two releases:

| | What broke | Found by |
| --- | --- | --- |
| v27 | `is_clone` looked for `tasks/_tooling` at a clone's root, so **no adopter could fetch v27 at all** | a user asking how to upgrade |
| v27 | `do_update` joined `SRC` directly instead of via `src_of` and **died partway through**, leaving a half-updated install | the same conversation |
| v28 | update **split `ontology/` in two**, orphaning the adopter's own `domain/` behind an empty duplicate | testing the *nested* case after guessing wrong about which case was real |

They have one thing in common and it is not carelessness: **every one was tested, and all the
testing was of a fresh clone and a fresh adoption.** Neither exercise ever upgrades anything, so
the entire update path — the code most likely to break, because it is the only code that has to
understand two versions at once — was covered by nothing.

The third is the sharpest lesson. It was found only because a guess about trace's layout turned
out to be wrong. Had trace been flat, v28 would have shipped and the bug would have waited for
the next nested adopter.

## What this has to cover

A matrix, not a checklist. The axes are **layout** and **transition**:

```
                       fresh install   update from previous   update from N-2
  greenfield clone          ✓                  —                    —
  adopt, default folder     ✓                  ✓                    ✓
  adopt, --into ops         ✓                  ✓                    ✓
  adopt, flat (pre-v27)     n/a                ✓                    ✓
```

Each cell asserts the same things, and they are the assertions that would have caught all three:

- **the tooling runs** — `tm check` and `nm check` both clean from the installed location
- **records survive** — a board line, a note, a `history.tsv` row and a file in
  `ontology/domain/` all present and unchanged afterwards
- **nothing is duplicated** — exactly one `ontology/`, one `tasks/`, one `.env`
- **paths resolve** — `.claude/settings.json` allowlist and both `SKILL.md` name a path that
  exists; `core.hooksPath` points at a real directory
- **no half-states** — a refused update must write nothing. Full atomicity is not claimed:
  copying is file-by-file with no rollback (`PLT-fqcz`); what is pinned is that the guards
  run before the first write

`--dry-run` deserves its own row: it must report the same moves the real run performs, and
perform none of them.

## Constraints

- **Standard library, no install step** (`DEC-003`). The tests are a script, like everything
  else here. `unittest` is in the stdlib and is enough.
- **No network.** Fixtures come from local clones of tags — `git clone --branch v26 <this repo>`
  — so the suite runs offline and pins what it is upgrading *from*.
- **No vendor CI file in the committed core** (principle 3, and the reasoning `DEC-016` and
  `DEC-017` already settled). Ship a runnable script; wiring it to a scheduler or a CI
  provider is the operator's act, exactly as `blueprints/standup.sh` is.
- **Records are not test fixtures.** The suite builds throwaway repos in a temp directory and
  must never touch this one — `tm reset` inside a test repo, never here.

## Where it lives

Open question worth deciding rather than defaulting. `llmeep/tasks/_tooling/` is taskman's
machinery, and this tests `adopt`, which is neither taskman's nor notes'. A sibling to `adopt`
at the repo root matches what it tests, and keeps it out of the trees `reset` clears.

Whatever holds, it must be in `managed()` or deliberately excluded — a test suite that updates
itself into an adopter's repo is noise for them, so probably excluded.

## Care

- **Cloning tags of this repo means the suite depends on release history.** A shallow local
  clone is fast, but a fresh checkout with no tags cannot run the upgrade rows — skip them with
  a clear message rather than failing.
- **`version_of` returns `unreleased` for a clone of `main`**, and update refuses unreleased onto
  released without `--force`. The suite has to either tag its fixtures or pass `--force`
  deliberately, and should assert that guard rather than route around it silently.
- **Telegram.** `done` notifies. Every test repo needs `NOTIFY=none` in its `.env`, or a run of
  the suite spams the team channel.
- **This is the first thing here that is slow.** Dozens of clones and copies. Keep it out of the
  pre-commit hook — a slow hook gets bypassed, taking `check` with it, which is the reasoning
  already recorded for `check --nudge`.

## Acceptance

- [x] A single command runs the suite and exits non-zero on failure
- [x] Greenfield clone: install, `tm add`, `tm check`, `nm check` all pass
- [x] Adoption covered for the default folder, `--into ops`, and a repo that already has a
      `tasks/` directory
- [x] Upgrade covered from the two previous releases, for flat, default and `--into` installs
- [x] Each upgrade asserts records survived and `ontology/domain/` was neither duplicated nor lost
- [x] `--dry-run` reports what the real run does and changes nothing on disk
- [x] A *refused* update is asserted to write nothing — retargeted from "a broken source",
      which does not fail: a missing file is filtered out of `managed()` rather than
      crashing. True atomicity is a separate gap, filed as `PLT-fqcz`
- [x] The suite runs offline and never writes outside its temp directory
- [x] Not wired into the pre-commit hook; how to run it is documented in one place
