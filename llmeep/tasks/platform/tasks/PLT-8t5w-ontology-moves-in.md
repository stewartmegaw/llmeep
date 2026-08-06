# PLT-8t5w — Move llmeep's ontology under llmeep/, make the project ontology a path

Follow-on from `PLT-eb7v`. Adopting into another project created a repo-root `ontology/`
holding 464 lines, none of them about that project. `DEC-032` has the argument.

## What changed

**Layout.** `ontology/` is nested now — `NESTED` gained it, so `src_of`/`dest_of` place it
under the install folder without further special-casing. `domain/README.md` and
`domain/_template.md` flatten to `domain-ontology.md` and `domain-template.md`: a `domain/`
directory that is not for your domain files was the misleading part.

**Configured path.** `.llmeep` gains an `ontology` key. `tm ontology <path>` records it,
`--none` declines, and `install_self` carries it across updates. `tm` parses the manifest
header rather than importing the installer.

**The check.** `check_ontology_currency` watches the recorded path, is silent after `--none`,
and when never asked warns with the command that ends it — instead of an unsatisfiable nudge
on every commit that adds a source file.

**Migration.** `--update` sweeps llmeep's four files from both possible homes (repo root for
post-`DEC-028` installs, install folder for older ones), gated on the manifest checksum so a
file the adopter edited stays put. Theirs never move; their directory becomes the recorded
path. A repo-root `ontology/` left empty is pruned.

## Two bugs found while testing this

- **`.claude/` was never covered by the kept-file protection.** Skips were recorded for the
  trees and not for the agent adapters, so an adopter who already had `.claude/settings.json`
  got it kept by `copy` and then recorded under *their* checksum — `PLT-s9ea` exactly, on the
  one path still installed at the repo root. Present since that fix, hidden behind the
  ontology case that found it. Fixed, and the `PLT-s9ea` test moved onto it: the original
  path stopped being reachable once llmeep's ontology moved in.
- **A pathspec resolves against the working directory, output paths do not.** `tm`'s `git()`
  defaults to `cwd=REPO`, so a recorded `ontology` matched `llmeep/ontology/` and the check
  passed on llmeep's own files. Silently. Fixed with `cwd=top` and a comment saying why.

## Acceptance

- [x] Nothing llmeep ships lands at the repo root except `.claude/`, `.llmeep` and `adopt`
- [x] A repo with its own `ontology/` adopts cleanly and it is left untouched
- [x] All four states of the currency check behave: unset asks, `--none` silent, configured
      warns when stale, configured passes when staged
- [x] `--update` from v26, v32 and v33 migrates without moving or losing the adopter's files
- [x] A recorded path survives an update
- [x] 15/15 selftests, `tm check` clean, tm skill back under the 4,000-token budget
- [x] `DEC-032` written, `DEC-028` marked superseded

## Still to do

`../bridge/bridge-source` is on the old layout and needs updating — the next thing.
