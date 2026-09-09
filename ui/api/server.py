"""llmeep chrome — the back end.

**A door, not a store.** It holds no state: every response is produced by running
`tm` against the mounted repo, and every future write will be a `tm` call that
commits. Stop it and nothing is lost (`DEC-048`, principle 8).

Standard library only, on purpose. This ships to adopters and runs in their
cluster; a dependency tree in the runtime image is a supply chain they did not
ask for and a `pip install` between them and a working container.
"""

import json
import mimetypes
import os
import re
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

REPO = os.environ.get("LLMEEP_REPO", "").rstrip("/")
BASE = "/" + os.environ.get("LLMEEP_BASE_PATH", "").strip("/")
PORT = int(os.environ.get("LLMEEP_PORT", "8080"))
WEB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web", "dist")

# Any non-empty value. The container refuses to serve without it — see
# `refusal()` for why this is a gate rather than a warning.
AUTH_HANDLED = os.environ.get("LLMEEP_AUTH_HANDLED", "").strip()

# Who the commits are from. A person did the deciding, so the default says the
# door rather than claiming to be them.
GIT_NAME = os.environ.get("LLMEEP_GIT_NAME", "llmeep chrome")
GIT_EMAIL = os.environ.get("LLMEEP_GIT_EMAIL", "chrome@llmeep.invalid")

TIMEOUT = 20

# The model configuration, in the shape `tm review` already ships (`DEC-039`):
# an endpoint rather than a vendor, the adopter's own key, and a model that is
# required rather than defaulted — a wrong default bills someone for a call that
# was never going to work. Empty means the text box is simply not offered.
LLM_KEY = os.environ.get("CHROME_KEY", "").strip()
LLM_BASE = os.environ.get("CHROME_BASE", "").strip().rstrip("/")
LLM_MODEL = os.environ.get("CHROME_MODEL", "").strip()
LLM_TIMEOUT = 60

# **The whole write surface.** A model never supplies a command; it supplies an
# action name and data, and this table turns that into argv. Anything not here
# cannot be reached, whatever the model returns or the sender types.
#
# Every verb writes inside the install folder and nowhere else, which is the
# first of two guards — the second is that only that folder is ever staged.
ACTIONS = {
    "add":        lambda a: ["add"] + (["-b"] if a.get("ledger") == "business" else [])
                            + (["-n"] if a.get("prioritise") else []) + [a["title"]],
    "retitle":    lambda a: ["retitle", a["id"], a["title"]],
    "prioritise": lambda a: ["prioritise", a["id"]] + (["-n"] if a.get("top") else []),
    "park":       lambda a: ["park", a["id"]],
    "start":      lambda a: ["go", a["id"]],
    "done":       lambda a: ["done", a["id"]],
    "drop":       lambda a: ["drop", a["id"]],
    "detail":     lambda a: ["detail", a["id"]],
}

ID_RE = re.compile(r"^(PLT|BUS)-[A-Za-z0-9]{1,12}$")

INTENT_PROMPT = """You turn one message from a person into one action on their task board.

Reply with JSON only, no prose around it:

  {"action": "<name>", "id": "<task id>", "title": "<text>",
   "ledger": "platform|business", "prioritise": true, "top": true,
   "answer": "<one or two sentences for the person>"}

Actions: add, retitle, prioritise, park, start, done, drop, detail, none.

- "none" is a real answer. A question, or a discussion that changed nobody's
  mind, leaves no record — say what you think in "answer" and change nothing.
- "add" needs "title" and "ledger". Code, infra, tooling, tests and tech debt
  are platform. Pricing, contracts, hiring and customer work are business, even
  when delivering them needs code. The test is the done-state, not the activity.
- Everything else needs "id", exactly as it appears on the board.
- A title is a handle: at most 120 characters, two sentences. Put the rest in
  "answer" and suggest they add a detail.
- "answer" is always required, and is written for someone who may not be a
  developer. Never make them read an id back to you."""


def tm(*args):
    """Run `tm` in the mounted repo. The executable is found under the install
    folder the manifest names, so a repo adopted with `--into ops` works without
    being told."""
    for folder in (install_folder(), "llmeep", ""):
        path = os.path.join(REPO, folder, "tasks", "_tooling", "tm") if folder \
            else os.path.join(REPO, "tasks", "_tooling", "tm")
        if os.path.isfile(path):
            break
    else:
        raise RuntimeError(f"no llmeep install under {REPO}")
    out = subprocess.run([sys.executable, path, *args], cwd=REPO,
                         capture_output=True, text=True, timeout=TIMEOUT)
    if out.returncode != 0:
        raise RuntimeError(explain(args, out))
    return out.stdout


