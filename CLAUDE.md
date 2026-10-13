# Instructions for Claude

Project: **Dial Tool** — a tool for designing watch dials. It is built in the browser (`web/`); the DrawBot version (`dial.py`) is frozen since 12 Oct 2026 — don't edit it. Owner: Okay (graphic designer).

Before working, read `README.md`, then `docs/rules.md`, `docs/brief.md`, `docs/glossary.md`, `docs/build-list.md`.

- Rules in `docs/rules.md` are binding; cite their numbers in reviews.
- Use the words as defined in `docs/glossary.md`. If Okay uses a term differently, ask, then update the glossary.
- After every decision, update `docs/brief.md` §4 and `docs/build-list.md`; flag any inconsistency between docs.
- Docs are written for other agents as readers: plain, specific, dated.
- Okay learns concepts, not syntax: explain *what* and *why*, keep code readable for a designer.
- `dial.py` only (frozen, so normally not needed): its interface can't run off-Mac; vanilla/DrawBot calls were checked against their source (vanilla 0.5.0, DrawBot 3.132; signatures in `tools/vanilla-0.5.0-api.json`), geometry with `tools/test_harness.py`, the interface with `tools/ui_smoke.py`. The web version's tests are in the *Web version* line below (R19).
- `dial.py` only: the preview plan (`docs/preview.md`) ran on 4 Oct 2026 → beta 2.3 on `dev`. Okay, 4 Oct: no Mac check is planned; treat beta 2.3 as working until a screenshot or log says otherwise, then act as §6 "Decisions from the check" says. Don't run the plan again.
- **Web version** (`web/`, beta 4.34, 13 Oct 2026; stylesheet rules: R32): unlike the DrawBot interface it runs here. After any change: `cd web && npm install && npm test` (parity with `dial.py`, the labels, then the window in Chromium; the parity step needs `pip install drawbot-skia skia-pathops pillow pymupdf`), and **look at the screenshots in `web/test/out/`** before handing over (R19). `web/dial-tool.html` is built by `node build.mjs` and is committed. The Gallery's dials are settings written in `web/gallery.mjs` (`node gallery.mjs` writes `src/gallery.js`). It is online at https://duztman.github.io/dial-tool/: after a change Okay should see there, copy the build to `index.html` on the `gh-pages` branch (and `web/fonts/` to `fonts/` if the font list changed) and push. Shared settings keys keep their names (R8); new keys are the web version's alone (R30).
- Commit to `dev`; `main` only for a released version. On each release, update the guidebook (`docs/guide/pages/` + `tools/guide_dials.py` → `tools/make_guide.py`, R25; how: `docs/guide/README.md`).
