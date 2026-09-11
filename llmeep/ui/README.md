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

## Reading is wider than writing

Three tabs. **Board** is what is live. **Notes** opens the notes straight away — a list with one
row on it is not a list. **Other** holds **Decisions** and **Ontology**, the second including
your own domain ontology if `tm ontology` recorded where it is.

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
