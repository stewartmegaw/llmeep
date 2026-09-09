# llmeep chrome

A mobile-first view of an llmeep repo, for people who will not open a terminal.

**It holds nothing.** Every screen is a view of a file in the repo and every write goes through
`tm` or `nm` ([principle 8](../llmeep/ontology/principles.md)). Stop the container and nothing
is lost but the door.

    ui/
      api/       the back end — Python standard library, no dependencies
      web/       the front end — React + MUI, built by Vite
      Dockerfile one image serving both

## Running it

The image serves the front end and the API from one port, under a base path, so a k8s service
routing `/llmeep` at it needs no rewriting.

    docker build -t llmeep-chrome ui/
    docker run --rm -p 8080:8080 \
      -v /path/to/your/repo:/repo \
      -e LLMEEP_REPO=/repo \
      -e LLMEEP_BASE_PATH=/llmeep \
      -e LLMEEP_AUTH_HANDLED=yes-my-ingress-handles-it \
      llmeep-chrome

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
| `CHROME_KEY` `CHROME_MODEL` `CHROME_BASE` | for writing | The model that reads what someone typed. Unset means the text box is not offered and the app is read-only. |
| `LLMEEP_GIT_NAME` `LLMEEP_GIT_EMAIL` | no | Who its commits are from. Defaults to *llmeep chrome*, not to you. |

## The model is an endpoint, not a vendor

Same shape `tm review` ships (`DEC-039`): `CHROME_BASE` speaks the OpenAI chat API, which
reaches OpenAI, Anthropic's compatible endpoint, Groq, OpenRouter or something on your own
machine. Your key, your budget, your choice of model — and no vendor is privileged in anything
llmeep installs.

    -e CHROME_BASE=https://api.openai.com/v1 -e CHROME_KEY=sk-... -e CHROME_MODEL=gpt-4.1

## It can only ever change `llmeep/`

One text box takes a new task, a change to one, or a question, and the model decides which.
It does not decide *how*: it returns an action name and data, which are checked against a fixed
table of `tm` verbs. There is no shell anywhere in the path, and nothing outside that table can
be reached whatever comes back.

**Committing is where that is enforced rather than assumed.** The app stages the install folder
by name — never `git add -A` — and refuses if anything outside it ended up staged. If you have
your own work staged elsewhere it stops before writing anything and says so, because unstaging
your change to make room for its own is not its call.

So your uncommitted code stays exactly as you left it, and a commit from this app touches
records and nothing else.
