#!/bin/bash
# release.sh — put a version where Okay sees it. Two pages on the site (R19, #500):
#
#   tools/release.sh dev "first line"      a small push (third number, 4.91.2): after its commit on dev and the quick
#                                          checks (npm run small). dev pushed, the build copied to the /dev/ page
#                                          (duztman.github.io/dial-tool/dev/). No row in docs/versions.md.
#   tools/release.sh 4.92 "first line"     a step (second number): after its commit on dev and the full npm test.
#                                          Its row in docs/versions.md, dev pushed, main moved to dev, the build
#                                          copied to the released page (duztman.github.io/dial-tool/).
#   tools/release.sh main                  main catches up with dev alone (fast-forward only: main is never ahead of dev)
#
# The /dev/ page is a small loader (web/dev/index.html) that fetches dev/dial-tool.html fresh at every refresh, past
# the site's ten-minute cache; it is copied up with every dev push, so a change to it goes up too.
# The commits it makes carry the same trailers (Co-Authored-By, Claude-Session) as the version's commit before them.
# The site is the gh-pages branch, worked on in a second folder beside the clone (../gh-pages-wt), made here the
# first time. Dates are Istanbul's, as in every doc.
set -e
R=$(git -C "$(dirname "$0")/.." rev-parse --show-toplevel); W="$R/../gh-pages-wt"
cd "$R"
[ "$(git branch --show-current)" = dev ] || { echo "not on dev"; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "dev has changes not committed"; exit 1; }

# main catches up with dev (fast-forward only)
to_main() {
  git fetch -q origin main dev
  git merge-base --is-ancestor origin/main HEAD || { echo "main has commits dev lacks: ask before going on"; exit 1; }
  git push -q origin dev
  git push -q origin HEAD:main
  git branch -f main HEAD 2>/dev/null || true
  echo "main is at dev: $(git rev-parse --short HEAD) ($(sed -n 's/^export const VERSION = "\([^"]*\)".*/\1/p' web/src/geometry.js))"
}

# the site's folder, fresh from GitHub
site() {
  git fetch -q origin gh-pages
  [ -d "$W" ] || git worktree add -q -B gh-pages "$W" origin/gh-pages
  git -C "$W" reset -q --hard origin/gh-pages
}

# the font files, their licences and their README, to the site's fonts/ (FONT_SITE in src/font_list.js): both pages
# fetch a font from there when a ring uses it. Added to, never cleared, so an older build's fonts stay where it looks
fonts() { mkdir -p "$W/fonts" && cp -R "$R/web/fonts/." "$W/fonts/"; }

T=$(git log -1 --format='%(trailers:only,unfold)' HEAD)
VER=$(sed -n 's/^export const VERSION = "v\([0-9.]*\) beta".*/\1/p' web/src/geometry.js)      # the version is named "v1.0 beta" (Okay, 27 Oct 2026)

if [ "$1" = main ]; then to_main; exit 0; fi

if [ "$1" = dev ]; then
  LINE="$2"
  [ -n "$LINE" ] || { echo 'usage: tools/release.sh dev "first line"'; exit 1; }
  git push -q origin dev
  site
  mkdir -p "$W/dev"
  cp "$R/web/dial-tool.html" "$W/dev/dial-tool.html"      # the build
  cp "$R/web/dev/index.html" "$W/dev/index.html"          # the loader that fetches it fresh
  fonts
  cd "$W" && git add dev fonts
  git diff --cached --quiet && { echo "the /dev/ page has this build already"; exit 0; }
  git commit -q -m "Dev v$VER beta: $LINE" ${T:+-m "$T"}
  git push -q origin gh-pages
  echo "dev v$VER beta: dev $(git -C "$R" rev-parse --short HEAD), gh-pages $(git rev-parse --short HEAD) — in a minute at https://duztman.github.io/dial-tool/dev/"
  exit 0
fi

V="$1"; LINE="$2"
[ -n "$V" ] && [ -n "$LINE" ] || { echo 'usage: tools/release.sh dev "first line"  |  tools/release.sh 4.92 "first line"  |  tools/release.sh main'; exit 1; }
[[ "$V" =~ ^[0-9]+\.[0-9]+$ ]] || { echo "$V is a small push: it goes to /dev/ (tools/release.sh dev \"first line\"); the released page moves at a step"; exit 1; }
grep -q "\"v$V beta\"" web/src/geometry.js || { echo "geometry.js is not at v$V beta"; exit 1; }
H=$(git rev-parse HEAD); S=${H:0:7}; D=$(TZ=Europe/Istanbul date '+%-d %b %Y')
python3 -I - "$R/docs/versions.md" "$V" "$D" "$H" "$S" "$LINE" <<'PY'
import sys
path, v, d, h, s, line = sys.argv[1:]
row = f"| v{v} beta | {d} | web | [`{s}`](https://github.com/duztman/dial-tool/tree/{h}) | [dial-tool.html](https://github.com/duztman/dial-tool/blob/{h}/web/dial-tool.html) | {line} |"
text = open(path, encoding="utf-8").read()
head = "|---|---|---|---|---|---|\n"
assert head in text and f"| v{v} beta |" not in text, "no table, or the version has a row already"
open(path, "w", encoding="utf-8").write(text.replace(head, head + row + "\n", 1))
PY
git add docs/versions.md
git commit -q -m "Versions row v$V beta" ${T:+-m "$T"}
to_main                                               # pushes dev too: a step moves main with it

site
cd "$W"
cp "$R/web/dial-tool.html" "$W/index.html"
fonts
git add index.html fonts
git commit -q -m "v$V beta: $LINE" ${T:+-m "$T"}
git push -q origin gh-pages
echo "released v$V beta: dev and main $(git -C "$R" rev-parse --short HEAD), gh-pages $(git rev-parse --short HEAD) — live in a minute at https://duztman.github.io/dial-tool/"
