# Working with Okay

What the rules and the glossary don't say about how the work goes with him. Read before the first round of a session; add a line when you learn one (dated, his words). The loop of a push is in `CLAUDE.md`; where things stand is `handoff.md` §1.

## 1 · How he works

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
- **"Question mode" means multiple choice** (Okay, 24 Oct 2026: "I mean multiple choice when i say question mode, sorry I thought we established that"): ask with AskUserQuestion, one to four questions a round, the recommended option first, each with a line of what it leads to. Draw a small diagram in the reply when a choice is about a look ("Lets speak through simple diagrams before building. Just draw something in your answer").
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

## 2 · The sketch loop

Okay, 19 Oct 2026: "an agile way of seeing sketches alive and approving … I preview but can't see for real for a while, when my thoughts are collected we do one cycle to review and finesse few rounds then push". The loop:

1. **Start of session.** Say the model. Then trigger every permission at once, before anything else, and tell him to choose "always allow": push to `duztman/dial-tool` (`add_repo` with push), his Mac's `~/Desktop/dial-maker` (folder access), Google Drive (his notes doc), publishing the preview page. Starting should be simple.
2. **His notes doc** (Google Doc *Dial tool notes*, on his Drive; notes 1 → 3 so far): read it whole at the start. He adds a dated heading per round; read what is under the newest one. Its pictures: export the doc as PDF and `pdfimages` the pages (`read_file_content` shows only "[image]"). Log every new note in the build list under a section of its own before building.
3. **Sketch rounds.** One round = a few notes built → `npm run small` (about 2 minutes) → a WIP commit on `dev` (no docs, no version bump) → the build published to the **private preview page** (the Artifact *Dial Tool*, the same link every round: copy `web/dial-tool.html` to a fixed scratch path and publish that path) → **crops of only what changed**, before/after when there is a before, with the values used, sent to him in the chat. Crops: `node test/crop.mjs web/test/crops/x.png <tab> <selector> [setup.js]`; a setup that returns a value prints it (measure with it, R21); `CROP_H=2000` for a whole tab, `CROP_W=1180 CROP_H=820` an iPad on its side.
4. **His replies mid-round** are notes: log them, answer open readings with a picture and one question, carry on. "NOW" at the start of a message means it changes the step in hand.
5. **The push**, only on his word ("push"): the full `npm test`, the docs written once for the whole batch (changelog, decisions, build list, rules, canon), one version bump, `tools/release.sh`. Start `npm test` in the background while he reviews: it is ready when he says push.
6. **End of session: archive the screens** (R36). **Screenshots are not in the repo** (R36, 21 Oct 2026): no `archive/screens/`, no old pictures anywhere in a clone or container — don't look for them. They are on Okay's Mac only, `~/Desktop/dial-maker/screenshots/`, reachable when the session is linked to his Mac; if it isn't, ask him for the picture. Collected through the session: `okay/` — what he sent through the chat (`/root/.claude/uploads/<session>/`) and the pictures from his notes doc, named `time-#item-word`; `claude/` — the crops of `web/test/crops/`, named `time-version-what`; `claude/tests-<version>/` — `web/test/out/*.png` of the last full run. Filed into the Mac folder `~/Desktop/dial-maker/screenshots/<date>/` with a `README.md` table (what each shows, his words), never into the repo. Not linked to his Mac: one zip to him in the chat. After a step's release, its frame of the progression strip: `cd web && node test/progression.mjs 4.92 4.92 <folder>` and the two pictures and `index.html` into the Mac folder's `progression/` (R36).
7. **Report at the end** what made the session faster or slower, with numbers, under §1.

What was measured on 25 Oct 2026 (4.94.1): the window test 126 s (47 s of it the sleeps written into it), `npm run small` about 2.5 minutes, the full `npm test` about 3 (the window test plus 25 s: parity 3 s, the icon check 18 s), `same.mjs` 2 minutes (was 4: its three screens run at once and a snapshot reads a property list made once). A round (build, check, publish, crops) about 10 minutes of which the check is 2.5.
