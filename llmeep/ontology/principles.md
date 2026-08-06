# Principles

Seven rules. Everything else in the skeleton is a consequence of one of them.

---

## 1. Machine-first representation

**On-disk formats are optimised for unambiguous machine parsing and cheap retrieval.
Human readability is a secondary, best-effort property.**

The primary reader and writer of `tasks/` and `notes/` is an agent, not a person. So
records get explicit, typed, redundant structure — stable IDs, enumerated status values,
fully-qualified references, absolute dates — even where a human would find that verbose or
would prefer prose.

This is a deliberate inversion of the usual instinct. Do not "tidy" a record into something
that reads nicely at the cost of something a parser can rely on.

The corollary is that **presentation is a separate concern from storage**. When a human
needs to read the state of the project, that is the job of a display command that renders
the records — not a reason to make the records themselves pretty. A format that is hard to
read raw is fine if there is a command that renders it well.

This principle applies across the whole project, not just to `tasks/`.

## 2. Mutation flows through tooling

**Records under `tasks/` and `notes/` are created, moved and updated by skills and
automations. Not by hand, and not by ad-hoc agent file-edits.**

Hand-editing is what breaks invariants: duplicate IDs, statuses that do not match the
folder, dangling references, half-migrated formats. Routing every write through one place
means the invariants are enforced in one place.

The practical rule: if you want to change a record, there should be a command for it. If
there is no command, that is a gap in the tooling — fill the gap rather than reaching for
the editor. Hand-editing during an emergency is allowed; treat it as debt and say so.

The same applies to reading: prefer the query command over globbing the tree, so that the
tooling stays the honest interface.

### The exemption: operations with no invariant to break

This principle exists to protect invariants. Where an operation has none, requiring tooling
is friction for its own sake.

The case that matters: **reordering the task board is a hand edit.** One file holds both the
tasks and their order, so moving a line cannot desynchronise anything — there is no second
place for it to disagree with. Priority changes constantly, and putting a command in front
of the highest-frequency operation in the system would be pure tax.

The test for extending this exemption: *can this edit put two files, or two fields, into
disagreement?* If yes, it needs a skill. Allocating IDs, transitioning status and pruning
history all fail that test and stay in tooling.

### Enforcement is mechanical, not cultural

A convention that depends on remembering is a convention that decays. **Git hooks are the
enforcement point** — the commit is where the project's records are checked against reality,
because it is the one moment every change reliably passes through.

Hooks are expected to cover three things:

1. **Record integrity.** Reject a commit where a record under `tasks/` or `notes/` breaks
   its invariants: duplicate or renumbered IDs, frontmatter disagreeing with its folder,
   dangling references, a decision edited in substance rather than superseded.
2. **Lifecycle honesty.** A commit that closes work should move the task; a commit
   referencing a task ID should be committing against a task that is actually in progress. Work
   landing with no task, or tasks left in progress with nothing behind them, is drift the
   hook can see and a person cannot.
3. **Ontology currency.** A change to `platform/` that introduces or renames a domain
   concept should not land while the project's own ontology still describes the old one. A
   stale ontology is worse than none, because agents trust it. But a project that has not
   written one is not thereby stale, so the check watches a path the project records and
   says nothing until it has one — a warning nobody can satisfy is one everybody bypasses.

Hooks are checks on records, not on the platform's own code — they must stay agnostic to
whatever language `platform/` is written in (principle 3). Where a check cannot be fully
automated, it should prompt rather than pass silently. An escape hatch must exist and must
be loud.

Implemented as `tm check` plus three hooks (`PLT-001`).

## 3. Agnostic core

**No assumption about programming language, framework, architecture, or LLM vendor.**

Consequences:

- The agent contract lives in `README.md`, not in a vendor-specific file. Any agent from
  any provider can read it.
- Nothing in the committed skeleton is named for a model, a provider, or an IDE.
- `platform/` is a hole, not a scaffold. The skeleton has no opinion about what fills it.
- Tooling must be chosen for portability, not for affinity with whatever `platform/`
  happens to be written in.

## 4. Committed knowledge and local memory are different things

**`notes/` is shared and durable. `.notes/` is local and disposable.**

`notes/` is what the team — and every future agent session — is entitled to rely on. It is
reviewed, it is committed, and it changes deliberately.

`.notes/` is one machine's working memory: session transcripts, half-formed thinking, an
unsorted inbox. It is gitignored. Nothing may depend on it. Anything in it that turns out
to matter gets promoted into `notes/` or into a task.

Promotion is one-directional and explicit. `.notes/` never silently becomes truth.

## 5. Two ledgers, one model

**Work is either platform work or business work, and both are tracked the same way.**

