# platform — your project goes here

This directory is intentionally empty.

The skeleton makes **no assumption** about what fills it: language, framework, architecture,
build system, deployment target, monorepo or single service. Per
[principle 3](../ontology/principles.md), nothing outside this directory may depend on those
choices.

## What to do

Put your codebase here — `src/`, `services/`, `infra/`, whatever shape it takes.

## The boundary

Everything above this directory — `ontology/`, `tasks/`, `notes/`, `decisions/` — is about the project.
Everything inside it is the project.

Keep the boundary clean:

- The skeleton does not reach into `platform/`. Tooling that manages tasks and notes must
  work identically whether this directory holds Rust or nothing at all.
- `platform/` does not reach out. Application code does not read `tasks/` or `notes/`.
- If your platform needs its own docs, they live in here. `notes/` is for knowledge about
  the project, not generated API reference.
