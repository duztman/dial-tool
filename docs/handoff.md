# Handoff — taking over the Dial Tool

*Written 16 Oct 2026 at beta 4.46.5 (Okay: "devise way to handoff to another agent"); §1 rewritten at every handover, last on 23 Oct 2026, at beta 4.92. The rest changes when something new is learnt.*

A new session starts with no memory of the last one: the transcript stays in the old container. Everything a successor needs is in the repo. Use this page to find it.

## 1 · Where things stand (23 Oct 2026, beta 4.92 on `main`, `dev`, the released page and /dev/)

- **Pages**: <https://duztman.github.io/dial-tool/> and <https://duztman.github.io/dial-tool/dev/> are **beta 4.92**; `main` = `dev`. The Show Case page (</show-case/>) is beta 1.0.21, built from the same `web/src/watch.js`, a sandbox only (Okay: "left as a dev to tinker without touching main code").
- **The Show Case merge is done** (build list group K, #506–#509; Okay, 23 Oct 2026: "And we're done"): show mode is Dial Tool's second mode — the iris switch at the bottom right, one movement in and out (`swoop()`), the watch drawn by `watch.js` through `show.js`, the column tinted by the backdrop, Shenanigans at its foot. What is left of it is #510 (Backdrop's auto, the bracelet of links, ink per colour, the buttons' looks with Okay, R26's wording, the v1 list).
- **Okay builds by rounds**: each round goes to /dev/ with pictures; he answers with marked-up screenshots and short notes. Ask in question mode when a note can be read two ways; he answers precisely.
- **Pushing to the live pages** can be stopped by the session's safety check; then say so and wait for Okay's word (23 Oct 2026: he gave it with "push this on main, dev and show case individual pages").
- **Pictures**: never in the repo (R36).

## 2 · First steps in a new session

1. `bash tools/setup.sh`: the system library, the Python packages, the two test fonts, `npm install`, and the clone's fetch widened to every branch (a session's clone is shallow, so single-branch; without that `release.sh` builds the live page on a stale `gh-pages` — found 17 Oct). Safe to run twice.
2. Read what CLAUDE.md lists, in its order. Two places hold the recent work:
   - the last ~25 rows of `docs/decisions.md`;
   - the build list's open rows under its last two sections, with the phases above them.
3. `git log --oneline -15 dev` and `docs/versions.md`'s top rows confirm where things stand.
4. `cd web && npm test > some.log 2>&1` (about 6 minutes). See it pass before changing anything, and look at `web/test/out/`.
5. Two pages are online: <https://duztman.github.io/dial-tool/> is `main` (a step), <https://duztman.github.io/dial-tool/dev/> is `dev` (every small push, §3.7). The /dev/ page is a loader (`web/dev/index.html`) that fetches the build fresh at each refresh; the build keeps its storage under `dial-tool-dev-`, read from its address (`app.js`, `KEY()`).

## 3 · The loop, one version at a time

1. **Change** `web/src/`:
   - `app.js`: the panel. Each tab's rows are tables (`ROWS`) built by `build_row`; rows of their own are `row_*` methods.
   - `geometry.js`: the drawing, `VERSION`, the link keys (`LINK_KEYS`, append only, R31).
   - `css/`: one cascade layer per file, R32. The spacing scale is in `1-tokens.css` (`--unit` 5.5 px, `--u1`–`--u8` in half-units). One-off values go in its specials block, with Okay's words.
2. **Look while working:**
   - `node build.mjs`, then `node test/shot.mjs out.png` (one screenshot) or `node test/look.mjs` (every tab).
   - For spacing, measure the DOM with a few lines of Playwright (`getBoundingClientRect`), never by eye.
3. **Guard it:** add or change a check in `web/test/window.mjs`. Its message quotes Okay's words, so a later session sees why it's there.
4. **Test:** `npm test`, then look at the screenshots (R19).
5. **Docs:**
   - `docs/changelog.md`: a new section on top.
   - `docs/decisions.md`: a row after the last one.
   - `docs/build-list.md`: a done item's row moves to `docs/build-list-done.md` with its status "done — 4.x.y (…)"; numbers are never reused.
   - The glossary and rules if a word or a rule changed.
