# platform — your project goes here

This directory is intentionally empty. It is a hole, not a scaffold.

The skeleton makes **no assumption** about what fills it: language, framework, architecture,
build system, deployment target, monorepo or single service. Per
[principle 3](../ontology/principles.md), nothing outside this directory may depend on those
choices.

## What to do

Put your codebase here — `src/`, `services/`, `infra/`, whatever shape it takes. Then:

1. Replace this file with your platform's own README: what it is, how to build it, how to
   run it, how to test it.
2. Describe its domain in [`ontology/domain/`](../ontology/domain/README.md).
3. Add platform-specific ignores to a `.gitignore` **in this directory**, not the root one —
   the root ignores stay language-agnostic so the skeleton remains mergeable.

## The boundary

Everything above this directory — `ontology/`, `tasks/`, `notes/` — is about the project.
Everything inside it is the project.

Keep the boundary clean:

- The skeleton does not reach into `platform/`. Tooling that manages tasks and notes must
  work identically whether this directory holds Rust or nothing at all.
- `platform/` does not reach out. Application code does not read `tasks/` or `notes/`.
- If your platform needs its own docs, they live in here. `notes/` is for knowledge about
  the project, not generated API reference.
