# Dial Tool

A parametric watch-dial design tool that runs on the web. Rings of ticks, markers, numerals, bands and text; hands; up to four windows; export to PDF, SVG and PNG.
Built to explore, present and produce watch dials.

**Use it: <https://duztman.github.io/dial-tool/>** (the released build, `main`), or <https://duztman.github.io/dial-tool/dev/> (the newest small push, `dev`, with its own saved dials and session), or open [`web/dial-tool.html`](web/dial-tool.html) from disk (one file, no install; Chrome or Edge for the fonts installed on the computer).

**Version: beta 4.92.24 on `dev` and the /dev/ page (24 Oct 2026: the new Guides popup); beta 4.92.1 on `main` and the released page.** `main` = released, `dev` = work in progress. Every earlier build, back to beta 1.0: [`docs/versions.md`](docs/versions.md).
What it has and lacks: [`docs/changelog.md`](docs/changelog.md). What's next, and what v1 needs: [`docs/build-list.md`](docs/build-list.md).

**Guidebook:** edition 1 is at <https://duztman.github.io/dial-tool/guide/>, built from the app in `guide/` by its plan, `guide/PLAN.md` (build list #93); rebuilt only when Okay asks (R25).

## Files

| File | What it is |
|---|---|
| `web/dial-tool.html` | **The tool, built**: one file with everything inside. Open it in a browser. |
| `web/src/` | Its source: `geometry.js` (settings, geometry, drawing) · `output.js` (SVG, PDF) · `app.js` (the window) · `moment.js` (the complications: one moment gives every window's text) · `watch.js` (the watch round the dial: cases, lugs, crown, straps, buckle, bracelets — one geometry, two paints; the Show Case's engine too) · `ink.js` (labels centred on their ink) · `opener.js` (the dial it opens with) · `wearos/` (the Wear OS export) · `css/` (the stylesheet, one file per layer and part, R32) · `main.js`. `web/build.mjs` packs them into the one file. |
| `web/fonts/` | The sixty-nine open-licence font families the tool offers (SIL OFL, Apache 2.0 for Syncopate, free software for GL-Nummernschild; `README.md` and `licences/` inside; half of them are the font research's top tier, `docs/font-tiers-2026-10-16.md`). `web/fonts/ui/` holds the tool's own small fonts (Silkscreen for the tiny numbers, Dial Mono, Dial Time, Dial Date), packed into the page by `build.mjs`; `web/fonts.mjs` fetches the families and writes `src/font_list.js`; `web/examples.mjs` writes the example dials (`src/examples.js`); `web/gallery.mjs` holds and writes the Gallery's dials (`src/gallery.js`); `web/links.mjs` turns settings into links and draws both lists' cards (`card()`). |
| `web/icons/` | The icon pipeline (R33, design canon §9): `fit.mjs` puts a new drawing on the icon grid and prints the code; `check.mjs` checks every icon in the running window (in `npm test`); `look.py` reads how heavy each line looks; `archive.mjs` keeps every icon as an SVG file in `svg/`. How: its `README.md`. |
| `web/test/` | `npm test` runs them all. `parity.py` draws every harness dial with the frozen `dial.py` and with the web geometry and compares the pictures; `labels.mjs`, `linktrip.mjs`, `moment.mjs`, `wearos_test.mjs` test the labels, the links, the complications and the Wear OS export without a window; `window.mjs` uses the built page in Chromium (rows, ring list, clicks on the preview, fonts, exports, save and load); `same.mjs` keeps the look of the window (every element's computed style) and compares it, for changes that must not change the look. |
| `guide/` | The guidebook: its plan, text, checks, pictures and build (`make.sh`). |
| `archive/glossary-full-2026-10-21.md` | The glossary before it was made leaner, with drawing details (the Play triangle's flare, the packed UI fonts) the lean one leaves to the code. |
| `archive/guide/` | The old guides (the 4 Oct DrawBot guidebook and the 4.36.1 web review pages). |
| `docs/versions.md`, `tools/versions.sh` | Every build and its commit. `tools/versions.sh tag` makes a tag per version; `tools/versions.sh open 4.30` puts that version, whole, in a folder beside the clone. |
| `docs/handoff.md`, `tools/release.sh`, `tools/setup.sh` | For the next Claude session: where things stand and how the work runs (`handoff.md`); a fresh container made ready for the tests (`setup.sh`); a version put on the live page, or `main` brought up to `dev` (`release.sh`). |
| `docs/brief.md` | Goals, outputs, open questions, parked ideas. |
| `docs/decisions.md` | Every decision, dated, with Okay's words as the reason (not read before working). |
| `docs/rules.md` | Standing rules — check code against these in reviews. |
| `docs/design.md` | The design canon: type, grid, colour, pictures, redrawn controls, icons — for the guide, the tool and anything else shown. |
| `docs/glossary.md` | Watch terms and tool terms, and which word means what here. |
| `docs/build-list.md` | Numbered open items, things to verify, ideas; `docs/build-list-done.md` holds the done ones (numbers are never reused). |
| `docs/changelog.md` | Versions, what changed in each. |
| `docs/font-research-2026-10-16.md`, `docs/font-tiers-2026-10-16.md` | The font research of 16 Oct 2026: which fonts Okay accepted (Peter Wiegel's 46, Font Picks' 49), how, their licences, and the tiers of the font list. |
| `docs/project-prompt.md` | Start-off prompt for the Claude Project. |
| `packer/` | **Dial Packer**, a side product (19 Oct 2026): packs discs of three sizes densely on a page, for visuals like the guide's cover. One built file, `packer/dial-packer.html`; online at <https://duztman.github.io/dial-tool/packer/>. How it works and how to change it: `packer/README.md`. |
| `show-case/` | **Dial Show Case**: a dial in a whole watch, two styles (Engineer, Miyazaki), its own export. Online at <https://duztman.github.io/dial-tool/show-case/>; its engine is `web/src/watch.js`; going into the app as show mode before v1 (build list group K); how it works: `show-case/README.md`. |
| `archive/drawbot/` | **The DrawBot version, frozen since 12 Oct 2026 (R30)** — kept, not edited: `dial.py` (beta 2.3), its tests, its preview plan, its rules, words and build-list items (`rules-drawbot.md`, `glossary-drawbot.md`, `build-list-drawbot.md`), reference renders, and the 4 Oct guidebook. `web/test/parity.py` still uses `dial.py` and `tools/test_harness.py` from here. |

## For agents

Taking over from another session: start with [`docs/handoff.md`](docs/handoff.md).
Read in this order: `README.md` → `docs/rules.md` → `docs/brief.md` → `docs/glossary.md` → `docs/build-list.md`.
Keep the docs up to date after every decision and flag inconsistencies between them.
After any change in `web/`: `cd web && npm install && npm test`, and look at the screenshots in `web/test/out/` (R19).
Every version gets a row in `docs/versions.md` (version, date, commit) as it goes live: `tools/release.sh X "first line"`; `tools/release.sh main` brings `main` up to `dev`.

## Licence

MIT — see [`LICENSE`](LICENSE). Fonts in `web/fonts/` keep their own open licences (SIL OFL, in `web/fonts/licences/`).

## Where it lives

GitHub [`duztman/dial-tool`](https://github.com/duztman/dial-tool), public (`main` = released, `dev` = work in progress, `gh-pages` = the online copy) ·
Claude Project "Dial Tool" · Okay's Mac: `~/Desktop/dial-maker/dial-tool-github-repo/` (a clone, refreshed at least every fifth version).
