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

LLM_TIMEOUT = 60

# Seconds between the newlines that keep a turn's connection from idling out.
# Well under the 60s that an AWS ALB and nginx both default to, and under half
# of it so a single missed beat is not a timeout (`PLT-mrt8`).
HEARTBEAT = 20


def setting(name):
    """A setting, from the container's environment or from the repo's `.env`.

    **The repo's `.env` is the point.** It is where `tm` already looks, it is
    already gitignored, and it is already how `REVIEW_*` is configured — asking
    someone to put the same kind of secret in a second place, in a `docker run`
    line, is inventing a configuration mechanism next to the one that exists.

    Read on each call rather than at import, so adding a line to `.env` takes
    effect on the next page load instead of a container restart.
    """
    live = os.environ.get(name, "").strip()
    if live:
        return live
    try:
        with open(os.path.join(records_root(), ".env")) as fh:
            for line in fh:
                line = line.strip()
                if line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                if key.strip() == name:
                    return value.strip().strip("'\"")
    except OSError:
        pass
    return ""


# The model, in the shape `tm review` already ships (`DEC-039`): an endpoint
# rather than a vendor, the adopter's own key, and a model that is required
# rather than defaulted — a wrong default bills someone for a call that was
# never going to work. Unset means the text box is simply not offered.
def llm_key():
    return setting("CHROME_KEY")


def llm_base():
    return setting("CHROME_BASE").rstrip("/")


def llm_model():
    return setting("CHROME_MODEL")


def can_write():
    return bool(llm_key() and llm_base() and llm_model())

# **The whole surface, and the whole constraint.** This app is a small wrapper
# around the same agent a terminal gives you, and the wrapping is this table: a
# model never supplies a command, it names a tool and supplies data, and nothing
# absent from here can be reached whatever comes back or whatever is typed.
#
# Every entry is a `tm` or `nm` verb, so every write lands in the records and
# nowhere else. That is the first of two guards; the second is that only those
# trees are ever staged.
#
# **`go` is deliberately absent.** Starting a task is a claim to be working on
# it, and the work happens at a terminal — a task started from a phone puts
# something in progress with nobody on it, blocks the next `tm go` under WIP-1,
# and collects the commit count of whatever is actually being written, because
# that count is attributed by the window rather than by name (`DEC-047`).
# Filing, reprioritising, parking and closing all say something true from a
# phone. Starting does not.
#
# `(tool, args) -> (executable, argv, stdin or None)`.
TOOLS = {
    # Reading. Free, and the reason the agent can answer rather than guess.
    "board":      lambda a: ("tm", ["board"], None),
    # The tm skill's first line is "run `tm audience` first and write the way
    # it says". Without this the agent is handed an instruction it cannot
    # follow, and `USER_TYPE` — which `DEC-040` added for exactly this — never
    # reaches the person it describes.
    "audience":   lambda a: ("tm", ["audience"], None),
    "notes":      lambda a: ("nm", ["find", a.get("term", "")], None),
    "find":       lambda a: ("tm", ["find", a["term"]], None),
    "why":        lambda a: ("tm", ["why", a["term"]], None),

    # Tasks.
    "add":        lambda a: ("tm", ["add"] + (["-b"] if a.get("ledger") == "business" else [])
                             + (["-n"] if a.get("prioritise") else []) + [a["title"]], None),
    "retitle":    lambda a: ("tm", ["retitle", a["id"], a["title"]], None),
    "prioritise": lambda a: ("tm", ["prioritise", a["id"]]
                             + (["-n"] if a.get("top") else [])
                             + (["--after", a["after"]] if a.get("after") else []), None),
    "park":       lambda a: ("tm", ["park", a["id"]], None),
    "done":       lambda a: ("tm", ["done", a["id"]], None),
    "drop":       lambda a: ("tm", ["drop", a["id"]], None),
    "detail":     lambda a: ("tm", ["detail", a["id"]], None),

    # Notes. A pasted transcript arrives here — distilled into lines by the
    # agent and piped in, which is what `nm add` reading stdin is for and what
    # the same agent does at a terminal.
    "capture":    lambda a: ("nm", ["add"] + (["--from", a["source"]] if a.get("source") else []),
                             "\n".join(a["lines"])),
    "promote":    lambda a: ("nm", ["promote", a["id"]]
                             + (["-b"] if a.get("ledger") == "business" else [])
                             + (["-n"] if a.get("prioritise") else []), None),
    "unnote":     lambda a: ("nm", ["drop", a["id"]], None),
}

# Tools that change nothing, so a turn using only these commits nothing.
READ_ONLY = {"board", "audience", "notes", "find", "why"}

# A turn is bounded. An agent that cannot finish in this many steps is looping,
# and the person is holding a phone.
MAX_STEPS = 12

ID_RE = re.compile(r"^(PLT|BUS|NTE)-[A-Za-z0-9]{1,12}$")

