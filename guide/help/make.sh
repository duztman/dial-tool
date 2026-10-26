#!/usr/bin/env bash
# make.sh — refresh the help page from the current app, then show what to read and what to look at.
#   bash guide/help/make.sh
# 1. check.py: what changed in the app since the page was last checked, and labels the page doesn't name
# 2. icons.cjs, shoot.cjs, webp.py, decorate.py: the app's icons and the page's pictures, taken again from web/dial-tool.html
# 3. look.cjs: every section, wide and on a phone, into guide/help/out/
# Then: revise index.html by hand (the words are written, not generated), run check.py --done, commit, push,
# look at out/, and on Okay's word: bash guide/help/publish.sh
set -euo pipefail
cd "$(dirname "$0")"
python3 check.py
echo; echo "— pictures and icons, from web/dial-tool.html"
(cd ../../web && node ../guide/help/icons.cjs >/dev/null && node ../guide/help/shoot.cjs >/dev/null && node ../guide/help/light.cjs && node ../guide/help/where.cjs)
python3 webp.py && python3 decorate.py && (cd ../../web && node ../guide/help/fit.cjs)      # fit after decorate: decorate puts the icons back as drawn
echo; echo "— the page, as read"
node look.cjs
echo; echo "look at guide/help/out/ ($(ls out | wc -l) pictures)"
