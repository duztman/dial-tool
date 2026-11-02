# Handoff — where things stand

*§1 is rewritten at every handover (last on 2 Nov 2026, v1.1.38 beta, handing #175 to a new agent); §2 says how. Everything else a successor needs is in `CLAUDE.md` (the read order, the loop) and `working-with-okay.md`.*

## 1 · Where things stand (2 Nov 2026, 19:30; v1.1.38 beta on `dev` and /dev/, v1.0 beta on `main` and the released page)

- **Pages**: <https://duztman.github.io/dial-tool/dev/> is **v1.1.38 beta**; <https://duztman.github.io/dial-tool/> and `main` are **v1.0 beta**. The step to `main` is Okay's to run (`tools/release.sh 1.2 "first line"`; a session's safety check refuses a production deploy). The Help page is at </help/>.
- **Now: #175, a hand as a stack** (his order; Okay, 2 Nov 2026, 16:38: "Let's tackle hand on a stack"). Settled with him:
  - **Opening** is the word for a shape cut through a hand ("Opening: yes"); not *window*, the plate's word. Glossary line in place, marked planned.
  - **Caps are out of #175**: "No, our cap rules stand, remove whatever this is". The Cap stays part of the seconds hand, or the topmost hand's with *Cap on this hand*.
  - **The lume is stacked**: a part with its own height (Shadows pane, side view), not a colour on the blade ("Stacked lume for hands").
  - **A lume view in show mode** comes with it, pulled forward from #522 ("lume view for show case").
  - **Draw first**: a sketch round on the real page (`web/test/sketch.mjs`, `working-with-okay.md` §2) before building. Not drawn yet. Questions the drawing should answer: an opening's shapes and places along the hand (one or several, at a %), the lume's inset from the opening's edge, the lume's colour and height rows, where the rows sit in the hand's pane (ask for a crop if not drawn — see working-with-okay).
- **For Okay to verify**: #531 hand bevels — the Bevel pane under the Show box once Bevel is ticked, Bevel Type Ridge · Domed, Bevels % (v1.1.37); #572 show mode's sun lock (v1.1.34). v1.1.38's merged glyph outlines need no check of his but a look at Pathway Extreme in show mode.
- **Today, done and verified**: #169, #569, #570, #571; #526 (show mode's sun box). Built today besides: the font sheet's filters drawn in lines and the name over the sample (v1.1.30–32); every glyph one outline (v1.1.38).
- **Later, new**: #573, a Faceted bevel — v1.1.35–36's did not work ("remove for now, note for later"); its place in `BEVEL_LOOKS` and the dead key `facet_turn` wait.
- **Known broken, not his**: the icon check fails on the `every-strip` icon (#169, since v1.1.27; 16 problems: line weights off the icon grid's set, a level run off the quarter points). Small pushes skip the icon check, so a full `npm test` shows it. Redraw it through `web/icons/` (R33) — ask him first, it's a look change.
- **Flaky once today**: four window checks failed in one `npm run small` (the session's reload, a pasted link, a red hand's shadow, X-ray) and passed on the rerun.
- **The counter (#548)** is built, asleep until the step to `main`; Okay must make the GoatCounter account with the code `okayka` (or say his code: `COUNTER_CODE` in `web/build.mjs`).
- **Open from #501**: Rundgotisch Rauh (the archive's file is Tyskland 45 — fix the Wiegel Archive first), Tartlers End is the Krystal cut.
- **The phone's layout is not cared for** until he says so (brief §2): the window test prints its phone checks, never counts them.
- **Known on the tools**: a session's clone is shallow — `tools/setup.sh` widens the fetch. Pushing needs the repo attached with push access (`add_repo`, access "push"); a read-only clone's push is refused by the proxy. His notes gdoc *Dial tool notes* is readable through the Google Drive connector (exported as zip HTML, its pictures in `images/`; the #531 drawing is `image30.png`).
- **He builds by rounds** (`working-with-okay.md` §2): each round to /dev/ with crops; he answers with marked-up screenshots and short notes. Mid-work notes are notes: log them, carry on.

## 2 · Handing over again

When the context runs long, or Okay asks:

1. Finish the push in progress, or commit it as work in progress and say so. Never hand over with `dev` dirty.
2. Rewrite §1: the state, what's next, any open readings, Okay's last words; date it. Add to `working-with-okay.md` whatever you learnt about working with him.
3. Commit and push `dev`.
4. Tell Okay to start a new session on `duztman/dial-tool`, branch `dev`, with this message:

> Taking over the Dial Tool. Read `CLAUDE.md` and what it lists. Run `tools/setup.sh` and `npm test`. Then tell me in five lines where things stand and what you'll do next, and wait for my go.
