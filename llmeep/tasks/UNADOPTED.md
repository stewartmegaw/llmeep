# These records belong to the skeleton, not to you

This file's **existence is a flag**. Nothing reads what is written in it.

While it is here, `tm` assumes the task records in this directory are the skeleton's own —
the tasks that built this tool, not the tasks of whatever you are making.

## Why that matters

`tm add` and `tm go` search history automatically and print what they find, because retrieval
you have to remember to do is retrieval that does not happen. That is a good property right up
until the history belongs to someone else — then the tool quietly answers *"have we tried this
before?"* with a stranger's work, and it looks exactly like your own.

## What to do

```sh
tasks/_tooling/tm reset        # shows what would go
tasks/_tooling/tm reset --yes  # does it, and deletes this file
```

`reset` clears both boards, `history.tsv` and the task sidecars. It **keeps** `ontology.md`,
the tooling and the decision records — those are the parts worth inheriting.

Once this file is gone the nudge stops, and it does not come back.

## If you are working on the skeleton itself

Then this file is correct and you should leave it. It is absent from the `release` branch,
which is why a normal clone never sees it.
