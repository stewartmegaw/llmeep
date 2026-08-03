# An installed skeleton can update itself to a newer release

`adopt` copies files. It leaves no git relationship with llmeep, so an installed skeleton has
**no idea what version it is** and no way to take a later one without doing by hand what `adopt`
did — which is how three fixes ended up being re-applied manually in a real repo (`PLT-wxr5`).

The tooling has changed eleven times in a day. Anyone who adopted at v6 is running code that
has since gained `check --release`, the platform redefinition, the nested rerooting and the
hook path fix, and has no way to know it.

## The line: machinery is replaceable, records are not

`DEC-026` already drew it. `_tooling/` is machinery and the model it implements; everything in
the open is what a human edits. Update replaces the first and never touches the second.

| Replaced wholesale | Never touched |
| --- | --- |
| `tasks/_tooling/{tm,hooks/,blueprints/,_template.md,ontology.md}` | both `board.md`, task sidecars |
| `notes/_tooling/{nm,ontology.md}` | `notes.md`, `notes/raw/` |
| `ontology/{principles.md,core.md}` | `ontology/domain/` — the adopter's own |
| `decisions/_template.md` | `decisions/DEC-*.md` |
| `.claude/skills/{tm,nm}/SKILL.md` | `.env`, `README.md`, `LLMEEP.md`, the platform |
| `adopt` | |

**`_tooling/history.tsv` is the exception that breaks the rule.** It lives in `_tooling/` and is
a record — the permanent ledger of everything ever completed. A blanket directory replace would
destroy it, in both subsystems. It is the single most important thing this must not get wrong.

## Knowing what version you are on

Nothing records it. An update cannot report what it is changing, refuse to go backwards, or skip
work already done. So this task also introduces a version marker — probably a line in
`tasks/_tooling/` written by `adopt` and by `update`, holding the tag and the date.

Deciding *where* matters: it must survive `tm reset` (it describes the machinery, not the
records) and it must not look like something a human maintains.

## Local modifications

An adopter may have edited what we are about to overwrite — the field report in `PLT-wxr5`
edited both `SKILL.md` files by hand before the rerooting existed. Overwriting silently is the
one behaviour that would make this untrustworthy.

Options, in preference order:

1. **Refuse and report.** Compare each replaceable file against what the *previous* version
   shipped; if it differs, the adopter changed it. List those and stop, with `--force` to
   proceed. Needs the previous version's content, which means the marker above plus a clone.
2. **Back up then replace**, leaving `.orig` files for the adopter to diff.
3. **Replace regardless.** Cheapest, and wrong.

## Nested installs

`update` must find where llmeep lives rather than assume the root — the same problem `adopt
--into` created. Having found it, everything `reroot()` does on install has to happen again on
every file it replaces, or the update silently un-fixes `PLT-wxr5`.

## Acceptance

- [ ] `update` run in a flat install replaces machinery and leaves every record byte-identical
- [ ] Both `history.tsv` files survive, verified by checksum before and after
- [ ] A nested install is found without being told, and replaced files come out rerooted
- [ ] A locally modified file is reported and not overwritten without `--force`
- [ ] The install records its version, and `update` refuses to move backwards
- [ ] `tm check` passes in the updated repo, and the board is unchanged
