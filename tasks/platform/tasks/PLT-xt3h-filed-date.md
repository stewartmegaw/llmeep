# Record a filed date on tasks

An open task has no date anywhere in the records. `history.tsv` gets a row on completion, and
`recent` lines carry a done date, but nothing says when a line was filed — so "what has been
sitting in the backlog for a month?" is unanswerable from the board.

Git holds it approximately and badly. `git log -S'PLT-cajd' -- tasks/platform/board.md` returns
`2026-08-03 Rename the taskman folder to tasks`; the real filing was `2026-08-02`, findable only
under the pre-rename path. Renames break it, the granularity is *when the board change was
committed* rather than when `add` ran, and `release` branches have the records cleared entirely.

## Why this is not the metadata the board refuses

The board holds "nothing else — no counter, no metadata", because
[a field that does not exist cannot conflict between branches](../../_tooling/ontology.md).
That argument is about **fields that change**. A counter increments on both sides of a fork; a
priority number gets edited by two people; `blocked:` resolves at different times.

`filed:` is **written once, by `add`, and never touched again.** Two branches cannot disagree
about it, because only the branch that created the line ever writes it — and that line does not
exist on the other side. The union merge rule for pool lines already handles it with no new
case.

That distinction is the whole justification, and it should go in the ontology next to the
no-metadata rule rather than being rediscovered later.

## It is a filing date, not a backlog date

The obvious reading is "date it entered the pool". Wrong for two reasons: `add -n` files
straight into `prioritised` and would get nothing, and the date would have to be rewritten — or
deleted — every time a task moved section, which is exactly the mutable field the board avoids.

**Set it in `add`, never change it, and let it travel with the line.** Its meaning is then
constant wherever the task sits, and age is `today - filed` in every section.

## Shape

A tag, so it needs no new line format:

```
PLT-xt3h Record a filed date on tasks        filed:2026-08-03
```

- `TAG_RE` (`tm:45`) must learn `filed:YYYY-MM-DD`. It anchors on the full token, so a malformed
  date silently stops being a tag and gets absorbed into the title — check that case.
- **Absence is legal, permanently.** Every line filed before this ships has no date, and
  back-filling from git would write the wrong ones (see above). `check` must accept a missing
  `filed:` and never warn about it, or the first run errors on every existing board.
- `_parse_recent` (`tm:200`) keeps only `@` tags on completed lines. `filed:` should drop with
  the others — `history.tsv` has the completion date, and a finished task's age is not something
  the window needs to carry.

## What surfaces it

The `BACKLOG` section of the standup is the reason this exists — a pool line that has been there
for six weeks is the one worth talking about. Decide whether that means showing the date, showing
an age, or sorting by it.

**Sorting is the tempting one and needs care.** The pool is unordered *by design*
(`DEC-027`), and sorting the standup's view of it by age is a display choice, not an ordering —
it must not write the board back in that order, or the pool quietly acquires the ranking the
split removed.

## Care

- **A date the tool computes must not imply precision it lacks.** `DEC-015` refused to say how
  long something had been in progress because no start date existed. This creates a real one, so
  "filed 12 days ago" becomes honest — but only for lines that have the tag.
- **`tm reset`** clears boards wholesale, so nothing to do; **`check --release`** runs against
  empty boards and should stay silent.
- **Two-space tag separation.** `render()` ljusts to 56 then joins tags with two spaces; a long
  title plus a second tag needs checking against `_parse` reading it back.

## Acceptance

- [x] `tm add` writes `filed:<today>` on the new line, in both ledgers and with `-n`
- [x] The tag survives `prioritise`, `go` and `park` unchanged
- [x] `done` drops it, as `_parse_recent` already drops `detail` and `blocked:`
- [x] A line with no `filed:` is valid forever — `check` neither errors nor warns
- [x] A malformed date is caught rather than silently swallowed into the title
- [x] A title long enough to fill the column still parses back with both tags intact
- [x] The standup's `BACKLOG` section surfaces age, without reordering the board
- [x] The ontology records why a write-once tag is exempt from the no-metadata rule
