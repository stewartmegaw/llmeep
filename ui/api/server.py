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

TIMEOUT = 20


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
    import re
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


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?")[0]
        if BASE != "/" and path.startswith(BASE):
            path = path[len(BASE):] or "/"
        elif BASE != "/" and path not in (BASE.rstrip("/"), BASE):
            return self.send_text(404, "not here — this app is mounted at " + BASE)

        if not AUTH_HANDLED:
            return self.send_text(503, refusal())
        if path == "/api/board":
            return self.send_json_from(lambda: json.loads(tm("board", "--json")))
        if path == "/api/status":
            return self.send_json_from(lambda: {"text": tm("status")})
        return self.send_static(path)

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