def explain(args, out):
    """Turn a `tm` failure into something a reader can act on.

    The case worth naming is an install older than this image. Adopters update
    the two on their own schedules, so a `tm` without the command being asked
    for is ordinary rather than exceptional — and left alone it surfaces as a
    wall of usage text, which reads like a bug in the app.

    Asking the install what it can do rather than comparing versions is
    `sweep`'s trick: a version test needs a release to exist before it can be
    written, and goes stale at every rename.
    """
    text = (out.stderr or "") + (out.stdout or "")
    if "unknown command" in text:
        return (f"this repo's llmeep is older than this app — it has no `tm {args[0]}`. "
                "Run `./.llmeep --update` in the repo.")
    return text.strip().split("\n")[0] or "tm failed"


def install_folder():
    """What `adopt` recorded in `.llmeep`. Read by pattern rather than by running
    the script — inspecting an install and trusting it should not be one act."""
    path = os.path.join(REPO, ".llmeep")
    if not os.path.isfile(path):
        return ""
    with open(path) as fh:
        m = re.search(r"#\s*\"into\":\s*\"([^\"]*)\"", fh.read())
    return m.group(1) if m else ""


def refusal():
    """Why the gate exists rather than a line in the README.

    The app has no login and is not going to grow one — access belongs to
    whatever fronts it. That is a reasonable division only if the adopter
    actually does their half, and a warning in documentation is skimmed past.
    The cost of missing this one is somebody's private records on a public URL,
    so it fails closed and says exactly what to do.
    """
    return (
        "llmeep chrome is not serving.\n\n"
        "It has no authentication of its own. Put it behind something that has —\n"
        "an ingress, an identity-aware proxy, a VPN — then set\n\n"
        "    LLMEEP_AUTH_HANDLED=<anything>\n\n"
        "to say you have. Task titles say a great deal about what you are building.\n"
    )


BASE_MARKER = b"<!-- llmeep:base"


def with_base(raw):
    """Tell the page where it is mounted, at serve time.

    Where this runs behind `/llmeep` or at a domain root is the adopter's
    choice and a k8s service's business — a runtime fact. Baking it into the
    bundle would mean an image per mount point, so the build emits relative
    asset URLs and this supplies the one thing relative cannot know: the prefix
    the API lives under, and a `<base>` so a reloaded deep link still resolves.
    """
    i = raw.find(BASE_MARKER)
    if i < 0:
        return raw
    end = raw.find(b"-->", i)
    prefix = (BASE.rstrip("/") + "/").encode()
    tag = (b'<base href="' + prefix + b'">'
           b'<script>window.LLMEEP_BASE=' + json.dumps(BASE.rstrip("/")).encode() + b'</script>')
    return raw[:i] + tag + raw[end + 3:]


def act(text):
    """One message in, one action out.

    The judgement — is this a new task, a change to one, or a question — is the
    model's, and the mechanism is `tm`'s. Nothing in between improvises: the
    model returns an action name and data, `argv_for` validates it against a
    fixed table, and the result is a subprocess call with no shell.

    A commit is only written when something actually changed, so a question
    costs nothing and leaves nothing.
    """
    intent = ask_model(text, tm("board"))
    argv = argv_for(intent)
    if argv is not None:
        # Before anything is written, not after. A refusal that leaves the tree
        # exactly as it found it is one nobody has to clean up.
        theirs = already_staged_elsewhere()
        if theirs:
            raise RuntimeError(
                "you have changes staged outside the records — "
                f"{', '.join(theirs[:3])}. Commit or unstage them first; this app "
                "will not put them in a commit about a task.")
    answer = str(intent.get("answer", "")).strip()
    if argv is None:
        return {"action": "none", "answer": answer or "Nothing to change."}

    output = tm(*argv)
    action = intent["action"]
    subject = intent.get("id") or intent.get("title", "")
    sha = commit(f"{action}: {subject}".strip()[:72],
                 closes=intent.get("id") if action == "done" else None)
    return {"action": action, "answer": answer or output.strip(),
            "output": output.strip(), "commit": sha}