# **The wrapper, and only the wrapper.**
#
# What to do with a transcript, which ledger a task belongs on, that a title is
# a handle — all of that is already written, in the skills `adopt` installs. It
# is not repeated here. An earlier version of this file did repeat it, badly:
# paraphrased, already thinner than the original, and guaranteed to drift the
# first time a skill changed. That is the failure `DEC-003` exists to prevent —
# behaviour belongs in one place and adapters are thin.
#
# So this app passes through. The skills are the instructions; this text adds
# the two things that are genuinely its own — that there is no shell, and what
# the reply must look like.
WRAPPER = """You are working through a small web app on someone's phone, not a terminal.

Everything below the line is your standing instructions. Follow them as written,
with one difference: **you cannot run commands.** Where they tell you to run
`tm add` or `nm promote`, you name the matching tool instead and this app runs
it for you, in the same repo, with the same effect.

The tools you have, and nothing else exists:

%s

Reply with one JSON object per turn and nothing else:

  {"tool": "<name>", "args": {...}}      to use a tool
  {"say": "<text>", "done": true}        to answer them, or to ask something

Asking is a real answer — say something with "done": true and wait for a reply.
So is changing nothing. Read first when you need an id; reading is free.

**You cannot start a task from here.** Where the instructions below say `tm go`,
say so and stop: starting is a claim to be working on something, and that
happens at a terminal. Filing it, ranking it, parking it or closing it are all
fine.

They may not be a developer, and they are reading this on a phone.

----------------------------------------------------------------------------
%s"""

# Argument shapes. The verbs are the skills'; these say what this app needs in
# order to call them.
TOOL_ARGS = {
    "board": "{}", "audience": "{}",
    "notes": '{"term": "..."}  (empty term lists everything)',
    "find": '{"term": "..."}', "why": '{"term": "..."}',
    "add": '{"title": "...", "ledger": "platform|business", "prioritise": bool}',
    "retitle": '{"id": "...", "title": "..."}',
    "prioritise": '{"id": "...", "top": bool}',
    "park": '{"id": "..."}', "done": '{"id": "..."}',
    "drop": '{"id": "..."}', "detail": '{"id": "..."}',
    "capture": '{"lines": ["...", "..."], "source": "..."}',
    "promote": '{"id": "NTE-...", "ledger": "...", "prioritise": bool}',
    "unnote": '{"id": "NTE-..."}',
}


def skills_text():
    """The shipped skills, read out of the repo this app is pointed at.

    Read rather than embedded, so an adopter who edits their copy — or updates
    to a release that changed one — gets what their repo says and not what this
    image was built with."""
    out = []
    for name in ("tm", "nm"):
        path = os.path.join(REPO, ".claude", "skills", name, "SKILL.md")
        if os.path.isfile(path):
            with open(path) as fh:
                out.append(fh.read())
    if not out:
        raise RuntimeError("no skills found in this repo — is it an llmeep install?")
    return "\n\n".join(out)


def agent_prompt():
    tools = "\n".join(f"  {name:<11}{TOOL_ARGS.get(name, '{}')}" for name in TOOLS)
    return WRAPPER % (tools, skills_text())


def records_folder():
    """Where the records live inside the repo, as a repo-relative folder name.

    `.llmeep` names it for an adopted repo, which is the case that matters.
    `llmeep/` is tried next so llmeep's own checkout — which has no manifest,
    being the source rather than an install — works when pointed at, and last
    the repo root for a flat install. One resolver, because two that disagreed
    is how the catalogue came back empty the first time it was run.
    """
    for folder in (install_folder(), "llmeep", ""):
        probe = os.path.join(REPO, folder, "tasks", "_tooling", "tm")
        if os.path.isfile(probe):
            return folder
    raise RuntimeError(f"no llmeep install under {REPO}")


def records_root():
    folder = records_folder()
    return os.path.join(REPO, folder) if folder else REPO


TOOL_PATHS = {"tm": ("tasks", "_tooling", "tm"), "nm": ("notes", "_tooling", "nm")}


def run_record_tool(tool, argv, stdin=None):
    """Run `tm` or `nm` in the mounted repo, optionally piping text in.

    A list, never a string, and no shell anywhere. Whatever a model returns is
    an argument and can never become a command."""
    path = os.path.join(records_root(), *TOOL_PATHS[tool])
    out = subprocess.run([sys.executable, path, *argv], cwd=REPO, input=stdin,
                         capture_output=True, text=True, timeout=TIMEOUT)
    if out.returncode != 0:
        raise RuntimeError(explain(argv, out))
    return out.stdout


def tm(*args):
    return run_record_tool("tm", list(args))


def nm(*args):
    return run_record_tool("nm", list(args))


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


# Everything readable, and the order it is offered in. Reading is wider than
# writing on purpose: the records are the point of the repo, and someone who
# cannot read a decision has to take the board on faith.
# Groups are what the app navigates by, so they are named for what a reader is
# looking for rather than for where the files sit.
#
# `Task details` is catalogued but never browsed: a detail belongs to a task and
# is reached by tapping that task, not by scrolling a list of documents whose
# titles are all task titles (`PLT-6yjz`).
READABLE = [
    ("Notes", ["notes/notes.md"]),
    ("Decisions", ["decisions/DEC-*.md"]),
    ("Ontology", ["ontology/*.md", "tasks/_tooling/ontology.md",
                  "notes/_tooling/ontology.md"]),
]

# Catalogued so a detail can be opened, absent from every browse list.
UNBROWSED = "Task details"

# What renders in place, and what is offered as a download. Everything is
# served; the only question is whether a browser can show it (`PLT-6yjz`).
INLINE_KINDS = ("text", "table", "image", "pdf")

