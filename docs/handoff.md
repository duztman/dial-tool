# Handoff — taking over the Dial Tool

*Written 16 Oct 2026, night, at beta 4.46.5, by the session that built 4.42–4.46.5 (Okay: "devise way to handoff to another agent"); §1 rewritten 18 Oct 2026 at beta 4.52 by the session that read notes 2 (before: 17 Oct at 4.51.1 and 4.49.1). For the next Claude session on this repo. §1 is rewritten at every handover; the rest changes when something new is learnt.*

A new session starts with no memory of the last one: the transcript stays in the old container. Everything a successor needs is in the repo. Use this page to find it.

## 1 · Where things stand (18 Oct 2026, evening)

- **Beta 4.52** is committed on `dev` in the 18 Oct session's clone; **if `origin/dev` still says 4.51.1, it was never pushed** — the session's permission check refused push access. The live page is 4.51.1; **`main` is 4.46.5**.
- **4.52** = Okay's *Dial tool notes 2* (a Google Doc with 23 pictures; his Photoshop drawings `font-selector_171026`, `selected-ring_181026` and `svg/controller 2.svg` in his Mac's `dial-maker/`), written down as **build list #316–#359**, each ranked *now · next · mechanism · later*. The *now* ones are built (the controller's second drawing, his link as the opener, Copy link for WebKit, Blank face, Complication, the Show tick, the Guides list's bottom section, the zoom area and two-finger moving, G for guides, the Gallery card, tags, the showcase's arrow and ✕, the icon archive). Changelog 4.52 lists them.
- **Next, in order** (the build list's ranks): the font box after his PSD (#334 with #318–#321, #317's number blocks) · the selected ring after his PSD (#335, #327) · Positions after his drawing (#357) · W × H linked (#358) · Complication as tabs (#328) · then the mechanisms (#326 after a picture, #338, #349, #346) · the later ones need his eye.
- **Waiting for Okay** (brief §5, 15–23): what "Jev" is; five languages; the blank face's hands; Tiny Preview's calibration; which button Showcase goes left of; what "stopped counting" means on the ruler; renaming *Copy style of*; a disc hand's window inside its disc (R31: new scheme or new key); what "ascender" means for upright numerals (a picture).
- **The eye pass** on 4.51.1's drawn-from-words items (18 Oct): #251, #253, #254, #273, #275, #276 are overtaken by notes 2; #255, #258, #259 and the Gallery picks (#287) were sent to him with pictures — no answer yet.
- **Okay's last words** (18 Oct): "Give me the eye pass first, in the meantime start working on small things." Earlier the same day he planned a two-hour run alone ("say go … you'll do all that you can without asking me") — not started; the plan is the build list's ranks.

## 2 · First steps in a new session

1. `bash tools/setup.sh`: the system library, the Python packages, the two test fonts, `npm install`, and the clone's fetch widened to every branch (a session's clone is shallow, so single-branch; without that `release.sh` builds the live page on a stale `gh-pages` — found 17 Oct). Safe to run twice.
2. Read what CLAUDE.md lists, in its order. Two places hold the recent work:
   - the last ~25 rows of `docs/brief.md` §4;
   - the build list's rows #249–#315 with the phases above them.
3. `git log --oneline -15 dev` and `docs/versions.md`'s top rows confirm where things stand.
4. `cd web && npm test > some.log 2>&1` (about 6 minutes). See it pass before changing anything, and look at `web/test/out/`.

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
   - `docs/brief.md` §4: a row after the last one.
   - `docs/build-list.md`: the item's status, as "done — 4.x.y (…)".
   - The glossary and rules if a word or a rule changed.
6. **Bump** in three places:
   - `VERSION` in `web/src/geometry.js`;
   - README line 8;
   - CLAUDE.md's *Web version* line.

   Run `node build.mjs`, then make one commit on `dev`: "beta X: first line", with the attribution trailers your session gives you.

   Numbering: a small push counts in the third number (4.46.5 → 4.46.6); a phase counts in the second (4.47).
7. **Release:**
   - `tools/release.sh X "first line"` adds the row in `docs/versions.md`, pushes `dev` and copies the build to the live page.
   - When Okay asks for a release, `tools/release.sh main` (fast-forward only).
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
- **The bigger picture.** He says he dives into details and loses it; flag it when you see it. Tonight's case: `main` was 53 versions behind `dev`.
- **His notes mid-work are notes, not stops** (17 Oct): "if new chats come in that means I'm just putting down notes, not to do now in this session. Report later. Go ahead." Put them in the build list under the phase they belong to and carry on.
- **Minimal input, push through** (17 Oct): "I trust you to push through … Check back with approved fittings before proposing new views. Old stuff trumps what you don't get from my instructions, distances centerings all under rule." So: reuse a fitting he has passed (a menu beside a label, the gripper's measures, the tab look) before drawing anything new; when a reading is open, take the smaller one and say it.
- **No access → give it up early** and put it under brief §5 (17 Oct: "Quit stuff early like no access and put them under open questions"). His Mac and `try/shadows` are the two so far.
- **Long jobs in parallel** (17 Oct: "Long processes may happen, do other things in parallel"): run `npm test` in the background and read or write docs meanwhile; a subagent fetched the 21 fonts while 4.46.6 was built.
- **Don'ts:**
  - Never bring up `try/shadows` again.
  - Don't commit his notes or PDFs as files: quote them into the docs.
  - Don't change the bar's monospace unasked.
  - Don't rebuild the guide unasked.
  - Don't edit `archive/drawbot/`.
- **"p. N" in the build list** is a page of his PDF *Notes on dial app* (21 pages, on his Google Drive; readable through a Google Drive connector if the session has one). The row's text is the full reading. Ask him for the page if it isn't enough.

## 5 · Handing over again

When the context runs long, or Okay asks:

1. Finish the push in progress, or commit it as work in progress and say so. Never hand over with `dev` dirty.
2. Rewrite §1: the state, what's next, any open readings, Okay's last words; date it. Add to §4 whatever you learnt about working with him.
3. Commit and push `dev`.
4. Tell Okay to start a new session on `duztman/dial-tool`, branch `dev`, with this message:

> Taking over the Dial Tool. Read `docs/handoff.md`, then what CLAUDE.md lists. Run `tools/setup.sh` and `npm test`. Then tell me in five lines where things stand and what you'll do next, and wait for my go.
