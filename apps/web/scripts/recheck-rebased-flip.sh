#!/usr/bin/env bash
# Scheduled publishing, push side: after a rejected push was rebased on a main that moved, check the flip
# again against the new main before pushing it. The flip must be exactly one commit on top of that main;
# it is taken out as a patch, the branch is reset to main, and the guard (check-flip-patch.sh) judges it
# afresh: a commit that landed during the run and, say, moved a due page's `published` into the future
# makes it refuse. Then the flip is committed again with the same message.
#
#   recheck-rebased-flip.sh <main commit just fetched> "<slugs>" <path to check-flip-patch.sh>
#
# Run from copies outside the work tree (the reset rewrites the tree under them). git and coreutils only,
# hooks off. apps/web/scripts/check-flip-patch.test.mjs covers it.
set -euo pipefail

upstream=${1:?usage: recheck-rebased-flip.sh <main> <slugs> <guard>}
slugs=${2:?usage: recheck-rebased-flip.sh <main> <slugs> <guard>}
guard=${3:?usage: recheck-rebased-flip.sh <main> <slugs> <guard>}
g() { git -c core.hooksPath=/dev/null "$@"; }
fail() { echo "recheck-rebased-flip: $1" >&2; exit 1; }

main=$(g rev-parse --verify "$upstream^{commit}") || fail "$upstream is not a commit"
# The rebase dropped the flip because main already has it (the same pages went live meanwhile): exit 3,
# which the workflow reports as "nothing to push" rather than an error.
if [ "$(g rev-parse HEAD)" = "$main" ]; then
  echo "recheck-rebased-flip: main already has the flip; nothing to push" >&2
  exit 3
fi
[ "$(g rev-list --count "$main..HEAD")" = 1 ] || fail "the flip is not exactly one commit on top of main"
[ "$(g rev-parse HEAD~1)" = "$main" ] || fail "the flip's parent is not main"

subject=$(g log -1 --format=%s HEAD)
patch=$(mktemp)
trap 'rm -f "$patch"' EXIT
g format-patch -1 HEAD --stdout > "$patch"
g reset -q --hard "$main"

message=$(bash "$guard" "$patch" "$slugs")
[ "$message" = "$subject" ] || fail "the rechecked flip ($message) is not the flip that was committed ($subject)"
g -c user.name="github-actions[bot]" -c user.email="41898282+github-actions[bot]@users.noreply.github.com" \
  commit -q -m "$message"
echo "$message"
