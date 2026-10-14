#!/bin/sh
# versions.sh — every build of Dial Tool, from docs/versions.md.
#   tools/versions.sh tag         a git tag per version (v4.30 …), local; then: git push origin --tags
#   tools/versions.sh open 4.30   that version, whole, in ../dial-tool-versions/v4.30/ (a git worktree)
#   tools/versions.sh list        version and commit, one per line
# Nothing here changes the files you are working on.
set -e
cd "$(git rev-parse --show-toplevel)"
rows() { sed -n 's/^| \([0-9][0-9.]*\) | .*tree\/\([0-9a-f]\{40\}\)).*/\1 \2/p' docs/versions.md; }
case "$1" in
  list) rows ;;
  tag)  rows | while read v sha; do git tag -f "v$v" "$sha" >/dev/null; done
        echo "$(rows | wc -l | tr -d ' ') tags. To put them on GitHub: git push origin --tags" ;;
  open) [ -n "$2" ] || { echo "which version? e.g. tools/versions.sh open 4.30"; exit 1; }
        sha=$(rows | awk -v v="$2" '$1"" == v"" {print $2}')
        [ -n "$sha" ] || { echo "no version $2 in docs/versions.md"; exit 1; }
        dir="../dial-tool-versions/v$2"
        [ -d "$dir" ] || git worktree add --detach "$dir" "$sha" >/dev/null
        echo "$dir  (web: open web/dial-tool.html · DrawBot: open dial.py in DrawBot)" ;;
  *) sed -n '2,5p' "$0" ;;
esac
