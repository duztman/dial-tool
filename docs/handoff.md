# Handoff — where things stand

*§1 is rewritten at every handover (last on 3 Nov 2026, 02:40, v1.1.44 beta, Okay: "No checks for these, write a handoff doc to take up from here"); §2 says how. Everything else a successor needs is in `CLAUDE.md` (the read order, the loop) and `working-with-okay.md`.*

## 1 · Where things stand (3 Nov 2026, 02:40; v1.1.44 beta on `dev` and /dev/, v1.0 beta on `main` and the released page)

- **Pages**: <https://duztman.github.io/dial-tool/dev/> is **v1.1.44 beta**; <https://duztman.github.io/dial-tool/> and `main` are **v1.0 beta**. The step to `main` is Okay's to run (`tools/release.sh 1.2 "first line"`; a session's safety check refuses a production deploy). `dev` is clean and pushed.
- **Next, in this order** (build list, Now):
  1. **#581 — show mode's lists, round 2, draw first** (`web/test/sketch.mjs`, on the Dial tab in show mode: `t.show_mode(true, true)`, then `S.ui_section = 5`). His words, 02:34: "Link was a good touch but is that how we do the unselected? It cuts into the line and unfilled. Linked gets filled and is line color filled with contrasting text on it." and "Date at 3 gets the full length line, neighbors top line loses length. The neighbors are part of the window group." Known causes: the LINK pill is `colour.js` `ink_link` + `4e-colour.css` (`.colourlist > .row.haslink > .linkpill`; on = `--ink` fill now — he wants the line's colour, `--row-rule`, with contrasting text); unlinked it is an outline sitting across the line — draw a look that doesn't cut it and ask. The long line over the last colour (Neighbours) is that row's own outer top shadow (`.row:not(.note)` in `4c-rows.css`); the line under a part of several colours should be an item's (from the marks' column), not the names'.
  2. **#579 — rings reordered in show mode**: Colours › Rings, each ring a 6-dot gripper just before its swatch, dragged top-down as the dial side's ring list (`rings.js`), undoable.
  3. **#175 — the lume view**: Light's Day · Night pill on top; Night = lume mode, a Lume decay slider under it, the Sun replaced by the Moon (Strength 50 %), a darkness filter true to colour theory. Draw first, on his word.
- **For Okay to verify**: #576, show mode's lists as built in v1.1.42–44 (groups and colour parts opening by chevrons; marks; Bevels working with Bevel Type, none on a disc; hands see-through; Inks a line a part with LINK; a hand's colours and prints opened).
- **Verified today**: #574 (the disc hand), #175 as built in v1.1.39, #531, #572 (`build-list-done.md`).
- **Noted, later**: #580 the hands' heights as a pane at the end of show mode's column ("all that's for later"); #577 hands of your own (+ beside the hand tabs: GMT, day, week, month — ask first, in the Shadows stack); #578 the time bar top or bottom; #575 controllers for show mode's numbers and sliders on the iPad.
- **The model he chose for inks (02:11)**: every part on its own line under its group; parts of one colour share a height (one ink) — a LINK pill between them — unless unlinked to an own height (`ink_h`, `stroke_h`, `frame_h` on a ring or window; `op_ink_h`, `mark_ink_h`, `mark_stroke_ink_h` on a hand), show mode's only, out of the link (R7). The old Two inks / A | B UI is gone; old files' splits still draw (`ink_mm`). A disc's prints share one height (`print_h`): their LINK is fixed — per-print heights would need a new setting; not asked.
- **Flaky**: four window checks fail now and then on a full run (the session's reload, a pasted link, a red hand's shadow, X-ray) and pass on the rerun of `node test/window.mjs`.
- **The counter (#548)**: asleep until the step to `main`; Okay must make the GoatCounter account (`okayka`).
- **Known on the tools**: a session's clone is shallow — `tools/setup.sh` widens the fetch. Push needs the repo attached with push access (`add_repo`, access "push"). Folder access to his Mac's `~/Desktop/dial-maker` was refused by the app's safety check this session: ask him for pictures in the chat. His notes gdoc *Dial tool notes* is unchanged since 24 Oct.
- **The Show Case 3D exercise (4–5 Nov 2026)** lives on branch `try/relight`, nothing on `dev`: a three.js model of the dial in a whole watch toward a Photo look (Okay: "this reference is the goal"), built as data — section × path × finish per face — one case (the diver; the cushion dropped, "sub par"), three bracelets and a leather strap after his strap photographs. Round 30 (5 Nov 2026, 20:00) is published as the private artifact *Watch 3D trial* and republished every round. Its knowledge base is `web/try/relight/kb/` (findings from his reference photographs ref-01…34, the system, the rounds 1–30, the open items, the photo index); the photographs are on his Mac (`screenshots/2026-11-05-3d-refs/`, R36). Open, in his order: the rehaut/bezel profile (his eye), lume (#8), the ground grain (8a, parked: the bump's relief is true and invisible), the strap's stitching, buckle and texture, iPad performance (#11); the clasp is out of budget; the Calatrava (a `dress` row in `CASES`) waits on photographs. The Project doc `claude/show-case-3d-kb.md` is the same text, searchable.
- **He builds by rounds** (`working-with-okay.md` §2): a tune in `web/test/sketches/`, its shot sent, his marks, the next round; on "Build", the tune's values into `src/`, the tune deleted, `npm test`, docs, one version, `tools/release.sh dev`.

## 2 · Handing over again

When the context runs long, or Okay asks:

1. Finish the push in progress, or commit it as work in progress and say so. Never hand over with `dev` dirty.
2. Rewrite §1: the state, what's next, any open readings, Okay's last words; date it. Add to `working-with-okay.md` whatever you learnt about working with him.
3. Commit and push `dev`.
4. Tell Okay to start a new session on `duztman/dial-tool`, branch `dev`, with this message:

> Taking over the Dial Tool. Read `CLAUDE.md` and what it lists. Run `tools/setup.sh` and `npm test`. Then tell me in five lines where things stand and what you'll do next, and wait for my go.
