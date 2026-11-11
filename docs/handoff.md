# Handoff — where things stand

*§1 is rewritten at every handover (last on 11 Nov 2026, 19:40, v1.1.76 beta); §2 says how. Everything else a successor needs is in `CLAUDE.md` (the read order, the loop) and `working-with-okay.md`.*

## 1 · Where things stand (11 Nov 2026, 19:40; v1.1.76 beta on `dev` and /dev/, v1.0 beta on `main` and the released page)

- **Pages**: <https://duztman.github.io/dial-tool/dev/> is **v1.1.76 beta**; <https://duztman.github.io/dial-tool/> and `main` are **v1.0 beta**. The step to `main` is Okay's to run. `dev` is clean and pushed. Versions count in the third number toward 100; nothing goes to v1.2 until Okay says so (11 Nov 2026).
- **Products (Okay, 11 Nov 2026)**: everything up to v1.2 is open source (this repo, MIT). **Pro** = Dial Tool + **Show Case 3D**, in the private repo `duztman/dial-tool-pro` (`web/3d/`; its own `CLAUDE.md`, `web/3d/kb/README.md`, `kb/open.md`, `kb/rounds.md`, round 108). An iPad app is being considered. 3D work through round 102 stays MIT. Nothing made in Pro goes into this repo. The rules both share live here (`web/src/parts.js`, `web/src/movements.js`) and are copied into Pro by its `web/3d/engine-build.mjs`.
- **This session (11 Nov 2026, v1.1.65–76)**: the parts' record (`parts.js`, #589); the calendar hands move with time, Jump · Sweep, the weekday in the bar's date popup (#590); Artisan replaces the old style name everywhere (#591); Choose your movement (#586); Base · Material (Brass · Bronze · Steel · Silver) · Paint with No colour, a metal sheen that follows the sun (#592); rings on the rehaut (one) and the bezel (three) with their own tabs; a disc hand to the dial's edge (#593); a saved SVG says the case for 3D (`data-case`); show mode's Colours list the rehaut and bezel; Markings on the bezel's metal; the glass inside the bezel; Body Ø, a bezel starting flat, Finish Paint · Engrave, a ring on a disc hand (#594). Every row is in `changelog.md` and `decisions.md`.
- **For Okay to verify**: #586–#594 on the Mac and the iPad (the build list's Verify group), above all the three Finish switches and an exported SVG/PDF opened in Illustrator (one Engrave layer).
- **Asked at the session's end, not started** (Okay, 11 Nov 2026, 19:29): "Bezel rehaut case situation is abysmal on regular showcase. i need real solutions there as well" (#595) · "i need the rehault to be a complication itself, hours minutes days etc." (#596) · "All these new settings" (the sentence ends there: ask him what he meant before building). The 3D side of the same message is Pro's `kb/open.md` items 15–19.
- **Links**: `engrave`, `rh_engrave`, `bz_engrave`, `on_hand` and the other v1.1.65–76 keys travel in a link. `w_body` (Body Ø) does not: show settings (`w_`) stay out of links (R31). A dial saved as an SVG for 3D carries the Body Ø (`data-case` `body`).
- **Flaky**: "the LINK pill as the Windows tab's" and "the eye switch" fail now and then in `window.mjs` and pass alone; nothing else fails.
- **Known on the tools**: `tools/setup.sh` once per container. Push needs the repo attached with push access. The local server (`python3 -m http.server 8765` from `web/`, for Pro's `same3d.mjs`) dies between turns: start it again. Screenshots are on Okay's Mac (R36): ask for them in the chat.
- **He builds by rounds** (`working-with-okay.md` §2).

## 2 · Handing over again

When the context runs long, or Okay asks:

1. Finish the push in progress, or commit it as work in progress and say so. Never hand over with `dev` dirty.
2. Rewrite §1: the state, what's next, any open readings, Okay's last words; date it. Add to `working-with-okay.md` whatever you learnt about working with him.
3. Commit and push `dev`.
4. Tell Okay to start a new session on `duztman/dial-tool`, branch `dev`, with this message:

> Taking over the Dial Tool. Read `CLAUDE.md` and what it lists. Run `tools/setup.sh` and `npm test`. Then tell me in five lines where things stand and what you'll do next, and wait for my go.
