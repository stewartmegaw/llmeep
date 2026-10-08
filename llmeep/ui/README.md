# llmeep chrome

A mobile-first view of an llmeep repo, for people who will not open a terminal.

**It holds nothing.** Every screen is a view of a file in the repo and every write goes through
`tm` or `nm` ([principle 8](../ontology/principles.md)). Stop the container and nothing
is lost but the door.

    llmeep/ui/
      api/       the back end — Python standard library, no dependencies
      web/       the front end — React + MUI, built by Vite
      Dockerfile one image serving both

## Running it

The image serves the front end and the API from one port, under a base path, so a k8s service
routing `/llmeep` at it needs no rewriting.

    docker build -t llmeep-chrome llmeep/ui/
    docker run --rm -p 8080:8080 \
      -v "$PWD:/repo" \
      -e LLMEEP_REPO=/repo \
      -e LLMEEP_BASE_PATH=/llmeep \
      -e LLMEEP_AUTH_HANDLED=yes-my-ingress-handles-it \
      llmeep-chrome

**You build it.** Nothing is published: the image is this Dockerfile and your repo, built where
you are going to run it. One less thing to trust, and one less registry to keep in step with a
release.

## It has no authentication, and refuses to start until you say so

Task titles say a great deal about what you are building. This app has no login and will not
grow one: putting it behind something that already does auth — an ingress, an identity-aware
proxy, a VPN — is the adopter's call and the adopter's job.

So it fails closed. Without `LLMEEP_AUTH_HANDLED` set, the container starts, explains itself,
and serves nothing. That is deliberate: a warning in a README is skimmed past, and the cost of
missing this one is your private records on a public URL.

## Configuration

| Variable | Required | Means |
| --- | --- | --- |
| `LLMEEP_REPO` | yes | Path to the mounted repo, inside the container. |
| `LLMEEP_AUTH_HANDLED` | yes | Any non-empty value. Your assertion that something in front of this handles access. |
| `LLMEEP_BASE_PATH` | no | Where it is mounted, e.g. `/llmeep`. Default `/`. |
| `LLMEEP_PORT` | no | Default `8080`. |
| `CHROME_KEY` `CHROME_MODEL` `CHROME_BASE` | for writing | The model that reads what someone typed. **Put these in the repo's `.env`**, beside `REVIEW_*` — the container reads it, and it is already gitignored. Unset means the text box is not offered and the app is read-only. |
| `LLMEEP_GIT_NAME` `LLMEEP_GIT_EMAIL` | no | Who its commits are from. Defaults to *llmeep chrome*, not to you. |

## The model is an endpoint, not a vendor

Same shape `tm review` ships (`DEC-039`): `CHROME_BASE` speaks the OpenAI chat API, which
reaches OpenAI, Anthropic's compatible endpoint, Groq, OpenRouter or something on your own
machine. Your key, your budget, your choice of model — and no vendor is privileged in anything
llmeep installs.

In `llmeep/.env`, next to the reviewers you have already configured:

    CHROME_BASE=https://api.openai.com/v1
    CHROME_KEY=sk-...
    CHROME_MODEL=gpt-4.1

Read on each request, so a line added there takes effect on the next page load rather than at
the next restart. Container environment variables of the same names still win, for a deployment
that would rather inject secrets than mount them.

**The header says when the records last changed** — `updated 12 min ago`, from the last commit
touching `tasks/`, `notes/`, `decisions/` or `ontology/`. A commit and not a working-tree mtime: a
fresh clone sets those to checkout time, so every container restart would claim everything just
happened. It answers *how current is this*, so it is the same answer for everyone looking at the
same repo, and it is deliberately coarse — "yesterday" beats "22 hours ago" to anyone who has just
woken up.

## When somebody else pushes

`POST /api/refresh` tells this container that the branch moved. Point a GitHub push webhook at it,
or fire it from anything that can sign a body.

```
HOOK_SECRET=<a long random string>     # in the repo's .env, and as the webhook's secret
```