# A blank form is not a document. `_template.md` and `domain-template.md` are
# there to be copied, and listing them offers a reader "<EntityName>" as though
# it were something to read — which is what the first run of this did.
NOT_A_DOCUMENT = ("_", ".")

FRONT_TITLE = re.compile(r"^title:\s*(.+)$", re.M)
HEADING = re.compile(r"^#\s+(.+)$", re.M)


def catalogue():
    """Every document this app will open, as `{id, group, title}`.

    **The catalogue is the security boundary.** A reader that took a path would
    need to defend against `../` forever; one that takes an id and looks it up
    in a list built here can only ever open what this function chose. The id is
    derived from the path rather than being it, so nothing a caller sends is
    ever joined onto a directory.
    """
    import glob
    import hashlib
    root = records_root()
    ours = llmeep_files()
    out = []
    for group, patterns in READABLE:
        found = []
        for pattern in patterns:
            found.extend(sorted(glob.glob(os.path.join(root, *pattern.split("/")))))
        for full in found:
            name = os.path.basename(full)
            if not os.path.isfile(full) or name.startswith(NOT_A_DOCUMENT) \
                    or "template" in name:
                continue
            # **llmeep's own documents are not this repo's records** (`DEC-052`).
            # `ontology/` and the two `_tooling/ontology.md` files are installed
            # by `adopt`, so in an adopted repo every pattern above resolved to
            # llmeep's model and an adopter's Ontology tab listed five documents
            # about llmeep and none about them (`PLT-e7u9`). Both relative forms
            # are tested because the manifest names adapter files from the repo
            # root and everything else from the install folder.
            if {os.path.relpath(full, root), os.path.relpath(full, REPO)} & ours:
                continue
            out.append(entry(full, root, group))
    out.extend(details(root))
    # The adopter's own domain ontology, wherever they keep it (`DEC-031`). Not
    # a guess: `tm ontology` recorded the path and `.llmeep` carries it.
    #
    # **A folder is as valid as a file, and commoner.** `tm ontology` records any
    # path that exists and the currency check watches a tree, so an adopter
    # pointing at `ontology/` is doing what the tool invited — and this listed
    # nothing at all for them, because it asked `isfile`. Nobody saw it while the
    # group was padded with llmeep's own documents; `DEC-052` removed the padding
    # and the tab went empty (`PLT-avfj`). Reported by the adopter it happened to.
    where = manifest_ontology()
    if where:
        full = os.path.join(REPO, where)
        if os.path.isfile(full):
            out.append(their_ontology(full))
        elif os.path.isdir(full):
            # Every file under it, nested ones included: an ontology of any size
            # is a folder of documents about entities, and half of it is a worse
            # answer than none.
            for found in sorted(glob.glob(os.path.join(full, "**", "*"), recursive=True)):
                name = os.path.basename(found)
                if not os.path.isfile(found) or name.startswith(NOT_A_DOCUMENT) \
                        or "template" in name:
                    continue
                out.append(their_ontology(found))
    return out


def their_ontology(full):
    """One row for a document of the adopter's own, pathed from the repo root so
    a reader can find it without knowing where the install sits."""
    row = entry(full, REPO, "Ontology")
    row["path"] = os.path.relpath(full, REPO)
    return row


def details(root):
    """Task details, and everything a folder detail holds beside its README.

    `DEC-011` lets a detail be a folder when a task needs a spec *and* a rubric
    *and* sample data, and until now the board could say `has detail` while
    offering no way to open it. A file that a browser cannot render is still
    served — named, sized and downloadable — because deciding on someone's
    behalf which of their own attachments they may see is not this app's call.
    """
    import glob
    import hashlib
    out = []
    for path in sorted(glob.glob(os.path.join(root, "tasks", "*", "tasks", "*"))):
        name = os.path.basename(path)
        if name.startswith(NOT_A_DOCUMENT):
            continue
        if os.path.isfile(path) and name.endswith(".md"):
            out.append(entry(path, root, "Task details"))
        elif os.path.isdir(path):
            readme = os.path.join(path, "README.md")
            parent = None
            if os.path.isfile(readme):
                head = entry(readme, root, "Task details")
                parent = head["id"]
                out.append(head)
            for extra in sorted(os.listdir(path)):
                if extra == "README.md" or extra.startswith(NOT_A_DOCUMENT):
                    continue
                full = os.path.join(path, extra)
                if os.path.isfile(full):
                    item = entry(full, root, "Task details")
                    item["title"] = extra
                    item["parent"] = parent
                    out.append(item)
    return out


def entry(full, root, group):
    """One catalogue row. `kind` is what the browser should do with it, decided
    here so the front end never has to guess from a file extension."""
    import hashlib
    ctype = mimetypes.guess_type(full)[0] or "application/octet-stream"
    # What renders in place, and what downloads.
    #
    # A table rather than a download was the right answer for `csv`, and the
    # first pass got it wrong twice — inline as raw text, which is a column of
    # commas on a phone, then a download, which is refusing to show someone
    # their own attachment. Rendered as rows it is neither.
    if full.endswith(".md"):
        kind, ctype = "text", "text/markdown"
    elif full.endswith((".csv", ".tsv")):
        kind = "table"
    elif ctype.startswith("image/"):
        kind = "image"
    elif ctype == "application/pdf":
        kind = "pdf"
    else:
        kind = "file"
    return {"id": hashlib.sha256(full.encode()).hexdigest()[:16],
            "group": group, "title": doc_title(full) if kind == "text" else os.path.basename(full),
            "path": os.path.relpath(full, root), "kind": kind, "type": ctype,
            "bytes": os.path.getsize(full)}


