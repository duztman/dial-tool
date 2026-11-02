# Handoff — where things stand

*§1 is rewritten at every handover (last on 2 Nov 2026, v1.1.37 beta, #175 in Now); §2 says how. Everything else a successor needs is in `CLAUDE.md` (the read order, the loop) and `working-with-okay.md`.*

## 1 · Where things stand (2 Nov 2026, 19:00; v1.1.37 beta on `dev` and /dev/, v1.0 beta on `main` and the released page)

- **Pages**: <https://duztman.github.io/dial-tool/dev/> is **v1.1.37 beta**; <https://duztman.github.io/dial-tool/> and `main` are **v1.0 beta**. The step to `main` is Okay's to run (`tools/release.sh 1.2 "first line"`; a session's safety check refuses a production deploy). The Help page is at </help/> (`guide/help/`, published on his word with `guide/help/publish.sh`).
- **2 Nov 2026, midday**: Okay verified the five Verify items on every machine (to done). #169 **Every mark** drawn in two sketch rounds (`web/test/sketch.mjs`) and built as v1.1.27 with three of his notes (#569 every dropdown over its button, #570 the font sheet's line, a gap without a shape). **The phone's layout is not cared for** until he says so: the window test prints its phone checks as "phone", never counted (brief §2). For him to verify: #169, #569, #570. Next in his order: #175. Remind him of Gerstner's programme (#180), parked "until #169 exists".
- **The docs' audit (1 Nov 2026, night)**: the build list is one ordered list (the order column is now → future, easier → harder; the # stays the item's name), folded rows and finished items out; the rules index gives each rule a learning order and a name (R-numbers unchanged — code and tests cite them); brief §5–§8, the rule pages, the Project prompt and this page brought in line. Okay's instruction for the session: research first, docs only, no building, nothing asked that the docs already answer.
- **The counter (#548) is built** (v1.1.9 beta), asleep until the step to `main`; Okay must make the GoatCounter account with the code `okayka` (or say his code: `COUNTER_CODE` in `web/build.mjs`).
- **2 Nov 2026, 16:38**: Okay verified #169, #569, #570, #571 (to done). v1.1.30–32: the font sheet's filter band no longer sits on the list when the Installed tab is hidden; the filters drawn in lines, the chosen one grey; a font's name over its sample. **For Okay to verify**: #531 the Bevel pane, Ridge · Domed (v1.1.37); Faceted to Later (#573), #572 sun lock (v1.1.34). **Now: #175, a hand as a stack** — openings and lume openings (Opening: his yes; caps out, the cap rules stand). Open: do a stack's layers get heights of their own (asked 18:48). Then a sketch round (`web/test/sketch.mjs`), then build.
- **Open from #501**: Rundgotisch Rauh (the archive's file is Tyskland 45 — fix the Wiegel Archive first), Tartlers End is the Krystal cut.
- **Known on the tools**: a session's clone is shallow — `tools/setup.sh` widens the fetch; without it `release.sh` fails at `to_main` or builds the live page on a stale `gh-pages`. His Mac's screenshot folder (R36) needs `device_request_folder_access`, which a session's classifier may refuse; then the pictures go to him as one zip. The gdoc *Dial tool notes* has had nothing new since 24 Oct 2026 (its notes are #513–#536).
- **He builds by rounds** (`working-with-okay.md` §2): each round to /dev/ with crops; he answers with marked-up screenshots and short notes, in question mode when asked. His mid-work notes are notes: log them, carry on. Drawings are sketch rounds on the real page (`web/test/sketch.mjs`).

## 2 · Handing over again

When the context runs long, or Okay asks:

1. Finish the push in progress, or commit it as work in progress and say so. Never hand over with `dev` dirty.
2. Rewrite §1: the state, what's next, any open readings, Okay's last words; date it. Add to `working-with-okay.md` whatever you learnt about working with him.
3. Commit and push `dev`.
4. Tell Okay to start a new session on `duztman/dial-tool`, branch `dev`, with this message:

> Taking over the Dial Tool. Read `CLAUDE.md` and what it lists. Run `tools/setup.sh` and `npm test`. Then tell me in five lines where things stand and what you'll do next, and wait for my go.