**The signature is the whole gate.** This route sits in front of `LLMEEP_AUTH_HANDLED`, because a
push hook is not a person and cannot get through whatever fronts the app for people. It checks
`X-Hub-Signature-256` as an HMAC over the exact bytes sent, and with no `HOOK_SECRET` configured it
refuses every call rather than trusting one — the same fail-closed choice as the auth gate itself.
It is `/api/refresh` and not `/api/github` because a vendor's name in the committed core is
[principle 3](../ontology/principles.md) failing where it matters most; GitHub's signature scheme is
simply the one most senders already speak.

What it does, given a push to the default branch:

| Situation | What happens |
| --- | --- |
| Nothing new | `current`. |
| Nobody committed here | Fast-forwards. The common case and the whole of it. |
| The app committed too | Merges, settles the records with `tm resolve`, commits and pushes the result — so what everyone else pulls is the settled board, not this container's private version of it. |
| A conflict outside `tasks/` or `notes/` | Aborts. The tree is exactly as it was, and that merge is yours. |
| Something staged outside the records | Refuses to touch the tree at all. |

It follows a code-only push too, and says `records: false`. Refusing to follow your code would only
make this checkout diverge, which is the problem the endpoint exists to prevent.

**Why the merge needs settling at all:** git merging a board cleanly is not the same as merging it
correctly — a task dropped on one side while the app ranked it comes back, and nothing in the diff
looks wrong ([`DEC-054`](../decisions/DEC-054-the-deterministic-half-of-a-merge-is-the-tools.md)).

**Agenda is the exception to all of this.** It is a draft for a meeting, not a record: gitignored,
local, and gone with the machine. The screen lists it a line at a time with an ✕ on each, the text
box writes it, and neither makes a commit. `tm agenda --send` still posts it, and still only when
somebody asks.

## Reading is wider than writing

Three tabs. **Board** is what is live. **Notes** opens the notes straight away — a list with one
row on it is not a list. **Other** holds **Decisions** and **Ontology**.

**Ontology is your domain ontology**, wherever `tm ontology` recorded it — and nothing else. The
copies of llmeep's own model that `adopt` installs are skipped: an agent reads them on demand,
which is who they were installed for, and a tool for looking at your own work should not spend a
tab talking about itself ([`DEC-052`](../decisions/DEC-052-the-app-catalogues-this-repos-records.md)).
Until one is recorded the screen says so.

Decisions are listed by what they decided rather than by `DEC-044`, which is not a name anyone
can hold in their head.

**Task details are not in that list.** A detail belongs to a task and is reached by tapping
that task — a list whose every title is a task title is the board again, told worse.

Markdown is rendered rather than shown raw, because the records are written machine-first
([principle 1](../ontology/principles.md)) and that is only affordable if a person reads
them somewhere else. This is that somewhere else.

**A detail opens where you are.** Tapping *has detail* on a board card opens it over the board,
with everything else in that folder listed underneath and opening in the same sheet — sending
someone to another tab to read the thing they just tapped is asking them to hold a place in
their head and come back to it.

The sheet holds everything a folder detail carries beside its `README.md` — `DEC-011` lets a task carry a spec *and* a rubric *and* sample data, and the
board could say `has detail` while offering no way to open any of it.

**Everything is served.** Markdown renders, `csv` and `tsv` render as rows, images and PDFs
render in place, and anything else downloads. A CSV is the case worth naming: showing it raw is
a column of commas on a phone and hiding it behind a download is refusing to show someone their
own attachment. As a table it is neither.

**It opens a catalogue, never a path.** The list is built server-side and a request names an id
from it, so there is no path to traverse and nothing outside the records can be reached —
`?id=../../../etc/passwd` opens nothing, for documents and for bytes alike, and there are tests
that say so.

## One search box, every tab

The box beside the mark filters the board, the notes and the documents at once, in the browser,
over what each tab already has in hand. The tab labels carry the count — `Board 4 · Notes 0 ·
Other 1` — and **the tab does not change**: a search says where the matches are, and jumping you
to one of them takes the decision away. A zero is shown rather than hidden, because "it is not
in the notes" is most of what a search across tabs is for.

