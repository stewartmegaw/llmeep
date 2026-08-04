# tm check --release

A release cut produces a tree that has never existed on `main`: records emptied, decisions
cleared, directories that git could not carry. Nothing checks what that difference broke, so
each defect was found by eye after publishing.

Three consecutive cuts shipped wrong, all on 2026-08-03:

| Version | Defect | Found by |
| --- | --- | --- |
| v2 | Carried all 25 of llmeep's decision records | Stewart, reading the branch on GitHub |
| v3 | Ten README links pointed at `decisions/DEC-*.md`, deleted by `--all` | me, after tagging |
| v3 | `notes/raw/` and `tasks/platform/tasks/` absent — git cannot track an empty directory | Stewart |
| v5 | Fifteen more dead links, same cause, in `tasks/_tooling/ontology.md` and `notes/_tooling/ontology.md` | the check below, run by hand |

Each was cheap to fix and cheap to detect. None was detectable from `main`, which is the point:
the checks that matter here are exactly the ones `tm check` cannot run in the repo it lives in.

## What it checks

Run inside a cut tree, after both resets and before the commit:

- **Records are empty.** Both boards have no task lines, both `history.tsv` are header-only,
  `notes.md` has no entries.
- **No adoption markers.** Neither `tasks/UNADOPTED.md` nor `notes/UNADOPTED.md` exists — their
  presence means a reset did not run.
- **Decisions are cleared** but `decisions/_template.md` survives, which is the `--all` contract.
- **Documented directories exist.** Every directory drawn in `tasks/_tooling/ontology.md` and
  `notes/_tooling/ontology.md` is present in the tree, which is what catches an empty one git dropped.
- **No dead relative links.** Every relative markdown link in a committed `.md` resolves. This
  is the check that would have caught v3, and it is worth running on `main` too.

## Acceptance

- [x] `tm check --release` passes on a correctly cut tree
- [x] It fails on each of the three defects above, reproduced from the v2 and v3 trees
- [x] The cutting recipe in `README.md` includes it as a step before `git commit`
- [x] It is not wired into any hook — a release cut is deliberate and rare, and `check` must
      keep its no-side-effects contract (`DEC-009`)

## Open

Whether the dead-link check belongs in plain `tm check` rather than behind `--release`. It is
the one check here that is not release-specific, and `main` has had broken links before.
