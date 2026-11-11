# Handoff — where things stand

*§1 is rewritten at every handover (last on 11 Nov 2026, 21:40, v1.1.77 beta); §2 says how. Everything else a successor needs is in `CLAUDE.md` (the read order, the loop) and `working-with-okay.md`.*

## 1 · Where things stand (11 Nov 2026, 21:40; v1.1.77 beta on `dev` and /dev/, v1.0 beta on `main` and the released page)

- **Pages**: <https://duztman.github.io/dial-tool/dev/> is **v1.1.77 beta**; <https://duztman.github.io/dial-tool/> and `main` are **v1.0 beta**. The step to `main` is Okay's to run. Versions count in the third number toward 100; nothing goes to v1.2 until Okay says so (11 Nov 2026).
- **Products (Okay, 11 Nov 2026)**: everything up to v1.2 is open source (this repo, MIT). **Pro** = Dial Tool + **Show Case 3D**, in the private repo `duztman/dial-tool-pro` (`web/3d/`; its own `CLAUDE.md`, `web/3d/kb/README.md`, `kb/open.md`, `kb/rounds.md`, round 110). Nothing made in Pro goes into this repo. The rules both share live here (`web/src/parts.js`, `web/src/movements.js`) and are copied into Pro by its `web/3d/engine-build.mjs`.
- **The session before this one (v1.1.65–76)** built #586–#594 in one long run; all of it is for Okay to verify (the build list's Verify group), above all the three Finish switches and an exported SVG/PDF opened in Illustrator (one Engrave layer).
- **This session** (Okay, 19:35: "We lost a lot of things, dropdowns behind ui elements, 3d loses lights while adjusting different things"; 19:57: "Fix all please. Do big tests, audit the css etc. then take over, go on with the handoff items"):
  - **v1.1.77 beta**: the languages' list and a ring's kinds hang on the window (`menu_hang`); a menu's list never leaves the window; a list from the bar is the dark one; `test/pops.mjs` audits every opener (changelog).
  - **Pro round 109**: what a slider builds again is freed from the graphics card (it was not: the likely cause of the room going dark on the iPad); the drawn styles' sky light back in the scene (lost to a comment since round 98); the Movement list on the window.
  - **Pro round 110**: the rehaut's dark wedge (the plan picture's band was not a whole ring); Engrave depth, Parts, × 0.2 – 3.
- **Not confirmed by Okay**: which dropdown he saw behind what — the ones found and mended are the languages' list (under the bar) and the Case list (26 px past the window); if his was another, ask for the screenshot. Whether the iPad still loses its lights after long slider work — a session cannot run an iPad's graphics card; the counts of `leak3d.mjs` are the proof.
- **Asked, not started — each needs his word first**: #595 (show mode's case: the 3D view in its place, or a proper 2D bezel?) · #596 (the rehaut as a complication: does it turn, or does a hand read it; which functions first?) · #597 ("dial tool's default bezel geometry settings should come from 3d's new settings": three readings in the notes) · "All these new settings" (his sentence of 19:29 ends there).
- **Pro's open items**: `kb/open.md` 16 (his own dial's engraving), 18 (the seam between a lug's top and a wider body), 19 (the rehaut's ring when the rehaut is this page's own).
- **Tests**: a full `npm test` ends "2 problem(s)" (#598: the LINK pill's group name, 12 · 14, every run; the eye switch) and so never reaches the icon check — run `node icons/check.mjs` by hand (it passes). Pro: `same3d.mjs` for a look that must not change, `leak3d.mjs` for anything a slider builds again.
- **Links**: `engrave`, `rh_engrave`, `bz_engrave`, `on_hand` and the other v1.1.65–76 keys travel in a link. `w_body` (Body Ø) does not: show settings (`w_`) stay out of links (R31). A dial saved as an SVG for 3D carries the Body Ø (`data-case` `body`).
- **Known on the tools**: `tools/setup.sh` once per container. The local server (`python3 -m http.server 8765` from `web/`, for Pro's tools) may die between turns: start it again. Software GL is slow: a 3D probe of forty controls takes fifteen minutes — run it in the background. Screenshots are on Okay's Mac (R36): ask for them in the chat.
- **He builds by rounds** (`working-with-okay.md` §2).

## 2 · Handing over again

When the context runs long, or Okay asks:

1. Finish the push in progress, or commit it as work in progress and say so. Never hand over with `dev` dirty.
2. Rewrite §1: the state, what's next, any open readings, Okay's last words; date it. Add to `working-with-okay.md` whatever you learnt about working with him.
3. Commit and push `dev`.
4. Tell Okay to start a new session on `duztman/dial-tool`, branch `dev`, with this message:

> Taking over the Dial Tool. Read `CLAUDE.md` and what it lists. Run `tools/setup.sh` and `npm test`. Then tell me in five lines where things stand and what you'll do next, and wait for my go.
