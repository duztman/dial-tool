#!/usr/bin/env bash
# make.sh — rebuild the guide from the current app, all of it, in order. Run only when Okay asks for a new guide
# (Okay, 16 Oct 2026, 11:18: "decouple the guide creation from each build, it's hand generated every once in a while
# by triggered me"). An app release does not touch the guide; the live guide names the version it was made on.
#
#   bash guide/make.sh            (from the repo's root; about 6 minutes)
#
# Then look at guide/look/out/review/page-NN.png and phone-NN.png, and publish guide/look/out/ to guide/ on gh-pages
# (index.html, style.css, guide.pdf, fonts/, img/, and indesign/Dial-Tool-guide-indesign.zip).
set -euo pipefail
cd "$(dirname "$0")/../web"
node build.mjs > /dev/null                                    # the app as it is on this branch
node ../guide/checks/checks.mjs                               # every "do X and Y happens" sentence's check
node ../guide/checks/first-dial.mjs                           # the First dial, done like a person: its links
LOOK=../guide/look
if [ -d "$LOOK/img" ]; then rm -rf "$LOOK/img-last"; mv "$LOOK/img" "$LOOK/img-last"; fi
node "$LOOK/shots.mjs"                                        # the pictures, from a cold start
cd ..
node guide/look/build.mjs                                     # the pages, the PDF, the InDesign package
if [ -d guide/look/img-last ]; then                           # what changed in the pictures since the last guide made here
  python3 guide/look/diff.py guide/look/img-last guide/look/img || true
fi