def llmeep_files():
    """Every path `adopt` installed, from the manifest — llmeep's own machinery
    and llmeep's own model, not the adopter's records.

    **Empty in llmeep's own checkout**, which has no manifest because it is the
    source rather than an install. There these documents *are* the project's own
    model and belong in the catalogue, which is the same asymmetry `tm check`
    uses to decide whose decisions a citation may name (`DEC-035`).

    Read by pattern rather than by running the script, like `install_folder`.
    """
    path = os.path.join(REPO, ".llmeep")
    if not os.path.isfile(path):
        return set()
    with open(path) as fh:
        block = re.search(r'#\s*"files":\s*\{(.*?)#\s*\}', fh.read(), re.S)
    if not block:
        return set()
    return set(re.findall(r'#\s*"([^"]+)":\s*"[0-9a-f]+"', block.group(1)))


def manifest_ontology():
    path = os.path.join(REPO, ".llmeep")
    if not os.path.isfile(path):
        return None
    with open(path) as fh:
        m = re.search(r'#\s*"ontology":\s*"([^"]*)"', fh.read())
    return m.group(1) if m and m.group(1) else None


def doc_title(full):
    """A name a person can scan. `DEC-044` is not one — the same reason board
    lines lead with the title and not the id (`PLT-6egb`)."""
    try:
        with open(full) as fh:
            head = fh.read(2000)
    except OSError:
        return os.path.basename(full)
    for pattern in (FRONT_TITLE, HEADING):
        m = pattern.search(head)
        if m:
            return m.group(1).strip().strip('"').replace("`", "")
    return os.path.basename(full)


def locate(doc_id):
    """The catalogued file behind an id, or nothing.

    Rebuilt and looked up on every request, so an id this app never issued
    resolves to nothing at all and there is no path for a caller to bend."""
    entry = next((d for d in catalogue() if d["id"] == doc_id), None)
    if not entry:
        raise RuntimeError("no such document")
    full = os.path.join(records_root(), entry["path"])
    if not os.path.isfile(full):
        full = os.path.join(REPO, entry["path"])
    if not os.path.isfile(full):
        raise RuntimeError("that file has gone")
    return entry, full


def read_doc(doc_id):
    """Open one catalogued document. The catalogue is rebuilt and the id looked
    up in it, so an id that is not on the list opens nothing."""
    entry, full = locate(doc_id)
    with open(full, errors="replace") as fh:
        text = without_frontmatter(fh.read())
    if entry["group"] == "Notes":
        text = notes_as_paragraphs(text)
    return {**entry, "text": text}


def notes_as_paragraphs(text):
    """One note, one paragraph.

    The archive stores a date heading and then a line per note, which is the
    right shape for a file read whole by a parser — and markdown folds
    consecutive lines into a single paragraph, so on screen every note under a
    date ran into the next one (`PLT-5ab6`).

    **Rendered here rather than fixed in the file.** Presentation is a separate
    concern from storage (principle 1), and a blank line between records would be
    a change to what every agent reads whole so that one screen looks right.
    """
    out = []
    for line in text.split("\n"):
        if out and out[-1].strip() and line.startswith("NTE-"):
            out.append("")
        out.append(line)
    return "\n".join(out)


FRONTMATTER = re.compile(r"\A---\n.*?\n---\n", re.S)


def without_frontmatter(text):
    """Drop the YAML header before rendering.

    It is metadata for a machine — ids, status, the supersession graph — and a
    renderer with no opinion about it flattens the block into one bold
    paragraph at the top of the page. The title is already lifted out of it, so
    nothing a reader wanted is lost."""
    return FRONTMATTER.sub("", text, count=1)


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


# One conversation per browser, held in memory and lost with the container.
#
# **That is the same deal a terminal offers**, and principle 8 permits exactly
# it: what dies here is the conversation, never a record. Everything decided
# was written by a verb the moment it was decided, so a dropped session costs
# what `/clear` costs — the talk, not the work.
SESSIONS = {}
SESSION_TURNS = 40


def history_for(session):
    log = SESSIONS.setdefault(session, [])
    # Old turns fall off the front. A phone conversation that has run for an
    # hour is not carrying anything the records do not.
    del log[:-SESSION_TURNS]
    return log