Terms are ANDed, which is how anyone narrows a list; an OR would widen it and read as the search
having broken. **A term starting with `#` is a label and matches that label whole** — substring
is right for typing, where `ulst` should find things, and wrong for a chip: tapping `#ulster`
returned everything tagged `#ulster-meeting-prep` too, which cannot answer "what is on for
Ulster". Typing the bare word still searches everything, labels included. One matcher in `search.js` is shared by the panes and by the counts, so a label
reading `Board 4` can never sit above two rows — the board's own filter pills and section
headings are counted off the searched board for the same reason.

What it does not reach: completed work, which has left the board for `history.tsv` and is
`tm find` at a terminal; captures still sitting in `raw/`; and a document's body, since only
titles are loaded until you open one. No request is made — a round trip to ask the repo about
records it has already sent would be slower, would fail offline, and would need a verb that does
not exist.

## Labels are chips, and a chip is a filter

A record's labels sit with the other things its line says about itself, drawn dashed so they
read as somebody's word rather than as something the tool worked out. Tapping one puts it in the
search box, which is already the one place this screen narrows itself — a second filtering model
beside the search would be two things to learn for one job.

On a note they sit **beside** the source, not instead of it (`DEC-062`): `src:` is where the
capture came from and a label is what it is about, and an adopter with no labels was using the
first for the second.

The agent can label too, through `label` and `unlabel` in the tool table. It names a tool and
supplies a list of words; it never supplies a command, so a label is validated for shape and
passed as its own argv entry, and which subsystem runs is decided by the id.

## A label keeps its colour

A label's colour comes from its name — twelve pairs of a readable text colour and a faint fill,
chosen by a hash of the word. Nothing is stored: a colour that was *chosen* would be a field on
every record, a verb to set it, and a merge rule for when two people picked differently, all to
settle something nobody has an opinion about until they see it. Derived instead, the same label
is the same colour on every card, in the filter row, on every device, for everyone.

The cost is that nobody can choose, and that is the right trade: the colour is there to tell two
labels apart at a glance, not to mean anything. A colour that had to mean something would be a
second vocabulary on top of the first.

The hash gets an avalanche finish before the modulo. FNV-1a alone is strong in its high bits and
weak in its low ones, and the low bits are what a modulo reads — over a realistic set of twenty
labels that put four of them on one colour.

## The transcript is asymmetric

What you typed is short and gets a bubble; what came back is long, structured, and gets none.
A bubble around four hundred words of markdown wastes the width and nests a border around every
list and code block inside it — symmetric bubbles are a messaging pattern and they suit short
turns, not this.

Every reply used to be a MUI `Alert` tinted by severity, so an ordinary answer arrived looking
like a system warning and the whole exchange was a wall of coloured boxes. `Alert` is now kept
for the one thing that is actually a notice: an error.

**What a turn did is said in words, under what it said, not carried by a colour.** Green meant
the records changed and amber that a commit had not pushed — but a tint cannot say which it is,
and a reader has to learn the code before it means anything. The verbs stay as chips beside it.
That the unpushed case is worth naming at all is `PLT-xxcu`: a change that committed and did not
push is neither a failure nor a success.

## It is light

One palette, not the viewer's. The theme followed `prefers-color-scheme` and most phones are on
dark — by default or on a schedule after sunset — so the board arrived as white-on-black cards
nobody chose (`PLT-5j6u`). `index.html` declares `color-scheme: light` too, so the browser does
not paint its own dark canvas in the moment before React mounts.

This is a records screen read in short glances, and the records are black on white everywhere
else they are read. Nothing here is a brand, and a theme switch would be the first thing in this
app that was a preference rather than a record.

## It reads the project, and never quotes it

The chat can open a task's detail — and whatever else is in its folder — by task id, and it can
read the project's own files to answer a question about them. `files` lists what is there,
`file` reads one.

**What it may read is what the repo tracks** (`DEC-063`). `git ls-files` is the boundary:
tracked means committed, and a commit already reaches every teammate and the remote, so reading
it through the app discloses nothing the repo was keeping. Everything gitignored is outside it
by construction — `llmeep/.env`, which holds your model key, first among them — rather than by a
denylist somebody has to keep correct. A path is matched verbatim against that set, so `../`
and absolute paths fail by not matching rather than by being caught. A second check refuses
anything whose name reads like a credential.

