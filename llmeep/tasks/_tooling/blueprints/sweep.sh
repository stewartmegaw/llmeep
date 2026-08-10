#!/bin/sh
# Blueprint. Nothing in this repo runs it — you schedule it, or you don't.
#
# The sweep is normally a person too: you sit down to work on llmeep, type
# `tm feedback --sweep`, and read what the repos you maintain have been saying.
# That needs no infrastructure and is the case worth optimising for.
#
# This is the other case — a machine that notices for you, because the whole
# point of a draft is that its author has moved on and will not tell you it
# exists. Unlike the standup this fetches nothing: the repos it reads are
# directories on the same machine, and their drafts are gitignored, so a `pull`
# would fetch precisely the files this does not care about.
#
#   1. put a .env beside the checkout — NOTIFY plus that channel's token, and
#      FEEDBACK_REPOS listing the repos to read
#   2. schedule it, at whatever interval suits you
#
# There is no `--cron` flag for this. The standup has one because the schedule
# is derived from STANDUP_PERIOD and matching them by hand is an easy mistake;
# here there is nothing to derive, and a flag that printed a constant would be
# pretending otherwise. Weekly is a reasonable start:
#
#   0 9 * * 1  /path/to/blueprints/sweep.sh
#
# Configure by environment, not by editing this file.

set -eu

REPO="${REPO:-/srv/llmeep}"

# Prints as well as posting, so the log holds what was sent. Exits non-zero if
# no repos are configured, which is the failure worth waking up to: a sweep
# reading nothing looks exactly like a sweep finding nothing.
exec "$REPO/tasks/_tooling/tm" feedback --sweep --send
