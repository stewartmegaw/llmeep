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

Writing needs a git identity and a credential that can push the repo — see `git config` and a
deploy key or token mounted into the container. Nothing writes yet; this cut is read-only.