**It reads to answer, not to quote.** A phone is not where anyone reads source, and the person
asking may not be a developer: the reply says what the code does and where it lives, never what
it says. On a turn that read a project file, fenced blocks are stripped from the answer and
replaced by a line pointing at the repo — a backstop, because the rule itself is a prompt
instruction.

**It cannot write them.** `WRITABLE` is unchanged: three record trees, through verbs. A file
that has just been written and not committed is not readable either, which is correct and will
surprise somebody.

## It is a wrapper, not a second implementation

One text box takes anything — a thought, a call transcript, a question, a correction — and the
agent handles it the way it would at a terminal, because **its instructions are the shipped
skills**. `.claude/skills/tm/SKILL.md` and `nm/SKILL.md` are read out of your repo and handed
to the model whole; this app adds only two things of its own: that there is no shell, and the
shape of the reply.

Nothing about how to work is written twice. An earlier version of this file paraphrased the
skills into a prompt — thinner than the original and certain to drift the first time a skill
changed, which is the failure `DEC-003` exists to prevent.

It runs until it is done, which includes asking you something and waiting. Reading is free, so
it looks before it acts.

**The reply shape is asked for, not relied on.** A model that plans ahead sends the next step
alongside the current one, so the loop takes the first JSON value in a reply and logs the rest
rather than failing. A reply with no usable object is handed back as a complaint and asked
again — the same move a failed tool already makes — because a model breaking its own output
contract is a thing to correct, not a turn to lose. It was one: `Extra data: line 4 column 1`
reached a person as the whole of a failed turn, and the reply that caused it was logged nowhere
(`PLT-z5dn`). It is logged now, truncated, when parsing fails.

**Filing has a button of its own.** `+ Task` in the header asks for a title and nothing else,
then sends it as a turn and switches to the conversation so you watch it land. It is the
commonest write on the board, and typing a verb into the box to do the commonest thing is
ceremony on a phone.

It hands the title to the agent rather than calling `add`, because `add` is the verb and the
judgement around it is not: which ledger this belongs in — never the tool's to decide
(principle 7) — and whether the records already hold something like it, since `add` searches
History and only an agent reads the answer. A dialog wired straight to the verb would file
duplicates into the wrong ledger, politely. It differs from `New agenda`, which fills the
composer instead of sending: a meeting's title starts a conversation about what the meeting
needs, while a task's title is the whole request.

**It cannot start a task.** Filing, ranking, parking, rewording and closing all say something
true from a phone; starting is a claim to be working on something, and that happens at a
terminal. A task started from here would sit in progress with nobody on it, and there is no
checkout for it to be the current task of — so the next stretch of work at a terminal would be
banked onto it, which is the credit going to something nobody wrote
([`DEC-057`](../decisions/DEC-057-several-tasks-run-at-once.md)).

## It can only ever change `llmeep/`

The agent never runs a command. It names a tool, and the name is checked against a fixed table
that maps to `tm` and `nm` verbs — no shell anywhere in the path, and nothing outside the table
can be reached whatever comes back.

**Committing is where that is enforced rather than assumed.** The app stages the install folder
by name — never `git add -A` — and refuses if anything outside it ended up staged. If you have
your own work staged elsewhere it stops before writing anything and says so, because unstaging
your change to make room for its own is not its call.

So your uncommitted code stays exactly as you left it, and a commit from this app touches
records and nothing else.

**And then it pushes** — a commit that never leaves the phone is a record nobody else has
([`DEC-053`](../decisions/DEC-053-the-app-pushes-what-it-commits.md)). The branch has to track a
remote the container can write to; without one the app says so rather than failing quietly.

What it will not push is a range with your code in it. A push moves the branch, so records
committed behind a code change travel with it, and a push is where a deploy starts
([`DEC-042`](../decisions/DEC-042-a-non-coders-agent-pushes-records-and-asks-about-their-code.md)).
In that case it commits, tells you the change is not live, and leaves the push to you. A push
that fails for any other reason is reported the same way — committed, not live — because a
success that is half true is worse than a warning.
