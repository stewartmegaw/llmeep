#!/bin/sh
# Blueprint. Nothing in this repo runs it — you schedule it, or you don't.
#
# The standup is normally a person: whoever runs the weekly call types
# `tm standup` and reads it out, then `--send` if the team wants it posted.
# That needs no infrastructure and is the case worth optimising for.
#
# This is the other case — an always-on machine reporting while nobody is
# awake. It is a script rather than a bare cron line because **a scheduled
# checkout is stale by definition**. It has to fetch before it can report, and
# where that fetch gets its credentials is a decision only you can make.
#
#   1. clone the repo somewhere the scheduler can reach
#   2. put a .env beside it — NOTIFY plus that channel's token, and
#      STANDUP_PERIOD if it differs from the default
#   3. schedule it. `taskman/_tooling/tm standup --cron` prints the line.
#
# Read-only access is enough; this never pushes. A deploy key or a read-only
# token is the right credential.
#
# Configure by environment, not by editing this file: a local modification
# makes the next `pull --ff-only` fail, which is exactly the checkout you least
# want to be fighting with at 09:00 on a Monday.

set -eu

REPO="${REPO:-/srv/yourproject}"
BRANCH="${BRANCH:-main}"

# --ff-only rather than reset --hard: if this checkout has somehow diverged,
# stop and say so. Discarding someone's work to deliver a status report is a
# bad trade, and cron will capture the failure in the log.
git -C "$REPO" pull --ff-only --quiet origin "$BRANCH"

# Sends through whatever NOTIFY names in the .env beside the repo. Prints the
# report too, which is what ends up in the log.
exec "$REPO/taskman/_tooling/tm" standup --send