def act(text, session="default"):
    """One message in, and however many steps it takes.

    This is a wrapper around the agent a terminal already gives you, and the
    wrapping is `TOOLS`: it can read the records freely and change them only
    through verbs, so the worst a confused turn can do is file something wrong
    — which is recoverable, and visible in a commit.

    It runs until the model says it is done, which includes asking a question
    and waiting. `MAX_STEPS` bounds a loop rather than a task.
    """
    log = history_for(session)
    log.append({"role": "user", "content": text})
    used, changed = [], False

    for _ in range(MAX_STEPS):
        step = ask_model(log)
        if step.get("say") or step.get("done"):
            answer = str(step.get("say", "")).strip() or "Done."
            log.append({"role": "assistant", "content": json.dumps(step)})
            sha = commit_used(used) if changed else None
            pushed, note = push_after_commit() if sha else (False, None)
            return {"answer": answer, "used": used, "commit": sha, "changed": changed,
                    "pushed": pushed, "note": note}

        name = str(step.get("tool", "")).strip()
        args = step.get("args") or {}
        log.append({"role": "assistant", "content": json.dumps(step)})
        if name not in READ_ONLY and not changed:
            # Checked once, before the first thing that writes — so a turn that
            # only reads is never blocked, and one that would write stops with
            # the tree exactly as it found it.
            theirs = already_staged_elsewhere()
            if theirs:
                raise RuntimeError(
                    "you have changes staged outside the records — "
                    f"{', '.join(theirs[:3])}. Commit or unstage them first; this app "
                    "will not put them in a commit about your records.")
        try:
            result = run_tool(name, args)
        except Exception as exc:                       # noqa: BLE001
            # Handed back rather than raised. A model that asked for something
            # impossible should get told and try again, the same as a person
            # mistyping a command.
            log.append({"role": "user", "content": f"That failed: {exc}"})
            continue
        used.append(name)
        changed = changed or name not in READ_ONLY
        log.append({"role": "user", "content": f"{name} said:\n{result[:4000]}"})

    return {"answer": "I got stuck going round in circles — try asking for one "
                      "thing at a time.", "used": used,
            "commit": commit_used(used) if changed else None, "changed": changed}


def run_tool(name, args):
    """Validate, then run. Nothing here trusts what came back from the model:
    the tool must be in the table, and any id must look like an id before it
    reaches a subprocess that never sees a shell."""
    if name not in TOOLS:
        raise RuntimeError(f"not a tool this app has: {name}")
    for key in ("id", "after"):
        if key in args and args[key] is not None:
            tid = str(args[key]).strip()
            if not ID_RE.match(tid):
                raise RuntimeError(f"{name} needs a record id and got {tid!r}")
            args[key] = tid
    for key in ("title", "term", "source"):
        if key in args:
            args[key] = str(args[key]).strip()
    if name == "capture":
        lines = [str(l).strip() for l in (args.get("lines") or []) if str(l).strip()]
        if not lines:
            raise RuntimeError("capture needs lines")
        args["lines"] = lines
    tool, argv, stdin = TOOLS[name](args)
    return run_record_tool(tool, argv, stdin)


def commit_used(used):
    doing = ", ".join(dict.fromkeys(n for n in used if n not in READ_ONLY))
    return commit(f"{doing or 'records'}, from the app"[:72])


# ------------------------------------------------------------------ refresh
#
# **Somebody else pushed, and this container did not know.** The app pushes what
# it commits (`DEC-053`), so it is a writer on a branch other people write to;
# a checkout that never fetches drifts until its next commit is a merge nobody
# asked for. This is the inbound half: one endpoint anything can fire, a fetch,
# and the records settled by the model rather than by git's opinion of them.
#
# **Generic on purpose.** A GitHub push hook is what this is for, and a route
# called `/api/github` would put a vendor in the committed core — the objection
# `DEC-016` raised against shipping a workflow file. So it is `/api/refresh`,
# meaning *something upstream moved*, and it authenticates with the signature
# scheme GitHub happens to send, which any sender can produce with an HMAC.
HOOK_SIGNATURE = "X-Hub-Signature-256"


def hook_secret():
    return setting("HOOK_SECRET")


def hook_authentic(body, sent):
    """**The app has no login and this route is the one thing GitHub must be able
    to reach**, so the signature is the whole gate and it fails closed.

    Compared in constant time, over the raw bytes: re-serialising the JSON first
    would sign a different document than the one that arrived."""
    import hashlib
    import hmac
    secret = hook_secret()
    if not secret:
        return False
    want = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(want, (sent or "").strip())


def default_branch_ref(payload):
    """What a push to the default branch looks like in the payload, or `None`
    when the sender did not say. GitHub sends both halves; anything else that
    sends neither is taken at its word and acted on."""
    branch = ((payload.get("repository") or {}).get("default_branch") or "").strip()
    return f"refs/heads/{branch}" if branch else None


def refresh(payload):
    """Fetch, then make this checkout's records right.

    **Fast-forward is the common case and the whole of it.** Nobody committed
    here since the last push, so there is nothing to merge and nothing to
    resolve.

    **Diverged is the case worth building for.** The app committed something
    from a phone while somebody else pushed, so the branch has two tips and
    `board.md` is the file both of them touched. `git merge` is allowed to do the
    textual part, and then `tm resolve` settles the records by the model —
    including when git reported no conflict at all, because a clean merge of a
    board is not a correct one (`DEC-054`). The resolution is committed and
    pushed, so what everybody else pulls is the settled version rather than this
    container's private opinion of it.

    **Anything conflicting outside the records aborts the whole thing.** The app
    writes `tasks/` and `notes/`, so a conflict anywhere else is not its to
    settle and the tree goes back exactly as it was.
    """
    ref = default_branch_ref(payload)
    pushed = (payload.get("ref") or "").strip()
    if ref and pushed and pushed != ref:
        return {"action": "ignored", "note": f"{pushed} is not the default branch"}
    if already_staged_elsewhere():
        return {"action": "refused",
                "note": "changes are staged outside the records here; not touching the tree"}

    git("fetch", "--quiet")
    upstream = git("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}").strip()
    if not upstream:
        return {"action": "refused", "note": "this branch tracks no remote"}
    behind = [c for c in git("rev-list", f"HEAD..{upstream}").split() if c]
    ahead = [c for c in git("rev-list", f"{upstream}..HEAD").split() if c]
    if not behind:
        return {"action": "current", "note": None}

    records = [p for p in git("diff", "--name-only", f"HEAD..{upstream}").split("\n")
               if p.strip() and p.startswith(tuple(t + "/" for t in read_trees()))]
    if not ahead:
        git("merge", "--ff-only", upstream)
        return {"action": "fast-forward", "commits": len(behind),
                "records": bool(records), "note": None}

    return merge_and_settle(upstream, behind, ahead, records)


