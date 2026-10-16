#!/bin/bash
# release.sh — put a version where Okay sees it, or on main.
#
#   tools/release.sh 4.46.6 "first line"   after the version's own commit on dev (VERSION bumped, tests passed):
#                                          its row in docs/versions.md, dev pushed, the build copied to the live page
#   tools/release.sh main                  main catches up with dev (fast-forward only: main is never ahead of dev)
#
# The commits it makes carry the same trailers (Co-Authored-By, Claude-Session) as the version's commit before them.
# The live page is index.html on the gh-pages branch, worked on in a second folder beside the clone (../gh-pages-wt),
# made here the first time. Dates are Istanbul's, as in every doc.
set -e
R=$(git -C "$(dirname "$0")/.." rev-parse --show-toplevel); W="$R/../gh-pages-wt"
cd "$R"
[ "$(git branch --show-current)" = dev ] || { echo "not on dev"; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "dev has changes not committed"; exit 1; }

if [ "$1" = main ]; then
  git fetch -q origin main dev
  git merge-base --is-ancestor origin/main HEAD || { echo "main has commits dev lacks: ask before going on"; exit 1; }
  git push -q origin dev
  git push -q origin HEAD:main
  git branch -f main HEAD 2>/dev/null || true
  echo "main is at dev: $(git rev-parse --short HEAD) ($(grep -o 'beta [0-9.]*' web/src/geometry.js))"
  exit 0
fi

V="$1"; LINE="$2"
[ -n "$V" ] && [ -n "$LINE" ] || { echo 'usage: tools/release.sh VERSION "first line"  |  tools/release.sh main'; exit 1; }
grep -q "\"beta $V\"" web/src/geometry.js || { echo "geometry.js is not at $V"; exit 1; }
H=$(git rev-parse HEAD); S=${H:0:7}; D=$(TZ=Europe/Istanbul date '+%-d %b %Y')
T=$(git log -1 --format='%(trailers:only,unfold)' HEAD)
python3 -I - "$R/docs/versions.md" "$V" "$D" "$H" "$S" "$LINE" <<'PY'
import sys
path, v, d, h, s, line = sys.argv[1:]
row = f"| {v} | {d} | web | [`{s}`](https://github.com/duztman/dial-tool/tree/{h}) | [dial-tool.html](https://github.com/duztman/dial-tool/blob/{h}/web/dial-tool.html) | {line} |"
text = open(path, encoding="utf-8").read()
head = "|---|---|---|---|---|---|\n"
assert head in text and f"| {v} |" not in text, "no table, or the version has a row already"
open(path, "w", encoding="utf-8").write(text.replace(head, head + row + "\n", 1))
PY
git add docs/versions.md
git commit -q -m "Versions row $V" ${T:+-m "$T"}
git push -q origin dev

git fetch -q origin gh-pages
[ -d "$W" ] || git worktree add -q -B gh-pages "$W" origin/gh-pages
cd "$W" && git reset -q --hard origin/gh-pages
cp "$R/web/dial-tool.html" "$W/index.html"
git add index.html
git commit -q -m "Beta $V: $LINE" ${T:+-m "$T"}
git push -q origin gh-pages
echo "released $V: dev $(git -C "$R" rev-parse --short HEAD), gh-pages $(git rev-parse --short HEAD) — live in a minute at https://duztman.github.io/dial-tool/"
