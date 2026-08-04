# The platform nudges never fire in an adopted repo

Two checks in `tm` ask git what changed under `platform/`:

| Site | What it does |
| --- | --- |
| `tm:1133` | new files under `platform/` with `ontology/domain/` unchanged — suggests the domain ontology is stale |
| `tm:1164` | files under `platform/` changed with no task in progress — the backstop for "every piece of work has a task" |

`adopt` deliberately does not create `platform/`, because an existing repo already has its code
and it stays where it is (`PLT-7g78`). So in every adopted repo both pathspecs match nothing,
both checks pass unconditionally, and the one mechanical backstop for the task rule is silently
absent. Nothing warns that it is absent, which is the worse half.

## What it should be

`platform` is **the repo minus llmeep's own paths** — everything that is not `tasks/`, `notes/`,
`decisions/`, `ontology/`, `.notes/` or `.claude/`. That definition is correct for a greenfield
clone, an adopted repo, and a nested (`--into ops`) install alike, and needs no configuration.

## The trap

Done naively this fires constantly in llmeep's own repo. `README.md`, `.gitignore` and
`.env.example` all sit outside the record trees, so editing the README would report "platform
changed with no task in progress" — a false positive on the most-edited file in the project,
which would train everyone to ignore the nudge. That is worse than the nudge not existing.

So the exclusion list has to cover repo-level documentation and configuration too, and the test
is llmeep itself: a README-only commit must stay silent, and a commit touching `platform/` or
`src/` with no task in progress must not.

## Acceptance

- [x] A commit touching only `README.md` or root config produces no nudge in this repo
- [x] A commit touching code with no task in progress nudges, in a greenfield clone and in an
      adopted repo where the code sits at the root
- [x] `--into ops` behaves the same, with the skeleton one level down
- [x] The `platform` definition is stated in `ontology/core.md`, since it stops being "the
      `platform/` directory" and becomes a rule
