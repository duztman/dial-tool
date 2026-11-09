# Handoff — where things stand

*§1 is rewritten at every handover (last on 10 Nov 2026, 00:20, v1.1.55 beta); §2 says how. Everything else a successor needs is in `CLAUDE.md` (the read order, the loop) and `working-with-okay.md`.*

## 1 · Where things stand (10 Nov 2026, 00:20; v1.1.55 beta on `dev` and /dev/, v1.0 beta on `main` and the released page)

- **Pages**: <https://duztman.github.io/dial-tool/dev/> is **v1.1.55 beta**; <https://duztman.github.io/dial-tool/> and `main` are **v1.0 beta**. The step to `main` is Okay's to run (`tools/release.sh 1.2 "first line"`; a session's safety check refuses a production deploy). `dev` is clean and pushed.
- **This session (9 Nov 2026)**: complications began with the GMT hand, #577 — the + after the hand tabs asks the function (GMT only now), the GMT hand turns 24 h (midnight at 12) or 12 h with hours ahead, under the hour hand — the stack is the movement's, fixed (v1.1.55, after his "if so just remove movability"). His picks are in `decisions.md`; the mechanism is in `changelog.md` v1.1.54–55.
- **For Okay to verify**: #577 as built (the +, the GMT tab and its two rows, the − on its Show line, its row in the Shadows pane and show mode's Heights pane) — on his Mac and the iPad; #580 and #404 (v1.1.52–53) still unverified.
- **Open on #577** (its row stays in Later): day · week · month trackers for the + menu; a measured pipe Ø for a GMT hand's Fit hole (`HOLE_FIT` has none; Fit cuts no hole on it, Own does); the GMT hand in the Wear OS export (the fixed three only); the stack picture's GMT length is a guess (29) between the hour's and the minute's.
- **Next**: his to call — the build list's Now is empty; #346 with #83 (complications, systematized) is the line he put after #175.
- **Flaky**: the guide-popup click (`pop_pick`, a `.tone` "not visible") timed out once on a full run and passed alone; the four known window checks as before.
- **The counter (#548)**: asleep until the step to `main`; Okay must make the GoatCounter account (`okayka`).
- **Known on the tools**: a session's clone is shallow — `tools/setup.sh` widens the fetch. Push needs the repo attached with push access (`add_repo`, access "push"). Folder access to his Mac's `~/Desktop/dial-maker` was refused by the app's safety check again this session: ask him for pictures in the chat. His notes gdoc *Dial tool notes* is unchanged since 24 Oct.
- **He builds by rounds** (`working-with-okay.md` §2): a tune in `web/test/sketches/`, its shot sent, his marks, the next round; on "Build", the tune's values into `src/`, the tune deleted, `npm test`, docs, one version, `tools/release.sh dev`.

## 2 · Handing over again

When the context runs long, or Okay asks:

1. Finish the push in progress, or commit it as work in progress and say so. Never hand over with `dev` dirty.
2. Rewrite §1: the state, what's next, any open readings, Okay's last words; date it. Add to `working-with-okay.md` whatever you learnt about working with him.
3. Commit and push `dev`.
4. Tell Okay to start a new session on `duztman/dial-tool`, branch `dev`, with this message:

> Taking over the Dial Tool. Read `CLAUDE.md` and what it lists. Run `tools/setup.sh` and `npm test`. Then tell me in five lines where things stand and what you'll do next, and wait for my go.
