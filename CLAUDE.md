# Instructions for Claude

**Dial Tool** — a tool for designing watch dials, in the browser (`web/`). Owner: Okay, a graphic designer in Istanbul; he learns concepts, not syntax — explain *what* and *why*, keep code readable for a designer. The DrawBot version `archive/drawbot/dial.py` is frozen (R30); nothing in `archive/` is live.

## Read, in this order

1. This page.
2. `docs/handoff.md` §1 — where things stand, what is open, what Okay must verify.
3. `docs/build-list.md` — the open items, one line each (the full row: `docs/build-list-notes.md`).
4. `docs/working-with-okay.md` before the first round with him.
5. Then only what the task touches: the rule's page from `docs/rules.md` (the index; one file per rule in `docs/rules/`), the term's line in `docs/glossary-watch.md` or `docs/glossary-tool.md`, the canon `docs/design.md` for anything shown — **for a change to the look, start at `docs/sectors.md`** (where a thing on screen lives, which token moves it, what proves it; `docs/css-map.md` is its generated token table), `docs/brief.md` for goals and open questions, `README.md` for where every file is.

## Binding

- Rules (`docs/rules/`) are binding; cite the number. A new rule takes the next number; a rule that outgrows its page takes a letter (R15a, R32a).
- Use the glossary's words. If Okay uses a term differently, ask, then change its line.
- After every decision: a row in `docs/decisions.md` (date, his words), the build list (and its notes), the brief when goals, outputs or open questions change; flag any inconsistency between docs.
- **Docs state the present** (Okay, 19 Oct 2026: "eliminate history from current docs"): what a thing is now and why, with his words as the reason, dated where the date is the reason. How it got there is `docs/changelog.md` and the repo's history — never "until 4.x it was…" in a doc, a comment or a rule. Docs are written for other agents: plain, specific.
- Nothing unprompted (R18); third attempt at the same fix → stop and ask (R20); measure, don't estimate (R21).

## The loop of a push

1. **Set up** once per container: `bash tools/setup.sh` (libraries, fonts, `npm install`, the shallow clone's fetch widened — without it `tools/release.sh` fails or builds the live page on a stale `gh-pages`).
2. **Change** `web/src/`: `geometry.js` (settings, geometry, drawing, `VERSION`, `LINK_KEYS`), `output.js` (SVG, PDF), the window in `app.js` and its parts — one file each (`rows.js`, `panel.js`, `rings.js`, `hands.js`, `windows.js`, `colour.js`, `fonts.js`, `preview.js`, `guides.js`, `bar.js`, `cards.js`, `export.js`, `mode.js`, `icons.js`, `ui.js`, `session.js`), `css/` one cascade layer per file (R32; find the region and its token in `docs/sectors.md` first). After a token changes: `node css-map.mjs` (the test fails on a stale `docs/css-map.md`). Look while working: `node build.mjs`, then `node test/shot.mjs out.png` or `node test/look.mjs`; measure the DOM, not the eye. Guard a change with a check in `web/test/window.mjs` whose message quotes Okay's words.
3. **Test** (R19): a small push `cd web && npm run small` (~2.5 min); a step `npm test` whole (~3 min: parity with `dial.py`, labels, links, complications, Wear OS, the window in Chromium, the icons). **Look at the screenshots in `web/test/out/`** before handing over. A change that must not change the look: `node test/same.mjs save` before, `node test/same.mjs` after (R32c).
4. **Docs**: `docs/changelog.md` a section on top; `docs/decisions.md` a row; a done item's row to `docs/build-list-done.md`; the rule or glossary line if one changed.
5. **Bump** `VERSION` in `web/src/geometry.js`, README line 8, the version line below; `node build.mjs` (`web/dial-tool.html` is committed); one commit on `dev`, "v1.0.1 beta: first line", with the attribution trailers the session gives. A small push counts in the third number (v1.0 beta → v1.0.1 beta), a step in the second (v1.1 beta) (R19).
6. **Release**: a small push `tools/release.sh dev "first line"` (pushes `dev`, copies the build to the /dev/ page); a step `tools/release.sh 1.1 "first line"` (the row in `docs/versions.md`, `main` moved to `dev`, the released page) — **on Okay's word only**, and a session's safety check may refuse it (a production deploy): then he runs it from his Mac. Tags and GitHub Releases can't be pushed from a session (`tools/versions.sh tag` from his Mac).
7. **Reply**: short bullets — what changed, the values used, what is open. He reads on an iPad.

**Version**: **v1.0.5 beta** on `dev` and /dev/ (<https://duztman.github.io/dial-tool/dev/>, a loader in `web/dev/index.html`, own browser storage); **v1.0 beta** on `main` and <https://duztman.github.io/dial-tool/>; 27 Oct 2026 (Okay: "call this a v1.0 beta version from now on"). Next: v1.0.6 beta for a small push, v1.1 beta for a step.

## Where things live, and what not to touch

- Commit to `dev`; `main` only for a released version. Every build stays in the history (`docs/versions.md`; `tools/versions.sh open X`).
- The Gallery's dials: `web/gallery.mjs` → `src/gallery.js`; the examples `web/examples.mjs`; cards by `card()` in `web/links.mjs`. Fonts: `web/fonts/`, `web/fonts.mjs`. Icons (R33): drawn through `web/icons/` (`fit.mjs` → paste → `check.mjs` → `look.py` → look at `web/icons/out/sheet.png`), never a stylesheet border or a scaled drawing.
- **The guide** (`guide/`, #93, edition 1 at `/guide/`) is rebuilt only when Okay asks (R25): `bash guide/make.sh`, look at `guide/look/out/review/`, publish. `guide/notes-okay.md` is canon for page design.
- **Screenshots are not in the repo** (R36): they are on Okay's Mac, `~/Desktop/dial-maker/screenshots/`, reachable when the session is linked to it; otherwise ask him for the picture. Don't look for pictures in a clone.
- **Okay's Mac clone** `~/Desktop/dial-maker/dial-tool-github-repo/`: his; not to be raised (brief §5.14).
- Don't commit his notes or PDFs as files (quote them into the docs); don't edit `archive/drawbot/`; don't change the bar's monospace unasked (it is Dial Mono since v1.0.5 beta, Okay's word of 30 Oct 2026).
