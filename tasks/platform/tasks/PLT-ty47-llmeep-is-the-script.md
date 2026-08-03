# `.llmeep` is the script and its own manifest

Today there are two things with confusingly similar roles: `adopt`, an executable at the root of
an llmeep clone, and `.llmeep`, a JSON manifest at the root of an adopted repo. They are named
for what they did on the day they were written rather than for what they are.

Fold them into one. **`.llmeep` is a single executable, carrying its manifest as a header, and
`adopt` copies it into the repo it installs.** An adopted project then holds one file that is
both the tooling entry point and the record of what is installed, and updating is one command
run in your own repo:

```sh
./.llmeep --update              # fetches the newest release and applies it
./.llmeep --update --dry-run
./.llmeep --version
```

That removes the clone step from the update path, which is the part an adopter has to be told
about and the reason the instructions had to be written into `LLMEEP.md` at all (`PLT-qbnn`).

## Shape

The manifest has to be readable without executing the file, and the file has to stay a valid
script. A JSON block inside the module docstring, or a `# llmeep: {...}` line the script parses
out of itself, both work. Whichever is chosen, `.llmeep` rewrites its own header after an
update, so the version and checksums stay true.

## What it has to fetch

`--update` needs the release from somewhere. Options, in preference order:

1. **`git clone --depth 1` into a temp directory**, the branch or tag asked for, then apply and
   delete. No new dependency, works behind a proxy that already passes git.
2. A tarball over HTTPS. Fewer moving parts at runtime, but a second transport to get right.

Either way `--update` becomes a network operation, which nothing in llmeep has been until now —
so it must say what it is about to fetch, and `--dry-run` must not fetch at all.

## Care

- **`adopt` is still the entry point for a repo that has nothing.** It cannot be `.llmeep`
  itself, because `.llmeep` only exists after installing. Keep `adopt` as the installer; it
  gains "copy myself in as `.llmeep`" as a step.
- **The manifest's rules do not change.** Machinery replaced, records never; both `history.tsv`
  excluded by name; a locally edited file reported and kept without `--force`.
- **Nested installs** keep the manifest at the install root today. If the script lands at the
  repo root instead, the two part company — decide which, and make `find_install` agree.
- **A dotfile is easy to miss.** `LLMEEP.md` should point at it, and `adopt` should say it
  exists on the way out.

## Acceptance

- [x] `adopt` installs `.llmeep` into the target repo, executable, with a current header
- [x] `./.llmeep --update` takes a v16 install to the newest release with no clone step
- [x] `--dry-run` performs no network access
- [x] `--version` prints what is installed without touching anything
- [x] The header is rewritten after an update and matches a fresh checksum pass
- [x] Records are byte-identical across an update, both `history.tsv` included
- [x] A flat and a nested install both work, and `find_install` agrees with where the file sits