`tasks/platform/` and `tasks/business/` use identical structure, lifecycle and tooling.
The split exists because the two have different reviewers, different cadences and different
definitions of done — not because they deserve different machinery.

If a task genuinely spans both, it belongs in the ledger that owns the outcome, with a
reference to a counterpart task in the other.

---

## 6. Context is tiered, and the working tree is bounded

**Git is already a database. The working tree carries live state and a short window of
recent history; everything older is retrieved from history on demand.**

Three tiers, with deliberately different costs:

| Tier             | Holds                       | Cost              | Lifetime |
| ---------------- | --------------------------- | ----------------- | -------- |
| **Ontology**     | What things *are*           | Always loaded     | Stable   |
| **Working tree** | Live work + recent history  | One small read    | Bounded  |
| **Git history**  | What *happened*             | Queried on demand | Forever  |

Completed tasks fall out of the working tree once the window fills. They are not lost — the
commit that created the record and the commit that removed it are both in history, and a
skill exists to search them. Nothing accumulates, so context stays bounded **by
construction** rather than by anyone remembering to prune.

This is why records do not need to hedge against being forgotten. Write for the tier: the
ontology earns permanence and should be maintained; a task line is disposable and should not
be padded with reasoning that git will remember anyway.

### Retrieval must be automatic, not instructed

Bounded context becomes **bounded amnesia** without retrieval. An agent cannot see that an
approach was already tried and abandoned, and will not spontaneously think to look — it will
simply conclude the ground is new.

The instinct is to write an instruction: *search history before starting something familiar.*
That fails for the same reason every convention fails — an agent that must **decide** to
retrieve will lose that coin flip indefinitely, and the instruction is the first thing to go
when context is compacted.

So retrieval is not an instruction. **It is a side effect of operations that already happen.**
Taskman's `add` and `go` search history automatically and print what they find; nobody
decides to search, because searching is not a separate act. This is the same move as
principle 2: mechanical, not cultural.

Two consequences for anything built on a tiered model:

- **Cold tiers need an index, not just an archive.** Retrieval that is slow gets disabled, and
  a disabled search is no search. Storing the data is not enough; it has to be cheap to query.
- **Automatic retrieval must stay quiet.** Cap the results, and return nothing when there is
  nothing. Output that is always present with weak matches gets skipped within a week, which
  is indistinguishable from having no retrieval at all.

A tiered context model without automatic retrieval is just forgetting on a schedule.

---

## 7. Judgement belongs to the agent; mechanism belongs to the tool

**Tools do exactly what they are told. Anything requiring an understanding of what someone
meant is decided by the agent and declared explicitly.**

This principle was not designed. It was noticed, after the same answer came back three separate
times:

| The temptation                                                    | What was built instead                          |
| ----------------------------------------------------------------- | ----------------------------------------------- |
| `add` infers platform vs business from the title                  | Defaults to platform; the agent passes `-b`     |
| A post-commit hook asks "is this task done?"                      | The message declares `closes PLT-007`           |
| The hook calls an LLM to judge completion when the trailer is missing | The agent decides as it writes the message   |

### Why it keeps winning

**A deterministic tool that guesses is the worst of both worlds** — unpredictable *and*
unintelligent. It fails silently and inconsistently, which is harder to debug than either a
dumb tool or a smart one.

**The intelligence is already in the room.** The agent invoking the tool is holding the
ontology, the diff, and the conversation. Infrastructure that reaches back out for judgement is
paying for something that was free a moment earlier, and paying in latency, cost and a network
dependency in the worst possible place.

**Judgement in a tool means a vendor in a tool.** Any mechanism that genuinely needs to
understand intent must either guess or call a model — and calling a model embeds a provider,
an API key and a network round-trip into infrastructure everyone depends on. That is
[principle 3](#3-agnostic-core) failing at a load-bearing point.

**Declared intent fails loudly; inferred intent fails silently.** A missing `-b` or a typo'd
`closes` is visible in what you typed. A wrong guess is invisible until something downstream is
already broken.

### The test

**Does this behaviour require understanding what the user meant?** If yes, it belongs in the
agent, and the tool should take an explicit flag, argument or declaration instead.

### Corollaries

- **Defaults are not guesses.** A default is a fixed, documented, predictable choice for the
  common case — `add` always assumes platform. A guess varies with the input. Prefer defaults;
  they remove typing without removing predictability.
- **Declare intent in-band.** A flag, a trailer, an argument. Something the person or agent
  wrote down, that can be read back and validated.
- **Validate the declaration.** Because intent is now load-bearing, a typo is a real failure
  mode. Check that the thing named actually exists.
- **Nudge, never judge.** Where a tool notices something might be wrong, it says so in one line
  and exits. Information, not a gate — a tool that blocks on uncertainty gets bypassed, and a
  bypassed tool enforces nothing at all.
