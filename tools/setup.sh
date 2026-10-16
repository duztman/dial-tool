#!/bin/bash
# setup.sh — make a fresh container ready for `cd web && npm test` (what CLAUDE.md lists, in one go). Safe to run twice.
set -e
R=$(git -C "$(dirname "$0")/.." rev-parse --show-toplevel)
F=/usr/share/fonts/truetype/google-fonts
command -v apt-get >/dev/null && { dpkg -s libegl1 >/dev/null 2>&1 || { apt-get update -qq && apt-get install -y -qq libegl1; }; }
pip install -q drawbot-skia skia-pathops pillow pymupdf scipy numpy
mkdir -p "$F"      # two Google Fonts files the window test reads
[ -f "$F/Lora-Variable.ttf" ] || curl -sSfL -o "$F/Lora-Variable.ttf" "https://raw.githubusercontent.com/google/fonts/main/ofl/lora/Lora%5Bwght%5D.ttf"
[ -f "$F/Poppins-Light.ttf" ] || curl -sSfL -o "$F/Poppins-Light.ttf" "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Light.ttf"
cd "$R/web" && npm install --silent
git -C "$R" config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'      # a session's clone is shallow, so single-branch: without this `fetch` never moves origin/dev or origin/gh-pages, and release.sh builds the live page on a stale one (found 17 Oct 2026, 4.46.7: the gh-pages push refused)
git -C "$R" fetch -q origin dev gh-pages
echo "ready: cd web && npm test"
