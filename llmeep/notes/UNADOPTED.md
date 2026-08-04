# These notes belong to the skeleton, not to you

This file's **existence is a flag**. Nothing reads what is written in it.

While it is here, `nm` assumes the notes in this directory are the skeleton's own — things said
while building this tool, not things said by your team.

## Why that matters more than it does for tasks

A stale task reads as a stale task. **An inherited note reads as something your team said.**

`notes.md` currently holds observations about this repo's own internals — which rendering
tricks failed, what someone thought the board should do next. Cloned into your project they
become six confident statements of context that nobody on your team ever made, and `nm add`
surfaces them automatically as related history when you capture something nearby.

## What to do

```sh
notes/_tooling/nm reset        # shows what would go
notes/_tooling/nm reset --yes  # does it, and deletes this file
```

`reset` clears `notes.md`, `history.tsv` and any captures in `raw/`. It **keeps** `ontology.md`
and `nm` itself. Decision records live at `decisions/`, outside this subsystem entirely.

## This is separate from `tm reset`

Adoption is per subsystem. `tm reset` clears tasks and does not touch notes; this clears notes
and does not touch tasks. Run both when adopting the whole skeleton — they are two commands
because `tasks/` and `notes/` are meant to be liftable apart.

## If you are working on the skeleton itself

Then this file is correct and you should leave it. It is absent from the `release` branch,
which is why a normal clone never sees it.