def merge_and_settle(upstream, behind, ahead, records):
    merged = subprocess.run(
        ["git", "-c", f"user.name={GIT_NAME}", "-c", f"user.email={GIT_EMAIL}",
         "merge", "--no-commit", "--no-ff", upstream],
        cwd=REPO, capture_output=True, text=True, timeout=TIMEOUT)
    stuck = [p for p in git("diff", "--name-only", "--diff-filter=U").split("\n")
             if p.strip()]
    outside = [p for p in stuck if not p.startswith(tuple(writable_paths()))]
    if outside:
        git("merge", "--abort")
        return {"action": "aborted", "note":
                f"conflicts outside the records — {', '.join(outside[:3])}. The tree is "
                f"as it was; that merge is yours to do."}

    settled = tm("resolve")
    # **Staging comes after `resolve`, and it is this side's job.** `resolve`
    # writes the records and never the index, so that finishing a merge stays a
    # deliberate act (`DEC-005`, `DEC-054`) — which means the paths it settled are
    # still unmerged until something stages them. Checking before staging read
    # "could not settle it" about a file it had just settled correctly.
    git("add", "--", *writable_paths())
    still = [p for p in git("diff", "--name-only", "--diff-filter=U").split("\n")
             if p.strip()]
    if still:
        git("merge", "--abort")
        return {"action": "aborted",
                "note": f"could not settle {', '.join(still[:3])} — the tree is as it was"}
    git("-c", f"user.name={GIT_NAME}", "-c", f"user.email={GIT_EMAIL}",
        "commit", "--no-edit", "-m",
        f"merge {len(behind)} commit(s) from upstream, records settled by tm resolve")
    pushed, note = push_after_commit()
    return {"action": "merged", "commits": len(behind), "local": len(ahead),
            "records": bool(records), "pushed": pushed,
            "note": note, "settled": [l.strip() for l in settled.split("\n")
                                      if l.strip().startswith("·")]}


def read_trees():
    folder = records_folder()
    return [f"{folder}/{t}" if folder else t for t in READ_TREES]


def records_changed():
    """When the records last changed, as an ISO timestamp, or `None`.

    The commit date of the last commit touching a record tree — not the working
    tree's mtimes, which a fresh clone sets to checkout time and every container
    restart would reset. The question a reader has is *how current is this*, and
    the answer has to be the same for everyone looking at the same repo
    (`PLT-f4n6`).

    A commit rather than a push: a records commit is pushed the moment it is made
    now (`DEC-053`), and a repo with no remote has no push to date from.

    **Every record tree, not only the writable ones.** The app shows decisions and
    an ontology it cannot change, and a header saying nothing happened while a
    decision landed this morning would be wrong about the thing it is answering.
    """
    folder = records_folder()
    trees = [f"{folder}/{t}" if folder else t for t in READ_TREES]
    if not trees:
        return None
    try:
        out = git("log", "-1", "--format=%cI", "--", *trees).strip()
    except Exception:                                  # noqa: BLE001
        return None
    return out or None


def act_directly(name, args):
    """One named verb, run, committed and pushed — the same ending a turn has.

    Reads are answered and nothing is committed for them, so tapping something
    that only looks is free.
    """
    if name not in TOOLS:
        raise RuntimeError(f"not a tool this app has: {name}")
    if name not in READ_ONLY:
        theirs = already_staged_elsewhere()
        if theirs:
            raise RuntimeError(
                "you have changes staged outside the records — "
                f"{', '.join(theirs[:3])}. Commit or unstage them first; this app "
                "will not put them in a commit about your records.")
    said = run_tool(name, dict(args))
    if name in READ_ONLY:
        return {"said": said, "changed": False, "commit": None, "pushed": False, "note": None}
    sha = commit_used([name])
    pushed, note = push_after_commit() if sha else (False, None)
    return {"said": said, "changed": bool(sha), "commit": sha,
            "pushed": pushed, "note": note}


