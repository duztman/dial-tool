# Handoff — where things stand

*§1 is rewritten at every handover (last on 25 Oct 2026, beta 4.94.1); §2 says how. Everything else a successor needs is in `CLAUDE.md` (the read order, the loop) and `working-with-okay.md`.*

## 1 · Where things stand (25 Oct 2026, evening; beta 4.94.1 on `dev` and /dev/, beta 4.93 on `main` and the released page)

- **Pages**: <https://duztman.github.io/dial-tool/dev/> is **beta 4.94.1**; <https://duztman.github.io/dial-tool/> and `main` are **beta 4.93**. **The step to `main` is Okay's to run** — `tools/release.sh 4.94 "app.js in parts, one file per part of the window (#69); the audit's findings built (#542); the load measured"` — because a session's safety check refuses a push to `main` and the released page (a production deploy). The full check is green on `dev`; the row in `docs/versions.md` comes with the step. The Help page is at </help/> (`guide/help/`, published on his word with `guide/help/publish.sh`).
- **Today's work, in order** (the changelog has each): 4.93.1 the code audit, alone ("get this software tip top … do it alone"); 4.93.2 six of Wiegel's fonts (#501; `release.sh` now copies `web/fonts/` to the site); 4.94 `app.js` in seventeen parts (#69), #542 built, the load measured (#14); 4.94.1 the speed round (same.mjs halved, the page's start 150 ms lighter, slider steps on heavy dials 40 % faster). Then the docs made lean (this page, `CLAUDE.md`, `rules/`, the two glossaries, the build list's one-line rows; Okay: "Do all").
- **30–31 Oct 2026, v1.0.7 beta on `dev` and /dev/ (Dial Mono the interface's mono, v1.0.5; the bar's time in it and the ruler's names over taller marks, v1.0.6; window frames even all round — the stroker at scale, #550, v1.0.7; strokes as a feature is #551, a step, sketches first): RAL mode in the colour pop-out, and the pop-out's line, rows, bands and chart pill redrawn** (#549; the changelog's three sections say what; his drawing of 16:14 is the reference, `docs/decisions.md` 16:23). For Okay to verify on his Mac and iPad: the grid's cells under a finger (19 × 18 at 140; wide doubles them), the letters over the line's cells, the sheet on a phone, a pop-out opened low growing upward.
- **For Okay to verify** (not seen on his machines yet): #511's flash on Safari (the swoop no longer fits the view a frame early — may be it); the iPad's hovers (every `:hover` is under `(hover: hover)`); on-path text drawn with its kerning (a look change on every on-path ring); a colour not chosen in a guide's popup at 40 %, hidden rings and hands gone from the Shadows pane, a Gallery dial no longer switching the guides on, an unreadable link said in a note.
- **Open with him**: #526 the sun picture on show mode's Light tab (decided 24 Oct, not built); #539 1–2 px more in the Guides foot's pills; #540 the font sheet notes of 25 Oct (build on his word); #542's look-changing findings not built (the colour pop-out under the Shadows list and the rest, in its notes row).
- **Known on the tools**: a session's clone is shallow — `tools/setup.sh` widens the fetch; without it `release.sh` fails at `to_main` or builds the live page on a stale `gh-pages`. Reaching his Mac's screenshot folder (R36) needs `device_request_folder_access`; files go over as one zip through `device_commit_files` with a `fileUuid` from SendUserFile.
- **He builds by rounds** (`working-with-okay.md` §2): each round to /dev/ with crops; he answers with marked-up screenshots and short notes, in question mode when asked. His mid-work notes are notes: log them, carry on.

## 2 · Handing over again

When the context runs long, or Okay asks:

1. Finish the push in progress, or commit it as work in progress and say so. Never hand over with `dev` dirty.
2. Rewrite §1: the state, what's next, any open readings, Okay's last words; date it. Add to `working-with-okay.md` whatever you learnt about working with him.
3. Commit and push `dev`.
4. Tell Okay to start a new session on `duztman/dial-tool`, branch `dev`, with this message:

> Taking over the Dial Tool. Read `CLAUDE.md` and what it lists. Run `tools/setup.sh` and `npm test`. Then tell me in five lines where things stand and what you'll do next, and wait for my go.