def ask_model(text, board):
    """One call, in the OpenAI chat shape — the same shape `tm review` uses, so
    `CHROME_BASE` reaches OpenAI, Anthropic's compatible endpoint, Groq,
    OpenRouter or something on the adopter's own machine. No vendor is
    privileged here and none should be (principle 3)."""
    import urllib.request
    if not (LLM_KEY and LLM_MODEL and LLM_BASE):
        raise RuntimeError("no model configured — set CHROME_KEY, CHROME_MODEL and CHROME_BASE")
    body = json.dumps({
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": INTENT_PROMPT},
            {"role": "user", "content": f"The board:\n{board}\n\nThe message:\n{text}"},
        ],
    }).encode()
    req = urllib.request.Request(
        f"{LLM_BASE}/chat/completions", data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {LLM_KEY}"})
    with urllib.request.urlopen(req, timeout=LLM_TIMEOUT) as resp:
        answer = json.loads(resp.read())["choices"][0]["message"]["content"]
    return json.loads(strip_fence(answer))


def strip_fence(text):
    """Models wrap JSON in a code fence about half the time. Cheaper to accept
    it than to argue with the prompt."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text
        text = text.rsplit("```", 1)[0]
    return text.strip()


def argv_for(intent):
    """Validate the model's data and build argv from the table. Returns None for
    an action that writes nothing.

    Every field is checked here rather than trusted, because everything in
    `intent` came from a model reading text a person typed — which is to say
    from outside. The id shape is checked before it reaches a shell-free
    subprocess call, and an unknown action is a refusal rather than a
    passthrough."""
    action = str(intent.get("action", "none")).strip()
    if action in ("none", ""):
        return None
    if action not in ACTIONS:
        raise RuntimeError(f"not an action this app can take: {action}")
    if action != "add":
        tid = str(intent.get("id", "")).strip()
        if not ID_RE.match(tid):
            raise RuntimeError(f"{action} needs a task id and got {tid!r}")
        intent["id"] = tid
    else:
        title = str(intent.get("title", "")).strip()
        if not title:
            raise RuntimeError("nothing to file — no title came back")
        intent["title"] = title
        if intent.get("ledger") not in ("platform", "business"):
            intent["ledger"] = "platform"
    if action == "retitle":
        title = str(intent.get("title", "")).strip()
        if not title:
            raise RuntimeError("retitle needs the new words")
        intent["title"] = title
    return ACTIONS[action](intent)


# The only trees this app may write, relative to the install. Not the whole
# install: `decisions/` is written by an agent that reasoned about a change, and
# `.claude/` is the adapter. A text box on a phone has business in neither.
WRITABLE = ("tasks", "notes")


def writable_paths():
    """Repo-relative paths this app may stage, for whichever layout is here.

    **Not a single prefix.** A nested install has one — `llmeep/` — but a flat
    install puts `tasks/` and `notes/` at the repo root beside the adopter's
    code, and there is no prefix that means "ours" there. Treating the absence
    of one as "everything" is how a guard becomes a `git add -A` in disguise, so
    the trees are named instead and both layouts are the same code path.
    """
    folder = install_folder()
    return [f"{folder}/{t}" if folder else t for t in WRITABLE]


def commit(message, closes=None):
    """Stage **only** the install folder, then commit.

    This is where "the app may change `llmeep/` and nothing else" is actually
    enforced. Not by trusting the verbs — though every one of them writes only
    there — and not by cleaning up afterwards, which would mean deleting work
    that was never ours. By never staging anything else: `git add <prefix>`
    rather than `git add -A`, and a check on what was staged before the commit
    is written.

    So an adopter's uncommitted code sitting in the tree is untouched and stays
    untouched, and a verb that somehow wrote outside the folder produces a
    refusal rather than a commit.
    """
    allowed = writable_paths()
    git("add", "--", *allowed)
    staged = staged_paths()
    if not staged:
        return None
    stray = [p for p in staged if not any(p.startswith(a + "/") for a in allowed)]
    if stray:
        # `git add -- <trees>` cannot reach outside them, so this is either a
        # verb that wrote somewhere it should not have or something staged
        # before we arrived. Refuse rather than tidy: unstaging is a guess about
        # whose change it is.
        raise RuntimeError(
            f"refusing to commit outside {', '.join(allowed)}: {', '.join(stray[:3])}")
    body = message if not closes else f"{message}\n\ncloses {closes}"
    git("-c", f"user.name={GIT_NAME}", "-c", f"user.email={GIT_EMAIL}",
        "commit", "-m", body)
    return git("rev-parse", "--short", "HEAD").strip()


def staged_paths():
    return [p for p in git("diff", "--cached", "--name-only").split("\n") if p.strip()]


def already_staged_elsewhere():
    """Whatever the adopter has staged outside the install folder, before this
    app touches anything.

    Checked first and acted on by refusing, because their index is theirs. The
    alternative — stage ours alongside and commit the lot — would sweep an
    unfinished change of theirs into a commit about a task, and the alternative
    to *that* — unstage it — is taking their work apart to make room for ours.
    Neither is this app's call to make.
    """
    allowed = writable_paths()
    return [p for p in staged_paths()
            if not any(p.startswith(a + "/") for a in allowed)]


def git(*args):
    out = subprocess.run(["git", *args], cwd=REPO,
                         capture_output=True, text=True, timeout=TIMEOUT)
    if out.returncode != 0:
        raise RuntimeError((out.stderr or out.stdout).strip().split("\n")[0] or "git failed")
    return out.stdout


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?")[0]
        if BASE != "/" and path.startswith(BASE):
            path = path[len(BASE):] or "/"
        elif BASE != "/" and path not in (BASE.rstrip("/"), BASE):
            return self.send_text(404, "not here — this app is mounted at " + BASE)

        if not AUTH_HANDLED:
            return self.send_text(503, refusal())
        if path == "/api/config":
            return self.send_json(200, {"can_write": bool(LLM_KEY and LLM_MODEL and LLM_BASE)})
        if path == "/api/board":
            return self.send_json_from(lambda: json.loads(tm("board", "--json")))
        if path == "/api/status":
            return self.send_json_from(lambda: {"text": tm("status")})
        return self.send_static(path)

    def do_POST(self):
        path = self.path.split("?")[0]
        if BASE != "/" and path.startswith(BASE):
            path = path[len(BASE):] or "/"
        if not AUTH_HANDLED:
            return self.send_text(503, refusal())
        if path != "/api/intent":
            return self.send_json(404, {"error": "nothing here"})
        try:
            length = int(self.headers.get("Content-Length") or 0)
            text = json.loads(self.rfile.read(length) or b"{}").get("text", "").strip()
        except Exception:                              # noqa: BLE001
            return self.send_json(400, {"error": "send {\"text\": \"...\"}"})
        if not text:
            return self.send_json(400, {"error": "nothing to act on"})
        try:
            self.send_json(200, act(text))
        except Exception as exc:                       # noqa: BLE001 — reported, not raised
            self.send_json(500, {"error": str(exc)})

    def send_json_from(self, produce):
        try:
            body = produce()
        except Exception as exc:                       # noqa: BLE001 — reported, not raised
            return self.send_json(500, {"error": str(exc)})
        self.send_json(200, body)

    def send_json(self, code, body):
        raw = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def send_text(self, code, text):
        raw = text.encode()
        self.send_response(code)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def send_static(self, path):
        """The built front end. Unknown paths fall back to `index.html` so a
        deep link survives a reload — an SPA has one document."""
        rel = path.lstrip("/") or "index.html"
        full = os.path.normpath(os.path.join(WEB, rel))
        if not full.startswith(os.path.normpath(WEB)):
            return self.send_text(403, "no")
        if not os.path.isfile(full):
            full = os.path.join(WEB, "index.html")
        if not os.path.isfile(full):
            return self.send_text(503, "the front end is not built — run `npm run build`")
        ctype = mimetypes.guess_type(full)[0] or "application/octet-stream"
        with open(full, "rb") as fh:
            raw = fh.read()
        if full.endswith("index.html"):
            raw = with_base(raw)
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def log_message(self, fmt, *args):
        sys.stderr.write("  %s\n" % (fmt % args))


def main():
    if not REPO or not os.path.isdir(REPO):
        sys.exit("set LLMEEP_REPO to the mounted repo")
    if not AUTH_HANDLED:
        sys.stderr.write("\n" + refusal() + "\n")
    sys.stderr.write(f"  llmeep chrome on :{PORT} at {BASE} — repo {REPO}\n")
    ThreadingHTTPServer(("", PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