def push_after_commit():
    """Push what was just committed, and say what happened.

    **A commit that never leaves the phone is not a record anyone else has**
    (`PLT-xxcu`). Every other agent here drives its own git; this app is the
    agent for someone who has no terminal, so committing without pushing left
    their work visible to nobody — including the next person to pull.

    **What may go out is `DEC-042`'s classification, not "always".** `records`
    pushes without asking, which is what that decision already licenses: boards,
    notes and history reach no build. `code` does not, because a push is where a
    deploy starts and the range goes out as a whole — records committed behind a
    code change travel with it. The classification comes from `tm unpushed
    --json` rather than being recomputed here, so there is one implementation of
    the rule about which commits may leave.

    Returns `(pushed, note)`. **A failed push is reported, never swallowed**: the
    person is told their change is committed and not live, which is a state they
    can act on, rather than being shown a success that is half true.
    """
    try:
        state = json.loads(tm("unpushed", "--json")).get("state")
    except Exception as exc:                           # noqa: BLE001
        return False, f"committed, but the push state could not be read: {exc}"
    if state == "no upstream":
        return False, "committed. This branch tracks no remote, so there is nowhere to push."
    if state == "code":
        # The app cannot resolve this one: its tools write records and nothing
        # else, so it has no verb for pushing someone's project. `DEC-042` has
        # the agent ask; here the honest move is to say why it stopped.
        return False, ("committed. Not pushed: there are code changes waiting to go out too, "
                       "and a push is where a deploy starts — that one is yours to make.")
    if state == "clear":
        return True, None
    try:
        git("push")
    except Exception as exc:                           # noqa: BLE001
        return False, f"committed, but the push failed: {exc}"
    return True, None



