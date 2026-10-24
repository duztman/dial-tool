#!/usr/bin/env bash
# publish.sh — puts the help page live at https://duztman.github.io/dial-tool/help/ (gh-pages, help/).
#   bash guide/help/publish.sh      — on Okay's word only, after make.sh and a look at guide/help/out/
# Copies the page, its pictures and its fonts from the dev branch as pushed; nothing else on gh-pages is touched.
set -euo pipefail
cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
git fetch -q origin gh-pages dev
[ -z "$(git status --porcelain guide/help)" ] || { echo "guide/help has changes not committed: commit and push them first"; exit 1; }
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/dev)" ] || { echo "push dev first: the page goes live from origin/dev"; exit 1; }
W=$(mktemp -d)/ghp
git worktree add -q "$W" origin/gh-pages
rm -rf "$W/help" && mkdir -p "$W/help"
cp guide/help/index.html "$W/help/" && cp -r guide/help/img guide/help/fonts "$W/help/"
cd "$W" && git add -A help
if git diff --cached --quiet; then echo "already live: nothing changed"; else
  git commit -qm "Help page from dev $(git -C "$OLDPWD" rev-parse --short HEAD)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" && git push -q origin HEAD:gh-pages && echo "live in a minute: https://duztman.github.io/dial-tool/help/"
fi
cd - >/dev/null && git worktree remove --force "$W"