6. **Bump** in three places:
   - `VERSION` in `web/src/geometry.js`;
   - README line 8;
   - CLAUDE.md's *Web version* line.

   Run `node build.mjs`, then make one commit on `dev`: "beta X: first line", with the attribution trailers your session gives you.

   Numbering: a small push counts in the third number (4.46.5 → 4.46.6); a step counts in the second (4.47).
7. **Release:**
   - A small push (third number), after `npm run small`: `tools/release.sh dev "first line"` pushes `dev` and copies the build to the /dev/ page (`duztman.github.io/dial-tool/dev/`; Okay refreshes there). No row in `docs/versions.md`.
   - A step (second number), after the full `npm test`: `tools/release.sh 4.92 "first line"` adds the row in `docs/versions.md`, moves `main` to `dev` and copies the build to the released page (Okay, 21 Oct 2026: "second level updates 4.91-92 automatically to main. Small updates only on dev"; #500).
   - `tools/release.sh main` moves `main` to `dev` alone (fast-forward only).
   - Tags can't be pushed from a session (CLAUDE.md, *Versions*).
8. **Reply** to Okay: short bullets with what changed, the values used, and what's open. He reads on an iPad.

## 4 · Working with Okay — what the other docs don't say

- **His feedback** is annotated screenshots from an iPad or a Mac. Coloured marks mean what that message says. On 4.46, for example: green passed, blue = check spacing, red = change, purple = smaller. If the colours aren't explained, ask.
- **He types fast**, often on an iPad with a Turkish keyboard ("İ" for "I", "wo fit" for "to fit"). Read for intent. In the docs, quote him with only the certain typos mended.
- **Amounts** ("a bit", "much", "x0.5") follow the scale in his preferences. Take the smaller reading and say which value you used.
- **"Proceed automatically"** (16 Oct): go from push to push without asking. Two exceptions:
  - an item marked *sketch first*;
  - a genuinely open reading. Ask once, with a picture: he asked for "better visuals" when asked.
- **Final words.** "DONE, NO MORE DISCUSSION", "trust me", "the answer's there": build exactly that, no alternatives.
- **"Note and move on"**: the note goes to the build list, not into the push at hand.
- **On round three** of the same fix: stop, measure, ask. It's his rule.
- **The bigger picture.** He says he dives into details and loses it; flag it when you see it. A case: `main` had fallen 111 commits behind `dev` by 19 Oct.
- **His notes mid-work are notes, not stops** (17 Oct): "if new chats come in that means I'm just putting down notes, not to do now in this session. Report later. Go ahead." Put them in the build list under the phase they belong to and carry on.
- **Minimal input, push through** (17 Oct): "I trust you to push through … Check back with approved fittings before proposing new views. Old stuff trumps what you don't get from my instructions, distances centerings all under rule." So: reuse a fitting he has passed (a menu beside a label, the gripper's measures, the tab look) before drawing anything new; when a reading is open, take the smaller one and say it.
- **No access → give it up early** and put it under brief §5 (17 Oct: "Quit stuff early like no access and put them under open questions").
- **Long jobs in parallel** (17 Oct: "Long processes may happen, do other things in parallel"): run `npm test` in the background and read or write docs meanwhile; a subagent fetched the 21 fonts while 4.46.6 was built.
- **Don'ts:**
  - Don't commit his notes or PDFs as files: quote them into the docs.
  - Don't change the bar's monospace unasked.
  - Don't rebuild the guide unasked.
  - Don't edit `archive/drawbot/`.
- **"p. N" in the build list** is a page of his PDF *Notes on dial app* (21 pages, on his Google Drive; readable through a Google Drive connector if the session has one). The row's text is the full reading. Ask him for the page if it isn't enough.
- **A moved part is compared with its last look** (20 Oct, after "Why are you breaking things and not understanding me?"): when a change re-wraps or moves something that was right (the Show tick in a new line), crop it before and after and measure what it lines up with; a check in `window.mjs` holds it. When his words could mean a measure of something else on screen ("stay as bottom bar date now width"), measure that thing and say the number back.
- **Docs state the present** (19 Oct): never write "until 4.x it was…" into a doc, a rule or a code comment; keep his words as the reason, put the change in the changelog.

- **A check leaves the window as it found it** (20 Oct 2026, night): a check that moves to another tab, turns a window on or changes the dial puts it back at its end, or every later check sees another window. `test/window-only.mjs` shows which sections don't yet stand alone.
- **Alone at night** (20 Oct 2026, 02:02–02:26): "Build functionality … noted and screenshotted for my approval later, not messing with current build"; "Batch these crazy checks and fittings separately"; "Display your in progress screenshots in the chat". So: a branch of its own, defaults that draw as before, crops in the chat as they are made, a review doc and a review page at the end.

## 4b · The sketch loop (19 Oct 2026, first session on it)

Okay, 19 Oct 2026: "an agile way of seeing sketches alive and approving … I preview but can't see for real for a while, when my thoughts are collected we do one cycle to review and finesse few rounds then push". The loop:

1. **Start of session.** Say the model. Then trigger every permission at once, before anything else, and tell him to choose "always allow": push to `duztman/dial-tool` (`add_repo` with push), his Mac's `~/Desktop/dial-maker` (folder access), Google Drive (his notes doc), publishing the preview page. Starting should be simple.
2. **His notes doc** (Google Doc *Dial tool notes*, on his Drive; notes 1 → 3 so far): read it whole at the start. He adds a dated heading per round; read what is under the newest one. Its pictures: export the doc as PDF and `pdfimages` the pages (`read_file_content` shows only "[image]"). Log every new note in the build list under a section of its own before building.
3. **Sketch rounds.** One round = a few notes built → `npm run small` (about 2 minutes) → a WIP commit on `dev` (no docs, no version bump) → the build published to the **private preview page** (the Artifact *Dial Tool*, the same link every round: copy `web/dial-tool.html` to a fixed scratch path and publish that path) → **crops of only what changed**, before/after when there is a before, with the values used, sent to him in the chat. Crops: `node test/crop.mjs web/test/crops/x.png <tab> <selector> [setup.js]`; a setup that returns a value prints it (measure with it, R21); `CROP_H=2000` for a whole tab, `CROP_W=1180 CROP_H=820` an iPad on its side.
4. **His replies mid-round** are notes: log them, answer open readings with a picture and one question, carry on. "NOW" at the start of a message means it changes the step in hand.
5. **The push**, only on his word ("push"): the full `npm test`, the docs written once for the whole batch (changelog, decisions, build list, rules, canon), one version bump, `tools/release.sh`. Start `npm test` in the background while he reviews: it is ready when he says push.
6. **End of session: archive the screens** (R36). **Screenshots are not in the repo** (R36, 21 Oct 2026): no `archive/screens/`, no old pictures anywhere in a clone or container — don't look for them. They are on Okay's Mac only, `~/Desktop/dial-maker/screenshots/`, reachable when the session is linked to his Mac; if it isn't, ask him for the picture. Collected through the session: `okay/` — what he sent through the chat (`/root/.claude/uploads/<session>/`) and the pictures from his notes doc, named `time-#item-word`; `claude/` — the crops of `web/test/crops/`, named `time-version-what`; `claude/tests-<version>/` — `web/test/out/*.png` of the last full run. Filed into the Mac folder `~/Desktop/dial-maker/screenshots/<date>/` with a `README.md` table (what each shows, his words), never into the repo. Not linked to his Mac: one zip to him in the chat. After a step's release, its frame of the progression strip: `cd web && node test/progression.mjs 4.92 4.92 <folder>` and the two pictures and `index.html` into the Mac folder's `progression/` (R36).
7. **Report at the end** what made the session faster or slower, with numbers, under §1.

What was measured on 19 Oct 2026 (4.88.2 → 4.89): `npm run small` 120–140 s, the full `npm test` about 6 minutes, a preview publish a few seconds; a round (build, check, publish, crops) about 10 minutes of which the check is 2.

## 5 · Handing over again

When the context runs long, or Okay asks:

1. Finish the push in progress, or commit it as work in progress and say so. Never hand over with `dev` dirty.
2. Rewrite §1: the state, what's next, any open readings, Okay's last words; date it. Add to §4 whatever you learnt about working with him.
3. Commit and push `dev`.
4. Tell Okay to start a new session on `duztman/dial-tool`, branch `dev`, with this message:

> Taking over the Dial Tool. Read `docs/handoff.md`, then what CLAUDE.md lists. Run `tools/setup.sh` and `npm test`. Then tell me in five lines where things stand and what you'll do next, and wait for my go.