def ask_model(log):
    """One call, in the OpenAI chat shape — the same shape `tm review` uses, so
    `CHROME_BASE` reaches OpenAI, Anthropic's compatible endpoint, Groq,
    OpenRouter or something on the adopter's own machine. No vendor is
    privileged here and none should be (principle 3)."""
    import urllib.request
    if not can_write():
        raise RuntimeError("no model configured — put CHROME_KEY, CHROME_MODEL and "
                           "CHROME_BASE in the repo's .env, beside REVIEW_*")
    body = json.dumps({
        "model": llm_model(),
        "messages": [{"role": "system", "content": agent_prompt()}, *log],
    }).encode()
    req = urllib.request.Request(
        f"{llm_base()}/chat/completions", data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {llm_key()}"})
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


# The only trees this app may write, relative to the install. Not the whole
# install: `decisions/` is written by an agent that reasoned about a change, and
# `.claude/` is the adapter. A text box on a phone has business in neither.
WRITABLE = ("tasks", "notes")

# Every tree that holds a record, which is what "last updated" is about — the
# same four `tm` calls records. Wider than WRITABLE on purpose: this app reads
# decisions and an ontology it may not write.
READ_TREES = ("tasks", "notes", "decisions", "ontology")


def writable_paths():
    """Repo-relative paths this app may stage, for whichever layout is here.

    **Not a single prefix.** A nested install has one — `llmeep/` — but a flat
    install puts `tasks/` and `notes/` at the repo root beside the adopter's
    code, and there is no prefix that means "ours" there. Treating the absence
    of one as "everything" is how a guard becomes a `git add -A` in disguise, so
    the trees are named instead and both layouts are the same code path.
    """
    folder = records_folder()
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
            return self.send_json(200, {"can_write": can_write()})
        if path == "/api/docs":
            return self.send_json_from(
                lambda: {"docs": catalogue(), "unbrowsed": UNBROWSED})
        if path == "/api/doc":
            return self.send_json_from(lambda: read_doc(self.query("id")))
        if path == "/api/file":
            return self.send_file(self.query("id"))
        if path == "/api/board":
            # `updated` rides with the board rather than having an endpoint of its
            # own: it changes when the records change, so it should arrive when
            # they do and go stale at exactly the same moment.
            return self.send_json_from(
                lambda: {**json.loads(tm("board", "--json")), "updated": records_changed()})
        if path == "/api/notes":
            # The window as data, so the screen can put a verb on each note
            # rather than rendering the archive as a document nobody can act on
            # (`PLT-pudy`).
            return self.send_json_from(lambda: json.loads(nm("notes", "--json")))
        if path == "/api/status":
            return self.send_json_from(lambda: {"text": tm("status")})
        return self.send_static(path)

    def do_POST(self):
        path = self.path.split("?")[0]
        if BASE != "/" and path.startswith(BASE):
            path = path[len(BASE):] or "/"
        if path == "/api/refresh":
            # **Ahead of the auth gate, and gated by a signature instead.** The
            # gate exists because whatever fronts this app is what authenticates
            # a person; a push hook is not a person and cannot get through it.
            # What it can do is prove it holds the shared secret, over the exact
            # bytes it sent.
            body = self.rfile.read(int(self.headers.get("Content-Length") or 0))
            if not hook_secret():
                return self.send_json(503, {"error":
                    "no HOOK_SECRET is set, so this endpoint cannot tell who is "
                    "calling it. Put HOOK_SECRET=<a long random string> in the repo's "
                    ".env and use the same value as the webhook's secret."})
            if not hook_authentic(body, self.headers.get(HOOK_SIGNATURE)):
                return self.send_json(401, {"error": "signature does not match"})
            try:
                payload = json.loads(body or b"{}")
            except Exception:                          # noqa: BLE001
                payload = {}
            return self.send_json_from(lambda: refresh(payload))
        if not AUTH_HANDLED:
            return self.send_text(503, refusal())
        if path == "/api/do":
            # **A verb somebody named, rather than one a model chose.** The text
            # box is for when you do not know which verb it is; a button is for
            # when you do, and putting a model between a tap and `tm done` buys
            # nothing but a call, a wait and a chance of it guessing wrong
            # (`PLT-7kk3`).
            #
            # The same table is still the boundary — `run_tool` validates the
            # name and the id — so this adds no surface, only a second way to
            # reach the surface that was already there. It needs no model, which
            # is why an install with no key stops being read-only.
            try:
                length = int(self.headers.get("Content-Length") or 0)
                sent = json.loads(self.rfile.read(length) or b"{}")
                name = str(sent.get("tool", "")).strip()
                args = sent.get("args") or {}
            except Exception:                          # noqa: BLE001
                return self.send_json(400, {"error": 'send {"tool": "...", "args": {…}}'})
            return self.send_json_from(lambda: act_directly(name, args))
        if path != "/api/intent":
            return self.send_json(404, {"error": "nothing here"})
        try:
            length = int(self.headers.get("Content-Length") or 0)
            sent = json.loads(self.rfile.read(length) or b"{}")
            text = str(sent.get("text", "")).strip()
            session = str(sent.get("session", "default"))[:64] or "default"
        except Exception:                              # noqa: BLE001
            return self.send_json(400, {"error": "send {\"text\": \"...\"}"})
        if not text:
            return self.send_json(400, {"error": "nothing to act on"})
        self.send_turn(text, session)

    def query(self, key):
        if "?" not in self.path:
            return ""
        from urllib.parse import parse_qs
        return parse_qs(self.path.split("?", 1)[1]).get(key, [""])[0]

    def send_file(self, doc_id):
        """Bytes, with the type the catalogue worked out.

        Inline for anything a browser renders and an attachment for the rest —
        everything is served either way. `Content-Disposition` is the only
        difference, so a spreadsheet attached to a task downloads instead of
        filling the screen with mojibake."""
        try:
            entry, full = locate(doc_id)
        except Exception as exc:                       # noqa: BLE001
            return self.send_json(404, {"error": str(exc)})
        with open(full, "rb") as fh:
            raw = fh.read()
        inline = entry["kind"] in INLINE_KINDS
        name = os.path.basename(entry["path"]).replace('"', "")
        self.send_response(200)
        self.send_header("Content-Type", entry["type"])
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Content-Disposition",
                         f'{"inline" if inline else "attachment"}; filename="{name}"')
        self.end_headers()
        self.wfile.write(raw)

    def send_json_from(self, produce):
        try:
            body = produce()
        except Exception as exc:                       # noqa: BLE001 — reported, not raised
            return self.send_json(500, {"error": str(exc)})
        self.send_json(200, body)

    def send_turn(self, text, session):
        """**A turn keeps its connection alive while it thinks.**

        One HTTP request was held open for the whole turn with nothing written
        until the answer, which hands every proxy in front of this app the right
        to decide how long a turn may take. An AWS ALB idles out at 60s by
        default and nginx's `proxy_read_timeout` is the same number, so a
        two-minute turn is not an unusual deployment failing — it is the ordinary
        one. Reported by an adopter whose load balancer returned its own HTML
        error page to the browser while the container went on working, committed
        and pushed eight seconds later (`PLT-mrt8`).

        The headers and a newline go out immediately and another newline follows
        every `HEARTBEAT` seconds, so no idle timer ever fires on a turn that is
        still thinking. `JSON.parse` ignores leading whitespace, so the document
        that eventually arrives parses exactly as it did before and no client has
        to learn a new shape.

        **The status is 200 before the work starts**, so a failure is reported in
        the body rather than by a code — which is what the app already reads: it
        renders `error` in the body as a failed turn. The alternative is holding
        the headers back until the outcome is known, which is the thing this
        exists to stop doing.
        """
        import threading
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        # nginx buffers a proxied response by default, which would hold the
        # heartbeat and defeat the whole thing.
        self.send_header("X-Accel-Buffering", "no")
        self.end_headers()

        done = {}

        def work():
            try:
                done["body"] = act(text, session)
            except Exception as exc:                   # noqa: BLE001 — reported, not raised
                done["body"] = {"error": str(exc)}

        turn = threading.Thread(target=work, daemon=True)
        turn.start()
        while True:
            turn.join(HEARTBEAT)
            if not turn.is_alive():
                break
            try:
                self.wfile.write(b"\n")
                self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                # Nobody is listening any more. The turn keeps going on its own
                # thread, because it may be halfway through writing records —
                # what is lost is the answer, never the work.
                return
        try:
            self.wfile.write(json.dumps(done.get("body", {"error": "no answer"})).encode())
            self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass

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


def trust_repo():
    """Tell git this mounted repo is not a stranger.

    A bind mount carries the host's ownership, and git refuses to operate on a
    repository owned by someone other than the user running it — *dubious
    ownership*, which is a sensible default and exactly wrong here: the mount is
    the whole point. It does not bite on Docker Desktop, which maps everything
    to root, so the failure waits for the Linux cluster this is meant to run in.

    Global rather than per-call, because `tm` shells out to git on its own
    account and would hit the same wall — quietly, since it treats a failed git
    call as no answer. The config lives in the container and dies with it.
    """
    subprocess.run(["git", "config", "--global", "--add", "safe.directory", REPO],
                   capture_output=True, text=True, timeout=TIMEOUT)


def main():
    if not REPO or not os.path.isdir(REPO):
        sys.exit("set LLMEEP_REPO to the mounted repo")
    trust_repo()
    if not AUTH_HANDLED:
        sys.stderr.write("\n" + refusal() + "\n")
    sys.stderr.write(f"  llmeep chrome on :{PORT} at {BASE} — repo {REPO}\n")
    ThreadingHTTPServer(("", PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
